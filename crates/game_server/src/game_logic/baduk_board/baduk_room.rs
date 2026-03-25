use crate::game_logic::{
    GameLogic, UserID,
    baduk_board::{color_i32, timeout_event::*},
    timer::GameInterrupter,
};
use doljabiproto::{
    badukboard::BadukBoardServer,
    common::{ClientToServer, ServerToClient, server_to_client::GameData},
};
use game_core::baduk_board::{BadukBoardGameConfig, Color, Players, baduk::Baduk};
use std::{
    sync::{Arc, atomic::AtomicU16},
    time::Duration,
};

const GAME_TYPE_BADUK: i32 = doljabiproto::common::GameType::Baduk as i32;

pub struct BadukRoom {
    game: Baduk,
    game_config: BadukBoardGameConfig,
    players: Players,
    pass_turn: bool,
    interrupter: GameInterrupter,
    timeout_event: Arc<AtomicU16>,
}
impl BadukRoom {
    pub fn new(game_config: BadukBoardGameConfig, game_event_manager: GameInterrupter) -> Self {
        let timeout_event = game_event_manager.register(Duration::from_secs(30), BRACK_GAME);
        Self {
            game: Baduk::new(),
            game_config: game_config,
            players: Players::new(),
            pass_turn: false,
            interrupter: game_event_manager,
            timeout_event: timeout_event,
        }
    }

    pub fn turn_user_id(&self) -> Option<UserID> {
        let color = self.game.board.is_turn();
        self.players.user_id(color)
    }

    pub fn set_players_time(&mut self, config: &BadukBoardGameConfig) -> bool {
        if !self.players.full_players() {
            return false;
        }
        self.players.set_players(&config);

        true
    }

    pub fn baduk_board_state(&self) -> doljabiproto::badukboard::BadukBoardState {
        doljabiproto::badukboard::BadukBoardState {
            black: self.game.board.bitboard_black().to_vec(),
            white: self.game.board.bitboard_white().to_vec(),
        }
    }

    pub fn user_info(&self, color: Color) -> Option<doljabiproto::badukboard::UserInfo> {
        use crate::soyul::soyul_login::get_user_profile_by_id;
        use rusqlite::Connection;

        let conn = match Connection::open("mydb.db") {
            Ok(conn) => conn,
            Err(e) => {
                eprintln!("game_user_info 출력 에러: DB 불러오기 실패: {}", e);
                return None;
            }
        };

        match color {
            Color::Black => {
                if let Some(player) = &self.players.black_player {
                    if let Ok(Some(user_profile)) = get_user_profile_by_id(&conn, player.user_id())
                    {
                        Some(user_profile.convert_session2proto())
                    } else {
                        eprintln!("user_info: 존재하지 않는 유저 정보!");
                        None
                    }
                } else {
                    None
                }
            }
            Color::White => {
                if let Some(player) = &self.players.white_player {
                    if let Ok(Some(user_profile)) = get_user_profile_by_id(&conn, player.user_id())
                    {
                        Some(user_profile.convert_session2proto())
                    } else {
                        eprintln!("user_info: 존재하지 않는 유저 정보!");
                        None
                    }
                } else {
                    None
                }
            }
            _ => None,
        }
    }

    fn users_info(&self) -> doljabiproto::badukboard::UsersInfo {
        doljabiproto::badukboard::UsersInfo {
            black: self.user_info(Color::Black),
            white: self.user_info(Color::White),
        }
    }

    fn user_io(&self, result: bool) -> ServerToClient {
        let running = if result { Some(false) } else { None };
        ServerToClient {
            response_type: result,
            running: running,
            game_type: GAME_TYPE_BADUK,
            game_data: Some(GameData::Baduk(BadukBoardServer {
                turn: doljabiproto::badukboard::Color::Free as i32,
                the_winner: None,
                game_state: None,
                users_info: Some(self.users_info()),
                payload: None,
            })),
        }
    }

    pub fn black_player_time_info(&self) -> doljabiproto::badukboard::PlayerTimeInfo {
        use doljabiproto::badukboard::PlayerTimeInfo;

        let player_state = match self.players.black_player_state() {
            Some(player) => player.output(),
            None => BadukBoardGameConfig::empty().output(),
        };

        PlayerTimeInfo {
            main_time: player_state.0,
            fischer_time: player_state.1,
            remaining_overtime: player_state.2 as u32,
            overtime: player_state.3,
        }
    }

