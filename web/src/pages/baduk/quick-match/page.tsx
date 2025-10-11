
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type Stone = 'black' | 'white' | null;
type GameState = 'matching' | 'waiting' | 'playing' | 'finished';

export default function BadukQuickMatch() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('matching');
  const [board, setBoard] = useState<Stone[][]>(Array(19).fill(null).map(() => Array(19).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState<Stone>('black');
  const [playerColor, setPlayerColor] = useState<Stone>('black');
  const [gameLog, setGameLog] = useState<number[]>([]);
  const [capturedStones, setCapturedStones] = useState({ black: 0, white: 0 });
  const [winner, setWinner] = useState<Stone>(null);
  const [showResult, setShowResult] = useState(false);
  const [passCount, setPassCount] = useState(0);
  const [lastMove, setLastMove] = useState<{row: number, col: number} | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [opponent, setOpponent] = useState({ name: '', rating: 0 });
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [showDrawOffer, setShowDrawOffer] = useState(false);
  const [drawOffered, setDrawOffered] = useState(false);

  const BOARD_SIZE = 19;
  const CELL_SIZE = 43;
  const BOARD_PADDING = 51;

  // 정수형 좌표 변환 함수들 (0부터 360까지)
  const xyToCoord = (x: number, y: number): number => {
    return y * BOARD_SIZE + x;
  };

  const coordToXY = (coord: number): {x: number, y: number} => {
    return {
      x: coord % BOARD_SIZE,
      y: Math.floor(coord / BOARD_SIZE)
    };
  };

  useEffect(() => {
    if (gameState === 'matching') {
      // 매칭 시뮬레이션
      const timer = setTimeout(() => {
        setOpponent({
          name: `플레이어${Math.floor(Math.random() * 1000)}`,
          rating: 1000 + Math.floor(Math.random() * 500)
        });
        setRoomCode(`BD${Math.random().toString(36).substr(2, 6).toUpperCase()}`);
        setPlayerColor(Math.random() > 0.5 ? 'black' : 'white');
        setGameState('waiting');

        // 게임 시작
        setTimeout(() => {
          setGameState('playing');
        }, 2000);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [gameState]);

  useEffect(() => {
    if (gameState === 'playing') {
      drawBoard();
      setIsTimerActive(true);
      setTimeLeft(30);
    }
  }, [board, gameState, lastMove]);

  // 타이머 효과
  useEffect(() => {
    let interval: NodeJS.Timeout;
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
    return () => clearInterval(interval);
  }, [isTimerActive, gameState, timeLeft]);

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

    // Draw stones with enhanced 3D effect - 모든 착수된 돌들을 화면에 표시
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const stone = board[row][col];
        if (stone) {
          const x = BOARD_PADDING + col * CELL_SIZE;
          const y = BOARD_PADDING + row * CELL_SIZE;
          const radius = 21; // 돌 크기

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

  const makeMove = (row: number, col: number, stone: Stone) => {
    if (!stone) return;

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
    
    // 상태 업데이트 - 보드 상태를 먼저 업데이트
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

    // 상대방 턴 시뮬레이션 - 새로운 보드 상태를 사용
    if (nextPlayer !== playerColor) {
      setTimeout(() => {
        simulateOpponentMove(newBoard, nextPlayer);
      }, 1500);
    }
  };

  const captureStones = (board: Stone[][], lastStone: Stone, lastRow: number, lastCol: number): number => {
    const opponent = lastStone === 'black' ? 'white' : 'black';
    let capturedCount = 0;
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    
    // 인접한 상대방 그룹들을 확인
    for (const [dx, dy] of directions) {
      const newRow = lastRow + dx;
      const newCol = lastCol + dy;
      
      if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE && 
          board[newRow][newCol] === opponent) {
        
        const group = getGroup(board, newRow, newCol, opponent);
        if (hasNoLiberties(board, group)) {
          // 그룹을 잡음
          for (const {row, col} of group) {
            board[row][col] = null;
            capturedCount++;
          }
        }
      }
    }
    
    // 잡힌 돌 개수 업데이트
    if (capturedCount > 0) {
      setCapturedStones(prev => ({
        ...prev,
        [lastStone]: prev[lastStone as keyof typeof prev] + capturedCount
      }));
    }
    
    return capturedCount;
  };

  const getGroup = (board: Stone[][], startRow: number, startCol: number, color: Stone): {row: number, col: number}[] => {
    const group: {row: number, col: number}[] = [];
    const visited = new Set<string>();
    const stack = [{row: startRow, col: startCol}];
    
    while (stack.length > 0) {
      const {row, col} = stack.pop()!;
      const key = `${row},${col}`;
      
      if (visited.has(key) || row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE || 
          board[row][col] !== color) {
        continue;
      }
      
      visited.add(key);
      group.push({row, col});
      
      // 인접한 같은 색 돌들 추가
      const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
      for (const [dx, dy] of directions) {
        stack.push({row: row + dx, col: col + dy});
      }
    }
    
    return group;
  };

  const hasNoLiberties = (board: Stone[][], group: {row: number, col: number}[]): boolean => {
    const directions = [[0, 1], [1, 0], [0, -1], [-1, 0]];
    
    for (const {row, col} of group) {
      for (const [dx, dy] of directions) {
        const newRow = row + dx;
        const newCol = col + dy;
        
        if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE && 
            board[newRow][newCol] === null) {
          return false; // 자유도가 있음
        }
      }
    }
    
    return true; // 자유도가 없음
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
      
      // 상대방 착수 - 현재 보드 상태를 직접 업데이트
      const newBoard = currentBoard.map((boardRow, rowIndex) => 
        boardRow.map((cell, colIndex) => {
          if (rowIndex === row && colIndex === col) {
            return opponentColor;
          }
          return cell;
        })
      );
      
      // 바둑 규칙: 상대방 돌 잡기
      const captured = captureStones(newBoard, opponentColor, row, col);
      
      // 상태 업데이트
      setBoard(newBoard);
      setLastMove({row, col});
      setPassCount(0);
      setTimeLeft(30);

      // 게임 로그 업데이트
      const coord = xyToCoord(col, row);
      setGameLog(prev => [...prev, coord]);

      // 플레이어 턴으로 변경
      setCurrentPlayer(playerColor);
    } else {
      handlePass();
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
        
        <h2 className="text-xl font-semibold" style={{ color: '#e8eaf0' }}>바둑 빠른 대국</h2>
        
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

      {/* Matching State */}
      {gameState === 'matching' && (
        <div className="flex items-center justify-center min-h-[calc(100vh-88px)] p-8">
          <div className="rounded-2xl p-8 w-full max-w-md border text-center"
               style={{ 
                 backgroundColor: 'rgba(22,22,28,0.6)', 
                 borderColor: '#2a2a33',
                 boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
               }}>
            <div className="mb-6">
              <div className="animate-spin w-16 h-16 border-4 rounded-full mx-auto mb-4"
                   style={{ 
                     borderColor: '#8ab4f8',
                     borderTopColor: 'transparent'
                   }}></div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#e8eaf0' }}>상대방 찾는 중...</h3>
              <p style={{ color: '#9aa1ad' }}>잠시만 기다려주세요</p>
            </div>
          </div>
        </div>
      )}

      {/* Waiting State */}
      {gameState === 'waiting' && (
        <div className="flex items-center justify-center min-h-[calc(100vh-88px)] p-8">
          <div className="rounded-2xl p-8 w-full max-w-md border text-center"
               style={{ 
                 backgroundColor: 'rgba(22,22,28,0.6)', 
                 borderColor: '#2a2a33',
                 boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
               }}>
            <div className="mb-6">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-2xl font-bold mb-4" style={{ color: '#e8eaf0' }}>매칭 완료!</h3>
              
              <div className="space-y-4">
                <div className="rounded-lg p-4 border"
                     style={{ 
                       backgroundColor: '#141822', 
                       borderColor: '#2a2a33'
                     }}>
                  <h4 className="font-semibold mb-2" style={{ color: '#e8eaf0' }}>상대방</h4>
                  <div className="flex items-center justify-center space-x-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center"
                         style={{ backgroundColor: '#8ab4f8' }}>
                      <i className="ri-user-fill text-white"></i>
                    </div>
                    <div>
                      <div style={{ color: '#e8eaf0' }}>{opponent.name}</div>
                      <div className="text-sm" style={{ color: '#9aa1ad' }}>레이팅: {opponent.rating}</div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg p-4 border"
                     style={{ 
                       backgroundColor: '#141822', 
                       borderColor: '#2a2a33'
                     }}>
                  <h4 className="font-semibold mb-2" style={{ color: '#e8eaf0' }}>방 정보</h4>
                  <div style={{ color: '#e8eaf0' }}>방 코드: {roomCode}</div>
                  <div className="text-sm mt-1" style={{ color: '#9aa1ad' }}>
                    내 돌: {playerColor === 'black' ? '⚫ 흑돌 (선공)' : '⚪ 백돌 (후공)'}
                  </div>
                </div>
              </div>
              
              <p className="mt-4" style={{ color: '#9aa1ad' }}>곧 게임이 시작됩니다...</p>
            </div>
          </div>
        </div>
      )}

      {/* Playing State */}
      {gameState === 'playing' && (
        <div className="flex h-[calc(100vh-88px)]">
          {/* Game Board */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="relative">
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
              
              {currentPlayer !== playerColor && (
                <div className="absolute inset-0 rounded-lg flex items-center justify-center"
                     style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <div className="px-6 py-3 rounded-lg border"
                       style={{ 
                         backgroundColor: 'rgba(22,22,28,0.9)', 
                         borderColor: '#2a2a33'
                       }}>
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin w-5 h-5 border-2 rounded-full"
                           style={{ 
                             borderColor: '#8ab4f8',
                             borderTopColor: 'transparent'
                           }}></div>
                      <span style={{ color: '#e8eaf0' }}>상대방 차례...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

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

              {/* Opponent Info */}
              <div className="rounded-lg p-4 border"
                   style={{ 
                     backgroundColor: '#141822', 
                     borderColor: '#2a2a33'
                   }}>
                <h4 className="font-semibold mb-2" style={{ color: '#e8eaf0' }}>상대방</h4>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center"
                       style={{ backgroundColor: '#8ab4f8' }}>
                    <i className="ri-user-fill text-white"></i>
                  </div>
                  <div>
                    <div style={{ color: '#e8eaf0' }}>{opponent.name}</div>
                    <div className="text-sm" style={{ color: '#9aa1ad' }}>레이팅: {opponent.rating}</div>
                  </div>
                </div>
              </div>

              {/* Current Player */}
              <div className="rounded-lg p-4 border"
                   style={{ 
                     backgroundColor: '#141822', 
                     borderColor: '#2a2a33'
                   }}>
                <h4 className="font-semibold mb-2" style={{ color: '#e8eaf0' }}>현재 차례</h4>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{currentPlayer === 'black' ? '⚫' : '⚪'}</span>
                  <span style={{ color: '#e8eaf0' }}>{currentPlayer === 'black' ? '흑돌' : '백돌'}</span>
                  {currentPlayer !== playerColor && <span style={{ color: '#8ab4f8' }}>(상대방)</span>}
                  {currentPlayer === playerColor && <span style={{ color: '#10b981' }}>(나)</span>}
                </div>
                <div className="mt-2 text-sm" style={{ color: '#9aa1ad' }}>
                  {currentPlayer === playerColor ? '내 차례입니다.' : '상대방 차례입니다.'}
                </div>
              </div>

              {/* Captured Stones */}
              <div className="rounded-lg p-4 border"
                   style={{ 
                     backgroundColor: '#141822', 
                     borderColor: '#2a2a33'
                   }}>
                <h4 className="font-semibold mb-2" style={{ color: '#e8eaf0' }}>잡은 돌</h4>
                <div className="flex justify-between">
                  <div className="flex items-center space-x-2">
                    <span>⚫</span>
                    <span style={{ color: '#e8eaf0' }}>{capturedStones.black}개</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>⚪</span>
                    <span style={{ color: '#e8eaf0' }}>{capturedStones.white}개</span>
                  </div>
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

              {/* Game Log */}
              <div className="rounded-lg p-4 border"
                   style={{ 
                     backgroundColor: '#141822', 
                     borderColor: '#2a2a33'
                   }}>
                <h4 className="font-semibold mb-3" style={{ color: '#e8eaf0' }}>게임 로그</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto text-sm font-mono">
                  {gameLog.map((coord, index) => {
                    const isBlackMove = index % 2 === 0;
                    const color = isBlackMove ? 'B' : 'W';
                    return (
                      <div key={index} style={{ color: '#9aa1ad' }}>
                        {coord === -1 ? `${color}(수넘김)` : coord === -2 ? `${color}(기권)` : `${color}(${coord})`}
                      </div>
                    );
                  })}
                </div>
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
                  setGameState('matching');
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
                }}
                className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap text-white"
                style={{ 
                  background: 'linear-gradient(180deg, #1f6feb, #1b4fd8)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}
              >
                다시 매칭 🔁
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
