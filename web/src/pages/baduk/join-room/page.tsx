
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type Stone = 'black' | 'white' | null;
type GameState = 'joining' | 'waiting' | 'playing' | 'finished';

interface User {
  id: string;
  username: string;
  rating: number;
  status: 'online' | 'playing' | 'away';
  avatar: string;
}

export default function BadukJoinRoom() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('joining');
  const [board, setBoard] = useState<Stone[][]>(Array(19).fill(null).map(() => Array(19).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState<Stone>('black');
  const [playerColor, setPlayerColor] = useState<Stone>('white');
  const [gameLog, setGameLog] = useState<number[]>([]);
  const [capturedStones, setCapturedStones] = useState({ black: 0, white: 0 });
  const [winner, setWinner] = useState<Stone>(null);
  const [showResult, setShowResult] = useState(false);
  const [passCount, setPassCount] = useState(0);
  const [lastMove, setLastMove] = useState<{row: number, col: number} | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [opponent, setOpponent] = useState({ name: '', rating: 0 });
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [showDrawOffer, setShowDrawOffer] = useState(false);
  const [drawOffered, setDrawOffered] = useState(false);
  const [sentRequests, setSentRequests] = useState<string[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'code'>('users');

  const BOARD_SIZE = 19;
  const CELL_SIZE = 43;
  const BOARD_PADDING = 51;

  // 모의 사용자 데이터
  const onlineUsers: User[] = [
    { id: 'user1', username: '바둑마스터', rating: 1850, status: 'online', avatar: '🎯' },
    { id: 'user2', username: '바둑킹', rating: 1720, status: 'online', avatar: '👑' },
    { id: 'user3', username: '전략가', rating: 1650, status: 'playing', avatar: '🧠' },
    { id: 'user4', username: '초보자', rating: 1200, status: 'online', avatar: '🌱' },
    { id: 'user5', username: '프로기사', rating: 2100, status: 'away', avatar: '⚡' },
  ];

  const sendGameRequest = (userId: string) => {
    setSentRequests([...sentRequests, userId]);
    // 실제 구현에서는 서버에 요청 전송
  };

  const acceptRequest = (userId: string) => {
    setReceivedRequests(receivedRequests.filter(id => id !== userId));
    // 실제 구현에서는 게임 시작
    alert('게임이 시작됩니다! (추후 구현 예정)');
  };

  const rejectRequest = (userId: string) => {
    setReceivedRequests(receivedRequests.filter(id => id !== userId));
  };

  const joinByCode = () => {
    if (!roomCode.trim()) {
      alert('방 코드를 입력해주세요.');
      return;
    }
    // 실제 구현에서는 서버에서 방 코드 검증 후 게임 입장
    alert(`방 코드 ${roomCode}로 입장합니다. (추후 구현 예정)`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'playing': return '#f59e0b';
      case 'away': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return '온라인';
      case 'playing': return '게임 중';
      case 'away': return '자리비움';
      default: return '오프라인';
    }
  };

  const xyToCoord = (x: number, y: number): number => {
    return y * 19 + x;
  };

  const captureStones = (newBoard: Stone[][], stone: Stone, row: number, col: number): number => {
    // This is a simplified implementation - in a real game this would be more complex
    return 0;
  };

  const simulateOpponentMove = (currentBoard: Stone[][], opponentColor: Stone) => {
    // 간단한 AI 로직으로 상대방 움직임 시뮬레이션
    const emptySpots: {row: number, col: number, score: number}[] = [];
    
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!currentBoard[row][col]) {
          let score = Math.random() * 10;
          
          // 중앙 근처 선호
          const centerDistance = Math.abs(row - 9) + Math.abs(col - 9);
          score += Math.max(0, 18 - centerDistance);
          
          // 기존 돌 근처 선호
          const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
          for (const [dx, dy] of directions) {
            const newRow = row + dx;
            const newCol = col + dy;
            if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE && 
                currentBoard[newRow][newCol]) {
              score += 5;
            }
          }
          
          emptySpots.push({row, col, score});
        }
      }
    }

    if (emptySpots.length > 0) {
      emptySpots.sort((a, b) => b.score - a.score);
      const topCandidates = emptySpots.slice(0, Math.min(10, emptySpots.length));
      const randomIndex = Math.floor(Math.random() * topCandidates.length);
      const {row, col} = topCandidates[randomIndex];
      makeMove(row, col, opponentColor);
    } else {
      handlePass();
    }
  };

  useEffect(() => {
    if (gameState === 'playing') {
      drawBoard();
      setIsTimerActive(true);
      setTimeLeft(30);
    }
  }, [board, gameState, lastMove]);

  const drawBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with lighter brown tone
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 1;

    for (let i = 0; i < BOARD_SIZE; i++) {
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(BOARD_PADDING + i * CELL_SIZE, BOARD_PADDING);
      ctx.lineTo(BOARD_PADDING + i * CELL_SIZE, BOARD_PADDING + (BOARD_SIZE - 1) * CELL_SIZE);
      ctx.stroke();

      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(BOARD_PADDING, BOARD_PADDING + i * CELL_SIZE);
      ctx.lineTo(BOARD_PADDING + (BOARD_SIZE - 1) * CELL_SIZE, BOARD_PADDING + i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw star points (화점)
    const starPoints = [
      [3, 3], [3, 9], [3, 15],
      [9, 3], [9, 9], [9, 15],
      [15, 3], [15, 9], [15, 15]
    ];
    
    ctx.fillStyle = '#8B4513';
    starPoints.forEach(([row, col]) => {
      const x = BOARD_PADDING + col * CELL_SIZE;
      const y = BOARD_PADDING + row * CELL_SIZE;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Draw all stones on the board - 모든 착수된 돌들을 화면에 표시
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const stone = board[row][col];
        if (stone) {
          const x = BOARD_PADDING + col * CELL_SIZE;
          const y = BOARD_PADDING + row * CELL_SIZE;
          const radius = 21;

          // Enhanced 3D stone rendering
          if (stone === 'black') {
            // Black stone with multiple gradients for 3D effect
            const gradient1 = ctx.createRadialGradient(x - 7, y - 7, 0, x, y, radius);
            gradient1.addColorStop(0, '#666');
            gradient1.addColorStop(0.2, '#444');
            gradient1.addColorStop(0.5, '#222');
            gradient1.addColorStop(0.8, '#111');
            gradient1.addColorStop(1, '#000');
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = gradient1;
            ctx.fill();
            
            // Inner highlight
            const highlight = ctx.createRadialGradient(x - 6, y - 6, 0, x - 6, y - 6, 7);
            highlight.addColorStop(0, 'rgba(255,255,255,0.4)');
            highlight.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = highlight;
            ctx.fill();
          } else {
            // White stone with multiple gradients for 3D effect
            const gradient1 = ctx.createRadialGradient(x - 7, y - 7, 0, x, y, radius);
            gradient1.addColorStop(0, '#fff');
            gradient1.addColorStop(0.2, '#f8f8f8');
            gradient1.addColorStop(0.5, '#f0f0f0');
            gradient1.addColorStop(0.8, '#e8e8e8');
            gradient1.addColorStop(1, '#ddd');
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.fillStyle = gradient1;
            ctx.fill();
            
            // Inner highlight
            const highlight = ctx.createRadialGradient(x - 6, y - 6, 0, x - 6, y - 6, 7);
            highlight.addColorStop(0, 'rgba(255,255,255,0.9)');
            highlight.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = highlight;
            ctx.fill();
          }
          
          // Stone border
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.strokeStyle = stone === 'black' ? '#000' : '#aaa';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      }
    }

    // 마지막 착수 위치 표시
    if (lastMove) {
      const x = BOARD_PADDING + lastMove.col * CELL_SIZE;
      const y = BOARD_PADDING + lastMove.row * CELL_SIZE;
      
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, 2 * Math.PI);
      ctx.fillStyle = '#ff4444';
      ctx.fill();
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing' || currentPlayer !== playerColor) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const col = Math.round((x - BOARD_PADDING) / CELL_SIZE);
    const row = Math.round((y - BOARD_PADDING) / CELL_SIZE);

    if (col >= 0 && col < BOARD_SIZE && row >= 0 && row < BOARD_SIZE && !board[row][col]) {
      makeMove(row, col, playerColor);
    }
  };

  // 타이머 효과
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerActive && gameState === 'playing' && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            // 시간 초과 시 자동 수넘김
            handlePass();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, gameState, timeLeft]);

  const makeMove = (row: number, col: number, stone: Stone) => {
    if (!stone) return;
    
    // Check if position is empty
    if (board[row][col] !== null) return;

    // 보드 상태 업데이트 - 완전히 새로운 배열 생성하여 불변성 보장
    const newBoard = board.map((boardRow, rowIndex) => 
      boardRow.map((cell, colIndex) => {
        if (rowIndex === row && colIndex === col) {
          return stone;
        }
        return cell;
      })
    );
    
    // 바둑 규칙: 상대방 돌 잡기
    const captured = captureStones(newBoard, stone, row, col);
    
    // 상태 업데이트
    setBoard(newBoard);
    setLastMove({row, col});
    setPassCount(0);
    setTimeLeft(30); // 타이머 리셋

    // 정수형 좌표로 로그 기록 (0-360)
    const coord = xyToCoord(col, row);
    setGameLog(prev => [...prev, coord]);

    // Switch player
    const nextPlayer = stone === 'black' ? 'white' : 'black';
    setCurrentPlayer(nextPlayer);

    // 상대방 턴 시뮬레이션
    if (nextPlayer !== playerColor) {
      setTimeout(() => {
        simulateOpponentMove(newBoard, nextPlayer);
      }, 1500);
    }
  };

  const handlePass = () => {
    const newPassCount = passCount + 1;
    setPassCount(newPassCount);
    setTimeLeft(30); // 타이머 리셋
    
    // 수넘김은 -1로 로그에 기록
    setGameLog(prev => [...prev, -1]);

    if (newPassCount >= 2) {
      // 양쪽 모두 수넘김하면 게임 종료
      endGame();
    } else {
      // Switch player
      const nextPlayer = currentPlayer === 'black' ? 'white' : 'black';
      setCurrentPlayer(nextPlayer);

      // 상대방 턴 시뮬레이션
      if (nextPlayer !== playerColor) {
        setTimeout(() => {
          simulateOpponentMove(board, nextPlayer);
        }, 1500);
      }
    }
  };

  const endGame = () => {
    setIsTimerActive(false);
    // 간단한 점수 계산
    let blackScore = 0;
    let whiteScore = 0;
    
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (board[row][col] === 'black') blackScore++;
        if (board[row][col] === 'white') whiteScore++;
      }
    }
    
    // 잡힌 돌 점수 추가
    blackScore += capturedStones.black;
    whiteScore += capturedStones.white;
    
    // 덤 (백돌에게 주는 점수)
    whiteScore += 6.5;
    
    setWinner(blackScore > whiteScore ? 'black' : 'white');
    setShowResult(true);
    setGameState('finished');
  };

  const handleResign = () => {
    setIsTimerActive(false);
    // 기권은 -2로 로그에 기록
    setGameLog(prev => [...prev, -2]);

    setWinner(currentPlayer === 'black' ? 'white' : 'black');
    setShowResult(true);
    setGameState('finished');
  };

  const handleDrawOffer = () => {
    setDrawOffered(true);
    setShowDrawOffer(true);
    
    // 상대방이 무승부 제안을 수락할지 결정 (50% 확률)
    setTimeout(() => {
      const opponentAccepts = Math.random() > 0.5;
      if (opponentAccepts) {
        setWinner(null);
        setShowResult(true);
        setGameState('finished');
        setIsTimerActive(false);
      } else {
        setShowDrawOffer(false);
        setDrawOffered(false);
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0b0c10' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b" style={{ borderColor: '#2a2a33' }}>
        <button 
          onClick={() => navigate('/')}
          className="flex items-center space-x-3 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
               style={{ 
                 background: 'linear-gradient(135deg, #1f6feb 0%, #1b4fd8 100%)',
                 boxShadow: '0 4px 12px rgba(31, 111, 235, 0.3)'
               }}>
            <i className="ri-game-fill text-white text-xl"></i>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Doljabi
          </h1>
        </button>
        
        <h2 className="text-xl font-semibold" style={{ color: '#e8eaf0' }}>바둑 방 입장</h2>
        
        <button 
          onClick={() => navigate('/')}
          className="px-6 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap border"
          style={{ 
            backgroundColor: '#141822', 
            borderColor: '#2a2a33',
            color: '#e8eaf0'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#8ab4f8';
            e.currentTarget.style.color = '#8ab4f8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#2a2a33';
            e.currentTarget.style.color = '#e8eaf0';
          }}
        >
          로비로
        </button>
      </header>

      <div className="max-w-4xl mx-auto p-8">
        {/* Tab Navigation */}
        <div className="flex mb-8 rounded-lg p-1 border"
             style={{ 
               backgroundColor: 'rgba(22,22,28,0.6)', 
               borderColor: '#2a2a33'
             }}>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 px-6 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'users' ? 'text-white' : ''
            }`}
            style={{
              backgroundColor: activeTab === 'users' ? '#1f6feb' : 'transparent',
              color: activeTab === 'users' ? '#ffffff' : '#9aa1ad'
            }}
          >
            <i className="ri-user-line mr-2"></i>
            온라인 유저
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex-1 py-3 px-6 rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'code' ? 'text-white' : ''
            }`}
            style={{
              backgroundColor: activeTab === 'code' ? '#1f6feb' : 'transparent',
              color: activeTab === 'code' ? '#ffffff' : '#9aa1ad'
            }}
          >
            <i className="ri-key-line mr-2"></i>
            방 코드 입장
          </button>
        </div>

        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* 받은 요청 */}
            {receivedRequests.length > 0 && (
              <div className="rounded-2xl p-6 border"
                   style={{ 
                     backgroundColor: 'rgba(22,22,28,0.6)', 
                     borderColor: '#2a2a33',
                     boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                   }}>
                <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: '#e8eaf0' }}>
                  <i className="ri-notification-line mr-2 text-yellow-500"></i>
                  받은 게임 요청
                </h3>
                <div className="space-y-3">
                  {receivedRequests.map(userId => {
                    const user = onlineUsers.find(u => u.id === userId);
                    if (!user) return null;
                    
                    return (
                      <div key={userId} className="flex items-center justify-between p-4 rounded-lg border"
                           style={{ 
                             backgroundColor: '#141822', 
                             borderColor: '#2a2a33'
                           }}>
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{user.avatar}</span>
                          <div>
                            <div className="font-medium" style={{ color: '#e8eaf0' }}>{user.username}</div>
                            <div className="text-sm" style={{ color: '#9aa1ad' }}>레이팅: {user.rating}</div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => acceptRequest(userId)}
                            className="px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap text-white"
                            style={{ 
                              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)'
                            }}
                          >
                            수락
                          </button>
                          <button
                            onClick={() => rejectRequest(userId)}
                            className="px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap border"
                            style={{ 
                              backgroundColor: '#141822', 
                              borderColor: '#2a2a33',
                              color: '#e8eaf0'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = '#ef4444';
                              e.currentTarget.style.color = '#ef4444';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = '#2a2a33';
                              e.currentTarget.style.color = '#e8eaf0';
                            }}
                          >
                            거절
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 온라인 유저 목록 */}
            <div className="rounded-2xl p-6 border"
                 style={{ 
                   backgroundColor: 'rgba(22,22,28,0.6)', 
                   borderColor: '#2a2a33',
                   boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                 }}>
              <h3 className="text-lg font-semibold mb-4" style={{ color: '#e8eaf0' }}>온라인 유저 ({onlineUsers.length}명)</h3>
              <div className="space-y-3">
                {onlineUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border"
                       style={{ 
                         backgroundColor: '#141822', 
                         borderColor: '#2a2a33'
                       }}>
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{user.avatar}</span>
                      <div>
                        <div className="font-medium" style={{ color: '#e8eaf0' }}>{user.username}</div>
                        <div className="text-sm flex items-center space-x-2">
                          <span style={{ color: '#9aa1ad' }}>레이팅: {user.rating}</span>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: getStatusColor(user.status) }}></span>
                          <span style={{ color: getStatusText(user.status) }}>{getStatusText(user.status)}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      {user.status === 'online' ? (
                        sentRequests.includes(user.id) ? (
                          <button
                            disabled
                            className="px-4 py-2 rounded-lg cursor-not-allowed whitespace-nowrap border"
                            style={{ 
                              backgroundColor: '#141822', 
                              borderColor: '#2a2a33',
                              color: '#9aa1ad'
                            }}
                          >
                            요청 전송됨
                          </button>
                        ) : (
                          <button
                            onClick={() => sendGameRequest(user.id)}
                            className="px-4 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap text-white"
                            style={{ 
                              background: 'linear-gradient(180deg, #1f6feb, #1b4fd8)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                            }}
                          >
                            게임 요청
                          </button>
                        )
                      ) : (
                        <button
                          disabled
                          className="px-4 py-2 rounded-lg cursor-not-allowed whitespace-nowrap border"
                          style={{ 
                            backgroundColor: '#141822', 
                            borderColor: '#2a2a33',
                            color: '#9aa1ad'
                          }}
                        >
                          {user.status === 'playing' ? '게임 중' : '자리비움'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'code' && (
          <div className="max-w-md mx-auto">
            <div className="rounded-2xl p-8 border text-center"
                 style={{ 
                   backgroundColor: 'rgba(22,22,28,0.6)', 
                   borderColor: '#2a2a33',
                   boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                 }}>
              <div className="w-20 h-20 mx-auto mb-6 rounded-xl flex items-center justify-center"
                   style={{ 
                     background: 'linear-gradient(135deg, #8ab4f8 0%, #6366f1 100%)',
                     boxShadow: '0 4px 12px rgba(138, 180, 248, 0.3)'
                   }}>
                <i className="ri-key-line text-white text-3xl"></i>
              </div>
              
              <h3 className="text-2xl font-bold mb-4" style={{ color: '#e8eaf0' }}>방 코드로 입장</h3>
              <p className="mb-6" style={{ color: '#9aa1ad' }}>
                친구가 공유한 방 코드를 입력하세요
              </p>
              
              <div className="mb-6">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  placeholder="방 코드 입력 (예: ABC123)"
                  className="w-full px-4 py-3 rounded-lg border text-center font-mono text-lg transition-all"
                  style={{ 
                    backgroundColor: '#141822', 
                    borderColor: '#2a2a33',
                    color: '#e8eaf0'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = '#8ab4f8';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(138,180,248,0.25)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = '#2a2a33';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={joinByCode}
                  className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap text-white"
                  style={{ 
                    background: 'linear-gradient(180deg, #1f6feb, #1b4fd8)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}
                >
                  방 입장하기
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap border"
                  style={{ 
                    backgroundColor: '#141822', 
                    borderColor: '#2a2a33',
                    color: '#e8eaf0'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = '#8ab4f8';
                    e.currentTarget.style.color = '#8ab4f8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#2a2a33';
                    e.currentTarget.style.color = '#e8eaf0';
                  }}
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Playing State */}
      {gameState === 'playing' && (
        <div className="flex h-[calc(100vh-88px)]">
          {/* Game board would go here */}
          <canvas
            ref={canvasRef}
            width={BOARD_PADDING * 2 + (BOARD_SIZE - 1) * CELL_SIZE}
            height={BOARD_PADDING * 2 + (BOARD_SIZE - 1) * CELL_SIZE}
            onClick={handleCanvasClick}
            className="border rounded-lg shadow-2xl cursor-pointer"
            style={{ 
              backgroundColor: '#DEB887',
              borderColor: '#2a2a33',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              cursor: currentPlayer !== playerColor ? 'wait' : 'pointer'
            }}
          />

          {/* Side Panel */}
          <div className="w-80 border-l p-6"
               style={{ 
                 backgroundColor: 'rgba(22,22,28,0.6)', 
                 borderColor: '#2a2a33'
               }}>
            <div className="space-y-6">
              {/* Timer */}
              <div className="rounded-lg p-4 border"
                   style={{ 
                     backgroundColor: '#141822', 
                     borderColor: '#2a2a33'
                   }}>
                <h4 className="font-semibold mb-2" style={{ color: '#e8eaf0' }}>타이머</h4>
                <div className="flex items-center justify-center">
                  <div className={`text-3xl font-mono ${timeLeft <= 10 ? 'text-red-400' : ''}`}
                       style={{ color: timeLeft <= 10 ? '#ef4444' : '#e8eaf0' }}>
                    {timeLeft}초
                  </div>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div 
                    className="h-2 rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${(timeLeft / 30) * 100}%`,
                      backgroundColor: timeLeft <= 10 ? '#ef4444' : '#8ab4f8'
                    }}></div>
                </div>
              </div>

              {/* Game Controls */}
              <div className="space-y-3">
                <button 
                  onClick={handlePass}
                  disabled={currentPlayer !== playerColor}
                  className="w-full py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap border"
                  style={{ 
                    backgroundColor: currentPlayer === playerColor ? '#141822' : '#0f1419', 
                    borderColor: currentPlayer === playerColor ? '#2a2a33' : '#1a1a1a',
                    color: currentPlayer === playerColor ? '#e8eaf0' : '#9aa1ad'
                  }}
                  onMouseEnter={(e) => {
                    if (currentPlayer === playerColor) {
                      e.currentTarget.style.borderColor = '#8ab4f8';
                      e.currentTarget.style.color = '#8ab4f8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPlayer === playerColor) {
                      e.currentTarget.style.borderColor = '#2a2a33';
                      e.currentTarget.style.color = '#e8eaf0';
                    }
                  }}
                >
                  수넘김
                </button>
                <button
                  onClick={handleDrawOffer}
                  disabled={gameState !== 'playing' || drawOffered}
                  className="w-full py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap border"
                  style={{
                    backgroundColor: gameState === 'playing' && !drawOffered ? '#141822' : '#0f1419',
                    borderColor: gameState === 'playing' && !drawOffered ? '#2a2a33' : '#1a1a1a',
                    color: gameState === 'playing' && !drawOffered ? '#e8eaf0' : '#9aa1ad',
                  }}
                  onMouseEnter={(e) => {
                    if (gameState === 'playing' && !drawOffered) {
                      e.currentTarget.style.borderColor = '#f59e0b';
                      e.currentTarget.style.color = '#f59e0b';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (gameState === 'playing' && !drawOffered) {
                      e.currentTarget.style.borderColor = '#2a2a33';
                      e.currentTarget.style.color = '#e8eaf0';
                    }
                  }}
                >
                  {drawOffered ? '무승부 제안됨' : '무승부 제안'}
                </button>
                <button 
                  onClick={handleResign}
                  className="w-full py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap text-white"
                  style={{ 
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  기권
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Draw Offer Modal */}
      {showDrawOffer && (
        <div
          className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div
            className="rounded-2xl p-8 w-full max-w-md border text-center"
            style={{
              backgroundColor: 'rgba(22,22,28,0.9)',
              borderColor: '#2a2a33',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
          >
            <div className="mb-6">
              <div className="text-6xl mb-4">🤝</div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#f59e0b' }}>
                무승부 제안
              </h3>
              <p className="mt-2" style={{ color: '#9aa1ad' }}>
                상대방이 무승부 제안을 검토 중입니다...
              </p>
            </div>
            <div className="flex items-center justify-center">
              <div
                className="animate-spin w-8 h-8 border-2 rounded-full"
                style={{
                  borderColor: '#f59e0b',
                  borderTopColor: 'transparent',
                }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResult && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4"
             style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-2xl p-8 w-full max-w-md border text-center"
               style={{ 
                 backgroundColor: 'rgba(22,22,28,0.9)', 
                 borderColor: '#2a2a33',
                 boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
               }}>
            <div className="mb-6">
              {winner === null ? (
                <>
                  <div className="text-6xl mb-4">🤝</div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: '#f59e0b' }}>
                    무승부!
                  </h3>
                  <p className="mt-2" style={{ color: '#9aa1ad' }}>
                    양쪽 모두 잘 싸웠습니다!
                  </p>
                </>
              ) : winner === playerColor ? (
                <>
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: '#10b981' }}>승리!</h3>
                  <p className="mt-2" style={{ color: '#9aa1ad' }}>축하합니다! 상대방을 이겼습니다.</p>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">😢</div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: '#ef4444' }}>패배</h3>
                  <p className="mt-2" style={{ color: '#9aa1ad' }}>아쉽네요. 다시 도전해보세요!</p>
                </>
              )}
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => {
                  setGameState('joining');
                  setBoard(Array(19).fill(null).map(() => Array(19).fill(null)));
                  setCurrentPlayer('black');
                  setGameLog([]);
                  setWinner(null);
                  setShowResult(false);
                  setPassCount(0);
                  setLastMove(null);
                  setCapturedStones({ black: 0, white: 0 });
                  setOpponent({ name: '', rating: 0 });
                  setTimeLeft(30);
                  setIsTimerActive(false);
                  setShowDrawOffer(false);
                  setDrawOffered(false);
                  setRoomCode('');
                  setInputRoomCode('');
                }}
                className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap text-white"
                style={{ 
                  background: 'linear-gradient(180deg, #1f6feb, #1b4fd8)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}
              >
                다른 방 찾기 🔁
              </button>
              <button 
                onClick={() => navigate('/')}
                className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap border"
                style={{ 
                  backgroundColor: '#141822', 
                  borderColor: '#2a2a33',
                  color: '#e8eaf0'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#8ab4f8';
                  e.currentTarget.style.color = '#8ab4f8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#2a2a33';
                  e.currentTarget.style.color = '#e8eaf0';
                }}
              >
                로비로 👋
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
