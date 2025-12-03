// src/pages/OmokGameRoom.tsx

import { useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import useOmokSocket from '../../../hooks/useOmokSocket';
import OmokGameRoomView, { Stone, Player, GameResult, SelectedPos } from './GameRoomView';

interface LocationState {
  roomCode: string;
  sessionKey: string;
  myColor: 'black' | 'white';
}

export default function OmokGameRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const { roomCode, sessionKey, myColor } = (location.state || {}) as LocationState;

  const BOARD_SIZE = 15;

  const [board, setBoard] = useState<Stone[][]>(
    Array(BOARD_SIZE)
      .fill(null)
      .map(() => Array<Stone>(BOARD_SIZE).fill(null))
  );
  const [gameStarted, setGameStarted] = useState(false);
  const [currentTurn, setCurrentTurn] = useState<'black' | 'white'>('black');
  const [selectedPosition, setSelectedPosition] = useState<SelectedPos | null>(null);
  const [gameResult, setGameResult] = useState<GameResult | null>(null);

  const [players, setPlayers] = useState<{ black: Player; white: Player }>({
    black: {
      nickname: '플레이어1',
      rating: 1850,
      color: 'black',
      mainTime: 1800,
      byoyomiTime: 30,
      byoyomiCount: 3,
    },
    white: {
      nickname: '플레이어2',
      rating: 1720,
      color: 'white',
      mainTime: 1800,
      byoyomiTime: 30,
      byoyomiCount: 3,
    },
  });

  const [isInByoyomi, setIsInByoyomi] = useState({ black: false, white: false });

  // 모달 상태
  const [showResignConfirm, setShowResignConfirm] = useState(false);
  const [showInvalidMoveModal, setShowInvalidMoveModal] = useState(false);
  const [invalidMoveMessage, setInvalidMoveMessage] = useState('');
  const [showDrawWaiting, setShowDrawWaiting] = useState(false);
  const [showDrawOffer, setShowDrawOffer] = useState(false);
  const [showDrawRejected, setShowDrawRejected] = useState(false);

  const myPlayer = players[myColor];
  const opponentColor = myColor === 'black' ? 'white' : 'black';
  const opponentPlayer = players[opponentColor];

  // 정수형 좌표 변환 (0 ~ boardSize*boardSize-1)
  const xyToCoord = (x: number, y: number) => y * BOARD_SIZE + x;

  const handleServerMessage = useCallback(
    (msg: any) => {
      console.log('[WS] onServerMessage in page:', msg);

      switch (msg.type) {
        case 'opponent_joined': {
          const { color, nickname, rating } = msg;
          setPlayers((prev) => ({
            ...prev,
            [color]: { ...prev[color], nickname, rating },
          }));
          break;
        }

        case 'start': {
          setGameStarted(true);
          setCurrentTurn('black');
          setGameResult(null);
          break;
        }

        case 'move': {
          const color: 'black' | 'white' = msg.color;
          let row = msg.row;
          let col = msg.col;

          if (row == null || col == null) {
            const coord = msg.coordinate;
            row = Math.floor(coord / BOARD_SIZE);
            col = coord % BOARD_SIZE;
          }

          setBoard((prev) => {
            if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return prev;
            if (prev[row][col] !== null) return prev;

            const next = prev.map((r) => [...r]);
            next[row][col] = color;
            return next;
          });

          setSelectedPosition({ row, col });

          if (msg.gameResult) {
            setGameResult(msg.gameResult as GameResult);
            setGameStarted(false);
          } else {
            setCurrentTurn((prev) => (prev === 'black' ? 'white' : 'black'));
          }
          break;
        }

        case 'pass': {
          setCurrentTurn((prev) => (prev === 'black' ? 'white' : 'black'));
          break;
        }

        case 'end': {
          if (msg.result === 'resign') {
            const winner: 'black' | 'white' = msg.winner;
            setGameResult({ winner, reason: 'resign' });
            setGameStarted(false);
          }
          break;
        }

        case 'draw_request': {
          // 상대방이 나에게 무승부 제안
          setShowDrawOffer(true);
          setShowDrawWaiting(false);
          break;
        }

        case 'draw_response': {
          setShowDrawWaiting(false);
          if (msg.accepted) {
            setGameResult({ winner: 'draw', reason: 'draw' });
            setGameStarted(false);
          } else {
            setShowDrawRejected(true);
            setTimeout(() => setShowDrawRejected(false), 1500);
          }
          break;
        }

        case 'timer_update': {
          const { color, mainTime, byoyomiTime, byoyomiCount } = msg;
          setPlayers((prev) => ({
            ...prev,
            [color]: {
              ...prev[color],
              mainTime,
              byoyomiTime,
              byoyomiCount,
            },
          }));
          if (mainTime === 0) {
            setIsInByoyomi((prev) => ({ ...prev, [color]: true }));
          }
          break;
        }

        case 'game_result': {
          setGameResult(msg.gameResult as GameResult);
          setGameStarted(false);
          break;
        }

        default:
          console.log('[WS] unknown message type:', msg.type);
      }
    },
    [BOARD_SIZE],
  );

  const {
    isConnected,
    sendPlaceStone,
    sendPassMove,
    sendResign,
    sendDrawRequest,
    sendStartRequest,
  } = useOmokSocket({
    roomCode,
    sessionKey,
    onServerMessage: handleServerMessage,
  });

  // --- 핸들러들 ---

  const handleCellClick = (row: number, col: number) => {
    if (!gameStarted) return;
    if (currentTurn !== myColor) return;
    if (board[row][col] !== null) {
      setInvalidMoveMessage('이미 돌이 놓인 칸입니다.');
      setShowInvalidMoveModal(true);
      return;
    }
    setSelectedPosition({ row, col });
  };

  const handlePlaceStoneClick = () => {
    if (!gameStarted || currentTurn !== myColor || !selectedPosition) return;
    const { row, col } = selectedPosition;
    if (board[row][col] !== null) return;

    const coordinate = xyToCoord(col, row);
    sendPlaceStone({
      coordinate,
      boardSize: BOARD_SIZE,
      color: myColor,
    });
  };

  const handlePassClick = () => {
    if (!gameStarted || currentTurn !== myColor) return;
    sendPassMove(myColor);
  };

  const handleResignClick = () => {
    if (!gameStarted) return;
    setShowResignConfirm(true);
  };

  const confirmResign = () => {
    sendResign(myColor);
    setShowResignConfirm(false);
  };

  const cancelResign = () => setShowResignConfirm(false);

  const handleDrawRequestClick = () => {
    if (!gameStarted || currentTurn !== myColor) return;
    sendDrawRequest(myColor);
    setShowDrawWaiting(true);
  };

  const handleDrawResponse = (accepted: boolean) => {
    setShowDrawOffer(false);
    if (accepted) {
      setGameResult({ winner: 'draw', reason: 'draw' });
      setGameStarted(false);
    }
  };

  const handleStartGameClick = () => {
    sendStartRequest();
  };

  const handleBackToLobby = () => {
    navigate('/');
  };

  const hasOpponent = useMemo(
    () =>
      opponentPlayer &&
      opponentPlayer.nickname !== '' &&
      opponentPlayer.nickname !== '대기 중...',
    [opponentPlayer],
  );

  return (
    <OmokGameRoomView
      // 공통 상태
      roomCode={roomCode}
      board={board}
      boardSize={BOARD_SIZE}
      myColor={myColor}
      currentTurn={currentTurn}
      gameStarted={gameStarted}
      gameResult={gameResult}
      players={players}
      isInByoyomi={isInByoyomi}
      selectedPosition={selectedPosition}
      hasOpponent={hasOpponent}
      isConnected={isConnected}
      // 모달 상태
      showResignConfirm={showResignConfirm}
      showInvalidMoveModal={showInvalidMoveModal}
      invalidMoveMessage={invalidMoveMessage}
      showDrawWaiting={showDrawWaiting}
      showDrawOffer={showDrawOffer}
      showDrawRejected={showDrawRejected}
      // 이벤트 핸들러
      onCellClick={handleCellClick}
      onPlaceStone={handlePlaceStoneClick}
      onPass={handlePassClick}
      onResign={handleResignClick}
      onConfirmResign={confirmResign}
      onCancelResign={cancelResign}
      onDrawRequest={handleDrawRequestClick}
      onDrawResponse={handleDrawResponse}
      onStartGame={handleStartGameClick}
      onBackToLobby={handleBackToLobby}
      onCloseInvalidMoveModal={() => setShowInvalidMoveModal(false)}
      onCloseDrawRejected={() => setShowDrawRejected(false)}
    />
  );
}
