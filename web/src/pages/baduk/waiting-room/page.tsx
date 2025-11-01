
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface Player {
  id: number;
  nickname: string;
  rating: number;
  color: 'black' | 'white';
  ready: boolean;
}

export default function BadukWaitingRoom() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { roomCode?: string; isHost?: boolean; opponent?: any } | null;
  
  const [roomCode] = useState(() => 
    state?.roomCode || Math.random().toString(36).substring(2, 8).toUpperCase()
  );
  const [isHost] = useState(state?.isHost !== false);
  
  const [players, setPlayers] = useState<Player[]>(() => {
    if (state?.opponent) {
      // 등급전에서 온 경우
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
          ready: true // 상대방은 자동으로 준비 완료
        }
      ];
    } else if (!isHost) {
      // 방 입장으로 온 경우
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
      // 방 생성으로 온 경우
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
    gameType: 'baduk',
    mainTime: 1800, // 30분 (초 단위)
    byoyomiTime: 30, // 30초
    byoyomiCount: 3
  });

  // 방 생성자인 경우 5초 후 자동으로 상대방 입장
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
    const s = seconds % 3600 % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleTimeChange = (field: 'mainTime' | 'byoyomiTime', value: string) => {
    const parts = value.split(':');
    if (parts.length === 3) {
      const totalSeconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
      if (!isNaN(totalSeconds) && totalSeconds >= 0) {
        setGameSettings(prev => ({ ...prev, [field]: totalSeconds }));
      }
    }
  };

  const adjustTime = (field: 'mainTime' | 'byoyomiTime', delta: number) => {
    setGameSettings(prev => ({
      ...prev,
      [field]: Math.max(0, prev[field] + delta)
    }));
  };

  const adjustByoyomiCount = (delta: number) => {
    setGameSettings(prev => ({
      ...prev,
      byoyomiCount: Math.max(1, Math.min(10, prev.byoyomiCount + delta))
    }));
  };

  const handleReady = () => {
    const myId = isHost ? 1 : 2;
    setPlayers(prev => prev.map(p => 
      p.id === myId ? { ...p, ready: !p.ready } : p
    ));
  };

  const handleStartGame = () => {
    navigate('/baduk/game-room', { state: { gameSettings, players, roomCode } });
  };

  const handleLeaveRoom = () => {
    navigate('/');
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    // 복사 완료 피드백을 위한 간단한 알림 (실제 구현에서는 toast 등 사용)
  };

  const switchColors = () => {
    setPlayers(prev => prev.map(p => ({
      ...p,
      color: p.color === 'black' ? 'white' as const : 'black' as const
    })));
  };

  const allPlayersReady = players.every(p => p.ready) && players[1].nickname !== '대기 중...';
  const canEditSettings = isHost || state?.opponent; // 방장이거나 등급전에서 온 경우 설정 변경 가능

  return (
    <div className="min-h-screen text-white p-8" style={{ backgroundColor: '#0b0c10' }}>
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#e8eaf0' }}>대기실</h1>
          <p style={{ color: '#9aa1ad' }}>모든 플레이어가 준비되면 게임을 시작할 수 있습니다</p>
        </div>

        {/* 방 정보 */}
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

        {/* 플레이어 정보 */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {players.map((player, index) => (
            <div key={player.id} className="rounded-xl p-6 border"
                 style={{ 
                   backgroundColor: 'rgba(22,22,28,0.6)', 
                   borderColor: player.ready ? '#22c55e' : '#2a2a33'
                 }}>
              <div className="flex items-center space-x-4 mb-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                  player.color === 'black' ? 'bg-gray-900' : 'bg-gray-100'
                }`}
                     style={{ 
                       border: player.color === 'black' ? '3px solid #4b5563' : '3px solid #d1d5db'
                     }}>
                  <svg width="32" height="32" viewBox="0 0 32 32">
                    <circle cx="16" cy="16" r="14" fill={player.color === 'black' ? '#000' : '#fff'} />
                    {player.color === 'black' && (
                      <circle cx="11" cy="11" r="4" fill="rgba(255,255,255,0.3)" />
                    )}
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg mb-1" style={{ color: '#e8eaf0' }}>
                    {player.nickname}
                  </div>
                  {player.rating > 0 && (
                    <div className="text-sm" style={{ color: '#9aa1ad' }}>
                      레이팅: {player.rating}
                    </div>
                  )}
                  <div className="text-sm" style={{ color: '#9aa1ad' }}>
                    {player.color === 'black' ? '흑돌' : '백돌'}
                  </div>
                </div>
              </div>
              
              {/* 색상 변경 버튼 */}
              <button 
                onClick={switchColors}
                disabled
                className="w-full py-2 mb-3 rounded-lg font-semibold transition-all whitespace-nowrap border"
                style={{ 
                  backgroundColor: '#141822', 
                  borderColor: '#2a2a33',
                  color: '#9aa1ad',
                  opacity: 0.5,
                  cursor: 'not-allowed'
                }}>
                색 변경
              </button>
              
              {/* 준비 버튼 */}
              {((isHost && player.id === 1) || (!isHost && player.id === 2)) && player.nickname !== '대기 중...' ? (
                <button 
                  onClick={handleReady}
                  className="w-full py-2 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap"
                  style={{ 
                    backgroundColor: player.ready ? '#22c55e' : '#141822',
                    color: '#ffffff',
                    border: player.ready ? 'none' : '1px solid #2a2a33'
                  }}>
                  {player.ready ? '준비 완료' : '준비하기'}
                </button>
              ) : player.ready && player.nickname !== '대기 중...' ? (
                <div className="text-center py-2 rounded-lg font-semibold"
                     style={{ 
                       backgroundColor: '#22c55e',
                       color: '#ffffff'
                     }}>
                  준비 완료
                </div>
              ) : player.nickname === '대기 중...' ? (
                <div className="text-center py-2 rounded-lg"
                     style={{ 
                       backgroundColor: '#141822',
                       color: '#9aa1ad'
                     }}>
                  대기 중...
                </div>
              ) : (
                <div className="text-center py-2 rounded-lg"
                     style={{ 
                       backgroundColor: '#141822',
                       color: '#9aa1ad'
                     }}>
                  대기 중
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 게임 설정 */}
        <div className="rounded-xl p-6 border mb-6"
             style={{ 
               backgroundColor: 'rgba(22,22,28,0.6)', 
               borderColor: '#2a2a33'
             }}>
          <h3 className="text-xl font-bold mb-4" style={{ color: '#e8eaf0' }}>게임 설정</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span style={{ color: '#9aa1ad' }}>게임 종류</span>
              <span className="font-semibold" style={{ color: '#e8eaf0' }}>바둑</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span style={{ color: '#9aa1ad' }}>메인 시간</span>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => adjustTime('mainTime', -1)}
                  disabled={!canEditSettings}
                  className="w-8 h-8 rounded flex items-center justify-center cursor-pointer"
                  style={{ 
                    backgroundColor: canEditSettings ? '#141822' : '#2a2a33', 
                    color: canEditSettings ? '#e8eaf0' : '#9aa1ad',
                    cursor: canEditSettings ? 'pointer' : 'not-allowed'
                  }}>
                  ▼
                </button>
                <input
                  type="text"
                  value={formatTime(gameSettings.mainTime)}
                  onChange={(e) => canEditSettings && handleTimeChange('mainTime', e.target.value)}
                  disabled={!canEditSettings}
                  className="w-28 px-3 py-2 rounded text-center font-semibold"
                  style={{ 
                    backgroundColor: canEditSettings ? '#141822' : '#2a2a33', 
                    borderColor: '#2a2a33',
                    color: canEditSettings ? '#e8eaf0' : '#9aa1ad',
                    border: '1px solid #2a2a33',
                    cursor: canEditSettings ? 'text' : 'not-allowed'
                  }}
                />
                <button 
                  onClick={() => adjustTime('mainTime', 1)}
                  disabled={!canEditSettings}
                  className="w-8 h-8 rounded flex items-center justify-center cursor-pointer"
                  style={{ 
                    backgroundColor: canEditSettings ? '#141822' : '#2a2a33', 
                    color: canEditSettings ? '#e8eaf0' : '#9aa1ad',
                    cursor: canEditSettings ? 'pointer' : 'not-allowed'
                  }}>
                  ▲
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span style={{ color: '#9aa1ad' }}>초읽기 시간</span>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => adjustTime('byoyomiTime', -1)}
                  disabled={!canEditSettings}
                  className="w-8 h-8 rounded flex items-center justify-center cursor-pointer"
                  style={{ 
                    backgroundColor: canEditSettings ? '#141822' : '#2a2a33', 
                    color: canEditSettings ? '#e8eaf0' : '#9aa1ad',
                    cursor: canEditSettings ? 'pointer' : 'not-allowed'
                  }}>
                  ▼
                </button>
                <input
                  type="text"
                  value={formatTime(gameSettings.byoyomiTime)}
                  onChange={(e) => canEditSettings && handleTimeChange('byoyomiTime', e.target.value)}
                  disabled={!canEditSettings}
                  className="w-28 px-3 py-2 rounded text-center font-semibold"
                  style={{ 
                    backgroundColor: canEditSettings ? '#141822' : '#2a2a33', 
                    borderColor: '#2a2a33',
                    color: canEditSettings ? '#e8eaf0' : '#9aa1ad',
                    border: '1px solid #2a2a33',
                    cursor: canEditSettings ? 'text' : 'not-allowed'
                  }}
                />
                <button 
                  onClick={() => adjustTime('byoyomiTime', 1)}
                  disabled={!canEditSettings}
                  className="w-8 h-8 rounded flex items-center justify-center cursor-pointer"
                  style={{ 
                    backgroundColor: canEditSettings ? '#141822' : '#2a2a33', 
                    color: canEditSettings ? '#e8eaf0' : '#9aa1ad',
                    cursor: canEditSettings ? 'pointer' : 'not-allowed'
                  }}>
                  ▲
                </button>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span style={{ color: '#9aa1ad' }}>초읽기 횟수</span>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => adjustByoyomiCount(-1)}
                  disabled={!canEditSettings}
                  className="w-8 h-8 rounded flex items-center justify-center cursor-pointer"
                  style={{ 
                    backgroundColor: canEditSettings ? '#141822' : '#2a2a33', 
                    color: canEditSettings ? '#e8eaf0' : '#9aa1ad',
                    cursor: canEditSettings ? 'pointer' : 'not-allowed'
                  }}>
                  -
                </button>
                <span className="w-12 text-center font-semibold" style={{ color: '#e8eaf0' }}>
                  {gameSettings.byoyomiCount}
                </span>
                <button 
                  onClick={() => adjustByoyomiCount(1)}
                  disabled={!canEditSettings}
                  className="w-8 h-8 rounded flex items-center justify-center cursor-pointer"
                  style={{ 
                    backgroundColor: canEditSettings ? '#141822' : '#2a2a33', 
                    color: canEditSettings ? '#e8eaf0' : '#9aa1ad',
                    cursor: canEditSettings ? 'pointer' : 'not-allowed'
                  }}>
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={handleStartGame}
            disabled={!allPlayersReady}
            className="py-4 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap text-white"
            style={{ 
              background: allPlayersReady ? 'linear-gradient(180deg, #1f6feb, #1b4fd8)' : '#2a2a33',
              boxShadow: allPlayersReady ? '0 2px 8px rgba(0,0,0,0.3)' : 'none',
              opacity: allPlayersReady ? 1 : 0.5,
              cursor: allPlayersReady ? 'pointer' : 'not-allowed'
            }}>
            게임 시작
          </button>
          <button 
            onClick={handleLeaveRoom}
            className="py-4 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap"
            style={{ 
              backgroundColor: '#dc2626',
              color: '#ffffff'
            }}>
            방 나가기
          </button>
        </div>
      </div>
    </div>
  );
}
