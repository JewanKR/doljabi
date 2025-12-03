// src/components/OmokGameRoomView.tsx
import React from 'react';

export type Stone = 'black' | 'white' | null;

export interface Player {
  nickname: string;
  rating: number;
  color: 'black' | 'white';
  mainTime: number;
  byoyomiTime: number;
  byoyomiCount: number;
}

export type GameResult = {
  winner: 'black' | 'white' | 'draw';
  reason: 'win' | 'resign' | 'draw';
} | null;

export type SelectedPos = { row: number; col: number };

interface Props {
  roomCode: string;
  board: Stone[][];
  boardSize: number;
  myColor: 'black' | 'white';
  currentTurn: 'black' | 'white';
  gameStarted: boolean;
  gameResult: GameResult;
  players: { black: Player; white: Player };
  isInByoyomi: { black: boolean; white: boolean };
  selectedPosition: SelectedPos | null;
  hasOpponent: boolean;
  isConnected: boolean;

  showResignConfirm: boolean;
  showInvalidMoveModal: boolean;
  invalidMoveMessage: string;
  showDrawWaiting: boolean;
  showDrawOffer: boolean;
  showDrawRejected: boolean;

  onCellClick: (row: number, col: number) => void;
  onPlaceStone: () => void;
  onPass: () => void;
  onResign: () => void;
  onConfirmResign: () => void;
  onCancelResign: () => void;
  onDrawRequest: () => void;
  onDrawResponse: (accepted: boolean) => void;
  onStartGame: () => void;
  onBackToLobby: () => void;
  onCloseInvalidMoveModal: () => void;
  onCloseDrawRejected: () => void;
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const OmokGameRoomView: React.FC<Props> = (props) => {
  const {
    roomCode,
    board,
    boardSize,
    myColor,
    currentTurn,
    gameStarted,
    gameResult,
    players,
    isInByoyomi,
    selectedPosition,
    hasOpponent,
    isConnected,

    showResignConfirm,
    showInvalidMoveModal,
    invalidMoveMessage,
    showDrawWaiting,
    showDrawOffer,
    showDrawRejected,

    onCellClick,
    onPlaceStone,
    onPass,
    onResign,
    onConfirmResign,
    onCancelResign,
    onDrawRequest,
    onDrawResponse,
    onStartGame,
    onBackToLobby,
    onCloseInvalidMoveModal,
    onCloseDrawRejected,
  } = props;

  const myPlayer = players[myColor];
  const opponentColor = myColor === 'black' ? 'white' : 'black';
  const opponentPlayer = players[opponentColor];

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0b0c10' }}>
      {/* 헤더 */}
      <header className="flex items-center justify-between px-8 py-4 border-b" style={{ borderColor: '#2a2a33' }}>
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #1f6feb 0%, #1b4fd8 100%)',
              boxShadow: '0 4px 12px rgba(31, 111, 235, 0.3)',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" fill="white" opacity="0.9" />
              <circle cx="10" cy="10" r="5" fill="black" opacity="0.8" />
            </svg>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Doljabi
          </h1>
        </div>
        <div className="text-lg font-semibold" style={{ color: '#e8eaf0' }}>
          오목 대국 {isConnected ? '🟢' : '🔴'}
        </div>
        <div className="text-sm" style={{ color: '#9aa1ad' }}>
          방 코드: <span className="font-mono">{roomCode}</span>
        </div>
      </header>

      {/* 메인 */}
      <div className="flex items-start justify-center min-h-[calc(100vh-72px)] p-6 gap-4">
        {/* 왼쪽: 플레이어 정보 */}
        <div className="w-64 flex flex-col gap-3">
          {/* 내 정보 */}
          <PlayerCard
            title="나"
            player={myPlayer}
            isTurn={gameStarted && currentTurn === myColor}
            isInByoyomi={isInByoyomi[myColor]}
          />
          {/* 상대 정보 */}
          <PlayerCard
            title="상대"
            player={opponentPlayer}
            isTurn={gameStarted && currentTurn === opponentColor}
            isInByoyomi={isInByoyomi[opponentColor]}
          />
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
              className="aspect-square rounded-xl p-4 relative"
              style={{
                background: 'linear-gradient(135deg, #d4a574 0%, #c89968 100%)',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              {/* 격자선 */}
              <div
                className="absolute inset-6 grid gap-0"
                style={{
                  gridTemplateColumns: `repeat(${boardSize - 1}, 1fr)`,
                  gridTemplateRows: `repeat(${boardSize - 1}, 1fr)`,
                }}
              >
                {Array.from({ length: boardSize - 1 }).map((_, r) =>
                  Array.from({ length: boardSize - 1 }).map((_, c) => (
                    <div
                      key={`grid-${r}-${c}`}
                      className="relative"
                      style={{
                        borderRight: c < boardSize - 2 ? '1px solid rgba(0,0,0,0.3)' : 'none',
                        borderBottom: r < boardSize - 2 ? '1px solid rgba(0,0,0,0.3)' : 'none',
                      }}
                    />
                  )),
                )}
              </div>
              <div className="absolute inset-6 pointer-events-none" style={{ border: '1px solid rgba(0,0,0,0.3)' }} />

              {/* 교차점 + 돌 */}
              <div className="absolute inset-6">
                {board.map((row, r) =>
                  row.map((cell, c) => {
                    const cellSize = 100 / (boardSize - 1);
                    const top = `${r * cellSize}%`;
                    const left = `${c * cellSize}%`;

                    const isSelected =
                      selectedPosition?.row === r && selectedPosition?.col === c;

                    return (
                      <div
                        key={`stone-${r}-${c}`}
                        onClick={() => onCellClick(r, c)}
                        className="absolute flex items-center justify-center"
                        style={{
                          top,
                          left,
                          width: '6%',
                          height: '6%',
                          transform: 'translate(-50%, -50%)',
                          backgroundColor: isSelected
                            ? 'rgba(31, 111, 235, 0.4)'
                            : 'transparent',
                          borderRadius: '50%',
                          cursor: gameStarted && !cell ? 'pointer' : 'default',
                        }}
                      >
                        {/* 중앙 화점 하나 예시 (15x15 기준 7,7) */}
                        {!cell && r === 7 && c === 7 && (
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: 'rgba(0,0,0,0.5)', pointerEvents: 'none' }}
                          />
                        )}

                        {/* 돌 */}
                        {cell && (
                          <div
                            className="rounded-full"
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
                          />
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
              <div
                className="rounded-xl p-4 border text-center"
                style={{
                  backgroundColor: 'rgba(22,22,28,0.6)',
                  borderColor: '#2a2a33',
                }}
              >
                <div className="text-sm mb-1" style={{ color: '#9aa1ad' }}>
                  상태
                </div>
                <div className="text-lg font-semibold" style={{ color: '#e8eaf0' }}>
                  {hasOpponent ? '상대 준비 완료' : '상대 대기 중'}
                </div>
              </div>
              <button
                onClick={onStartGame}
                disabled={!hasOpponent}
                className="w-full py-3 rounded-lg font-semibold text-white"
                style={{
                  background: hasOpponent
                    ? 'linear-gradient(180deg, #1f6feb, #1b4fd8)'
                    : '#2a2a33',
                  opacity: hasOpponent ? 1 : 0.5,
                }}
              >
                대국 시작하기
              </button>
              <button
                onClick={onBackToLobby}
                className="w-full py-3 rounded-lg font-semibold border"
                style={{
                  backgroundColor: '#141822',
                  borderColor: '#2a2a33',
                  color: '#e8eaf0',
                }}
              >
                로비로 돌아가기
              </button>
            </>
          ) : (
            <>
              {/* 선택된 수 정보 */}
              <div
                className="rounded-xl p-4 border"
                style={{
                  backgroundColor: 'rgba(22,22,28,0.6)',
                  borderColor: '#2a2a33',
                }}
              >
                <div className="text-sm mb-1" style={{ color: '#9aa1ad' }}>
                  선택된 좌표
                </div>
                <div
                  className="text-xl font-mono font-bold text-center p-2 rounded"
                  style={{ backgroundColor: '#141822', color: '#8ab4f8' }}
                >
                  {selectedPosition
                    ? `(${selectedPosition.col}, ${selectedPosition.row})`
                    : '미선택'}
                </div>
              </div>

              {/* 액션 버튼 */}
              <button
                onClick={onPlaceStone}
                disabled={!selectedPosition || currentTurn !== myColor}
                className="w-full py-3 rounded-lg font-semibold text-white"
                style={{
                  background:
                    selectedPosition && currentTurn === myColor
                      ? 'linear-gradient(180deg, #1f6feb, #1b4fd8)'
                      : '#2a2a33',
                  opacity:
                    selectedPosition && currentTurn === myColor ? 1 : 0.5,
                }}
              >
                착수하기
              </button>

              <button
                onClick={onPass}
                disabled={currentTurn !== myColor}
                className="w-full py-3 rounded-lg font-semibold border"
                style={{
                  backgroundColor: '#141822',
                  borderColor: '#2a2a33',
                  color: '#e8eaf0',
                  opacity: currentTurn === myColor ? 1 : 0.5,
                }}
              >
                수 넘김
              </button>

              <button
                onClick={onDrawRequest}
                disabled={currentTurn !== myColor}
                className="w-full py-3 rounded-lg font-semibold border"
                style={{
                  backgroundColor: '#141822',
                  borderColor: '#2a2a33',
                  color: '#f59e0b',
                  opacity: currentTurn === myColor ? 1 : 0.5,
                }}
              >
                무승부 신청
              </button>

              <button
                onClick={onResign}
                className="w-full py-3 rounded-lg font-semibold border"
                style={{
                  backgroundColor: '#141822',
                  borderColor: '#2a2a33',
                  color: '#ef4444',
                }}
              >
                기권
              </button>

              {/* 현재 차례 */}
              <div
                className="rounded-xl p-4 border text-center"
                style={{
                  backgroundColor: 'rgba(22,22,28,0.6)',
                  borderColor: '#2a2a33',
                }}
              >
                <div className="text-sm mb-1" style={{ color: '#9aa1ad' }}>
                  현재 차례
                </div>
                <div className="flex items-center justify-center gap-2">
                  <div
                    className="w-7 h-7 rounded-full"
                    style={{
                      backgroundColor:
                        currentTurn === 'black' ? '#1a1a1a' : '#f5f5f5',
                      border: '2px solid',
                      borderColor:
                        currentTurn === 'black' ? '#000' : '#ddd',
                    }}
                  />
                  <span className="text-lg font-bold">
                    {currentTurn === 'black' ? '흑' : '백'}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 기권 확인 모달 */}
      {showResignConfirm && (
        <Modal onClose={onCancelResign}>
          <div className="text-center space-y-4">
            <div className="text-5xl">⚠️</div>
            <h3 className="text-xl font-bold" style={{ color: '#ef4444' }}>
              기권하시겠습니까?
            </h3>
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={onConfirmResign}
                className="w-full py-2 rounded-lg font-semibold text-white"
                style={{
                  background: 'linear-gradient(180deg, #ef4444, #dc2626)',
                }}
              >
                예, 기권합니다
              </button>
              <button
                onClick={onCancelResign}
                className="w-full py-2 rounded-lg font-semibold border"
                style={{
                  backgroundColor: '#141822',
                  borderColor: '#2a2a33',
                  color: '#e8eaf0',
                }}
              >
                아니오
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 무승부 대기 모달 (내가 신청) */}
      {showDrawWaiting && (
        <Modal>
          <div className="text-center space-y-4">
            <div className="text-5xl">🤝</div>
            <h3 className="text-xl font-bold" style={{ color: '#f59e0b' }}>
              무승부 제안 전송 중
            </h3>
            <p style={{ color: '#9aa1ad' }}>상대방 응답을 기다리는 중입니다…</p>
          </div>
        </Modal>
      )}

      {/* 무승부 제안 모달 (상대가 나에게 제안) */}
      {showDrawOffer && (
        <Modal>
          <div className="text-center space-y-4">
            <div className="text-5xl">🤝</div>
            <h3 className="text-xl font-bold" style={{ color: '#f59e0b' }}>
              상대가 무승부를 제안했습니다
            </h3>
            <div className="flex flex-col gap-2 mt-2">
              <button
                onClick={() => onDrawResponse(true)}
                className="w-full py-2 rounded-lg font-semibold text-white"
                style={{
                  background: 'linear-gradient(180deg, #1f6feb, #1b4fd8)',
                }}
              >
                수락
              </button>
              <button
                onClick={() => onDrawResponse(false)}
                className="w-full py-2 rounded-lg font-semibold border"
                style={{
                  backgroundColor: '#141822',
                  borderColor: '#2a2a33',
                  color: '#e8eaf0',
                }}
              >
                거절
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 무승부 거절 알림 */}
      {showDrawRejected && (
        <Modal>
          <div className="text-center space-y-4">
            <div className="text-5xl">❌</div>
            <h3 className="text-xl font-bold" style={{ color: '#ef4444' }}>
              무승부가 거절되었습니다
            </h3>
          </div>
        </Modal>
      )}

      {/* 잘못된 착수 모달 */}
      {showInvalidMoveModal && (
        <Modal onClose={onCloseInvalidMoveModal}>
          <div className="text-center space-y-4">
            <div className="text-5xl">⚠️</div>
            <h3 className="text-xl font-bold" style={{ color: '#f59e0b' }}>
              알림
            </h3>
            <p style={{ color: '#e8eaf0' }}>{invalidMoveMessage}</p>
            <button
              onClick={onCloseInvalidMoveModal}
              className="w-full py-2 rounded-lg font-semibold text-white"
              style={{
                background: 'linear-gradient(180deg, #1f6feb, #1b4fd8)',
              }}
            >
              확인
            </button>
          </div>
        </Modal>
      )}

      {/* 게임 결과 모달 */}
      {gameResult && (
        <Modal>
          <div className="text-center space-y-4">
            {gameResult.winner === 'draw' ? (
              <>
                <div className="text-5xl">🤝</div>
                <h3 className="text-xl font-bold" style={{ color: '#f59e0b' }}>
                  무승부
                </h3>
                <p style={{ color: '#9aa1ad' }}>대국이 무승부로 종료되었습니다.</p>
              </>
            ) : gameResult.winner === myColor ? (
              <>
                <div className="text-5xl">🎉</div>
                <h3 className="text-xl font-bold" style={{ color: '#10b981' }}>
                  승리!
                </h3>
                <p style={{ color: '#e8eaf0' }}>{myPlayer.nickname}님의 승리입니다.</p>
              </>
            ) : (
              <>
                <div className="text-5xl">😢</div>
                <h3 className="text-xl font-bold" style={{ color: '#ef4444' }}>
                  패배
                </h3>
                <p style={{ color: '#e8eaf0' }}>{opponentPlayer.nickname}님이 승리했습니다.</p>
              </>
            )}
            <button
              onClick={onBackToLobby}
              className="w-full py-2 rounded-lg font-semibold text-white"
              style={{
                background: 'linear-gradient(180deg, #1f6feb, #1b4fd8)',
              }}
            >
              로비로 돌아가기
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default OmokGameRoomView;

// --- 서브 컴포넌트들 ---

const PlayerCard: React.FC<{
  title: string;
  player: Player;
  isTurn: boolean;
  isInByoyomi: boolean;
}> = ({ title, player, isTurn, isInByoyomi }) => {
  return (
    <div
      className={`rounded-xl p-4 border ${isTurn ? 'ring-2 ring-blue-500' : ''}`}
      style={{
        backgroundColor: 'rgba(22,22,28,0.6)',
        borderColor: isTurn ? '#1f6feb' : '#2a2a33',
      }}
    >
      <div className="text-xs mb-1" style={{ color: '#9aa1ad' }}>
        {title}
      </div>
      <div className="flex items-center justify-between mb-2">
        <div>
          <div className="font-bold" style={{ color: '#e8eaf0' }}>
            {player.nickname}
          </div>
          <div className="text-sm" style={{ color: '#9aa1ad' }}>
            {player.rating} 점
          </div>
        </div>
        <div
          className="w-8 h-8 rounded-full"
          style={{
            backgroundColor: player.color === 'black' ? '#1a1a1a' : '#f5f5f5',
            border: '2px solid',
            borderColor: player.color === 'black' ? '#000' : '#ddd',
          }}
        />
      </div>
      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span style={{ color: '#9aa1ad' }}>메인 시간</span>
          <span
            className="font-mono"
            style={{ color: isInByoyomi ? '#ef4444' : '#e8eaf0' }}
          >
            {formatTime(player.mainTime)}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: '#9aa1ad' }}>초읽기</span>
          <span
            className="font-mono"
            style={{ color: isInByoyomi ? '#ef4444' : '#9aa1ad' }}
          >
            {formatTime(player.byoyomiTime)}
          </span>
        </div>
        <div className="flex justify-between">
          <span style={{ color: '#9aa1ad' }}>남은 횟수</span>
          <span
            className="font-mono"
            style={{ color: isInByoyomi ? '#ef4444' : '#9aa1ad' }}
          >
            {player.byoyomiCount}회
          </span>
        </div>
      </div>
    </div>
  );
};

const Modal: React.FC<{ children: React.ReactNode; onClose?: () => void }> = ({
  children,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={onClose}
    >
      <div
        className="rounded-2xl p-6 w-full max-w-md border"
        style={{
          backgroundColor: 'rgba(22,22,28,0.95)',
          borderColor: '#2a2a33',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};