    pub fn white_player_time_info(&self) -> doljabiproto::badukboard::PlayerTimeInfo {
        use doljabiproto::badukboard::PlayerTimeInfo;

        let player_state = match self.players.white_player_state() {
            Some(player) => player.output(),
            None => BadukBoardGameConfig::empty().output(),
        };

        PlayerTimeInfo {
            main_time: player_state.0,
            fischer_time: player_state.1,
            remaining_overtime: player_state.2 as u32,
            overtime: player_state.3,
        }
    }

    pub fn badukboard_status(&self) -> doljabiproto::badukboard::BadukBoardData {
        doljabiproto::badukboard::BadukBoardData {
            board: Some(self.baduk_board_state()),
            black_time: Some(self.black_player_time_info()),
            white_time: Some(self.white_player_time_info()),
        }
    }

    pub fn record_winner(&mut self, color: Color) {
        use crate::soyul::soyul_login::{record_game_draw, record_game_lose, record_game_win};

        let black_player_id = self
            .players
            .black_player
            .as_ref()
            .map(|bp| bp.user_id())
            .unwrap_or(UserID(u64::MAX));
        let white_player_id = self
            .players
            .white_player
            .as_ref()
            .map(|wp| wp.user_id())
            .unwrap_or(UserID(u64::MAX));

        match color {
            Color::Black => {
                let _ = record_game_win(black_player_id);
                let _ = record_game_lose(white_player_id);
            }
            Color::White => {
                let _ = record_game_lose(black_player_id);
                let _ = record_game_win(white_player_id);
            }
            Color::Free => {
                let _ = record_game_draw(black_player_id);
                let _ = record_game_draw(white_player_id);
            }
            _ => {}
        }
    }

    fn set_timer_time(&mut self) -> tokio::time::Duration {
        use tokio::time::Duration;
        let turn_player = self.players.turn_player(self.game.board.is_turn());

        match turn_player {
            Some(p) => {
                if p.main_time() > 0 {
                    Duration::from_millis(p.main_time())
                } else if p.remain_time() > 0 {
                    Duration::from_millis(p.overtime())
                } else {
                    self.game.set_winner(self.game.board.is_turn().reverse());
                    self.interrupter.game_closer();
                    Duration::from_secs(86400)
                }
            }
            None => {
                self.interrupter.game_closer();
                Duration::from_secs(86400)
            }
        }
    }

    fn set_timer(&mut self, event: u16) {
        let duration = self.set_timer_time();
        let drop_timer = std::mem::replace(
            &mut self.timeout_event,
            self.interrupter.register(duration, event),
        );
        drop_timer.store(0, std::sync::atomic::Ordering::Relaxed);
    }

    fn game_start(&mut self) -> ServerToClient {
        self.set_players_time(&self.game_config.clone());
        self.set_timer(PLAYER_TIMEOUT);

        ServerToClient {
            response_type: true,
            running: Some(true),
            game_type: GAME_TYPE_BADUK,
            game_data: Some(GameData::Baduk(BadukBoardServer {
                turn: color_i32(self.game.board.is_turn()),
                the_winner: None,
                game_state: Some(self.badukboard_status()),
                users_info: Some(self.users_info()),
                payload: None,
            })),
        }
    }
}

impl GameLogic for BadukRoom {
    fn enter_user(&mut self, user_id: UserID) -> ServerToClient {
        use std::sync::atomic::Ordering::Relaxed;
        let result = self.players.push_user(user_id);
        match self.timeout_event.load(Relaxed) {
            1 => self.timeout_event.store(NONE, Relaxed),
            _ => {}
        }
        self.user_io(result)
    }

    fn leave_user(&mut self, user_id: UserID) -> ServerToClient {
        let result = self.players.pop_user(user_id);
        if self.players.check_empty_room() {
            #[cfg(debug_assertions)]
            println!("빈 방 제거 요청 보내기");
            self.interrupter.game_closer();
        }
        self.user_io(result)
    }

