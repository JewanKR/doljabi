# 어플리케이션 서버 상태 관리 설계

이 문서는 웹 바둑 서버의 어플리케이션 서버(Rust)에서 사용자 및 게임 상태를 효율적으로 관리하기 위한 설계 아이디어를 정리합니다.

## 1. 핵심 아이디어: 중앙 상태 관리

서버의 모든 실시간 정보는 하나의 중앙 `AppState` 구조체에서 관리됩니다. 이 구조체는 현재 접속 중인 모든 사용자의 세션 정보와 생성된 게임 방 정보를 `HashMap`으로 저장하여 빠르고 효율적인 조회를 가능하게 합니다.

- **DB**: 영구적으로 보관해야 할 데이터(유저 계정, 게임 기보 등)의 최종 저장소.
- **메모리 (AppState)**: 현재 활성화된 세션과 게임을 위한 빠른 작업 공간 (캐시).

## 2. 핵심 데이터 구조 정의

서버의 상태를 관리하기 위해 다음과 같은 구조체를 사용합니다.

```rust
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tokio::sync::mpsc::UnboundedSender; // 메시지 전송 채널 예시

// DB에 영구 저장되는 유저 정보
struct User {
    id: u32,
    username: String,
    // ... elo_rating, etc.
}

// 현재 서버에 '연결된' 사용자의 세션 정보 (메모리에만 존재)
struct UserSession {
    user_id: u32, // DB의 User.id와 연결되는 키
    room_id: u32, // 0이면 로비, 0보다 크면 해당 방 ID
    sender: UnboundedSender<Message>, // 이 사용자에게만 메시지를 보낼 수 있는 통로
}

// 게임 방 정보 (메모리에 존재)
struct GameRoom {
    id: u32,
    players: Vec<u32>, // 참가한 사용자의 user_id 목록
    spectators: Vec<u32>, // 관전자의 user_id 목록
    game_state: GameState, // 게임 상태 (대기중, 진행중, 종료)
    baduk_logic: baduk::Game, // 실제 바둑 로직 인스턴스
}

// 게임의 현재 상태
enum GameState {
    WaitingForPlayers,
    InProgress,
    Finished,
}

// 서버의 모든 상태를 담는 중앙 구조체
struct AppState {
    // key: user_id, value: UserSession
    sessions: HashMap<u32, UserSession>,
    // key: room_id, value: GameRoom
    rooms: HashMap<u32, GameRoom>,
}
```

## 3. 사용자 상태별 구현 아이디어

### 3.1. 방에 접속하지 않은 사람 (대기실 / Lobby)

- **정의**: 서버에 연결은 되었지만, 특정 게임 방에는 들어가지 않은 상태.
- **구현**:
    1. 사용자가 로그인에 성공하면, `UserSession` 인스턴스를 생성합니다.
    2. `UserSession`의 `room_id`를 `0`으로 설정하여 '로비' 상태임을 명시합니다.
    3. 생성된 세션을 `AppState.sessions` 해시맵에 추가합니다.
    4. 서버는 이 사용자에게 방 목록 등 로비 정보를 전송할 수 있습니다.

### 3.2. 방에 접속한 사람 (In Room)

- **정의**: 특정 방에 참가했지만, 아직 게임이 시작되지 않은 상태.
- **구현**:
    1. 사용자가 특정 `room_id`에 참가를 요청합니다.
    2. **(중요)** 아래의 두 작업이 모두 수행되어야 합니다.
        - `AppState.rooms`에서 해당 `room_id`의 `GameRoom`을 찾아 `players` 목록에 `user_id`를 추가합니다.
        - `AppState.sessions`에서 해당 `user_id`의 `UserSession`을 찾아 `room_id`를 참가한 방의 ID로 업데이트합니다.
    3. 해당 방의 모든 클라이언트에게 새로운 유저의 입장을 알립니다.

### 3.3. 게임을 진행 중인 사람 (Playing)

- **정의**: 방에 필요한 인원이 모두 모여 게임이 시작된 상태.
- **구현**:
    1. 방장이 '게임 시작'을 요청하거나, 인원이 충족되어 자동으로 시작됩니다.
    2. 서버는 해당 `GameRoom`의 `game_state`를 `GameState::InProgress`로 변경합니다.
    3. 이 상태의 방에 속한 유저들만 '착수'와 같은 게임 관련 요청을 보낼 수 있으며, 서버는 이 요청을 `baduk_logic` 인스턴스에 전달하여 처리합니다.

## 4. 구현 전략: 양방향 저장 방식

사용자 상태와 방 상태를 효율적으로 조회하기 위해 **양방향 저장 방식**을 사용합니다.

- **`UserSession`**은 자신이 속한 `room_id`를 가집니다.
- **`GameRoom`**은 자신에게 속한 `user_id` 목록을 가집니다.

### 장점

- **빠른 조회**: 특정 유저가 어느 방에 있는지, 특정 방에 누가 있는지를 O(1) 시간 복잡도로 매우 빠르게 조회할 수 있습니다.
- **직관성**: 데이터 관계가 현실 세계와 유사하여 코드를 이해하기 쉽습니다.

### 단점 및 주의사항: 데이터 정합성

데이터가 두 곳에 중복으로 저장되므로, 상태 변경 시 **데이터 정합성**을 유지하는 것이 매우 중요합니다. 한쪽의 정보만 업데이트하고 다른 쪽은 누락하면 심각한 버그로 이어질 수 있습니다.

이를 방지하기 위해, 상태 변경 로직을 아래와 같이 하나의 함수로 캡슐화하여 사용하는 것을 강력히 권장합니다.

```rust
// AppState의 메서드로 구현하여 정합성을 보장
impl AppState {
    // 유저를 방에 참가시키는 함수
    fn join_room(&mut self, user_id: u32, room_id: u32) -> Result<(), &str> {
        let room = self.rooms.get_mut(&room_id).ok_or("Room not found")?;
        let session = self.sessions.get_mut(&user_id).ok_or("User not found")?;

        // 1. 방에 유저 추가
        room.players.push(user_id);
        // 2. 유저의 상태 변경
        session.room_id = room_id;

        Ok(())
    }

    // 유저가 방에서 나가는 함수
    fn leave_room(&mut self, user_id: u32) -> Result<(), &str> {
        let session = self.sessions.get_mut(&user_id).ok_or("User not found")?;
        if session.room_id == 0 {
            return Err("User is already in the lobby");
        }

        let room = self.rooms.get_mut(&session.room_id).ok_or("Room not found")?;
        
        // 1. 방에서 유저 제거
        room.players.retain(|&id| id != user_id);
        // 2. 유저의 상태 변경
        session.room_id = 0; // 로비로 상태 변경

        Ok(())
    }
}
```
