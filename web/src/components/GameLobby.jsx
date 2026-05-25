/**
 * 🏛️ GameLobby 컴포넌트
 * - 게임 찾기 및 방 생성 페이지
 * - 게임 타입 선택, 모드 선택, 시간 설정, 방 코드 입력
 */
import React, { useState } from 'react';
import { SideNav } from './SideNav';
import { useCreateRoomRequest } from '../api/endpoints/default/default';
import { SessionManager } from '../api/axios-instance';

export const GameLobby = ({ onNavigate, gameType = 'go', currentUser }) => {
  const [selectedGameType, setSelectedGameType] = useState(gameType);
  const [selectedMode, setSelectedMode] = useState('multi');
  const [mainTime, setMainTime] = useState(30);
  const [fischerTime, setFischerTime] = useState(15);
  const [byoYomi, setByoYomi] = useState(30);
  const [count, setCount] = useState(5);
  const [errorMsg, setErrorMsg] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');

  const { mutate: createRoom, isPending } = useCreateRoomRequest({
    mutation: {
      onSuccess: (data) => {
        onNavigate && onNavigate('game_waiting', selectedGameType, data.enter_code, true);
      },
      onError: () => {
        setErrorMsg('방 생성에 실패했습니다. 다시 시도해주세요.');
      },
    },
  });

  const handleJoinRoom = () => {
    setJoinError('');
    const sessionKey = SessionManager.getSessionKey();
    if (!sessionKey) { onNavigate && onNavigate('login'); return; }
    if (!joinCode) { setJoinError('방 코드를 입력해주세요.'); return; }
    onNavigate && onNavigate('game_waiting', selectedGameType, Number(joinCode));
  };

  const handleCreateRoom = () => {
    setErrorMsg('');
    const sessionKey = SessionManager.getSessionKey();
    if (!sessionKey) {
      onNavigate && onNavigate('login');
      return;
    }
    console.log('[방생성] main_time(ms):', mainTime * 60 * 1000, '| fischer_time(ms):', fischerTime * 1000, '| overtime(ms):', byoYomi * 1000, '| count:', count);
    createRoom({
      data: {
        game_type: selectedGameType === 'go' ? 'baduk' : 'omok',
        game_config: {
          main_time: mainTime * 60 * 1000,
          fischer_time: fischerTime * 1000,
          overtime: byoYomi * 1000,
          remaining_overtime: count,
        },
      },
    });
  };

  return (
    <div className="bg-background font-body text-on-background min-h-screen">
      <SideNav activeNav="play" onNavigate={onNavigate} currentUser={currentUser} />

      {/* Main Content Canvas */}
      <main className="md:ml-64 min-h-screen flex flex-col lg:flex-row pt-14 md:pt-0">
        {/* Left: Game Board Section */}
        <section className="flex-grow p-8 flex flex-col">
          <div className="mb-8">
            <h2 className="text-3xl font-headline font-bold text-on-surface tracking-tight">방 생성</h2>
          </div>

          {/* Board Preview */}
          <div className="flex-grow bg-surface-container-low rounded-3xl overflow-y-auto flex items-center justify-center p-4">
            <div className="w-full max-w-2xl px-4 py-6 sm:p-12 bg-surface-container-lowest/70 backdrop-blur-2xl rounded-[2rem] text-center">
              <span className="inline-block px-3 py-1 bg-tertiary-container text-on-tertiary-container rounded-full text-[10px] font-bold uppercase tracking-[0.2em] mb-4">
                게임 보드 미리보기
              </span>
              <div
                className="aspect-square w-full max-w-[180px] sm:max-w-[256px] mx-auto mb-4 sm:mb-8 rounded-xl shadow-xl flex items-center justify-center"
                style={{ background: `rgba(255, 220, 195, 0.9)` }}
              >
                <div className="w-3 h-3 bg-primary/20 rounded-full"></div>
              </div>
              <h3 className="text-lg sm:text-2xl font-headline font-semibold text-on-surface">대국을 시작하세요</h3>
              <p className="text-sm text-on-surface-variant mt-2 sm:mt-3 max-w-sm mx-auto">
                오른쪽에서 방을 만들거나 방 코드를 입력해 참가하세요.
              </p>
            </div>
          </div>
        </section>

        {/* Right Panel: Management */}
        <aside className="w-full lg:w-96 bg-surface-container flex flex-col p-8 gap-8 overflow-y-auto">
          {/* Create Room Section */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary tracking-tight">방 만들기</h3>
              <span className="material-symbols-outlined text-primary/40">add_circle</span>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-2xl flex flex-col gap-6">
              {/* 🎮 게임 모드 토글 (싱글 <-> 멀티) */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">모드</p>
                <div className="flex p-1 bg-surface-container-low rounded-xl">
                  <button
                    onClick={() => setSelectedMode('single')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      selectedMode === 'single'
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    싱글 플레이
                  </button>
                  <button
                    onClick={() => setSelectedMode('multi')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      selectedMode === 'multi'
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    멀티 플레이
                  </button>
                </div>
              </div>

              {/* 🎮 게임 타입 토글 (바둑 <-> 오목) */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">게임</p>
                <div className="flex p-1 bg-surface-container-low rounded-xl">
                  <button
                    onClick={() => setSelectedGameType('go')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      selectedGameType === 'go'
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    바둑
                  </button>
                  <button
                    onClick={() => setSelectedGameType('omok')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      selectedGameType === 'omok'
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    오목
                  </button>
                </div>
              </div>

              {/* ⏱️ 시간 설정 슬라이더 */}
              <div className="flex flex-col gap-5">
                {[
                  { label: '메인 시간', value: mainTime, onChange: setMainTime, unit: '분', min: 1, max: 60 },
                  { label: '피셔 시간', value: fischerTime, onChange: setFischerTime, unit: '초', min: 0, max: 60 },
                  { label: '초읽기', value: byoYomi, onChange: setByoYomi, unit: '초', min: 10, max: 300 },
                  { label: '횟수', value: count, onChange: setCount, unit: '', min: 1, max: 10 }
                ].map((slider) => (
                  <div key={slider.label} className="space-y-3">
                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                      <span>{slider.label}</span>
                      <span className="text-primary">
                        {slider.value} {slider.unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      value={slider.value}
                      min={slider.min}
                      max={slider.max}
                      onChange={(e) => slider.onChange(Number(e.target.value))}
                      className="w-full accent-primary"
                    />
                  </div>
                ))}
              </div>

              {selectedMode === 'single' && (
                <div className="flex items-center gap-2 p-3 bg-tertiary-container/30 rounded-xl">
                  <span className="material-symbols-outlined text-sm text-on-tertiary-container">smart_toy</span>
                  <p className="text-xs text-on-tertiary-container font-medium">AI 대전은 준비 중입니다.</p>
                </div>
              )}
              {errorMsg && <p className="text-xs text-error font-medium">{errorMsg}</p>}
              <button
                onClick={handleCreateRoom}
                disabled={isPending || selectedMode === 'single'}
                className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold text-sm tracking-tight shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60"
              >
                {isPending ? '생성 중...' : '방 생성하기'}
              </button>
            </div>
          </div>

          {/* Join Room Section */}
          <div className="flex flex-col gap-6 mt-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary tracking-tight">방 참가</h3>
              <span className="material-symbols-outlined text-primary/40">key</span>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-2xl flex flex-col gap-4">
              <div className="relative">
                <input
                  placeholder="방 코드 입력"
                  type="number"
                  value={joinCode}
                  onChange={(e) => { setJoinCode(e.target.value); setJoinError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                  className="w-full bg-surface-container-low border-none rounded-xl py-4 px-5 text-sm font-medium focus:ring-2 focus:ring-primary/10"
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-outline-variant text-sm">
                  input
                </span>
              </div>
              {joinError && <p className="text-xs text-error font-medium">{joinError}</p>}
              <button
                onClick={handleJoinRoom}
                className="w-full py-4 bg-surface-container-high text-primary rounded-xl font-bold text-sm tracking-tight hover:bg-surface-container-highest transition-colors active:scale-[0.98]"
              >
                방 참가하기
              </button>
            </div>
          </div>

        </aside>
      </main>
    </div>
  );
};
