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
