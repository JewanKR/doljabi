# TODO / Roadmap

## 레이팅(Rating) 기능 추가

대국 결과에 따라 플레이어 실력 점수를 변동시키는 기능.

- 현황: `users` 테이블에 `rating` 컬럼은 존재하나 점수 변동 로직 미구현
  (`soyul_login.rs`는 승/패/무 횟수만 갱신).
- [ ] 레이팅 산정 알고리즘 선정 (Elo / Glicko-2 등)
- [ ] 대국 종료 시 양쪽 레이팅 변동 적용 (`baduk_room.rs` / `omok_room.rs` 게임 종료 처리부)
- [ ] 대국 시작 시점 레이팅 스냅샷 기록 (구 `gamehistory_db.rs`의 `*_rating_before` 개념 참고)
- [ ] 프로필·홈 화면에 레이팅 노출 (`SettingsProfile.jsx`, `HomeHub.jsx`)
