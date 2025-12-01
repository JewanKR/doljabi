import { badukboardproto } from "./badukboard.js";


 //클라이언트에서 서버로 요청 생성 및 인코딩
export function createClientRequest(
  sessionKey: string,
  type: 'coordinate' | 'resign' | 'drawOffer' | 'passTurn',
  coordinate?: number
): Uint8Array {
  let payload: any = {};

  switch (type) {
    case 'coordinate':
      if (coordinate === undefined) {
        throw new Error('coordinate가 필요합니다');
      }
      payload.coordinate = badukboardproto.ChaksuRequest.create({
        coordinate: coordinate
      });
      break;
    case 'resign':
      payload.resign = badukboardproto.ResignRequest.create({});
      break;
    case 'drawOffer':
      payload.drawOffer = badukboardproto.DrawOfferRequest.create({});
      break;
    case 'passTurn':
      payload.passTurn = badukboardproto.PassTurnRequest.create({});
      break;
  }

  const request = badukboardproto.ClientToServerRequest.create({
    sessionKey: sessionKey,
    ...payload
  });

  return badukboardproto.ClientToServerRequest.encode(request).finish();
}


//서버 응답 디코딩
 
export function decodeServerResponse(buffer: Uint8Array): any {
  const response = badukboardproto.ServerToClientResponse.decode(buffer);
  return badukboardproto.ServerToClientResponse.toObject(response, {
    longs: Number,  // uint64를 Number로 변환 (시간 값은 안전한 범위)
    enums: String,
    bytes: String,
  });
}


//WebSocket으로 요청 전송

export function sendRequestViaWebSocket(
  websocket: WebSocket,
  sessionKey: string,
  type: 'coordinate' | 'resign' | 'drawOffer' | 'passTurn',
  coordinate?: number
) {
  if (websocket.readyState !== WebSocket.OPEN) {
    throw new Error("WebSocket이 연결되지 않았습니다.");
  }

  const buffer = createClientRequest(sessionKey, type, coordinate);
  websocket.send(buffer);
}

//비트보드(u64 배열)를 19x19 바둑판 배열로 변환

export function bitboardToBoardArray(
  blackBitboard: (number | string)[] | null | undefined,
  whiteBitboard: (number | string)[] | null | undefined,
  boardSize: number = 19
): (null | 'black' | 'white')[][] {
  const board: (null | 'black' | 'white')[][] = Array(boardSize)
    .fill(null)
    .map(() => Array(boardSize).fill(null));

  // 비트보드를 숫자로 변환 (string인 경우 처리)
  const parseU64 = (value: number | string): bigint => {
    if (typeof value === 'string') {
      return BigInt(value);
    }
    return BigInt(value);
  };

  // black 비트보드 처리
  if (blackBitboard && Array.isArray(blackBitboard)) {
    blackBitboard.forEach((u64, arrayIndex) => {
      const bits = parseU64(u64);
      for (let bitIndex = 0; bitIndex < 64; bitIndex++) {
        if ((bits & (1n << BigInt(bitIndex))) !== 0n) {
          const coordinate = arrayIndex * 64 + bitIndex;
          if (coordinate < boardSize * boardSize) {
            const row = Math.floor(coordinate / boardSize);
            const col = coordinate % boardSize;
            if (row >= 0 && row < boardSize && col >= 0 && col < boardSize) {
              board[row][col] = 'black';
            }
          }
        }
      }
    });
  }

  // white 비트보드 처리
  if (whiteBitboard && Array.isArray(whiteBitboard)) {
    whiteBitboard.forEach((u64, arrayIndex) => {
      const bits = parseU64(u64);
      for (let bitIndex = 0; bitIndex < 64; bitIndex++) {
        if ((bits & (1n << BigInt(bitIndex))) !== 0n) {
          const coordinate = arrayIndex * 64 + bitIndex;
          if (coordinate < boardSize * boardSize) {
            const row = Math.floor(coordinate / boardSize);
            const col = coordinate % boardSize;
            if (row >= 0 && row < boardSize && col >= 0 && col < boardSize) {
              board[row][col] = 'white';
            }
          }
        }
      }
    });
  }

  return board;
}

/**
 * Color enum을 'black' | 'white'로 변환
 */
export function colorEnumToString(color: number | string): 'black' | 'white' | null {
  // COLOR_BLACK = 0, COLOR_WHITE = 1
  if (typeof color === 'string') {
    if (color === 'COLOR_BLACK' || color === '0') return 'black';
    if (color === 'COLOR_WHITE' || color === '1') return 'white';
  } else {
    if (color === 0) return 'black';
    if (color === 1) return 'white';
  }
  return null;
}
