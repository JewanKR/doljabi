
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type Stone = 'black' | 'white' | null;
type GameState = 'playing' | 'finished' | 'setup';
type Difficulty = 'easy' | 'normal' | 'hard';

export default function OmokSinglePlay() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('setup');
  const [board, setBoard] = useState<Stone[][]>(Array(19).fill(null).map(() => Array(19).fill(null)));
  const [currentPlayer, setCurrentPlayer] = useState<Stone>('black');
  const [playerColor, setPlayerColor] = useState<Stone>('black');
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [gameLog, setGameLog] = useState<number[]>([]);
  const [winner, setWinner] = useState<Stone>(null);
  const [showResult, setShowResult] = useState(false);
  const [lastMove, setLastMove] = useState<{row: number, col: number} | null>(null);
  const [winningLine, setWinningLine] = useState<{row: number, col: number}[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(false);

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

    // Draw stones with enhanced 3D effect - 모든 착수된 돌을 화면에 표시
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
    if (gameState !== 'playing' || currentPlayer !== playerColor || isAiThinking) return;

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
    
    // 상태 업데이트 - 보드 상태를 먼저 업데이트
    setBoard(newBoard);
    setLastMove({row, col});
    setTimeLeft(30); // 타이머 리셋

    // 정수형 좌표로 로그 기록 (0-360)
    const coord = xyToCoord(col, row);
    setGameLog(prev => [...prev, coord]);

    // 승리 체크
    if (checkWin(newBoard, row, col, stone)) {
      setWinner(stone);
      setShowResult(true);
      setGameState('finished');
      setIsTimerActive(false);
      return;
    }

    // Switch player
    const nextPlayer = stone === 'black' ? 'white' : 'black';
    setCurrentPlayer(nextPlayer);

    // AI 턴 - 새로운 보드 상태를 사용
    if (nextPlayer !== playerColor) {
      setIsAiThinking(true);
      setTimeout(() => {
        makeAIMove(newBoard, nextPlayer);
        setIsAiThinking(false);
      }, 1000);
    }
  };

  const makeAIMove = (currentBoard: Stone[][], aiColor: Stone) => {
    let bestMove: {row: number, col: number} | null = null;

    // AI 난이도에 따른 후보 수 제한
    const maxCandidates = difficulty === 'easy' ? 20 : 100;
    const candidates: {row: number, col: number, score: number}[] = [];

    // 모든 빈 자리 평가
    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        if (!currentBoard[row][col]) {
          const score = evaluateMove(currentBoard, row, col, aiColor);
          candidates.push({row, col, score});
        }
      }
    }

    // 점수순으로 정렬하고 상위 후보만 선택
    candidates.sort((a, b) => b.score - a.score);
    const topCandidates = candidates.slice(0, maxCandidates);

    if (topCandidates.length > 0) {
      if (difficulty === 'easy') {
        // 쉬움: 상위 후보 중 랜덤 선택
        const randomIndex = Math.floor(Math.random() * Math.min(5, topCandidates.length));
        bestMove = topCandidates[randomIndex];
      } else {
        // 어려움: 최고 점수 선택
        bestMove = topCandidates[0];
      }
    }

    if (bestMove) {
      // AI 착수 - 현재 보드 상태를 직접 업데이트
      const newBoard = currentBoard.map((boardRow, rowIndex) => 
        boardRow.map((cell, colIndex) => {
          if (rowIndex === bestMove!.row && colIndex === bestMove!.col) {
            return aiColor;
          }
          return cell;
        })
      );
      
      // 상태 업데이트
      setBoard(newBoard);
      setLastMove({row: bestMove.row, col: bestMove.col});
      setTimeLeft(30);

      // 게임 로그 업데이트
      const coord = xyToCoord(bestMove.col, bestMove.row);
      setGameLog(prev => [...prev, coord]);

      // 승리 체크
      if (checkWin(newBoard, bestMove.row, bestMove.col, aiColor)) {
        setWinner(aiColor);
        setShowResult(true);
        setGameState('finished');
        setIsTimerActive(false);
        return;
      }

      // 플레이어 턴으로 변경
      setCurrentPlayer(playerColor);
    }
  };

  const evaluateMove = (board: Stone[][], row: number, col: number, color: Stone): number => {
    let score = 0;
    const opponent = color === 'black' ? 'white' : 'black';

    // 즉승 체크
    if (wouldWin(board, row, col, color)) {
      return 10000;
    }

    // 상대방 즉승 차단
    if (wouldWin(board, row, col, opponent)) {
      return 5000;
    }

    // 방향별 점수 계산
    const directions = [
      [0, 1], [1, 0], [1, 1], [1, -1]
    ];

    for (const [dx, dy] of directions) {
      const lineScore = evaluateLine(board, row, col, dx, dy, color);
      score += lineScore;
    }

    // 중앙 근처 가산점
    const centerDistance = Math.abs(row - 9) + Math.abs(col - 9); // 중앙점을 9,9로 변경
    score += Math.max(0, 18 - centerDistance);

    return score;
  };

  const wouldWin = (board: Stone[][], row: number, col: number, color: Stone): boolean => {
    const directions = [
      [0, 1], [1, 0], [1, 1], [1, -1]
    ];

    for (const [dx, dy] of directions) {
      let count = 1;
      
      // 양방향으로 같은 색 돌 개수 세기
      for (let i = 1; i < 5; i++) {
        const newRow = row + dx * i;
        const newCol = col + dy * i;
        if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE && board[newRow][newCol] === color) {
          count++;
        } else {
          break;
        }
      }
      
      for (let i = 1; i < 5; i++) {
        const newRow = row - dx * i;
        const newCol = col - dy * i;
        if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE && board[newRow][newCol] === color) {
          count++;
        } else {
          break;
        }
      }
      
      if (count >= 5) {
        return true;
      }
    }
    
    return false;
  };

  const evaluateLine = (board: Stone[][], row: number, col: number, dx: number, dy: number, color: Stone): number => {
    let score = 0;
    let consecutive = 0;
    let openEnds = 0;

    // 한 방향으로 탐색
    for (let i = -4; i <= 4; i++) {
      const newRow = row + dx * i;
      const newCol = col + dy * i;
      
      if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
        if (i === 0 || board[newRow][newCol] === color) {
          consecutive++;
        } else if (board[newRow][newCol] === null) {
          if (consecutive > 0) openEnds++;
          if (consecutive >= 2) {
            score += consecutive * consecutive * openEnds * 10;
          }
          consecutive = 0;
          openEnds = 1;
        } else {
          if (consecutive >= 2) {
            score += consecutive * consecutive * openEnds * 10;
          }
          consecutive = 0;
          openEnds = 0;
        }
      }
    }

    return score;
  };

  const checkWin = (board: Stone[][], row: number, col: number, stone: Stone): boolean => {
    const directions = [
      [0, 1], [1, 0], [1, 1], [1, -1]
    ];

    for (const [dx, dy] of directions) {
      const line: {row: number, col: number}[] = [{row, col}];
      
      // 양방향으로 같은 색 돌 찾기
      for (let i = 1; i < 5; i++) {
        const newRow = row + dx * i;
        const newCol = col + dy * i;
        if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE && board[newRow][newCol] === stone) {
          line.push({row: newRow, col: newCol});
        } else {
          break;
        }
      }
      
      for (let i = 1; i < 5; i++) {
        const newRow = row - dx * i;
        const newCol = col - dy * i;
        if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE && board[newRow][newCol] === stone) {
          line.unshift({row: newRow, col: newCol});
        } else {
          break;
        }
      }
      
      if (line.length >= 5) {
        setWinningLine(line);
        return true;
      }
    }
    
    return false;
  };

  const startGame = () => {
    const newBoard = Array(19).fill(null).map(() => Array(19).fill(null));
    setBoard(newBoard);
    setCurrentPlayer('black');
    setGameLog([]);
    setWinner(null);
    setShowResult(false);
    setLastMove(null);
    setWinningLine([]);
    setGameState('playing');
    setTimeLeft(30);
    setIsTimerActive(true);

    // 플레이어가 백돌이면 AI가 먼저 시작
    if (playerColor === 'white') {
      setIsAiThinking(true);
      setTimeout(() => {
        makeAIMove(newBoard, 'black');
        setIsAiThinking(false);
      }, 1000);
    }
  };

  const resetGame = () => {
    setGameState('setup');
    setBoard(Array(19).fill(null).map(() => Array(19).fill(null)));
    setCurrentPlayer('black');
    setGameLog([]);
    setWinner(null);
    setShowResult(false);
    setLastMove(null);
    setWinningLine([]);
    setTimeLeft(30);
    setIsTimerActive(false);
  };

  const handlePass = () => {
    setTimeLeft(30); // 타이머 리셋
    // 수넘김은 -1로 로그에 기록
    setGameLog(prev => [...prev, -1]);

    const nextPlayer = currentPlayer === 'black' ? 'white' : 'black';
    setCurrentPlayer(nextPlayer);

    if (nextPlayer !== playerColor) {
      setIsAiThinking(true);
      setTimeout(() => {
        makeAIMove(board, nextPlayer);
        setIsAiThinking(false);
      }, 1000);
    }
  };

  const handleResign = () => {
    setIsTimerActive(false);
    // 기권은 -2로 로그에 기록
    setGameLog(prev => [...prev, -2]);

    setWinner(currentPlayer === 'black' ? 'white' : 'black');
    setShowResult(true);
    setGameState('finished');
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
        
        <h2 className="text-xl font-semibold" style={{ color: '#e8eaf0' }}>오목 AI 대전</h2>
        
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

      {gameState === 'setup' && (
        <div className="flex items-center justify-center min-h-[calc(100vh-88px)] p-8">
          <div className="rounded-2xl p-8 w-full max-w-md border"
               style={{ 
                 backgroundColor: 'rgba(22,22,28,0.6)', 
                 borderColor: '#2a2a33',
                 boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
               }}>
            <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: '#e8eaf0' }}>게임 설정</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: '#e8eaf0' }}>보드 크기</label>
                <div className="rounded-lg p-3 text-center border"
                     style={{ 
                       backgroundColor: '#141822', 
                       borderColor: '#2a2a33',
                       color: '#e8eaf0'
                     }}>
                  19 × 19 (표준)
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: '#e8eaf0' }}>내 돌 색</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setPlayerColor('black')}
                    className={`p-3 rounded-lg border-2 transition-all cursor-pointer whitespace-nowrap ${
                      playerColor === 'black' 
                        ? 'border-blue-500 bg-blue-500/20' 
                        : ''
                    }`}
                    style={{ 
                      backgroundColor: playerColor === 'black' ? 'rgba(31, 111, 235, 0.2)' : '#141822',
                      borderColor: playerColor === 'black' ? '#8ab4f8' : '#2a2a33',
                      color: '#e8eaf0',
                      boxShadow: playerColor === 'black' ? '0 0 0 3px rgba(138,180,248,0.25)' : 'none'
                    }}
                  >
                    ⚫ 흑돌 (선공)
                  </button>
                  <button 
                    onClick={() => setPlayerColor('white')}
                    className={`p-3 rounded-lg border-2 transition-all cursor-pointer whitespace-nowrap ${
                      playerColor === 'white' 
                        ? 'border-blue-500 bg-blue-500/20' 
                        : ''
                    }`}
                    style={{ 
                      backgroundColor: playerColor === 'white' ? 'rgba(31, 111, 235, 0.2)' : '#141822',
                      borderColor: playerColor === 'white' ? '#8ab4f8' : '#2a2a33',
                      color: '#e8eaf0',
                      boxShadow: playerColor === 'white' ? '0 0 0 3px rgba(138,180,248,0.25)' : 'none'
                    }}
                  >
                    ⚪ 백돌 (후공)
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: '#e8eaf0' }}>AI 난이도</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => setDifficulty('easy')}
                    className={`p-3 rounded-lg border-2 transition-all cursor-pointer whitespace-nowrap ${
                      difficulty === 'easy' 
                        ? 'border-green-500 bg-green-500/20' 
                        : ''
                    }`}
                    style={{ 
                      backgroundColor: difficulty === 'easy' ? 'rgba(16, 185, 129, 0.2)' : '#141822',
                      borderColor: difficulty === 'easy' ? '#10b981' : '#2a2a33',
                      color: '#e8eaf0',
                      boxShadow: difficulty === 'easy' ? '0 0 0 3px rgba(16, 185, 129, 0.25)' : 'none'
                    }}
                  >
                    하 (쉬움)
                  </button>
                  <button 
                    onClick={() => setDifficulty('hard')}
                    className={`p-3 rounded-lg border-2 transition-all cursor-pointer whitespace-nowrap ${
                      difficulty === 'hard' 
                        ? 'border-red-500 bg-red-500/20' 
                        : ''
                    }`}
                    style={{ 
                      backgroundColor: difficulty === 'hard' ? 'rgba(239, 68, 68, 0.2)' : '#141822',
                      borderColor: difficulty === 'hard' ? '#ef4444' : '#2a2a33',
                      color: '#e8eaf0',
                      boxShadow: difficulty === 'hard' ? '0 0 0 3px rgba(239, 68, 68, 0.25)' : 'none'
                    }}
                  >
                    상 (어려움)
                  </button>
                </div>
              </div>
              
              <button 
                onClick={startGame}
                className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap text-white"
                style={{ 
                  background: 'linear-gradient(180deg, #1f6feb, #1b4fd8)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}
              >
                게임 시작
              </button>
            </div>
          </div>
        </div>
      )}

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
                  cursor: isAiThinking ? 'wait' : 'pointer'
                }}
              />
              
              {isAiThinking && (
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
                      <span style={{ color: '#e8eaf0' }}>AI 생각 중...</span>
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
                  {currentPlayer !== playerColor && <span style={{ color: '#8ab4f8' }}>(AI)</span>}
                  {currentPlayer === playerColor && <span style={{ color: '#10b981' }}>(나)</span>}
                </div>
                <div className="mt-2 text-sm" style={{ color: '#9aa1ad' }}>
                  {isAiThinking ? 'AI 생각 중...' : currentPlayer === playerColor ? '내 차례입니다.' : 'AI 차례입니다.'}
                </div>
              </div>

              {/* Game Controls */}
              <div className="space-y-3">
                <button 
                  onClick={handlePass}
                  disabled={currentPlayer !== playerColor || isAiThinking}
                  className="w-full py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap border"
                  style={{ 
                    backgroundColor: currentPlayer === playerColor && !isAiThinking ? '#141822' : '#0f1419', 
                    borderColor: currentPlayer === playerColor && !isAiThinking ? '#2a2a33' : '#1a1a1a',
                    color: currentPlayer === playerColor && !isAiThinking ? '#e8eaf0' : '#9aa1ad'
                  }}
                  onMouseEnter={(e) => {
                    if (currentPlayer === playerColor && !isAiThinking) {
                      e.currentTarget.style.borderColor = '#8ab4f8';
                      e.currentTarget.style.color = '#8ab4f8';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPlayer === playerColor && !isAiThinking) {
                      e.currentTarget.style.borderColor = '#2a2a33';
                      e.currentTarget.style.color = '#e8eaf0';
                    }
                  }}
                >
                  수넘김
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
                <button 
                  onClick={() => {
                    setGameLog(prev => [...prev, -3]); // 무승부 제안은 -3
                    alert('AI가 무승부를 수락했습니다.');
                    setWinner(null);
                    setShowResult(true);
                    setGameState('finished');
                    setIsTimerActive(false);
                  }}
                  className="w-full py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap border"
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
                  무승부 제안
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
                        {coord === -1 ? `${color}(수넘김)` : coord === -2 ? `${color}(기권)` : coord === -3 ? `${color}(무승부)` : `${color}(${coord})`}
                      </div>
                    );
                  })}
                </div>
              </div>
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
                  <h3 className="text-2xl font-bold mb-2" style={{ color: '#8ab4f8' }}>무승부</h3>
                  <p className="mt-2" style={{ color: '#9aa1ad' }}>무승부로 게임이 종료되었습니다.</p>
                </>
              ) : winner === playerColor ? (
                <>
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: '#10b981' }}>승리!</h3>
                  <p className="mt-2" style={{ color: '#9aa1ad' }}>축하합니다! AI를 이겼습니다.</p>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">🤖</div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: '#ef4444' }}>패배</h3>
                  <p className="mt-2" style={{ color: '#9aa1ad' }}>아쉽네요. 다시 도전해보세요!</p>
                </>
              )}
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={() => {
                  setShowResult(false);
                  resetGame();
                  startGame();
                }}
                className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap text-white"
                style={{ 
                  background: 'linear-gradient(180deg, #1f6feb, #1b4fd8)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}
              >
                한 판 더! 🔁
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
                그만하기 👋
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
