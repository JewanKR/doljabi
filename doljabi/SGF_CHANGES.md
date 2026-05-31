# SGF 저장/조회 기능 — 변경된 파일 목록

이 문서는 SGF 저장 기능을 추가하면서 새로 만들거나 수정한 파일을 정리한 것입니다. 프론트엔드(JS/React)와 백엔드(Rust/Axum) 양쪽에 걸쳐 있습니다.

---

## 프론트엔드 (web/)

### 신규 파일

| 경로 | 설명 |
| --- | --- |
| `web/sgf-test.html` | 백엔드 없이 SGF 저장/파싱을 검증할 수 있는 독립 테스트 페이지. 19×19 보드, 메타데이터 폼, 라운드트립 검증 UI. `http://localhost:5173/sgf-test.html`로 접속. |
| `web/src/api/games.js` | 사용자 과거 대국 기록 조회 API 모듈. `useMyGames(sessionKey)` 훅과 `fetchGameDetail(sessionKey, id)` 함수. 자동 생성되는 `user.ts`와 분리해서 orval 재생성 시 충돌 방지. |

### 수정 파일

| 경로 | 변경 요약 |
| --- | --- |
| `web/src/utils/sgf.js` | 기존 최소 구현(`historyToSgf`, `downloadSgf`)을 SGF FF[4] 명세에 맞춰 전면 확장. `buildSgf(history, options)`, `parseSgf(sgf)`, `saveHistoryAsSgf`, `defaultSgfFilename`, `formatResult`, `formatSgfDate` 등 추가. 패스(`B[]`/`W[]`), `]`·`\` 이스케이프, 한글 UTF-8, 결과(`B+R`/`W+T`/`B+5.5`/`0`) 포맷, 사전 배석(`AB`/`AW`) 지원. 기존 시그니처는 호환 유지. |
| `web/src/components/GamePlay.jsx` | 게임 종료 시 `onSaveHistory`가 history 배열만 보내던 것을 `{history, gameType, winner, endedByDraw, blackName, whiteName, initialBlackSec, initialWhiteSec, endedAt}` 객체로 확장. |
| `web/src/App.jsx` | `gameHistory` state(배열) → `gameData` state(객체)로 변경. `AiAnalysis`에 `gameData` prop 추가 전달. |
| `web/src/components/AiAnalysis.jsx` | 내부 WASM 렌더링은 기존 `historyToSgf` 유지. 다운로드 버튼만 `buildSgf` + `defaultSgfFilename`으로 교체해 대국자/날짜/결과 포함한 완전한 SGF 저장. 파일명도 `game_YYYY-MM-DD_Black-vs-White.sgf` 형태. |
| `web/src/components/SettingsProfile.jsx` | 전적 분석 카드 다음에 **"내 대국 기록"** 섹션 추가. `useMyGames`로 목록 조회 → 로딩/에러/빈 상태 처리 → 각 대국 옆 SGF 다운로드 버튼. 클릭 시 `fetchGameDetail` → `buildSgf` → 자동 다운로드. |

---

## 백엔드 (crates/game_server/)

### 신규 파일

| 경로 | 설명 |
| --- | --- |
| `crates/game_server/src/soyul/game_history_api.rs` | 게임 기록 조회 HTTP 라우터. 두 엔드포인트 제공: `GET /api/user/games/session/{key}` (내 대국 목록), `GET /api/user/games/{id}/session/{key}` (단건 + 수순). 세션 인증 + 권한 체크(흑/백 본인만 조회). utoipa 스키마 포함. |

### 수정 파일

| 경로 | 변경 요약 |
| --- | --- |
| `crates/game_server/src/soyul/gamehistory_db.rs` | 깨진 `crate::geme_old::badukboard::Color` import 제거하고 `game_core::baduk_board::Color`로 교체. 스키마에 `game_type` / `moves_json` / `move_count` 컬럼 추가 (기존 DB도 ALTER로 보강). `record_finished_game_with_moves`, `list_games_for_user`, `get_game_detail_for_user` 함수 + utoipa 응답 스키마(`GameSummary`, `GameDetail`, `GameListResponse`, `GameDetailResponse`, `MoveRecord`) 추가. Unix time → ISO-8601 변환 헬퍼 포함. |
| `crates/game_server/src/soyul/mod.rs` | `gamehistory_db`, `game_history_api` 모듈 등록 (`pub mod ...`). |
| `crates/game_server/src/bin/main.rs` | 서버 부팅 시 `create_game_history_table_if_not_exists` 호출해 테이블 자동 생성. `game_history_router`를 router_list에 merge. |
| `crates/game_server/src/game_logic/baduk_board/baduk_room.rs` | `BadukRoom`에 `game_id` / `started_at` / `move_history` / `history_saved` 필드 추가. `game_start`에서 시작 시각 기록, 착수 성공 시 `push_move`, 첫 패스/두 번째 패스 모두 `push_pass`, `record_winner` 마지막에 `save_to_history_db` 호출(멱등 가드 있음). |
| `crates/game_server/src/game_logic/baduk_board/omok_room.rs` | 동일 패턴 적용 (15×15 보드, pass_turn 로직 없는 것 외엔 baduk_room과 동일). |

---

## 신규 엔드포인트 (백엔드)

| Method | Path | 응답 | 비고 |
| --- | --- | --- | --- |
| GET | `/api/user/games/session/{session_key}` | `{ success, games: GameSummary[] }` | 본인이 흑/백으로 참여한 게임 최신순 200건 |
| GET | `/api/user/games/{game_id}/session/{session_key}` | `{ success, game: GameDetail }` | 본인이 참여한 게임만, 수순(history) 포함 |

### 응답 타입

```ts
type GameSummary = {
  id: string,           // DB의 game_id (12자 URL-safe Base64)
  game_type: 'go' | 'omok',
  black_name: string,
  white_name: string,
  result: string,       // 'B+' / 'W+' / '0' (현재는 method 정보 없음)
  played_at: string,    // ISO-8601 UTC
  move_count: number,
};

