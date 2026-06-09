import React, { useState } from 'react';
import { SideNav } from './SideNav';
import { useCreateRoomRequest } from '../api/endpoints/default/default';
import { SessionManager } from '../api/axios-instance';

// msFactor: 화면 단위 → 서버 ms 변환 계수 (분=60000, 초=1000, 횟수=1)
// apiKey: game_config로 전송할 때의 필드명
const GAME_TIME_CONFIG = {
  go: [
    { key: 'mainTime', apiKey: 'main_time', label: '메인 시간', unit: '분', min: 0, max: 480, defaultVal: 120, msFactor: 60000 },
    { key: 'fischerTime', apiKey: 'fischer_time', label: '피셔 시간', unit: '초', min: 0, max: 600, defaultVal: 0, msFactor: 1000 },
    { key: 'byoYomi', apiKey: 'overtime', label: '초읽기', unit: '초', min: 0, max: 600, defaultVal: 60, msFactor: 1000 },
    { key: 'count', apiKey: 'remaining_overtime', label: '횟수', unit: '회', min: 1, max: 10, defaultVal: 3, msFactor: 1 },
  ],
  omok: [
    { key: 'mainTime', apiKey: 'main_time', label: '메인 시간', unit: '초', min: 0, max: 7200, defaultVal: 300, msFactor: 1000 },
    { key: 'fischerTime', apiKey: 'fischer_time', label: '피셔 시간', unit: '초', min: 0, max: 600, defaultVal: 0, msFactor: 1000 },
    { key: 'byoYomi', apiKey: 'overtime', label: '초읽기', unit: '초', min: 0, max: 600, defaultVal: 15, msFactor: 1000 },
    { key: 'count', apiKey: 'remaining_overtime', label: '횟수', unit: '회', min: 1, max: 10, defaultVal: 3, msFactor: 1 },
  ],
};

const getConfig = (gt) => GAME_TIME_CONFIG[gt === 'go' ? 'go' : 'omok'];

const getDefaults = (gt) => {
  const defaults = {};
  getConfig(gt).forEach(c => { defaults[c.key] = c.defaultVal; });
  return defaults;
};

// config를 순회해 서버 전송용 game_config 생성 (단위 변환/필드 매핑을 데이터 기반으로 처리)
const buildGameConfig = (gt, settings) => {
  const gameConfig = {};
  getConfig(gt).forEach(c => { gameConfig[c.apiKey] = settings[c.key] * c.msFactor; });
  return gameConfig;
};

export const GameLobby = ({ onNavigate, gameType = 'go', mode = 'multi', currentUser }) => {
  const [selectedGameType, setSelectedGameType] = useState(gameType);
  const [selectedMode, setSelectedMode] = useState(mode);
  const [timeSettings, setTimeSettings] = useState(() => getDefaults(gameType));
  // 숫자 입력 타이핑 중 임시 문자열(필드 비우기 등). 확정 시 timeSettings로 반영하고 비움.
  const [drafts, setDrafts] = useState({});
  const [errorMsg, setErrorMsg] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');

  // 게임 타입 전환 시 해당 타입의 기본 시간 설정으로 초기화 (effect 대신 핸들러에서 처리)
  const handleSelectGameType = (gt) => {
    setSelectedGameType(gt);
    setTimeSettings(getDefaults(gt));
    setDrafts({});
  };

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
    if (!sessionKey) { onNavigate && onNavigate('login'); return; }
    const gameConfig = buildGameConfig(selectedGameType, timeSettings);
    console.log('[방생성] game_config:', gameConfig);
    createRoom({
      data: {
        game_type: selectedGameType === 'go' ? 'baduk' : 'omok',
        game_config: gameConfig,
      },
    });
  };

  const clamp = (num, min, max) => Math.min(max, Math.max(min, num));

  const clearDraft = (key) => setDrafts(prev => {
    if (!(key in prev)) return prev;
    const { [key]: _removed, ...rest } = prev;
    return rest;
  });

  // 숫자 입력: 타이핑 그대로 draft에 보관(빈 값 허용), 파싱 가능하면 슬라이더도 즉시 따라가도록 반영
  const handleNumberChange = (key, raw, min, max) => {
    setDrafts(prev => ({ ...prev, [key]: raw }));
    if (raw === '') return;
    const num = Number(raw);
    if (!isNaN(num)) setTimeSettings(prev => ({ ...prev, [key]: clamp(num, min, max) }));
  };

  // 입력 확정(blur): 빈 값/유효하지 않으면 기본값으로, 그 외엔 clamp 후 draft 제거
  const commitNumber = (key, min, max, defaultVal) => {
    const raw = drafts[key];
    if (raw !== undefined) {
      const num = raw === '' ? defaultVal : Number(raw);
      setTimeSettings(prev => ({ ...prev, [key]: clamp(isNaN(num) ? defaultVal : num, min, max) }));
    }
    clearDraft(key);
  };

  // 슬라이더: 항상 숫자값이므로 바로 반영하고, 해당 필드의 draft는 제거해 입력칸과 동기화
  const handleSliderChange = (key, raw, min, max) => {
    clearDraft(key);
    setTimeSettings(prev => ({ ...prev, [key]: clamp(Number(raw), min, max) }));
  };

  const currentConfig = getConfig(selectedGameType);

  return (
    <div className="bg-background font-body text-on-background min-h-screen">
      <SideNav activeNav="play" onNavigate={onNavigate} currentUser={currentUser} />

      <main className="md:ml-64 min-h-screen flex flex-col lg:flex-row pt-14 md:pt-0">
        {/* Left: Board Preview */}
        <section className="flex-grow p-8 flex flex-col">
          <div className="mb-8">
            <h2 className="text-3xl font-headline font-bold text-on-surface tracking-tight">방 생성</h2>
          </div>
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

        {/* Right Panel */}
        <aside className="w-full lg:w-96 bg-surface-container flex flex-col p-8 gap-8 overflow-y-auto">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-primary tracking-tight">방 만들기</h3>
              <span className="material-symbols-outlined text-primary/40">add_circle</span>
            </div>

            <div className="bg-surface-container-lowest p-6 rounded-2xl flex flex-col gap-6">
              {/* 모드 토글 */}
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

              {/* 게임 타입 토글 */}
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant mb-2">게임</p>
                <div className="flex p-1 bg-surface-container-low rounded-xl">
                  <button
                    onClick={() => handleSelectGameType('go')}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      selectedGameType === 'go'
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface-variant hover:bg-surface-container-high'
                    }`}
                  >
                    바둑
                  </button>
                  <button
                    onClick={() => handleSelectGameType('omok')}
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

              {/* 시간 설정 */}
              <div className="flex flex-col gap-5">
                {currentConfig.map((slider) => (
                  <div key={slider.key} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">
                        {slider.label}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          value={drafts[slider.key] ?? timeSettings[slider.key]}
                          min={slider.min}
                          max={slider.max}
                          onChange={(e) => handleNumberChange(slider.key, e.target.value, slider.min, slider.max)}
                          onBlur={() => commitNumber(slider.key, slider.min, slider.max, slider.defaultVal)}
                          className="w-20 text-right text-primary bg-surface-container-low rounded-lg px-2 py-1 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                        <span className="text-[11px] font-bold text-primary w-4">{slider.unit}</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      value={timeSettings[slider.key]}
                      min={slider.min}
                      max={slider.max}
                      onChange={(e) => handleSliderChange(slider.key, e.target.value, slider.min, slider.max)}
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

          {/* Join Room */}
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
