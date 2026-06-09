import { useEffect, useState } from 'react';
import { SideNav } from './SideNav';
import { GoBoard } from './GoBoard';
import { replay } from '../utils/goRules';
import { parseSgf, downloadSgf } from '../utils/sgf';
import {
  createTree,
  treeFromMoves,
  movesFromRoot,
  nodesFromRoot,
  nextColor,
  play,
  undo,
  redo,
  toStart,
  toEnd,
  goTo,
} from '../utils/gameTree';
import { useKataGo } from '../katago/useKataGo';
import { colRowToGtp, gtpToColRow, pvToStones } from '../katago/historyToMoves';
import { evalColor } from '../katago/evalColor';
import { getMyGames, getGameSgf } from '../api/endpoints/game/game';
import { SessionManager } from '../api/axios-instance';

const COLS_LABEL = 'ABCDEFGHJKLMNOPQRST';

const coordLabel = (mv, size) =>
  mv.pass ? '패스' : `${COLS_LABEL[mv.col]}${size - mv.row}`;

const gtpLabel = (gtp, size) => {
  const c = gtpToColRow(gtp, size);
  return c ? `${COLS_LABEL[c.col]}${size - c.row}` : '패스';
};

// 현재 노드를 지나는 라인 전체: 루트 → 현재 → (메인라인 자식 끝까지)
const lineThrough = (cur) => {
  const up = nodesFromRoot(cur);
  const down = [];
  let n = cur;
  while (n.children[0]) { n = n.children[0]; down.push(n); }
  return [...up, ...down];
};

// SQLite created_at("YYYY-MM-DD HH:MM:SS" 또는 ISO) → "YYYY-MM-DD HH:MM"
const fmtDateTime = (s) => String(s ?? '').replace('T', ' ').slice(0, 16);

/**
 * AI 분석(복기) 화면 — 바둑 전용.
 *  - SGF는 HTTP로 받아 "배경 history"로 쓰고 내부적으로는 tree(state)에 저장한다.
 *  - SGF가 없어도(빈 판) 사용 가능: 보드를 클릭해 직접 두며 분기를 만들 수 있다.
 *  - KataGo(웹워커)를 붙여 현재 노드 위치를 분석하고, 결과를 노드에 저장(KaTrain 패턴)하며
 *    후보수를 보드 마커로, 엔진 로그를 우측 하단 패널에 표시한다.
 */
