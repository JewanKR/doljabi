/**
 * 🏠 HomeHub 컴포넌트
 * - 홈 페이지 (게임 모드 선택, 최근 게임)
 * - 사용자 통계, 일일 퍼즐, 최근 게임 기록 표시
 */
import { StrictMode } from 'react';
import { SideNav } from './SideNav';

export const HomeHub = ({ onNavigate, currentUser }) => {

  const gameOptions = [
    {
      type: '싱글 플레이',
      icon: 'person',
      goDesc: '다양한 AI 난이도에 맞서 실력을 키워보세요.',
      omokDesc: '컴퓨터를 상대로 패턴 인식 능력을 연습하세요.'
    },
    {
      type: '멀티 플레이',
      icon: 'groups',
      goDesc: '전 세계 고수들과 실시간 대국을 펼쳐보세요.',
      omokDesc: '실력에 맞는 상대와 빠르게 매칭되어 대국하세요.'
    },
    {
      type: 'AI 분석',
      icon: 'psychology',
      goDesc: 'KataGo 신경망 엔진으로 지난 대국을 복기하세요.',
      omokDesc: '금지 수를 감지하고 최적의 승리 경로를 찾아보세요.'
    }
  ];

  return (
    <div className="bg-background text-on-background">
      <SideNav activeNav="home" onNavigate={onNavigate} currentUser={currentUser} />

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen relative bg-surface pt-16 md:pt-10 px-4 md:px-12 pb-12">
        <div>

          {/* 🎮 바둑 게임 옵션 섹션 - 다양한 바둑 게임형식 소개 */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-primary tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded bg-primary text-white flex items-center justify-center text-sm">
                  囲
                </span>
                바둑 (Go/Baduk)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {gameOptions.map((option) => (
                <button
                  key={option.type}
                  onClick={() => {
                    if (option.type === '멀티 플레이') onNavigate('game_lobby', 'go', undefined, false, 'multi');
                    if (option.type === '싱글 플레이') onNavigate('game_lobby', 'go', undefined, false, 'single');
                    if (option.type === 'AI 분석') onNavigate('ai_analysis', 'go');
                  }}
                  className="group flex flex-col p-8 bg-surface-container-low border border-outline-variant rounded-[2rem] hover:bg-primary hover:text-white hover:border-primary transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur group-hover:bg-white/30 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-3xl group-hover:text-white">
                      {option.icon}
                    </span>
                  </div>
                  <h4 className="text-xl font-bold mb-2">{option.type}</h4>
                  <p className="text-sm opacity-70">{option.goDesc}</p>
                </button>
              ))}
            </div>
          </section>

          {/* 🎯 오목 게임 옵션 섹션 - 다양한 오목 게임형식 소개 */}
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-primary tracking-tight flex items-center gap-3">
                <span className="w-8 h-8 rounded bg-secondary text-white flex items-center justify-center text-sm">
                  五
                </span>
                오목 (Omok)
              </h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {gameOptions.filter(o => o.type !== 'AI 분석').map((option) => (
                <button
                  key={option.type}
                  onClick={() => {
                    if (option.type === '멀티 플레이') onNavigate('game_lobby', 'omok', undefined, false, 'multi');
                    if (option.type === '싱글 플레이') onNavigate('game_lobby', 'omok', undefined, false, 'single');
                  }}
                  className="group flex flex-col p-8 bg-surface-container-low border border-outline-variant rounded-[2rem] hover:bg-secondary hover:text-white hover:border-secondary transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur group-hover:bg-white/30 flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-3xl group-hover:text-white">
                      {option.icon}
                    </span>
                  </div>
                  <h4 className="text-xl font-bold mb-2">{option.type}</h4>
                  <p className="text-sm opacity-70">{option.omokDesc}</p>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};
