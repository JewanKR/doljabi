const COLS = ['A','B','C','D','E','F','G','H','J','K','L','M','N','O','P','Q','R','S','T'];
const CELL = 28;
const ML = 28; // left margin (row numbers)
const MT = 22; // top margin (col letters)
const R = 12;  // 돌 반지름

// 집(territory) 히트맵 색 — katrain OWNERSHIP_COLORS 근사
const OWN_BLACK = 'rgb(0,0,26)';
const OWN_WHITE = 'rgb(255,255,255)';

/** 돌 색 위에 올릴 글자색(수순번호 등) */
const onStoneText = (color) => (color === 'black' ? '#ffffff' : '#1a1a1a');
/** 돌 위 대비 링 색(마지막 수 표시) */
const onStoneRing = (color) => (color === 'black' ? 'rgba(255,255,255,0.92)' : 'rgba(58,42,16,0.92)');
/** 자릿수에 따른 숫자 폰트 크기 */
const numFont = (s) => (s.length <= 1 ? 13 : s.length === 2 ? 11 : 9);

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
 * @param {{ col: number, row: number, color: 'black'|'white', moveNo?: number }[]} stones
 * @param {{ col: number, row: number, type?: 'dashed'|'dot' }[]} markers 변화도 마커
 * @param {{ col: number, row: number, label: string, fill: string, text: string, best?: boolean }[]} candidates
 *        KataGo 후보수(표시용으로 가공된 값): fill=평가색, label=순위, best=최선수
 * @param {{ col: number, row: number, color: 'black'|'white', moveNo: number }[] | null} pvPreview
 *        호버한 후보수의 PV(예상 진행)
 * @param {{ col: number, row: number, color: 'black'|'white' } | null} lastMove 마지막으로 둔 수
 * @param {number[] | null} ownership 전판 집 예측 (길이 size*size, [-1,1], +흑/-백)
 * @param {boolean} showMoveNumbers 둔 돌 위에 moveNo 표시
 * @param {(index: number | null) => void} onCandidateHover 후보수 hover 콜백
 * @param {string} className
 * @param {{ col: number, row: number } | null} pending 선택 대기 중인 좌표
 * @param {(coord: { col: number, row: number }) => void} onIntersectionClick
 * @param {number} size 보드 한 변의 점 개수 (바둑 19, 오목 15)
 */
