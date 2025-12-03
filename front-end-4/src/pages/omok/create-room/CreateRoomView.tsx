// src/pages/omok/create-room/CreateRoomView.tsx

export interface GameSettings {
  gameType: 'omok';
  mainTime: number;          // 메인 시간(초)
  additionalTime: number;    // 추가 시간(초, 피셔 타임)
  byoyomiTime: number;       // 초읽기 시간(초)
  byoyomiCount: number;      // 초읽기 횟수
  useMainTime: boolean;
  useAdditionalTime: boolean;
  useByoyomiTime: boolean;
  useByoyomiCount: boolean;
}

export interface OmokCreateRoomViewProps {
  gameSettings: GameSettings;
  canEditSettings: boolean;
  isHost: boolean;
  onToggleSetting: (
    field: 'useMainTime' | 'useAdditionalTime' | 'useByoyomiTime' | 'useByoyomiCount'
  ) => void;
  onChangeSlider: (
    field: 'mainTime' | 'additionalTime' | 'byoyomiTime' | 'byoyomiCount',
    value: number
  ) => void;
  onStartGame: () => void;
  onLeaveRoom: () => void;
}

export default function CreateRoomView({
  gameSettings,
  canEditSettings,
  isHost,
  onToggleSetting,
  onChangeSlider,
  onStartGame,
  onLeaveRoom,
}: OmokCreateRoomViewProps) {
  return (
    <div
      className="min-h-screen text-white p-8"
      style={{ backgroundColor: '#0b0c10' }}
    >
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: '#e8eaf0' }}
          >
            오목 방 만들기
          </h1>
          <p style={{ color: '#9aa1ad' }}>
            게임 설정을 조정하고 방을 생성하세요
          </p>
        </div>

        {/* 게임 설정 카드 */}
        <div
          className="rounded-xl p-6 border mb-6"
          style={{
            backgroundColor: 'rgba(22,22,28,0.6)',
            borderColor: '#2a2a33',
          }}
        >
          <h3
            className="text-xl font-bold mb-6"
            style={{ color: '#e8eaf0' }}
          >
            게임 설정
          </h3>

          <div className="grid grid-cols-2 gap-8">
            {/* 기본 시간 설정 */}
            <div>
              <h4
                className="text-lg font-semibold mb-4"
                style={{ color: '#8ab4f8' }}
              >
                기본 시간 설정
              </h4>
              <div className="space-y-6">
                {/* 메인 시간 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={gameSettings.useMainTime}
                        onChange={() => onToggleSetting('useMainTime')}
                        disabled={!canEditSettings}
                        className="w-4 h-4 cursor-pointer"
                        style={{
                          cursor: canEditSettings ? 'pointer' : 'not-allowed',
                        }}
                      />
                      <span style={{ color: '#9aa1ad' }}>메인 시간</span>
                    </div>
                    <span
                      className="font-mono font-semibold"
                      style={{ color: '#e8eaf0' }}
                    >
                      {Math.floor(gameSettings.mainTime / 60)}분
                    </span>
                  </div>
                  {gameSettings.useMainTime && (
                    <input
                      type="range"
                      min="0"
                      max="3600"
                      step="60"
                      value={gameSettings.mainTime}
                      onChange={(e) =>
                        onChangeSlider(
                          'mainTime',
                          parseInt(e.target.value, 10),
                        )
                      }
                      disabled={!canEditSettings}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #1f6feb 0%, #1f6feb ${
                          (gameSettings.mainTime / 3600) * 100
                        }%, #2a2a33 ${
                          (gameSettings.mainTime / 3600) * 100
                        }%, #2a2a33 100%)`,
                        cursor: canEditSettings ? 'pointer' : 'not-allowed',
                      }}
                    />
                  )}
                </div>

                {/* 추가 시간(피셔 타임) */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={gameSettings.useAdditionalTime}
                        onChange={() => onToggleSetting('useAdditionalTime')}
                        disabled={!canEditSettings}
                        className="w-4 h-4 cursor-pointer"
                        style={{
                          cursor: canEditSettings ? 'pointer' : 'not-allowed',
                        }}
                      />
                      <span style={{ color: '#9aa1ad' }}>추가 시간</span>
                    </div>
                    <span
                      className="font-mono font-semibold"
                      style={{ color: '#e8eaf0' }}
                    >
                      {gameSettings.additionalTime}초
                    </span>
                  </div>
                  {gameSettings.useAdditionalTime && (
                    <input
                      type="range"
                      min="0"
                      max="60"
                      step="1"
                      value={gameSettings.additionalTime}
                      onChange={(e) =>
                        onChangeSlider(
                          'additionalTime',
                          parseInt(e.target.value, 10),
                        )
                      }
                      disabled={!canEditSettings}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #1f6feb 0%, #1f6feb ${
                          (gameSettings.additionalTime / 60) * 100
                        }%, #2a2a33 ${
                          (gameSettings.additionalTime / 60) * 100
                        }%, #2a2a33 100%)`,
                        cursor: canEditSettings ? 'pointer' : 'not-allowed',
                      }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* 초읽기 설정 */}
            <div>
              <h4
                className="text-lg font-semibold mb-4"
                style={{ color: '#8ab4f8' }}
              >
                초읽기 설정
              </h4>
              <div className="space-y-6">
                {/* 초읽기 시간 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={gameSettings.useByoyomiTime}
                        onChange={() => onToggleSetting('useByoyomiTime')}
                        disabled={!canEditSettings}
                        className="w-4 h-4 cursor-pointer"
                        style={{
                          cursor: canEditSettings ? 'pointer' : 'not-allowed',
                        }}
                      />
                      <span style={{ color: '#9aa1ad' }}>초읽기 시간</span>
                    </div>
                    <span
                      className="font-mono font-semibold"
                      style={{ color: '#e8eaf0' }}
                    >
                      {gameSettings.byoyomiTime}초
                    </span>
                  </div>
                  {gameSettings.useByoyomiTime && (
                    <input
                      type="range"
                      min="0"
                      max="300"
                      step="1"
                      value={gameSettings.byoyomiTime}
                      onChange={(e) =>
                        onChangeSlider(
                          'byoyomiTime',
                          parseInt(e.target.value, 10),
                        )
                      }
                      disabled={!canEditSettings}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #1f6feb 0%, #1f6feb ${
                          (gameSettings.byoyomiTime / 300) * 100
                        }%, #2a2a33 ${
                          (gameSettings.byoyomiTime / 300) * 100
                        }%, #2a2a33 100%)`,
                        cursor: canEditSettings ? 'pointer' : 'not-allowed',
                      }}
                    />
                  )}
                </div>

                {/* 초읽기 횟수 */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={gameSettings.useByoyomiCount}
                        onChange={() => onToggleSetting('useByoyomiCount')}
                        disabled={!canEditSettings}
                        className="w-4 h-4 cursor-pointer"
                        style={{
                          cursor: canEditSettings ? 'pointer' : 'not-allowed',
                        }}
                      />
                      <span style={{ color: '#9aa1ad' }}>초읽기 횟수</span>
                    </div>
                    <span
                      className="font-mono font-semibold"
                      style={{ color: '#e8eaf0' }}
                    >
                      {gameSettings.byoyomiCount}회
                    </span>
                  </div>
                  {gameSettings.useByoyomiCount && (
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="1"
                      value={gameSettings.byoyomiCount}
                      onChange={(e) =>
                        onChangeSlider(
                          'byoyomiCount',
                          parseInt(e.target.value, 10),
                        )
                      }
                      disabled={!canEditSettings}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #1f6feb 0%, #1f6feb ${
                          (gameSettings.byoyomiCount / 10) * 100
                        }%, #2a2a33 ${
                          (gameSettings.byoyomiCount / 10) * 100
                        }%, #2a2a33 100%)`,
                        cursor: canEditSettings ? 'pointer' : 'not-allowed',
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 영역 */}
        <div className="flex justify-center gap-4">
          {/* 나가기 / 취소 */}
          <button
            type="button"
            onClick={onLeaveRoom}
            className="px-8 py-4 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap border"
            style={{
              backgroundColor: '#141822',
              borderColor: '#2a2a33',
              color: '#e8eaf0',
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
            나가기
          </button>

          {/* 방 만들기 / 게임 시작하기 */}
          <button
            type="button"
            onClick={onStartGame}
            disabled={!isHost}
            className="px-8 py-4 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap text-white text-lg"
            style={{
              background: isHost
                ? 'linear-gradient(180deg, #1f6feb, #1b4fd8)'
                : '#2a2a33',
              boxShadow: isHost ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              opacity: isHost ? 1 : 0.5,
              cursor: isHost ? 'pointer' : 'not-allowed',
            }}
          >
            {isHost ? '방 만들기' : '방장만 생성 가능'}
          </button>
        </div>
      </div>
    </div>
  );
}