/**
 * SGF (Smart Game Format) FF[4] serializer/parser for Go (Baduk).
 *
 * Reference: https://www.red-bean.com/sgf/
 *
 * History item shape (used throughout the app, see GamePlay.jsx):
 *   { col: number, row: number, color: 'black'|'white' }
 *
 *   - col, row: 0-based board indices (0..size-1); (0,0) is the top-left
 *     intersection, which matches the SGF coordinate origin.
 *   - color:   'black' | 'white'.
 *   - A pass move can be expressed as { col: -1, row: -1, color, pass: true }
 *     or by passing `null`/`undefined` for col/row.
 *
 * SGF coordinate system: letters 'a'..'s' for a 19x19 board, where 'a' is the
 * first column/row. An empty value (`B[]` / `W[]`) is a pass.
 */

const SGF_LETTERS = 'abcdefghijklmnopqrstuvwxyz';

// ---------------------------------------------------------------------------
// Low-level helpers
// ---------------------------------------------------------------------------

/**
 * Encode a board coordinate to SGF letter notation.
 * Returns '' for a pass move (out-of-range / null coordinates).
 */
const toSgfCoord = (col, row, size = 19) => {
  if (col == null || row == null) return '';
  if (col < 0 || row < 0 || col >= size || row >= size) return '';
  return SGF_LETTERS[col] + SGF_LETTERS[row];
};

/**
 * Decode an SGF coordinate string into { col, row, pass }.
 * Empty string is a pass. For sizes <= 19, the legacy 'tt' is also treated
 * as a pass per the FF[4] spec.
 */
const fromSgfCoord = (str, size = 19) => {
  if (!str || (size <= 19 && str === 'tt')) {
    return { col: -1, row: -1, pass: true };
  }
  const col = SGF_LETTERS.indexOf(str[0]);
  const row = SGF_LETTERS.indexOf(str[1]);
  return { col, row, pass: col < 0 || row < 0 };
};

/**
 * Escape a value for SGF property text. The characters that must be escaped
 * inside `[...]` are `\` and `]`.
 */
const escapeText = (text = '') =>
  String(text).replace(/\\/g, '\\\\').replace(/]/g, '\\]');

/**
 * Format a Date (or anything `new Date()` accepts) as `YYYY-MM-DD`.
 * Returns '' for an invalid date.
 */
