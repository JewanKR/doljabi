import { decodeServerResponse, bitboardToBoardArray, colorEnumToString } from '../../proto/proto-utils';

export interface Player {
  nickname: string;
  rating: number;
  color: 'black' | 'white';
  mainTime: number;
  byoyomiTime: number;
  byoyomiCount: number;
}

export interface GameRoomState {
  board: (null | 'black' | 'white')[][];
  currentTurn: 'black' | 'white';
  players: { black: Player; white: Player };
  isInByoyomi: { black: boolean; white: boolean };
}

export interface WebSocketHandlerCallbacks {
  onBoardUpdate: (board: (null | 'black' | 'white')[][]) => void;
  onTurnUpdate: (turn: 'black' | 'white') => void;
  onPlayersUpdate: (players: { black: Player; white: Player }) => void;
  onByoyomiUpdate: (isInByoyomi: { black: boolean; white: boolean }) => void;
  onResign: () => void;
  onDrawOffer: (accepted: boolean) => void;
  onWinner: (winner: 'black' | 'white' | null) => void;
  onError: (error: Error) => void;
}

/**
 * 서버 메시지 처리 핸들러
 * @param buffer 서버에서 받은 바이너리 데이터
 * @param boardSize 바둑판 크기
 * @param currentPlayers 현재 플레이어 정보
 * @param callbacks 상태 업데이트 콜백 함수들
 */
export function handleServerMessage(
  buffer: Uint8Array,
  boardSize: number,
  currentPlayers: { black: Player; white: Player },
  callbacks: WebSocketHandlerCallbacks
): void {
  try {
    const response = decodeServerResponse(buffer);

    // GameState 추출 (ChaksuResponse 또는 PassTurnResponse에서)
    let gameState = null;
    if (response.coordinate && response.coordinate.gameState) {
      gameState = response.coordinate.gameState;
    } else if (response.passTurn && response.passTurn.gameState) {
      gameState = response.passTurn.gameState;
    }

    if (gameState) {
      // 바둑판 업데이트
      if (gameState.board) {
        const newBoard = bitboardToBoardArray(
          gameState.board.black,
          gameState.board.white,
          boardSize
        );
        callbacks.onBoardUpdate(newBoard);
      }

      // 턴 정보 업데이트
      if (gameState.turn !== undefined && gameState.turn !== null) {
        const turnColor = colorEnumToString(gameState.turn);
        if (turnColor) {
          callbacks.onTurnUpdate(turnColor);
        }
      }

      // 플레이어 시간 정보 업데이트
      const updatedPlayers = { ...currentPlayers };
      let byoyomiUpdated = false;
      const newByoyomiState = { black: false, white: false };

      if (gameState.blackTime) {
        const blackTime = gameState.blackTime;
        updatedPlayers.black = {
          ...updatedPlayers.black,
          mainTime: blackTime.mainTime / 1000, // 밀리초를 초로 변환
          byoyomiTime: blackTime.overtime / 1000,
          byoyomiCount: blackTime.remainingOvertime || updatedPlayers.black.byoyomiCount,
        };

        // 초읽기 상태 업데이트
        if (blackTime.mainTime === 0) {
          newByoyomiState.black = true;
          byoyomiUpdated = true;
        }
      }

      if (gameState.whiteTime) {
        const whiteTime = gameState.whiteTime;
        updatedPlayers.white = {
          ...updatedPlayers.white,
          mainTime: whiteTime.mainTime / 1000,
          byoyomiTime: whiteTime.overtime / 1000,
          byoyomiCount: whiteTime.remainingOvertime || updatedPlayers.white.byoyomiCount,
        };

        // 초읽기 상태 업데이트
        if (whiteTime.mainTime === 0) {
          newByoyomiState.white = true;
          byoyomiUpdated = true;
        }
      }

      callbacks.onPlayersUpdate(updatedPlayers);
      
      if (byoyomiUpdated) {
        callbacks.onByoyomiUpdate(newByoyomiState);
      }
    }

    // 승자 정보 처리
    if (response.theWinner !== undefined && response.theWinner !== null) {
      const winner = colorEnumToString(response.theWinner);
      callbacks.onWinner(winner);
    }

    // 기권 처리
    if (response.resign) {
      callbacks.onResign();
    }

    // 무승부 제안 처리
    if (response.drawOffer) {
      callbacks.onDrawOffer(response.drawOffer.accepted);
    }
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * WebSocket 연결 설정
 * @param wsUrl WebSocket URL
 * @param onOpen 연결 성공 콜백
 * @param onClose 연결 종료 콜백
 * @param onMessage 메시지 수신 콜백
 * @param onError 에러 콜백
 * @returns WebSocket 인스턴스
 */
export function setupWebSocket(
  wsUrl: string,
  onOpen: () => void,
  onClose: () => void,
  onMessage: (buffer: Uint8Array) => void,
  onError: (error: Event) => void
): WebSocket {
  const ws = new WebSocket(wsUrl);

  ws.onopen = () => {
    console.log('WebSocket 연결 성공');
    onOpen();
  };

  ws.onmessage = (event) => {
    try {
      // 바이너리 데이터 받기
      let buffer: Uint8Array;
      if (event.data instanceof ArrayBuffer) {
        buffer = new Uint8Array(event.data);
        onMessage(buffer);
      } else if (event.data instanceof Blob) {
        // Blob인 경우 ArrayBuffer로 변환 필요
        event.data.arrayBuffer().then((arrayBuffer) => {
          const uint8Buffer = new Uint8Array(arrayBuffer);
          onMessage(uint8Buffer);
        });
      } else {
        buffer = new Uint8Array(event.data);
        onMessage(buffer);
      }
    } catch (error) {
      console.error('메시지 수신 오류:', error);
    }
  };

  ws.onerror = (error) => {
    console.error('WebSocket 오류:', error);
    onError(error);
  };

  ws.onclose = () => {
    console.log('WebSocket 연결 종료');
    onClose();
  };

  return ws;
}