export const AiAnalysis = ({ onNavigate, currentUser, gameId = null }) => {
  const [tree, setTree] = useState(() => createTree());
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');
  const [meta, setMeta] = useState({ size: 19, players: { black: '', white: '' }, result: '' });
  const [hovered, setHovered] = useState(null);          // 호버 중인 후보수 index (PV 미리보기)
  const [showNumbers, setShowNumbers] = useState(false); // 둔 돌 수순번호 토글
  // SGF 불러오기(서버 저장 기보) 모달 상태
  const [showLoader, setShowLoader] = useState(false);
  const [gameList, setGameList] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState('');

  const commit = (t) => setTree({ root: t.root, current: t.current });

  useEffect(() => {
    let cancelled = false;

    const startEmpty = (msg) => {
      if (cancelled) return;
      setTree(createTree());
      setMeta({ size: 19, players: { black: '', white: '' }, result: '' });
      setNotice(msg);
      setLoading(false);
    };

    const load = async () => {
      setLoading(true);
      try {
        let targetId = gameId;
        if (targetId == null) {
          const sessionKey = SessionManager.getSessionKey();
          if (!sessionKey) { startEmpty('로그인하면 저장된 기보를 불러올 수 있어요. 빈 판에서 시작합니다.'); return; }
          const list = await getMyGames(sessionKey, { game_type: 'baduk' }); // 서버에서 바둑만 필터링
          const latest = list?.games?.[0]; // 이미 바둑 + 최신순이라 첫 항목
          if (!latest) { startEmpty('저장된 바둑 기보가 없어 빈 판에서 시작합니다.'); return; }
          targetId = latest.id;
        }

        const res = await getGameSgf(targetId);
        const sgf = res?.sgf;
        if (!sgf) { startEmpty('기보가 비어 있어 빈 판에서 시작합니다.'); return; }

        const p = parseSgf(sgf);
        if (cancelled) return;
        const t = treeFromMoves(p.moves);
        toEnd(t);
        setTree({ root: t.root, current: t.current });
        setMeta({ size: p.size, players: p.players, result: p.result });
        setNotice('');
        setLoading(false);
      } catch (e) {
        console.error('SGF 불러오기 실패:', e);
        startEmpty('기보를 불러오지 못해 빈 판에서 시작합니다.');
      }
    };

    load();
    return () => { cancelled = true; };
  }, [gameId]);

  const current = tree.current;
  const size = meta.size;

  // ── KataGo 연결 ──
  const { ready, statusMessage, progress, error: kgError, analyze, resultByStep, pendingSteps } =
    useKataGo({ boardXSize: size, boardYSize: size });

  const pathMoves = movesFromRoot(current);

  // 현재 노드가 바뀌면 그 위치를 분석 요청 (analyze는 중복 키를 무시)
  useEffect(() => {
    if (!ready || loading) return;
    const mv = movesFromRoot(current).map((m) => [
      m.color === 'black' ? 'B' : 'W',
      m.pass ? 'pass' : colRowToGtp(m.col, m.row, size),
    ]);
    analyze(current.id, mv);
  }, [ready, current, size, loading, analyze]);

  // 노드별 분석 캐시: 훅의 resultByStep Map이 node.id로 키잉되어 KaTrain의 node.analysis와
  // 동등한 역할을 한다(재방문 시 재사용, analyze는 중복 키를 무시).
  const analysis = resultByStep.get(current.id) ?? null;
  const analyzing = pendingSteps.has(current.id);

  const stones = replay(pathMoves, undefined, size, 'go');
  const moveNo = pathMoves.length;
  const lineMoveNodes = lineThrough(current).filter((n) => n.move);

  const candidates = (analysis?.moveInfos ?? []).slice(0, 6);

  // 보드용 후보수(평가색 + 순위). points lost = 최선수 집수 - 해당 후보 집수.
  const bestScore = candidates[0]?.scoreLead;
  const boardCandidates = [];
  candidates.forEach((mi, k) => {
    const c = gtpToColRow(mi.move, size);
    if (!c) return;
    const pointsLost =
      typeof bestScore === 'number' && typeof mi.scoreLead === 'number'
        ? Math.max(0, bestScore - mi.scoreLead)
        : 0;
    const { fill, text } = evalColor(pointsLost);
    boardCandidates.push({ col: c.col, row: c.row, label: String(k + 1), fill, text, best: k === 0 });
  });

  // PV 미리보기: 호버한 후보의 예상 진행(첫 수 색 = 둘 차례).
  const pvPreview =
    hovered != null && candidates[hovered]?.pv
      ? pvToStones(candidates[hovered].pv, nextColor(current), size)
      : null;

  // 마지막 수 마커 / 집 히트맵
  const lastMove =
    current.move && !current.move.pass
      ? { col: current.move.col, row: current.move.row, color: current.move.color }
      : null;
  const ownership = analysis?.ownership ?? null;

  // 변화도 마커: 분석 결과(후보수)가 없을 때만 자식 변화도를 점선으로 표시.
  const markers = [];
  if (boardCandidates.length === 0) {
    for (const ch of current.children) {
      if (ch.move && !ch.move.pass) markers.push({ col: ch.move.col, row: ch.move.row, type: 'dashed' });
    }
  }

  const atRoot = !current.parent;
  const atLeaf = !current.children[0];
  const variationCount = current.children.length;
  const turnLabel = nextColor(current) === 'black' ? '흑' : '백';

  const handlePlay = (coord) => {
    setHovered(null);
    play(tree, { color: nextColor(current), col: coord.col, row: coord.row });
    commit(tree);
  };
  const nav = (fn) => () => { setHovered(null); fn(tree); commit(tree); };
  const jumpTo = (node) => { setHovered(null); goTo(tree, node); commit(tree); };

  // SGF 불러오기: 서버에 저장된 내 바둑 기보 목록을 GET 으로 가져온다.
  const openLoader = async () => {
    setShowLoader(true);
    setListLoading(true);
    setListError('');
    try {
      const sessionKey = SessionManager.getSessionKey();
      if (!sessionKey) { setListError('로그인이 필요합니다.'); setGameList([]); return; }
      const list = await getMyGames(sessionKey, { game_type: 'baduk' });
      setGameList(list?.games ?? []);
    } catch (e) {
      console.error('게임 목록 조회 실패:', e);
      setListError('목록을 불러오지 못했습니다.');
    } finally {
      setListLoading(false);
    }
  };

  // 목록에서 고른 기보를 GET 으로 받아 분석 보드에 올린다.
  const selectGame = async (id) => {
    setShowLoader(false);
    setLoading(true);
    try {
      const res = await getGameSgf(id);
      const sgf = res?.sgf;
      if (!sgf) { setNotice('기보가 비어 있습니다.'); return; }
      const p = parseSgf(sgf);
      const t = treeFromMoves(p.moves);
      toEnd(t);
      setTree({ root: t.root, current: t.current });
      setMeta({ size: p.size, players: p.players, result: p.result });
      setNotice('');
    } catch (e) {
      console.error('SGF 불러오기 실패:', e);
      setNotice('기보를 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 목록에서 고른 기보를 SGF 파일로 내려받는다.
  const downloadGame = async (id) => {
    try {
      const res = await getGameSgf(id);
      if (res?.sgf) downloadSgf(res.sgf, `game_${id}.sgf`);
    } catch (e) {
      console.error('SGF 다운로드 실패:', e);
    }
  };

  // KataGo 상태 배지
  let kgStatus, kgTone;
  if (kgError) { kgStatus = '오류'; kgTone = 'bg-error-container text-on-error-container'; }
  else if (!ready) {
    const pct = progress?.total ? Math.round((progress.received / progress.total) * 100) : null;
    kgStatus = pct != null ? `모델 ${pct}%` : (statusMessage ? '초기화 중' : '로딩');
    kgTone = 'bg-surface-container-high text-on-surface-variant';
  } else if (analyzing) { kgStatus = '분석 중'; kgTone = 'bg-primary/15 text-primary'; }
  else { kgStatus = '준비됨'; kgTone = 'bg-primary/15 text-primary'; }

  return (
    <div className="bg-background text-on-surface overflow-hidden">
      <SideNav activeNav="ai_analysis" onNavigate={onNavigate} currentUser={currentUser} />

      <main className="md:ml-64 min-h-screen flex flex-col lg:flex-row pt-14 md:pt-0">
        {/* 보드 */}
        <div className="flex-grow flex flex-col items-center bg-surface-container-lowest rounded-3xl p-6 m-6 gap-4">
          <div className="w-full max-w-[580px]">
            {loading ? (
              <div className="w-full aspect-square flex items-center justify-center text-sm text-on-surface-variant">
                기보 불러오는 중...
              </div>
            ) : (
              <GoBoard
                size={size}
                stones={stones}
                markers={markers}
                candidates={boardCandidates}
                pvPreview={pvPreview}
                lastMove={lastMove}
                ownership={ownership}
                showMoveNumbers={showNumbers && hovered === null}
                onCandidateHover={setHovered}
                onIntersectionClick={handlePlay}
              />
            )}
          </div>

          {!loading && (
            <p className="text-xs text-on-surface-variant">
              빈 자리를 클릭하면 <span className="font-bold text-on-surface">{turnLabel}</span>이(가) 두어지고, 새 변화도가 만들어집니다.
            </p>
          )}

          {/* 복기 컨트롤 */}
          <div className="flex gap-4 flex-wrap justify-center items-center">
            <div className="flex bg-surface-container rounded-xl p-1 shadow-sm">
              <button onClick={nav(toStart)} disabled={atRoot}
                className="p-2 hover:bg-surface-container-high rounded-lg transition-colors disabled:opacity-30">
                <span className="material-symbols-outlined">first_page</span>
              </button>
              <button onClick={nav(undo)} disabled={atRoot}
                className="p-2 hover:bg-surface-container-high rounded-lg transition-colors disabled:opacity-30">
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <span className="px-4 flex items-center text-sm font-mono font-bold">
                {moveNo} / {lineMoveNodes.length}
              </span>
              <button onClick={nav(redo)} disabled={atLeaf}
                className="p-2 hover:bg-surface-container-high rounded-lg transition-colors disabled:opacity-30">
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
              <button onClick={nav(toEnd)} disabled={atLeaf}
                className="p-2 hover:bg-surface-container-high rounded-lg transition-colors disabled:opacity-30">
                <span className="material-symbols-outlined">last_page</span>
              </button>
            </div>

            <button onClick={() => setShowNumbers((v) => !v)} aria-pressed={showNumbers}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors ${
                showNumbers ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}>
              <span className="material-symbols-outlined text-base">tag</span>
              수순번호
            </button>

            <button onClick={openLoader}
              className="px-4 py-2.5 bg-primary text-on-primary rounded-xl font-bold text-sm flex items-center gap-2 hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-base">folder_open</span>
              SGF 불러오기
            </button>
          </div>

          {notice && (
            <p className="text-xs text-on-surface-variant bg-surface-container px-3 py-2 rounded-lg text-center">{notice}</p>
          )}
        </div>

        {/* 우측 패널 */}
        <div className="w-full lg:w-[380px] flex flex-col gap-6 lg:mt-6 px-6 pb-6">
          {/* 기보 */}
          <div className="bg-surface-container-low rounded-3xl p-6 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-on-surface">기보</h2>
              <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-1 rounded-full">
                총 {lineMoveNodes.length}수
              </span>
            </div>
            {(meta.players.black || meta.players.white || meta.result) && (
              <div className="flex items-center justify-between mb-4 text-xs text-on-surface-variant">
                <span className="truncate">흑 {meta.players.black || '?'} vs 백 {meta.players.white || '?'}</span>
                {meta.result && <span className="font-bold text-on-surface flex-shrink-0 ml-2">{meta.result}</span>}
              </div>
            )}
            {variationCount > 1 && (
              <div className="mb-3 text-xs text-on-surface-variant">
                이 위치의 다음 수: <span className="font-bold text-primary">{variationCount}개 분기</span>
              </div>
            )}
            <div className="flex-1 overflow-y-auto space-y-px" style={{ maxHeight: '260px' }}>
              {lineMoveNodes.length === 0 ? (
                <p className="text-xs text-outline text-center py-4">아직 둔 수가 없습니다. 보드를 클릭해 시작하세요.</p>
              ) : (
                lineMoveNodes.map((node, idx) => {
                  const isCurrent = node === current;
                  const hasBranch = node.parent && node.parent.children.length > 1;
                  return (
                    <button key={node.id} onClick={() => jumpTo(node)}
                      className={`w-full grid grid-cols-[2rem_2rem_1fr_auto] gap-2 items-center p-2.5 rounded-lg text-left transition-colors ${
                        isCurrent ? 'bg-primary/15 text-primary' : 'hover:bg-surface-container-high text-on-surface'
                      }`}>
                      <span className="text-xs font-mono text-outline">{String(idx + 1).padStart(2, '0')}</span>
                      <span className="text-sm font-medium">{node.move.color === 'black' ? '흑' : '백'}</span>
                      <span className="text-sm font-medium">{coordLabel(node.move, size)}</span>
                      {hasBranch && <span className="material-symbols-outlined text-sm text-primary" title="분기 있음">alt_route</span>}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* KataGo 분석 + 로그 (우측 하단) */}
          <div className="bg-surface-container-low rounded-3xl p-6 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-on-surface">KataGo 분석</h2>
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${kgTone}`}>{kgStatus}</span>
            </div>

            {!ready && progress?.total ? (
              <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${Math.round((progress.received / progress.total) * 100)}%` }} />
              </div>
            ) : null}

            {kgError && <p className="text-xs text-error">{kgError}</p>}

            {/* 후보수 */}
            {candidates.length > 0 && (
              <div className="space-y-px">
                {candidates.map((mi, i) => {
                  const c = gtpToColRow(mi.move, size);
                  const wr = typeof mi.winrate === 'number' ? (mi.winrate * 100).toFixed(1) : '?';
                  const sl = typeof mi.scoreLead === 'number' ? mi.scoreLead.toFixed(1) : '?';
                  return (
                    <button key={i} onClick={() => c && handlePlay({ col: c.col, row: c.row })}
                      className="w-full grid grid-cols-[1.25rem_2.75rem_1fr_auto] gap-2 items-center text-xs p-1.5 rounded-lg text-left hover:bg-surface-container-high transition-colors disabled:opacity-40"
                      disabled={!c}>
                      <span className="text-outline font-mono">{i + 1}</span>
                      <span className="font-bold">{gtpLabel(mi.move, size)}</span>
                      <span className="text-on-surface-variant">흑 {wr}% · {sl}집</span>
                      <span className="text-outline">{mi.visits}v</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {showLoader && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowLoader(false)}
        >
          <div
            className="w-full max-w-md max-h-[80vh] flex flex-col bg-surface-container-high rounded-2xl shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-on-surface">저장된 기보 불러오기</h3>
              <button onClick={() => setShowLoader(false)}
                className="p-1 rounded-lg hover:bg-surface-container text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {listLoading ? (
              <p className="py-10 text-center text-sm text-on-surface-variant">불러오는 중...</p>
            ) : listError ? (
              <p className="py-10 text-center text-sm text-error">{listError}</p>
            ) : gameList.length === 0 ? (
              <p className="py-10 text-center text-sm text-on-surface-variant">저장된 바둑 기보가 없습니다.</p>
            ) : (
              <ul className="flex-1 overflow-y-auto space-y-2 pr-1">
                {gameList.map((g) => (
                  <li key={g.id}
                    className="flex items-center gap-2 p-3 bg-surface-container-low rounded-xl hover:bg-surface-container transition-colors">
                    <button onClick={() => selectGame(g.id)} className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-on-surface">{g.my_color === 'black' ? '흑' : '백'}</span>
                        {g.result && <span className="text-xs font-mono text-primary">{g.result}</span>}
                      </div>
                      <div className="text-xs text-on-surface-variant truncate">
                        {fmtDateTime(g.created_at)} · {g.board_size}로
                      </div>
                    </button>
                    <button onClick={() => downloadGame(g.id)} title="SGF 다운로드"
                      className="flex-shrink-0 p-2 rounded-lg hover:bg-surface-container-high text-on-surface-variant">
                      <span className="material-symbols-outlined text-base">download</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
