
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface Player {
  id: number;
  nickname: string;
  rating: number;
  color: 'black' | 'white';
  ready: boolean;
}

export default function OmokWaitingRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { roomCode?: string; isHost?: boolean; opponent?: any } | null;
  
  const [roomCode] = useState(() => 
    state?.roomCode || Math.random().toString(36).substring(2, 8).toUpperCase()
  );
  const [isHost] = useState(state?.isHost !== false);
  
  const [players, setPlayers] = useState<Player[]>(() => {
    if (state?.opponent) {
      return [
        {
          id: 1,
          nickname: '나',
          rating: 1500,
          color: 'black',
          ready: false
        },
        {
          id: 2,
          nickname: state.opponent.nickname,
          rating: state.opponent.rating,
          color: 'white',
          ready: true
        }
      ];
    } else if (!isHost) {
      return [
        {
          id: 1,
          nickname: '방장',
          rating: 1550,
          color: 'black',
          ready: true
        },
        {
          id: 2,
          nickname: '나',
          rating: 1500,
          color: 'white',
          ready: false
        }
      ];
    } else {
      return [
        {
          id: 1,
          nickname: '나',
          rating: 1500,
          color: 'black',
          ready: false
        },
        {
          id: 2,
          nickname: '대기 중...',
          rating: 0,
          color: 'white',
          ready: false
        }
      ];
    }
  });

  const [gameSettings, setGameSettings] = useState({
    gameType: 'omok',
    mainTime: 600, // 10분 = 600초
    additionalTime: 5,
    byoyomiTime: 30,
    byoyomiCount: 3,
    useMainTime: true,
    useAdditionalTime: true,
    useByoyomiTime: true,
    useByoyomiCount: true
  });

  useEffect(() => {
    if (isHost && players[1].nickname === '대기 중...' && !state?.opponent) {
      const timer = setTimeout(() => {
        setPlayers(prev => [
          prev[0],
          {
            id: 2,
            nickname: '친구플레이어',
            rating: 1480,
            color: 'white' as const,
            ready: false
          }
        ]);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isHost, players, state]);

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleReady = () => {
    const myId = isHost ? 1 : 2;
    setPlayers(prev => prev.map(p => 
      p.id === myId ? { ...p, ready: !p.ready } : p
    ));
  };

  const handleStartGame = () => {
    // 게임방(오목판이 있는 화면)으로 이동
    navigate('/omok/game-room', { 
      state: { 
        gameSettings, 
        players, 
        roomCode,
        isHost,
        hasOpponent: players[1].nickname !== '대기 중...'
      } 
    });
  };

  const handleLeaveRoom = () => {
    navigate('/');
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
  };

  const toggleSetting = (field: 'useMainTime' | 'useAdditionalTime' | 'useByoyomiTime' | 'useByoyomiCount') => {
    if (isHost) {
      setGameSettings(prev => ({ ...prev, [field]: !prev[field] }));
    }
  };

  const handleSliderChange = (field: 'mainTime' | 'additionalTime' | 'byoyomiTime' | 'byoyomiCount', value: number) => {
    if (isHost || state?.opponent) {
      setGameSettings(prev => ({ ...prev, [field]: value }));
    }
  };

  const allPlayersReady = players.every(p => p.ready) && players[1].nickname !== '대기 중...';
  const canEditSettings = isHost || state?.opponent;
  const hasOpponent = players[1].nickname !== '대기 중...';

  return (
    <div className="min-h-screen text-white p-8" style={{ backgroundColor: '#0b0c10' }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#e8eaf0' }}>오목 대기실</h1>
          <p style={{ color: '#9aa1ad' }}>게임 설정을 조정하고 대국을 시작하세요</p>
        </div>

        <div className="flex gap-8">
          {/* 왼쪽: 방 정보와 플레이어 목록 */}
          <div className="flex-1">
            {/* 방 코드 */}
            <div className="rounded-xl p-6 border mb-6"
                 style={{ 
                   backgroundColor: 'rgba(22,22,28,0.6)', 
                   borderColor: '#2a2a33'
                 }}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm mb-1" style={{ color: '#9aa1ad' }}>방 입장 코드</div>
                  <div className="text-2xl font-bold tracking-wider" style={{ color: '#e8eaf0' }}>{roomCode}</div>
                </div>
                <button 
                  onClick={copyRoomCode}
                  className="px-6 py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-2 border"
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
                  }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                    <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                  </svg>
                  <span>복사</span>
                </button>
              </div>
            </div>

            {/* 플레이어 목록 - 상대방이 있을 때만 표시 */}
            {hasOpponent && (
              <div className="rounded-xl p-6 border mb-6"
                   style={{ 
                     backgroundColor: 'rgba(22,22,28,0.6)', 
                     borderColor: '#2a2a33'
                   }}>
                <h3 className="text-xl font-bold mb-4" style={{ color: '#e8eaf0' }}>플레이어</h3>
                <div className="space-y-4">
                  {players.map((player, index) => (
                    <div key={player.id} className="flex items-center justify-between p-4 rounded-lg"
                         style={{ backgroundColor: '#141822' }}>
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-12 h-12 rounded-full flex items-center justify-center"
                          style={{
                            backgroundColor: player.color === 'black' ? '#1a1a1a' : '#f5f5f5',
                            border: '2px solid',
                            borderColor: player.color === 'black' ? '#333' : '#ddd',
                          }}
                        >
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="12" cy="12" r="10" fill={player.color === 'black' ? '#000' : '#fff'} />
                          </svg>
                        </div>
                        <div>
                          <div className="font-bold" style={{ color: '#e8eaf0' }}>
                            {player.nickname}
                          </div>
                          {player.rating > 0 && (
                            <div className="text-sm" style={{ color: '#9aa1ad' }}>
                              레이팅: {player.rating}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-3 py-1 rounded-full text-sm font-medium"
                              style={{ 
                                backgroundColor: player.color === 'black' ? '#1a1a1a' : '#f5f5f5',
                                color: player.color === 'black' ? '#fff' : '#000'
                              }}>
                          {player.color === 'black' ? '흑' : '백'}
                        </span>
                        {player.nickname !== '대기 중...' && (
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            player.ready ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                          }`}>
                            {player.ready ? '준비완료' : '대기중'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 준비 버튼 */}
                <button 
                  onClick={handleReady}
                  className="w-full mt-4 py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap"
                  style={{ 
                    backgroundColor: players.find(p => p.id === (isHost ? 1 : 2))?.ready ? '#dc2626' : '#16a34a',
                    color: '#ffffff'
                  }}>
                  {players.find(p => p.id === (isHost ? 1 : 2))?.ready ? '준비 취소' : '준비 완료'}
                </button>
              </div>
            )}

            {/* 게임 설정 */}
            <div className="rounded-xl p-6 border mb-6"
                 style={{ 
                   backgroundColor: 'rgba(22,22,28,0.6)', 
                   borderColor: '#2a2a33'
                 }}>
              <h3 className="text-xl font-bold mb-6" style={{ color: '#e8eaf0' }}>게임 설정</h3>
              
              <div className="grid grid-cols-2 gap-8">
                {/* 기본 시간 설정 */}
                <div>
                  <h4 className="text-lg font-semibold mb-4" style={{ color: '#8ab4f8' }}>기본 시간 설정</h4>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={gameSettings.useMainTime}
                            onChange={() => toggleSetting('useMainTime')}
                            disabled={!canEditSettings}
                            className="w-4 h-4 cursor-pointer"
                            style={{ cursor: canEditSettings ? 'pointer' : 'not-allowed' }}
                          />
                          <span style={{ color: '#9aa1ad' }}>메인 시간</span>
                        </div>
                        <span className="font-mono font-semibold" style={{ color: '#e8eaf0' }}>
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
                          onChange={(e) => handleSliderChange('mainTime', parseInt(e.target.value))}
                          disabled={!canEditSettings}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #1f6feb 0%, #1f6feb ${(gameSettings.mainTime / 3600) * 100}%, #2a2a33 ${(gameSettings.mainTime / 3600) * 100}%, #2a2a33 100%)`,
                            cursor: canEditSettings ? 'pointer' : 'not-allowed'
                          }}
                        />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={gameSettings.useAdditionalTime}
                            onChange={() => toggleSetting('useAdditionalTime')}
                            disabled={!canEditSettings}
                            className="w-4 h-4 cursor-pointer"
                            style={{ cursor: canEditSettings ? 'pointer' : 'not-allowed' }}
                          />
                          <span style={{ color: '#9aa1ad' }}>추가 시간</span>
                        </div>
                        <span className="font-mono font-semibold" style={{ color: '#e8eaf0' }}>
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
                          onChange={(e) => handleSliderChange('additionalTime', parseInt(e.target.value))}
                          disabled={!canEditSettings}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #1f6feb 0%, #1f6feb ${(gameSettings.additionalTime / 60) * 100}%, #2a2a33 ${(gameSettings.additionalTime / 60) * 100}%, #2a2a33 100%)`,
                            cursor: canEditSettings ? 'pointer' : 'not-allowed'
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* 초읽기 설정 */}
                <div>
                  <h4 className="text-lg font-semibold mb-4" style={{ color: '#8ab4f8' }}>초읽기 설정</h4>
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={gameSettings.useByoyomiTime}
                            onChange={() => toggleSetting('useByoyomiTime')}
                            disabled={!canEditSettings}
                            className="w-4 h-4 cursor-pointer"
                            style={{ cursor: canEditSettings ? 'pointer' : 'not-allowed' }}
                          />
                          <span style={{ color: '#9aa1ad' }}>초읽기 시간</span>
                        </div>
                        <span className="font-mono font-semibold" style={{ color: '#e8eaf0' }}>
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
                          onChange={(e) => handleSliderChange('byoyomiTime', parseInt(e.target.value))}
                          disabled={!canEditSettings}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #1f6feb 0%, #1f6feb ${(gameSettings.byoyomiTime / 300) * 100}%, #2a2a33 ${(gameSettings.byoyomiTime / 300) * 100}%, #2a2a33 100%)`,
                            cursor: canEditSettings ? 'pointer' : 'not-allowed'
                          }}
                        />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={gameSettings.useByoyomiCount}
                            onChange={() => toggleSetting('useByoyomiCount')}
                            disabled={!canEditSettings}
                            className="w-4 h-4 cursor-pointer"
                            style={{ cursor: canEditSettings ? 'pointer' : 'not-allowed' }}
                          />
                          <span style={{ color: '#9aa1ad' }}>초읽기 횟수</span>
                        </div>
                        <span className="font-mono font-semibold" style={{ color: '#e8eaf0' }}>
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
                          onChange={(e) => handleSliderChange('byoyomiCount', parseInt(e.target.value))}
                          disabled={!canEditSettings}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                          style={{
                            background: `linear-gradient(to right, #1f6feb 0%, #1f6feb ${(gameSettings.byoyomiCount / 10) * 100}%, #2a2a33 ${(gameSettings.byoyomiCount / 10) * 100}%, #2a2a33 100%)`,
                            cursor: canEditSettings ? 'pointer' : 'not-allowed'
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽: 대기 상태 및 버튼 */}
          <div className="w-80 space-y-4">
            {/* 대기 메시지 - 상대방이 있을 때만 준비 상태 표시 */}
            <div className="rounded-xl p-6 border text-center"
                 style={{ 
                   backgroundColor: 'rgba(22,22,28,0.6)', 
                   borderColor: '#2a2a33'
                 }}>
              <div className="text-2xl font-bold mb-2" style={{ color: '#e8eaf0' }}>
                {!hasOpponent ? '플레이어 대기중...' : allPlayersReady ? '대국 준비 완료!' : '플레이어 준비중...'}
              </div>
              <p className="text-sm" style={{ color: '#9aa1ad' }}>
                {!hasOpponent 
                  ? '다른 플레이어가 입장할 때까지 기다려주세요' 
                  : allPlayersReady 
                    ? '모든 플레이어가 준비되었습니다' 
                    : '모든 플레이어의 준비를 기다리고 있습니다'
                }
              </p>
            </div>

            {/* 게임 설정 정보 */}
            <div className="rounded-xl p-6 border"
                 style={{ 
                   backgroundColor: 'rgba(22,22,28,0.6)', 
                   borderColor: '#2a2a33'
                 }}>
              <h4 className="text-lg font-bold mb-4" style={{ color: '#e8eaf0' }}>게임 설정 요약</h4>
              <div className="space-y-3 text-sm">
                {gameSettings.useMainTime && (
                  <div className="flex justify-between">
                    <span style={{ color: '#9aa1ad' }}>메인 시간:</span>
                    <span style={{ color: '#e8eaf0' }}>{Math.floor(gameSettings.mainTime / 60)}분</span>
                  </div>
                )}
                {gameSettings.useAdditionalTime && (
                  <div className="flex justify-between">
                    <span style={{ color: '#9aa1ad' }}>추가 시간:</span>
                    <span style={{ color: '#e8eaf0' }}>{gameSettings.additionalTime}초</span>
                  </div>
                )}
                {gameSettings.useByoyomiTime && (
                  <div className="flex justify-between">
                    <span style={{ color: '#9aa1ad' }}>초읽기 시간:</span>
                    <span style={{ color: '#e8eaf0' }}>{gameSettings.byoyomiTime}초</span>
                  </div>
                )}
                {gameSettings.useByoyomiCount && (
                  <div className="flex justify-between">
                    <span style={{ color: '#9aa1ad' }}>초읽기 횟수:</span>
                    <span style={{ color: '#e8eaf0' }}>{gameSettings.byoyomiCount}회</span>
                  </div>
                )}
              </div>
            </div>

            {/* 게임 시작하기 버튼 */}
            <button 
              onClick={handleStartGame}
              disabled={!isHost}
              className="w-full py-4 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap text-white text-lg"
              style={{ 
                background: isHost ? 'linear-gradient(180deg, #1f6feb, #1b4fd8)' : '#2a2a33',
                boxShadow: isHost ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
                opacity: isHost ? 1 : 0.5,
                cursor: isHost ? 'pointer' : 'not-allowed'
              }}>
              {!isHost ? '방장만 시작 가능' : '게임 시작하기'}
            </button>

            {/* 방 나가기 버튼 */}
            <button 
              onClick={handleLeaveRoom}
              className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap border"
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
              }}>
              방 나가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
