/* ============================================================================================
   🔊 음성 → 좌표 변환 유틸
============================================================================================ */

// 한글 숫자 매핑
const KOREAN_NUM_MAP: Record<string, number> = {
  일: 1,
  이: 2,
  삼: 3,
  사: 4,
  오: 5,
  육: 6,
  칠: 7,
  팔: 8,
  구: 9,
};

// 한글 알파벳 발음 → 알파벳 매핑
const KOREAN_ALPHA_MAP: Record<string, string> = {
  피: 'P',
  오: 'O',
  이: 'E', // E열 말할 때 대비용
  에이: 'A',
  비: 'B',
  씨: 'C',
  디: 'D',
  // 필요하면 더 추가
};

// "삼" / "십오" / "15" → 숫자 변환 함수
function koreanTextToNumber(text: string): number | null {
  const t = text.replace(/\s+/g, '');
  // 숫자 그대로 들어온 경우
  if (/^\d+$/.test(t)) {
    return parseInt(t, 10);
  }
  // 10, 11~19
  if (t === '십') return 10;
  if (t.startsWith('십')) {
    const tail = t.slice(1);
    const ones = KOREAN_NUM_MAP[tail];
    return ones ? 10 + ones : null;
  }
  // 1~9
  return KOREAN_NUM_MAP[t] ?? null;
}

// "A" ~ "Z" → 1 ~ 26
function alphaToCol(ch: string): number | null {
  const upper = ch.toUpperCase();
  const code = upper.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
  if (code < 1 || code > 26) return null;
  return code;
}

// "피삼" / "오오" / "PE" 같은 걸 "P3" / "O5" / "P2" 로 바꿔주는 전처리
function normalizeAlphaCoordinateLike(raw: string): string {
  const t = raw.replace(/\s+/g, '');
  // 행/열 패턴은 여기서 건드리지 않음
  if (t.includes('행') || t.includes('열')) return t;
  const upper = t.toUpperCase();
  
  // 1) "PE" 처럼 알파벳 두 글자인 경우 (P2 말했는데 PE로 인식된 케이스)
  if (/^[A-Z]{2}$/.test(upper)) {
    const colAlpha = upper[0];
    const rowAlpha = upper[1];
    // 뒤 글자를 숫자로 추정
    const romanToDigit: Record<string, number> = {
      E: 2, // "투(2)"를 E로 인식한 경우
      O: 5, // "오(5)"를 O로 인식한 경우
      I: 2, // "이(2)"를 I로 인식한 경우
    };
    const n = romanToDigit[rowAlpha];
    if (n) {
      return `${colAlpha}${n}`; // 예: "PE" → "P2"
    }
  }

  // 2) "피삼", "오오" 같은 한글 발음 → 알파벳 + 숫자
  for (const [kor, alpha] of Object.entries(KOREAN_ALPHA_MAP)) {
    if (t.startsWith(kor)) {
      const rest = t.slice(kor.length);
      const num = koreanTextToNumber(rest); // 한글/숫자 둘 다 처리
      if (num !== null) {
        return `${alpha}${num}`; // 예: "피삼" → "P3", "오오" → "O5"
      }
    }
  }

  return t;
}

export function parseVoiceToCoordinate(
  rawText: string,
  boardSize: number
): { row: number; col: number; serverCoordinate: number } | null {
  // 공백 제거
  const compact = rawText.replace(/\s+/g, '');
  // "피삼", "오오", "PE" 등을 "P3", "O5", "P2"로 정규화
  const text = normalizeAlphaCoordinateLike(compact);

  let row: number | null = null;
  let col: number | null = null;

  // 0) "A4", "a10"
  let m = text.match(/([A-Za-z])(\d{1,2})/);
  if (m) {
    col = alphaToCol(m[1]);
    row = parseInt(m[2], 10);
  } else {
    // 1) "3행5열"
    m = text.match(/(\d+)행(\d+)열/);
    if (m) {
      row = parseInt(m[1], 10);
      col = parseInt(m[2], 10);
    } else {
      // 2) "삼행오열", "십오행삼열"
      m = text.match(/([일이삼사오육칠팔구십]+)행([일이삼사오육칠팔구십]+)열/);
      if (!m) return null;
      row = koreanTextToNumber(m[1]);
      col = koreanTextToNumber(m[2]);
    }
  }

  if (!row || !col) return null;
  if (row < 1 || row > boardSize || col < 1 || col > boardSize) return null;

  const serverCoordinate = (boardSize - row) * boardSize + (col - 1);
  return { row, col, serverCoordinate };
}

