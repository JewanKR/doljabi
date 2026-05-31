const COLS = ['A','B','C','D','E','F','G','H','J','K','L','M','N','O','P','Q','R','S','T'];
const CELL = 28;
const ML = 28; // left margin (row numbers)
const MT = 22; // top margin (col letters)
const SIZE = 18 * CELL; // 504
const W = SIZE + ML + 14;
const H = SIZE + MT + 14;

const STAR_POINTS = [
  [2,2],[2,8],[2,14],
  [8,2],[8,8],[8,14],
  [14,2],[14,8],[14,14]
];

const cx = (col) => ML + col * CELL;
const cy = (row) => MT + row * CELL;

/**
 * @param {{ col: number, row: number, color: 'black'|'white' }[]} stones
 * @param {{ col: number, row: number, type?: 'dashed'|'dot' }[]} markers
 * @param {string} className
 * @param {{ col: number, row: number } | null} pending - 선택 대기 중인 좌표
 * @param {(coord: { col: number, row: number }) => void} onIntersectionClick
 */
export const GoBoard = ({ stones = [], markers = [], className = '', pending = null, onIntersectionClick }) => {
  const stoneSet = new Set(stones.map(s => `${s.col},${s.row}`));

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      height="auto"
      preserveAspectRatio="xMidYMid meet"
      className={`block ${className}`}
      style={{ maxWidth: '100%' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* 보드 배경 */}
      <rect width={W} height={H} fill="var(--md-sys-color-tertiary-fixed, #ffdcc3)" rx="8" />

      {/* 격자선 */}
      {Array.from({ length: 19 }, (_, i) => (
        <g key={i}>
          <line x1={cx(0)} y1={cy(i)} x2={cx(18)} y2={cy(i)} stroke="rgba(58,42,16,0.75)" strokeWidth="1" />
          <line x1={cx(i)} y1={cy(0)} x2={cx(i)} y2={cy(18)} stroke="rgba(58,42,16,0.75)" strokeWidth="1" />
        </g>
      ))}

      {/* 외곽 테두리 */}
      <rect x={cx(0)} y={cy(0)} width={SIZE} height={SIZE} fill="none" stroke="rgba(58,42,16,0.4)" strokeWidth="1" />

      {/* 화점 */}
      {STAR_POINTS.map(([col, row]) => (
        <circle key={`star-${col}-${row}`} cx={cx(col)} cy={cy(row)} r={3} fill="rgba(58,42,16,0.75)" />
      ))}

      {/* 열 좌표 (A~T) */}
      {COLS.map((label, i) => (
        <text key={label} x={cx(i)} y={MT - 7} textAnchor="middle" fontSize="10" fontWeight="bold" fill="rgba(58,42,16,0.85)">
          {label}
        </text>
      ))}

      {/* 행 좌표 (19~1) */}
      {Array.from({ length: 19 }, (_, i) => (
        <text key={i} x={ML - 6} y={cy(i) + 4} textAnchor="end" fontSize="10" fontWeight="bold" fill="rgba(58,42,16,0.85)">
          {19 - i}
        </text>
      ))}

      {/* 클릭 영역 */}
      {onIntersectionClick && Array.from({ length: 19 }, (_, row) =>
        Array.from({ length: 19 }, (_, col) => (
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
