import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ClientToServerRequest,
  ServerToClientResponse,
  GameState,
  Color
} from '../../../ts-proto/badukboard';
import { SessionManager } from '../../../api/axios-instance';
import { loadRoomConfig } from './enter-room-config';
import {
  startAutoVoice,
  stopAutoVoice,
  updateVoiceCallback,
} from '../../../voice_control/autoVoiceHandler';
import { parseVoiceToCoordinate } from './voice-utils';

interface Player {
  nickname: string;
  rating: number | string;
  color: 'black' | 'white';
  mainTime: number;
  byoyomiTime: number;
  byoyomiCount: number;
}

export default function OmokGameRoom() {
  const navigate = useNavigate();

  // useState를 사용하여 한 번만 로드
  const [roomData] = useState(() => {
    const config = loadRoomConfig();
    console.log('🎮 방 설정 로드:', config);
    return config;
  });

  const enterCode = roomData?.enter_code;
  const sessionKey = roomData?.session_key || SessionManager.getSessionKey();
  const roomCode = enterCode ? String(enterCode) : 'UNKNOWN';
  const isHost = roomData?.isHost ?? true;
  
  const [boardSize] = useState(15);
  const [board, setBoard] = useState<(null | 'black' | 'white')[][]>(
    Array(boardSize)
      .fill(null)
      .map(() => Array(boardSize).fill(null))
  );

  const [gameStarted, setGameStarted] = useState(false);
  const [currentTurn, setCurrentTurn] = useState<'black' | 'white'>('black');
  const [selectedPosition, setSelectedPosition] = useState<{ row: number; col: number } | null>(null);
  const [myColor, setMyColor] = useState<'black' | 'white' | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [canStartGame, setCanStartGame] = useState(false);
  const [lastHeard, setLastHeard] = useState<string>(''); // 🎙️ 음성 인식 텍스트
  const wsRef = useRef<WebSocket | null>(null);

  const [players, setPlayers] = useState<{ black: Player; white: Player }>({
    black: {
      nickname: '---',
      rating: '---' as any,
      color: 'black',
      mainTime: 0,
      byoyomiTime: 30000,
      byoyomiCount: 3,
    },
    white: {
      nickname: '---',
      rating: '---' as any,
      color: 'white',
      mainTime: 0,
      byoyomiTime: 30000,
      byoyomiCount: 3,
    },
  });

  const [initialTime] = useState({ black: 1800000, white: 1800000 });
  const [isInByoyomi, setIsInByoyomi] = useState({ black: false, white: false });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // 비트보드를 2D 배열로 변환하는 유틸리티 함수
  const bitboardToBoardArray = (
    blackBitboard: bigint[] | null | undefined,
    whiteBitboard: bigint[] | null | undefined,
    boardSize: number = 15
  ): (null | 'black' | 'white')[][] => {
    const board: (null | 'black' | 'white')[][] = Array(boardSize)
      .fill(null)
      .map(() => Array(boardSize).fill(null));

    // black 비트보드 처리
    if (blackBitboard && Array.isArray(blackBitboard)) {
      blackBitboard.forEach((bits, arrayIndex) => {
        for (let bitIndex = 0; bitIndex < 64; bitIndex++) {
          if ((bits & (1n << BigInt(bitIndex))) !== 0n) {
            const coordinate = arrayIndex * 64 + bitIndex;
            if (coordinate < boardSize * boardSize) {
              const row = Math.floor(coordinate / boardSize);
              const col = coordinate % boardSize;
              if (row >= 0 && row < boardSize && col >= 0 && col < boardSize) {
                board[row][col] = 'black';
              }
            }
          }
        }
      });
    }

    // white 비트보드 처리
    if (whiteBitboard && Array.isArray(whiteBitboard)) {
      whiteBitboard.forEach((bits, arrayIndex) => {
        for (let bitIndex = 0; bitIndex < 64; bitIndex++) {
          if ((bits & (1n << BigInt(bitIndex))) !== 0n) {
            const coordinate = arrayIndex * 64 + bitIndex;
            if (coordinate < boardSize * boardSize) {
              const row = Math.floor(coordinate / boardSize);
              const col = coordinate % boardSize;
              if (row >= 0 && row < boardSize && col >= 0 && col < boardSize) {
                board[row][col] = 'white';
              }
            }
          }
        }
      });
    }

    return board;
  };

  // Color enum을 'black' | 'white'로 변환하는 헬퍼 함수
  const colorEnumToString = (color: Color): 'black' | 'white' | 'free' | null => {
    switch (color) {
      case Color.COLOR_BLACK:
        return 'black';
      case Color.COLOR_WHITE:
        return 'white';
      case Color.COLOR_FREE:
        return 'free';
      default:
        return null;
    }
  };

  // GameState를 일관되게 처리하는 공통 함수
  const handleGameState = (gameState: GameState | undefined) => {
    if (!gameState) return;

    // 보드 상태 업데이트
    if (gameState.board) {
      console.log('🎲 Bitboard 데이터:', {
        black: gameState.board.black,
        white: gameState.board.white
      });
      
      try {
        const newBoard = bitboardToBoardArray(
          gameState.board.black,
          gameState.board.white,
          boardSize
        );
        setBoard(newBoard);
      } catch (error) {
        console.error('⚠️ Bitboard 파싱 오류, 보드 업데이트 건너뜀:', error);
      }
    }

    // 시간 정보 업데이트
    if (gameState.blackTime) {
      setPlayers(prev => ({
        ...prev,
        black: {
          ...prev.black,
          mainTime: Number(gameState.blackTime!.mainTime),
          byoyomiTime: Number(gameState.blackTime!.overtime),
          byoyomiCount: gameState.blackTime!.remainingOvertime
        }
      }));
    }

    if (gameState.whiteTime) {
      setPlayers(prev => ({
        ...prev,
        white: {
          ...prev.white,
          mainTime: Number(gameState.whiteTime!.mainTime),
          byoyomiTime: Number(gameState.whiteTime!.overtime),
          byoyomiCount: gameState.whiteTime!.remainingOvertime
        }
      }));
    }
  };

  // 타이머 관리 (게임 시작 후에만 작동)
  useEffect(() => {
    if (!gameStarted) return;

    // 클라이언트 타이머 시작
    timerRef.current = setInterval(() => {
      setPlayers(prev => {
        const newPlayers = { ...prev };
        const current = newPlayers[currentTurn];

        if (current.mainTime > 0) {
          current.mainTime -= 1000;
          if (current.mainTime <= 0) {
            current.mainTime = 0;
            setIsInByoyomi(prev => ({ ...prev, [currentTurn]: true }));
          }
        } else if (current.byoyomiTime > 0) {
          current.byoyomiTime -= 1000;
          if (current.byoyomiTime <= 0 && current.byoyomiCount > 0) {
            current.byoyomiCount -= 1;
            current.byoyomiTime = 30000;
          }
        }

        return newPlayers;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentTurn, gameStarted]);

  // WebSocket 연결 및 Protobuf 통신
  useEffect(() => {
    // 이미 연결되어 있으면 중복 연결 방지
    if (wsRef.current) {
      console.log('⚠️ 이미 WebSocket 연결 중');
      return;
    }

    if (!enterCode || !sessionKey) {
      console.error('❌ 방 정보가 없습니다. enter_code:', enterCode, 'session_key:', sessionKey ? '있음' : '없음');
      alert('방 정보가 없습니다. 홈으로 이동합니다.');
      navigate('/');
      return;
    }

    // WebSocket 연결 (바이너리 프로토콜)
    const host = window.location.hostname;
    const wsUrl = `ws://localhost:27000/ws/room/${enterCode}/session/${sessionKey}`;
    console.log('🔌 WebSocket 연결 시도:', wsUrl);
    const ws = new WebSocket(wsUrl);
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('✅ WebSocket 게임방 연결 성공!');
      setIsConnected(true);
      // 자동으로 gamestart를 보내지 않음 - 대기 화면에서 수동으로 시작
    };
    
    // 연결 유지를 위한 ping (8초마다)
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN && !gameStarted) {
        const pingRequest: ClientToServerRequest = {
          sessionKey: sessionKey || '',
        };
        const encoded = ClientToServerRequest.encode(pingRequest).finish();
        ws.send(encoded);
        console.log('📡 Ping 전송');
      }
    }, 8000);
    
    ws.onmessage = (event) => {
      try {
        // 서버 메시지 수신 (protobuf 디코딩)
        const buffer = new Uint8Array(event.data);
        const response = ServerToClientResponse.decode(buffer);
        
        // Ping 응답 무시 (responseType이 false이고 아무 데이터도 없는 경우)
        if (!response.responseType && !response.gameStart && !response.gameState && !response.usersInfo && !response.coordinate && !response.passTurn && !response.resign && !response.drawOffer) {
          console.log('📡 Ping 응답 (무시)');
          return;
        }
        
        console.log('📨 서버 응답:', response);
        console.log('  - responseType:', response.responseType);
        console.log('  - gameStart:', response.gameStart ? '있음' : '없음');
        console.log('  - gameState:', response.gameState ? '있음' : '없음');
        console.log('  - usersInfo:', response.usersInfo ? '있음' : '없음');
        
        // 게임 시작 응답 처리
        if (response.gameStart) {
          console.log('🎮 게임 시작 응답 수신!');
          
          // 게임 시작 시 내 색상 확실히 설정 (우선순위 높음)
          const assignedColor = isHost ? 'black' : 'white';
          setMyColor(assignedColor);
          console.log('🎨 게임 시작! 내 색상:', assignedColor, '방장 여부:', isHost);
          
          setGameStarted(true);
          console.log('✅ 게임 시작됨!');
        }
        
        // 턴 업데이트 (먼저 처리)
        console.log('📥 서버 응답 turn 값:', response.turn, '→', colorEnumToString(response.turn));
        const turnColor = colorEnumToString(response.turn);
        if (turnColor === 'black' || turnColor === 'white') {
          setCurrentTurn(prev => {
            console.log('🔄 턴 업데이트:', prev, '→', turnColor);
            return turnColor;
          });
        }
        
        // 게임 상태 업데이트 (gameStart와 함께 올 수도 있고, 별도로 올 수도 있음)
        if (response.gameState) {
          handleGameState(response.gameState);
          console.log('📊 게임 상태 업데이트 (보드)');
        }
        /* else if (response.responseType === false) {
          // 게임 시작 실패 (responseType이 false이고 gameStart가 undefined)
          alert('게임 시작에 실패했습니다. 플레이어가 부족합니다.');
          console.warn('게임 시작 실패: 플레이어가 부족합니다.');
        }
        */

        // 플레이어 정보 업데이트 (usersInfo 응답 처리)
        if (response.usersInfo) {
          console.log('👥 플레이어 정보 업데이트:', response.usersInfo);
          
          const hasBlack = !!response.usersInfo.black;
          const hasWhite = !!response.usersInfo.white;
          
          // black 플레이어 정보 업데이트
          if (response.usersInfo.black) {
            setPlayers(prev => ({
              ...prev,
              black: {
                ...prev.black,
                nickname: response.usersInfo!.black!.userName || '흑돌',
                rating: response.usersInfo!.black!.rating || 1500,
              }
            }));
          }
          
          // white 플레이어 정보 업데이트
          if (response.usersInfo.white) {
            setPlayers(prev => ({
              ...prev,
              white: {
                ...prev.white,
                nickname: response.usersInfo!.white!.userName || '백돌',
                rating: response.usersInfo!.white!.rating || 1500,
              }
            }));
          }
          
          // 두 플레이어가 모두 있으면 게임 시작 가능
          setCanStartGame(hasBlack && hasWhite);
          console.log('🎮 게임 시작 가능:', hasBlack && hasWhite);
        }

        // 게임 시작 응답에서 usersInfo 처리 (현재는 서버에서 보내지 않지만 준비)
        if (response.usersInfo) {
          // TODO: 서버에서 gameStart.usersInfo를 보내는 경우 처리
          // 현재는 서버에서 usersInfo를 보내지 않지만, 받을 수 있는 구조는 준비됨
          console.log('게임 시작 시 플레이어 정보:', response.usersInfo);
        }
        
        // 착수 응답 처리 (coordinate 응답)
        if (response.coordinate) {
          console.log('🎯 착수 응답 수신, success:', response.coordinate.success);
          if (!response.coordinate.success) {
            // 착수 실패 처리 (흑돌일 때는 금수, 백돌일 때는 일반 오류)
            if (myColor === 'black') {
              alert('⛔ 금수입니다! 이 위치에는 돌을 놓을 수 없습니다.');
              console.warn('⛔ 금수 (흑돌)');
            } else {
              alert('❌ 착수할 수 없습니다. (이미 돌이 있거나 잘못된 위치입니다)');
              console.warn('❌ 착수 실패');
            }
            setSelectedPosition(null); // 선택 위치 초기화
          }
        }
        
        // 수 넘김 응답 처리 (passTurn 응답)
        if (response.passTurn) {
          console.log('⏭️ 패스 응답 수신');
        }
        
        // 무승부 응답 처리
        if (response.drawOffer) {
          const opponentName = response.drawOffer.userName || '상대방';
          console.log('🤝 무승부 신청 수신:', opponentName);
          alert(`${opponentName}님이 무승부를 제안했습니다.`)
        }
        
        // 기권 응답 처리
        if (response.resign) {
          console.log('🏳️ 기권 응답 수신');
          // 기권 시 자동으로 theWinner가 설정됨
        }
        
        // 승자 확인
        if (response.theWinner !== undefined) {
          const winner = colorEnumToString(response.theWinner);
          console.log('🏆 게임 종료, 승자:', winner);
          
          if (winner === 'black' || winner === 'white') {
            const winnerName = players[winner].nickname;
            setTimeout(() => {
              alert(`🏆 ${winnerName}(${winner === 'black' ? '흑돌' : '백돌'})이 승리했습니다!`);
              navigate('/');
            }, 500);
          } else if (winner === 'free') {
            setTimeout(() => {
              alert('🤝 무승부로 게임이 종료되었습니다!');
              navigate('/');
            }, 500);
          }
        }
      } catch (error) {
        console.error('메시지 디코딩 오류:', error);
        // bitboard 값이 너무 커서 발생하는 오류는 무시 (게임 로직에는 영향 없음)
        if (error instanceof Error && error.message.includes('MAX_SAFE_INTEGER')) {
          console.warn('⚠️ Bitboard 디코딩 경고 (무시 가능)');
        }
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket 오류:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket 연결 종료');
    };
    
    // Cleanup
    return () => {
      console.log('🧹 WebSocket 정리');
      clearInterval(pingInterval);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      wsRef.current = null;
    };
  }, []); // 빈 배열 - 마운트 시 한 번만 실행

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getTimePercentage = (currentTime: number, initialTime: number) => {
    return Math.max(0, Math.min(100, (currentTime / initialTime) * 100));
  };

  const getTimeBarColor = (percentage: number) => {
    if (percentage > 50) return '#10b981';
    if (percentage > 20) return '#f59e0b';
    return '#ef4444';
  };

  const handleCellClick = (row: number, col: number) => {
    console.log('🖱️ 바둑판 클릭:', { row, col, gameStarted, isEmpty: board[row][col] === null });
    if (!gameStarted) {
      console.log('⚠️ 게임이 시작되지 않음');
      return;
    }
    if (board[row][col] === null) {
      setSelectedPosition({ row, col });
      console.log('✅ 위치 선택됨:', { row, col });
    } else {
      console.log('⚠️ 이미 돌이 있음');
    }
  };

  const handlePlaceStone = () => {
    console.log('🎯 착수 버튼 클릭!', { gameStarted, currentTurn, myColor, isMyTurn: currentTurn === myColor });
    
    if (!gameStarted) {
      console.log('❌ 게임이 시작되지 않음');
      return;
    }
    
    if (currentTurn !== myColor) {
      console.log('❌ 내 차례가 아님');
      return;
    }

    if (!selectedPosition) {
      console.log('❌ 선택된 위치 없음');
      alert('착수할 위치를 선택해주세요.');
      return;
    }
    
    console.log('✅ 착수 조건 통과, 선택 위치:', selectedPosition);

    const { row, col } = selectedPosition;

    if (board[row][col] !== null) {
      alert('이미 돌이 놓인 위치입니다.');
      return;
    }

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert('서버와 연결되지 않았습니다.');
      return;
    }

    if (!sessionKey) {
      alert('세션 정보가 없습니다.');
      return;
    }

    // 좌표 계산 (0~224)
    const coordinate = row * boardSize + col;

    // 서버로 착수 요청 전송 (Protobuf)
    const chaksuRequest: ClientToServerRequest = {
      sessionKey: sessionKey,
      coordinate: {
        coordinate: coordinate
      }
    };
    const encoded = ClientToServerRequest.encode(chaksuRequest).finish();
    wsRef.current.send(encoded);
    console.log('🎯 착수 전송:', { row, col, coordinate });

    setSelectedPosition(null);
  };

  const handlePass = () => {
    if (!gameStarted || currentTurn !== myColor) return;

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert('서버와 연결되지 않았습니다.');
      return;
    }

    if (!sessionKey) {
      alert('세션 정보가 없습니다.');
      return;
    }

    // 서버로 패스 요청 전송 (Protobuf)
    const passRequest: ClientToServerRequest = {
      sessionKey: sessionKey,
      passTurn: {}
    };
    const encoded = ClientToServerRequest.encode(passRequest).finish();
    wsRef.current.send(encoded);
    console.log('⏭️ 패스 전송');
  };

  const handleResign = () => {
    if (!gameStarted) return;
    
    if (!confirm('정말 기권하시겠습니까?')) return;
    
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !sessionKey) {
      navigate('/');
      return;
    }

    // 서버로 기권 요청 전송
    const resignRequest: ClientToServerRequest = {
      sessionKey: sessionKey,
      resign: {}
    };
    const encoded = ClientToServerRequest.encode(resignRequest).finish();
    wsRef.current.send(encoded);
    console.log('🏳️ 기권 전송');
  };

  const handleDrawRequest = () => {
    if (!gameStarted) return;
    
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN || !sessionKey) {
      alert('서버와 연결되지 않았습니다.');
      return;
    }

    // 서버로 무승부 신청 전송
    const drawRequest: ClientToServerRequest = {
      sessionKey: sessionKey,
      drawOffer: {}
    };
    const encoded = ClientToServerRequest.encode(drawRequest).finish();
    wsRef.current.send(encoded);
    console.log('🤝 무승부 신청 전송');
  };

  const handleStartGame = () => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert('서버와 연결되지 않았습니다.');
      return;
    }

    if (!canStartGame) {
      alert('두 명의 플레이어가 모두 입장해야 게임을 시작할 수 있습니다.');
      return;
    }

    // 게임 시작 요청
    const config = loadRoomConfig();
    const sessionKey = config?.session_key || SessionManager.getSessionKey();
    
    if (!sessionKey) {
      alert('세션 정보가 없습니다.');
      return;
    }

    const gameStartRequest: ClientToServerRequest = {
      sessionKey: sessionKey,
      gamestart: {}
    };
    const encoded = ClientToServerRequest.encode(gameStartRequest).finish();
    wsRef.current.send(encoded);
    console.log('🎮 게임 시작 요청 전송');
  };

  /* ============================================================================================
     🎙 음성 인식 핸들러
  ============================================================================================ */

  const handleVoiceText = useCallback(
    (text: string) => {
      console.log('🎙 음성 텍스트:', text);
      setLastHeard(text);

      const lower = text.toLowerCase();
      const compactLower = lower.replace(/\s+/g, ''); // 공백 제거 버전

      // 0) 착수
      if (lower.includes('착수')) {
        console.log('🟢 음성 명령: 착수');

        if (!selectedPosition) {
          console.log('❌ 선택된 좌표가 없어서 착수 명령을 무시합니다.');
          return;
        }

        if (currentTurn !== myColor) {
          console.log('❌ 내 차례가 아니라 착수 명령을 무시합니다.');
          return;
        }

        handlePlaceStone();
        return;
      }

      // 1) 기권 (기권, 포기, 기건)
      if (
        compactLower.includes('기권') ||
        compactLower.includes('기건') || // 오인식
        lower.includes('포기')
      ) {
        console.log('🟢 음성 명령: 기권');
        handleResign();
        return;
      }

      // 2) 무승부 (무승부, 무슨부, 무슨부 신청)
      if (
        compactLower.includes('무승부') ||
        compactLower.includes('무슨부') // 오인식들 전부 커버
      ) {
        console.log('🟢 음성 명령: 무승부 신청');
        handleDrawRequest();
        return;
      }

      // 3) 수 넘김 (수 넘김, 수넘김, 넘김, 패스, 순환김, 수넝김)
      if (
        lower.includes('수 넘김') ||
        compactLower.includes('수넘김') ||
        compactLower.includes('넘김') ||
        compactLower.includes('패스') ||
        compactLower.includes('순환김') || // 오인식
        compactLower.includes('수넝김')    // 오인식
      ) {
        console.log('🟢 음성 명령: 수 넘김');
        handlePass();
        return;
      }

      // 4) 좌표 선택
      if (currentTurn !== myColor) {
        console.log('내 차례가 아니라서 좌표 선택 음성은 무시합니다.');
        return;
      }

      const parsed = parseVoiceToCoordinate(text, boardSize);
      if (!parsed) {
        console.log('❌ 좌표 해석 실패 (행/열 패턴이나 A4 패턴 아님):', text);
        return;
      }

      const { row, col, serverCoordinate } = parsed;
      const rowIndex = row - 1;
      const colIndex = col - 1;

      if (board[rowIndex][colIndex] !== null) {
        console.log(`❌ 이미 돌이 있는 위치입니다: ${row}행 ${col}열`);
        return;
      }

      setSelectedPosition({ row: rowIndex, col: colIndex });

      console.log(
        `🟡 좌표 선택: ${row}행 ${col}열 → 서버 좌표 ${serverCoordinate} (착수는 '착수'라고 말할 때 확정)`
      );
    },
    [
      board,
      boardSize,
      currentTurn,
      myColor,
      selectedPosition,
      handlePlaceStone,
      handlePass,
      handleResign,
      handleDrawRequest,
    ]
  );

  /* ==================== 음성 인식 시작 / 정리 ==================== */
  useEffect(() => {
    if (!gameStarted) return;
    
    startAutoVoice(handleVoiceText);

    return () => {
      stopAutoVoice();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameStarted]);

  useEffect(() => {
    if (!gameStarted) return;
    updateVoiceCallback(handleVoiceText);
  }, [handleVoiceText, gameStarted]);

  // 디버깅 로그
  useEffect(() => {
    console.log('🎨 현재 상태:', {
      myColor,
      currentTurn,
      isMyTurn: myColor === currentTurn,
      gameStarted,
      isHost
    });
  }, [myColor, currentTurn, gameStarted]);

  const isMyTurn = myColor ? currentTurn === myColor : false;
  const myPlayer = myColor ? players[myColor] : players.black;
  const opponentColor = myColor === 'black' ? 'white' : myColor === 'white' ? 'black' : 'white';
  const opponentPlayer = players[opponentColor];

  const isMyColor = myColor === 'black' ? 'black' : myColor === 'white' ? 'white' : 'black'

  const myTimePercentage = myColor ? getTimePercentage(myPlayer.mainTime, initialTime[myColor]) : 0;
  const opponentTimePercentage = getTimePercentage(opponentPlayer.mainTime, initialTime[opponentColor]);

  // 게임 시작 전 대기 화면
  if (!gameStarted) {
    return (
      <div className="min-h-screen text-white p-8" style={{ backgroundColor: '#0b0c10' }}>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: '#e8eaf0' }}>
              대기실
            </h1>
            <p style={{ color: '#9aa1ad' }}>
              {isConnected 
                ? '서버와 연결됨 - 플레이어를 기다리는 중...' 
                : '서버와 연결 중...'}
            </p>
          </div>

          {/* 방 코드 표시 */}
          <div className="rounded-xl p-6 border mb-6"
               style={{
                 backgroundColor: 'rgba(22,22,28,0.6)',
                 borderColor: '#2a2a33',
               }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm mb-1" style={{ color: '#9aa1ad' }}>
                  방 입장 코드
                </div>
                <div className="text-2xl font-bold tracking-wider" style={{ color: '#e8eaf0' }}>
                  {roomCode}
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(roomCode);
                  alert('방 코드가 복사되었습니다!');
                }}
                className="px-6 py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-2 border"
                style={{
                  backgroundColor: '#141822',
                  borderColor: '#2a2a33',
                  color: '#e8eaf0',
                }}>
                <span>복사</span>
              </button>
            </div>
          </div>

          {/* 플레이어 정보 */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* 흑돌 */}
            <div className="rounded-xl p-6 border"
                 style={{
                   backgroundColor: 'rgba(22,22,28,0.6)',
                   borderColor: players.black.nickname !== '---' ? '#22c55e' : '#2a2a33',
                 }}>
              <div className="text-center">
                <div className="text-lg font-semibold mb-2" style={{ color: '#e8eaf0' }}>
                  {players.black.nickname}
                </div>
                {typeof players.black.rating === 'number' && (
                  <div className="text-sm mb-2" style={{ color: '#9aa1ad' }}>
                    레이팅: {players.black.rating}
                  </div>
                )}
                <div className="text-sm" style={{ color: '#9aa1ad' }}>흑돌</div>
              </div>
            </div>

            {/* 백돌 */}
            <div className="rounded-xl p-6 border"
                 style={{
                   backgroundColor: 'rgba(22,22,28,0.6)',
                   borderColor: players.white.nickname !== '---' ? '#22c55e' : '#2a2a33',
                 }}>
              <div className="text-center">
                <div className="text-lg font-semibold mb-2" style={{ color: '#e8eaf0' }}>
                  {players.white.nickname}
                </div>
                {typeof players.white.rating === 'number' && (
                  <div className="text-sm mb-2" style={{ color: '#9aa1ad' }}>
                    레이팅: {players.white.rating}
                  </div>
                )}
                <div className="text-sm" style={{ color: '#9aa1ad' }}>백돌</div>
              </div>
            </div>
          </div>

          {/* 연결 상태 */}
          <div className="rounded-xl p-4 border mb-6 text-center"
               style={{
                 backgroundColor: 'rgba(22,22,28,0.6)',
                 borderColor: isConnected ? '#22c55e' : '#ef4444',
               }}>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 rounded-full"
                   style={{ backgroundColor: isConnected ? '#22c55e' : '#ef4444' }} />
              <span style={{ color: '#e8eaf0' }}>
                {isConnected ? '서버 연결됨' : '서버 연결 중...'}
              </span>
            </div>
          </div>

          {/* 버튼 */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleStartGame}
              disabled={!canStartGame || !isConnected}
              className="py-4 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap text-white"
              style={{
                background: canStartGame && isConnected
                  ? 'linear-gradient(180deg, #1f6feb, #1b4fd8)'
                  : '#2a2a33',
                boxShadow: canStartGame && isConnected
                  ? '0 2px 8px rgba(0,0,0,0.3)'
                  : 'none',
                opacity: canStartGame && isConnected ? 1 : 0.5,
                cursor: canStartGame && isConnected ? 'pointer' : 'not-allowed',
              }}>
              {canStartGame ? '게임 시작' : '플레이어 대기 중...'}
            </button>
            <button
              onClick={() => navigate('/')}
              className="py-4 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
              }}>
              나가기
            </button>
          </div>

          {/* 안내 */}
          <div className="mt-6 p-4 rounded-lg border text-center"
               style={{
                 backgroundColor: 'rgba(22,22,28,0.4)',
                 borderColor: '#2a2a33',
               }}>
            <p className="text-sm" style={{ color: '#9aa1ad' }}>
              💡 친구에게 방 코드 <strong style={{ color: '#8ab4f8' }}>{roomCode}</strong>를 공유하여 초대하세요!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 게임 시작 후 게임 화면
  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0b0c10' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b" style={{ borderColor: '#2a2a33' }}>
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #1f6feb 0%, #1b4fd8 100%)',
              boxShadow: '0 4px 12px rgba(31, 111, 235, 0.3)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="8" fill="white" opacity="0.9" />
              <circle cx="10" cy="10" r="5" fill="black" opacity="0.8" />
            </svg>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Doljabi
          </h1>
        </div>

        <div className="text-lg font-semibold" style={{ color: '#e8eaf0' }}>
          오목 대국
        </div>

        <div className="text-lg font-bold" style={{ color: '#8ab4f8' }}>
          {roomCode}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-start justify-center min-h-[calc(100vh-72px)] p-6 gap-4">
        {/* 왼쪽: 플레이어 정보 */}
        <div className="w-64 flex flex-col h-[calc(100vh-120px)]">
          {/* 내 정보 */}
          <div
            className={`flex-1 rounded-xl p-4 border mb-2 ${gameStarted && currentTurn === myColor ? 'ring-2 ring-blue-500' : ''}`}
            style={{
              backgroundColor: 'rgba(22,22,28,0.6)',
              borderColor: gameStarted && currentTurn === myColor ? '#1f6feb' : '#2a2a33',
              boxShadow:
                gameStarted && currentTurn === myColor
                  ? '0 0 20px rgba(31, 111, 235, 0.3)'
                  : '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: myColor === 'black' ? '#1a1a1a' : '#f5f5f5',
                  border: '2px solid',
                  borderColor: myColor === 'black' ? '#333' : '#ddd',
                  boxShadow: myColor === 'black' ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 8px rgba(255,255,255,0.3)',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill={myColor === 'black' ? '#000' : '#fff'} />
                  {myColor === 'white' && <circle cx="9" cy="9" r="3" fill="rgba(0,0,0,0.1)" />}
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-bold" style={{ color: '#e8eaf0' }}>
                  {myPlayer.nickname}
                </div>
                <div className="text-sm flex items-center space-x-1">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M6 1L7 4L10 4.5L7.5 6.5L8 9.5L6 8L4 9.5L4.5 6.5L2 4.5L5 4L6 1Z"
                      fill="#f59e0b"
                    />
                  </svg>
                  <span style={{ color: '#9aa1ad' }}>
                    {typeof myPlayer.rating === 'number' ? myPlayer.rating : myPlayer.rating}
                  </span>
                </div>
              </div>
            </div>

            {gameStarted && (
              <>
                <div className="mb-3">
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#141822' }}>
                    <div
                      className="h-full transition-all duration-1000"
                      style={{ width: `${myTimePercentage}%`, backgroundColor: getTimeBarColor(myTimePercentage) }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: '#141822' }}>
                    <span className="text-sm" style={{ color: '#9aa1ad' }}>
                      메인 시간
                    </span>
                    <span
                      className={`font-mono font-bold ${isInByoyomi[isMyColor] ? 'text-red-500' : ''}`}
                      style={{ color: isInByoyomi[isMyColor] ? '#ef4444' : '#e8eaf0' }}
                    >
                      {formatTime(myPlayer.mainTime)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: '#141822' }}>
                    <span className="text-sm" style={{ color: '#9aa1ad' }}>
                      초읽기
                    </span>
                    <span className={`font-mono font-bold ${isInByoyomi[isMyColor] ? 'text-red-500' : ''}`}
                          style={{ color: isInByoyomi[isMyColor] ? '#ef4444' : '#9aa1ad' }}>
                      {formatTime(myPlayer.byoyomiTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: '#141822' }}>
                    <span className="text-sm" style={{ color: '#9aa1ad' }}>
                      남은 횟수
                    </span>
                    <span className={`font-mono font-bold ${isInByoyomi[isMyColor] ? 'text-red-500' : ''}`}
                          style={{ color: isInByoyomi[isMyColor] ? '#ef4444' : '#9aa1ad' }}>
                      {myPlayer.byoyomiCount}회
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 상대방 정보 */}
          <div
            className={`flex-1 rounded-xl p-4 border ${gameStarted && currentTurn === opponentColor ? 'ring-2 ring-blue-500' : ''}`}
            style={{
              backgroundColor: 'rgba(22,22,28,0.6)',
              borderColor: gameStarted && currentTurn === opponentColor ? '#1f6feb' : '#2a2a33',
              boxShadow:
                gameStarted && currentTurn === opponentColor
                  ? '0 0 20px rgba(31, 111, 235, 0.3)'
                  : '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: opponentColor === 'black' ? '#1a1a1a' : '#f5f5f5',
                  border: '2px solid',
                  borderColor: opponentColor === 'black' ? '#333' : '#ddd',
                  boxShadow: opponentColor === 'black' ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 8px rgba(255,255,255,0.3)',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill={opponentColor === 'black' ? '#000' : '#fff'} />
                  {opponentColor === 'white' && <circle cx="9" cy="9" r="3" fill="rgba(0,0,0,0.1)" />}
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-bold" style={{ color: '#e8eaf0' }}>
                  {opponentPlayer.nickname}
                </div>
                <div className="text-sm flex items-center space-x-1">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M6 1L7 4L10 4.5L7.5 6.5L8 9.5L6 8L4 9.5L4.5 6.5L2 4.5L5 4L6 1Z"
                      fill="#f59e0b"
                    />
                  </svg>
                  <span style={{ color: '#9aa1ad' }}>
                    {typeof opponentPlayer.rating === 'number' ? opponentPlayer.rating : opponentPlayer.rating}
                  </span>
                </div>
              </div>
            </div>

            {gameStarted && (
              <>
                <div className="mb-3">
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#141822' }}>
                    <div
                      className="h-full transition-all duration-1000"
                      style={{ width: `${opponentTimePercentage}%`, backgroundColor: getTimeBarColor(opponentTimePercentage) }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: '#141822' }}>
                    <span className="text-sm" style={{ color: '#9aa1ad' }}>
                      메인 시간
                    </span>
                    <span
                      className={`font-mono font-bold ${isInByoyomi[opponentColor] ? 'text-red-500' : ''}`}
                      style={{ color: isInByoyomi[opponentColor] ? '#ef4444' : '#e8eaf0' }}
                    >
                      {formatTime(opponentPlayer.mainTime)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: '#141822' }}>
                    <span className="text-sm" style={{ color: '#9aa1ad' }}>
                      초읽기
                    </span>
                    <span className={`font-mono font-bold ${isInByoyomi[opponentColor] ? 'text-red-500' : ''}`}
                          style={{ color: isInByoyomi[opponentColor] ? '#ef4444' : '#9aa1ad' }}>
                      {formatTime(opponentPlayer.byoyomiTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: '#141822' }}>
                    <span className="text-sm" style={{ color: '#9aa1ad' }}>
                      남은 횟수
                    </span>
                    <span className={`font-mono font-bold ${isInByoyomi[opponentColor] ? 'text-red-500' : ''}`}
                          style={{ color: isInByoyomi[opponentColor] ? '#ef4444' : '#9aa1ad' }}>
                      {opponentPlayer.byoyomiCount}회
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 중앙: 오목판 */}
        <div className="flex-1 max-w-4xl">
          <div
            className="rounded-2xl p-6 border"
            style={{
              backgroundColor: 'rgba(22,22,28,0.6)',
              borderColor: '#2a2a33',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            <div
              className="aspect-square rounded-xl p-8 relative"
              style={{
                background: 'linear-gradient(135deg, #d4a574 0%, #c89968 100%)',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              {/* 좌표 라벨 - 상단 (A, B, C...) */}
              <div className="absolute top-2 left-8 right-8 pointer-events-none">
                {Array.from({ length: boardSize }).map((_, i) => {
                  const cellSize = 100 / (boardSize - 1);
                  const leftPosition = `${i * cellSize}%`;
                  return (
                    <div
                      key={`col-label-${i}`}
                      className="absolute text-xs font-semibold"
                      style={{
                        color: 'rgba(0,0,0,0.7)',
                        left: leftPosition,
                        transform: 'translateX(-50%)',
                        textAlign: 'center',
                      }}
                    >
                      {String.fromCharCode(65 + i)}
                    </div>
                  );
                })}
              </div>

              {/* 좌표 라벨 - 왼쪽 (1, 2, 3...) */}
              <div className="absolute top-8 bottom-8 left-2 pointer-events-none">
                {Array.from({ length: boardSize }).map((_, i) => {
                  const cellSize = 100 / (boardSize - 1);
                  const topPosition = `${i * cellSize}%`;
                  return (
                    <div
                      key={`row-label-${i}`}
                      className="absolute text-xs font-semibold"
                      style={{
                        color: 'rgba(0,0,0,0.7)',
                        top: topPosition,
                        transform: 'translateY(-50%)',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {i + 1}
                    </div>
                  );
                })}
              </div>

              {/* 그리드 */}
              <div
                className="absolute inset-8 grid gap-0"
                style={{
                  gridTemplateColumns: `repeat(${boardSize - 1}, 1fr)`,
                  gridTemplateRows: `repeat(${boardSize - 1}, 1fr)`,
                }}
              >
                {Array.from({ length: boardSize - 1 }).map((_, rowIndex) =>
                  Array.from({ length: boardSize - 1 }).map((_, colIndex) => (
                    <div
                      key={`grid-${rowIndex}-${colIndex}`}
                      className="relative"
                      style={{
                        borderRight:
                          colIndex < boardSize - 2 ? '1px solid rgba(0,0,0,0.3)' : 'none',
                        borderBottom:
                          rowIndex < boardSize - 2 ? '1px solid rgba(0,0,0,0.3)' : 'none',
                      }}
                    />
                  ))
                )}
              </div>

              <div className="absolute inset-8 pointer-events-none" style={{ border: '1px solid rgba(0,0,0,0.3)' }} />

              {/* 교차점 및 돌 */}
              <div className="absolute inset-8">
                {board.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    const cellSize = 100 / (boardSize - 1);
                    const topPosition = `${rowIndex * cellSize}%`;
                    const leftPosition = `${colIndex * cellSize}%`;

                    return (
                      <div
                        key={`stone-${rowIndex}-${colIndex}`}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        className="absolute flex items-center justify-center"
                        style={{
                          top: topPosition,
                          left: leftPosition,
                          width: '6%',
                          height: '6%',
                          transform: 'translate(-50%, -50%)',
                          backgroundColor:
                            selectedPosition?.row === rowIndex && selectedPosition?.col === colIndex
                              ? 'rgba(31, 111, 235, 0.4)'
                              : 'transparent',
                          borderRadius: '50%',
                          zIndex: 10,
                          cursor: gameStarted && !cell ? 'pointer' : 'default',
                        }}
                      >
                        {/* 화점 표시 */}
                        {!cell &&
                          rowIndex === 7 && colIndex === 7 && (
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: 'rgba(0,0,0,0.5)', pointerEvents: 'none' }}
                            />
                          )}

                        {/* 오목돌 */}
                        {cell && (
                          <div
                            className="rounded-full flex items-center justify-center"
                            style={{
                              width: '100%',
                              height: '100%',
                              backgroundColor: cell === 'black' ? '#1a1a1a' : '#f5f5f5',
                              border: cell === 'black' ? '2px solid #000' : '2px solid #ddd',
                              boxShadow:
                                cell === 'black'
                                  ? '0 2px 6px rgba(0,0,0,0.6)'
                                  : '0 2px 6px rgba(0,0,0,0.3)',
                              pointerEvents: 'none',
                            }}
                          >
                            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="16" cy="16" r="14" fill={cell === 'black' ? '#000' : '#fff'} />
                              {cell === 'white' && <circle cx="12" cy="12" r="4" fill="rgba(0,0,0,0.1)" />}
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽: 컨트롤 */}
        <div className="w-64 space-y-4">
          {!gameStarted ? (
            <>
              {/* 대기 중 메시지 */}
              <div
                className="rounded-xl p-6 border text-center"
                style={{
                  backgroundColor: 'rgba(22,22,28,0.6)',
                  borderColor: '#2a2a33',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                }}
              >
                <div className="text-lg font-semibold mb-2" style={{ color: '#8ab4f8' }}>
                  대국 대기 중
                </div>
                <div className="text-sm" style={{ color: '#9aa1ad' }}>
                  대국 시작 버튼을 눌러주세요
                </div>
              </div>

              {/* 게임 설정 정보 */}
              <div
                className="rounded-xl p-4 border"
                style={{
                  backgroundColor: 'rgba(22,22,28,0.6)',
                  borderColor: '#2a2a33',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                }}
              >
                <div className="text-sm mb-3 font-semibold" style={{ color: '#8ab4f8' }}>
                  게임 설정
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: '#141822' }}>
                    <div className="flex items-center space-x-2">
                      <i className="ri-time-line" style={{ color: '#9aa1ad' }}></i>
                      <span className="text-sm" style={{ color: '#9aa1ad' }}>메인 시간</span>
                    </div>
                    <span className="font-mono text-sm font-semibold" style={{ color: '#e8eaf0' }}>
                      {formatTime(initialTime.black)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: '#141822' }}>
                    <div className="flex items-center space-x-2">
                      <i className="ri-add-circle-line" style={{ color: '#9aa1ad' }}></i>
                      <span className="text-sm" style={{ color: '#9aa1ad' }}>추가 시간</span>
                    </div>
                    <span className="font-mono text-sm font-semibold" style={{ color: '#e8eaf0' }}>
                      5초
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: '#141822' }}>
                    <div className="flex items-center space-x-2">
                      <i className="ri-timer-line" style={{ color: '#9aa1ad' }}></i>
                      <span className="text-sm" style={{ color: '#9aa1ad' }}>초읽기 시간</span>
                    </div>
                    <span className="font-mono text-sm font-semibold" style={{ color: '#e8eaf0' }}>
                      30초
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: '#141822' }}>
                    <div className="flex items-center space-x-2">
                      <i className="ri-repeat-line" style={{ color: '#9aa1ad' }}></i>
                      <span className="text-sm" style={{ color: '#9aa1ad' }}>초읽기 횟수</span>
                    </div>
                    <span className="font-mono text-sm font-semibold" style={{ color: '#e8eaf0' }}>
                      3회
                    </span>
                  </div>
                </div>
              </div>

              {/* 대국 시작 버튼 */}
              <button
                onClick={handleStartGame}
                className="w-full py-4 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap text-white text-lg"
                style={{
                  background: 'linear-gradient(180deg, #1f6feb, #1b4fd8)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}
              >
                대국 시작하기
              </button>
            </>
          ) : (
            <>
              {/* 착수 정보 */}
              <div
                className="rounded-xl p-4 border"
                style={{
                  backgroundColor: 'rgba(22,22,28,0.6)',
                  borderColor: '#2a2a33',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                }}
              >
                <div className="text-sm mb-2" style={{ color: '#9aa1ad' }}>
                  선택된 위치
                </div>
                <div
                  className="text-2xl font-mono font-bold text-center p-3 rounded"
                  style={{ backgroundColor: '#141822', color: '#8ab4f8' }}
                >
                  {selectedPosition ? `${selectedPosition.row * boardSize + selectedPosition.col}` : '미선택'}
                </div>
              </div>

              {/* 착수 버튼 */}
              <button
                onClick={handlePlaceStone}
                disabled={!selectedPosition || !isMyTurn}
                className="w-full py-4 rounded-lg font-semibold transition-all whitespace-nowrap text-white text-lg"
                style={{
                  background:
                    selectedPosition && isMyTurn ? 'linear-gradient(180deg, #1f6feb, #1b4fd8)' : '#2a2a33',
                  boxShadow: selectedPosition && isMyTurn ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                  opacity: selectedPosition && isMyTurn ? 1 : 0.5,
                  cursor: selectedPosition && isMyTurn ? 'pointer' : 'not-allowed',
                }}
              >
                착수하기
              </button>

              {/* 게임 컨트롤 */}
              <div className="space-y-3">
                <button
                  onClick={handlePass}
                  disabled={!isMyTurn}
                  className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap border"
                  style={{
                    backgroundColor: '#141822',
                    borderColor: '#2a2a33',
                    color: '#e8eaf0',
                    opacity: isMyTurn ? 1 : 0.5,
                    cursor: isMyTurn ? 'pointer' : 'not-allowed',
                  }}
                  onMouseEnter={e => {
                    if (isMyTurn) {
                      e.currentTarget.style.borderColor = '#8ab4f8';
                      e.currentTarget.style.color = '#8ab4f8';
                    }
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#2a2a33';
                    e.currentTarget.style.color = '#e8eaf0';
                  }}
                >
                  수 넘김
                </button>

                <button
                  onClick={handleDrawRequest}
                  className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap border"
                  style={{
                    backgroundColor: '#141822',
                    borderColor: '#2a2a33',
                    color: '#e8eaf0',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#f59e0b';
                    e.currentTarget.style.color = '#f59e0b';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#2a2a33';
                    e.currentTarget.style.color = '#e8eaf0';
                  }}
                >
                  무승부 신청
                </button>

                <button
                  onClick={handleResign}
                  className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap border"
                  style={{
                    backgroundColor: '#141822',
                    borderColor: '#2a2a33',
                    color: '#e8eaf0',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#ef4444';
                    e.currentTarget.style.color = '#ef4444';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = '#2a2a33';
                    e.currentTarget.style.color = '#e8eaf0';
                  }}
                >
                  기권
                </button>
              </div>

              {/* 현재 차례 표시 */}
              <div
                className="rounded-xl p-4 border text-center"
                style={{
                  backgroundColor: 'rgba(22,22,28,0.6)',
                  borderColor: '#2a2a33',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                }}
              >
                <div className="text-sm mb-2" style={{ color: '#9aa1ad' }}>
                  현재 차례
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: currentTurn === 'black' ? '#1a1a1a' : '#f5f5f5',
                      border: '2px solid',
                      borderColor: currentTurn === 'black' ? '#000' : '#ddd',
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="8" r="7" fill={currentTurn === 'black' ? '#000' : '#fff'} />
                    </svg>
                  </div>
                  <span className="text-xl font-bold" style={{ color: '#e8eaf0' }}>
                    {currentTurn === 'black' ? '흑' : '백'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 🎙️ 음성 인식 표시 (오른쪽 아래 고정) */}
      {gameStarted && (
        <div
          className="fixed bottom-6 right-6 rounded-xl p-4 border shadow-2xl z-50"
          style={{
            backgroundColor: 'rgba(22,22,28,0.95)',
            borderColor: '#1f6feb',
            boxShadow: '0 8px 32px rgba(31,111,235,0.4)',
            maxWidth: '320px',
          }}
        >
          <div className="flex items-start space-x-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: '#1f6feb' }}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="4" width="4" height="8" rx="2" fill="white"/>
                <path d="M8 10C8 12 7 13 10 13C13 13 12 12 12 10" stroke="white" strokeWidth="1" strokeLinecap="round"/>
                <line x1="10" y1="13" x2="10" y2="16" stroke="white" strokeWidth="1" strokeLinecap="round"/>
                <line x1="8" y1="16" x2="12" y2="16" stroke="white" strokeWidth="1" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold mb-1 flex items-center justify-between">
                <span style={{ color: '#8ab4f8' }}>🎙️ 음성 인식</span>
                <span className="text-xs" style={{ color: '#10b981' }}>● ON</span>
              </div>
              <div className="text-sm break-words" style={{ color: '#e8eaf0' }}>
                {lastHeard ? `"${lastHeard}"` : '말해보세요 (예: 삼행오열)'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
