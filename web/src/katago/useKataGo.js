/**
 * React hook that owns the KataGo worker lifecycle and caches one analysis
 * result per game step. AiAnalysis.jsx is the intended consumer.
 *
 * Usage:
 *   const { ready, analyze, resultByStep } = useKataGo();
 *   useEffect(() => {
 *     if (ready) analyze(history.length, historyToKatagoMoves(history, size));
 *   }, [ready, currentStep, history]);
 *   const r = resultByStep.get(currentStep);
 *
 * Behavior:
 *   - Calls before `ready === true` are dropped (no queuing).
 *   - Duplicate analyze(step, ...) on a cached or in-flight step is a no-op.
 *   - Only completed results are surfaced; partial mid-search reports are
 *     ignored to keep the UI from flickering.
 *   - A fatal worker error sets `error` and clears `ready`; the consumer can
 *     remount the component (e.g. by changing its `key`) to retry.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createSabWriter } from './sabWriter.js';
import {
  createAnalysisQuery,
  createIdGenerator,
  serializeQuery,
  terminateAllQuery,
} from './katago-schema/index.js';

export function useKataGo(options = {}) {
  const {
    boardXSize = 19,
    boardYSize = 19,
    rules = 'chinese',
    komi = 7.5,
    maxVisits = 50,
  } = options;

  const workerRef = useRef(null);
  const writerRef = useRef(null);
  const nextIdRef = useRef(null);
  const pendingByIdRef = useRef(new Map()); // queryId -> turnNumber
  const sentAtRef = useRef(new Map()); // queryId -> performance.now() at send, for timing
  const pendingStepsRef = useRef(new Set()); // turnNumbers currently in flight
  const resultStepsRef = useRef(new Set()); // turnNumbers with cached results
  const optionsRef = useRef({ boardXSize, boardYSize, rules, komi, maxVisits });

  const [ready, setReady] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [resultByStep, setResultByStep] = useState(() => new Map());
  const [pendingSteps, setPendingSteps] = useState(() => new Set());

  // Keep optionsRef in sync so the analyze callback never reads stale values.
  useEffect(() => {
    optionsRef.current = { boardXSize, boardYSize, rules, komi, maxVisits };
  }, [boardXSize, boardYSize, rules, komi, maxVisits]);

  useEffect(() => {
    nextIdRef.current = createIdGenerator();

    const worker = new Worker(
      new URL('./katagoWorker.js', import.meta.url),
      { type: 'module' },
    );
    workerRef.current = worker;

    worker.onmessage = (e) => {
      const msg = e.data;
      switch (msg.type) {
        case 'sab':
          writerRef.current = createSabWriter(msg.sab);
          break;
        case 'status':
          console.log('[KataGo]', msg.message);
          setStatusMessage(msg.message);
          break;
        case 'progress':
          // Fires once per downloaded chunk; surfaced via state, not console.
          setProgress({ received: msg.received, total: msg.total });
          break;
        case 'ready':
          console.log('[KataGo] ready');
          setReady(true);
          setStatusMessage(null);
          setProgress(null);
          break;
        case 'result': {
          const id = msg.response.id;
          const turn = pendingByIdRef.current.get(id);
          const sentAt = sentAtRef.current.get(id);
          const elapsed =
            sentAt != null ? (performance.now() - sentAt).toFixed(0) : '?';
          const numMoves = msg.response.moveInfos?.length ?? 0;
          const visits = msg.response.rootInfo?.visits ?? 'n/a';
          console.log(
            `[KataGo] ← result ${id} (turn ${turn ?? '?'}) done in ${elapsed}ms: ` +
              `${numMoves} candidate moves, ${visits} visits`,
          );
          console.debug(`[KataGo] result ${id} payload:`, msg.response);
          sentAtRef.current.delete(id);
          if (turn != null) {
            pendingByIdRef.current.delete(id);
            pendingStepsRef.current.delete(turn);
            resultStepsRef.current.add(turn);
            setResultByStep((prev) => {
              const next = new Map(prev);
              next.set(turn, msg.response);
              return next;
            });
            setPendingSteps(new Set(pendingStepsRef.current));
          }
          break;
        }
        case 'partial':
          // Mid-search reports are ignored for the UI, but logged for visibility.
          console.debug(`[KataGo] partial result ${msg.response.id}`);
          break;
        case 'queryError': {
          const id = msg.response.id;
          const turn = pendingByIdRef.current.get(id);
          console.error(`[KataGo] query error ${id}:`, msg.response.error);
          sentAtRef.current.delete(id);
          if (turn != null) {
            pendingByIdRef.current.delete(id);
            pendingStepsRef.current.delete(turn);
            setPendingSteps(new Set(pendingStepsRef.current));
          }
          break;
        }
        case 'fatal':
          console.error('[KataGo] fatal:', msg.message);
          setReady(false);
          setError(msg.message);
          break;
        case 'log':
          // Passthrough of KataGo's own stdout/stderr: startup config, backend,
          // neural-net loading, and warnings all arrive on the stderr stream.
          console.log(`[KataGo ${msg.stream}]`, msg.line);
          break;
        case 'warning':
          console.warn('[KataGo] warning:', msg.response.warning ?? msg.response);
          break;
        case 'version':
          console.log('[KataGo] version:', msg.response.version ?? msg.response);
          break;
        case 'action':
          console.debug('[KataGo] action ack:', msg.response);
          break;
        default:
          console.debug('[KataGo] unhandled message:', msg);
          break;
      }
    };

    worker.onerror = (e) => {
      setReady(false);
      setError(e.message || 'worker error');
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
      writerRef.current = null;
      pendingByIdRef.current.clear();
      sentAtRef.current.clear();
      pendingStepsRef.current.clear();
      resultStepsRef.current.clear();
    };
  }, []);

  const analyze = useCallback(
    (turnNumber, moves) => {
      if (!ready || !writerRef.current) return;
      if (resultStepsRef.current.has(turnNumber)) return;
      if (pendingStepsRef.current.has(turnNumber)) return;

      const id = nextIdRef.current();
      const opts = optionsRef.current;
      const query = createAnalysisQuery({
        id,
        moves,
        boardXSize: opts.boardXSize,
        boardYSize: opts.boardYSize,
        rules: opts.rules,
        komi: opts.komi,
        maxVisits: opts.maxVisits,
        analyzeTurns: [moves.length],
      });

      pendingByIdRef.current.set(id, turnNumber);
      pendingStepsRef.current.add(turnNumber);
      sentAtRef.current.set(id, performance.now());
      setPendingSteps(new Set(pendingStepsRef.current));

      const line = serializeQuery(query);
      console.log(
        `[KataGo] → query ${id} (turn ${turnNumber}): ${moves.length} moves, ` +
          `maxVisits ${opts.maxVisits}`,
      );
      console.debug(`[KataGo] query ${id} payload:`, line.trimEnd());
      writerRef.current.writeLine(line);
    },
    [ready],
  );

  const clearResults = useCallback(() => {
    if (writerRef.current && ready) {
      const id = nextIdRef.current();
      console.debug(`[KataGo] → terminate_all ${id}`);
      writerRef.current.writeLine(serializeQuery(terminateAllQuery(id)));
    }
    pendingByIdRef.current.clear();
    sentAtRef.current.clear();
    pendingStepsRef.current.clear();
    resultStepsRef.current.clear();
    setPendingSteps(new Set());
    setResultByStep(new Map());
  }, [ready]);

  return {
    ready,
    statusMessage,
    progress,
    error,
    analyze,
    resultByStep,
    pendingSteps,
    clearResults,
  };
}
