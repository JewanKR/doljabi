
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLogin } from '../../api/endpoints/auth/auth';
import { useSignup } from '../../api/endpoints/auth/auth';
import { SessionManager } from '../../api/axios-instance';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'omok' | 'baduk'>('baduk');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);
  
  const [loginForm, setLoginForm] = useState({
    login_id: '',
    password: ''
  });
  const [loginError, setLoginError] = useState('');
  
  const [signupForm, setSignupForm] = useState({
    login_id: '',
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [signupError, setSignupError] = useState('');

  const loginMutation = useLogin();
  const signupMutation = useSignup();

  // URL 경로에 따라 모달 상태 설정
  useEffect(() => {
    if (location.pathname === '/login') {
      setShowLoginModal(true);
      setShowSignupModal(false);
    } else if (location.pathname === '/signup') {
      setShowSignupModal(true);
      setShowLoginModal(false);
    } else {
      setShowLoginModal(false);
      setShowSignupModal(false);
    }
  }, [location.pathname]);

  const handleLoginSubmit = async () => {
    setLoginError('');
    
    if (!loginForm.login_id.trim()) {
      setLoginError('아이디를 입력해주세요.');
      return;
    }
    
    if (!loginForm.password) {
      setLoginError('비밀번호를 입력해주세요.');
      return;
    }
    
    try {
      const result = await loginMutation.mutateAsync({
        data: {
          login_id: loginForm.login_id,
          password: loginForm.password
        }
      });
      
      if (result.success && result.session_key) {
        // 세션키를 SessionManager에 저장
        SessionManager.setSessionKey(result.session_key);
        // 모달 닫고 홈으로 리다이렉트
        setShowLoginModal(false);
        setLoginForm({ login_id: '', password: '' });
        navigate('/');
      } else {
        setLoginError(result.message || '로그인에 실패했습니다.');
      }
    } catch (error: any) {
      // 에러 응답 구조에 따라 메시지 추출
      const errorMessage = error?.response?.data?.message 
        || error?.message 
        || '로그인 처리 중 오류가 발생했습니다.';
      setLoginError(errorMessage);
    }
  };

  const handleSignupSubmit = async () => {
    setSignupError('');
    
    if (!signupForm.login_id.trim()) {
      setSignupError('아이디를 입력해주세요.');
      return;
    }
    
    if (!signupForm.username.trim()) {
      setSignupError('닉네임을 입력해주세요.');
      return;
    }
    
    if (!signupForm.password) {
      setSignupError('비밀번호를 입력해주세요.');
      return;
    }
    
    if (signupForm.password !== signupForm.confirmPassword) {
      setSignupError('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    if (signupForm.password.length < 6) {
      setSignupError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }
    
    try {
      const result = await signupMutation.mutateAsync({
        data: {
          login_id: signupForm.login_id,
          username: signupForm.username,
          password: signupForm.password
        }
      });
      
      if (result.success) {
        setShowSignupModal(false);
        setShowSignupSuccess(true);
        setSignupForm({ login_id: '', username: '', password: '', confirmPassword: '' });
        navigate('/');
      } else {
        setSignupError(result.message || '회원가입에 실패했습니다.');
      }
    } catch (error: any) {
      // 에러 응답 구조에 따라 메시지 추출
      const errorMessage = error?.response?.data?.message 
        || error?.message 
        || '회원가입 처리 중 오류가 발생했습니다.';
      setSignupError(errorMessage);
    }
  };

  const resetLoginModal = () => {
    setShowLoginModal(false);
    setLoginForm({ login_id: '', password: '' });
    setLoginError('');
    navigate('/');
  };

  const resetSignupModal = () => {
    setShowSignupModal(false);
    setSignupForm({ login_id: '', username: '', password: '', confirmPassword: '' });
    setSignupError('');
    navigate('/');
  };

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
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/login')}
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
            로그인
          </button>
          <button 
            onClick={() => navigate('/signup')}
            className="px-6 py-2 rounded-lg transition-all cursor-pointer whitespace-nowrap text-white"
            style={{ 
              background: 'linear-gradient(180deg, #1f6feb, #1b4fd8)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}
          >
            회원가입
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-88px)] p-8">
        <div className="w-full max-w-4xl">
          {/* Welcome Section */}
          <div className="text-center mb-8">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              돌잡이에 오신 것을 환영합니다
            </h2>
            
            {/* 3D 바둑 이미지 */}
            <div className="flex justify-center mb-6">
              <img 
                src="https://readdy.ai/api/search-image?query=Strategic%20baduk%20go%20game%20in%20progress%20with%20black%20and%20white%20stones%20positioned%20on%20traditional%20wooden%20board%2C%20warm%20natural%20lighting%20creating%20professional%20photography%20atmosphere%2C%20traditional%20wood%20grain%20texture%20and%20patterns%20clearly%20visible%20in%202D%20flat%20design%20style%2C%20clean%20minimal%20background%20for%20enhanced%20visual%20impact%2C%20ongoing%20game%20situation%20with%20stones%20strategically%20placed%20across%20the%2019x19%20grid%2C%20authentic%20Asian%20board%20game%20aesthetic%20with%20contemporary%20minimalist%20approach&width=600&height=300&seq=baduk-strategic-game-hero&orientation=landscape"
                alt="Baduk Game"
                className="w-full max-w-2xl rounded-2xl"
                style={{ 
                  boxShadow: '0 20px 60px rgba(31, 111, 235, 0.3)',
                  objectFit: 'cover'
                }}
              />
            </div>
            
            <p className="text-xl" style={{ color: '#9aa1ad' }}>
              실시간 대전으로 실력을 겨루고<br />
              오목과 바둑의 모든 것을 경험하세요
            </p>
          </div>

          {/* Game Selection Tabs */}
          <div className="flex justify-center mb-8">
            <div className="flex rounded-xl p-1 border"
                 style={{ 
                   backgroundColor: 'rgba(22,22,28,0.6)', 
                   borderColor: '#2a2a33'
                 }}>
              <button
                onClick={() => setActiveTab('baduk')}
                className={`px-8 py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === 'baduk' ? 'text-white' : ''
                }`}
                style={{
                  backgroundColor: activeTab === 'baduk' ? '#1f6feb' : 'transparent',
                  color: activeTab === 'baduk' ? '#ffffff' : '#9aa1ad',
                  boxShadow: activeTab === 'baduk' ? '0 2px 8px rgba(31, 111, 235, 0.3)' : 'none'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="2" width="16" height="16" rx="1" fill="none" stroke="currentColor" strokeWidth="1.5"/>
                  <line x1="2" y1="6" x2="18" y2="6" stroke="currentColor" strokeWidth="1"/>
                  <line x1="2" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="1"/>
                  <line x1="2" y1="14" x2="18" y2="14" stroke="currentColor" strokeWidth="1"/>
                  <line x1="6" y1="2" x2="6" y2="18" stroke="currentColor" strokeWidth="1"/>
                  <line x1="10" y1="2" x2="10" y2="18" stroke="currentColor" strokeWidth="1"/>
                  <line x1="14" y1="2" x2="14" y2="18" stroke="currentColor" strokeWidth="1"/>
                </svg>
                <span>바둑</span>
              </button>
              <button
                onClick={() => setActiveTab('omok')}
                className={`px-8 py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center space-x-2 ${
                  activeTab === 'omok' ? 'text-white' : ''
                }`}
                style={{
                  backgroundColor: activeTab === 'omok' ? '#1f6feb' : 'transparent',
                  color: activeTab === 'omok' ? '#ffffff' : '#9aa1ad',
                  boxShadow: activeTab === 'omok' ? '0 2px 8px rgba(31, 111, 235, 0.3)' : 'none'
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="4" cy="10" r="2" fill="currentColor"/>
                  <circle cx="8" cy="10" r="2" fill="currentColor"/>
                  <circle cx="12" cy="10" r="2" fill="currentColor"/>
                  <circle cx="16" cy="10" r="2" fill="currentColor"/>
                  <line x1="5" y1="10" x2="15" y2="10" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <span>오목</span>
              </button>
            </div>
          </div>

          {/* Game Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
            {/* 빠른 대국 */}
            <div 
              onClick={() => navigate(`/${activeTab}/quick-match`)}
              className="rounded-2xl p-8 border cursor-pointer transition-all hover:scale-105 hover:-translate-y-1"
              style={{ 
                backgroundColor: 'rgba(22,22,28,0.6)', 
                borderColor: '#2a2a33',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#8ab4f8';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(138,180,248,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#2a2a33';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
              }}
            >
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-xl flex items-center justify-center"
                     style={{ backgroundColor: '#141822' }}>
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20 5L25 15L35 17L27.5 24L29.5 35L20 29L10.5 35L12.5 24L5 17L15 15L20 5Z" fill="#8ab4f8"/>
                    <circle cx="20" cy="20" r="3" fill="#1f6feb"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3" style={{ color: '#e8eaf0' }}>빠른 대국</h3>
                <p className="text-base" style={{ color: '#9aa1ad' }}>
                  랜덤 매칭으로 즉시 게임 시작
                </p>
              </div>
            </div>

            {/* 등급전 */}
            <div 
              onClick={() => navigate(`/${activeTab}/ranked-match`)}
              className="rounded-2xl p-8 border cursor-pointer transition-all hover:scale-105 hover:-translate-y-1"
              style={{ 
                backgroundColor: 'rgba(22,22,28,0.6)', 
                borderColor: '#2a2a33',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#8ab4f8';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(138,180,248,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#2a2a33';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
              }}
            >
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-xl flex items-center justify-center"
                     style={{ backgroundColor: '#141822' }}>
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="15" r="8" fill="none" stroke="#8ab4f8" strokeWidth="2"/>
                    <path d="M20 7L21.5 11.5L26 13L21.5 14.5L20 19L18.5 14.5L14 13L18.5 11.5L20 7Z" fill="#8ab4f8"/>
                    <rect x="17" y="22" width="6" height="3" rx="1" fill="#8ab4f8"/>
                    <path d="M14 25H26L24 32H16L14 25Z" fill="#8ab4f8"/>
                    <ellipse cx="20" cy="32" rx="6" ry="1.5" fill="#8ab4f8" opacity="0.3"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3" style={{ color: '#e8eaf0' }}>등급전</h3>
                <p className="text-base" style={{ color: '#9aa1ad' }}>
                  레이팅을 걸고 실력을 겨루세요
                </p>
              </div>
            </div>

            {/* 방 생성 */}
            <div 
              onClick={() => navigate(`/${activeTab}/create-room`)}
              className="rounded-2xl p-8 border cursor-pointer transition-all hover:scale-105 hover:-translate-y-1"
              style={{ 
                backgroundColor: 'rgba(22,22,28,0.6)', 
                borderColor: '#2a2a33',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#8ab4f8';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(138,180,248,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#2a2a33';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
              }}
            >
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-xl flex items-center justify-center"
                     style={{ backgroundColor: '#141822' }}>
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="8" y="12" width="24" height="20" rx="2" fill="none" stroke="#8ab4f8" strokeWidth="2"/>
                    <path d="M12 12V10C12 8.89543 12.8954 8 14 8H26C27.1046 8 28 8.89543 28 10V12" stroke="#8ab4f8" strokeWidth="2"/>
                    <line x1="20" y1="18" x2="20" y2="26" stroke="#8ab4f8" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="16" y1="22" x2="24" y2="22" stroke="#8ab4f8" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3" style={{ color: '#e8eaf0' }}>방 생성</h3>
                <p className="text-base" style={{ color: '#9aa1ad' }}>
                  친구와 함께 플레이할 방을 생성
                </p>
              </div>
            </div>

            {/* 방 입장 */}
            <div 
              onClick={() => navigate(`/${activeTab}/join-room`)}
              className="rounded-2xl p-8 border cursor-pointer transition-all hover:scale-105 hover:-translate-y-1"
              style={{ 
                backgroundColor: 'rgba(22,22,28,0.6)', 
                borderColor: '#2a2a33',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#8ab4f8';
                e.currentTarget.style.boxShadow = '0 12px 40px rgba(138,180,248,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#2a2a33';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
              }}
            >
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 rounded-xl flex items-center justify-center"
                     style={{ backgroundColor: '#141822' }}>
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="10" y="8" width="20" height="24" rx="2" fill="none" stroke="#8ab4f8" strokeWidth="2"/>
                    <path d="M18 20C18 18.8954 18.8954 18 20 18H30" stroke="#8ab4f8" strokeWidth="2" strokeLinecap="round"/>
                    <path d="M27 15L30 18L27 21" stroke="#8ab4f8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="16" cy="20" r="1.5" fill="#8ab4f8"/>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-3" style={{ color: '#e8eaf0' }}>방 입장</h3>
                <p className="text-base" style={{ color: '#9aa1ad' }}>
                  방 코드로 친구의 방에 참여
                </p>
              </div>
            </div>
          </div>

          {/* Game Info */}
          <div className="text-center">
            <div className="rounded-2xl p-8 border"
                 style={{ 
                   backgroundColor: 'rgba(22,22,28,0.6)', 
                   borderColor: '#2a2a33',
                   boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
                 }}>
              <h3 className="text-2xl font-bold mb-4" style={{ color: '#e8eaf0' }}>
                {activeTab === 'omok' ? '오목' : '바둑'}에 대해
              </h3>
              <p className="text-lg leading-relaxed whitespace-pre-line" style={{ color: '#9aa1ad' }}>
                {activeTab === 'omok' 
                  ? '오목은 19×19 바둑판에서 흑돌과 백돌을 번갈아 놓아,\n먼저 5개의 돌을 일직선으로 연결하는 사람이 승리하는 게임입니다.'
                  : '바둑은 19×19 바둑판에서 흑돌과 백돌을 번갈아 놓아,\n상대방보다 더 많은 집을 차지하는 것이 목표인 전략 게임입니다.'
                }
              </p>
            </div>
          </div>

          {/* Login Modal */}
          {showLoginModal && (
            <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                 style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="rounded-2xl p-8 w-full max-w-md border"
                   style={{ 
                     backgroundColor: 'rgba(22,22,28,0.9)', 
                     borderColor: '#2a2a33',
                     boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                   }}>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2" style={{ color: '#e8eaf0' }}>로그인</h3>
                  <p style={{ color: '#9aa1ad' }}>돌잡이에 오신 것을 환영합니다</p>
                </div>
                
                {loginError && (
                  <div className="mb-4 p-3 rounded-lg border"
                       style={{ 
                         backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                         borderColor: '#ef4444',
                         color: '#ef4444'
                       }}>
                    {loginError}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#e8eaf0' }}>
                      아이디
                    </label>
                    <input
                      type="text"
                      value={loginForm.login_id}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, login_id: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border text-sm"
                      style={{ 
                        backgroundColor: '#141822', 
                        borderColor: '#2a2a33',
                        color: '#e8eaf0'
                      }}
                      placeholder="아이디를 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#e8eaf0' }}>
                      비밀번호
                    </label>
                    <input
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border text-sm"
                      style={{ 
                        backgroundColor: '#141822', 
                        borderColor: '#2a2a33',
                        color: '#e8eaf0'
                      }}
                      placeholder="비밀번호를 입력하세요"
                    />
                  </div>
                </div>
                
                <div className="mt-6 space-y-3">
                  <button 
                    onClick={handleLoginSubmit}
                    disabled={loginMutation.isPending}
                    className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      background: 'linear-gradient(180deg, #1f6feb, #1b4fd8)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}
                  >
                    {loginMutation.isPending ? '로그인 중...' : '로그인'}
                  </button>
                  <button 
                    onClick={resetLoginModal}
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

          {/* Signup Modal */}
          {showSignupModal && (
            <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                 style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="rounded-2xl p-8 w-full max-w-md border"
                   style={{ 
                     backgroundColor: 'rgba(22,22,28,0.9)', 
                     borderColor: '#2a2a33',
                     boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                   }}>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2" style={{ color: '#e8eaf0' }}>회원가입</h3>
                  <p style={{ color: '#9aa1ad' }}>새로운 계정을 만들어보세요</p>
                </div>
                
                {signupError && (
                  <div className="mb-4 p-3 rounded-lg border"
                       style={{ 
                         backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                         borderColor: '#ef4444',
                         color: '#ef4444'
                       }}>
                    {signupError}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#e8eaf0' }}>
                      아이디
                    </label>
                    <input
                      type="text"
                      value={signupForm.login_id}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, login_id: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border text-sm"
                      style={{ 
                        backgroundColor: '#141822', 
                        borderColor: '#2a3a33',
                        color: '#e8eaf0'
                      }}
                      placeholder="아이디를 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#e8eaf0' }}>
                      닉네임
                    </label>
                    <input
                      type="text"
                      value={signupForm.username}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border text-sm"
                      style={{ 
                        backgroundColor: '#141822', 
                        borderColor: '#2a2a33',
                        color: '#e8eaf0'
                      }}
                      placeholder="닉네임을 입력하세요"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#e8eaf0' }}>
                      비밀번호
                    </label>
                    <input
                      type="password"
                      value={signupForm.password}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border text-sm"
                      style={{ 
                        backgroundColor: '#141822', 
                        borderColor: '#2a2a33',
                        color: '#e8eaf0'
                      }}
                      placeholder="비밀번호를 입력하세요 (6자 이상)"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2" style={{ color: '#e8eaf0' }}>
                      비밀번호 확인
                    </label>
                    <input
                      type="password"
                      value={signupForm.confirmPassword}
                      onChange={(e) => setSignupForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      className="w-full px-4 py-3 rounded-lg border text-sm"
                      style={{ 
                        backgroundColor: '#141822', 
                        borderColor: '#2a2a33',
                        color: '#e8eaf0'
                      }}
                      placeholder="비밀번호를 다시 입력하세요"
                    />
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <button 
                    onClick={handleSignupSubmit}
                    disabled={signupMutation.isPending}
                    className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ 
                      background: 'linear-gradient(180deg, #1f6feb, #1b4fd8)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                    }}
                  >
                    {signupMutation.isPending ? '회원가입 중...' : '회원가입'}
                  </button>
                  <button 
                    onClick={resetSignupModal}
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

          {/* Signup Success Modal */}
          {showSignupSuccess && (
            <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                 style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="rounded-2xl p-8 w-full max-w-md border"
                   style={{ 
                     backgroundColor: 'rgba(22,22,28,0.9)', 
                     borderColor: '#2a2a33',
                     boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                   }}>
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
                       style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}>
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 20L17 27L30 13" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  
                  <h3 className="text-2xl font-bold mb-4" style={{ color: '#e8eaf0' }}>
                    회원가입 완료!
                  </h3>
                  
                  <p className="text-lg mb-2" style={{ color: '#9aa1ad' }}>
                    환영합니다!
                  </p>
                  <p className="mb-8" style={{ color: '#9aa1ad' }}>
                    이제 돌잡이의 모든 기능을 이용하실 수 있습니다.
                  </p>
                  
                  <div className="space-y-3">
                    <button 
                      onClick={() => {
                        setShowSignupSuccess(false);
                        navigate('/login');
                      }}
                      className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap text-white"
                      style={{ 
                        background: 'linear-gradient(180deg, #1f6feb, #1b4fd8)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                      }}
                    >
                      로그인하기
                    </button>
                    <button 
                      onClick={() => setShowSignupSuccess(false)}
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
                      나중에 하기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
