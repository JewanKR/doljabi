
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { decodeServerResponse, sendRequestViaWebSocket, bitboardToBoardArray, colorEnumToString } from '../../../proto/proto-utils';

interface Player {
  nickname: string;
  rating: number;
  color: 'black' | 'white';
  mainTime: number;
  byoyomiTime: number;
  byoyomiCount: number;
}

export default function GameRoom() {
  const navigate = useNavigate();
  const [boardSize] = useState(15);
  const [board, setBoard] = useState<(null | 'black' | 'white')[][]>(
    Array(15).fill(null).map(() => Array(15).fill(null))
  );
  
  const [currentTurn, setCurrentTurn] = useState<'black' | 'white'>('black');
  const [selectedPosition, setSelectedPosition] = useState<{ row: number; col: number } | null>(null);
  const [myColor] = useState<'black' | 'white'>('black'); // 내 돌 색상

  const [players, setPlayers] = useState<{ black: Player; white: Player }>({
    black: {
      nickname: '플레이어1',
      rating: 1850,
      color: 'black',
      mainTime: 1800,
      byoyomiTime: 30,
      byoyomiCount: 3
    },
    white: {
      nickname: '플레이어2',
      rating: 1720,
      color: 'white',
      mainTime: 1800,
      byoyomiTime: 30,
      byoyomiCount: 3
    }
  });

  const [initialTime] = useState({ black: 1800, white: 1800 });
  const [isInByoyomi, setIsInByoyomi] = useState({ black: false, white: false });
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const websocketRef = useRef<WebSocket | null>(null);
  const sessionKeyRef = useRef<string>('example-session-key');

  // WebSocket 연결 및 메시지 수신
  useEffect(() => {
    // WebSocket 연결 (TODO: 실제 서버 주소로 변경)
    const wsUrl = 'ws://localhost:27000';
    const ws = new WebSocket(wsUrl);
    websocketRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket 연결 성공');
    };

    ws.onmessage = (event) => {
      try {
        // 바이너리 데이터 받기
        let buffer: Uint8Array;
        if (event.data instanceof ArrayBuffer) {
          buffer = new Uint8Array(event.data);
        } else if (event.data instanceof Blob) {
          // Blob인 경우 ArrayBuffer로 변환 필요
          event.data.arrayBuffer().then((arrayBuffer) => {
            const uint8Buffer = new Uint8Array(arrayBuffer);
            handleServerMessage(uint8Buffer);
          });
          return;
        } else {
          buffer = new Uint8Array(event.data);
        }

        handleServerMessage(buffer);
      } catch (error) {
        console.error('메시지 수신 오류:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket 오류:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket 연결 종료');
    };

    return () => {
      if (websocketRef.current) {
        websocketRef.current.close();
      }
    };
  }, []);

  // 서버 메시지 처리
  const handleServerMessage = (buffer: Uint8Array) => {
    try {
      const response = decodeServerResponse(buffer);

      // GameState 추출 (ChaksuResponse 또는 PassTurnResponse에서)
      let gameState = null;
      if (response.coordinate && response.coordinate.gameState) {
        gameState = response.coordinate.gameState;
      } else if (response.passTurn && response.passTurn.gameState) {
        gameState = response.passTurn.gameState;
      }

      if (gameState) {
        // 바둑판 업데이트
        if (gameState.board) {
          const newBoard = bitboardToBoardArray(
            gameState.board.black,
            gameState.board.white,
            boardSize
          );
          setBoard(newBoard);
        }

        // 턴 정보 업데이트
        if (gameState.turn !== undefined && gameState.turn !== null) {
          const turnColor = colorEnumToString(gameState.turn);
          if (turnColor) {
            setCurrentTurn(turnColor);
          }
        }

        // 플레이어 시간 정보 업데이트
        if (gameState.blackTime) {
          const blackTime = gameState.blackTime;
          setPlayers(prev => ({
            ...prev,
            black: {
              ...prev.black,
              mainTime: blackTime.mainTime / 1000, // 밀리초를 초로 변환
              byoyomiTime: blackTime.overtime / 1000,
              byoyomiCount: blackTime.remainingOvertime || prev.black.byoyomiCount,
            }
          }));

          // 초읽기 상태 업데이트
          if (blackTime.mainTime === 0) {
            setIsInByoyomi(prev => ({ ...prev, black: true }));
          }
        }

        if (gameState.whiteTime) {
          const whiteTime = gameState.whiteTime;
          setPlayers(prev => ({
            ...prev,
            white: {
              ...prev.white,
              mainTime: whiteTime.mainTime / 1000,
              byoyomiTime: whiteTime.overtime / 1000,
              byoyomiCount: whiteTime.remainingOvertime || prev.white.byoyomiCount,
            }
          }));

          // 초읽기 상태 업데이트
          if (whiteTime.mainTime === 0) {
            setIsInByoyomi(prev => ({ ...prev, white: true }));
          }
        }
      }

      // 기타 응답 처리 (기권, 무승부 등)
      if (response.resign) {
        alert('상대방이 기권했습니다.');
        // TODO: 게임 종료 처리
      }

      if (response.drawOffer) {
        if (response.drawOffer.accepted) {
          alert('무승부가 수락되었습니다.');
          // TODO: 게임 종료 처리
        } else {
          alert('무승부가 거절되었습니다.');
        }
      }
    } catch (error) {
      console.error('서버 응답 처리 오류:', error);
    }
  };

  // 타이머 (로컬 시간 감소)
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setPlayers(prev => {
        const newPlayers = { ...prev };
        const current = newPlayers[currentTurn];
        
        if (current.mainTime > 0) {
          current.mainTime -= 1;
          if (current.mainTime === 0) {
            setIsInByoyomi(prev => ({ ...prev, [currentTurn]: true }));
          }
        } else if (current.byoyomiTime > 0) {
          current.byoyomiTime -= 1;
          if (current.byoyomiTime === 0 && current.byoyomiCount > 0) {
            current.byoyomiCount -= 1;
            current.byoyomiTime = 30;
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
  }, [currentTurn]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const getTimePercentage = (currentTime: number, initialTime: number) => {
    return Math.max(0, Math.min(100, (currentTime / initialTime) * 100));
  };

  const getTimeBarColor = (percentage: number) => {
    if (percentage > 50) return '#10b981'; // 녹색
    if (percentage > 20) return '#f59e0b'; // 주황색
    return '#ef4444'; // 빨간색
  };

  const handleCellClick = (row: number, col: number) => {
    if (board[row][col] === null) {
      setSelectedPosition({ row, col });
    }
  };

  const handlePlaceStone = () => {
    if (currentTurn !== myColor) {
      return; // 내 차례가 아니면 아무것도 하지 않음
    }

    if (!selectedPosition) {
      alert('착수할 위치를 선택해주세요.');
      return;
    }

    const { row, col } = selectedPosition;
    
    if (board[row][col] !== null) {
      alert('이미 돌이 놓인 위치입니다.');
      return;
    }

    // 좌표를 0~360 정수형으로 변환
    const coordinate = row * 19 + col;

   // WebSocket으로 요청 전송
   if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
    try {
      sendRequestViaWebSocket(websocketRef.current, sessionKeyRef.current, 'coordinate', coordinate);
    } catch (error) {
      console.error('요청 전송 오류:', error);
      alert('서버로 요청을 보낼 수 없습니다.');
    }
  } else {
    alert('서버에 연결되지 않았습니다.');
  }

  // 선택 초기화 (서버 응답으로 실제 업데이트가 올 때까지는 UI에서 제거)
    setSelectedPosition(null);
  };

  const handlePass = () => {
    if (currentTurn !== myColor) {
      return; // 내 차례가 아니면 아무것도 하지 않음
    }

    // WebSocket으로 패스 요청 전송
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      try {
        sendRequestViaWebSocket(websocketRef.current, sessionKeyRef.current, 'passTurn');
      } catch (error) {
        console.error('요청 전송 오류:', error);
        alert('서버로 요청을 보낼 수 없습니다.');
      }
    } else {
      alert('서버에 연결되지 않았습니다.');
    }
  
  };

  const handleResign = () => {
    if (confirm('정말 기권하시겠습니까?')) {
      // WebSocket으로 기권 요청 전송
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        try {
          sendRequestViaWebSocket(websocketRef.current, sessionKeyRef.current, 'resign');
          // TODO: 서버 응답 대기 후 게임 종료 처리
        } catch (error) {
          console.error('요청 전송 오류:', error);
          alert('서버로 요청을 보낼 수 없습니다.');
        }
      } else {
        alert('서버에 연결되지 않았습니다.');
      }
      navigate('/');
    }
  };

  const handleDrawRequest = () => {
    if (currentTurn !== myColor) {
      return; // 내 차례가 아니면 아무것도 하지 않음
    }
    
    
    // WebSocket으로 무승부 제안 전송
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      try {
        sendRequestViaWebSocket(websocketRef.current, sessionKeyRef.current, 'drawOffer');
        alert('무승부 신청이 상대방에게 전송되었습니다.');
      } catch (error) {
        console.error('요청 전송 오류:', error);
        alert('서버로 요청을 보낼 수 없습니다.');
      }
    } else {
      alert('서버에 연결되지 않았습니다.');
    }
  };

  const isMyTurn = currentTurn === myColor;

  // 내 정보와 상대방 정보 구분
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

        <button
          disabled
          className="px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap border"
          style={{
            backgroundColor: '#141822',
            borderColor: '#2a2a33',
            color: '#9aa1ad',
            opacity: 0.5,
            cursor: 'not-allowed',
          }}
        >
          방 설정
        </button>
      </header>

      {/* Main Content */}
      <div className="flex items-start justify-center min-h-[calc(100vh-72px)] p-6 gap-4">
        {/* 왼쪽: 플레이어 정보 */}
        <div className="w-64 flex flex-col h-[calc(100vh-120px)]">
          {/* 내 정보 - 상단 50% */}
          <div
            className={`flex-1 rounded-xl p-4 border mb-2 ${currentTurn === myColor ? 'ring-2 ring-blue-500' : ''}`}
            style={{
              backgroundColor: 'rgba(22,22,28,0.6)',
              borderColor: currentTurn === myColor ? '#1f6feb' : '#2a2a33',
              boxShadow:
                currentTurn === myColor
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
                  <span style={{ color: '#9aa1ad' }}>{myPlayer.rating}</span>
                </div>
              </div>
            </div>

            {/* 시간 진행 바 */}
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
          </div>

          {/* 상대방 정보 - 하단 50% */}
          <div
            className={`flex-1 rounded-xl p-4 border ${currentTurn === opponentColor ? 'ring-2 ring-blue-500' : ''}`}
            style={{
              backgroundColor: 'rgba(22,22,28,0.6)',
              borderColor: currentTurn === opponentColor ? '#1f6feb' : '#2a2a33',
              boxShadow:
                currentTurn === opponentColor
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
                  <span style={{ color: '#9aa1ad' }}>{opponentPlayer.rating}</span>
                </div>
              </div>
            </div>

            {/* 시간 진행 바 */}
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
          </div>
        </div>

        {/* 중앙: 바둑판 */}
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
              {/* 바둑판 그리드 (18x18 셀로 19x19 교차점 생성) */}
              <div className="absolute inset-8 grid gap-0"
                   style={{ 
                     gridTemplateColumns: `repeat(${boardSize - 1}, 1fr)`,
                     gridTemplateRows: `repeat(${boardSize - 1}, 1fr)`
                   }}>
                {Array.from({ length: boardSize - 1 }).map((_, rowIndex) =>
                  Array.from({ length: boardSize - 1 }).map((_, colIndex) => (
                    <div
                      key={`grid-${rowIndex}-${colIndex}`}
                      className="relative"
                      style={{
                        borderRight: colIndex < boardSize - 2 ? '1px solid rgba(0,0,0,0.3)' : 'none',
                        borderBottom: rowIndex < boardSize - 2 ? '1px solid rgba(0,0,0,0.3)' : 'none'
                      }}
                    />
                  ))
                )}
              </div>

              {/* 외곽 테두리 선 */}
              <div className="absolute inset-8 pointer-events-none"
                   style={{
                     border: '1px solid rgba(0,0,0,0.3)'
                   }}
              />

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
                        className="absolute cursor-pointer flex items-center justify-center"
                        style={{
                          top: topPosition,
                          left: leftPosition,
                          width: '5%',
                          height: '5%',
                          transform: 'translate(-50%, -50%)',
                          backgroundColor:
                            selectedPosition?.row === rowIndex && selectedPosition?.col === colIndex
                              ? 'rgba(31, 111, 235, 0.4)'
                              : 'transparent',
                          borderRadius: '50%',
                          zIndex: 10,
                        }}
                      >
                        {/* 화점 표시 */}
                        {!cell &&
                          (rowIndex === 3 || rowIndex === 9 || rowIndex === 15) &&
                          (colIndex === 3 || colIndex === 9 || colIndex === 15) && (
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: 'rgba(0,0,0,0.5)', pointerEvents: 'none' }}
                            />
                          )}

                        {/* 바둑돌 */}
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
          {/* 선택된 위치 및 착수 버튼 */}
          <div className="rounded-xl p-4 border"
               style={{ 
                 backgroundColor: 'rgba(22,22,28,0.6)', 
                 borderColor: '#2a2a33',
                 boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
               }}>
            <div className="text-sm mb-2" style={{ color: '#9aa1ad' }}>선택된 위치</div>
            <div className="text-2xl font-mono font-bold text-center p-3 rounded"
                 style={{ backgroundColor: '#141822', color: '#8ab4f8' }}>
              {selectedPosition 
                ? `${selectedPosition.row * 19 + selectedPosition.col}`
                : '미선택'}
            </div>
          </div>

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
            >
              기권
            </button>
          </div>

          {/* 현재 차례 표시 */}
          <div className="rounded-xl p-4 border text-center"
               style={{ 
                 backgroundColor: 'rgba(22,22,28,0.6)', 
                 borderColor: '#2a2a33',
                 boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
               }}>
            <div className="text-sm mb-2" style={{ color: '#9aa1ad' }}>현재 차례</div>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center"
                   style={{ 
                     backgroundColor: currentTurn === 'black' ? '#1a1a1a' : '#f5f5f5',
                     border: '2px solid',
                     borderColor: currentTurn === 'black' ? '#000' : '#ddd'
                   }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="8" cy="8" r="7" fill={currentTurn === 'black' ? '#000' : '#fff'} />
                </svg>
              </div>
              <span className="text-xl font-bold" style={{ color: '#e8eaf0' }}>
                {currentTurn === 'black' ? '흑' : '백'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
