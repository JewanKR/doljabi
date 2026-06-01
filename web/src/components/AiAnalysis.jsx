import { useState } from 'react';
import { SideNav } from './SideNav';
import { GoBoard } from './GoBoard';
import { replay } from '../utils/goRules';
import { historyToSgf, downloadSgf } from '../utils/sgf';

const COLS_LABEL = 'ABCDEFGHJKLMNOPQRST';

export const AiAnalysis = ({ onNavigate, gameType = 'go', currentUser, history = [] }) => {
  const [step, setStep] = useState(history.length);
  const size = gameType === 'omok' ? 15 : 19;

  // 현재 step까지의 판 모양 (바둑은 따냄 적용, 오목은 단순 누적)
  const stones = replay(history, step, size, gameType);
  const sgf = history.length > 0 ? historyToSgf(history, size) : null;

  const handleDownload = () => {
    if (!sgf) return;
    downloadSgf(sgf, `game_${new Date().toISOString().slice(0, 10)}.sgf`);
  };

  return (
    <div className="bg-background text-on-surface overflow-hidden">
      <SideNav activeNav="ai_analysis" onNavigate={onNavigate} currentUser={currentUser} />

      <main className="md:ml-64 min-h-screen flex flex-col lg:flex-row pt-14 md:pt-0">
        {/* 보드 */}
        <div className="flex-grow flex flex-col items-center bg-surface-container-lowest rounded-3xl p-6 m-6 gap-6">
          <div className="w-full max-w-[580px]">
            {history.length === 0 ? (
              <div className="w-full aspect-square flex items-center justify-center text-sm text-on-surface-variant">
                게임 기록이 없습니다. 게임을 마친 후 AI 분석을 이용해주세요.
              </div>
            ) : (
              <GoBoard size={size} stones={stones} />
            )}
          </div>

          {/* 복기 컨트롤 */}
          <div className="flex gap-4 flex-wrap justify-center items-center">
            <div className="flex bg-surface-container rounded-xl p-1 shadow-sm">
              <button onClick={() => setStep(0)} disabled={step === 0}
                className="p-2 hover:bg-surface-container-high rounded-lg transition-colors disabled:opacity-30">
                <span className="material-symbols-outlined">first_page</span>
              </button>
              <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
                className="p-2 hover:bg-surface-container-high rounded-lg transition-colors disabled:opacity-30">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <span className="px-4 flex items-center text-sm font-mono font-bold">
                {step} / {history.length}
              </span>
              <button onClick={() => setStep(s => Math.min(history.length, s + 1))} disabled={step === history.length}
                className="p-2 hover:bg-surface-container-high rounded-lg transition-colors disabled:opacity-30">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
              <button onClick={() => setStep(history.length)} disabled={step === history.length}
                className="p-2 hover:bg-surface-container-high rounded-lg transition-colors disabled:opacity-30">
                <span className="material-symbols-outlined">last_page</span>
              </button>
            </div>

            <button onClick={handleDownload} disabled={!sgf}
              className="px-4 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40">
              <span className="material-symbols-outlined text-base">download</span>
              SGF 다운로드
            </button>
          </div>
        </div>

        {/* 기보 패널 */}
        <div className="w-full lg:w-[380px] flex flex-col gap-6 lg:mt-6 px-6 pb-6">
          <div className="flex-grow bg-surface-container-low rounded-3xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-on-surface">기보</h2>
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-full">
                총 {history.length}수
              </span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-px" style={{ maxHeight: '400px' }}>
              {history.length === 0 ? (
                <p className="text-xs text-outline text-center py-4">기보가 없습니다.</p>
              ) : (
                history.map((stone, idx) => (
                  <button key={idx} onClick={() => setStep(idx + 1)}
                    className={`w-full grid grid-cols-3 gap-2 p-2.5 rounded-lg text-left transition-colors ${
                      step === idx + 1
                        ? 'bg-primary/15 text-primary'
                        : 'hover:bg-surface-container-high text-on-surface'
                    }`}>
                    <span className="text-xs font-mono text-outline">{String(idx + 1).padStart(2, '0')}</span>
                    <span className="text-sm font-medium">{stone.color === 'black' ? '흑' : '백'}</span>
                    <span className="text-sm font-medium">{COLS_LABEL[stone.col]}{size - stone.row}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
