# Doljabi (돌잡이)

바둑·오목 실시간 온라인 대국 서비스. **Rust(Axum + WebSocket) 서버**와 **React 프론트엔드**로 구성되며, 브라우저에서 **KataGo WASM**으로 기보를 AI 분석할 수 있습니다.

- **백엔드**: Rust 워크스페이스 (Axum, Tokio, WebSocket, Protobuf, SQLite, Argon2)
- **프론트엔드**: React 19 + Vite + Tailwind, KataGo WASM(Web Worker) 분석 엔진
- **통신**: REST(OpenAPI) + WebSocket(Protobuf 바이너리)

```
브라우저 ──HTTP/REST──▶ Axum (인증·방 생성·기보 조회)
        ──WebSocket──▶ Room 상태머신 (대국 진행) ─▶ game_core (착수 규칙)
                        │
                        ▼
                      SQLite (users / games)  +  SGF 기보 저장
브라우저 내부 ─▶ KataGo WASM Worker (AI 분석)
```

---

## Rust Source Code Overview

워크스페이스 크레이트를 의존성 기준 낮은 계층 → 높은 계층 순으로 정리했습니다. (`Cargo.toml` workspace members: `doljabiproto`, `game_core`, `game_server`)

### `crates/doljabiproto` — 네트워크 프로토콜 정의

클라이언트·서버가 WebSocket으로 주고받는 Protobuf 메시지 정의. `build.rs`가 `.proto`를 컴파일해 Rust 코드를 생성합니다.

* `doljabiproto/common.proto` - 최상위 통신 봉투. `ServerToClient` / `ClientToServer`와 게임 종류 라우팅(`GameType`: Baduk/Omok), oneof 페이로드 정의.
* `doljabiproto/badukboard.proto` - 비트보드 표현(`BadukBoardState`: 흑/백 u64 배열), 플레이어 시간 정보(메인·피셔·초읽기), 착수/기권/무승부/패스 등 대국 메시지 정의.
* `build.rs` - prost로 `.proto`를 Rust로 컴파일하고 `src/lib.rs` 모듈 선언을 동적으로 생성하는 빌드 스크립트.
* `src/common.rs`, `src/badukboard.rs` - 위 스키마에서 생성된 Rust 메시지 타입.

### `crates/game_core` — 순수 게임 엔진

I/O·네트워크 의존성이 없는 바둑·오목 규칙 엔진.

* `src/game_core.rs` - 루트 모듈. `UserID` 뉴타입과 하위 모듈 구성.
* `src/baduk_board/mod.rs` - 공통 보드 추상화. `BoardType`, `Color`(흑/백/빈칸), `BadukBoard` 비트보드, 좌표 ↔ 인덱스 유틸리티.
* `src/baduk_board/baduk.rs` - 바둑 엔진. `Baduk` 구조체가 돌 연결 추적, 따냄(포획), 패(Ko)·동형반복 판정을 처리.
* `src/baduk_board/omok.rs` - 오목 엔진. `Omok` 구조체가 가로/세로/대각 방향 승리 조건을 검사.

### `crates/game_server` — 온라인 게임 서버

WebSocket 멀티플레이, 방 관리, 인증, 영속화를 담당하는 메인 서버.

* `src/game_server.rs` - 라이브러리 루트. `game_logic` / `network` / `soyul` / `utility` 모듈 구성.

* **바이너리 (`src/bin/`)**
  * `main.rs` - 서버 진입점. Axum Router 조립, OpenAPI 문서 생성, 세션·방·타이머 매니저 초기화, WebSocket·REST 엔드포인트 등록.
  * `migration_rusqlite.rs` - DB 스키마 초기화/마이그레이션. `users`, `games` 테이블과 인덱스 생성.
  * `debug_page_template.rs` - Swagger UI 디버깅용 경량 테스트 서버(:27099).

