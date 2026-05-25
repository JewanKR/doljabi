# sgf-render WebAssembly demo

브라우저에서 sgf-render를 실행하는 데모입니다.

## 빌드

처음 한 번 — rustc에 WASM 타깃 추가 및 wasm-pack 설치:

```bash
rustup target add wasm32-unknown-unknown
cargo install wasm-pack
```

이후 WASM 번들 빌드:

```bash
# Linux / macOS
./scripts/build-wasm.sh

# Windows (PowerShell)
.\scripts\build-wasm.ps1
```

빌드 스크립트는 `wasm32-unknown-unknown` 타깃이 없으면 자동으로 `rustup target add`를 실행합니다.
결과는 `pkg/` 폴더에 `sgf_render.js`, `sgf_render_bg.wasm` 등으로 생성됩니다.

수동으로 돌리려면:

```bash
wasm-pack build --target web --release --no-default-features --features wasm
```

## 실행

ES Module을 쓰기 때문에 `file://` 로는 동작하지 않습니다. 간단한 정적 서버가 필요합니다.

```bash
# 저장소 루트에서
python3 -m http.server 8000
# 또는: npx serve .
```

브라우저에서 <http://localhost:8000/demo-wasm/> 를 엽니다.

## JavaScript API

```js
import init, { renderSgf, version } from "./pkg/sgf_render.js";

await init();             // .wasm 로드
console.log(version());   // 라이브러리 버전

const svg = renderSgf(sgfString, {
  // 모두 선택. 기본값은 CLI와 동일.
  width: 800,
  style: "simple",         // "simple" | "fancy" | "minimalist"
  variation: 0,
  nodeNumber: "last",      // "last" 또는 숫자(문자열로)
  shrinkWrap: false,
  range: "cc-ff",          // optional
  labelSides: "nw",        // "" 면 라벨 없음
  noBoardLabels: false,
  moveNumbers: "1-50",     // true | number | "1-50"
  moveNumbersFrom: 1,
  kifu: false,
  lenient: false,
  // 마크업 토글 (각각 기본 true)
  drawMarks: true, drawTriangles: true, drawCircles: true,
  drawSquares: true, drawSelected: true, drawDimmed: true,
  drawLabels: true, drawLines: true, drawArrows: true,
  noPointMarkup: false,
});
```

`renderSgf`는 SVG 문자열을 반환합니다. SGF 파싱이나 옵션이 잘못되면 JS `Error` 를 던집니다.
