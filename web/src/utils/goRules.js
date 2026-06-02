/**
 * 수순(move list)을 N수까지 재생해 그 시점의 판 위치를 돌려준다.
 *
 * - 바둑(go): 착수 후 따냄(capture) 규칙을 적용한다.
 *   방금 둔 돌에 인접한 상대 그룹의 활로가 0이면 그 그룹을 들어낸다.
 * - 오목(omok): 따냄이 없으므로 단순 누적한다.
 *
 * 서버가 이미 합법수만 보내므로 자살수(suicide)는 고려하지 않는다.
 *
 * @param {{ color: 'black'|'white', col?: number, row?: number }[]} moves
 *        col/row가 없으면 착수(pass 등)로 보고 건너뛴다.
 * @param {number|null} upto 재생할 수의 개수 (null이면 전체)
 * @param {number} size 보드 한 변의 점 개수 (바둑 19, 오목 15)
 * @param {'go'|'omok'} gameType
 * @returns {{ col: number, row: number, color: 'black'|'white' }[]}
 */
export function replay(moves, upto, size, gameType = 'go') {
  const n = upto == null ? moves.length : Math.min(Math.max(0, upto), moves.length);
  const grid = new Array(size * size).fill(null); // null | 'black' | 'white'
  const idx = (c, r) => r * size + c;
  const inB = (c, r) => c >= 0 && c < size && r >= 0 && r < size;
  const opp = (c) => (c === 'black' ? 'white' : 'black');

  // (c,r)에 둔 color 돌 기준, 인접 상대 그룹 중 활로 0인 그룹을 제거한다.
  const captureAround = (c, r, color) => {
    const enemy = opp(color);
    for (const [nc, nr] of [[c + 1, r], [c - 1, r], [c, r + 1], [c, r - 1]]) {
      if (!inB(nc, nr) || grid[idx(nc, nr)] !== enemy) continue;

      // 상대 그룹을 flood-fill로 모으면서 활로 유무를 확인
      const group = [];
      const seen = new Set();
      const stack = [[nc, nr]];
      let hasLiberty = false;
      while (stack.length) {
        const [gc, gr] = stack.pop();
        const k = idx(gc, gr);
        if (seen.has(k)) continue;
        seen.add(k);
        group.push(k);
        for (const [ac, ar] of [[gc + 1, gr], [gc - 1, gr], [gc, gr + 1], [gc, gr - 1]]) {
          if (!inB(ac, ar)) continue;
          const v = grid[idx(ac, ar)];
          if (v === null) hasLiberty = true;
          else if (v === enemy) stack.push([ac, ar]);
        }
      }
      if (!hasLiberty) for (const k of group) grid[k] = null;
    }
  };

  for (let i = 0; i < n; i++) {
    const m = moves[i];
    if (!m || m.col == null || m.row == null) continue; // pass 등
    if (!inB(m.col, m.row)) continue;
    grid[idx(m.col, m.row)] = m.color;
    if (gameType !== 'omok') captureAround(m.col, m.row, m.color);
  }

  const stones = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const color = grid[idx(c, r)];
      if (color) stones.push({ col: c, row: r, color });
    }
  }
  return stones;
}
