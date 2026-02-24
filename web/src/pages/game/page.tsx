import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Color, BadukBoardData } from "../../ts-proto/badukboard";
import { ClientToServer, ServerToClient, GameType } from "../../ts-proto/common";
import { SessionManager } from "../../api/axios-instance";
import { loadRoomConfig } from "./enter-room-config";
import {
    startAutoVoice,
    stopAutoVoice,
    updateVoiceCallback,
} from "../../voice_control/autoVoiceHandler";
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
        Array(15).fill(null).map(() => Array(15).fill(null)),
    );

    useEffect(() => {
        if (gameType !== GameType.GAME_TYPE_UNSPECIFIED) {
            setBoard(Array(boardSize).fill(null).map(() => Array(boardSize).fill(null)));
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

    const bitboardToBoardArray = (
        blackBitboard: bigint[] | null | undefined,
        whiteBitboard: bigint[] | null | undefined,
        size: number,
    ): (null | "black" | "white")[][] => {
        const newBoard: (null | "black" | "white")[][] = Array(size).fill(null).map(() => Array(size).fill(null));
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
            case Color.COLOR_BLACK: return "black";
            case Color.COLOR_WHITE: return "white";
            case Color.COLOR_FREE: return "free";
            default: return null;
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
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
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

        ws.onopen = () => { setIsConnected(true); };

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

                if (response.gameType && response.gameType !== GameType.GAME_TYPE_UNSPECIFIED) {
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
                            alert(isBaduk ? "❌ 착수할 수 없습니다." : (myColor === "black" ? "⛔ 금수입니다!" : "❌ 착수할 수 없습니다."));
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
                            setTimeout(() => { alert("🤝 무승부로 게임이 종료되었습니다!"); navigate("/"); }, 500);
                        }
                    }
                }
            } catch (error) {
                console.error("메시지 디코딩 오류:", error);
            }
        };

        ws.onclose = () => { console.log("WebSocket 연결 종료"); };

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

    const handleVoiceText = useCallback((text: string) => {
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
    }, [myColor, currentTurn, selectedPosition, board, boardSize]);

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
        return [3, 7, 11].includes(row) && [3, 7, 11].includes(col);
    };

    if (!gameStarted) {
        return (
            <div className="min-h-screen text-white p-8" style={{ backgroundColor: "#0b0c10" }}>
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold mb-2" style={{ color: "#e8eaf0" }}>대기실</h1>
                        <p style={{ color: "#9aa1ad" }}>{isConnected ? "서버와 연결됨 - 플레이어를 기다리는 중..." : "서버와 연결 중..."}</p>
                    </div>
                    <div className="rounded-xl p-6 border mb-6 flex items-center justify-between" style={{ backgroundColor: "rgba(22,22,28,0.6)", borderColor: "#2a2a33" }}>
                        <div>
                            <div className="text-sm mb-1" style={{ color: "#9aa1ad" }}>방 입장 코드</div>
                            <div className="text-2xl font-bold tracking-wider" style={{ color: "#e8eaf0" }}>{roomCode}</div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6 mb-8">
                        <div className="rounded-xl p-6 border" style={{ backgroundColor: "#1e1e24", borderColor: "#2a2a33", opacity: players.black.nickname !== "---" ? 1 : 0.5 }}>
                            <div className="w-8 h-8 rounded-full bg-black border-2 border-gray-600 mb-4 shadow-lg" />
                            <div className="text-xl font-bold text-gray-200">{players.black.nickname !== "---" ? players.black.nickname : "대기 중..."}</div>
                        </div>
                        <div className="rounded-xl p-6 border flex flex-col items-end text-right" style={{ backgroundColor: "#1e1e24", borderColor: "#2a2a33", opacity: players.white.nickname !== "---" ? 1 : 0.5 }}>
                            <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 mb-4 shadow-lg" />
                            <div className="text-xl font-bold text-gray-200">{players.white.nickname !== "---" ? players.white.nickname : "대기 중..."}</div>
                        </div>
                    </div>
                    {isHost && (
                        <button onClick={handleStartGame} disabled={!canStartGame} className={`w-full py-4 rounded-xl text-lg font-bold transition-all shadow-lg ${canStartGame ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "bg-gray-800 text-gray-500 cursor-not-allowed"}`}>
                            {canStartGame ? "게임 시작" : "플레이어 대기 중..."}
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen text-white p-4" style={{ backgroundColor: "#0b0c10" }}>
            <div className="max-w-6xl mx-auto flex gap-6">
                <div className="w-72 flex flex-col gap-4">
                    <div className="rounded-xl p-5 border" style={{ backgroundColor: "#16161c", borderColor: "#2a2a33", opacity: isMyTurn ? 0.3 : 1 }}>
                        <div className="flex justify-between items-center mb-4"><span style={{ color: "#9aa1ad" }}>상대방</span><div className={`w-6 h-6 rounded-full shadow-md ${opponentColor === "black" ? "bg-black border-gray-600" : "bg-gray-100 border-gray-300"} border`} /></div>
                        <div className="text-2xl font-bold text-gray-200 mb-6">{opponentPlayer.nickname}</div>
                        <div className="text-4xl font-mono text-center font-bold tracking-wider" style={{ color: opponentPlayer.mainTime > 0 ? "#e8eaf0" : "#ef4444" }}>{formatTime(opponentPlayer.mainTime > 0 ? opponentPlayer.mainTime : opponentPlayer.byoyomiTime)}</div>
                    </div>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center">
                    <div className="bg-[#e4b56c] p-4 rounded shadow-2xl relative" style={{ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)" }}>
                        <div className="relative border-2 border-[#8b5a2b]" style={{ width: boardSize * (boardSize === 19 ? 30 : 40), height: boardSize * (boardSize === 19 ? 30 : 40) }}>
                            {board.map((rowArr, rowIndex) => rowArr.map((_, colIndex) => (
                                <div key={`cell-${rowIndex}-${colIndex}`} className="absolute border border-[#8b5a2b] opacity-50 pointer-events-none" style={{
                                    left: `${(colIndex + 0.5) * (boardSize === 19 ? 30 : 40)}px`, top: `${(rowIndex + 0.5) * (boardSize === 19 ? 30 : 40)}px`, width: boardSize === 19 ? "30px" : "40px", height: boardSize === 19 ? "30px" : "40px",
                                    display: (rowIndex === boardSize - 1 || colIndex === boardSize - 1) ? "none" : "block"
                                }} />
                            )))}
                            {board.map((_, r) => board.map((_, c) => isThePoints(r, c) && <div key={`point-${r}-${c}`} className="absolute bg-[#8b5a2b] rounded-full w-2 h-2 transform -translate-x-1/2 -translate-y-1/2" style={{ left: `${c * (boardSize === 19 ? 30 : 40) + (boardSize === 19 ? 30 : 40) / 2}px`, top: `${r * (boardSize === 19 ? 30 : 40) + (boardSize === 19 ? 30 : 40) / 2}px` }} />))}
                            {board.map((rowArr, rowIndex) => rowArr.map((cell, colIndex) => {
                                const isSelected = selectedPosition?.row === rowIndex && selectedPosition?.col === colIndex;
                                const isBlack = cell === "black";
                                const isWhite = cell === "white";
                                const size = boardSize === 19 ? 30 : 40;
                                return (
                                    <div key={`${rowIndex}-${colIndex}`} onClick={() => handleCellClick(rowIndex, colIndex)} className="absolute flex items-center justify-center cursor-pointer rounded-full transition-all group" style={{
                                        width: `${size}px`, height: `${size}px`, left: `${colIndex * size}px`, top: `${rowIndex * size}px`,
                                        zIndex: isSelected || cell ? 10 : 1
                                    }}>
                                        {cell && (
                                            <div className="w-[90%] h-[90%] rounded-full shadow-lg" style={{
                                                background: isBlack ? "radial-gradient(circle at 30% 30%, #4a4a4a 0%, #000000 70%)" : "radial-gradient(circle at 30% 30%, #ffffff 0%, #e0e0e0 70%)",
                                                boxShadow: "2px 2px 4px rgba(0,0,0,0.4), inset -2px -2px 4px rgba(0,0,0,0.4)"
                                            }} />
                                        )}
                                        {isSelected && <div className="absolute w-[90%] h-[90%] rounded-full bg-indigo-500 opacity-60 animate-pulse border-2 border-indigo-300" />}
                                        {!cell && !isSelected && isMyTurn && (
                                            <div className="w-[80%] h-[80%] rounded-full opacity-0 group-hover:opacity-40 transition-opacity pointer-events-none" style={{ backgroundColor: myColor === "black" ? "#000" : "#fff" }} />
                                        )}
                                        {!cell && !isSelected && <div className="absolute w-full h-full hover:bg-white hover:opacity-10 rounded-full" />}
                                    </div>
                                );
                            }))}
                        </div>
                    </div>
                </div>
                <div className="w-72 flex flex-col gap-4">
                    <div className={`rounded-xl p-5 border shadow-xl ${isMyTurn ? "border-indigo-500 bg-indigo-900/20" : "border-[#2a2a33] bg-[#16161c]"}`}>
                        <div className="flex justify-between items-center mb-4"><span style={{ color: "#9aa1ad" }}>나</span><div className={`w-6 h-6 rounded-full shadow-md ${myColor === "black" ? "bg-black border-gray-600" : "bg-gray-100 border-gray-300"} border`} /></div>
                        <div className="text-2xl font-bold text-indigo-400 mb-6">{myPlayer.nickname}</div>
                        <div className="text-4xl font-mono text-center font-bold tracking-wider" style={{ color: myPlayer.mainTime > 0 ? "#e8eaf0" : "#ef4444" }}>{formatTime(myPlayer.mainTime > 0 ? myPlayer.mainTime : myPlayer.byoyomiTime)}</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-auto">
                        <button onClick={handlePlaceStone} disabled={!isMyTurn || !selectedPosition} className="col-span-2 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl disabled:bg-gray-800 disabled:text-gray-500 transition-colors shadow-lg">착수</button>
                        <button onClick={handlePass} disabled={!isMyTurn} className="py-3 bg-[#2a2a33] hover:bg-[#3f3f4e] text-gray-300 font-bold rounded-xl transition-colors">패스</button>
                        <button onClick={handleResign} className="py-3 bg-red-900/50 hover:bg-red-800/60 text-red-200 font-bold rounded-xl transition-colors">기권</button>
                        <button onClick={handleDrawRequest} className="col-span-2 py-3 bg-[#2a2a33] hover:bg-[#3f3f4e] text-gray-300 font-bold rounded-xl transition-colors">무승부 제안</button>
                    </div>
                    <div className="mt-4 p-4 rounded-xl bg-[#16161c] border border-[#2a2a33]">
                        <div className="text-sm font-bold text-gray-400 mb-2">음성 인식 테스트</div>
                        <div className="flex gap-2">
                            <button onClick={startAutoVoice} className="flex-1 py-2 bg-indigo-600/80 hover:bg-indigo-500 rounded-lg text-sm text-white">시작</button>
                            <button onClick={stopAutoVoice} className="flex-1 py-2 bg-red-900/80 hover:bg-red-800 rounded-lg text-sm text-white">중지</button>
                        </div>
                        <div className="mt-3 text-sm text-gray-400 break-all">{lastHeard || "인식된 텍스트 없음"}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
