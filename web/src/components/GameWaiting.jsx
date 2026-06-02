/**
 * ⏳ GameWaiting 컴포넌트
 * - 방 생성 후 상대방을 기다리는 대기 페이지
 * - WebSocket으로 입장 코드 기반 접속 유지
 * - 게임 시작 / 게임 나가기 버튼
 */
import { useEffect, useRef, useState } from 'react';
import { SideNav } from './SideNav';
import { ClientToServer, ServerToClient, GameType } from '../ts-proto/common';

export const GameWaiting = ({ onNavigate, gameType = 'go', currentUser, enterCode, isHost = false, wsRef, onUsersInfo, onGameTime }) => {
  const statusRef = useRef('waiting');
  const [players, setPlayers] = useState({ black: null, white: null });
  const playersRef = useRef({ black: null, white: null });
  const [status, setStatus] = useState('waiting'); // 'waiting' | 'ready' | 'started'
  const [connectionError, setConnectionError] = useState(false);

  useEffect(() => {
    const ws = wsRef?.current;
    if (!ws) return;

    if (ws.readyState === WebSocket.OPEN) setConnectionError(false);
    ws.onopen = () => setConnectionError(false);
    ws.onerror = () => setConnectionError(true);
    ws.onmessage = (event) => {
      try {
        const msg = ServerToClient.decode(new Uint8Array(event.data));
        const detectedType = msg.gameType === GameType.GAME_TYPE_OMOK ? 'omok' : 'go';
        const board = detectedType === 'omok' ? msg.omok : msg.baduk;
        if (!board) return;

        // 플레이어 정보 업데이트
        if (board.usersInfo) {
          const next = {
            black: board.usersInfo.black || playersRef.current.black,
            white: board.usersInfo.white || playersRef.current.white,
          };
          playersRef.current = next;
          setPlayers(next);
          if (next.black && next.white) {
            statusRef.current = 'ready';
            setStatus('ready');
            onUsersInfo && onUsersInfo(next);
          }
        }

        // 게임 시작 신호: gameState가 포함된 메시지 수신 시 즉시 이동
        if (!isHost && board.gameState) {
          const gs = board.gameState;
          onGameTime && onGameTime({
            black: gs.blackTime !== undefined ? Math.floor(Number(gs.blackTime.mainTime) / 1000) : null,
            white: gs.whiteTime !== undefined ? Math.floor(Number(gs.whiteTime.mainTime) / 1000) : null,
          });
          onNavigate && onNavigate('game_play', detectedType, enterCode);
        }
      } catch (e) {
        console.error('WS decode error:', e);
      }
    };

  }, [enterCode, wsRef]);

  const handleGameStart = () => {
    const ws = wsRef?.current;
    if (ws?.readyState === WebSocket.OPEN) {
      const payload = ClientToServer.encode(
        gameType === 'omok'
          ? { omok: { gamestart: {} } }
          : { baduk: { gamestart: {} } }
      ).finish();
      ws.send(payload);
    }
    if (isHost) onNavigate && onNavigate('game_play', gameType, enterCode);
  };

  const handleLeave = () => {
    onNavigate && onNavigate('game_lobby', gameType);
  };

  const gameName = gameType === 'go' ? '바둑' : '오목';

  return (
    <div className="bg-background text-on-surface min-h-screen">
      <SideNav activeNav="play" onNavigate={onNavigate} currentUser={currentUser} />

      <main className="md:ml-64 min-h-screen flex flex-col items-center justify-center p-6 pt-20 md:pt-6">
        <div className="w-full max-w-md flex flex-col gap-6">

          {/* 헤더 */}
          <div className="text-center">
            <span className="inline-block px-3 py-1 bg-tertiary-container text-on-tertiary-container rounded-full text-[10px] font-bold uppercase tracking-widest mb-3">
              {gameName} 대기실
            </span>
            <h2 className="text-2xl font-black text-on-surface tracking-tight">상대를 기다리는 중</h2>
            <p className="text-sm text-on-surface-variant mt-1">아래 코드를 상대에게 알려주세요</p>
          </div>

          {/* 입장 코드 */}
          <div className="bg-surface-container-lowest rounded-2xl p-6 flex flex-col items-center gap-2 border border-outline-variant/20">
            <span className="text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">입장 코드</span>
            <span className="text-4xl font-black tracking-widest text-primary font-mono">
              {enterCode ?? '------'}
            </span>
            {connectionError && (
              <span className="text-xs text-error font-medium mt-1">서버 연결 실패. 코드를 확인해주세요.</span>
            )}
          </div>

          {/* 플레이어 슬롯 */}
          <div className="bg-surface-container-lowest rounded-2xl p-5 flex flex-col gap-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">참가자</h3>
            <div className="flex flex-col gap-3">
              {/* 나 (방장) */}
              <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-xl">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-white font-black text-sm flex-shrink-0">
                  {(currentUser?.username || currentUser?.id || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-sm text-on-surface">{currentUser?.username || currentUser?.id || '나'}</p>
                  <p className="text-xs text-primary font-medium">
                    {isHost ? '방장' : '참가자'}{currentUser?.rating != null ? ` · 레이팅 ${currentUser.rating}` : ''}
                  </p>
                </div>
                <div className="w-2 h-2 rounded-full bg-primary" />
              </div>

              {/* 상대방 슬롯 */}
              {(() => {
                const myName = currentUser?.username || currentUser?.id;
                const blackIsMe = players.black?.userName === myName;
                const whiteIsMe = players.white?.userName === myName;
                const opponent = blackIsMe
                  ? (whiteIsMe ? null : players.white)
                  : (players.black?.userName ? players.black : null);
                return (
                  <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
                    <div className="w-9 h-9 rounded-full bg-surface-container border border-outline-variant/40 flex items-center justify-center text-on-surface font-black text-sm flex-shrink-0">
                      {opponent ? opponent.userName.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div className="flex-1">
                      {opponent ? (
                        <>
                          <p className="font-bold text-sm text-on-surface">{opponent.userName}</p>
                          <p className="text-xs text-on-surface-variant">레이팅 {opponent.rating}</p>
                        </>
                      ) : (
                        <p className="text-sm text-on-surface-variant">대기 중...</p>
                      )}
                    </div>
                    <div className={`w-2 h-2 rounded-full ${opponent ? 'bg-primary' : 'bg-outline-variant'}`} />
                  </div>
                );
              })()}
            </div>

            {/* 상태 메시지 */}
            <div className={`text-center text-xs font-bold py-2 rounded-lg ${
              status === 'ready'
                ? 'bg-tertiary-container text-on-tertiary-container'
                : 'bg-surface-container text-on-surface-variant'
            }`}>
              {status === 'ready' ? '두 명 모두 입장! 게임을 시작할 수 있습니다.' : '상대방 입장을 기다리는 중...'}
            </div>
          </div>

          {/* 버튼 */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleGameStart}
              disabled={status !== 'ready' || !isHost}
              className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">play_arrow</span>
              게임 시작
            </button>
            <button
              onClick={handleLeave}
              className="w-full py-4 bg-surface-container-low text-on-surface border border-outline-variant rounded-xl font-bold text-sm hover:bg-surface-container-high transition-colors active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-base">logout</span>
              게임 나가기
            </button>
          </div>

        </div>
      </main>
    </div>
  );
};
