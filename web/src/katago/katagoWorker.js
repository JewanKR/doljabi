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
const katagoModuleUrl = new URL('./katago.js', import.meta.url).href;

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

// stdin 은 더 이상 Emscripten TTY(프록시 대상)를 거치지 않는다. PROXY_TO_PTHREAD 에서
// TTY 읽기를 블로킹하면 이 워커(프록시 서버)가 멈춰 엔진의 프록시된 cout 출력이 막힌다.
// 대신 페이지가 보낸 쿼리 한 줄을 공유 wasm 메모리 링으로 직접 밀어넣고(kata_stdin_push),
// 엔진 pthread 가 자기 스레드에서 블로킹-읽기 하므로 이 워커는 자유로워진다.
let katagoModule = null;
const stdinEncoder = new TextEncoder();

self.addEventListener('message', (e) => {
  const msg = e.data;
  if (!msg || msg.type !== 'stdin' || !katagoModule) return;
  const line = msg.line.endsWith('\n') ? msg.line : msg.line + '\n';
  const bytes = stdinEncoder.encode(line);
  katagoModule.ccall('kata_stdin_push', null, ['array', 'number'], [bytes, bytes.length]);
});

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
  self.postMessage({ type: 'status', message: 'KataGo WASM 로딩 중...' });

  // The Emscripten glue exports a default factory. @vite-ignore keeps Vite
  // from trying to statically analyze its non-standard ESM shape.
  const { default: createKataGo } = await import(
    /* @vite-ignore */ katagoModuleUrl
  );

  const moduleArg = {
    noInitialRun: true,
    mainScriptUrlOrBlob: katagoModuleUrl,
    locateFile: (path) => (path.endsWith('.wasm') ? wasmUrl : path),
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
  katagoModule = Module; // stdin 메시지 핸들러가 ccall 할 수 있도록 노출

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

  // PROXY_TO_PTHREAD: callMain 은 main() 을 전용 pthread 에 올리고 즉시 리턴한다(블로킹 X).
  // 엔진은 그 pthread 에서 계속 돌고, 이 워커는 프록시 서버로 살아남아 엔진의 프록시된
  // cout 출력을 처리한다. 따라서 리턴을 '종료'로 보지 않는다.
  Module.callMain(['analysis', '-config', CFG_PATH, '-model', modelPath]);
}

run().catch((err) =>
  self.postMessage({
    type: 'fatal',
    message: String(err?.message ?? err),
  }),
);
