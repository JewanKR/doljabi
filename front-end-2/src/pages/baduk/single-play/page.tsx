import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type Stone = 'black' | 'white' | null;
type Board = Stone[][];
type GameState = 'playing' | 'finished' | 'setup';
type Difficulty = 'easy' | 'normal' | 'hard';
type BoardSize = 9 | 13 | 19;

export default function BadukSinglePlay() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<GameState>('setup');
  const [boardSize, setBoardSize] = useState<BoardSize>(19);
  const [board, setBoard] = useState<Board>(
    Array(19)
      .fill(null)
      .map(() => Array(19).fill(null))
  );
  const [currentPlayer, setCurrentPlayer] = useState<Stone>('black');
  const [playerColor, setPlayerColor] = useState<Stone>('black');
  const [gameLog, setGameLog] = useState<number[]>([]);
  const [capturedStones, setCapturedStones] = useState({ black: 0, white: 0 });
  const [winner, setWinner] = useState<Stone>(null);
  const [showResult, setShowResult] = useState(false);
  const [passCount, setPassCount] = useState(0);
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('normal');
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [showDrawOffer, setShowDrawOffer] = useState(false);
  const [drawOffered, setDrawOffered] = useState(false);

  const CELL_SIZE = boardSize === 9 ? 60 : boardSize === 13 ? 50 : 43;
  const BOARD_PADDING = 51;

  // 스타일 상수 정의
  const BACKGROUND_COLOR = '#0b0c10';
  const BORDER_COLOR = '#2a2a33';
  const CARD_BACKGROUND_COLOR = 'rgba(22,22,28,0.6)';
  const BUTTON_BACKGROUND_COLOR = '#141822';
  const TEXT_COLOR = '#e8eaf0';
  const TEXT_SECONDARY_COLOR = '#9aa1ad';
  const PRIMARY_COLOR = '#1f6feb';
  const PRIMARY_HOVER_COLOR = '#8ab4f8';
  const SUCCESS_COLOR = '#10b981';
  const WARNING_COLOR = '#f59e0b';
  const DANGER_COLOR = '#ef4444';

  const PRIMARY_GRADIENT = 'linear-gradient(135deg, #1f6feb 0%, #1b4fd8 100%)';
  const PRIMARY_BUTTON_GRADIENT = 'linear-gradient(180deg, #1f6feb, #1b4fd8)';
  const SUCCESS_GRADIENT = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
  const DANGER_GRADIENT = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';

  const PRIMARY_SHADOW = '0 4px 12px rgba(31, 111, 235, 0.3)';
  const CARD_SHADOW = '0 8px 32px rgba(0,0,0,0.3)';
  const BUTTON_SHADOW = '0 2px 8px rgba(0,0,0,0.3)';
  const BOARD_SHADOW = '0 20px 40px rgba(0,0,0,0.4)';
  const MODAL_SHADOW = '0 20px 40px rgba(0,0,0,0.4)';

  const xyToCoord = (x: number, y: number): number => {
    return y * boardSize + x;
  };

  const coordToXY = (coord: number): { x: number; y: number } => {
    return {
      x: coord % boardSize,
      y: Math.floor(coord / boardSize),
    };
  };

  useEffect(() => {
    if (gameState === 'playing') {
      drawBoard();
      setIsTimerActive(true);
      setTimeLeft(30);
    }
  }, [board, gameState, lastMove, boardSize]);

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

    for (let i = 0; i < boardSize; i++) {
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(BOARD_PADDING + i * CELL_SIZE, BOARD_PADDING);
      ctx.lineTo(BOARD_PADDING + i * CELL_SIZE, BOARD_PADDING + (boardSize - 1) * CELL_SIZE);
      ctx.stroke();

      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(BOARD_PADDING, BOARD_PADDING + i * CELL_SIZE);
      ctx.lineTo(BOARD_PADDING + (boardSize - 1) * CELL_SIZE, BOARD_PADDING + i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw star points (화점) - only for 19x19 board
    if (boardSize === 19) {
      const starPoints = [
        [3, 3],
        [3, 9],
        [3, 15],
        [9, 3],
        [9, 9],
        [9, 15],
        [15, 3],
        [15, 9],
        [15, 15],
      ];

      ctx.fillStyle = '#8B4513';
      starPoints.forEach(([row, col]) => {
        const x = BOARD_PADDING + col * CELL_SIZE;
        const y = BOARD_PADDING + row * CELL_SIZE;
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      });
    } else if (boardSize === 13) {
      const starPoints = [
        [3, 3],
        [3, 9],
        [6, 6],
        [9, 3],
        [9, 9],
      ];

      ctx.fillStyle = '#8B4513';
      starPoints.forEach(([row, col]) => {
        const x = BOARD_PADDING + col * CELL_SIZE;
        const y = BOARD_PADDING + row * CELL_SIZE;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    } else if (boardSize === 9) {
      const starPoints = [
        [2, 2],
        [2, 6],
        [4, 4],
        [6, 2],
        [6, 6],
      ];

      ctx.fillStyle = '#8B4513';
      starPoints.forEach(([row, col]) => {
        const x = BOARD_PADDING + col * CELL_SIZE;
        const y = BOARD_PADDING + row * CELL_SIZE;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, 2 * Math.PI);
        ctx.fill();
      });
    }

    // 착수된 돌 그리기
    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        const stone = board[row][col];
        if (stone) {
          const x = BOARD_PADDING + col * CELL_SIZE;
          const y = BOARD_PADDING + row * CELL_SIZE;
          const radius = Math.min(21, CELL_SIZE * 0.4);

          // 돌에 라디얼 그라디언트 효과 적용
          const gradient = ctx.createRadialGradient(
            x - radius * 0.35,
            y - radius * 0.35,
            radius * 0.1,
            x,
            y,
            radius
          );

          if (stone === 'black') {
            gradient.addColorStop(0, '#666');
            gradient.addColorStop(0.2, '#444');
            gradient.addColorStop(0.5, '#222');
            gradient.addColorStop(0.8, '#111');
            gradient.addColorStop(1, '#000');
          } else {
            gradient.addColorStop(0, '#fff');
            gradient.addColorStop(0.2, '#f8f8f8');
            gradient.addColorStop(0.5, '#f0f0f0');
            gradient.addColorStop(0.8, '#e8e8e8');
            gradient.addColorStop(1, '#ddd');
          }

          // 돌 채우기
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.fill();

          // 돌 테두리
          ctx.strokeStyle = stone === 'black' ? '#000' : '#aaa';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, 2 * Math.PI);
          ctx.stroke();

          // 추가 하이라이트 효과
          const highlight = ctx.createRadialGradient(
            x - radius * 0.4,
            y - radius * 0.4,
            0,
            x - radius * 0.4,
            y - radius * 0.4,
            radius * 0.3
          );
          if (stone === 'black') {
            highlight.addColorStop(0, 'rgba(255,255,255,0.3)');
            highlight.addColorStop(1, 'rgba(255,255,255,0)');
          } else {
            highlight.addColorStop(0, 'rgba(255,255,255,0.8)');
            highlight.addColorStop(1, 'rgba(255,255,255,0)');
          }
          ctx.fillStyle = highlight;
          ctx.fill();
        }
      }
    }

    // 마지막 착수점 표시
    if (lastMove) {
      const x = BOARD_PADDING + lastMove.col * CELL_SIZE;
      const y = BOARD_PADDING + lastMove.row * CELL_SIZE;

      ctx.fillStyle = '#ff6b6b';
      ctx.beginPath();
      ctx.arc(x, y, Math.max(3, CELL_SIZE * 0.12), 0, 2 * Math.PI);
      ctx.fill();
    }
  };

  const makeMove = (row: number, col: number, stone: Stone) => {
    if (!stone) return;
    if (gameState !== 'playing') return;
    if (board[row][col]) return;

    const newBoard = board.map((boardRow, rowIndex) =>
      boardRow.map((cell, colIndex) => {
        if (rowIndex === row && colIndex === col) {
          return stone;
        }
        return cell;
      })
    );

    captureStones(newBoard, stone, row, col);

    setBoard(newBoard);
    setLastMove({ row, col });
    setTimeLeft(30);

    const coord = xyToCoord(col, row);
    setGameLog((prev) => [...prev, coord]);

    const nextPlayer = stone === 'black' ? 'white' : 'black';
    setCurrentPlayer(nextPlayer);

    if (nextPlayer !== playerColor) {
      setIsAiThinking(true);
      setTimeout(() => {
        makeAIMove(newBoard, nextPlayer);
        setIsAiThinking(false);
      }, 1500);
    }
  };

  const captureStones = (board: Board, lastStone: Stone, lastRow: number, lastCol: number): number => {
    const opponent = lastStone === 'black' ? 'white' : 'black';
    let capturedCount = 0;
    const directions = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ];

    for (const [dx, dy] of directions) {
      const newRow = lastRow + dx;
      const newCol = lastCol + dy;

      if (
        newRow >= 0 &&
        newRow < boardSize &&
        newCol >= 0 &&
        newCol < boardSize &&
        board[newRow][newCol] === opponent
      ) {
        const group = getGroup(board, newRow, newCol, opponent);
        if (hasNoLiberties(board, group)) {
          for (const { row, col } of group) {
            board[row][col] = null;
            capturedCount++;
          }
        }
      }
    }

    if (capturedCount > 0) {
      setCapturedStones((prev) => ({
        ...prev,
        [lastStone]: (prev[lastStone as keyof typeof prev] as number) + capturedCount,
      }));
    }

    return capturedCount;
  };

  const getGroup = (
    board: Board,
    startRow: number,
    startCol: number,
    color: Stone
  ): { row: number; col: number }[] => {
    const group: { row: number; col: number }[] = [];
    const visited = new Set<string>();
    const stack = [{ row: startRow, col: startCol }];

    while (stack.length > 0) {
      const { row, col } = stack.pop()!;
      const key = `${row},${col}`;

      if (
        visited.has(key) ||
        row < 0 ||
        row >= boardSize ||
        col < 0 ||
        col >= boardSize ||
        board[row][col] !== color
      ) {
        continue;
      }

      visited.add(key);
      group.push({ row, col });

      const directions = [
        [0, 1],
        [1, 0],
        [0, -1],
        [-1, 0],
      ];
      for (const [dx, dy] of directions) {
        const newRow = row + dx;
        const newCol = col + dy;
        const newKey = `${newRow},${newCol}`;

        if (!visited.has(newKey)) {
          stack.push({ row: newRow, col: newCol });
        }
      }
    }

    return group;
  };

  const hasNoLiberties = (board: Board, group: { row: number; col: number }[]): boolean => {
    const directions = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ];

    for (const { row, col } of group) {
      for (const [dx, dy] of directions) {
        const newRow = row + dx;
        const newCol = col + dy;

        if (
          newRow >= 0 &&
          newRow < boardSize &&
          newCol >= 0 &&
          newCol < boardSize &&
          board[newRow][newCol] === null
        ) {
          return false;
        }
      }
    }

    return true;
  };

  const makeAIMove = (currentBoard: Board, aiColor: Stone) => {
    if (gameState !== 'playing') return;

    const emptySpots: { row: number; col: number; score: number }[] = [];

    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        if (!currentBoard[row][col]) {
          let score = Math.random() * 10;

          const centerDistance = Math.abs(row - Math.floor(boardSize / 2)) + Math.abs(col - Math.floor(boardSize / 2));
          score += Math.max(0, boardSize - centerDistance);

          const directions = [
            [0, 1],
            [1, 0],
            [0, -1],
            [-1, 0],
          ];
          for (const [dx, dy] of directions) {
            const newRow = row + dx;
            const newCol = col + dy;
            if (
              newRow >= 0 &&
              newRow < boardSize &&
              newCol >= 0 &&
              newCol < boardSize &&
              currentBoard[newRow][newCol]
            ) {
              score += 5;
            }
          }

          emptySpots.push({ row, col, score });
        }
      }
    }

    if (emptySpots.length > 0) {
      emptySpots.sort((a, b) => b.score - a.score);
      const topCandidates = emptySpots.slice(0, Math.min(10, emptySpots.length));
      const randomIndex = Math.floor(Math.random() * topCandidates.length);
      const { row, col } = topCandidates[randomIndex];

      const newBoard = currentBoard.map((boardRow, rowIndex) =>
        boardRow.map((cell, colIndex) => {
          if (rowIndex === row && colIndex === col) {
            return aiColor;
          }
          return cell;
        })
      );

      captureStones(newBoard, aiColor, row, col);

      setBoard(newBoard);
      setLastMove({ row, col });
      setTimeLeft(30);

      const coord = xyToCoord(col, row);
      setGameLog((prev) => [...prev, coord]);

      setCurrentPlayer(playerColor);
    } else {
      handlePass();
    }
  };

  const handlePass = () => {
    if (gameState !== 'playing') return;

    const newPassCount = passCount + 1;
    setPassCount(newPassCount);
    setTimeLeft(30);

    setGameLog((prev) => [...prev, -1]);

    if (newPassCount >= 2) {
      endGame();
    } else {
      const nextPlayer = currentPlayer === 'black' ? 'white' : 'black';
      setCurrentPlayer(nextPlayer);

      if (nextPlayer !== playerColor) {
        setTimeout(() => {
          makeAIMove(board, nextPlayer);
        }, 1000);
      }
    }
  };

  const handleDrawOffer = () => {
    setDrawOffered(true);
    setShowDrawOffer(true);

    setTimeout(() => {
      const aiAccepts = Math.random() > 0.5;
      if (aiAccepts) {
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

  const endGame = () => {
    setIsTimerActive(false);
    let blackScore = 0;
    let whiteScore = 0;

    for (let row = 0; row < boardSize; row++) {
      for (let col = 0; col < boardSize; col++) {
        if (board[row][col] === 'black') blackScore++;
        if (board[row][col] === 'white') whiteScore++;
      }
    }

    blackScore += capturedStones.black;
    whiteScore += capturedStones.white;
    whiteScore += 6.5;

    setWinner(blackScore > whiteScore ? 'black' : 'white');
    setShowResult(true);
    setGameState('finished');
  };

  const handleResign = () => {
    if (gameState !== 'playing') return;

    setIsTimerActive(false);
    setGameLog((prev) => [...prev, -2]);

    setWinner(currentPlayer === 'black' ? 'white' : 'black');
    setShowResult(true);
    setGameState('finished');
  };

  const startGame = () => {
    const newBoard = Array(boardSize)
      .fill(null)
      .map(() => Array(boardSize).fill(null));
    setBoard(newBoard);
    setCurrentPlayer('black');
    setGameLog([]);
    setWinner(null);
    setShowResult(false);
    setPassCount(0);
    setLastMove(null);
    setCapturedStones({ black: 0, white: 0 });
    setGameState('playing');
    setTimeLeft(30);
    setIsTimerActive(true);

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
    setBoard(Array(boardSize).fill(null).map(() => Array(boardSize).fill(null)));
    setCurrentPlayer('black');
    setGameLog([]);
    setWinner(null);
    setShowResult(false);
    setPassCount(0);
    setLastMove(null);
    setCapturedStones({ black: 0, white: 0 });
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

    if (
      col >= 0 &&
      col < boardSize &&
      row >= 0 &&
      row < boardSize &&
      !board[row][col]
    ) {
      makeMove(row, col, playerColor);
    }
  };

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: BACKGROUND_COLOR }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-8 py-6 border-b"
        style={{ borderColor: BORDER_COLOR }}
      >
        <button onClick={() => navigate('/')} className="flex items-center space-x-3 cursor-pointer">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: PRIMARY_GRADIENT,
              boxShadow: PRIMARY_SHADOW,
            }}
          >
            <i className="ri-game-fill text-white text-xl"></i>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Doljabi
          </h1>
        </button>

        <h2 className="text-xl font-semibold" style={{ color: TEXT_COLOR }}>
          바둑 AI 대전
        </h2>

        <button
          onClick={() => navigate('/')}
          className="px-6 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap border"
          style={{
            backgroundColor: BUTTON_BACKGROUND_COLOR,
            borderColor: BORDER_COLOR,
            color: TEXT_COLOR,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = PRIMARY_HOVER_COLOR;
            e.currentTarget.style.color = PRIMARY_HOVER_COLOR;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = BORDER_COLOR;
            e.currentTarget.style.color = TEXT_COLOR;
          }}
        >
          로비로
        </button>
      </header>

      {gameState === 'setup' ? (
        <div className="flex items-center justify-center min-h-[calc(100vh-88px)] p-8">
          <div className="rounded-2xl p-8 w-full max-w-md border"
               style={{ 
                 backgroundColor: CARD_BACKGROUND_COLOR, 
                 borderColor: BORDER_COLOR,
                 boxShadow: CARD_SHADOW
               }}>
            <h3 className="text-2xl font-bold mb-6 text-center" style={{ color: TEXT_COLOR }}>게임 설정</h3>
            
            <div className="space-y-6">
              {/* Board Size Settings */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: TEXT_COLOR }}>보드 크기</label>
                <div className="grid grid-cols-3 gap-3">
                  {([9, 13, 19] as BoardSize[]).map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        setBoardSize(size);
                        setBoard(Array(size).fill(null).map(() => Array(size).fill(null)));
                      }}
                      className={`p-3 rounded-lg border-2 transition-all cursor-pointer whitespace-nowrap ${
                        boardSize === size ? 'border-blue-500 bg-blue-500/20' : ''
                      }`}
                      style={{
                        backgroundColor: boardSize === size ? 'rgba(31, 111, 235, 0.2)' : BUTTON_BACKGROUND_COLOR,
                        borderColor: boardSize === size ? PRIMARY_HOVER_COLOR : BORDER_COLOR,
                        color: TEXT_COLOR,
                        boxShadow: boardSize === size ? '0 0 0 3px rgba(138,180,248,0.25)' : 'none'
                      }}
                    >
                      {size}×{size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Player Color Settings */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: TEXT_COLOR }}>내 돌 색</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPlayerColor('black')}
                    className={`p-3 rounded-lg border-2 transition-all cursor-pointer whitespace-nowrap ${
                      playerColor === 'black' ? 'border-blue-500 bg-blue-500/20' : ''
                    }`}
                    style={{
                      backgroundColor: playerColor === 'black' ? 'rgba(31, 111, 235, 0.2)' : BUTTON_BACKGROUND_COLOR,
                      borderColor: playerColor === 'black' ? PRIMARY_HOVER_COLOR : BORDER_COLOR,
                      color: TEXT_COLOR,
                      boxShadow: playerColor === 'black' ? '0 0 0 3px rgba(138,180,248,0.25)' : 'none'
                    }}
                  >
                    ⚫ 흑돌 (선공)
                  </button>
                  <button
                    onClick={() => setPlayerColor('white')}
                    className={`p-3 rounded-lg border-2 transition-all cursor-pointer whitespace-nowrap ${
                      playerColor === 'white' ? 'border-blue-500 bg-blue-500/20' : ''
                    }`}
                    style={{
                      backgroundColor: playerColor === 'white' ? 'rgba(31, 111, 235, 0.2)' : BUTTON_BACKGROUND_COLOR,
                      borderColor: playerColor === 'white' ? PRIMARY_HOVER_COLOR : BORDER_COLOR,
                      color: TEXT_COLOR,
                      boxShadow: playerColor === 'white' ? '0 0 0 3px rgba(138,180,248,0.25)' : 'none'
                    }}
                  >
                    ⚪ 백돌 (후공)
                  </button>
                </div>
              </div>

              {/* Difficulty Settings */}
              <div>
                <label className="block text-sm font-medium mb-3" style={{ color: TEXT_COLOR }}>AI 난이도</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['easy', 'normal', 'hard'] as Difficulty[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      className={`p-3 rounded-lg border-2 transition-all cursor-pointer whitespace-nowrap ${
                        difficulty === level ? 'border-green-500 bg-green-500/20' : ''
                      }`}
                      style={{
                        backgroundColor: difficulty === level ? 
                          (level === 'easy' ? 'rgba(16, 185, 129, 0.2)' : 
                           level === 'normal' ? 'rgba(59, 130, 246, 0.2)' : 
                           'rgba(239, 68, 68, 0.2)') : BUTTON_BACKGROUND_COLOR,
                        borderColor: difficulty === level ? 
                          (level === 'easy' ? SUCCESS_COLOR : 
                           level === 'normal' ? '#3b82f6' : 
                           DANGER_COLOR) : BORDER_COLOR,
                        color: TEXT_COLOR,
                        boxShadow: difficulty === level ? 
                          (level === 'easy' ? '0 0 0 3px rgba(16,185,129,0.25)' : 
                           level === 'normal' ? '0 0 0 3px rgba(59,130,246,0.25)' : 
                           '0 0 0 3px rgba(239,68,68,0.25)') : 'none'
                      }}
                    >
                      {level === 'easy' ? '쉬움' : level === 'normal' ? '보통' : '어려움'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Game Rules */}
              <div className="rounded-lg p-4 border"
                   style={{ 
                     backgroundColor: BUTTON_BACKGROUND_COLOR, 
                     borderColor: BORDER_COLOR
                   }}>
                <h4 className="font-semibold mb-2" style={{ color: TEXT_COLOR }}>게임 규칙</h4>
                <div className="text-sm space-y-1" style={{ color: TEXT_SECONDARY_COLOR }}>
                  <p>• 보드 크기: {boardSize}×{boardSize}</p>
                  <p>• 흑돌이 먼저 시작합니다</p>
                  <p>• 상대방 돌을 둘러싸면 잡을 수 있습니다</p>
                  <p>• 양쪽 모두 수넘김하면 게임이 종료됩니다</p>
                </div>
              </div>

              <button
                onClick={startGame}
                className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap text-white"
                style={{ 
                  background: PRIMARY_BUTTON_GRADIENT,
                  boxShadow: BUTTON_SHADOW
                }}
              >
                게임 시작
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-[calc(100vh-88px)]">
          {/* Game Board */}
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="relative">
              <canvas
                ref={canvasRef}
                width={BOARD_PADDING * 2 + (boardSize - 1) * CELL_SIZE}
                height={BOARD_PADDING * 2 + (boardSize - 1) * CELL_SIZE}
                onClick={handleCanvasClick}
                className="border rounded-lg shadow-2xl cursor-pointer"
                style={{ 
                  backgroundColor: '#DEB887',
                  borderColor: BORDER_COLOR,
                  boxShadow: BOARD_SHADOW,
                  cursor: currentPlayer !== playerColor || isAiThinking ? 'wait' : 'pointer'
                }}
              />
              
              {(currentPlayer !== playerColor || isAiThinking) && (
                <div className="absolute inset-0 rounded-lg flex items-center justify-center"
                     style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                  <div className="px-6 py-3 rounded-lg border"
                       style={{ 
                         backgroundColor: 'rgba(22,22,28,0.9)', 
                         borderColor: BORDER_COLOR
                       }}>
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin w-5 h-5 border-2 rounded-full"
                           style={{ 
                             borderColor: PRIMARY_HOVER_COLOR,
                             borderTopColor: 'transparent'
                           }}></div>
                      <span style={{ color: TEXT_COLOR }}>
                        {isAiThinking ? 'AI 생각 중...' : 'AI 차례...'}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Side Panel */}
          <div className="w-80 border-l p-6"
               style={{ 
                 backgroundColor: CARD_BACKGROUND_COLOR, 
                 borderColor: BORDER_COLOR
               }}>
            <div className="space-y-6">
              {/* Current Player */}
              <div className="rounded-lg p-4 border"
                   style={{ 
                     backgroundColor: BUTTON_BACKGROUND_COLOR, 
                     borderColor: BORDER_COLOR
                   }}>
                <h4 className="font-semibold mb-2" style={{ color: TEXT_COLOR }}>현재 차례</h4>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{currentPlayer === 'black' ? '⚫' : '⚪'}</span>
                  <span style={{ color: TEXT_COLOR }}>{currentPlayer === 'black' ? '흑돌' : '백돌'}</span>
                  {currentPlayer !== playerColor && <span style={{ color: PRIMARY_HOVER_COLOR }}>(AI)</span>}
                  {currentPlayer === playerColor && <span style={{ color: SUCCESS_COLOR }}>(나)</span>}
                </div>
                <div className="mt-2 text-sm" style={{ color: TEXT_SECONDARY_COLOR }}>
                  {currentPlayer === playerColor ? '내 차례입니다.' : 'AI 차례입니다.'}
                </div>
              </div>

              {/* Captured Stones */}
              <div className="rounded-lg p-4 border"
                   style={{ 
                     backgroundColor: BUTTON_BACKGROUND_COLOR, 
                     borderColor: BORDER_COLOR
                   }}>
                <h4 className="font-semibold mb-2" style={{ color: TEXT_COLOR }}>잡은 돌</h4>
                <div className="flex justify-between">
                  <div className="flex items-center space-x-2">
                    <span>⚫</span>
                    <span style={{ color: TEXT_COLOR }}>{capturedStones.black}개</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span>⚪</span>
                    <span style={{ color: TEXT_COLOR }}>{capturedStones.white}개</span>
                  </div>
                </div>
              </div>

              {/* Game Controls */}
              <div className="space-y-3">
                <button 
                  onClick={handlePass}
                  disabled={currentPlayer !== playerColor || isAiThinking}
                  className="w-full py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap border"
                  style={{ 
                    backgroundColor: currentPlayer === playerColor && !isAiThinking ? BUTTON_BACKGROUND_COLOR : '#0f1419', 
                    borderColor: currentPlayer === playerColor && !isAiThinking ? BORDER_COLOR : '#1a1a1a',
                    color: currentPlayer === playerColor && !isAiThinking ? TEXT_COLOR : TEXT_SECONDARY_COLOR
                  }}
                  onMouseEnter={(e) => {
                    if (currentPlayer === playerColor && !isAiThinking) {
                      e.currentTarget.style.borderColor = PRIMARY_HOVER_COLOR;
                      e.currentTarget.style.color = PRIMARY_HOVER_COLOR;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentPlayer === playerColor && !isAiThinking) {
                      e.currentTarget.style.borderColor = BORDER_COLOR;
                      e.currentTarget.style.color = TEXT_COLOR;
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
                    backgroundColor: gameState === 'playing' && !drawOffered ? BUTTON_BACKGROUND_COLOR : '#0f1419',
                    borderColor: gameState === 'playing' && !drawOffered ? BORDER_COLOR : '#1a1a1a',
                    color: gameState === 'playing' && !drawOffered ? TEXT_COLOR : TEXT_SECONDARY_COLOR,
                  }}
                  onMouseEnter={(e) => {
                    if (gameState === 'playing' && !drawOffered) {
                      e.currentTarget.style.borderColor = WARNING_COLOR;
                      e.currentTarget.style.color = WARNING_COLOR;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (gameState === 'playing' && !drawOffered) {
                      e.currentTarget.style.borderColor = BORDER_COLOR;
                      e.currentTarget.style.color = TEXT_COLOR;
                    }
                  }}
                >
                  {drawOffered ? '무승부 제안됨' : '무승부 제안'}
                </button>
                <button 
                  onClick={handleResign}
                  className="w-full py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap text-white"
                  style={{ 
                    background: DANGER_GRADIENT,
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.3)'
                  }}
                >
                  기권
                </button>
              </div>

              {/* Game Log */}
              <div className="rounded-lg p-4 border"
                   style={{ 
                     backgroundColor: BUTTON_BACKGROUND_COLOR, 
                     borderColor: BORDER_COLOR
                   }}>
                <h4 className="font-semibold mb-3" style={{ color: TEXT_COLOR }}>게임 로그</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto text-sm font-mono">
                  {gameLog.map((coord, index) => {
                    const isBlackMove = index % 2 === 0;
                    const color = isBlackMove ? 'B' : 'W';
                    return (
                      <div key={index} style={{ color: TEXT_SECONDARY_COLOR }}>
                        {coord === -1 ? `${color}(수넘김)` : coord === -2 ? `${color}(기권)` : `${color}(${coord})`}
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={resetGame}
                className="w-full py-2 rounded-lg transition-colors cursor-pointer whitespace-nowrap border"
                style={{ 
                  backgroundColor: BUTTON_BACKGROUND_COLOR, 
                  borderColor: BORDER_COLOR,
                  color: TEXT_COLOR
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = PRIMARY_HOVER_COLOR;
                  e.currentTarget.style.color = PRIMARY_HOVER_COLOR;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = BORDER_COLOR;
                  e.currentTarget.style.color = TEXT_COLOR;
                }}
              >
                새 게임 설정
              </button>
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
              borderColor: BORDER_COLOR,
              boxShadow: MODAL_SHADOW,
            }}
          >
            <div className="mb-6">
              <div className="text-6xl mb-4">🤝</div>
              <h3 className="text-2xl font-bold mb-2" style={{ color: WARNING_COLOR }}>
                무승부 제안
              </h3>
              <p className="mt-2" style={{ color: TEXT_SECONDARY_COLOR }}>
                AI가 무승부 제안을 검토 중입니다...
              </p>
            </div>
            <div className="flex items-center justify-center">
              <div
                className="animate-spin w-8 h-8 border-2 rounded-full"
                style={{
                  borderColor: WARNING_COLOR,
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
                 borderColor: BORDER_COLOR,
                 boxShadow: MODAL_SHADOW
               }}>
            <div className="mb-6">
              {winner === null ? (
                <>
                  <div className="text-6xl mb-4">🤝</div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: WARNING_COLOR }}>
                    무승부!
                  </h3>
                  <p className="mt-2" style={{ color: TEXT_SECONDARY_COLOR }}>
                    양쪽 모두 잘 싸웠습니다!
                  </p>
                </>
              ) : winner === playerColor ? (
                <>
                  <div className="text-6xl mb-4">🎉</div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: SUCCESS_COLOR }}>승리!</h3>
                  <p className="mt-2" style={{ color: TEXT_SECONDARY_COLOR }}>축하합니다! AI를 이겼습니다.</p>
                </>
              ) : (
                <>
                  <div className="text-6xl mb-4">😢</div>
                  <h3 className="text-2xl font-bold mb-2" style={{ color: DANGER_COLOR }}>패배</h3>
                  <p className="mt-2" style={{ color: TEXT_SECONDARY_COLOR }}>아쉽네요. 다시 도전해보세요!</p>
                </>
              )}
            </div>
            
            <div className="space-y-3">
              <button 
                onClick={resetGame}
                className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap text-white"
                style={{ 
                  background: PRIMARY_BUTTON_GRADIENT,
                  boxShadow: BUTTON_SHADOW
                }}
              >
                새 게임 🔁
              </button>
              <button 
                onClick={() => navigate('/')}
                className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap border"
                style={{ 
                  backgroundColor: BUTTON_BACKGROUND_COLOR, 
                  borderColor: BORDER_COLOR,
                  color: TEXT_COLOR
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = PRIMARY_HOVER_COLOR;
                  e.currentTarget.style.color = PRIMARY_HOVER_COLOR;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = BORDER_COLOR;
                  e.currentTarget.style.color = TEXT_COLOR;
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
