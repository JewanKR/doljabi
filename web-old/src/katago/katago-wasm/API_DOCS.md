# KataGo WebAssembly API 명세서

이 문서는 Emscripten으로 빌드된 KataGo WASM 모듈(`katago.js`, `katago.wasm`)을 JavaScript/TypeScript 환경에서 사용하는 방법을 설명합니다.

KataGo WASM은 기본적으로 **GTP(Go Text Protocol)**를 통해 통신하며, 표준 입출력(Standard I/O)을 가로채는 방식으로 인터페이스를 제공합니다.

---

## 1. 초기 설정 (Module Configuration)

KataGo WASM 모듈을 초기화할 때, 입출력 핸들러와 파일 시스템 준비를 위한 설정을 제공해야 합니다.

```javascript
import KataGoModule from './katago.js';

const config = {
  // 표준 출력 (GTP 응답 및 로그)
  print: (text) => {
    console.log('KataGo STDOUT:', text);
    // 여기서 GTP 응답을 파싱하여 처리합니다.
  },
  // 표준 에러 출력 (디버그 로그)
  printErr: (text) => {
    console.error('KataGo STDERR:', text);
  },
  // 초기 실행 전 작업 (파일 업로드 등)
  preRun: [
    (Module) => {
      // 가상 파일 시스템(MEMFS)에 모델 및 설정 파일 업로드
      // 자세한 내용은 '4. 파일 시스템 사용' 섹션 참고
    }
  ],
  // 메인 함수 실행 후 종료 시 콜백
  onRuntimeInitialized: () => {
    console.log('KataGo WASM 런타임 준비 완료');
  }
};

// 모듈 인스턴스 생성
const Module = await KataGoModule(config);
```

---

## 2. 엔진 실행 (Main Execution)

KataGo는 `main` 함수를 통해 실행되며, 실행 시 인자로 서브커맨드(예: `gtp`)를 넘겨줍니다. `-s ASYNCIFY`가 적용되어 있어 비동기 실행이 가능합니다.

```javascript
// GTP 엔진 실행 예시
// 인자: ['gtp', '-model', <모델경로>, '-config', <설정경로>]
Module.callMain(['gtp', '-model', '/models/default_model.bin.gz', '-config', '/configs/gtp_custom.cfg']);
```

---

## 3. GTP 명령 전송 (Standard Input)

GTP 엔진이 실행 중일 때, JavaScript에서 엔진으로 명령을 보내려면 가상 `stdin`을 사용해야 합니다.

```javascript
/**
 * KataGo 엔진에 GTP 명령어를 전송합니다.
 * @param {string} command - GTP 명령어 (예: "genmove black\n")
 */
function sendGtpCommand(command) {
  // 문자열의 각 문자를 stdin 스트림에 기록
  for (let i = 0; i < command.length; i++) {
    Module.stdinPush(command.charCodeAt(i));
  }
  // 개행 문자가 포함되어야 명령이 실행됩니다.
  if (!command.endsWith('\n')) {
    Module.stdinPush(10); // '\n'
  }
}
```

---

## 4. 파일 시스템 사용 (Emscripten FS)

KataGo가 모델 파일과 설정 파일을 읽을 수 있도록 WASM 내부 가상 파일 시스템(MEMFS)에 파일을 기록해야 합니다.

```javascript
/**
 * 로컬 파일을 WASM 파일 시스템에 기록합니다.
 * @param {string} path - 가상 파일 시스템 내 저장 경로
 * @param {Uint8Array} data - 파일 데이터 (TypedArray)
 */
function uploadFile(path, data) {
  const parts = path.split('/');
  let current = '/';
  
  // 디렉토리 생성
  for (let i = 0; i < parts.length - 1; i++) {
    if (parts[i] === '') continue;
    current += parts[i];
    try { Module.FS.mkdir(current); } catch(e) {}
    current += '/';
  }

  // 파일 쓰기
  Module.FS.writeFile(path, data);
}

// 사용 예시 (모델 파일 업로드)
const modelData = await fetch('model.bin.gz').then(res => res.arrayBuffer());
uploadFile('/models/default_model.bin.gz', new Uint8Array(modelData));
```

---

## 5. 주요 서브커맨드 및 옵션

| 서브커맨드 | 설명 | 주요 옵션 |
| :--- | :--- | :--- |
| `gtp` | 표준 바둑 엔진 인터페이스 실행 | `-model`, `-config` |
| `benchmark` | 엔진 성능 측정 (NPS 확인) | `-model`, `-threads` |
| `analysis` | 게임 분석 전용 모드 실행 | `-model`, `-config` |
| `version` | 버전 정보 출력 | 없음 |

---

## 6. 주의 사항 (Best Practices)

1.  **메모리 관리:** 빌드 옵션에 따라 초기 메모리가 1GB로 설정되어 있을 수 있습니다. 브라우저의 가용 메모리를 확인하세요.
2.  **비동기 처리:** `ASYNCIFY` 모드에서는 엔진이 루프를 도는 동안에도 브라우저 메인 스레드가 차단되지 않지만, 대량의 계산 작업 시 Worker에서 실행하는 것을 권장합니다.
3.  **ONNX Runtime Web:** 이 WASM 모듈은 내부적으로 ONNX Runtime Web을 백엔드로 사용할 수 있습니다. 관련 `.onnx` 파일 로드 시 경로 설정에 주의하세요.
4.  **입력 처리:** `stdinPush` 이후 엔진이 명령을 처리하고 `print` 콜백으로 응답을 보낼 때까지 약간의 지연이 발생할 수 있습니다.

---

## 7. TypeScript 지원

TypeScript 환경에서 사용하는 경우 다음과 같은 타입 정의를 참고하세요.

```typescript
interface KataGoModuleOptions {
  print?: (text: string) => void;
  printErr?: (text: string) => void;
  preRun?: ((Module: any) => void)[];
  onRuntimeInitialized?: () => void;
}

declare function KataGoModule(options: KataGoModuleOptions): Promise<any>;
export default KataGoModule;
```
