
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface UserInfo {
  username: string;
  nickname: string;
  rating: number;
}

interface GameStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  winRate: number;
}

interface GameHistory {
  id: string;
  gameType: 'baduk' | 'omok';
  opponent: string;
  result: 'win' | 'loss' | 'draw';
  date: string;
  ratingChange: number;
}

export default function Profile() {
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'history' | 'settings'>('stats');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    nickname: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [editError, setEditError] = useState('');

  // 게임 통계 (실제로는 API에서 받아옴)
  const [gameStats] = useState<GameStats>({
    totalGames: 48,
    wins: 28,
    losses: 15,
    draws: 5,
    winRate: 58.3
  });

  // 게임 기록 (실제로는 API에서 받아옴)
  const [gameHistory] = useState<GameHistory[]>([
    {
      id: '1',
      gameType: 'baduk',
      opponent: '바둑고수',
      result: 'win',
      date: '2024-01-15 14:30',
      ratingChange: 15
    },
    {
      id: '2',
      gameType: 'omok',
      opponent: '오목마스터',
      result: 'loss',
      date: '2024-01-15 13:20',
      ratingChange: -12
    },
    {
      id: '3',
      gameType: 'baduk',
      opponent: '초보플레이어',
      result: 'win',
      date: '2024-01-14 18:45',
      ratingChange: 8
    },
    {
      id: '4',
      gameType: 'omok',
      opponent: '중수유저',
      result: 'draw',
      date: '2024-01-14 16:10',
      ratingChange: 0
    },
    {
      id: '5',
      gameType: 'baduk',
      opponent: '프로게이머',
      result: 'loss',
      date: '2024-01-13 20:15',
      ratingChange: -18
    }
  ]);

  useEffect(() => {
    const storedUser = localStorage.getItem('userInfo');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserInfo(user);
        setEditForm(prev => ({ ...prev, nickname: user.nickname }));
      } catch (error) {
        console.error('Failed to parse user info:', error);
        navigate('/');
      }
    } else {
      navigate('/');
    }
  }, [navigate]);

  const handleEditSubmit = async () => {
    setEditError('');

    if (!editForm.nickname.trim()) {
      setEditError('닉네임을 입력해주세요.');
      return;
    }

    if (editForm.newPassword) {
      if (!editForm.currentPassword) {
        setEditError('현재 비밀번호를 입력해주세요.');
        return;
      }
      if (editForm.newPassword.length < 6) {
        setEditError('새 비밀번호는 6자 이상이어야 합니다.');
        return;
      }
      if (editForm.newPassword !== editForm.confirmPassword) {
        setEditError('새 비밀번호가 일치하지 않습니다.');
        return;
      }
    }

    try {
      // 실제 API 호출
      // const response = await fetch('/api/profile/update', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     nickname: editForm.nickname,
      //     currentPassword: editForm.currentPassword,
      //     newPassword: editForm.newPassword
      //   })
      // });

      // 임시로 로컬 업데이트
      if (userInfo) {
        const updatedUser = { ...userInfo, nickname: editForm.nickname };
        setUserInfo(updatedUser);
        localStorage.setItem('userInfo', JSON.stringify(updatedUser));
      }

      setShowEditModal(false);
      setEditForm(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      setEditError('정보 수정에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const getResultBadge = (result: string) => {
    const styles = {
      win: { bg: 'rgba(34, 197, 94, 0.2)', border: '#22c55e', text: '#22c55e' },
      loss: { bg: 'rgba(239, 68, 68, 0.2)', border: '#ef4444', text: '#ef4444' },
      draw: { bg: 'rgba(138, 180, 248, 0.2)', border: '#8ab4f8', text: '#8ab4f8' }
    };
    const style = styles[result as keyof typeof styles];
    const label = result === 'win' ? '승리' : result === 'loss' ? '패배' : '무승부';

    return (
      <span
        className="px-2 py-1 rounded-lg text-xs font-semibold border"
        style={{
          backgroundColor: style.bg,
          borderColor: style.border,
          color: style.text
        }}
      >
        {label}
      </span>
    );
  };

  if (!userInfo) return null;

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0b0c10' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6 border-b" style={{ borderColor: '#2a2a33' }}>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center"
               style={{ 
                 background: 'linear-gradient(135deg, #1f6feb 0%, #1b4fd8 100%)',
                 boxShadow: '0 4px 12px rgba(31, 111, 235, 0.3)'
               }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" fill="white" opacity="0.9"/>
              <circle cx="12" cy="12" r="7" fill="black" opacity="0.8"/>
              <circle cx="9" cy="9" r="2" fill="white" opacity="0.3"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Doljabi
          </h1>
        </div>
        
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
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-8">
        {/* Profile Header */}
        <div className="rounded-2xl p-8 border mb-8"
             style={{ 
               backgroundColor: 'rgba(22,22,28,0.6)', 
               borderColor: '#2a2a33',
               boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
             }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-bold"
                   style={{ backgroundColor: '#1f6feb' }}>
                {userInfo.nickname.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-2" style={{ color: '#e8eaf0' }}>
                  {userInfo.nickname}
                </h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <i className="ri-user-line" style={{ color: '#9aa1ad' }}></i>
                    <span style={{ color: '#9aa1ad' }}>{userInfo.username}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <i className="ri-trophy-line" style={{ color: '#8ab4f8' }}></i>
                    <span className="font-semibold" style={{ color: '#8ab4f8' }}>
                      레이팅: {userInfo.rating}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setShowEditModal(true)}
              className="px-6 py-3 rounded-lg transition-all cursor-pointer whitespace-nowrap text-white flex items-center space-x-2"
              style={{ 
                background: 'linear-gradient(180deg, #1f6feb, #1b4fd8)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
              }}
            >
              <i className="ri-edit-line"></i>
              <span>프로필 수정</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-8">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'stats' ? 'text-white' : ''
            }`}
            style={{
              backgroundColor: activeTab === 'stats' ? '#1f6feb' : '#141822',
              color: activeTab === 'stats' ? '#ffffff' : '#9aa1ad',
              boxShadow: activeTab === 'stats' ? '0 2px 8px rgba(31, 111, 235, 0.3)' : 'none'
            }}
          >
            게임 통계
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'history' ? 'text-white' : ''
            }`}
            style={{
              backgroundColor: activeTab === 'history' ? '#1f6feb' : '#141822',
              color: activeTab === 'history' ? '#ffffff' : '#9aa1ad',
              boxShadow: activeTab === 'history' ? '0 2px 8px rgba(31, 111, 235, 0.3)' : 'none'
            }}
          >
            게임 기록
          </button>
        </div>

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                {gameStats.totalGames}
              </div>
            </div>

            <div className="rounded-2xl p-6 border"
                 style={{ 
                   backgroundColor: 'rgba(22,22,28,0.6)', 
                   borderColor: '#2a2a33',
                   boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                 }}>
              <div className="flex items-center justify-between mb-4">
                <span style={{ color: '#9aa1ad' }}>승리</span>
                <i className="ri-trophy-line text-2xl" style={{ color: '#22c55e' }}></i>
              </div>
              <div className="text-4xl font-bold" style={{ color: '#22c55e' }}>
                {gameStats.wins}
              </div>
            </div>

            <div className="rounded-2xl p-6 border"
                 style={{ 
                   backgroundColor: 'rgba(22,22,28,0.6)', 
                   borderColor: '#2a2a33',
                   boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                 }}>
              <div className="flex items-center justify-between mb-4">
                <span style={{ color: '#9aa1ad' }}>패배</span>
                <i className="ri-close-circle-line text-2xl" style={{ color: '#ef4444' }}></i>
              </div>
              <div className="text-4xl font-bold" style={{ color: '#ef4444' }}>
                {gameStats.losses}
              </div>
            </div>

            <div className="rounded-2xl p-6 border"
                 style={{ 
                   backgroundColor: 'rgba(22,22,28,0.6)', 
                   borderColor: '#2a2a33',
                   boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                 }}>
              <div className="flex items-center justify-between mb-4">
                <span style={{ color: '#9aa1ad' }}>승률</span>
                <i className="ri-percent-line text-2xl" style={{ color: '#8ab4f8' }}></i>
              </div>
              <div className="text-4xl font-bold" style={{ color: '#8ab4f8' }}>
                {gameStats.winRate}%
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
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
                      상대방
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#e8eaf0' }}>
                      결과
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#e8eaf0' }}>
                      레이팅 변화
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold" style={{ color: '#e8eaf0' }}>
                      날짜
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {gameHistory.map((game) => (
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
                        {game.opponent}
                      </td>
                      <td className="px-6 py-4">
                        {getResultBadge(game.result)}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold"
                          style={{ color: game.ratingChange > 0 ? '#22c55e' : game.ratingChange < 0 ? '#ef4444' : '#9aa1ad' }}>
                        {game.ratingChange > 0 ? '+' : ''}{game.ratingChange}
                      </td>
                      <td className="px-6 py-4 text-sm" style={{ color: '#9aa1ad' }}>
                        {game.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4"
             style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="rounded-2xl p-8 w-full max-w-md border"
               style={{ 
                 backgroundColor: 'rgba(22,22,28,0.9)', 
                 borderColor: '#2a2a33',
                 boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
               }}>
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold mb-2" style={{ color: '#e8eaf0' }}>프로필 수정</h3>
              <p style={{ color: '#9aa1ad' }}>정보를 수정하세요</p>
            </div>
            
            {editError && (
              <div className="mb-4 p-3 rounded-lg border"
                   style={{ 
                     backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                     borderColor: '#ef4444',
                     color: '#ef4444'
                   }}>
                {editError}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: '#e8eaf0' }}>
                  닉네임
                </label>
                <input
                  type="text"
                  value={editForm.nickname}
                  onChange={(e) => setEditForm(prev => ({ ...prev, nickname: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border text-sm"
                  style={{ 
                    backgroundColor: '#141822', 
                    borderColor: '#2a2a33',
                    color: '#e8eaf0'
                  }}
                  placeholder="닉네임을 입력하세요"
                />
              </div>
              
              <div className="pt-4 border-t" style={{ borderColor: '#2a2a33' }}>
                <p className="text-sm mb-4" style={{ color: '#9aa1ad' }}>
                  비밀번호를 변경하려면 아래 항목을 입력하세요
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#e8eaf0' }}>
                      현재 비밀번호
                    </label>
                    <input
                      type="password"
                      value={editForm.currentPassword}
                      onChange={(e) => setEditForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border text-sm"
                      style={{ 
                        backgroundColor: '#141822', 
                        borderColor: '#2a2a33',
                        color: '#e8eaf0'
                      }}
                      placeholder="현재 비밀번호"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#e8eaf0' }}>
                      새 비밀번호
                    </label>
                    <input
                      type="password"
                      value={editForm.newPassword}
                      onChange={(e) => setEditForm(prev => ({ ...prev, newPassword: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border text-sm"
                      style={{ 
                        backgroundColor: '#141822', 
                        borderColor: '#2a2a33',
                        color: '#e8eaf0'
                      }}
                      placeholder="새 비밀번호 (6자 이상)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#e8eaf0' }}>
                      새 비밀번호 확인
                    </label>
                    <input
                      type="password"
                      value={editForm.confirmPassword}
                      onChange={(e) => setEditForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border text-sm"
                      style={{ 
                        backgroundColor: '#141822', 
                        borderColor: '#2a2a33',
                        color: '#e8eaf0'
                      }}
                      placeholder="새 비밀번호 확인"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <button 
                onClick={handleEditSubmit}
                className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap text-white"
                style={{ 
                  background: 'linear-gradient(180deg, #1f6feb, #1b4fd8)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}
              >
                저장하기
              </button>
              <button 
                onClick={() => {
                  setShowEditModal(false);
                  setEditForm(prev => ({
                    nickname: userInfo?.nickname || '',
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  }));
                  setEditError('');
                }}
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
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
