/**
 * Web Worker entry: runs KataGo WASM in analysis mode.
 *
 * Lifecycle:
 *   1. Allocate the SAB ring buffer and share its handle with the main thread.
 *   2. Boot the KataGo WASM module (Emscripten glue from ./katago.js).
 *   3. Mount IDBFS at /work; download the neural-net weights on first run and
 *      persist them in IndexedDB for subsequent boots.
 *   4. Load /analysis.cfg into the in-memory FS.
 *   5. Announce 'ready' and enter Module.callMain, which blocks the worker
 *      thread inside KataGo's analysis loop.
 *
 * stdin: each byte arrives via readByteFromSAB, called synchronously from
 *        inside Module.callMain. The main thread writes the bytes into the
 *        SAB ring buffer via sabWriter.js.
 *
 * stdout: KataGo's print callback runs on this worker thread. Each line is
 *         classified with the katago-schema parser and forwarded to the
 *         main thread as a typed postMessage.
 */

import wasmUrl from './katago.wasm?url';
import {
  STDIN_SIZE,
  META_BYTES,
  META_WRITE_IDX,
  META_READ_IDX,
} from './sabWriter.js';
import {
  tryParseResponse,
  isCompletedResult,
  isPartialResult,
  isErrorResponse,
  isWarningResponse,
  isActionResponse,
  isVersionResponse,
} from './katago-schema/index.js';

const MODEL_NAME = 'kata1-b18c384nbt-s9996604416-d4316597426.bin.gz';
const MODEL_PATH_GZ = '/work/model.bin.gz';
const MODEL_PATH_RAW = '/work/model.bin';
const CFG_PATH = '/work/analysis.cfg';

// Magic bytes:
//   gzip:        1f 8b
//   KataGo raw:  6b 61 74 61  ("kata")
//   HTML SPA:    3c 21        ("<!" — Vite returns index.html for missing paths)
const GZIP_MAGIC_0 = 0x1f;
const GZIP_MAGIC_1 = 0x8b;
const KATA_MAGIC = [0x6b, 0x61, 0x74, 0x61];

// SAB ring buffer for stdin
const sab = new SharedArrayBuffer(META_BYTES + STDIN_SIZE);
const meta = new Int32Array(sab, 0, 3);
const data = new Uint8Array(sab, META_BYTES, STDIN_SIZE);

// Blocking per-byte read for KataGo's stdin. Called synchronously from inside
// callMain — must return as soon as a byte is available, and may sleep on
// Atomics.wait until the main thread writes more.
// 한 번의 read() 호출에서 바이트를 이미 넘겼는지 추적한다.
// Emscripten createDevice 의 read 는 input() 이 null 을 줄 때까지 최대 length 만큼 계속
// 읽으려 한다. blocking input 이 한 줄을 다 넘긴 뒤 또 블로킹하면 read() 가 끝나지 않아
// 데드락이 난다(쿼리는 전달됐는데 KataGo 가 응답을 못 함). 그래서 가용 바이트를 다 넘긴
// 뒤엔 null 을 돌려 read() 가 '지금까지 읽은 만큼'을 반환하게 하고, 다음 호출부터 다시 블로킹.
let stdinBurst = false;
let stdinLineLen = 0;

function readByteFromSAB() {
  while (true) {
    const w = Atomics.load(meta, META_WRITE_IDX);
    const r = Atomics.load(meta, META_READ_IDX);
    if (w !== r) {
      const b = data[r % STDIN_SIZE];
      Atomics.add(meta, META_READ_IDX, 1);
      stdinBurst = true;
      stdinLineLen++;
      if (b === 10) {
        // 진단용: 쿼리 한 줄이 KataGo stdin 으로 온전히 전달됐는지 확인 (추후 제거 가능)
        self.postMessage({ type: 'log', stream: 'debug', line: `stdin ← 쿼리 ${stdinLineLen}바이트 전달` });
        stdinLineLen = 0;
      }
      // 반드시 '숫자' 바이트를 반환한다(문자열이면 타입배열에서 NaN→0 으로 깨짐).
      return b;
    }
    if (stdinBurst) {
      stdinBurst = false;
      return null; // 이번 read 를 종료시켜 데드락 방지
    }
    Atomics.wait(meta, META_WRITE_IDX, w); // 새 입력 대기 (블로킹)
  }
}

function syncFS(mod, populate) {
  return new Promise((res, rej) =>
    mod.FS.syncfs(populate, (err) => (err ? rej(err) : res())),
  );
}

function findCachedModelPath(mod) {
  if (mod.FS.analyzePath(MODEL_PATH_GZ).exists) return MODEL_PATH_GZ;
  if (mod.FS.analyzePath(MODEL_PATH_RAW).exists) return MODEL_PATH_RAW;
  return null;
}

