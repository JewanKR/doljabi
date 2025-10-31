
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Player {
  id: number;
  nickname: string;
  rating: number;
  status: 'online' | 'playing' | 'away';
  rank: number;
}

export default function BadukRankedMatch() {
  const navigate = useNavigate();
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [sentRequests, setSentRequests] = useState<number[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<Player[]>([
    { id: 5, nickname: '고수바둑이', rating: 1650, status: 'online', rank: 3 }
  ]);

  // 예시 플레이어 데이터
  const players: Player[] = [
    { id: 1, nickname: '바둑마스터', rating: 1800, status: 'online', rank: 1 },
    { id: 2, nickname: '돌잡이킹', rating: 1750, status: 'playing', rank: 2 },
    { id: 3, nickname: '고수바둑이', rating: 1650, status: 'online', rank: 3 },
    { id: 4, nickname: '프로지망생', rating: 1600, status: 'away', rank: 4 },
    { id: 5, nickname: '바둑천재', rating: 1580, status: 'online', rank: 5 },
    { id: 6, nickname: '흑백대전', rating: 1550, status: 'playing', rank: 6 },
    { id: 7, nickname: '돌놓기달인', rating: 1520, status: 'online', rank: 7 },
    { id: 8, nickname: '집잡기왕', rating: 1500, status: 'away', rank: 8 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return '#22c55e';
      case 'playing': return '#f59e0b';
      case 'away': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return '온라인';
      case 'playing': return '게임 중';
      case 'away': return '자리비움';
      default: return '오프라인';
    }
  };

  const canRequestGame = (player: Player) => {
    return player.status === 'online' && !sentRequests.includes(player.id);
  };

  const handleRequestGame = (player: Player) => {
    if (canRequestGame(player)) {
      setSentRequests(prev => [...prev, player.id]);
    }
  };

  const handleAcceptRequest = (player: Player) => {
    // 요청 수락 시 대기실로 이동
    navigate('/baduk/waiting-room', { 
      state: { 
        roomCode: Math.random().toString(36).substring(2, 8).toUpperCase(),
        isHost: true, // 수락한 사람이 방장이 됨
        opponent: player
      } 
    });
  };

  const handleDeclineRequest = (playerId: number) => {
    setReceivedRequests(prev => prev.filter(p => p.id !== playerId));
  };

  return (
    <div className="min-h-screen text-white p-8" style={{ backgroundColor: '#0b0c10' }}>
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#e8eaf0' }}>등급전</h1>
          <p style={{ color: '#9aa1ad' }}>플레이어를 선택하여 게임을 요청하세요</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 받은 요청 */}
          {receivedRequests.length > 0 && (
            <div className="lg:col-span-3 mb-6">
              <div className="rounded-xl p-6 border"
                   style={{ 
                     backgroundColor: 'rgba(22,22,28,0.6)', 
                     borderColor: '#f59e0b'
                   }}>
                <h3 className="text-xl font-bold mb-4 flex items-center" style={{ color: '#e8eaf0' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" className="mr-2" fill="#f59e0b">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  받은 게임 요청
                </h3>
                <div className="space-y-3">
                  {receivedRequests.map(player => (
                    <div key={player.id} className="flex items-center justify-between p-4 rounded-lg"
                         style={{ backgroundColor: '#141822' }}>
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center"
                             style={{ backgroundColor: '#2a2a33' }}>
                          <span className="font-bold" style={{ color: '#e8eaf0' }}>#{player.rank}</span>
                        </div>
                        <div>
                          <div className="font-semibold" style={{ color: '#e8eaf0' }}>{player.nickname}</div>
                          <div className="text-sm" style={{ color: '#9aa1ad' }}>레이팅: {player.rating}</div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleAcceptRequest(player)}
                          className="px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap"
                          style={{ 
                            backgroundColor: '#22c55e',
                            color: '#ffffff'
                          }}>
                          수락
                        </button>
                        <button 
                          onClick={() => handleDeclineRequest(player.id)}
                          className="px-4 py-2 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap border"
                          style={{ 
                            backgroundColor: '#141822', 
                            borderColor: '#2a2a33',
                            color: '#e8eaf0'
                          }}>
                          거절
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 플레이어 순위 */}
          <div className="lg:col-span-3">
            <div className="rounded-xl p-6 border"
                 style={{ 
                   backgroundColor: 'rgba(22,22,28,0.6)', 
                   borderColor: '#2a2a33'
                 }}>
              <h3 className="text-xl font-bold mb-6" style={{ color: '#e8eaf0' }}>플레이어 순위</h3>
              
              <div className="space-y-3">
                {players.map(player => (
                  <div key={player.id} 
                       className="flex items-center justify-between p-4 rounded-lg border transition-all"
                       style={{ 
                         backgroundColor: '#141822',
                         borderColor: selectedPlayer?.id === player.id ? '#1f6feb' : 'transparent'
                       }}>
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center"
                           style={{ 
                             backgroundColor: player.rank <= 3 ? '#f59e0b' : '#2a2a33',
                             color: player.rank <= 3 ? '#000' : '#e8eaf0'
                           }}>
                        <span className="font-bold">#{player.rank}</span>
                      </div>
                      
                      <div>
                        <div className="font-semibold" style={{ color: '#e8eaf0' }}>{player.nickname}</div>
                        <div className="text-sm" style={{ color: '#9aa1ad' }}>레이팅: {player.rating}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getStatusColor(player.status) }}
                        />
                        <span className="text-sm" style={{ color: '#9aa1ad' }}>
                          {getStatusText(player.status)}
                        </span>
                      </div>

                      {canRequestGame(player) ? (
                        <button 
                          onClick={() => handleRequestGame(player)}
                          className="px-6 py-2 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap text-white"
                          style={{ 
                            background: 'linear-gradient(180deg, #1f6feb, #1b4fd8)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                          }}>
                          게임 요청
                        </button>
                      ) : sentRequests.includes(player.id) ? (
                        <button 
                          disabled
                          className="px-6 py-2 rounded-lg font-semibold whitespace-nowrap border"
                          style={{ 
                            backgroundColor: '#141822', 
                            borderColor: '#2a2a33',
                            color: '#9aa1ad',
                            opacity: 0.7
                          }}>
                          요청 전송됨
                        </button>
                      ) : (
                        <button 
                          disabled
                          className="px-6 py-2 rounded-lg font-semibold whitespace-nowrap border"
                          style={{ 
                            backgroundColor: '#141822', 
                            borderColor: '#2a2a33',
                            color: '#9aa1ad',
                            opacity: 0.5
                          }}>
                          요청 불가
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 뒤로가기 버튼 */}
        <div className="mt-8 text-center">
          <button 
            onClick={() => navigate('/')}
            className="px-8 py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap border"
            style={{ 
              backgroundColor: '#141822', 
              borderColor: '#2a2a33',
              color: '#e8eaf0'
            }}>
            돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}