const formatSgfDate = (d = new Date()) => {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

/**
 * Format an SGF RE (result) property value.
 *
 * Accepts either a ready-made string (e.g. 'B+R', 'W+5.5', 'Draw') or an
 * object like { winner: 'black'|'white'|'draw', method?: 'R'|'T'|'F', score?: number }.
 *
 *   method 'R' = resign, 'T' = timeout/forfeit on time, 'F' = forfeit, 'Score'
 *
 * Returns '' if not enough info to form a result.
 */
const formatResult = (result) => {
  if (!result) return '';
  if (typeof result === 'string') return result;
  const { winner, method, score } = result;
  if (winner === 'draw' || winner === 0) return '0';
  const side = winner === 'black' ? 'B' : winner === 'white' ? 'W' : '';
  if (!side) return '';
  if (method === 'R' || method === 'resign') return `${side}+R`;
  if (method === 'T' || method === 'time' || method === 'timeout') return `${side}+T`;
  if (method === 'F' || method === 'forfeit') return `${side}+F`;
  if (score != null && !Number.isNaN(Number(score))) return `${side}+${score}`;
  return `${side}+`;
};

/**
 * Serialize just the move sequence to SGF nodes (e.g. ';B[pd];W[dp]').
 * Pass moves serialize as `B[]` / `W[]`.
 */
const movesToSgf = (history = [], size = 19) =>
  history
    .map(({ col, row, color }) => {
      const tag = color === 'black' || color === 'B' ? 'B' : 'W';
      return `;${tag}[${toSgfCoord(col, row, size)}]`;
    })
    .join('');

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Build a full SGF FF[4] document from move history + metadata.
 *
 * @param {Array<{col:number,row:number,color:'black'|'white'}>} history
 * @param {Object} [options]
 * @param {number}  [options.size=19]       - Board size (SZ).
 * @param {number}  [options.handicap]      - Handicap stones (HA), >= 2.
 * @param {number}  [options.komi]          - Komi (KM).
 * @param {string}  [options.ruleset]       - 'Japanese' | 'Chinese' | 'Korean' | 'AGA' | ...
 * @param {number}  [options.timeLimit]     - Main time in seconds (TM).
 * @param {string}  [options.overtime]      - Overtime description (OT).
 * @param {string}  [options.blackName]     - PB (player name).
 * @param {string}  [options.whiteName]     - PW.
 * @param {string}  [options.blackRank]     - BR (e.g. '5k', '3d').
 * @param {string}  [options.whiteRank]     - WR.
 * @param {Date|string} [options.date=new Date()] - DT, formatted as YYYY-MM-DD.
 * @param {string}  [options.event]         - EV.
 * @param {string}  [options.round]         - RO.
 * @param {string}  [options.place]         - PC.
 * @param {string}  [options.gameName]      - GN.
 * @param {string}  [options.gameComment]   - GC.
 * @param {string|{winner,method,score}} [options.result] - RE.
 * @param {string}  [options.application='doljabi:1.0'] - AP.
 * @param {string}  [options.charset='UTF-8']           - CA.
 * @param {Array<{col,row}>} [options.addBlack=[]] - Setup black stones (AB).
 * @param {Array<{col,row}>} [options.addWhite=[]] - Setup white stones (AW).
 * @returns {string} SGF text.
 */
export const buildSgf = (history = [], options = {}) => {
  const {
    size = 19,
    handicap,
    komi,
    ruleset,
    timeLimit,
    overtime,
    blackName,
    whiteName,
    blackRank,
    whiteRank,
    date = new Date(),
    event,
    round,
    place,
    gameName,
    gameComment,
    result,
    application = 'doljabi:1.0',
    charset = 'UTF-8',
    addBlack = [],
    addWhite = [],
  } = options;

  const props = [];
  // Root node — order follows common SGF conventions for readability.
  props.push('GM[1]');
  props.push('FF[4]');
  props.push(`CA[${escapeText(charset)}]`);
  props.push(`AP[${escapeText(application)}]`);
  props.push(`SZ[${size}]`);
  if (handicap != null && handicap >= 2) props.push(`HA[${handicap}]`);
  if (komi != null && !Number.isNaN(Number(komi))) props.push(`KM[${komi}]`);
  if (ruleset) props.push(`RU[${escapeText(ruleset)}]`);
  if (timeLimit != null && !Number.isNaN(Number(timeLimit))) props.push(`TM[${timeLimit}]`);
  if (overtime) props.push(`OT[${escapeText(overtime)}]`);
  if (blackName) props.push(`PB[${escapeText(blackName)}]`);
  if (whiteName) props.push(`PW[${escapeText(whiteName)}]`);
  if (blackRank) props.push(`BR[${escapeText(blackRank)}]`);
  if (whiteRank) props.push(`WR[${escapeText(whiteRank)}]`);
  const dt = formatSgfDate(date);
  if (dt) props.push(`DT[${dt}]`);
  if (event) props.push(`EV[${escapeText(event)}]`);
  if (round) props.push(`RO[${escapeText(round)}]`);
  if (place) props.push(`PC[${escapeText(place)}]`);
  if (gameName) props.push(`GN[${escapeText(gameName)}]`);
  if (gameComment) props.push(`GC[${escapeText(gameComment)}]`);
  const re = formatResult(result);
  if (re) props.push(`RE[${escapeText(re)}]`);

  if (Array.isArray(addBlack) && addBlack.length > 0) {
    const ab = addBlack.map(({ col, row }) => `[${toSgfCoord(col, row, size)}]`).join('');
    props.push(`AB${ab}`);
  }
  if (Array.isArray(addWhite) && addWhite.length > 0) {
    const aw = addWhite.map(({ col, row }) => `[${toSgfCoord(col, row, size)}]`).join('');
    props.push(`AW${aw}`);
  }

  const rootNode = `;${props.join('')}`;
  const moves = movesToSgf(history, size);
  return `(${rootNode}${moves})`;
};

/**
 * Backwards-compatible wrapper around `buildSgf` — preserves the original
 * signature used by AiAnalysis.jsx.
 */
export const historyToSgf = (history, size = 19) => buildSgf(history, { size });

/**
 * Compose a sensible default filename from metadata + date.
 *   game_2026-05-26_Black-vs-White.sgf
 */
export const defaultSgfFilename = ({ blackName, whiteName, date = new Date() } = {}) => {
  const safe = (s) => String(s ?? '').replace(/[\\/:*?"<>|\s]+/g, '_').replace(/^_+|_+$/g, '');
  const stamp = formatSgfDate(date);
  const b = safe(blackName);
  const w = safe(whiteName);
  const players = b && w ? `_${b}-vs-${w}` : '';
  return `game_${stamp}${players}.sgf`;
};

/**
 * Trigger a browser download of an SGF string. No-op in non-browser envs.
 */
export const downloadSgf = (sgf, filename = 'game.sgf') => {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return;
  const blob = new Blob([sgf], { type: 'application/x-go-sgf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after the click cycle finishes so the download actually starts.
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

/**
 * Convenience: build SGF and trigger download in one call.
 * Returns the SGF text that was downloaded.
 */
export const saveHistoryAsSgf = (history, options = {}) => {
  const sgf = buildSgf(history, options);
  const filename = options.filename || defaultSgfFilename(options);
  downloadSgf(sgf, filename);
  return sgf;
};

/**
 * Minimal SGF reader — extracts root-level properties and the main-line move
 * sequence. Variations are flattened (only the first child is followed),
 * which is enough to round-trip files produced by `buildSgf`.
 *
 * @param {string} sgf
 * @returns {{ size:number, properties:Object<string,string|string[]>, history:Array }}
 */
export const parseSgf = (sgf) => {
  const text = String(sgf || '');
  const properties = {};
  const history = [];

  // Walks every `KEY[value]` (or `KEY[v1][v2]...`) occurrence in document order
  // and classifies them. Move properties (B/W) become history entries; everything
  // else is stored under `properties`.
  const propRegex = /([A-Z]{1,2})((?:\[(?:\\.|[^\]])*\])+)/g;
  const valueRegex = /\[((?:\\.|[^\]])*)\]/g;

  let match;
  while ((match = propRegex.exec(text)) !== null) {
    const key = match[1];
    const raw = match[2];

    const values = [];
    let v;
    valueRegex.lastIndex = 0;
    while ((v = valueRegex.exec(raw)) !== null) {
      values.push(v[1].replace(/\\([\\\]])/g, '$1'));
    }

    if (key === 'B' || key === 'W') {
      for (const val of values) {
        const { col, row, pass } = fromSgfCoord(val);
        history.push({ col, row, color: key === 'B' ? 'black' : 'white', pass });
      }
    } else if (key === 'AB' || key === 'AW') {
      properties[key] = values.map((val) => {
        const { col, row, pass } = fromSgfCoord(val);
        return { col, row, pass };
      });
    } else {
      properties[key] = values.length > 1 ? values : values[0];
    }
  }

  const size = properties.SZ ? parseInt(properties.SZ, 10) || 19 : 19;
  return { size, properties, history };
};

// Re-exported helpers for tests / advanced callers.
export {
  toSgfCoord,
  fromSgfCoord,
  escapeText,
  formatSgfDate,
  formatResult,
  movesToSgf,
};
