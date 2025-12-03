// src/pages/Home/Home.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLogin, useSignup } from '../../api/endpoints/auth/auth';
import { SessionManager } from '../../api/axios-instance';
import { HomeView, UserInfo } from './HomeView';

// 로그인/회원가입 응답 타입(필요에 맞게 수정 가능)
interface LoginResponse {
  success: boolean;
  session_key?: string;
  message?: string;
  user?: {
    login_id: string;
    username: string;
    rating?: number;
  };
}

interface SignupResponse {
  success: boolean;
  message?: string;
}

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();

  // 탭
  const [activeTab, setActiveTab] = useState<'omok' | 'baduk'>('baduk');

  // 로그인 관련 상태
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const isLoggedIn = !!userInfo;
  const [showUserMenu, setShowUserMenu] = useState(false);

  // 로그인 모달 상태
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginForm, setLoginForm] = useState({
    login_id: '',
    password: '',
  });
  const [loginError, setLoginError] = useState('');

  // 회원가입 모달 상태
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [signupForm, setSignupForm] = useState({
    login_id: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [signupError, setSignupError] = useState('');

  // 회원가입 성공 모달
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);

  // 관리자 모달 & 이스터에그
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [logoClickCount, setLogoClickCount] = useState(0);
  const [logoClickTimer, setLogoClickTimer] = useState<number | null>(null);

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

  // 마운트 시 로컬스토리지에서 유저 정보 복원
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('userInfo');
      if (storedUser) {
        const parsed: UserInfo = JSON.parse(storedUser);
        setUserInfo(parsed);
      }
    } catch (e) {
      console.error('Failed to parse userInfo from localStorage:', e);
      localStorage.removeItem('userInfo');
    }
  }, []);

  // 로그인 처리
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
      const result = (await loginMutation.mutateAsync({
        data: {
          login_id: loginForm.login_id,
          password: loginForm.password,
        },
      })) as LoginResponse;

      if (result.success && result.session_key) {
        // 세션키 저장
        SessionManager.setSessionKey(result.session_key);

        // 응답에 유저 정보가 있다면 사용, 없다면 폼 기반으로 기본값 구성
        const userFromResponse = result.user || {
          login_id: loginForm.login_id,
          username: loginForm.login_id,
          rating: 1000,
        };

        const newUser: UserInfo = {
          username: userFromResponse.login_id,
          nickname: userFromResponse.username,
          rating: userFromResponse.rating ?? 1000,
        };

        setUserInfo(newUser);
        localStorage.setItem('userInfo', JSON.stringify(newUser));

        // 모달 닫고 초기화
        setShowLoginModal(false);
        setLoginForm({ login_id: '', password: '' });
        navigate('/');
      } else {
        setLoginError(result.message || '로그인에 실패했습니다.');
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        '로그인 처리 중 오류가 발생했습니다.';
      setLoginError(errorMessage);
    }
  };

  // 회원가입 처리
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
      const result = (await signupMutation.mutateAsync({
        data: {
          login_id: signupForm.login_id,
          username: signupForm.username,
          password: signupForm.password,
        },
      })) as SignupResponse;

      if (result.success) {
        setShowSignupModal(false);
        setShowSignupSuccess(true);
        setSignupForm({
          login_id: '',
          username: '',
          password: '',
          confirmPassword: '',
        });
        navigate('/');
      } else {
        setSignupError(result.message || '회원가입에 실패했습니다.');
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.message ||
        error?.message ||
        '회원가입 처리 중 오류가 발생했습니다.';
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
    setSignupForm({
      login_id: '',
      username: '',
      password: '',
      confirmPassword: '',
    });
    setSignupError('');
    navigate('/');
  };

  // 로그아웃
  const handleLogout = () => {
    setUserInfo(null);
    setShowUserMenu(false);
    localStorage.removeItem('userInfo');
    // 세션키도 제거하고 싶다면:
    // SessionManager.clearSessionKey?.();
  };

  // 로고 3번 클릭 시 관리자 모달 열기
  const handleLogoClick = () => {
    if (logoClickTimer !== null) {
      window.clearTimeout(logoClickTimer);
    }

    const newCount = logoClickCount + 1;
    setLogoClickCount(newCount);

    if (newCount === 3) {
      setShowAdminModal(true);
      setLogoClickCount(0);
      setLogoClickTimer(null);
    } else {
      const timer = window.setTimeout(() => {
        setLogoClickCount(0);
      }, 1000);
      setLogoClickTimer(timer);
    }
  };

  // 관리자 로그인 (임시 로직)
  const handleAdminLogin = () => {
    setAdminError('');

    if (adminPassword.trim()) {
      localStorage.setItem('isAdmin', 'true');
      setShowAdminModal(false);
      setAdminPassword('');
      navigate('/admin');
    } else {
      setAdminError('비밀번호를 입력해주세요.');
    }
  };

  const handleCloseAdminModal = () => {
    setShowAdminModal(false);
    setAdminPassword('');
    setAdminError('');
  };

  // 게임 이동 핸들러
  const handleNavigateQuickMatch = () => {
    navigate(`/${activeTab}/quick-match`);
  };

  const handleNavigateRankedMatch = () => {
    navigate(`/${activeTab}/ranked-match`);
  };

  const handleNavigateCreateRoom = () => {
    navigate(`/${activeTab}/create-room`);
  };

  const handleNavigateJoinRoom = () => {
    navigate(`/${activeTab}/join-room`);
  };

  return (
    <HomeView
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      isLoggedIn={isLoggedIn}
      userInfo={userInfo}
      showUserMenu={showUserMenu}
      onToggleUserMenu={() => setShowUserMenu((prev) => !prev)}
      onGoProfile={() => {
        navigate('/profile');
        setShowUserMenu(false);
      }}
      onLogout={handleLogout}
      onLogoClick={handleLogoClick}
      onOpenLoginModal={() => {
        setShowLoginModal(true);
        navigate('/login');
      }}
      onOpenSignupModal={() => {
        setShowSignupModal(true);
        navigate('/signup');
      }}
      showLoginModal={showLoginModal}
      loginForm={loginForm}
      loginError={loginError}
      onChangeLoginForm={(field, value) =>
        setLoginForm((prev) => ({ ...prev, [field]: value }))
      }
      onSubmitLogin={handleLoginSubmit}
      onCloseLoginModal={resetLoginModal}
      showSignupModal={showSignupModal}
      signupForm={signupForm}
      signupError={signupError}
      onChangeSignupForm={(field, value) =>
        setSignupForm((prev) => ({ ...prev, [field]: value }))
      }
      onSubmitSignup={handleSignupSubmit}
      onCloseSignupModal={resetSignupModal}
      showSignupSuccess={showSignupSuccess}
      onGoLoginFromSignupSuccess={() => {
        setShowSignupSuccess(false);
        setShowLoginModal(true);
        navigate('/login');
      }}
      onCloseSignupSuccess={() => setShowSignupSuccess(false)}
      onNavigateQuickMatch={handleNavigateQuickMatch}
      onNavigateRankedMatch={handleNavigateRankedMatch}
      onNavigateCreateRoom={handleNavigateCreateRoom}
      onNavigateJoinRoom={handleNavigateJoinRoom}
      showAdminModal={showAdminModal}
      adminPassword={adminPassword}
      adminError={adminError}
      onChangeAdminPassword={setAdminPassword}
      onSubmitAdminLogin={handleAdminLogin}
      onCloseAdminModal={handleCloseAdminModal}
    />
  );
}
