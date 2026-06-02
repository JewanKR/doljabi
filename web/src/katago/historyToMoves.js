/**
 * Coordinate conversion between doljabi history entries and KataGo GTP moves.
 *
 * doljabi history entry: { color: 'black' | 'white', col: number, row: number }
 *   col: 0-based from left  (0 = 'A', 8 = 'J' — letter 'I' is skipped)
 *   row: 0-based from top   (0 = topmost row on screen)
 *
 * KataGo GTP move: [Color, Location]
 *   Color:    'B' | 'W'
 *   Location: 'Q16' (column letter + 1-based row counted from the bottom)
 *             or 'pass'
 */

export const COLS_LABEL = 'ABCDEFGHJKLMNOPQRST';
export const BOARD_SIZE_DEFAULT = 19;

export function colorToGtp(color) {
  if (color === 'black') return 'B';
  if (color === 'white') return 'W';
  throw new Error(`Unknown color: ${color}`);
}

export function colRowToGtp(col, row, size = BOARD_SIZE_DEFAULT) {
  const letter = COLS_LABEL[col];
  if (letter === undefined) {
    throw new Error(`Column out of range: ${col}`);
  }
  return `${letter}${size - row}`;
}

export function gtpToColRow(loc, size = BOARD_SIZE_DEFAULT) {
  if (typeof loc !== 'string' || loc.length < 2) return null;
  const lower = loc.toLowerCase();
  if (lower === 'pass' || lower === 'resign') return null;
  const col = COLS_LABEL.indexOf(loc[0].toUpperCase());
  if (col < 0) return null;
  const n = parseInt(loc.slice(1), 10);
  if (Number.isNaN(n)) return null;
  return { col, row: size - n };
}

export function historyToKatagoMoves(history, size = BOARD_SIZE_DEFAULT) {
  return history.map((stone) => [
    colorToGtp(stone.color),
    colRowToGtp(stone.col, stone.row, size),
  ]);
}

export function prefixMoves(history, turn, size = BOARD_SIZE_DEFAULT) {
  return historyToKatagoMoves(history.slice(0, turn), size);
}

/**
 * KataGo 후보수의 PV(예상 진행)를 보드에 그릴 돌 배열로 변환한다.
 *
 * PV는 GTP 좌표 문자열의 나열(["D16","Q4",...])이며 첫 수부터 색을 교대한다.
 * 보드 미리보기용으로 좌표를 풀고 진행 순번(moveNo, 1-based)을 붙인다.
 *
 * @param {string[]} pv KataGo moveInfo.pv
 * @param {'black'|'white'} firstColor PV 첫 수의 색(둘 차례)
 * @param {number} size 보드 한 변의 점 개수
 * @param {number} [maxLen=12] 표시할 최대 길이
 * @returns {{ col: number, row: number, color: 'black'|'white', moveNo: number }[]}
 */
export function pvToStones(pv, firstColor, size = BOARD_SIZE_DEFAULT, maxLen = 12) {
  if (!Array.isArray(pv)) return [];
  const stones = [];
  let color = firstColor;
  for (const gtp of pv) {
    if (stones.length >= maxLen) break;
    const c = gtpToColRow(gtp, size); // pass/resign 등은 null
    if (c) stones.push({ col: c.col, row: c.row, color, moveNo: stones.length + 1 });
    color = color === 'black' ? 'white' : 'black';
  }
  return stones;
}
