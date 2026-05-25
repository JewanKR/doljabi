import { useEffect, useRef, useState } from 'react';
import { SideNav } from './SideNav';
import { historyToSgf, downloadSgf } from '../utils/sgf';

const COLS_LABEL = 'ABCDEFGHJKLMNOPQRST';

export const AiAnalysis = ({ onNavigate, gameType = 'go', currentUser, history = [] }) => {
  const [step, setStep] = useState(history.length);
  const [svgContent, setSvgContent] = useState('');
  const [wasmReady, setWasmReady] = useState(false);
  const renderSgfRef = useRef(null);
  const size = gameType === 'omok' ? 15 : 19;

  // WASM 초기화
  useEffect(() => {
    let cancelled = false;
    import('../demo-wasm/pkg/sgf_render.js').then(async (mod) => {
      await mod.default();
      mod._start();
      if (!cancelled) {
        renderSgfRef.current = mod.renderSgf;
        setWasmReady(true);
      }
    }).catch(console.error);
    return () => { cancelled = true; };
  }, []);

  // step 또는 WASM 준비 시 SVG 렌더링
  useEffect(() => {
    if (!wasmReady || !renderSgfRef.current || history.length === 0) return;
    try {
      const partial = history.slice(0, step);
      const sgf = historyToSgf(partial, size);
      let svg = renderSgfRef.current(sgf, {});
      console.log('[SGF SVG 원본 태그]', svg.slice(0, 200));
      // 고정 width/height 제거 후 100%로 교체해 컨테이너에 맞게 확장
      svg = svg.replace(/<svg([^>]*)width="[^"]*"/, '<svg$1width="100%"');
      svg = svg.replace(/<svg([^>]*)height="[^"]*"/, '<svg$1height="100%"');
      // viewBox 없으면 추가 (스케일 기준점)
      if (!svg.includes('viewBox')) {
        svg = svg.replace('<svg', '<svg viewBox="0 0 800 800"');
      }
      setSvgContent(svg);
    } catch (e) {
      console.error('SGF 렌더링 오류:', e);
    }
  }, [step, wasmReady, history, size]);

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
          <div className="w-full max-w-[580px]" style={{ aspectRatio: '1 / 1' }}>
            {history.length === 0 ? (
              <div className="w-full h-full flex items-center justify-center text-sm text-on-surface-variant">
                게임 기록이 없습니다. 게임을 마친 후 AI 분석을 이용해주세요.
              </div>
            ) : svgContent ? (
              <div
                className="w-full h-full overflow-hidden"
                dangerouslySetInnerHTML={{ __html: svgContent }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm text-on-surface-variant">
                렌더링 중...
              </div>
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
