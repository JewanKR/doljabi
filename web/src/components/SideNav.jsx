/**
 * 🎨 SideNav 컴포넌트
 * - 왼쪽 사이드바 (로고, 네비게이션, 프로필)
 * - 소형 화면에서 접기/열기 지원
 * @param {string} activeNav - 현재 활성화된 메뉴 (home, play, ai_analysis, settings)
 */
import React, { useState } from 'react';

export const SideNav = ({ activeNav = 'home', onNavigate, currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    { id: 'home', icon: 'home', label: '홈' },
    { id: 'play', icon: 'sports_esports', label: '플레이' },
    { id: 'ai_analysis', icon: 'psychology', label: 'AI 분석' },
    { id: 'settings', icon: 'settings', label: '설정' }
  ];

  const handleNavClick = (id) => {
    setIsOpen(false);
    if (!onNavigate) return;
    if (id === 'home') onNavigate('home');
    if (id === 'play') onNavigate('game_lobby');
    if (id === 'ai_analysis') onNavigate('ai_analysis', 'go');
    if (id === 'settings') onNavigate('settings');
  };

  return (
    <>
      {/* 햄버거 버튼 - 소형 화면에서만 표시 */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 w-10 h-10 bg-surface-container-high rounded-xl flex items-center justify-center shadow-md"
        aria-label="메뉴 열기"
      >
        <span className="material-symbols-outlined text-on-surface">menu</span>
      </button>

      {/* 오버레이 - 소형 화면에서 사이드바 열릴 때 */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <aside
        className={`fixed left-0 top-0 h-full w-64 z-50 flex flex-col p-6 transition-transform duration-300 bg-surface-container-high overflow-y-auto
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0`}
      >
        {/* Top Section */}
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-lg flex-shrink-0">
                <span className="material-symbols-outlined text-on-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  extension
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-on-surface tracking-tight">돌잡이</span>
                <span className="text-[10px] uppercase tracking-widest text-on-surface-variant">바둑 & 오목</span>
              </div>
            </div>
            {/* 닫기 버튼 - 소형 화면에서만 */}
            <button
              onClick={() => setIsOpen(false)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-low"
              aria-label="메뉴 닫기"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-lg">close</span>
            </button>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                  activeNav === item.id
                    ? 'text-on-surface font-bold border-r-4 border-primary bg-surface-container-low'
                    : 'text-on-surface-variant font-medium hover:bg-surface-container-low'
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={activeNav === item.id ? { fontVariationSettings: "'FILL' 1" } : {}}
                >
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="space-y-4 pt-6 mt-auto border-t border-outline-variant">
          {currentUser && (
            <button
              onClick={() => { setIsOpen(false); onNavigate && onNavigate('game_lobby'); }}
              className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:opacity-90"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              <span>방 만들기</span>
            </button>
          )}
          {currentUser ? (
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary font-bold text-sm flex-shrink-0">
                {(currentUser.username || currentUser.id).charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-on-surface truncate">{currentUser.username || currentUser.id}</span>
                <button
                  onClick={() => { setIsOpen(false); onNavigate && onNavigate('logout'); }}
                  className="text-[11px] text-left text-red-400 hover:text-red-600 font-medium transition-colors"
                >
                  로그아웃
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => { setIsOpen(false); onNavigate && onNavigate('login'); }}
                className="w-full bg-primary text-on-primary py-3 rounded-xl font-bold transition-transform active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                <span className="material-symbols-outlined text-lg">login</span>
                <span>로그인</span>
              </button>
              <button
                onClick={() => { setIsOpen(false); onNavigate && onNavigate('signup'); }}
                className="w-full bg-surface-container-lowest text-primary border-2 border-primary py-3 rounded-xl font-bold transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">person_add</span>
                <span>회원가입</span>
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
