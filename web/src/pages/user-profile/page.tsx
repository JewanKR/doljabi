import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionManager } from '../../api/axios-instance';
import { useGetUserProfileHandler, useDeleteUser, updateUsername, updatePassword  } from '../../api/endpoints/user/user';

interface UserStats {
  username: string | null;
  rating: number;
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
}

export default function UserProfile() {
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserStats | null>(null);
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [newNickname, setNewNickname] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const userProfileMutation = useGetUserProfileHandler();
  const deleteUserMutation = useDeleteUser();

  useEffect(() => {
    const sessionKey = SessionManager.getSessionKey();
    
    if (!sessionKey) {
      alert('로그인이 필요합니다.');
      navigate('/');
      return;
    }

    // 유저 프로필 가져오기
    userProfileMutation.mutateAsync({
      data: { session_key: sessionKey } as any
    }).then((response) => {
      if (response.user) {
        setUserProfile({
          username: response.user.username || null,
          rating: response.user.rating,
          // TODO: 백엔드에서 통계 데이터 받아오기
          totalGames: 0,
          wins: 0,
          losses: 0,
          draws: 0,
        });
        setNewNickname(response.user.username || '');
      }
    }).catch((error) => {
      console.error('프로필 가져오기 실패:', error);
      SessionManager.clearSessionKey();
      navigate('/');
    });
  }, [navigate]);

  const handleNicknameUpdate = async () => {
    const sessionKey = SessionManager.getSessionKey();
    if (!sessionKey) {
      alert('로그인이 필요합니다.');
      navigate('/');
      return;
    }

    if (!newNickname.trim()) {
      alert('닉네임을 입력해주세요.');
      return;
    }

    if (newNickname.trim() === userProfile?.username) {
      alert('새 닉네임이 현재 닉네임과 동일합니다.');
      return;
    }

    try {
      const result = await updateUsername({
        session_key: sessionKey,
        new_username: newNickname.trim(),
      });

      if (result.success) {
        alert('닉네임이 변경되었습니다!');
        setUserProfile(prev => prev ? { ...prev, username: newNickname.trim() } : null);
        setIsEditingNickname(false);
      } else {
        alert(result.message || '닉네임 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('닉네임 변경 오류:', error);
      alert('닉네임 변경 중 오류가 발생했습니다.');
    }
  };

  const handlePasswordUpdate = async () => {
    const sessionKey = SessionManager.getSessionKey();
    if (!sessionKey) {
      alert('로그인이 필요합니다.');
      navigate('/');
      return;
    }

    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('모든 비밀번호 필드를 입력해주세요.');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('새 비밀번호가 일치하지 않습니다.');
      return;
    }

    if (currentPassword === newPassword) {
      alert('새 비밀번호는 현재 비밀번호와 달라야 합니다.');
      return;
    }

    if (newPassword.length < 6) {
      alert('새 비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    try {
      const result = await updatePassword({
        session_key: sessionKey,
        current_password: currentPassword,
        new_password: newPassword,
      });

      if (result.success) {
        alert('비밀번호가 변경되었습니다!');
        setIsEditingPassword(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        alert(result.message || '비밀번호 변경에 실패했습니다.');
      }
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      alert('비밀번호 변경 중 오류가 발생했습니다.');
    }
  };

  const handleAccountDeletion = async () => {
    if (!confirm('정말로 회원탈퇴 하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    const sessionKey = SessionManager.getSessionKey();
    if (!sessionKey) {
      alert('로그인이 필요합니다.');
      navigate('/');
      return;
    }

    try {
      const result = await deleteUserMutation.mutateAsync({
        data: { session_key: sessionKey } as any
      });

      if (result.success) {
        alert('회원탈퇴가 완료되었습니다.');
        SessionManager.clearSessionKey();
        navigate('/');
      } else {
        alert(result.message || '회원탈퇴에 실패했습니다.');
      }
    } catch (error) {
      console.error('회원탈퇴 오류:', error);
      alert('회원탈퇴 중 오류가 발생했습니다.');
    }
  };

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#0b0c10' }}>
        <div className="text-white">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0b0c10' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-4 border-b" style={{ borderColor: '#2a2a33' }}>
        <div className="flex items-center space-x-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer"
            onClick={() => navigate('/')}
            style={{
              background: 'linear-gradient(135deg, #1f6feb 0%, #1b4fd8 100%)',
              boxShadow: '0 4px 12px rgba(31, 111, 235, 0.3)',
            }}
          >
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
          className="px-6 py-2 rounded-lg transition-all cursor-pointer"
          style={{
            backgroundColor: '#141822',
            color: '#8ab4f8',
            border: '1px solid #2a2a33',
          }}
        >
          홈으로
        </button>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2" style={{ color: '#e8eaf0' }}>
            프로필 설정
          </h2>
          <p style={{ color: '#9aa1ad' }}>
            계정 정보를 관리하세요
          </p>
        </div>

        <div className="space-y-6">
          {/* 프로필 카드 */}
          <div
            className="rounded-xl p-6 border"
            style={{
              backgroundColor: 'rgba(22,22,28,0.6)',
              borderColor: '#2a2a33',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex items-center space-x-6 mb-6">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, #1f6feb 0%, #1b4fd8 100%)',
                  boxShadow: '0 4px 12px rgba(31, 111, 235, 0.3)',
                }}
              >
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="20" cy="20" r="12" fill="white" opacity="0.9"/>
                  <path d="M20 8C16 8 13 11 13 15C13 19 16 22 20 22C24 22 27 19 27 15C27 11 24 8 20 8Z" fill="#1f6feb"/>
                  <path d="M8 32C8 25 13 20 20 20C27 20 32 25 32 32" fill="#1f6feb"/>
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-2xl font-bold mb-1" style={{ color: '#e8eaf0' }}>
                  {userProfile.username || '닉네임 없음'}
                </div>
                <div className="flex items-center space-x-2">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8 1L9.5 5L13.5 6L10 9L11 13L8 11L5 13L6 9L2.5 6L6.5 5L8 1Z" fill="#f59e0b"/>
                  </svg>
                  <span className="text-lg" style={{ color: '#9aa1ad' }}>
                    레이팅: {userProfile.rating}
                  </span>
                </div>
              </div>
            </div>

            {/* 통계 정보 */}
            <div className="grid grid-cols-4 gap-4 pt-6 border-t" style={{ borderColor: '#2a2a33' }}>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1" style={{ color: '#e8eaf0' }}>
                  {userProfile.totalGames}
                </div>
                <div className="text-xs" style={{ color: '#9aa1ad' }}>
                  총 게임
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1" style={{ color: '#10b981' }}>
                  {userProfile.wins}
                </div>
                <div className="text-xs" style={{ color: '#9aa1ad' }}>
                  승리
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1" style={{ color: '#ef4444' }}>
                  {userProfile.losses}
                </div>
                <div className="text-xs" style={{ color: '#9aa1ad' }}>
                  패배
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold mb-1" style={{ color: '#f59e0b' }}>
                  {userProfile.draws}
                </div>
                <div className="text-xs" style={{ color: '#9aa1ad' }}>
                  무승부
                </div>
              </div>
            </div>

            {/* 승률 */}
            <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: '#141822' }}>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{ color: '#9aa1ad' }}>승률</span>
                <span className="text-xl font-bold" style={{ color: '#8ab4f8' }}>
                  {userProfile.totalGames > 0
                    ? `${((userProfile.wins / userProfile.totalGames) * 100).toFixed(1)}%`
                    : '0.0%'}
                </span>
              </div>
              {/* 승률 바 */}
              <div className="mt-2 h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#0b0c10' }}>
                <div
                  className="h-full transition-all"
                  style={{
                    width: userProfile.totalGames > 0
                      ? `${(userProfile.wins / userProfile.totalGames) * 100}%`
                      : '0%',
                    background: 'linear-gradient(90deg, #10b981 0%, #22c55e 100%)',
                  }}
                />
              </div>
            </div>
          </div>

          {/* 닉네임 변경 */}
          <div
            className="rounded-xl p-6 border"
            style={{
              backgroundColor: 'rgba(22,22,28,0.6)',
              borderColor: '#2a2a33',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold" style={{ color: '#e8eaf0' }}>
                닉네임 변경
              </h3>
              {!isEditingNickname && (
                <button
                  onClick={() => setIsEditingNickname(true)}
                  className="px-4 py-2 rounded-lg transition-all"
                  style={{
                    backgroundColor: '#1f6feb',
                    color: 'white',
                  }}
                >
                  변경하기
                </button>
              )}
            </div>

            {isEditingNickname ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#9aa1ad' }}>
                    새 닉네임
                  </label>
                  <input
                    type="text"
                    value={newNickname}
                    onChange={(e) => setNewNickname(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg"
                    style={{
                      backgroundColor: '#141822',
                      border: '1px solid #2a2a33',
                      color: '#e8eaf0',
                    }}
                    placeholder="새 닉네임 입력"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handleNicknameUpdate}
                    className="flex-1 py-2 rounded-lg transition-all"
                    style={{
                      backgroundColor: '#1f6feb',
                      color: 'white',
                    }}
                  >
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingNickname(false);
                      setNewNickname(userProfile.username || '');
                    }}
                    className="flex-1 py-2 rounded-lg transition-all"
                    style={{
                      backgroundColor: '#2a2a33',
                      color: '#e8eaf0',
                    }}
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ color: '#9aa1ad' }}>
                현재 닉네임: <span style={{ color: '#e8eaf0' }}>{userProfile.username || '없음'}</span>
              </div>
            )}
          </div>

          {/* 비밀번호 변경 */}
          <div
            className="rounded-xl p-6 border"
            style={{
              backgroundColor: 'rgba(22,22,28,0.6)',
              borderColor: '#2a2a33',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold" style={{ color: '#e8eaf0' }}>
                비밀번호 변경
              </h3>
              {!isEditingPassword && (
                <button
                  onClick={() => setIsEditingPassword(true)}
                  className="px-4 py-2 rounded-lg transition-all"
                  style={{
                    backgroundColor: '#1f6feb',
                    color: 'white',
                  }}
                >
                  변경하기
                </button>
              )}
            </div>

            {isEditingPassword ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#9aa1ad' }}>
                    현재 비밀번호
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg"
                    style={{
                      backgroundColor: '#141822',
                      border: '1px solid #2a2a33',
                      color: '#e8eaf0',
                    }}
                    placeholder="현재 비밀번호"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#9aa1ad' }}>
                    새 비밀번호 (최소 6자)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg"
                    style={{
                      backgroundColor: '#141822',
                      border: '1px solid #2a2a33',
                      color: '#e8eaf0',
                    }}
                    placeholder="새 비밀번호"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2" style={{ color: '#9aa1ad' }}>
                    새 비밀번호 확인
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg"
                    style={{
                      backgroundColor: '#141822',
                      border: '1px solid #2a2a33',
                      color: '#e8eaf0',
                    }}
                    placeholder="새 비밀번호 확인"
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={handlePasswordUpdate}
                    className="flex-1 py-2 rounded-lg transition-all"
                    style={{
                      backgroundColor: '#1f6feb',
                      color: 'white',
                    }}
                  >
                    저장
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingPassword(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="flex-1 py-2 rounded-lg transition-all"
                    style={{
                      backgroundColor: '#2a2a33',
                      color: '#e8eaf0',
                    }}
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ color: '#9aa1ad' }}>
                보안을 위해 정기적으로 비밀번호를 변경하세요
              </div>
            )}
          </div>

          {/* 회원탈퇴 */}
          <div
            className="rounded-xl p-6 border"
            style={{
              backgroundColor: 'rgba(220,38,38,0.1)',
              borderColor: '#dc2626',
              boxShadow: '0 8px 32px rgba(220,38,38,0.2)',
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold mb-1" style={{ color: '#e8eaf0' }}>
                  회원탈퇴
                </div>
                <div className="text-sm" style={{ color: '#9aa1ad' }}>
                  계정을 삭제하면 모든 데이터가 영구적으로 삭제됩니다
                </div>
              </div>
              <button
                onClick={handleAccountDeletion}
                className="px-6 py-2 rounded-lg transition-all"
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#b91c1c';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#dc2626';
                }}
              >
                회원탈퇴
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

