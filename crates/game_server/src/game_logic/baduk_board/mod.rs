pub mod baduk_room;
pub mod omok_room;

pub fn convert_game2proto_color(
    color: game_core::baduk_board::Color,
) -> doljabiproto::badukboard::Color {
    use doljabiproto::badukboard::Color as ProtoColor;
    use game_core::baduk_board::Color as GameColor;

    match color {
        GameColor::Black => ProtoColor::Black,
        GameColor::White => ProtoColor::White,
        GameColor::Free => ProtoColor::Free,
        GameColor::ColorError => ProtoColor::Error,
    }
}

/*
    /* 폐기 예정
    loop {
        tokio::select! {
            Some(data) = mpsc_rx.recv() => {
                #[cfg(debug_assertions)]
                println!("데이터 수신!");
                let response: ServerToClient = match data {
                    RoomCommunicationDataForm::Request(input_data) => {
                        let (room_response, response) = game.input_data(input_data);

                        match room_response {
                            GameRoomResponse::None => {},
                            GameRoomResponse::GameStart => {
                                running = true;
                                // 게임 시작 시 타이머 설정
                                let duration = game.set_timer();
                                game_timer.as_mut().reset(tokio::time::Instant::now() + (duration));
                                timer_active = true;
                                // 게임 시작 응답을 모든 클라이언트에게 전송
                                let _ = broadcast_tx.send(Arc::new(response.clone()));
                            },
                            GameRoomResponse::GameOver => {
                                // 게임 종료 응답을 모든 클라이언트에게 전송
                                let _ = broadcast_tx.send(Arc::new(response.clone()));

                                #[cfg(debug_assertions)]
                                println!("📤 게임 종료 응답 브로드캐스트 완료");
                                break;
                            },
                            GameRoomResponse::ChangeTurn => {
                                // 턴 변경 시 타이머 재설정
                                if running && timer_active {
                                    let duration = game.set_timer();
                                    game_timer.as_mut().reset(tokio::time::Instant::now() + duration);
                                }
                                // 착수 응답을 모든 클라이언트에게 전송
                                let _ = broadcast_tx.send(Arc::new(response.clone()));
                            },
                        }

                        response
              },

                RoomCommunicationDataForm::UserEnter(user_id) => {
                        if let Some(handle) = disconnected_users.remove(&user_id) {
                            handle.abort();
                        }

                        if game.push_user(user_id) {
                            ServerToClient {
                                response_type: true,
                                turn: doljabiproto::badukboard::Color::Free as i32,
                                the_winner: None,
                                game_state: None,
                                users_info: Some(game.users_info()),
                                payload: None,
                            }
                        } else {
                            ServerToClient {
                                response_type: false,
                                turn: doljabiproto::badukboard::Color::Free as i32,
                                the_winner: None,
                                game_state: None,
                                users_info: None,
                                payload: None,
                            }
                        }
                    },

                    RoomCommunicationDataForm::UserDisconnect(user_id) => {
                        use doljabiproto::badukboard::{client_to_server_request::Payload, ResignRequest};
                        if running {
                            // 게임 시작 후 > 60초 타이머 시작
                            let tx_clone = mpsc_tx.clone();
                            let disconnected_user_task = tokio::spawn(async move{
                                tokio::time::sleep(Duration::from_secs(60)).await;
                                let _ = tx_clone.send(
                                    RoomCommunicationDataForm::Request((
                                        user_id,
                                        ClientToServer{
                                            session_key: "".to_string(),
                                            payload: Some(Payload::Resign(ResignRequest{})),
                                        }
                                    )
                                )).await;
                            });
                            disconnected_users.insert(user_id, disconnected_user_task);
                            continue;
                        } else {
                            // 게임 시작 전 > 방 나가기
                            game.pop_user(user_id);
                            if game.check_empty_room() {break;}
                            ServerToClient {
                                response_type: true,
                                turn: doljabiproto::badukboard::Color::Free as i32,
                                the_winner: None,
                                game_state: None,
                                users_info: Some(game.users_info()),
                                payload: None,
                            }
                        }
                    }
                };

                let _ = broadcast_tx.send(Arc::new(response));
            }

            _ = &mut game_timer, if running && timer_active => {
                // 타이머 만료 처리
                let (room_response, response) = game.timer_interrupt();

         match room_response {
                    GameRoomResponse::None => {
                        // 타이머가 계속 동작해야 하는 경우 (시간 감소만)
                        let duration = game.set_timer();
                        game_timer.as_mut().reset(tokio::time::Instant::now() + duration);
                        let _ = broadcast_tx.send(Arc::new(response.clone()));
                    },
                    GameRoomResponse::GameOver => {
                        // 시간 초과로 게임 종료
                        let duration = game.set_timer();
                        game_timer.as_mut().reset(tokio::time::Instant::now() + duration);

                        let _ = broadcast_tx.send(Arc::new(response.clone()));
                        break;
                    },
                    _ => {
                        let _ = broadcast_tx.send(Arc::new(response.clone()));
                        break;
                    }
                }
            }

            _ = &mut empty_room_timeout, if game.check_empty_room() => {
                //#[cfg(debug_assertions)]
                println!("{} 빈 방 삭제", enter_code.as_u16());
                break;
            }
        }
    }
    */
*/