export const GoBoard = ({
  stones = [],
  markers = [],
  candidates = [],
  pvPreview = null,
  lastMove = null,
  ownership = null,
  showMoveNumbers = false,
  onCandidateHover,
  className = '',
  pending = null,
  onIntersectionClick,
  size = 19,
}) => {
  const last = size - 1;
  const boardPx = last * CELL;
  const W = boardPx + ML + 14;
  const H = boardPx + MT + 14;

  const cx = (col) => ML + col * CELL;
  const cy = (row) => MT + row * CELL;

  const stars = getStarPoints(size);
  const stoneSet = new Set(stones.map(s => `${s.col},${s.row}`));
  const hasOwnership = Array.isArray(ownership) && ownership.length === size * size;

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

      {/* 집(territory) 히트맵 — ownership[row*size+col], +흑/-백 */}
      {hasOwnership && Array.from({ length: size }, (_, row) =>
        Array.from({ length: size }, (_, col) => {
          const v = ownership[row * size + col];
          if (v == null || Math.abs(v) < 0.1) return null;
          // 흰색은 주황 보드와 대비가 약해 더 진하게(최대 0.85), 검정은 기존(최대 0.55)
          const maxOp = v > 0 ? 0.55 : 0.95;
          const opacity = Math.min(maxOp, Math.pow(Math.abs(v), 0.75) * maxOp);
          return (
            <rect
              key={`own-${col}-${row}`}
              x={cx(col) - CELL / 2} y={cy(row) - CELL / 2}
              width={CELL} height={CELL}
              fill={v > 0 ? OWN_BLACK : OWN_WHITE}
              opacity={opacity}
            />
          );
        })
      )}

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
          cx={cx(col)} cy={cy(row)} r={R}
          fill={color === 'black' ? '#1a1a1a' : 'white'}
          stroke={color === 'black' ? 'rgba(255,255,255,0.12)' : 'rgba(58,42,16,0.3)'}
          strokeWidth="1"
          style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))' }}
        />
      ))}

      {/* KataGo 후보수 (평가색 원 + 순위 번호 + 최선수 cyan 링) */}
      {candidates.map(({ col, row, label, fill, text, best }, idx) => (
        <g
          key={`cand-${idx}`}
          style={{ cursor: 'pointer' }}
          onMouseEnter={() => onCandidateHover && onCandidateHover(idx)}
          onMouseLeave={() => onCandidateHover && onCandidateHover(null)}
          onClick={() => onIntersectionClick && onIntersectionClick({ col, row })}
        >
          <circle cx={cx(col)} cy={cy(row)} r={R} fill={fill} opacity={0.85} />
          {best && (
            <circle cx={cx(col)} cy={cy(row)} r={R} fill="none" stroke="rgb(10,200,250)" strokeWidth="2" />
          )}
          <text
            x={cx(col)} y={cy(row)} textAnchor="middle" dominantBaseline="central"
            fontSize={numFont(label)} fontWeight="bold" fill={text}
            style={{ pointerEvents: 'none' }}
          >
            {label}
          </text>
        </g>
      ))}

      {/* PV 미리보기 (호버한 후보의 예상 진행) */}
      {pvPreview && pvPreview.map(({ col, row, color, moveNo }, idx) => {
        const s = String(moveNo);
        return (
          <g key={`pv-${idx}`} style={{ pointerEvents: 'none' }}>
            <circle
              cx={cx(col)} cy={cy(row)} r={R}
              fill={color === 'black' ? '#1a1a1a' : 'white'}
              stroke={color === 'black' ? 'rgba(255,255,255,0.3)' : 'rgba(58,42,16,0.5)'}
              strokeWidth="1" opacity={0.9}
            />
            <text
              x={cx(col)} y={cy(row)} textAnchor="middle" dominantBaseline="central"
              fontSize={numFont(s)} fontWeight="bold" fill={onStoneText(color)}
            >
              {s}
            </text>
          </g>
        );
      })}

      {/* 둔 돌 수순번호 (후보수 다음에 그려 가려지지 않게) */}
      {showMoveNumbers && stones.map(({ col, row, color, moveNo }, idx) => (
        moveNo ? (
          <text
            key={`num-${idx}`}
            x={cx(col)} y={cy(row)} textAnchor="middle" dominantBaseline="central"
            fontSize={numFont(String(moveNo))} fontWeight="bold" fill={onStoneText(color)}
            style={{ pointerEvents: 'none' }}
          >
            {moveNo}
          </text>
        ) : null
      ))}

      {/* 마지막 수 마커 (안쪽 링) */}
      {lastMove && (
        <circle
          cx={cx(lastMove.col)} cy={cy(lastMove.row)} r={R * 0.55}
          fill="none" stroke={onStoneRing(lastMove.color)} strokeWidth="2"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* 선택 대기 중인 위치 */}
      {pending && !stoneSet.has(`${pending.col},${pending.row}`) && (
        <circle
          cx={cx(pending.col)} cy={cy(pending.row)} r={R}
          fill="rgba(103,80,164,0.45)"
          stroke="rgba(103,80,164,0.8)"
          strokeWidth="2"
        />
      )}

      {/* 분석 마커 (변화도) */}
      {markers.map(({ col, row, type = 'dashed' }, idx) => (
        type === 'dot'
          ? <circle key={`marker-${idx}`} cx={cx(col)} cy={cy(row)} r={5} fill="var(--md-sys-color-primary, #6750a4)" opacity="0.7" />
          : <circle key={`marker-${idx}`} cx={cx(col)} cy={cy(row)} r={13} fill="none" stroke="var(--md-sys-color-primary, #6750a4)" strokeWidth="3" strokeDasharray="5 3" />
      ))}
    </svg>
  );
};
