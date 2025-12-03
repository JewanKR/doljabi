import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
  id: string;
  username: string;
  nickname: string;
  rating: number;
  status: 'active' | 'suspended';
  createdAt: string;
  totalGames: number;
  wins: number;
  losses: number;
}

interface GameRecord {
  id: string;
  gameType: 'baduk' | 'omok';
  player1: string;
  player2: string;
  winner: string;
  result: 'win' | 'draw';
  date: string;
  duration: string;
}

export default function AdminPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'users' | 'games' | 'stats'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [gameTypeFilter, setGameTypeFilter] = useState<'all' | 'baduk' | 'omok'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);

  // Mock data - 실제로는 API에서 받아옴
  const [users] = useState<User[]>([
    {
      id: '1',
      username: 'user1',
      nickname: '바둑고수',
      rating: 1850,
      status: 'active',
      createdAt: '2024-01-10',
      totalGames: 48,
      wins: 28,
      losses: 20
    },
    {
      id: '2',
      username: 'user2',
      nickname: '오목마스터',
      rating: 1720,
      status: 'active',
      createdAt: '2024-01-12',
      totalGames: 35,
      wins: 20,
      losses: 15
    },
    {
      id: '3',
      username: 'user3',
      nickname: '초보플레이어',
      rating: 1450,
      status: 'suspended',
      createdAt: '2024-01-15',
      totalGames: 12,
      wins: 4,
      losses: 8
    }
  ]);

  const [gameRecords] = useState<GameRecord[]>([
    {
      id: '1',
      gameType: 'baduk',
      player1: '바둑고수',
      player2: '오목마스터',
      winner: '바둑고수',
      result: 'win',
      date: '2024-01-15 14:30',
      duration: '45분'
    },
    {
      id: '2',
      gameType: 'omok',
      player1: '오목마스터',
      player2: '초보플레이어',
      winner: '오목마스터',
      result: 'win',
      date: '2024-01-15 13:20',
      duration: '20분'
    },
    {
      id: '3',
      gameType: 'baduk',
      player1: '바둑고수',
      player2: '초보플레이어',
      winner: '',
      result: 'draw',
      date: '2024-01-14 18:45',
      duration: '35분'
    }
  ]);

  useEffect(() => {
    const isAdmin = localStorage.getItem('isAdmin');
    if (!isAdmin) {
      navigate('/');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    navigate('/');
  };

  const handleUserAction = (user: User, action: 'view' | 'suspend' | 'activate') => {
    if (action === 'view') {
      setSelectedUser(user);
      setShowUserModal(true);
    } else if (action === 'suspend' || action === 'activate') {
      // 실제로는 API 호출
      alert(`${user.nickname} 사용자를 ${action === 'suspend' ? '정지' : '활성화'}했습니다.`);
    }
  };

  const filteredUsers = users.filter(user =>
    user.nickname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGames = gameRecords.filter(game =>
    gameTypeFilter === 'all' || game.gameType === gameTypeFilter
  );

  const stats = {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.status === 'active').length,
    totalGames: gameRecords.length,
    todayGames: gameRecords.filter(g => g.date.startsWith('2024-01-15')).length
  };

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0b0c10' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b" style={{ borderColor: '#2a2a33' }}>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
               style={{ 
                 background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                 boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)'
               }}>
            <i className="ri-shield-user-line text-2xl"></i>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            관리자 페이지
          </h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap border"
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
            }}
          >
            홈으로
          </button>
          <button
            onClick={handleLogout}
            className="px-6 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap text-white"
            style={{ 
              background: 'linear-gradient(180deg, #ef4444, #dc2626)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
          >
            로그아웃
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="rounded-2xl p-6 border"
               style={{ 
                 backgroundColor: 'rgba(22,22,28,0.6)', 
                 borderColor: '#2a2a33',
                 boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
               }}>
            <div className="flex items-center justify-between mb-4">
              <span style={{ color: '#9aa1ad' }}>총 사용자</span>
              <i className="ri-user-line text-2xl" style={{ color: '#8ab4f8' }}></i>
            </div>
            <div className="text-4xl font-bold" style={{ color: '#e8eaf0' }}>
              {stats.totalUsers}
            </div>
          </div>

          <div className="rounded-2xl p-6 border"
               style={{ 
                 backgroundColor: 'rgba(22,22,28,0.6)', 
                 borderColor: '#2a2a33',
                 boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
               }}>
            <div className="flex items-center justify-between mb-4">
              <span style={{ color: '#9aa1ad' }}>활성 사용자</span>
              <i className="ri-user-star-line text-2xl" style={{ color: '#22c55e' }}></i>
            </div>
            <div className="text-4xl font-bold" style={{ color: '#22c55e' }}>
              {stats.activeUsers}
            </div>
          </div>

          <div className="rounded-2xl p-6 border"
               style={{ 
                 backgroundColor: 'rgba(22,22,28,0.6)', 
                 borderColor: '#2a2a33',
                 boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
               }}>
            <div className="flex items-center justify-between mb-4">
              <span style={{ color: '#9aa1ad' }}>총 게임 수</span>
              <i className="ri-gamepad-line text-2xl" style={{ color: '#8ab4f8' }}></i>
            </div>
            <div className="text-4xl font-bold" style={{ color: '#e8eaf0' }}>
              {stats.totalGames}
            </div>
          </div>

          <div className="rounded-2xl p-6 border"
               style={{ 
                 backgroundColor: 'rgba(22,22,28,0.6)', 
                 borderColor: '#2a2a33',
                 boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
               }}>
            <div className="flex items-center justify-between mb-4">
              <span style={{ color: '#9aa1ad' }}>오늘의 게임</span>
              <i className="ri-calendar-line text-2xl" style={{ color: '#1f6feb' }}></i>
            </div>
            <div className="text-4xl font-bold" style={{ color: '#1f6feb' }}>
              {stats.todayGames}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'users' ? 'text-white' : ''
            }`}
            style={{
              backgroundColor: activeTab === 'users' ? '#1f6feb' : '#141822',
              color: activeTab === 'users' ? '#ffffff' : '#9aa1ad',
              boxShadow: activeTab === 'users' ? '0 2px 8px rgba(31, 111, 235, 0.3)' : 'none'
            }}
          >
            사용자 관리
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'games' ? 'text-white' : ''
            }`}
            style={{
              backgroundColor: activeTab === 'games' ? '#1f6feb' : '#141822',
              color: activeTab === 'games' ? '#ffffff' : '#9aa1ad',
              boxShadow: activeTab === 'games' ? '0 2px 8px rgba(31, 111, 235, 0.3)' : 'none'
            }}
          >
            게임 기록
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <div className="mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="사용자 검색..."
                className="w-full px-4 py-3 rounded-lg border text-sm"
                style={{ 
                  backgroundColor: '#141822', 
                  borderColor: '#2a2a33',
                  color: '#e8eaf0'
                }}
              />
            </div>

            <div className="rounded-2xl border overflow-hidden"
                 style={{ 
                   backgroundColor: 'rgba(22,22,28,0.6)', 
                   borderColor: '#2a2a33',
                   boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                 }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #2a2a33' }}>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#e8eaf0' }}>
                        사용자
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#e8eaf0' }}>
                        레이팅
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#e8eaf0' }}>
                        게임 수
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#e8eaf0' }}>
                        승률
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#e8eaf0' }}>
                        상태
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#e8eaf0' }}>
                        가입일
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#e8eaf0' }}>
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} style={{ borderBottom: '1px solid #2a2a33' }}>
                        <td className="px-6 py-4">
                          <div>
                            <div className="text-sm font-semibold" style={{ color: '#e8eaf0' }}>
                              {user.nickname}
                            </div>
                            <div className="text-xs" style={{ color: '#9aa1ad' }}>
                              @{user.username}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold" style={{ color: '#8ab4f8' }}>
                          {user.rating}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#e8eaf0' }}>
                          {user.totalGames}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#e8eaf0' }}>
                          {((user.wins / user.totalGames) * 100).toFixed(1)}%
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-lg text-xs font-semibold"
                                style={{
                                  backgroundColor: user.status === 'active' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                  color: user.status === 'active' ? '#22c55e' : '#ef4444'
                                }}>
                            {user.status === 'active' ? '활성' : '정지'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#9aa1ad' }}>
                          {user.createdAt}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleUserAction(user, 'view')}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                              style={{ backgroundColor: '#141822' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#1f6feb';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#141822';
                              }}
                            >
                              <i className="ri-eye-line" style={{ color: '#8ab4f8' }}></i>
                            </button>
                            <button
                              onClick={() => handleUserAction(user, user.status === 'active' ? 'suspend' : 'activate')}
                              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                              style={{ backgroundColor: '#141822' }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = user.status === 'active' ? '#ef4444' : '#22c55e';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#141822';
                              }}
                            >
                              <i className={user.status === 'active' ? 'ri-forbid-line' : 'ri-check-line'}
                                 style={{ color: user.status === 'active' ? '#ef4444' : '#22c55e' }}></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Games Tab */}
        {activeTab === 'games' && (
          <div>
            <div className="mb-6 flex items-center space-x-4">
              <select
                value={gameTypeFilter}
                onChange={(e) => setGameTypeFilter(e.target.value as 'all' | 'baduk' | 'omok')}
                className="px-4 py-3 rounded-lg border text-sm cursor-pointer"
                style={{ 
                  backgroundColor: '#141822', 
                  borderColor: '#2a2a33',
                  color: '#e8eaf0'
                }}
              >
                <option value="all">전체 게임</option>
                <option value="baduk">바둑</option>
                <option value="omok">오목</option>
              </select>
            </div>

            <div className="rounded-2xl border overflow-hidden"
                 style={{ 
                   backgroundColor: 'rgba(22,22,28,0.6)', 
                   borderColor: '#2a2a33',
                   boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                 }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ borderBottom: '1px solid #2a2a33' }}>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#e8eaf0' }}>
                        게임 종류
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#e8eaf0' }}>
                        플레이어 1
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#e8eaf0' }}>
                        플레이어 2
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#e8eaf0' }}>
                        결과
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#e8eaf0' }}>
                        소요 시간
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#e8eaf0' }}>
                        날짜
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#e8eaf0' }}>
                        관리
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGames.map((game) => (
                      <tr key={game.id} style={{ borderBottom: '1px solid #2a2a33' }}>
                        <td className="px-6 py-4">
                          <span className="px-3 py-1 rounded-lg text-sm font-semibold"
                                style={{
                                  backgroundColor: game.gameType === 'baduk' ? 'rgba(138, 180, 248, 0.2)' : 'rgba(31, 111, 235, 0.2)',
                                  color: game.gameType === 'baduk' ? '#8ab4f8' : '#1f6feb'
                                }}>
                            {game.gameType === 'baduk' ? '바둑' : '오목'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#e8eaf0' }}>
                          {game.player1}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#e8eaf0' }}>
                          {game.player2}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#e8eaf0' }}>
                          {game.result === 'draw' ? '무승부' : `${game.winner} 승리`}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#9aa1ad' }}>
                          {game.duration}
                        </td>
                        <td className="px-6 py-4 text-sm" style={{ color: '#9aa1ad' }}>
                          {game.date}
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => alert('게임 기록이 삭제되었습니다.')}
                            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                            style={{ backgroundColor: '#141822' }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#ef4444';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = '#141822';
                            }}
                          >
                            <i className="ri-delete-bin-line" style={{ color: '#ef4444' }}></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4"
             style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-2xl p-8 w-full max-w-2xl border"
               style={{ 
                 backgroundColor: 'rgba(22,22,28,0.9)', 
                 borderColor: '#2a2a33',
                 boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
               }}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold" style={{ color: '#e8eaf0' }}>사용자 상세 정보</h3>
              <button
                onClick={() => setShowUserModal(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer"
                style={{ backgroundColor: '#141822' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#141822';
                }}
              >
                <i className="ri-close-line text-xl" style={{ color: '#e8eaf0' }}></i>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#9aa1ad' }}>닉네임</label>
                  <div className="text-lg font-semibold" style={{ color: '#e8eaf0' }}>
                    {selectedUser.nickname}
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#9aa1ad' }}>아이디</label>
                  <div className="text-lg font-semibold" style={{ color: '#e8eaf0' }}>
                    {selectedUser.username}
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#9aa1ad' }}>레이팅</label>
                  <div className="text-lg font-semibold" style={{ color: '#8ab4f8' }}>
                    {selectedUser.rating}
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#9aa1ad' }}>상태</label>
                  <span className="px-3 py-1 rounded-lg text-sm font-semibold"
                        style={{
                          backgroundColor: selectedUser.status === 'active' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                          color: selectedUser.status === 'active' ? '#22c55e' : '#ef4444'
                        }}>
                    {selectedUser.status === 'active' ? '활성' : '정지'}
                  </span>
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#9aa1ad' }}>총 게임 수</label>
                  <div className="text-lg font-semibold" style={{ color: '#e8eaf0' }}>
                    {selectedUser.totalGames}
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#9aa1ad' }}>승률</label>
                  <div className="text-lg font-semibold" style={{ color: '#e8eaf0' }}>
                    {((selectedUser.wins / selectedUser.totalGames) * 100).toFixed(1)}%
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#9aa1ad' }}>승리</label>
                  <div className="text-lg font-semibold" style={{ color: '#22c55e' }}>
                    {selectedUser.wins}
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#9aa1ad' }}>패배</label>
                  <div className="text-lg font-semibold" style={{ color: '#ef4444' }}>
                    {selectedUser.losses}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t" style={{ borderColor: '#2a2a33' }}>
                <label className="block text-sm mb-2" style={{ color: '#9aa1ad' }}>레이팅 수정</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="number"
                    defaultValue={selectedUser.rating}
                    className="flex-1 px-4 py-3 rounded-lg border text-sm"
                    style={{ 
                      backgroundColor: '#141822', 
                      borderColor: '#2a2a33',
                      color: '#e8eaf0'
                    }}
                  />
                  <button
                    onClick={() => alert('레이팅이 수정되었습니다.')}
                    className="px-6 py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap text-white"
                    style={{ 
                      background: 'linear-gradient(180deg, #1f6feb, #1b4fd8)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}
                  >
                    수정
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={() => setShowUserModal(false)}
                className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap border"
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
                }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
