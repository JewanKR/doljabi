/**
 * 📱 App - 메인 애플리케이션
 * - 페이지 라우팅 (SPA 방식)
 * - 모달 관리 (로그인, 회원가입)
 * - 세션 복원 (앱 최초 로드 시)
 */
import React, { useState, useEffect, useRef } from "react";
import { useSessionCheck } from "./api/endpoints/auth/auth";
import { useGetUserProfileHandler } from "./api/endpoints/user/user";
import { SessionManager } from "./api/axios-instance";

const WS_BASE_URL = `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}`;

import { AiAnalysis } from "./components/AiAnalysis";
import { GameLobby } from "./components/GameLobby";
import { GamePlay } from "./components/GamePlay";
import { GameWaiting } from "./components/GameWaiting";
import { HomeHub } from "./components/HomeHub";
import { LoginModal } from "./components/LoginModal";
import { SignUpModal } from "./components/SignUpModal";
import { SettingsProfile } from "./components/SettingsProfile";
import { ErrorBoundary } from "./components/ErrorBoundary";

function App() {
  const [currentPage, setCurrentPage] = useState("home");
  const [currentGameType, setCurrentGameType] = useState("go");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignUpModal, setShowSignUpModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [theme, setTheme] = useState("light");
  const [enterCode, setEnterCode] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [roomUsersInfo, setRoomUsersInfo] = useState(null);
  const [roomInitTime, setRoomInitTime] = useState({
    black: null,
    white: null,
  });
  const [gameHistory, setGameHistory] = useState([]);
  const wsRef = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const { mutate: fetchProfile } = useGetUserProfileHandler({
    mutation: {
      onSuccess: (data) => {
        if (data.success && data.user) {
          setCurrentUser((prev) => ({
            ...prev,
            username: data.user.username || prev?.username,
            id: data.user.username || prev?.id,
            rating: data.user.rating,
          }));
        }
      },
    },
  });

  const loadProfile = () => {
    const sessionKey = SessionManager.getSessionKey();
    if (sessionKey) fetchProfile({ data: { session_key: sessionKey } });
  };

  // 세션 복원: 앱 로드 시 localStorage에 세션키가 있으면 서버에 검증 요청
  const { mutate: checkSession } = useSessionCheck({
    mutation: {
      onSuccess: () => {
        const sessionKey = SessionManager.getSessionKey();
        if (sessionKey) {
          setCurrentUser({ id: sessionKey });
          loadProfile();
        }
      },
      onError: () => {
        SessionManager.clearSessionKey();
      },
    },
  });

  useEffect(() => {
    const sessionKey = SessionManager.getSessionKey();
    if (sessionKey) {
      checkSession({ data: { session_key: sessionKey } });
    }
  }, []);

  const openWs = (code, gameType) => {
    const sessionKey = SessionManager.getSessionKey();
    if (!code || !sessionKey) return;
    if (wsRef.current && wsRef.current.readyState < 2) wsRef.current.close();
    const ws = new WebSocket(
      `${WS_BASE_URL}/ws/room/${code}/session/${sessionKey}`,
    );
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;
  };

  const closeWs = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const handleNavigate = (page, gameType, code, host = false) => {
    if (page === "login") {
      setShowLoginModal(true);
      return;
    }
    if (page === "signup") {
      setShowSignUpModal(true);
      return;
    }
    if (page === "logout") {
      SessionManager.clearSessionKey();
      setCurrentUser(null);
      closeWs();
      return;
    }
    if (page === "game_waiting") {
      openWs(code, gameType);
    } else if (page !== "game_play") {
      closeWs();
    }
    setCurrentPage(page);
    if (gameType) setCurrentGameType(gameType);
    if (code !== undefined) setEnterCode(code);
    setIsHost(host);
  };

  const renderPage = (onNavigate) => {
    const commonProps = { onNavigate, currentUser };
    switch (currentPage) {
      case "ai_analysis":
        return (
          <AiAnalysis
            {...commonProps}
            gameType={currentGameType}
            history={gameHistory}
          />
        );
      case "game_lobby":
        return <GameLobby {...commonProps} gameType={currentGameType} />;
      case "game_waiting":
        return (
          <GameWaiting
            {...commonProps}
            gameType={currentGameType}
            enterCode={enterCode}
            isHost={isHost}
            wsRef={wsRef}
            onUsersInfo={setRoomUsersInfo}
            onGameTime={setRoomInitTime}
          />
        );
      case "game_play":
        return (
          <GamePlay
            {...commonProps}
            gameType={currentGameType}
            enterCode={enterCode}
            wsRef={wsRef}
            initialUsersInfo={roomUsersInfo}
            initialBlackSec={roomInitTime.black}
            initialWhiteSec={roomInitTime.white}
            onSaveHistory={setGameHistory}
          />
        );
      case "home":
        return <HomeHub {...commonProps} />;
      case "settings":
        return (
          <SettingsProfile
            {...commonProps}
            theme={theme}
            setTheme={setTheme}
            onUsernameChange={(username) =>
              setCurrentUser((prev) => ({ ...prev, username }))
            }
          />
        );
      default:
        return <HomeHub {...commonProps} />;
    }
  };

  return (
    <div className="App min-h-screen bg-background" key="app">
      <ErrorBoundary key={currentPage}>
        {renderPage(handleNavigate)}
      </ErrorBoundary>

      {showLoginModal && (
        <LoginModal
          isOpen={true}
          onClose={() => setShowLoginModal(false)}
          onLogin={(user) => {
            setCurrentUser(user);
            setShowLoginModal(false);
            loadProfile();
          }}
          onSignupClick={() => {
            setShowLoginModal(false);
            setShowSignUpModal(true);
          }}
        />
      )}
      {showSignUpModal && (
        <SignUpModal
          isOpen={true}
          onClose={() => setShowSignUpModal(false)}
          onLoginClick={() => {
            setShowSignUpModal(false);
            setShowLoginModal(true);
          }}
        />
      )}
    </div>
  );
}

export default App;