    fn timer_interrupt(&mut self, event: u16) -> ServerToClient {
        let error_response = ServerToClient {
            response_type: false,
            running: None,
            game_type: GAME_TYPE_BADUK,
            game_data: None,
        };

        match event {
            BRACK_GAME => {
                self.interrupter.game_closer();
                error_response
            }
            PLAYER_TIMEOUT => {
                let turn_player = self.players.turn_player_mut(self.game.board.is_turn());
                let is_turn = color_i32(self.game.board.is_turn());

                match turn_player {
                    Some(p) => {
                        if p.main_time() > 0 {
                            p.sub_main_time();
                            self.set_timer(PLAYER_TIMEOUT);

                            ServerToClient {
                                response_type: true,
                                running: Some(true),
                                game_type: GAME_TYPE_BADUK,
                                game_data: Some(GameData::Baduk(BadukBoardServer {
                                    turn: is_turn,
                                    the_winner: None,
                                    game_state: Some(self.badukboard_status()),
                                    users_info: None,
                                    payload: None,
                                })),
                            }
                        } else if p.remain_time() > 1 {
                            p.sub_remain_overtime();
                            self.set_timer(PLAYER_TIMEOUT);

                            ServerToClient {
                                response_type: true,
                                running: Some(true),
                                game_type: GAME_TYPE_BADUK,
                                game_data: Some(GameData::Baduk(BadukBoardServer {
                                    turn: is_turn,
                                    the_winner: None,
                                    game_state: Some(self.badukboard_status()),
                                    users_info: None,
                                    payload: None,
                                })),
                            }
                        } else {
                            self.game.set_winner(self.game.board.is_turn().reverse());
                            self.record_winner(self.game.board.is_turn().reverse());
                            self.interrupter.game_closer();

                            ServerToClient {
                                response_type: true,
                                running: Some(false),
                                game_type: GAME_TYPE_BADUK,
                                game_data: Some(GameData::Baduk(BadukBoardServer {
                                    turn: is_turn,
                                    the_winner: self.game.winner().map(|w| color_i32(w.clone())),
                                    game_state: Some(self.badukboard_status()),
                                    users_info: None,
                                    payload: None,
                                })),
                            }
                        }
                    }
                    None => ServerToClient {
                        response_type: false,
                        running: None,
                        game_type: GAME_TYPE_BADUK,
                        game_data: Some(GameData::Baduk(BadukBoardServer {
                            turn: color_i32(self.game.board.is_turn()),
                            game_state: None,
                            users_info: None,
                            the_winner: None,
                            payload: None,
                        })),
                    },
                }
            }
            _ => error_response,
        }
    }

