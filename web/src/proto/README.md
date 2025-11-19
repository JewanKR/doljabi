# Protocol Buffer TypeScript 파일 생성

## 방법 1: 컴파일된 모듈 사용 (권장)

### 생성 명령어

프로젝트 루트에서 실행:

```bash
cd web
npm installe
npm run generate:proto
```

이 명령어는 다음 파일들을 생성합니다:
- `src/proto/badukboard.js` - JavaScript 런타임 코드
- `src/proto/badukboard.d.ts` - TypeScript 타입 정의

### 사용 예제

```typescript
import { badukboardproto } from "@/proto/badukboard";

// 클라이언트 요청 생성 및 인코딩
const request = badukboardproto.ClientToServerRequest.create({
  sessionKey: "my-session-key",
  coordinate: badukboardproto.ChaksuRequest.create({
    coordinate: 100
  })
});

const buffer = badukboardproto.ClientToServerRequest.encode(request).finish();

// WebSocket으로 전송
websocket.send(buffer);

// 서버 응답 디코딩
const response = badukboardproto.ServerToClientResponse.decode(buffer);
console.log(response);
```

