const SGF_LETTERS = 'abcdefghijklmnopqrs';

const toSgfCoord = (col, row) => SGF_LETTERS[col] + SGF_LETTERS[row];

export const historyToSgf = (history, size = 19) => {
  const moves = history
    .map(({ col, row, color }) => `;${color === 'black' ? 'B' : 'W'}[${toSgfCoord(col, row)}]`)
    .join('');
  return `(;GM[1]FF[4]SZ[${size}]${moves})`;
};

export const downloadSgf = (sgf, filename = 'game.sgf') => {
  const blob = new Blob([sgf], { type: 'application/x-go-sgf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const sgfLetterToIndex = (ch) => ch.charCodeAt(0) - 97; // 'a' -> 0

/**
 * SGF 문자열 파싱 (바둑 전용, 분기 없는 직선 기보 가정).
 * 좌표 규약은 historyToSgf와 동일: SGF 'a'=0, col=첫 글자, row=둘째 글자(행 0 = 위쪽).
 *
 * 따냄(capture)은 여기서 적용하지 않는다 — 화면에 표시할 때 goRules의 replay()로 적용한다.
 *
 * @param {string} text SGF 본문
 * @returns {{
 *   size: number,
 *   gameType: 'go'|'omok',
 *   result: string,
 *   players: { black: string, white: string },
 *   moves: { color: 'black'|'white', col?: number, row?: number, pass?: boolean }[]
 * }}
 */
export const parseSgf = (text) => {
  const str = String(text ?? '');
  const rootProp = (name) => {
    const m = str.match(new RegExp(`${name}\\[([^\\]]*)\\]`));
    return m ? m[1] : null;
  };

  const size = parseInt(rootProp('SZ') ?? '19', 10) || 19;
  const gm = parseInt(rootProp('GM') ?? '1', 10);
  const result = rootProp('RE') ?? '';
  const players = { black: rootProp('PB') ?? '', white: rootProp('PW') ?? '' };

  const moves = [];
  // 수순 노드: ;B[xx] / ;W[xx]  (PB[]/PW[] 같은 루트 속성과 겹치지 않도록 ';' 를 요구)
  const moveRe = /;\s*([BW])\[([a-z]{0,2})\]/g;
  let m;
  while ((m = moveRe.exec(str)) !== null) {
    const color = m[1] === 'B' ? 'black' : 'white';
    const coord = m[2];
    // 빈 좌표(B[]) 또는 보드 밖(tt 등) → 패스로 취급 (돌을 놓지 않음)
    if (coord.length < 2) {
      moves.push({ color, pass: true });
      continue;
    }
    const col = sgfLetterToIndex(coord[0]);
    const row = sgfLetterToIndex(coord[1]);
    if (col < 0 || col >= size || row < 0 || row >= size) {
      moves.push({ color, pass: true });
      continue;
    }
    moves.push({ color, col, row });
  }

  return { size, gameType: gm === 1 ? 'go' : 'omok', result, players, moves };
};