function classifyStdout(line) {
  // 진단용: KataGo stdout 원문(앞부분)을 그대로 보여줘 응답 도착 여부를 확인 (추후 제거 가능)
  self.postMessage({
    type: 'log',
    stream: 'stdout-raw',
    line: line.length > 200 ? line.slice(0, 200) + '…' : line,
  });
  const parsed = tryParseResponse(line);
  if (!parsed.ok) {
    self.postMessage({ type: 'log', stream: 'stdout', line });
    return;
  }
  const r = parsed.response;
  if (isCompletedResult(r)) {
    self.postMessage({ type: 'result', response: r });
  } else if (isPartialResult(r)) {
    self.postMessage({ type: 'partial', response: r });
  } else if (isErrorResponse(r)) {
    self.postMessage({ type: 'queryError', response: r });
  } else if (isVersionResponse(r)) {
    self.postMessage({ type: 'version', response: r });
  } else if (isActionResponse(r)) {
    self.postMessage({ type: 'action', response: r });
  } else if (isWarningResponse(r)) {
    self.postMessage({ type: 'warning', response: r });
  } else {
    self.postMessage({ type: 'log', stream: 'stdout', line });
  }
}

async function run() {
  self.postMessage({ type: 'sab', sab });
  self.postMessage({ type: 'status', message: 'KataGo WASM 로딩 중...' });

  // The Emscripten glue exports a default factory. @vite-ignore keeps Vite
  // from trying to statically analyze its non-standard ESM shape.
  const { default: createKataGo } = await import(
    /* @vite-ignore */ './katago.js'
  );

  const moduleArg = {
    noInitialRun: true,
    locateFile: (path) => (path.endsWith('.wasm') ? wasmUrl : path),
    stdin: readByteFromSAB,
    print: (line) => classifyStdout(line),
    printErr: (line) =>
      self.postMessage({ type: 'log', stream: 'stderr', line }),
    onAbort: (reason) =>
      self.postMessage({
        type: 'fatal',
        message: `abort: ${String(reason)}`,
      }),
  };

  const Module = await createKataGo(moduleArg);

  try {
    Module.FS.mkdir('/work');
  } catch {
    // already exists on subsequent boots
  }
  Module.FS.mount(Module.IDBFS, {}, '/work');
  self.postMessage({ type: 'status', message: 'IndexedDB 동기화 중...' });
  await syncFS(Module, true);

  let modelPath = findCachedModelPath(Module);

  if (modelPath === null) {
    self.postMessage({
      type: 'status',
      message: '모델 다운로드 중 (b18, ~94MB)...',
    });

    const res = await fetch(`/model/${MODEL_NAME}`);
    if (!res.ok) throw new Error(`모델 다운로드 실패: ${res.status}`);
    const modelCt = res.headers.get('content-type') ?? '';
    // Vite's SPA fallback returns 200 + text/html(index.html) for missing files.
    if (modelCt.includes('text/html')) {
      throw new Error(
        `모델 응답이 HTML입니다 (SPA fallback 추정). ` +
          `public/model/${MODEL_NAME} 파일을 확인하세요. content-type=${modelCt}`,
      );
    }

    const total = Number(res.headers.get('Content-Length') ?? 0);
    const reader = res.body.getReader();
    const chunks = [];
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      self.postMessage({ type: 'progress', received, total });
    }

    const bytes = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }

    const isGzip = bytes[0] === GZIP_MAGIC_0 && bytes[1] === GZIP_MAGIC_1;
    const isRaw =
      bytes[0] === KATA_MAGIC[0] &&
      bytes[1] === KATA_MAGIC[1] &&
      bytes[2] === KATA_MAGIC[2] &&
      bytes[3] === KATA_MAGIC[3];

    if (!isGzip && !isRaw) {
      const head4 = Array.from(bytes.slice(0, 4))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(' ');
      throw new Error(
        `알 수 없는 모델 포맷. 첫 4바이트=${head4}. ` +
          `(gzip=1f 8b, raw='kata' 6b 61 74 61, '<!' 3c 21=HTML)`,
      );
    }

    // KataGo decides gzip vs raw by file extension.
    modelPath = isGzip ? MODEL_PATH_GZ : MODEL_PATH_RAW;
    Module.FS.writeFile(modelPath, bytes);
    self.postMessage({
      type: 'status',
      message: 'IndexedDB에 모델 저장 중...',
    });
    await syncFS(Module, false);
  }

  const cfgRes = await fetch('/analysis.cfg');
  if (!cfgRes.ok) throw new Error(`cfg fetch 실패: ${cfgRes.status}`);
  const cfgCt = cfgRes.headers.get('content-type') ?? '';
  const cfgText = await cfgRes.text();
  if (cfgCt.includes('text/html') || cfgText.trimStart().startsWith('<')) {
    throw new Error(
      `cfg 응답이 HTML입니다 (SPA fallback 추정). ` +
        `public/analysis.cfg 파일을 확인하세요. content-type=${cfgCt}`,
    );
  }
  Module.FS.writeFile(CFG_PATH, cfgText);

  self.postMessage({ type: 'ready' });

  // Blocks the worker thread permanently. stdin/stdout flow via SAB and the
  // print/printErr callbacks above.
  Module.callMain(['analysis', '-config', CFG_PATH, '-model', modelPath]);

  // If callMain ever returns, KataGo exited unexpectedly.
  self.postMessage({
    type: 'fatal',
    message: 'KataGo 프로세스가 예기치 않게 종료됨',
  });
}

run().catch((err) =>
  self.postMessage({
    type: 'fatal',
    message: String(err?.message ?? err),
  }),
);
