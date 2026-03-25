import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Color, BadukBoardData } from "../../ts-proto/badukboard";
import { ClientToServer, ServerToClient, GameType } from "../../ts-proto/common";
import { SessionManager } from "../../api/axios-instance";
import { loadRoomConfig } from "./enter-room-config";
import { startAutoVoice, stopAutoVoice, updateVoiceCallback } from "../../voice_control/autoVoiceHandler";
import { parseVoiceToCoordinate } from "./voice-utils";

interface Player {
  nickname: string;
  rating: number | string;
  color: "black" | "white";
  mainTime: number;
  byoyomiTime: number;
  byoyomiCount: number;
}

export default function GameRoom() {
  const navigate = useNavigate();

  const [roomData] = useState(() => {
    const config = loadRoomConfig();
    console.log("🎮 방 설정 로드:", config);
    return config;
  });

  const enterCode = roomData?.enter_code;
  const sessionKey = roomData?.session_key || SessionManager.getSessionKey();
  const roomCode = enterCode ? String(enterCode) : "UNKNOWN";
  const isHost = roomData?.isHost ?? true;

  const [gameType, setGameType] = useState<GameType>(GameType.GAME_TYPE_UNSPECIFIED);
  const boardSize = gameType === GameType.GAME_TYPE_BADUK ? 19 : 15;

  const [board, setBoard] = useState<(null | "black" | "white")[][]>(
    Array(15)
      .fill(null)
      .map(() => Array(15).fill(null)),
  );

  useEffect(() => {
    if (gameType !== GameType.GAME_TYPE_UNSPECIFIED) {
      setBoard(
        Array(boardSize)
          .fill(null)
          .map(() => Array(boardSize).fill(null)),
      );
    }
  }, [gameType, boardSize]);

  const [gameStarted, setGameStarted] = useState(false);
  const [currentTurn, setCurrentTurn] = useState<"black" | "white">("black");
  const [selectedPosition, setSelectedPosition] = useState<{ row: number; col: number } | null>(null);
  const [myColor, setMyColor] = useState<"black" | "white" | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [canStartGame, setCanStartGame] = useState(false);
  const [lastHeard, setLastHeard] = useState<string>("");
  const wsRef = useRef<WebSocket | null>(null);

  const [players, setPlayers] = useState<{ black: Player; white: Player }>({
    black: { nickname: "---", rating: "---" as any, color: "black", mainTime: 0, byoyomiTime: 30000, byoyomiCount: 3 },
    white: { nickname: "---", rating: "---" as any, color: "white", mainTime: 0, byoyomiTime: 30000, byoyomiCount: 3 },
  });

  const [initialTime, setInitialTime] = useState({ black: 1800000, white: 1800000 });
  const [isInByoyomi, setIsInByoyomi] = useState({ black: false, white: false });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const bitboardToBoardArray = (blackBitboard: bigint[] | null | undefined, whiteBitboard: bigint[] | null | undefined, size: number): (null | "black" | "white")[][] => {
    const newBoard: (null | "black" | "white")[][] = Array(size)
      .fill(null)
      .map(() => Array(size).fill(null));
    if (blackBitboard && Array.isArray(blackBitboard)) {
      blackBitboard.forEach((bits, arrayIndex) => {
        for (let bitIndex = 0; bitIndex < 64; bitIndex++) {
          if ((bits & (1n << BigInt(bitIndex))) !== 0n) {
            const coordinate = arrayIndex * 64 + bitIndex;
            if (coordinate < size * size) {
              newBoard[Math.floor(coordinate / size)][coordinate % size] = "black";
            }
          }
        }
      });
    }
    if (whiteBitboard && Array.isArray(whiteBitboard)) {
      whiteBitboard.forEach((bits, arrayIndex) => {
        for (let bitIndex = 0; bitIndex < 64; bitIndex++) {
          if ((bits & (1n << BigInt(bitIndex))) !== 0n) {
            const coordinate = arrayIndex * 64 + bitIndex;
            if (coordinate < size * size) {
              newBoard[Math.floor(coordinate / size)][coordinate % size] = "white";
            }
          }
        }
      });
    }
    return newBoard;
  };

  const colorEnumToString = (color: Color): "black" | "white" | "free" | null => {
    switch (color) {
      case Color.COLOR_BLACK:
        return "black";
      case Color.COLOR_WHITE:
        return "white";
      case Color.COLOR_FREE:
        return "free";
      default:
        return null;
    }
  };

  const handleGameState = (gameState: BadukBoardData | undefined, size: number) => {
    if (!gameState) return;
    if (gameState.board) {
      try {
        const newBoard = bitboardToBoardArray(gameState.board.black, gameState.board.white, size);
        setBoard(newBoard);
      } catch (error) {
        console.error("⚠️ Bitboard 파싱 오류:", error);
      }
    }
    if (gameState.blackTime) {
      setPlayers((prev) => ({
        ...prev,
        black: {
          ...prev.black,
          mainTime: Number(gameState.blackTime!.mainTime),
          byoyomiTime: Number(gameState.blackTime!.overtime),
          byoyomiCount: gameState.blackTime!.remainingOvertime,
        },
      }));
    }
    if (gameState.whiteTime) {
      setPlayers((prev) => ({
        ...prev,
        white: {
          ...prev.white,
          mainTime: Number(gameState.whiteTime!.mainTime),
          byoyomiTime: Number(gameState.whiteTime!.overtime),
          byoyomiCount: gameState.whiteTime!.remainingOvertime,
        },
      }));
    }
  };

  useEffect(() => {
    if (!gameStarted) return;
    timerRef.current = setInterval(() => {
      setPlayers((prev) => {
        const newPlayers = { ...prev };
        const current = newPlayers[currentTurn];
        if (current.mainTime > 0) {
          current.mainTime -= 1000;
          if (current.mainTime <= 0) {
            current.mainTime = 0;
            setIsInByoyomi((p) => ({ ...p, [currentTurn]: true }));
          }
        } else if (current.byoyomiTime > 0) {
          current.byoyomiTime -= 1000;
          if (current.byoyomiTime <= 0 && current.byoyomiCount > 0) {
            current.byoyomiCount -= 1;
            current.byoyomiTime = gameType === GameType.GAME_TYPE_BADUK ? 60000 : 30000;
          }
        }
        return newPlayers;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentTurn, gameStarted, gameType]);

  useEffect(() => {
    if (wsRef.current) return;
    if (!enterCode || !sessionKey) {
      alert("방 정보가 없습니다. 홈으로 이동합니다.");
      navigate("/");
      return;
    }

    const host = window.location.hostname;
    const wsUrl = `wss://${host}/ws/room/${enterCode}/session/${sessionKey}`;
    const ws = new WebSocket(wsUrl);
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN && !gameStarted) {
        const pingRequest: ClientToServer = {};
        const encoded = ClientToServer.encode(pingRequest).finish();
        ws.send(encoded);
      }
    }, 8000);

    ws.onmessage = (event) => {
      try {
        const buffer = new Uint8Array(event.data);
        const response = ServerToClient.decode(buffer);

        if (!response.responseType && response.running === undefined && !response.baduk && !response.omok) {
          return; // Ping 응답 무시
        }

        if (response.gameType) {
          setGameType(response.gameType);
        }

        const isBaduk = response.gameType === GameType.GAME_TYPE_BADUK;
        const gameData = isBaduk ? response.baduk : response.omok;
        const currentBoardSize = isBaduk ? 19 : 15;

        if (response.running !== undefined) {
          if (response.running && !gameStarted) {
            const assignedColor = isHost ? "black" : "white";
            setMyColor(assignedColor);
            setGameStarted(true);
          } else if (!response.running) {
            setGameStarted(false);
          }
        }

        if (gameData) {
          if (gameData.turn !== undefined) {
            const turnColor = colorEnumToString(gameData.turn);
            if (turnColor === "black" || turnColor === "white") setCurrentTurn(turnColor);
          }

          if (gameData.gameState) {
            handleGameState(gameData.gameState, currentBoardSize);
          }

          if (gameData.usersInfo) {
            const hasBlack = !!gameData.usersInfo.black;
            const hasWhite = !!gameData.usersInfo.white;

            if (gameData.usersInfo.black) {
              setPlayers((prev) => ({
                ...prev,
                black: { ...prev.black, nickname: gameData.usersInfo!.black!.userName || "흑돌", rating: gameData.usersInfo!.black!.rating || 1500 },
              }));
            }

            if (gameData.usersInfo.white) {
              setPlayers((prev) => ({
                ...prev,
                white: { ...prev.white, nickname: gameData.usersInfo!.white!.userName || "백돌", rating: gameData.usersInfo!.white!.rating || 1500 },
              }));
            }
            setCanStartGame(hasBlack && hasWhite);
          }

          if (gameData.coordinate) {
            if (!gameData.coordinate.success) {
              alert(isBaduk ? "❌ 착수할 수 없습니다." : myColor === "black" ? "⛔ 금수입니다!" : "❌ 착수할 수 없습니다.");
              setSelectedPosition(null);
            }
          }

          if (gameData.drawOffer) {
            const opponentName = gameData.drawOffer.userName || "상대방";
            alert(`${opponentName}님이 무승부를 제안했습니다.`);
          }

          if (gameData.theWinner !== undefined) {
            const winner = colorEnumToString(gameData.theWinner);
            if (winner === "black" || winner === "white") {
              setTimeout(() => {
                alert(`🏆 ${players[winner].nickname}(${winner === "black" ? "흑돌" : "백돌"})이 승리했습니다!`);
                navigate("/");
              }, 500);
            } else if (winner === "free") {
              setTimeout(() => {
                alert("🤝 무승부로 게임이 종료되었습니다!");
                navigate("/");
              }, 500);
            }
          }
        }
      } catch (error) {
        console.error("메시지 디코딩 오류:", error);
      }
    };

    ws.onclose = () => {
      console.log("WebSocket 연결 종료");
    };

    return () => {
      clearInterval(pingInterval);
      if (ws.readyState === WebSocket.OPEN) ws.close();
      wsRef.current = null;
    };
  }, []);

  const sendClientAction = (action: any) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      alert("서버와 연결되지 않았습니다.");
      return;
    }
    const payload = gameType === GameType.GAME_TYPE_BADUK ? { baduk: action } : { omok: action };
    const request: ClientToServer = payload;
    const encoded = ClientToServer.encode(request).finish();
    wsRef.current.send(encoded);
  };

  const handleCellClick = (row: number, col: number) => {
    if (!gameStarted) return;
    if (board[row][col] === null) setSelectedPosition({ row, col });
  };

  const handlePlaceStone = () => {
    if (!gameStarted || currentTurn !== myColor || !selectedPosition) return;
    const { row, col } = selectedPosition;
    if (board[row][col] !== null) return;

    const coordinate = row * boardSize + col;
    sendClientAction({ coordinate: { coordinate } });
    setSelectedPosition(null);
  };

  const handlePass = () => {
    if (!gameStarted || currentTurn !== myColor) return;
    sendClientAction({ passTurn: {} });
  };

  const handleResign = () => {
    if (!gameStarted) return;
    if (!confirm("정말 기권하시겠습니까?")) return;
    sendClientAction({ resign: {} });
  };

  const handleDrawRequest = () => {
    if (!gameStarted) return;
    sendClientAction({ drawOffer: {} });
  };

  const handleStartGame = () => {
    if (!canStartGame) {
      alert("두 명의 플레이어가 모두 입장해야 게임을 시작할 수 있습니다.");
      return;
    }
    sendClientAction({ gamestart: {} });
  };

  const handleVoiceText = useCallback(
    (text: string) => {
      setLastHeard(text);
      const lower = text.toLowerCase();
      const compactLower = lower.replace(/\s+/g, "");

      if (lower.includes("착수")) {
        if (selectedPosition && currentTurn === myColor) handlePlaceStone();
        return;
      }
      if (compactLower.includes("기권") || compactLower.includes("기건") || lower.includes("포기")) {
        handleResign();
        return;
      }
      if (compactLower.includes("무승부") || compactLower.includes("무슨부")) {
        handleDrawRequest();
        return;
      }
      if (lower.includes("수 넘김") || compactLower.includes("수넘김") || compactLower.includes("넘김") || compactLower.includes("패스")) {
        handlePass();
        return;
      }
      if (currentTurn === myColor) {
        const parsed = parseVoiceToCoordinate(text, boardSize);
        if (parsed) {
          const { row, col } = parsed;
          if (board[row]?.[col] === null) setSelectedPosition({ row, col });
        }
      }
    },
    [myColor, currentTurn, selectedPosition, board, boardSize],
  );

  useEffect(() => {
    updateVoiceCallback(handleVoiceText);
  }, [handleVoiceText]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    return `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  };

  const myPlayer = myColor ? players[myColor] : players.black;
  const opponentColor = myColor === "black" ? "white" : "black";
  const opponentPlayer = players[opponentColor];
  const isMyTurn = myColor === currentTurn;

  const isThePoints = (row: number, col: number): boolean => {
    if (boardSize === 19) return [3, 9, 15].includes(row) && [3, 9, 15].includes(col);
    return [7].includes(row) && [7].includes(col);
  };

  // --- UI 렌더링을 위해 추가해야 할 부분 시작 ---
  const getTimePercentage = (currentTime: number, initialTime: number) => {
    return Math.max(0, Math.min(100, (currentTime / initialTime) * 100));
  };

  const getTimeBarColor = (percentage: number) => {
    if (percentage > 50) return "#10b981";
    if (percentage > 20) return "#f59e0b";
    return "#ef4444";
  };

  const isMyColor = myColor === "black" ? "black" : myColor === "white" ? "white" : "black";

  const myTimePercentage = myColor ? getTimePercentage(myPlayer.mainTime, initialTime[myColor]) : 0;
  const opponentTimePercentage = getTimePercentage(opponentPlayer.mainTime, initialTime[opponentColor]);
  // --- UI 렌더링을 위해 추가해야 할 부분 끝 ---

  // 게임 시작 전 대기 화면
  if (!gameStarted) {
    return (
      <div className="min-h-screen text-white p-8" style={{ backgroundColor: "#0b0c10" }}>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#e8eaf0" }}>
              대기실
            </h1>
            <p style={{ color: "#9aa1ad" }}>{isConnected ? "서버와 연결됨 - 플레이어를 기다리는 중..." : "서버와 연결 중..."}</p>
          </div>

          {/* 방 코드 표시 */}
          <div
            className="rounded-xl p-6 border mb-6"
            style={{
              backgroundColor: "rgba(22,22,28,0.6)",
              borderColor: "#2a2a33",
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm mb-1" style={{ color: "#9aa1ad" }}>
                  방 입장 코드
                </div>
                <div className="text-2xl font-bold tracking-wider" style={{ color: "#e8eaf0" }}>
                  {roomCode}
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(roomCode);
                  alert("방 코드가 복사되었습니다!");
                }}
                className="px-6 py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-2 border"
                style={{
                  backgroundColor: "#141822",
                  borderColor: "#2a2a33",
                  color: "#e8eaf0",
                }}
              >
                <span>복사</span>
              </button>
            </div>
          </div>

          {/* 플레이어 정보 */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* 흑돌 */}
            <div
              className="rounded-xl p-6 border"
              style={{
                backgroundColor: "rgba(22,22,28,0.6)",
                borderColor: players.black.nickname !== "---" ? "#22c55e" : "#2a2a33",
              }}
            >
              <div className="text-center">
                <div className="text-lg font-semibold mb-2" style={{ color: "#e8eaf0" }}>
                  {players.black.nickname}
                </div>
                {typeof players.black.rating === "number" && (
                  <div className="text-sm mb-2" style={{ color: "#9aa1ad" }}>
                    레이팅: {players.black.rating}
                  </div>
                )}
                <div className="text-sm" style={{ color: "#9aa1ad" }}>
                  흑돌
                </div>
              </div>
            </div>

            {/* 백돌 */}
            <div
              className="rounded-xl p-6 border"
              style={{
                backgroundColor: "rgba(22,22,28,0.6)",
                borderColor: players.white.nickname !== "---" ? "#22c55e" : "#2a2a33",
              }}
            >
              <div className="text-center">
                <div className="text-lg font-semibold mb-2" style={{ color: "#e8eaf0" }}>
                  {players.white.nickname}
                </div>
                {typeof players.white.rating === "number" && (
                  <div className="text-sm mb-2" style={{ color: "#9aa1ad" }}>
                    레이팅: {players.white.rating}
                  </div>
                )}
                <div className="text-sm" style={{ color: "#9aa1ad" }}>
                  백돌
                </div>
              </div>
            </div>
          </div>

          {/* 연결 상태 */}
          <div
            className="rounded-xl p-4 border mb-6 text-center"
            style={{
              backgroundColor: "rgba(22,22,28,0.6)",
              borderColor: isConnected ? "#22c55e" : "#ef4444",
            }}
          >
            <div className="flex items-center justify-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{
                  backgroundColor: isConnected ? "#22c55e" : "#ef4444",
                }}
              />
              <span style={{ color: "#e8eaf0" }}>{isConnected ? "서버 연결됨" : "서버 연결 중..."}</span>
            </div>
          </div>

          {/* 버튼 */}
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleStartGame}
              disabled={!canStartGame || !isConnected}
              className="py-4 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap text-white"
              style={{
                background: canStartGame && isConnected ? "linear-gradient(180deg, #1f6feb, #1b4fd8)" : "#2a2a33",
                boxShadow: canStartGame && isConnected ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
                opacity: canStartGame && isConnected ? 1 : 0.5,
                cursor: canStartGame && isConnected ? "pointer" : "not-allowed",
              }}
            >
              {canStartGame ? "게임 시작" : "플레이어 대기 중..."}
            </button>
            <button
              onClick={() => navigate("/")}
              className="py-4 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap"
              style={{
                backgroundColor: "#dc2626",
                color: "#ffffff",
              }}
            >
              나가기
            </button>
          </div>

          {/* 안내 */}
          <div
            className="mt-6 p-4 rounded-lg border text-center"
            style={{
              backgroundColor: "rgba(22,22,28,0.4)",
              borderColor: "#2a2a33",
            }}
          >
            <p className="text-sm" style={{ color: "#9aa1ad" }}>
              💡 친구에게 방 코드 <strong style={{ color: "#8ab4f8" }}>{roomCode}</strong>를 공유하여 초대하세요!
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 게임 시작 후 게임 화면
  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: "#0b0c10" }}>
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b" style={{ borderColor: "#2a2a33" }}>
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #1f6feb 0%, #1b4fd8 100%)",
              boxShadow: "0 4px 12px rgba(31, 111, 235, 0.3)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10" cy="10" r="8" fill="white" opacity="0.9" />
              <circle cx="10" cy="10" r="5" fill="black" opacity="0.8" />
            </svg>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">Doljabi</h1>
        </div>

        <div className="text-lg font-semibold" style={{ color: "#e8eaf0" }}>
          {gameType === GameType.GAME_TYPE_BADUK ? "바둑 대국" : "오목 대국"}
        </div>

        <div className="text-lg font-bold" style={{ color: "#8ab4f8" }}>
          {roomCode}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex items-start justify-center min-h-[calc(100vh-72px)] p-6 gap-4">
        {/* 왼쪽: 플레이어 정보 */}
        <div className="w-64 flex flex-col h-[calc(100vh-120px)]">
          {/* 내 정보 */}
          <div
            className={`flex-1 rounded-xl p-4 border mb-2 ${gameStarted && currentTurn === myColor ? "ring-2 ring-blue-500" : ""}`}
            style={{
              backgroundColor: "rgba(22,22,28,0.6)",
              borderColor: gameStarted && currentTurn === myColor ? "#1f6feb" : "#2a2a33",
              boxShadow: gameStarted && currentTurn === myColor ? "0 0 20px rgba(31, 111, 235, 0.3)" : "0 4px 16px rgba(0,0,0,0.3)",
            }}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: myColor === "black" ? "#1a1a1a" : "#f5f5f5",
                  border: "2px solid",
                  borderColor: myColor === "black" ? "#333" : "#ddd",
                  boxShadow: myColor === "black" ? "0 2px 8px rgba(0,0,0,0.5)" : "0 2px 8px rgba(255,255,255,0.3)",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill={myColor === "black" ? "#000" : "#fff"} />
                  {myColor === "white" && <circle cx="9" cy="9" r="3" fill="rgba(0,0,0,0.1)" />}
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-bold" style={{ color: "#e8eaf0" }}>
                  {myPlayer.nickname}
                </div>
                <div className="text-sm flex items-center space-x-1">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 1L7 4L10 4.5L7.5 6.5L8 9.5L6 8L4 9.5L4.5 6.5L2 4.5L5 4L6 1Z" fill="#f59e0b" />
                  </svg>
                  <span style={{ color: "#9aa1ad" }}>{typeof myPlayer.rating === "number" ? myPlayer.rating : myPlayer.rating}</span>
                </div>
              </div>
            </div>

            {gameStarted && (
              <>
                <div className="mb-3">
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#141822" }}>
                    <div
                      className="h-full transition-all duration-1000"
                      style={{
                        width: `${myTimePercentage}%`,
                        backgroundColor: getTimeBarColor(myTimePercentage),
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: "#141822" }}>
                    <span className="text-sm" style={{ color: "#9aa1ad" }}>
                      메인 시간
                    </span>
                    <span
                      className={`font-mono font-bold ${isInByoyomi[isMyColor] ? "text-red-500" : ""}`}
                      style={{
                        color: isInByoyomi[isMyColor] ? "#ef4444" : "#e8eaf0",
                      }}
                    >
                      {formatTime(myPlayer.mainTime)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: "#141822" }}>
                    <span className="text-sm" style={{ color: "#9aa1ad" }}>
                      초읽기
                    </span>
                    <span
                      className={`font-mono font-bold ${isInByoyomi[isMyColor] ? "text-red-500" : ""}`}
                      style={{
                        color: isInByoyomi[isMyColor] ? "#ef4444" : "#9aa1ad",
                      }}
                    >
                      {formatTime(myPlayer.byoyomiTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: "#141822" }}>
                    <span className="text-sm" style={{ color: "#9aa1ad" }}>
                      남은 횟수
                    </span>
                    <span
                      className={`font-mono font-bold ${isInByoyomi[isMyColor] ? "text-red-500" : ""}`}
                      style={{
                        color: isInByoyomi[isMyColor] ? "#ef4444" : "#9aa1ad",
                      }}
                    >
                      {myPlayer.byoyomiCount}회
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 상대방 정보 */}
          <div
            className={`flex-1 rounded-xl p-4 border ${gameStarted && currentTurn === opponentColor ? "ring-2 ring-blue-500" : ""}`}
            style={{
              backgroundColor: "rgba(22,22,28,0.6)",
              borderColor: gameStarted && currentTurn === opponentColor ? "#1f6feb" : "#2a2a33",
              boxShadow: gameStarted && currentTurn === opponentColor ? "0 0 20px rgba(31, 111, 235, 0.3)" : "0 4px 16px rgba(0,0,0,0.3)",
            }}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: opponentColor === "black" ? "#1a1a1a" : "#f5f5f5",
                  border: "2px solid",
                  borderColor: opponentColor === "black" ? "#333" : "#ddd",
                  boxShadow: opponentColor === "black" ? "0 2px 8px rgba(0,0,0,0.5)" : "0 2px 8px rgba(255,255,255,0.3)",
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" fill={opponentColor === "black" ? "#000" : "#fff"} />
                  {opponentColor === "white" && <circle cx="9" cy="9" r="3" fill="rgba(0,0,0,0.1)" />}
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-bold" style={{ color: "#e8eaf0" }}>
                  {opponentPlayer.nickname}
                </div>
                <div className="text-sm flex items-center space-x-1">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 1L7 4L10 4.5L7.5 6.5L8 9.5L6 8L4 9.5L4.5 6.5L2 4.5L5 4L6 1Z" fill="#f59e0b" />
                  </svg>
                  <span style={{ color: "#9aa1ad" }}>{typeof opponentPlayer.rating === "number" ? opponentPlayer.rating : opponentPlayer.rating}</span>
                </div>
              </div>
            </div>

            {gameStarted && (
              <>
                <div className="mb-3">
                  <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#141822" }}>
                    <div
                      className="h-full transition-all duration-1000"
                      style={{
                        width: `${opponentTimePercentage}%`,
                        backgroundColor: getTimeBarColor(opponentTimePercentage),
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: "#141822" }}>
                    <span className="text-sm" style={{ color: "#9aa1ad" }}>
                      메인 시간
                    </span>
                    <span
                      className={`font-mono font-bold ${isInByoyomi[opponentColor] ? "text-red-500" : ""}`}
                      style={{
                        color: isInByoyomi[opponentColor] ? "#ef4444" : "#e8eaf0",
                      }}
                    >
                      {formatTime(opponentPlayer.mainTime)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: "#141822" }}>
                    <span className="text-sm" style={{ color: "#9aa1ad" }}>
                      초읽기
                    </span>
                    <span
                      className={`font-mono font-bold ${isInByoyomi[opponentColor] ? "text-red-500" : ""}`}
                      style={{
                        color: isInByoyomi[opponentColor] ? "#ef4444" : "#9aa1ad",
                      }}
                    >
                      {formatTime(opponentPlayer.byoyomiTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: "#141822" }}>
                    <span className="text-sm" style={{ color: "#9aa1ad" }}>
                      남은 횟수
                    </span>
                    <span
                      className={`font-mono font-bold ${isInByoyomi[opponentColor] ? "text-red-500" : ""}`}
                      style={{
                        color: isInByoyomi[opponentColor] ? "#ef4444" : "#9aa1ad",
                      }}
                    >
                      {opponentPlayer.byoyomiCount}회
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 중앙: 바둑판 */}
        <div className="flex-1 max-w-4xl">
          <div
            className="rounded-2xl p-6 border"
            style={{
              backgroundColor: "rgba(22,22,28,0.6)",
              borderColor: "#2a2a33",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            <div
              className="aspect-square rounded-xl p-8 relative"
              style={{
                background: "linear-gradient(135deg, #d4a574 0%, #c89968 100%)",
                boxShadow: "inset 0 2px 8px rgba(0,0,0,0.2)",
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
                        color: "rgba(0,0,0,0.7)",
                        left: leftPosition,
                        transform: "translateX(-50%)",
                        textAlign: "center",
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
                        color: "rgba(0,0,0,0.7)",
                        top: topPosition,
                        transform: "translateY(-50%)",
                        display: "flex",
                        alignItems: "center",
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
                  Array.from({
                    length: boardSize - 1,
                  }).map((_, colIndex) => (
                    <div
                      key={`grid-${rowIndex}-${colIndex}`}
                      className="relative"
                      style={{
                        borderRight: colIndex < boardSize - 2 ? "1px solid rgba(0,0,0,0.3)" : "none",
                        borderBottom: rowIndex < boardSize - 2 ? "1px solid rgba(0,0,0,0.3)" : "none",
                      }}
                    />
                  )),
                )}
              </div>

              <div className="absolute inset-8 pointer-events-none" style={{ border: "1px solid rgba(0,0,0,0.3)" }} />

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
                          width: "6%",
                          height: "6%",
                          transform: "translate(-50%, -50%)",
                          backgroundColor: selectedPosition?.row === rowIndex && selectedPosition?.col === colIndex ? "rgba(31, 111, 235, 0.4)" : "transparent",
                          borderRadius: "50%",
                          zIndex: 10,
                          cursor: gameStarted && !cell ? "pointer" : "default",
                        }}
                      >
                        {/* 화점 표시 */}
                        {!cell && isThePoints(rowIndex, colIndex) && (
                          <div
                            className={`${boardSize === 19 ? "w-1.5 h-1.5" : "w-2 h-2"} rounded-full`}
                            style={{
                              backgroundColor: "rgba(0,0,0,0.5)",
                              pointerEvents: "none",
                            }}
                          />
                        )}

                        {/* 바둑돌 */}
                        {cell && (
                          <div
                            className="rounded-full flex items-center justify-center"
                            style={{
                              width: "100%",
                              height: "100%",
                              backgroundColor: cell === "black" ? "#1a1a1a" : "#f5f5f5",
                              border: cell === "black" ? "2px solid #000" : "2px solid #ddd",
                              boxShadow: cell === "black" ? "0 2px 6px rgba(0,0,0,0.6)" : "0 2px 6px rgba(0,0,0,0.3)",
                              pointerEvents: "none",
                            }}
                          >
                            <svg width="100%" height="100%" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <circle cx="16" cy="16" r="14" fill={cell === "black" ? "#000" : "#fff"} />
                              {cell === "white" && <circle cx="12" cy="12" r="4" fill="rgba(0,0,0,0.1)" />}
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  }),
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
                  backgroundColor: "rgba(22,22,28,0.6)",
                  borderColor: "#2a2a33",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                }}
              >
                <div className="text-lg font-semibold mb-2" style={{ color: "#8ab4f8" }}>
                  대국 대기 중
                </div>
                <div className="text-sm" style={{ color: "#9aa1ad" }}>
                  대국 시작 버튼을 눌러주세요
                </div>
              </div>

              {/* 게임 설정 정보 */}
              <div
                className="rounded-xl p-4 border"
                style={{
                  backgroundColor: "rgba(22,22,28,0.6)",
                  borderColor: "#2a2a33",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                }}
              >
                <div className="text-sm mb-3 font-semibold" style={{ color: "#8ab4f8" }}>
                  게임 설정
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: "#141822" }}>
                    <div className="flex items-center space-x-2">
                      <i className="ri-time-line" style={{ color: "#9aa1ad" }}></i>
                      <span className="text-sm" style={{ color: "#9aa1ad" }}>
                        메인 시간
                      </span>
                    </div>
                    <span className="font-mono text-sm font-semibold" style={{ color: "#e8eaf0" }}>
                      {formatTime(initialTime.black)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: "#141822" }}>
                    <div className="flex items-center space-x-2">
                      <i className="ri-add-circle-line" style={{ color: "#9aa1ad" }}></i>
                      <span className="text-sm" style={{ color: "#9aa1ad" }}>
                        추가 시간
                      </span>
                    </div>
                    <span className="font-mono text-sm font-semibold" style={{ color: "#e8eaf0" }}>
                      5초
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: "#141822" }}>
                    <div className="flex items-center space-x-2">
                      <i className="ri-timer-line" style={{ color: "#9aa1ad" }}></i>
                      <span className="text-sm" style={{ color: "#9aa1ad" }}>
                        초읽기 시간
                      </span>
                    </div>
                    <span className="font-mono text-sm font-semibold" style={{ color: "#e8eaf0" }}>
                      30초
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded" style={{ backgroundColor: "#141822" }}>
                    <div className="flex items-center space-x-2">
                      <i className="ri-repeat-line" style={{ color: "#9aa1ad" }}></i>
                      <span className="text-sm" style={{ color: "#9aa1ad" }}>
                        초읽기 횟수
                      </span>
                    </div>
                    <span className="font-mono text-sm font-semibold" style={{ color: "#e8eaf0" }}>
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
                  background: "linear-gradient(180deg, #1f6feb, #1b4fd8)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                }}
              >
                대국 시작하기
              </button>
            </>
          ) : (
            <>
              {/* 착수 버튼 */}
              <button
                onClick={handlePlaceStone}
                disabled={!selectedPosition || !isMyTurn}
                className="w-full py-4 rounded-lg font-semibold transition-all whitespace-nowrap text-white text-lg"
                style={{
                  background: selectedPosition && isMyTurn ? "linear-gradient(180deg, #1f6feb, #1b4fd8)" : "#2a2a33",
                  boxShadow: selectedPosition && isMyTurn ? "0 2px 8px rgba(0,0,0,0.3)" : "none",
                  opacity: selectedPosition && isMyTurn ? 1 : 0.5,
                  cursor: selectedPosition && isMyTurn ? "pointer" : "not-allowed",
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
                    backgroundColor: "#141822",
                    borderColor: "#2a2a33",
                    color: "#e8eaf0",
                    opacity: isMyTurn ? 1 : 0.5,
                    cursor: isMyTurn ? "pointer" : "not-allowed",
                  }}
                  onMouseEnter={(e) => {
                    if (isMyTurn) {
                      e.currentTarget.style.borderColor = "#8ab4f8";
                      e.currentTarget.style.color = "#8ab4f8";
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#2a2a33";
                    e.currentTarget.style.color = "#e8eaf0";
                  }}
                >
                  수 넘김
                </button>

                <button
                  onClick={handleDrawRequest}
                  className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap border"
                  style={{
                    backgroundColor: "#141822",
                    borderColor: "#2a2a33",
                    color: "#e8eaf0",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#f59e0b";
                    e.currentTarget.style.color = "#f59e0b";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#2a2a33";
                    e.currentTarget.style.color = "#e8eaf0";
                  }}
                >
                  무승부 신청
                </button>

                <button
                  onClick={handleResign}
                  className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap border"
                  style={{
                    backgroundColor: "#141822",
                    borderColor: "#2a2a33",
                    color: "#e8eaf0",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#ef4444";
                    e.currentTarget.style.color = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#2a2a33";
                    e.currentTarget.style.color = "#e8eaf0";
                  }}
                >
                  기권
                </button>
              </div>

              {/* 현재 차례 표시 */}
              <div
                className="rounded-xl p-4 border text-center"
                style={{
                  backgroundColor: "rgba(22,22,28,0.6)",
                  borderColor: "#2a2a33",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
                }}
              >
                <div className="text-sm mb-2" style={{ color: "#9aa1ad" }}>
                  현재 차례
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: currentTurn === "black" ? "#1a1a1a" : "#f5f5f5",
                      border: "2px solid",
                      borderColor: currentTurn === "black" ? "#000" : "#ddd",
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="8" cy="8" r="7" fill={currentTurn === "black" ? "#000" : "#fff"} />
                    </svg>
                  </div>
                  <span className="text-xl font-bold" style={{ color: "#e8eaf0" }}>
                    {currentTurn === "black" ? "흑" : "백"}
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
            backgroundColor: "rgba(22,22,28,0.95)",
            borderColor: "#1f6feb",
            boxShadow: "0 8px 32px rgba(31,111,235,0.4)",
            maxWidth: "320px",
          }}
        >
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#1f6feb" }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="8" y="4" width="4" height="8" rx="2" fill="white" />
                <path d="M8 10C8 12 7 13 10 13C13 13 12 12 12 10" stroke="white" strokeWidth="1" strokeLinecap="round" />
                <line x1="10" y1="13" x2="10" y2="16" stroke="white" strokeWidth="1" strokeLinecap="round" />
                <line x1="8" y1="16" x2="12" y2="16" stroke="white" strokeWidth="1" strokeLinecap="round" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold mb-1 flex items-center justify-between">
                <span style={{ color: "#8ab4f8" }}>🎙️ 음성 인식</span>
                <span className="text-xs" style={{ color: "#10b981" }}>
                  ● ON
                </span>
              </div>
              <div className="text-sm break-words" style={{ color: "#e8eaf0" }}>
                {lastHeard ? `"${lastHeard}"` : "말해보세요 (예: 삼행오열)"}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
