const COLS = ['A','B','C','D','E','F','G','H','J','K','L','M','N','O','P','Q','R','S','T'];
const CELL = 28;
const ML = 28; // left margin (row numbers)
const MT = 22; // top margin (col letters)

/**
 * 보드 크기별 화점(star point) 좌표 (0-based).
 * 19=9점(표준 바둑), 15=4귀+천원(오목), 그 외 홀수 보드는 4귀+중앙.
 */
function getStarPoints(size) {
  if (size === 19) {
    return [
      [3, 3], [3, 9], [3, 15],
      [9, 3], [9, 9], [9, 15],
      [15, 3], [15, 9], [15, 15],
    ];
  }
  if (size === 15) {
    return [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]];
  }
  if (size >= 9 && size % 2 === 1) {
    const e = size >= 13 ? 3 : 2;
    const c = (size - 1) / 2;
    return [[e, e], [e, size - 1 - e], [c, c], [size - 1 - e, e], [size - 1 - e, size - 1 - e]];
  }
  return [];
}

/**
 * @param {{ col: number, row: number, color: 'black'|'white' }[]} stones
 * @param {{ col: number, row: number, type?: 'dashed'|'dot' }[]} markers
 * @param {string} className
 * @param {{ col: number, row: number } | null} pending - 선택 대기 중인 좌표
 * @param {(coord: { col: number, row: number }) => void} onIntersectionClick
 * @param {number} size - 보드 한 변의 점 개수 (바둑 19, 오목 15)
 */
export const GoBoard = ({ stones = [], markers = [], className = '', pending = null, onIntersectionClick, size = 19 }) => {
  const last = size - 1;
  const boardPx = last * CELL;
  const W = boardPx + ML + 14;
  const H = boardPx + MT + 14;

  const cx = (col) => ML + col * CELL;
  const cy = (row) => MT + row * CELL;

  const stars = getStarPoints(size);
  const stoneSet = new Set(stones.map(s => `${s.col},${s.row}`));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      preserveAspectRatio="xMidYMid meet"
      className={`block ${className}`}
      style={{ maxWidth: '100%', height: 'auto' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 보드 배경 */}
      <rect width={W} height={H} fill="var(--md-sys-color-tertiary-fixed, #ffdcc3)" rx="8" />

      {/* 격자선 */}
      {Array.from({ length: size }, (_, i) => (
        <g key={i}>
          <line x1={cx(0)} y1={cy(i)} x2={cx(last)} y2={cy(i)} stroke="rgba(58,42,16,0.75)" strokeWidth="1" />
          <line x1={cx(i)} y1={cy(0)} x2={cx(i)} y2={cy(last)} stroke="rgba(58,42,16,0.75)" strokeWidth="1" />
        </g>
      ))}

      {/* 외곽 테두리 */}
      <rect x={cx(0)} y={cy(0)} width={boardPx} height={boardPx} fill="none" stroke="rgba(58,42,16,0.4)" strokeWidth="1" />

      {/* 화점 */}
      {stars.map(([col, row]) => (
        <circle key={`star-${col}-${row}`} cx={cx(col)} cy={cy(row)} r={3} fill="rgba(58,42,16,0.75)" />
      ))}

      {/* 열 좌표 (A~) */}
      {Array.from({ length: size }, (_, i) => (
        <text key={`col-${i}`} x={cx(i)} y={MT - 7} textAnchor="middle" fontSize="10" fontWeight="bold" fill="rgba(58,42,16,0.85)">
          {COLS[i]}
        </text>
      ))}

      {/* 행 좌표 (size~1) */}
      {Array.from({ length: size }, (_, i) => (
        <text key={`row-${i}`} x={ML - 6} y={cy(i) + 4} textAnchor="end" fontSize="10" fontWeight="bold" fill="rgba(58,42,16,0.85)">
          {size - i}
        </text>
      ))}

      {/* 클릭 영역 */}
      {onIntersectionClick && Array.from({ length: size }, (_, row) =>
        Array.from({ length: size }, (_, col) => (
          <rect
            key={`click-${col}-${row}`}
            x={cx(col) - CELL / 2} y={cy(row) - CELL / 2}
            width={CELL} height={CELL}
            fill="transparent"
            style={{ cursor: stoneSet.has(`${col},${row}`) ? 'default' : 'pointer' }}
            onClick={() => !stoneSet.has(`${col},${row}`) && onIntersectionClick({ col, row })}
          />
        ))
      )}

      {/* 돌 */}
      {stones.map(({ col, row, color }, idx) => (
        <circle
          key={`stone-${idx}`}
          cx={cx(col)} cy={cy(row)} r={12}
          fill={color === 'black' ? '#1a1a1a' : 'white'}
          stroke={color === 'black' ? 'rgba(255,255,255,0.12)' : 'rgba(58,42,16,0.3)'}
          strokeWidth="1"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))' }}
        />
      ))}

      {/* 선택 대기 중인 위치 */}
      {pending && !stoneSet.has(`${pending.col},${pending.row}`) && (
        <circle
          cx={cx(pending.col)} cy={cy(pending.row)} r={12}
          fill="rgba(103,80,164,0.45)"
          stroke="rgba(103,80,164,0.8)"
          strokeWidth="2"
        />
      )}

      {/* 분석 마커 */}
      {markers.map(({ col, row, type = 'dashed' }, idx) => (
        type === 'dot'
          ? <circle key={`marker-${idx}`} cx={cx(col)} cy={cy(row)} r={5} fill="var(--md-sys-color-primary, #6750a4)" opacity="0.7" />
          : <circle key={`marker-${idx}`} cx={cx(col)} cy={cy(row)} r={13} fill="none" stroke="var(--md-sys-color-primary, #6750a4)" strokeWidth="3" strokeDasharray="5 3" />
      ))}
    </svg>
  );
};
