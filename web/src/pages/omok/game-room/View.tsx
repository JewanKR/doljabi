// GameRoomView.tsx
import React from 'react';

type Color = 'black' | 'white';

interface Player {
  nickname: string;
  rating: number;
  color: Color;
  mainTime: number;
  byoyomiTime: number;
  byoyomiCount: number;
}

interface GameRoomViewProps {
  boardSize: number;
  board: (null | Color)[][];
  currentTurn: Color;
  myColor: Color;
  selectedPosition: { row: number; col: number } | null;

  myPlayer: Player;
  opponentPlayer: Player;
  opponentColor: Color;

  myTimePercentage: number;
  opponentTimePercentage: number;
  isInByoyomi: { black: boolean; white: boolean };

  selectedCoordinateDisplay: string;
  isMyTurn: boolean;
  lastHeard: string;

  onCellClick: (row: number, col: number) => void;
  onPlaceStone: () => void;
  onPass: () => void;
  onDrawRequest: () => void;
  onResign: () => void;
}

// 시간바 색상 (디자인 쪽)
const getTimeBarColor = (percentage: number) => {
  if (percentage > 50) return '#10b981';
  if (percentage > 20) return '#f59e0b';
  return '#ef4444';
};

// 시간 포맷 (UI용)
const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes)
    .padStart(2, '0')
    .padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const GameRoomView: React.FC<GameRoomViewProps> = props => {
  const {
    boardSize,
    board,
    currentTurn,
    myColor,
    selectedPosition,
    myPlayer,
    opponentPlayer,
    opponentColor,
    myTimePercentage,
    opponentTimePercentage,
    isInByoyomi,
    selectedCoordinateDisplay,
    isMyTurn,
    lastHeard,
    onCellClick,
    onPlaceStone,
    onPass,
    onDrawRequest,
    onResign,
  } = props;

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0b0c10' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-8 py-4 border-b"
        style={{ borderColor: '#2a2a33' }}
      >
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #1f6feb 0%, #1b4fd8 100%)',
              boxShadow: '0 4px 12px rgba(31, 111, 235, 0.3)',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
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
          {/* 내 정보 */}
          <div
            className={`flex-1 rounded-xl p-4 border mb-2 ${
              currentTurn === myColor ? 'ring-2 ring-blue-500' : ''
            }`}
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
                  boxShadow:
                    myColor === 'black'
                      ? '0 2px 8px rgba(0,0,0,0.5)'
                      : '0 2px 8px rgba(255,255,255,0.3)',
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="12" cy="12" r="10" fill={myColor === 'black' ? '#000' : '#fff'} />
                  {myColor === 'white' && <circle cx="9" cy="9" r="3" fill="rgba(0,0,0,0.1)" />}
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-bold" style={{ color: '#e8eaf0' }}>
                  {myPlayer.nickname}
                </div>
                <div className="text-sm flex items-center space-x-1">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 1L7 4L10 4.5L7.5 6.5L8 9.5L6 8L4 9.5L4.5 6.5L2 4.5L5 4L6 1Z"
                      fill="#f59e0b"
                    />
                  </svg>
                  <span style={{ color: '#9aa1ad' }}>{myPlayer.rating}</span>
                </div>
              </div>
            </div>

            {/* 시간바 */}
            <div className="mb-3">
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: '#141822' }}
              >
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
              <div
                className="flex items-center justify-between p-2 rounded"
                style={{ backgroundColor: '#141822' }}
              >
                <span className="text-sm" style={{ color: '#9aa1ad' }}>
                  메인 시간
                </span>
                <span
                  className="font-mono font-bold"
                  style={{ color: isInByoyomi[myColor] ? '#ef4444' : '#e8eaf0' }}
                >
                  {formatTime(myPlayer.mainTime)}
                </span>
              </div>

              <div
                className="flex items-center justify-between p-2 rounded"
                style={{ backgroundColor: '#141822' }}
              >
                <span className="text-sm" style={{ color: '#9aa1ad' }}>
                  초읽기
                </span>
                <span
                  className="font-mono font-bold"
                  style={{ color: isInByoyomi[myColor] ? '#ef4444' : '#9aa1ad' }}
                >
                  {formatTime(myPlayer.byoyomiTime)}
                </span>
              </div>

              <div
                className="flex items-center justify-between p-2 rounded"
                style={{ backgroundColor: '#141822' }}
              >
                <span className="text-sm" style={{ color: '#9aa1ad' }}>
                  남은 횟수
                </span>
                <span
                  className="font-mono font-bold"
                  style={{ color: isInByoyomi[myColor] ? '#ef4444' : '#9aa1ad' }}
                >
                  {myPlayer.byoyomiCount}회
                </span>
              </div>
            </div>
          </div>

          {/* 상대 정보 */}
          <div
            className={`flex-1 rounded-xl p-4 border ${
              currentTurn === opponentColor ? 'ring-2 ring-blue-500' : ''
            }`}
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
                  boxShadow:
                    opponentColor === 'black'
                      ? '0 2px 8px rgba(0,0,0,0.5)'
                      : '0 2px 8px rgba(255,255,255,0.3)',
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill={opponentColor === 'black' ? '#000' : '#fff'}
                  />
                  {opponentColor === 'white' && (
                    <circle cx="9" cy="9" r="3" fill="rgba(0,0,0,0.1)" />
                  )}
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-bold" style={{ color: '#e8eaf0' }}>
                  {opponentPlayer.nickname}
                </div>
                <div className="text-sm flex items-center space-x-1">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 1L7 4L10 4.5L7.5 6.5L8 9.5L6 8L4 9.5L4.5 6.5L2 4.5L5 4L6 1Z"
                      fill="#f59e0b"
                    />
                  </svg>
                  <span style={{ color: '#9aa1ad' }}>{opponentPlayer.rating}</span>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: '#141822' }}
              >
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
              <div
                className="flex items-center justify-between p-2 rounded"
                style={{ backgroundColor: '#141822' }}
              >
                <span className="text-sm" style={{ color: '#9aa1ad' }}>
                  메인 시간
                </span>
                <span
                  className="font-mono font-bold"
                  style={{ color: isInByoyomi[opponentColor] ? '#ef4444' : '#e8eaf0' }}
                >
                  {formatTime(opponentPlayer.mainTime)}
                </span>
              </div>

              <div
                className="flex items-center justify-between p-2 rounded"
                style={{ backgroundColor: '#141822' }}
              >
                <span className="text-sm" style={{ color: '#9aa1ad' }}>
                  초읽기
                </span>
                <span
                  className="font-mono font-bold"
                  style={{ color: isInByoyomi[opponentColor] ? '#ef4444' : '#9aa1ad' }}
                >
                  {formatTime(opponentPlayer.byoyomiTime)}
                </span>
              </div>

              <div
                className="flex items-center justify-between p-2 rounded"
                style={{ backgroundColor: '#141822' }}
              >
                <span className="text-sm" style={{ color: '#9aa1ad' }}>
                  남은 횟수
                </span>
                <span
                  className="font-mono font-bold"
                  style={{ color: isInByoyomi[opponentColor] ? '#ef4444' : '#9aa1ad' }}
                >
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
              {/* 좌표 레이블 */}
              <div className="absolute inset-8 pointer-events-none" style={{ zIndex: 30 }}>
                {/* 열 A,B,C... */}
                {Array.from({ length: boardSize }).map((_, colIndex) => {
                  const cellSize = 100 / (boardSize - 1);
                  const left = `${colIndex * cellSize}%`;
                  const letter = String.fromCharCode('A'.charCodeAt(0) + colIndex);
                  return (
                    <div
                      key={`col-label-${colIndex}`}
                      className="absolute text-[10px] font-semibold"
                      style={{
                        top: 0,
                        left,
                        transform: 'translate(-50%, -115%)',
                        color: 'rgba(0,0,0,0.65)',
                        textShadow: '0 1px 1px rgba(255,255,255,0.6)',
                      }}
                    >
                      {letter}
                    </div>
                  );
                })}

                {/* 행 1~ */}
                {Array.from({ length: boardSize }).map((_, rowIndex) => {
                  const cellSize = 100 / (boardSize - 1);
                  const top = `${rowIndex * cellSize}%`;
                  const number = rowIndex + 1;
                  return (
                    <div
                      key={`row-label-${rowIndex}`}
                      className="absolute text-[10px] font-semibold"
                      style={{
                        left: 0,
                        top,
                        transform: 'translate(-160%, -60%)',
                        color: 'rgba(0,0,0,0.65)',
                        textShadow: '0 1px 1px rgba(255,255,255,0.6)',
                      }}
                    >
                      {number}
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

              {/* 외곽 */}
              <div
                className="absolute inset-8 pointer-events-none"
                style={{ border: '1px solid rgba(0,0,0,0.3)' }}
              />

              {/* 교차점 + 돌 */}
              <div className="absolute inset-8">
                {board.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    const cellSize = 100 / (boardSize - 1);
                    const topPosition = `${rowIndex * cellSize}%`;
                    const leftPosition = `${colIndex * cellSize}%`;

                    return (
                      <div
                        key={`stone-${rowIndex}-${colIndex}`}
                        onClick={() => onCellClick(rowIndex, colIndex)}
                        className="absolute cursor-pointer flex items-center justify-center"
                        style={{
                          top: topPosition,
                          left: leftPosition,
                          width: '5%',
                          height: '5%',
                          transform: 'translate(-50%, -50%)',
                          backgroundColor:
                            selectedPosition?.row === rowIndex &&
                            selectedPosition?.col === colIndex
                              ? 'rgba(31, 111, 235, 0.4)'
                              : 'transparent',
                          borderRadius: '50%',
                          zIndex: 10,
                        }}
                      >
                        {/* 화점 */}
                        {!cell &&
                          (rowIndex === 3 || rowIndex === 9 || rowIndex === 15) &&
                          (colIndex === 3 || colIndex === 9 || colIndex === 15) && (
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                pointerEvents: 'none',
                              }}
                            />
                          )}

                        {/* 돌 */}
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
                            <svg
                              width="100%"
                              height="100%"
                              viewBox="0 0 32 32"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <circle
                                cx="16"
                                cy="16"
                                r="14"
                                fill={cell === 'black' ? '#000' : '#fff'}
                              />
                              {cell === 'white' && (
                                <circle cx="12" cy="12" r="4" fill="rgba(0,0,0,0.1)" />
                              )}
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
          {/* 선택된 위치 */}
          <div
            className="rounded-xl p-4 border"
            style={{
              backgroundColor: 'rgba(22,22,28,0.6)',
              borderColor: '#2a2a33',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <div className="text-sm mb-2" style={{ color: '#9aa1ad' }}>
              선택된 위치 (서버 좌표)
            </div>
            <div
              className="text-2xl font-mono font-bold text-center p-3 rounded"
              style={{ backgroundColor: '#141822', color: '#8ab4f8' }}
            >
              {selectedCoordinateDisplay}
            </div>
          </div>

          <button
            onClick={onPlaceStone}
            disabled={!selectedPosition || !isMyTurn}
            className="w-full py-4 rounded-lg font-semibold transition-all whitespace-nowrap text-white text-lg"
            style={{
              background:
                selectedPosition && isMyTurn
                  ? 'linear-gradient(180deg, #1f6feb, #1b4fd8)'
                  : '#2a2a33',
              boxShadow:
                selectedPosition && isMyTurn ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              opacity: selectedPosition && isMyTurn ? 1 : 0.5,
              cursor: selectedPosition && isMyTurn ? 'pointer' : 'not-allowed',
            }}
          >
            착수하기
          </button>

          {/* 게임 컨트롤 */}
          <div className="space-y-3">
            <button
              onClick={onPass}
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
              onClick={onDrawRequest}
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
              onClick={onResign}
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

          {/* 현재 차례 */}
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
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="8"
                    cy="8"
                    r="7"
                    fill={currentTurn === 'black' ? '#000' : '#fff'}
                  />
                </svg>
              </div>
              <span className="text-xl font-bold" style={{ color: '#e8eaf0' }}>
                {currentTurn === 'black' ? '흑' : '백'}
              </span>
            </div>
          </div>

          {/* 마지막 음성 인식 로그 */}
          <div
            className="rounded-xl p-4 border"
            style={{
              backgroundColor: 'rgba(22,22,28,0.6)',
              borderColor: '#2a2a33',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <div className="text-sm mb-2" style={{ color: '#9aa1ad' }}>
              마지막 음성 인식
            </div>
            <div
              className="text-sm break-words"
              style={{ color: '#e8eaf0', minHeight: '2rem' }}
            >
              {lastHeard || '아직 인식된 음성이 없습니다.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRoomView;
