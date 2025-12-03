// src/hooks/useOmokSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';

interface UseOmokSocketOptions {
  roomCode: string;
  sessionKey: string;
  onServerMessage?: (data: any) => void;
}

interface PlaceStonePayload {
  coordinate: number;
  boardSize: number;
  color: 'black' | 'white';
}

export default function useOmokSocket({
  roomCode,
  sessionKey,
  onServerMessage,
}: UseOmokSocketOptions) {
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // 1. WebSocket 연결 생성 (기존 방식 유지: ws://121.177.219.180/ws/)
  useEffect(() => {
    console.log('[WS] useOmokSocket effect 실행');

    const wsUrl = `ws://121.177.219.180/ws/`;
    const ws = new WebSocket(wsUrl);
    console.log('[WS] WebSocket 객체 생성 시도:', wsUrl);

    ws.onopen = () => {
      console.log('[WS] connected');
      setIsConnected(true);

      // 👉 기존처럼 join 메시지로 roomCode / sessionKey 전달
      const joinMsg = {
        type: 'join',
        sessionKey,
        roomCode,
      };
      ws.send(JSON.stringify(joinMsg));
      console.log('[WS] send join:', joinMsg);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('[WS] message received:', data);
        onServerMessage?.(data);
      } catch (e) {
        console.error('[WS] JSON parse error:', e, event.data);
      }
    };

    ws.onerror = (err) => {
      console.error('[WS] error:', err);
    };

    ws.onclose = () => {
      console.log('[WS] disconnected');
      setIsConnected(false);
    };

    socketRef.current = ws;

    return () => {
      console.log('[WS] cleanup & close');
      ws.close();
      socketRef.current = null;
    };
    // roomCode / sessionKey / onServerMessage가 바뀌면 새 연결
  }, [roomCode, sessionKey, onServerMessage]);

  // 2. JSON 보내는 공통 함수
  const sendJson = useCallback((payload: any) => {
    const ws = socketRef.current;
    if (!ws) {
      console.warn('[WS] send 실패: 소켓이 없음');
      return;
    }
    if (ws.readyState !== WebSocket.OPEN) {
      console.warn(
        '[WS] send 실패: 소켓이 OPEN 상태가 아님, readyState=',
        ws.readyState,
      );
      return;
    }
    console.log('[WS] send payload:', payload);
    ws.send(JSON.stringify(payload));
  }, []);

  // 3. 도메인별 helper 함수들

  // (1) 돌 두기
  const sendPlaceStone = useCallback(
    ({ coordinate, boardSize, color }: PlaceStonePayload) => {
      sendJson({
        type: 'move',
        move: 'place',
        sessionKey,
        roomCode,
        coordinate,
        boardSize,
        color,
      });
    },
    [sendJson, sessionKey, roomCode],
  );

  // (2) 패스
  const sendPassMove = useCallback(
    (color: 'black' | 'white') => {
      sendJson({
        type: 'move',
        move: 'pass',
        sessionKey,
        roomCode,
        color,
      });
    },
    [sendJson, sessionKey, roomCode],
  );

  // (3) 기권
  const sendResign = useCallback(
    (color: 'black' | 'white') => {
      sendJson({
        type: 'end',
        result: 'resign',
        sessionKey,
        roomCode,
        color,
      });
    },
    [sendJson, sessionKey, roomCode],
  );

  // (4) 무승부 제안
  const sendDrawRequest = useCallback(
    (color: 'black' | 'white') => {
      sendJson({
        type: 'draw_request',
        sessionKey,
        roomCode,
        color,
      });
    },
    [sendJson, sessionKey, roomCode],
  );

  // (5) 대국 시작 요청
  const sendStartRequest = useCallback(() => {
    sendJson({
      type: 'start_request',
      sessionKey,
      roomCode,
    });
  }, [sendJson, sessionKey, roomCode]);

  // (6) 🔥 타이머 강제 동기화 요청 (옵션)
  //     - 서버가 알아서 TIME_SYNC를 주기적으로 보내고 있으면 안 써도 되고,
  //       재접속/포커스 변경 시 한 번 강제 요청할 때 쓰면 됨.
  const sendTimeSyncRequest = useCallback(() => {
    sendJson({
      type: 'time_sync_request',
      sessionKey,
      roomCode,
    });
  }, [sendJson, sessionKey, roomCode]);

  return {
    isConnected,
    sendPlaceStone,
    sendPassMove,
    sendResign,
    sendDrawRequest,
    sendStartRequest,
    sendTimeSyncRequest,
  };
}