    fn send(&mut self, user_id: UserID, message: ClientToServer) -> ServerToClient {
        use doljabiproto::badukboard::baduk_board_client::Payload as PayloadForClient;
        use doljabiproto::badukboard::baduk_board_server::Payload;
        use doljabiproto::common::client_to_server::GameData as GameDataForClient;

        let mut response = ServerToClient {
            response_type: false,
            running: None,
            game_type: GAME_TYPE_BADUK,
            game_data: None,
        };

        if let Some(GameDataForClient::Baduk(message)) = message.game_data {
            match message.payload {
                Some(PayloadForClient::Coordinate(chaksu_request)) => {
                    use doljabiproto::badukboard::ChaksuResponse;
                    let turn = self.game.is_board().is_turn();

                    #[cfg(debug_assertions)]
                    println!(
                        "🎯 착수 요청: user_id={}, coordinate={}, 현재 턴={:?}",
                        user_id, chaksu_request.coordinate, turn
                    );

                    // 착수를 시도하는 사람의 턴인지 확인
                    let player_color = self.players.check_id_to_color(user_id);
                    #[cfg(debug_assertions)]
                    println!("플레이어 색상: {:?}, 현재 턴: {:?}", player_color, turn);

                    if player_color != turn {
                        #[cfg(debug_assertions)]
                        println!("❌ 차례가 아닙니다!");
                        return response;
                    }

                    // 착수 시도
                    let success = match self.game.chaksu(chaksu_request.coordinate as u16) {
                        Ok(_) => {
                            self.pass_turn = false;
                            self.players
                                .switch_turn(self.game.board.is_turn().reverse());

                            self.set_timer(PLAYER_TIMEOUT);

                            #[cfg(debug_assertions)]
                            println!("✅ 착수 성공! 턴 변경됨");
                            true
                        }
                        Err(_e) => {
                            #[cfg(debug_assertions)]
                            match _e {
                                game_core::baduk_board::BadukBoardError::BannedChaksu => {
                                    println!("⛔ 착수 실패: 금수!");
                                }
                                game_core::baduk_board::BadukBoardError::OverLap => {
                                    println!("❌ 착수 실패: 이미 돌이 있음");
                                }
                                _ => {
                                    println!("❌ 착수 실패: {:?}", _e);
                                }
                            }
                            false
                        }
                    };

                    let the_winner = match self.game.winner() {
                        Some(color) => {
                            self.record_winner(color);
                            self.interrupter.game_closer();
                            Some(color_i32(color))
                        }
                        None => None,
                    };

                    response = ServerToClient {
                        response_type: true,
                        running: Some(true),
                        game_type: GAME_TYPE_BADUK,
                        game_data: Some(GameData::Baduk(BadukBoardServer {
                            turn: color_i32(self.game.is_board().is_turn()),
                            the_winner: the_winner,
                            game_state: Some(self.badukboard_status()),
                            users_info: None,
                            payload: Some(Payload::Coordinate(ChaksuResponse { success: success })),
                        })),
                    }
                }

                // 기권 처리
                Some(PayloadForClient::Resign(_resign_request)) => {
                    use doljabiproto::badukboard::ResignResponse;

                    let winner = self.players.check_id_to_color(user_id).reverse();
                    self.game.set_winner(winner);
                    self.record_winner(winner);
                    self.interrupter.game_closer();

                    response = ServerToClient {
                        response_type: true,
                        running: Some(true),
                        game_type: GAME_TYPE_BADUK,
                        game_data: Some(GameData::Baduk(BadukBoardServer {
                            turn: color_i32(self.game.is_board().is_turn()),
                            the_winner: Some(color_i32(winner)),
                            game_state: Some(self.badukboard_status()),
                            users_info: None,
                            payload: Some(Payload::Resign(ResignResponse {})),
                        })),
                    }
                }

                // 무승부 신청
                Some(PayloadForClient::DrawOffer(_draw_request)) => {
                    use doljabiproto::badukboard::DrawOfferResponse;
                    let mut winner = None;
                    let offer_player = self.players.check_id_to_color(user_id);

                    match &offer_player {
                        Color::Black => {
                            self.players.black_player.as_mut().map(|p| p.draw_offer());
                        }
                        Color::White => {
                            self.players.white_player.as_mut().map(|p| p.draw_offer());
                        }
                        _ => {}
                    }

                    // 둘 다 무승부 요청을 하면 비김
                    if self.players.check_draw() {
                        self.game.set_winner(Color::Free);
                        self.record_winner(Color::Free);
                        winner = Some(color_i32(Color::Free));
                        self.interrupter.game_closer();
                    }

                    let draw_offer_response = DrawOfferResponse {
                        user_name: format!("{} player", offer_player.to_string()),
                    };

                    response = ServerToClient {
                        response_type: true,
                        running: Some(true),
                        game_type: GAME_TYPE_BADUK,
                        game_data: Some(GameData::Baduk(BadukBoardServer {
                            turn: color_i32(self.game.is_board().is_turn()),
                            the_winner: winner,
                            game_state: Some(self.badukboard_status()),
                            users_info: None,
                            payload: Some(Payload::DrawOffer(draw_offer_response)),
                        })),
                    }
                }

                // 턴 넘김
                Some(PayloadForClient::PassTurn(_pass_request)) => {
                    use doljabiproto::badukboard::PassTurnResponse;
                    let turn = self.game.is_board().is_turn();

                    // 턴 넘김을 시도하는 사람의 턴인지 확인
                    if self.players.check_id_to_color(user_id) != turn {
                        #[cfg(debug_assertions)]
                        println!(
                            "무승부 신청 유저 색 {:?}\n현제 턴 {:?}",
                            self.players.check_id_to_color(user_id),
                            turn
                        );

                        return response;
                    }

                    if self.pass_turn {
                        let determined_winner = self.game.determine_winner();
                        self.game.set_winner(determined_winner);
                        self.record_winner(determined_winner);
                        self.interrupter.game_closer();

                        response = ServerToClient {
                            response_type: true,
                            running: Some(true),
                            game_type: GAME_TYPE_BADUK,
                            game_data: Some(GameData::Baduk(BadukBoardServer {
                                turn: color_i32(self.game.is_board().is_turn()) as i32,
                                the_winner: Some(color_i32(determined_winner)),
                                game_state: Some(self.badukboard_status()),
                                users_info: None,
                                payload: Some(Payload::PassTurn(PassTurnResponse {})),
                            })),
                        };

                        return response;
                    } else {
                        self.pass_turn = true;
                    }

                    // turn 변경
                    self.players.switch_turn(turn);
                    self.game.board.switch_turn();

                    self.set_timer(PLAYER_TIMEOUT);

                    response = ServerToClient {
                        response_type: true,
                        running: None,
                        game_type: GAME_TYPE_BADUK,
                        game_data: Some(GameData::Baduk(BadukBoardServer {
                            turn: color_i32(self.game.is_board().is_turn()),
                            the_winner: None,
                            game_state: Some(self.badukboard_status()),
                            users_info: None,
                            payload: Some(Payload::PassTurn(PassTurnResponse {})),
                        })),
                    };
                }

                Some(PayloadForClient::Gamestart(_)) => {
                    if self.players.full_players() {
                        response = self.game_start();
                    }
                }

                _ => {}
            }
        }
        response
    }
}
