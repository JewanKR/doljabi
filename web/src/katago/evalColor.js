/**
 * KataGo 후보수 평가색 — katrain의 "theme:normal" 팔레트/임계값을 포팅한다.
 *
 * 후보수의 "1점손실량(points lost)"을 katrain `evaluation_class`로 분류해 색을 고른다.
 * 손실이 클수록 보라(나쁨) → 작을수록 초록(좋음). 텍스트 색은 배경 휘도로 대비를 맞춘다.
 *
 * 출처: katrain gui/theme.py(EVAL_COLORS), config.json(eval_thresholds), core/utils.py(evaluation_class)
 */

// worst → best (인덱스 0=최악, 5=최선)
const EVAL_COLORS = [
  [114, 33, 107], // purple
  [204, 0, 0],    // red
  [230, 102, 26], // orange
  [242, 242, 0],  // yellow
  [171, 230, 46], // light green
  [30, 150, 0],   // green
];

// katrain config.json: "eval_thresholds"
const EVAL_THRESHOLDS = [12, 6, 3, 1.5, 0.5, 0];

/** best-move 테두리(cyan). katrain TOP_MOVE_BORDER_COLOR. */
export const TOP_MOVE_BORDER = 'rgb(10,200,250)';

/** katrain core/utils.py: evaluation_class — 손실량을 색 인덱스로. */
function evaluationClass(pointsLost) {
  let i = 0;
  while (i < EVAL_THRESHOLDS.length - 1 && pointsLost < EVAL_THRESHOLDS[i]) i += 1;
  return i;
}

/** sRGB 상대 휘도(대략값)로 0.5 미만이면 어두운 배경 → 흰 글씨. */
function textColorFor([r, g, b]) {
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum < 0.55 ? '#ffffff' : '#1a1a1a';
}

/**
 * @param {number} pointsLost 최선수 대비 손실 집수 (>= 0)
 * @returns {{ fill: string, text: string }} 후보수 원 채움색과 그 위 글자색
 */
export function evalColor(pointsLost) {
  const rgb = EVAL_COLORS[evaluationClass(Math.max(0, pointsLost || 0))];
  return { fill: `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`, text: textColorFor(rgb) };
}
