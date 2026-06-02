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
