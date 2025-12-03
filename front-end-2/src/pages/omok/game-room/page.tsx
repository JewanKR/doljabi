import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { WebSocketHandler } from './websocket-handler';
import { loadRoomConfig } from './enter-room-config';

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
  const location = useLocation();

  // location.state 또는 localStorage에서 방 데이터 가져오기
  const roomData = location.state || (() => {
    const stored = localStorage.getItem('omok_room_data');
    return stored ? JSON.parse(stored) : null;
  })();

  const { enter_code: enterCode } = roomData || {};
  const roomCode = enterCode ? String(enterCode) : 'OMOK-2024';

  // 컴포넌트 마운트 시 방 데이터 로깅
  useEffect(() => {
    if (roomData) {
      console.log('게임룸 데이터:', roomData);
    }
  }, [roomData]);

  const [boardSize] = useState(15);
  const [board, setBoard] = useState<(null | 'black' | 'white')[][]>(
    Array(15)
      .fill(null)
      .map(() => Array(15).fill(null))
  );

  const [gameStarted, setGameStarted] = useState(false);
  const [currentTurn, setCurrentTurn] = useState<'black' | 'white'>('black');
  const [selectedPosition, setSelectedPosition] = useState<{ row: number; col: number } | null>(null);
  const [myColor] = useState<'black' | 'white'>('black');

  const [players, setPlayers] = useState<{ black: Player; white: Player }>({
    black: {
      nickname: '---',
      rating: '---' as any,
      color: 'black',
      mainTime: 1800,
      byoyomiTime: 30,
      byoyomiCount: 3,
    },
    white: {
      nickname: '---',
      rating: '---' as any,
      color: 'white',
      mainTime: 1800,
      byoyomiTime: 30,
      byoyomiCount: 3,
    },
  });

  const [initialTime] = useState({ black: 1800, white: 1800 });
  const [isInByoyomi, setIsInByoyomi] = useState({ black: false, white: false });
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const handlerRef = useRef<WebSocketHandler | null>(null);

  // 타이머 관리 (게임 시작 후에만 작동)
  useEffect(() => {
    if (!gameStarted) return;

    timerRef.current = setInterval(() => {
      setPlayers(prev => {
        const newPlayers = { ...prev };
        const current = newPlayers[currentTurn];

        if (current.mainTime > 0) {
          current.mainTime -= 1;
        } else if (current.byoyomiTime > 0) {
          current.byoyomiTime -= 1;
          if (current.byoyomiTime === 0 && current.byoyomiCount > 0) {
            current.byoyomiCount -= 1;
            current.byoyomiTime = 30; // Reset byoyomi time
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
    const config = loadRoomConfig();

    if (!config || !config.enter_code || !config.session_key) {
      console.error('방 정보가 없습니다.');
      navigate('/');
      return;
    }

    const { enter_code, session_key } = config;
    const wsUrl = `ws://localhost:27000/api/room/${enter_code}/session/${session_key}`;
    const handler = new WebSocketHandler(wsUrl);
    handlerRef.current = handler;

    handler.connect();

    // Subscribe to updates
    handler.onGameStateChange((newBoard, turn, blackTime, whiteTime) => {
      setBoard(newBoard);
      setCurrentTurn(turn);

      // Update black player's time
      if (blackTime) {
        setPlayers(prev => ({
          ...prev,
          black: {
            ...prev.black,
            mainTime: blackTime.mainTime,
            byoyomiTime: blackTime.overtime,
            byoyomiCount: blackTime.remainingOvertime
          }
        }));
      }

      // Update white player's time
      if (whiteTime) {
        setPlayers(prev => ({
          ...prev,
          white: {
            ...prev.white,
            mainTime: whiteTime.mainTime,
            byoyomiTime: whiteTime.overtime,
            byoyomiCount: whiteTime.remainingOvertime
          }
        }));
      }
    });

    handler.onGameStart(() => {
      setGameStarted(true);
      console.log('게임 시작 성공');
    });

    handler.onPlayerInfoUpdate((usersInfo) => {
      console.log('플레이어 정보:', usersInfo);
      if (usersInfo.black) {
        setPlayers(prev => ({
          ...prev,
          black: {
            ...prev.black,
            nickname: usersInfo.black!.userName || 'black',
            rating: usersInfo.black!.rating || ('---' as any),
          }
        }));
      }
      if (usersInfo.white) {
        setPlayers(prev => ({
          ...prev,
          white: {
            ...prev.white,
            nickname: usersInfo.white!.userName || 'white',
            rating: usersInfo.white!.rating || ('---' as any),
          }
        }));
      }
    });

    handler.onGameEnd((winnerColor) => {
      console.log('게임 종료, 승자:', winnerColor);
      // TODO: 게임 종료 처리
    });

    // Cleanup
    return () => {
      handler.disconnect();
      handlerRef.current = null;
    };
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getTimePercentage = (currentTime: number, initialTime: number) => {
    // Use the initial mainTime from players state for percentage calculation
    // Note: initialTime state might not be updated if we want dynamic initial time, but for now it's fixed.
    // Or we can use the max time if we knew it.
    // Let's use the initialTime state which is 1800.
    const maxTime = initialTime;
    return Math.max(0, Math.min(100, (currentTime / maxTime) * 100));
  };

  const getTimeBarColor = (percentage: number) => {
    if (percentage > 50) return '#10b981';
    if (percentage > 20) return '#f59e0b';
    return '#ef4444';
  };

  const handleCellClick = (row: number, col: number) => {
    if (!gameStarted) return;
    if (board[row][col] === null) {
      setSelectedPosition({ row, col });
    }
  };

  const handlePlaceStone = () => {
    if (!gameStarted || currentTurn !== myColor) return;

    if (!selectedPosition) {
      alert('착수할 위치를 선택해주세요.');
      return;
    }

    const { row, col } = selectedPosition;

    if (board[row][col] !== null) {
      alert('이미 돌이 놓인 위치입니다.');
      return;
    }

    const coordinate = row * 15 + col;
    const config = loadRoomConfig();

    if (handlerRef.current && config && config.session_key) {
      handlerRef.current.sendPlaceStone(config.session_key, coordinate);
      console.log('착수 요청 전송:', row, col);
    }

    setSelectedPosition(null);
  };

  const handlePass = () => {
    if (!gameStarted || currentTurn !== myColor) return;
    const config = loadRoomConfig();
    if (handlerRef.current && config && config.session_key) {
      handlerRef.current.sendPass(config.session_key);
      console.log('수 넘김 요청 전송');
    }
  };

  const handleResign = () => {
    if (!gameStarted) return;
    if (confirm('정말 기권하시겠습니까?')) {
      navigate('/');
    }
  };

  const handleDrawRequest = () => {
    if (!gameStarted || currentTurn !== myColor) return;
    alert('무승부 신청이 상대방에게 전송되었습니다.');
  };

  const handleStartGame = () => {
    const config = loadRoomConfig();
    if (config && config.session_key && handlerRef.current) {
      handlerRef.current.sendGameStart(config.session_key);
      console.log('게임 시작 요청 전송됨');
    }
  };

  const isMyTurn = currentTurn === myColor;
  const myPlayer = players[myColor];
  const opponentColor = myColor === 'black' ? 'white' : 'black';
  const opponentPlayer = players[opponentColor];

  const myTimePercentage = getTimePercentage(myPlayer.mainTime, initialTime[myColor]);
  const opponentTimePercentage = getTimePercentage(opponentPlayer.mainTime, initialTime[opponentColor]);

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
                      className={`font-mono font-bold ${isInByoyomi[myColor] ? 'text-red-500' : ''}`}
                      style={{ color: isInByoyomi[myColor] ? '#ef4444' : '#e8eaf0' }}
                    >
                      {formatTime(myPlayer.mainTime)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: '#141822' }}>
                    <span className="text-sm" style={{ color: '#9aa1ad' }}>
                      초읽기
                    </span>
                    <span className={`font-mono font-bold ${isInByoyomi[myColor] ? 'text-red-500' : ''}`}
                      style={{ color: isInByoyomi[myColor] ? '#ef4444' : '#9aa1ad' }}>
                      {formatTime(myPlayer.byoyomiTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: '#141822' }}>
                    <span className="text-sm" style={{ color: '#9aa1ad' }}>
                      남은 횟수
                    </span>
                    <span className={`font-mono font-bold ${isInByoyomi[myColor] ? 'text-red-500' : ''}`}
                      style={{ color: isInByoyomi[myColor] ? '#ef4444' : '#9aa1ad' }}>
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
                  {selectedPosition ? `${selectedPosition.row * 15 + selectedPosition.col}` : '미선택'}
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
                      e.currentTarget.style.borderColor = '#f59e0b';
                      e.currentTarget.style.color = '#f59e0b';
                    }
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
    </div>
  );
}