type GameDetail = GameSummary & {
  history: Array<{
    col: number,        // 0-based, 패스면 -1
    row: number,        // 0-based, 패스면 -1
    color: 'black' | 'white',
    pass?: boolean,
  }>,
};
```

---

## 데이터 흐름

```
[게임 진행 중]
  GamePlay.jsx ─── WebSocket ───▶ baduk_room.rs::send(Coordinate)
                                     │
                                     ├─ self.push_move(turn, coord)  ← move_history에 누적
                                     └─ chaksu 처리

[게임 종료 시점]
  baduk_room.rs::record_winner(color)
        │
        ├─ record_game_win/lose/draw  (기존: users 테이블 카운트)
        └─ save_to_history_db(color)  (신규)
              │
              └─ record_finished_game_with_moves(conn, ...moves)
                    │
                    └─ INSERT INTO game_history (...)

[AI 분석 페이지에서 다운로드]
  AiAnalysis.jsx::handleDownload
        │
        └─ buildSgf(history, { blackName, whiteName, result, ... })
              │
              └─ downloadSgf(sgf, defaultSgfFilename(...))

[사용자 페이지에서 다운로드]
  SettingsProfile.jsx
        │
        ├─ useMyGames(sessionKey)
        │     └─ GET /api/user/games/session/{key}  ───▶ game_history_api.rs::get_my_games
        │                                                     └─ list_games_for_user(conn, user_id)
        │
        └─ handleDownloadGame(game)
              ├─ GET /api/user/games/{id}/session/{key}  ───▶ get_my_game_detail
              │                                                     └─ get_game_detail_for_user(conn, user_id, game_id)
              └─ buildSgf(detail.history, { ...meta }) → downloadSgf
```

---

## 검증

| 항목 | 결과 |
| --- | --- |
| `web/src/utils/sgf.js` 라운드트립 (Node) | ✅ buildSgf → parseSgf 좌표/메타데이터 보존, 한글 UTF-8, `]` 이스케이프 통과 |
| 수정된 JSX/JS 6개 파일 구문 검증 (acorn-jsx) | ✅ 전부 통과 |
| `sgf-test.html` 인라인 스크립트 구문 검증 | ✅ 통과 |
| `gamehistory_db.rs` 단위 테스트 (insert/list/detail/권한 체크) | 작성됨 — 사용자 PC에서 `cargo test -p game_server` 로 실행 필요 |
| Rust 백엔드 전체 컴파일 | ⚠ 샌드박스에 cargo 없어서 미검증. 사용자 PC에서 `cargo check -p game_server` 권장 |

---

## 알려진 제한 / 향후 개선

- **레이팅 BR/WR**: 현재 "변동 전" 값을 캐싱하지 않고 게임 종료 시점에 조회. 정확한 시작 시점 레이팅을 기록하려면 `game_start`에서 캐싱 코드 추가 필요. (주석으로 표시됨)
- **결과 method**: 현재 `RE`는 `B+` / `W+` / `0`만. method(R/T/F)를 구분하려면 `record_winner` 시그니처를 `(color, method)`로 확장하고 호출 5곳을 업데이트해야 함.
- **저장 누락 케이스**: 서버 강제 종료나 모든 유저가 동시에 leave 하는 경로에서는 `record_winner`가 호출되지 않아 저장 안 됨. 기존 win/lose 카운트와 같은 한계.
- **백엔드 컴파일 미검증**: 변수명/타입 매칭이 실제 컴파일러 관점에서 미세하게 어긋날 가능성이 있음. 사용자 PC에서 `cargo check` 후 에러 발생 시 알려주면 보정 가능.