* **`game_logic/` — 대국 상태 머신**
  * `mod.rs` - 게임 오케스트레이션. `RoomChannels`(mpsc 입력 / broadcast 출력), 입장 코드 관리, `GameLogic` 트레이트, `SystemEvent`(타이머·입장·퇴장·종료), `InputMessage`.
  * `timer.rs` - 서버 전역 타이머. `ServerTimer` 우선순위 큐가 만료 이벤트를 방으로 전달(초읽기·시간승 처리).
  * `baduk_board/mod.rs` - 게임 공통 글루. game_core ↔ protobuf 색상 변환, SGF 결과 포맷, 타임아웃 이벤트 코드.
  * `baduk_board/baduk_room.rs` - 바둑 멀티플레이 방. `BadukRoom` 상태 머신: 착수 검증, 시간 관리, 기권/무승부/패스, 종료 시 SGF 기록·레이팅 갱신.
  * `baduk_board/omok_room.rs` - 오목 멀티플레이 방. `OmokRoom` 상태 머신: 오목 승리 판정 + 동일한 시간/레이팅/기록 처리.

* **`network/` — WebSocket & HTTP**
  * `socket.rs` - WebSocket 엔드포인트(`/ws/room/{enter_code}/session/{session_key}`). 연결 업그레이드, 세션 검증, 방 입장, Protobuf 양방향 중계.
  * `check_session_key.rs` - `x-session-key` 헤더를 검증하는 Axum 익스트랙터.

* **`soyul/` — 인증·영속화·기보**

  사용자 인증 및 대국 영속화 모듈. 로그인/가입(Argon2), 세션 관리, 기보(SGF) 저장, 프로필·전적 조회를 담당.

  * `session.rs` - 인메모리 세션 저장소. `SessionStore`(Arc&lt;RwLock&lt;HashMap&gt;&gt;), 무작위 base64 세션 키 발급·조회·삭제.
  * `soyul_login.rs` - 회원 가입·로그인 엔드포인트. Argon2 비밀번호 해싱/검증, 프로필 조회, 승/패/무 전적 갱신.
  * `soyul_db.rs` - `games` 테이블 스키마 및 쿼리(흑/백 ID, 게임 종류, 판 크기, 결과, SGF, 생성 시각).
  * `game_record.rs` - 기보 조회 REST API(`/api/games/{id}/sgf`, 사용자 대국 목록).
  * `kibo.rs` - SGF 빌더. `SgfGame`가 수순·메타데이터를 모아 표준 SGF 문자열로 출력.
  * `gamehistory_db.rs` - 구버전 DB 유틸리티(레거시).

* **`utility/` — 관리자 도구**
  * `admin_page.rs` - OpenAPI 문서 엔드포인트(`/api/admin/openapi/openapi.json`, Swagger UI 페이지).

---

## Web Source Code Overview

React 19 + Vite + Tailwind 프론트엔드. (`web/` 디렉터리)

### 진입점 & 설정

* `index.html` - HTML 진입점. `#root`에 React 앱 마운트.
* `src/main.jsx` - React 루트 렌더러. React Query `QueryClientProvider` 설정.
* `src/App.jsx` - 메인 컨트롤러. SPA 페이지 라우팅, 세션 복원, 사용자 상태·모달 관리.
* `vite.config.js` - Vite 설정. React Compiler, dev 프록시(→ :27000), SharedArrayBuffer용 COOP/COEP 헤더.
* `orval.config.ts` - openapi.json에서 React Query 훅·타입을 생성(→ `api/`).
* `eslint.config.js`, `tailwind.config.js`, `postcss.config.js` - 린트, Tailwind(Material Design 3 테마), PostCSS 설정.

### `src/components/` — 화면 컴포넌트

