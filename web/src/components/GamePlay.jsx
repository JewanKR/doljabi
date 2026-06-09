/**
 * 🎮 GamePlay 컴포넌트
 * - 진행 중인 게임 페이지 (실시간 WebSocket)
 * - 게임판, 시간 정보, 기보, 플레이어 정보 표시
 */
import { useEffect, useRef, useState } from 'react';
import { SideNav } from './SideNav';
import { GoBoard } from './GoBoard';
import { ClientToServer, ServerToClient, GameType } from '../ts-proto/common';

const formatTime = (seconds) => {
  if (!seconds && seconds !== 0) return '--:--';
  const m = Math.floor(Number(seconds) / 60).toString().padStart(2, '0');
  const s = (Number(seconds) % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

// 비트보드(bigint[]) → {col, row, color}[] 변환 (stride = 보드 크기: 바둑 19, 오목 15)
const decodeBitboard = ({ black = [], white = [] }, size = 19) => {
  const stones = [];
  const decode = (chunks, color) => {
    chunks.forEach((chunk, chunkIdx) => {
      for (let bit = 0; bit < 64; bit++) {
        if ((chunk >> BigInt(bit)) & 1n) {
          const idx = chunkIdx * 64 + bit;
          const col = idx % size;
          const row = Math.floor(idx / size);
          if (row < size) stones.push({ col, row, color });
        }
      }
    });
  };
  decode(black, 'black');
  decode(white, 'white');
  return stones;
};

export const GamePlay = ({ onNavigate, gameType = 'go', currentUser, enterCode, wsRef, initialUsersInfo, initialBlackSec, initialWhiteSec }) => {
  const boardSize = gameType === 'omok' ? 15 : 19;
  const [stones, setStones] = useState([]);
  const [history, setHistory] = useState([]);
  const [usersInfo, setUsersInfo] = useState(initialUsersInfo ?? null);
  const myName = currentUser?.username || currentUser?.id;
  const amBlack = (initialUsersInfo ?? null)?.black?.userName === myName;
  const [myTurn, setMyTurn] = useState(amBlack);
  const [turnColor, setTurnColor] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [blackSec, setBlackSec] = useState(initialBlackSec ?? null);
  const [whiteSec, setWhiteSec] = useState(initialWhiteSec ?? null);
  const [pendingCoord, setPendingCoord] = useState(null);
  const [wsClosed, setWsClosed] = useState(false);
  const [drawOfferPending, setDrawOfferPending] = useState(false); // 상대 무승부 신청 카드 표시 여부
  const stonesRef = useRef([]);
  const historyRef = useRef([]);
  const historyBottomRef = useRef(null);
  const usersInfoRef = useRef(initialUsersInfo ?? null);
  const actualGameTypeRef = useRef(gameType); // 서버 메시지에서 확인된 실제 게임 타입
  const drawHandledRef = useRef(false); // 이번 수(턴)에 무승부 신청 경고창을 이미 띄웠는지
  const lastTurnRef = useRef(null);     // 직전 턴 색 — 턴이 바뀌면 무승부 경고창 다시 허용

  // 새 수 추가 시 기보 내부만 스크롤 (페이지 전체 스크롤 방지)
  useEffect(() => {
    const el = historyBottomRef.current;
    if (!el) return;
    el.parentElement?.scrollTo({ top: el.parentElement.scrollHeight, behavior: 'smooth' });
  }, [history.length]);

  // F5 / 탭 닫기 시 경고
  useEffect(() => {
    if (gameOver) return;
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [gameOver]);

  // 게임 중 내비게이션 차단
  const safeNavigate = (page, ...args) => {
    if (!gameOver && page !== 'game_play' && page !== 'game_waiting') {
      if (!window.confirm('게임이 진행 중입니다. 정말 나가시겠습니까?\n(나가면 기권 처리될 수 있습니다)')) return;
    }
    onNavigate(page, ...args);
  };

  const sendMessage = (payload) => {
    if (wsRef?.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(payload);
    }
  };

  const makePayload = (msg) => ClientToServer.encode(
    actualGameTypeRef.current === 'omok' ? { omok: msg } : { baduk: msg }
  ).finish();

  // 서버 메시지 처리
  useEffect(() => {
    const ws = wsRef?.current;
    if (!ws) return;

    console.log('[GamePlay] WS 핸들러 등록, readyState:', ws.readyState);
    ws.onclose = (e) => {
      console.warn('[WS닫힘] code:', e.code, '| reason:', e.reason);
      setWsClosed(true);
    };
    ws.onerror = (e) => console.error('[WS오류]', e);

    ws.onmessage = (event) => {
      try {
        const msg = ServerToClient.decode(new Uint8Array(event.data));
        const isOmok = msg.gameType === GameType.GAME_TYPE_OMOK;
        actualGameTypeRef.current = isOmok ? 'omok' : 'go';
        const board = isOmok ? msg.omok : msg.baduk;
        // running: 게임 방(true) / 대기실(false) / 업데이트 없음(undefined). 게임 종료 판단엔 쓰지 않음(아래 the_winner 사용).
        console.log('[WS수신] responseType:', msg.responseType, '| running:', msg.running, '| winner:', board?.theWinner, '| hasBaduk:', !!msg.baduk, '| hasOmok:', !!msg.omok, '| turn:', board?.turn, '| hasGameState:', !!board?.gameState, '| stones:', stonesRef.current.length);
        // board 없음(타이머 인터럽트/에러 등) → 무시
        if (!board) return;

        if (board.usersInfo) {
          setUsersInfo(board.usersInfo);
          usersInfoRef.current = board.usersInfo;
        }

        if (board.gameState) {
          const turnVal = board.turn;
          // 턴이 바뀌면(= 한 수 진행) 무승부 신청 카드를 닫고 다시 띄울 수 있도록 초기화
          if (lastTurnRef.current !== null && turnVal !== lastTurnRef.current) {
            drawHandledRef.current = false;
            setDrawOfferPending(false);
          }
          lastTurnRef.current = turnVal;
          setTurnColor(turnVal);
          const info = usersInfoRef.current;
          const isBlack = info?.black?.userName === (currentUser?.username || currentUser?.id);
          setMyTurn(isBlack ? turnVal === 0 : turnVal === 1);

          const gs = board.gameState;
          if (gs.blackTime !== undefined) setBlackSec(Math.floor(Number(gs.blackTime.mainTime) / 1000));
          if (gs.whiteTime !== undefined) setWhiteSec(Math.floor(Number(gs.whiteTime.mainTime) / 1000));
          if (gs.board) {
            const decoded = decodeBitboard(gs.board, isOmok ? 15 : 19);
            const prevSet = new Set(stonesRef.current.map(s => `${s.col},${s.row}`));
            const newStone = decoded.find(s => !prevSet.has(`${s.col},${s.row}`));
            if (newStone) {
              historyRef.current = [...historyRef.current, newStone];
              setHistory(historyRef.current);
            }
            stonesRef.current = decoded;
            setStones(decoded);
          }
        }

        // 무승부 신청 수신: 상대가 신청했고 게임이 진행 중(승자 미정)일 때만, 한 수에 한 번 경고창 출력.
        // (같은 수에 양쪽이 신청하면 서버가 the_winner=무승부(Free)로 종료 처리 → 아래 종료 처리)
        if (board.drawOffer?.userName && board.theWinner === undefined) {
          const offererIsBlack = board.drawOffer.userName.startsWith('Black');
          const info = usersInfoRef.current;
          const iAmBlack = info?.black?.userName === myName;
          if (offererIsBlack !== iAmBlack && !drawHandledRef.current) {
            drawHandledRef.current = true;
            setDrawOfferPending(true);
          }
        }

        // 게임 종료 판단: the_winner 가 채워지면 종료 (흑=0, 백=1, 무승부=Free=2 모두 그대로 수신)
        if (board.theWinner !== undefined) {
          setGameOver(true);
          setWinner(board.theWinner);
        }
      } catch (e) {
        console.error('WS message decode error:', e);
      }
    };
  }, [enterCode, wsRef]);

  // 현재 턴 플레이어 시간 카운트다운
  useEffect(() => {
    if (gameOver) return;
    const interval = setInterval(() => {
      if (turnColor === 0) {
        setBlackSec(prev => prev !== null && prev > 0 ? prev - 1 : prev);
      } else {
        setWhiteSec(prev => prev !== null && prev > 0 ? prev - 1 : prev);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [turnColor, gameOver]);

  const blackTime = formatTime(blackSec);
  const whiteTime = formatTime(whiteSec);

  const handlePlaceStone = () => {
    console.log('[착수시도] myTurn:', myTurn, '| pending:', pendingCoord ? `${pendingCoord.col},${pendingCoord.row}` : null, '| ws:', wsRef?.current?.readyState, '| gameOver:', gameOver);
    if (!pendingCoord) return;
    const size = actualGameTypeRef.current === 'omok' ? 15 : 19;
    const coordInt = pendingCoord.col + pendingCoord.row * size;
    console.log('[착수전송] coord:', coordInt, '| ws:', wsRef?.current?.readyState);
    sendMessage(makePayload({ coordinate: { coordinate: coordInt } }));
    setPendingCoord(null);
  };

  const handleResign = () => {
    if (!window.confirm('정말 기권하시겠습니까?')) return;
    sendMessage(makePayload({ resign: {} }));
  };

  const handleDrawOffer = () => {
    sendMessage(makePayload({ drawOffer: {} }));
  };

  const handleAcceptDraw = () => {
    setDrawOfferPending(false);
    sendMessage(makePayload({ drawOffer: {} }));
  };

  const handleRejectDraw = () => {
    setDrawOfferPending(false);
  };

  const blackName = usersInfo?.black?.userName || 'Kuro_Knight';
  const whiteName = usersInfo?.white?.userName || 'Shiro_Master';

  return (
    <div className="bg-background text-on-surface overflow-hidden">
      <SideNav activeNav="play" onNavigate={safeNavigate} currentUser={currentUser} />

      <main className="md:ml-64 flex flex-col lg:flex-row lg:h-screen pt-14 md:pt-0 lg:overflow-hidden overflow-y-auto">
        {/* Center Board Section */}
        <section className="min-h-[calc(100svh-56px)] lg:min-h-0 flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-surface lg:overflow-auto">
          <div className="w-full max-w-[580px]">
            <GoBoard
              size={boardSize}
              stones={stones}
              className=""
              pending={pendingCoord}
              onIntersectionClick={setPendingCoord}
            />
          </div>

          {/* 게임 제어 버튼 */}
          <div className="mt-4 md:mt-12 flex gap-2 justify-center">
            <button
              onClick={handlePlaceStone}
              disabled={!myTurn || !pendingCoord || gameOver}
              className="px-4 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm flex items-center gap-1 hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-base">play_arrow</span>
              착수
            </button>
            <button
              onClick={handleDrawOffer}
              disabled={gameOver}
              className="px-4 py-2.5 bg-surface-container-low text-on-surface border border-outline-variant rounded-xl font-semibold text-sm hover:bg-surface-container-high transition-colors disabled:opacity-40"
            >
              무승부 신청
            </button>
            <button
              onClick={handleResign}
              disabled={gameOver}
              className="px-4 py-2.5 bg-error-container text-on-error-container rounded-xl font-semibold text-sm hover:opacity-80 transition-opacity disabled:opacity-40"
            >
              기권
            </button>
          </div>

          {drawOfferPending && !gameOver && (
            <div className="mt-4 flex flex-col items-center gap-2 px-4 py-3 bg-surface-container-low border border-outline-variant rounded-xl">
              <p className="text-sm font-semibold text-on-surface">
                상대가 무승부를 신청했습니다
              </p>
              <div className="flex gap-2">
                <button onClick={handleAcceptDraw} className="px-4 py-1.5 bg-primary text-on-primary rounded-lg text-sm font-bold">수락</button>
                <button onClick={handleRejectDraw} className="px-4 py-1.5 bg-surface-container-high text-on-surface rounded-lg text-sm font-bold">거절</button>
              </div>
            </div>
          )}

          {wsClosed && !gameOver && (
            <p className="mt-4 text-sm font-semibold text-error bg-error-container px-4 py-2 rounded-xl">
              서버 연결이 끊겼습니다 (1006). 서버 측 오류일 수 있습니다.
            </p>
          )}
          {gameOver && (
            <div className="mt-4 flex flex-col items-center gap-3">
              {winner !== null && (
                <p className="text-lg font-bold text-primary">
                  {winner === 0 ? '흑 승리!' : winner === 1 ? '백 승리!' : '무승부'}
                </p>
              )}
              <div className="flex gap-2">
                {actualGameTypeRef.current !== 'omok' && (
                  <button
                    onClick={() => onNavigate('ai_analysis', 'go')}
                    className="px-6 py-2.5 bg-surface-container-high text-on-surface border border-outline-variant rounded-xl font-bold text-sm hover:bg-surface-container-highest transition-colors"
                  >
                    AI 분석
                  </button>
                )}
                <button
                  onClick={() => onNavigate('game_lobby', gameType)}
                  className="px-6 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
                >
                  로비로 돌아가기
                </button>
              </div>
            </div>
          )}
        </section>

        {/* 모바일 스크롤 힌트 */}
        <div className="lg:hidden flex flex-col items-center py-2 text-on-surface-variant">
          <span className="material-symbols-outlined text-base animate-bounce">expand_more</span>
          <span className="text-[10px]">스크롤하여 정보 보기</span>
        </div>

        {/* Right Panel: Info & History */}
        <aside className="w-full lg:w-96 flex-shrink-0 bg-surface-container-high p-4 lg:p-6 flex flex-col gap-4 lg:gap-6 lg:overflow-y-auto">
          {/* Player Info Cards */}
          <div className="flex lg:flex-col gap-3">
            {/* Black Player */}
            <div className={`flex-1 p-2 lg:p-5 bg-surface-container-lowest rounded-xl shadow-sm border-l-4 ${turnColor === 0 ? 'border-primary' : 'border-outline-variant'}`}>
              <div className="flex items-center gap-2 mb-1 lg:mb-2">
                <div className="w-7 h-7 lg:w-9 lg:h-9 rounded-full bg-primary flex items-center justify-center text-white font-black text-xs lg:text-sm flex-shrink-0">B</div>
                <div className="min-w-0">
                  <h3 className="font-bold text-on-surface text-sm truncate">{blackName}</h3>
                  {turnColor === 0 && (
                    <span className={`text-[9px] font-bold ${myTurn ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {myTurn ? '내 차례' : '상대 차례'}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xl lg:text-3xl font-mono font-bold text-primary">{blackTime}</span>
            </div>

            {/* White Player */}
            <div className={`flex-1 p-2 lg:p-5 rounded-xl border-l-4 ${turnColor === 1 ? 'bg-surface-container-lowest border-primary shadow-sm' : 'bg-surface-container-low border-outline-variant opacity-80'}`}>
              <div className="flex items-center gap-2 mb-1 lg:mb-2">
                <div className="w-7 h-7 lg:w-9 lg:h-9 rounded-full bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center text-on-surface font-black text-xs lg:text-sm flex-shrink-0">W</div>
                <div className="min-w-0">
                  <h3 className="font-bold text-on-surface text-sm truncate">{whiteName}</h3>
                  {turnColor === 1 && (
                    <span className={`text-[9px] font-bold ${!myTurn ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {!myTurn ? '내 차례' : '상대 차례'}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xl lg:text-3xl font-mono font-bold text-on-surface-variant">{whiteTime}</span>
            </div>
          </div>

          {/* 기보 */}
          <div className="flex flex-col overflow-hidden">
            <div className="flex items-center justify-between mb-4 px-2">
              <h4 className="font-bold text-sm uppercase tracking-widest text-on-surface-variant">기보</h4>
              <span className="text-xs font-mono text-outline">
                {enterCode ? `방 코드: ${enterCode}` : '대기 중'}
              </span>
            </div>
            <div className="overflow-y-auto space-y-px rounded-xl bg-surface-container-low p-2" style={{ maxHeight: '220px' }}>
              {history.length === 0 ? (
                <p className="text-xs text-outline text-center py-4">기보가 없습니다.</p>
              ) : (
                <>
                  {history.map((stone, idx) => (
                    <div key={idx} className="grid grid-cols-3 gap-2 p-3 hover:bg-surface-container-highest transition-colors rounded-lg">
                      <span className="text-xs font-mono text-outline">{String(idx + 1).padStart(2, '0')}</span>
                      <span className="text-sm font-medium">{stone.color === 'black' ? '흑' : '백'}</span>
                      <span className="text-sm font-medium">{`${'ABCDEFGHJKLMNOPQRST'[stone.col]}${boardSize - stone.row}`}</span>
                    </div>
                  ))}
                  <div ref={historyBottomRef} />
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-outline-variant/20 flex justify-between">
            <button className="p-2 hover:bg-surface-container-lowest rounded-lg transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined">chat_bubble</span>
            </button>
            <button className="p-2 hover:bg-surface-container-lowest rounded-lg transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined">volume_up</span>
            </button>
            <button className="p-2 hover:bg-surface-container-lowest rounded-lg transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined">zoom_in</span>
            </button>
            <button className="p-2 hover:bg-surface-container-lowest rounded-lg transition-colors text-on-surface-variant">
              <span className="material-symbols-outlined">more_vert</span>
            </button>
          </div>
        </aside>
      </main>
    </div>
  );
};