* `HomeHub.jsx` - 랜딩 페이지. 단일/멀티 대국·AI 분석 진입, 사용자 전적 표시.
* `GameLobby.jsx` - 방 생성 폼. 게임 종류·모드·판 크기·시간 설정.
* `GameWaiting.jsx` - 방 생성 후 대기 화면. 입장 코드 표시, 상대 접속 대기.
* `GamePlay.jsx` - 실시간 대국 화면. 보드·수순·시계 + WebSocket 동기화.
* `GoBoard.jsx` - 캔버스 보드 렌더러. 격자·돌·수순 번호·화점·영역 히트맵 묘사.
* `AiAnalysis.jsx` - KataGo 분석 리플레이 UI. 게임 트리 탐색, 후보 수·평가 색상 표시.
* `SideNav.jsx` - 좌측 반응형 내비게이션.
* `LoginModal.jsx`, `SignUpModal.jsx` - 로그인·회원가입 모달.
* `SettingsProfile.jsx` - 설정 페이지. 비밀번호 변경, 계정 삭제.
* `ErrorBoundary.jsx` - 렌더 오류 포착 폴백 UI.

### `src/katago/` — KataGo WASM AI 분석

KataGo 엔진을 Web Worker로 감싸 백그라운드 신경망 분석을 수행하고, 수순별 결과를 캐싱해 UI에 스트리밍합니다.

* `katago.js` / `katago.wasm` - Emscripten 글루 코드 / KataGo 분석 엔진 바이너리.
* `katagoWorker.js` - Worker 진입점. SAB 링버퍼 stdin/stdout 설정, WASM 부팅, 가중치 IndexedDB 영속화, 분석 루프.
* `sabWriter.js` - SharedArrayBuffer 링버퍼 writer. 메인 스레드 → Worker 무잠금(atomic) 쿼리 전송.
* `useKataGo.js` - Worker 생명주기 관리·요청 큐·결과 캐싱 React 훅.
* `evalColor.js` - 착점 손실 점수 → katrain 색상 팔레트 매핑.
* `historyToMoves.js` - doljabi 좌표 ↔ KataGo GTP 형식 변환.
* `katago-schema/` - 분석 쿼리(`query.js`)·응답(`response.js`) 타입, 직렬화(`convert.js`), 기본값 빌더(`builder.js`) 등 JSON 프로토콜 코덱.

### `src/api/` — REST 클라이언트 (orval 자동 생성)

OpenAPI 명세에서 생성된 React Query 훅 계층.

* `axios-instance.ts` - Axios 설정. localStorage 세션 키 관리, 인증 헤더, 401 처리.
* `endpoints/{auth,user,game,default,openapi}/` - API 태그별 훅(로그인, 프로필, 방 생성·기보 조회 등).
* `model/` - OpenAPI 스키마에서 생성된 TypeScript DTO 정의.

### `src/utils/`, `src/ts-proto/`, `public/`

* `utils/gameTree.js` - 분기·리플레이용 경량 게임 트리(노드별 수·부모·자식·분석 결과).
* `utils/goRules.js` - 따냄 규칙 엔진. 수순 재생 + 활로 그룹 탐색(오목은 단순화).
* `utils/sgf.js` - SGF 파서/라이터. 수순 ↔ SGF 변환, 파일 다운로드.
* `ts-proto/common.ts`, `ts-proto/badukboard.ts` - Protobuf 생성 타입. WebSocket 게임 상태/메시지(`GameType`, `Color`, `ClientToServer`, `ServerToClient`).
* `public/analysis.cfg` - KataGo WASM 엔진 설정(최대 방문 수, 스레드, 신경망 캐시).
* `public/icons.svg` - 파비콘·아이콘 스프라이트.

---

## Build & Run

* **서버**: `cargo run --bin main` (워크스페이스 루트)
* **DB 초기화**: `cargo run --bin migration_rusqlite`
* **프론트엔드 빌드**: `web/`에서 `vite build`
* **API/Proto 코드 생성**: `npm run gen:orval`, `npm run gen:ts-proto`
