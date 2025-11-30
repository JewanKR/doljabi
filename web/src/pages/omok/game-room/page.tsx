import { useState, useEffect, useRef, useCallback } from 'react'; 
import { useNavigate } from 'react-router-dom'; 
import { startAutoVoice, stopAutoVoice, updateVoiceCallback } from '../../../voice_control/autoVoiceHandler';

/* ============================================================================================
   🔊 음성 → 좌표 변환 유틸
============================================================================================ */

// 한글 숫자 매핑
const KOREAN_NUM_MAP: Record<string, number> = {
  '일': 1,
  '이': 2,
  '삼': 3,
  '사': 4,
  '오': 5,
  '육': 6,
  '칠': 7,
  '팔': 8,
  '구': 9,
};

// "삼" / "십오" / "15" → 숫자 변환 함수
function koreanTextToNumber(text: string): number | null {
  const t = text.replace(/\s+/g, '');

  // 그냥 숫자면 그대로
  if (/^\d+$/.test(t)) {
    return parseInt(t, 10);
  }

  // "십", "십이", "십오" 등 (10~19)
  if (t === '십') return 10;
  if (t.startsWith('십')) {
    const tail = t.slice(1); // "이", "오" ...
    const ones = KOREAN_NUM_MAP[tail];
    return ones ? 10 + ones : null;
  }

  // "삼" 같은 한 글자 (1~9)
  return KOREAN_NUM_MAP[t] ?? null;
}

/**
 * 음성 텍스트에서 "N행 M열" 패턴을 찾아서
 *  - row (1부터 시작, 위에서 아래)
 *  - col (1부터 시작, 왼쪽에서 오른쪽)
 *  - serverCoordinate ((보드사이즈 - 행) * 보드사이즈 + 열 - 1)
 * 로 변환
 */// "A" ~ "Z" → 1 ~ 26 변환 (보드 범위는 나중에 체크)
function alphaToCol(ch: string): number | null {
  const upper = ch.toUpperCase();
  const code = upper.charCodeAt(0) - 'A'.charCodeAt(0) + 1; // A=1, B=2 ...
  if (code < 1 || code > 26) return null;
  return code;
}

function parseVoiceToCoordinate(
  rawText: string,
  boardSize: number
): { row: number; col: number; serverCoordinate: number } | null {
  // 공백 제거
  const text = rawText.replace(/\s+/g, '');

  let row: number | null = null;
  let col: number | null = null;

  // 0) "A4", "a10" 같은 알파벳 + 숫자 패턴 (열, 행)
  let m = text.match(/([A-Za-z])(\d{1,2})/);
  if (m) {
    col = alphaToCol(m[1]);        // A~Z → 1~26
    row = parseInt(m[2], 10);      // 4, 10 ...
  } else {
    // 1) "3행5열" 같은 숫자 패턴
    m = text.match(/(\d+)행(\d+)열/);
    if (m) {
      row = parseInt(m[1], 10);
      col = parseInt(m[2], 10);
    } else {
      // 2) "삼행오열", "십오행삼열" 같은 한글 숫자 패턴
      m = text.match(/([일이삼사오육칠팔구십]+)행([일이삼사오육칠팔구십]+)열/);
      if (!m) return null;

      row = koreanTextToNumber(m[1]);
      col = koreanTextToNumber(m[2]);
    }
  }

  // 숫자 해석 실패
  if (!row || !col) return null;

  // 보드 범위 체크 (1 ~ boardSize)
  if (row < 1 || row > boardSize || col < 1 || col > boardSize) return null;

  // 서버 인코딩 공식: (보드사이즈 - 행) * 보드사이즈 + 열 - 1
  const serverCoordinate = (boardSize - row) * boardSize + (col - 1);

  return { row, col, serverCoordinate };
}

/* ============================================================================================
   GameRoom 컴포넌트
============================================================================================ */

interface Player {
  nickname: string;
  rating: number;
  color: 'black' | 'white';
  mainTime: number;
  byoyomiTime: number;
  byoyomiCount: number;
}

export default function GameRoom() {
  const navigate = useNavigate();

  /* ==================== 보드 / 상태 ==================== */
  const [boardSize] = useState(19);
  const [board, setBoard] = useState<(null | 'black' | 'white')[][]>(
    Array(19)
      .fill(null)
      .map(() => Array(19).fill(null))
  );

  const [currentTurn, setCurrentTurn] = useState<'black' | 'white'>('black');
  const [selectedPosition, setSelectedPosition] = useState<{ row: number; col: number } | null>(null);
  const [myColor] = useState<'black' | 'white'>('black'); // 내 돌 색상
  const [lastHeard, setLastHeard] = useState<string>('');

  const [players, setPlayers] = useState<{ black: Player; white: Player }>({
    black: {
      nickname: '플레이어1',
      rating: 1850,
      color: 'black',
      mainTime: 1800,
      byoyomiTime: 30,
      byoyomiCount: 3,
    },
    white: {
      nickname: '플레이어2',
      rating: 1720,
      color: 'white',
      mainTime: 1800,
      byoyomiTime: 30,
      byoyomiCount: 3,
    },
  });

  const [initialTime] = useState({ black: 1800, white: 1800 });
  const [isInByoyomi, setIsInByoyomi] = useState({ black: false, white: false });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  /* ==================== 타이머 ==================== */
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setPlayers(prev => {
        const updated = { ...prev };
        const cur = updated[currentTurn];

        if (cur.mainTime > 0) {
          cur.mainTime -= 1;
          if (cur.mainTime === 0) {
            setIsInByoyomi(prev => ({ ...prev, [currentTurn]: true }));
          }
        } else if (cur.byoyomiTime > 0) {
          cur.byoyomiTime -= 1;
          if (cur.byoyomiTime === 0 && cur.byoyomiCount > 0) {
            cur.byoyomiCount -= 1;
            cur.byoyomiTime = 30;
          }
        }

        return updated;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [currentTurn]);

  /* ==================== 좌표 인코딩 함수 ==================== */
  function encodeCoordinate(rowHuman: number, colHuman: number): number {
    return (boardSize - rowHuman) * boardSize + colHuman - 1;
  }

  /* ==================== 일반 마우스 착수 ==================== */
  const handleCellClick = (row: number, col: number) => {
    if (board[row][col] === null) {
      setSelectedPosition({ row, col });
    }
  };

  const handlePlaceStone = () => {
    if (currentTurn !== myColor) {
      return; // 내 차례가 아니면 아무것도 하지 않음
    }

    if (!selectedPosition) {
      alert('착수할 위치를 선택해주세요.');
      return;
    }

    const { row, col } = selectedPosition;

    if (board[row][col] !== null) {
      alert('이미 돌이 놓인 위치입니다.');
      return;
    }

    // 사람 기준 1부터 시작하는 행/열
    const rowHuman = row + 1;
    const colHuman = col + 1;

    // 좌표 인코딩
    const coordinate = encodeCoordinate(rowHuman, colHuman);

    const moveData = {
      sessionKey: 'example-session-key',
      roomNumber: 'OMOK-2024',
      move: 'place',
      coordinate,
    };

    console.log('서버로 전송(클릭 착수):', JSON.stringify(moveData));

    const newBoard = board.map(r => [...r]);
    newBoard[row][col] = currentTurn;
    setBoard(newBoard);

    setCurrentTurn(currentTurn === 'black' ? 'white' : 'black');
    setSelectedPosition(null);
  };

  /* ==================== 수 넘김 / 기권 / 무승부 ==================== */
  const handlePass = () => {
    if (currentTurn !== myColor) return;

    const moveData = {
      sessionKey: 'example-session-key',
      roomNumber: 'OMOK-2024',
      move: 'pass',
      coordinate: -1,
    };

    console.log('서버로 전송(수 넘김):', JSON.stringify(moveData));
    setCurrentTurn(currentTurn === 'black' ? 'white' : 'black');
  };

  const handleResign = () => {
    if (confirm('정말 기권하시겠습니까?')) {
      const moveData = {
        sessionKey: 'example-session-key',
        roomNumber: 'OMOK-2024',
        move: 'resign',
        coordinate: -1,
      };
      console.log('서버로 전송(기권):', JSON.stringify(moveData));
      navigate('/');
    }
  };

  const handleDrawRequest = () => {
    if (currentTurn !== myColor) {
      return;
    }

    const moveData = {
      sessionKey: 'example-session-key',
      roomNumber: 'OMOK-2024',
      move: 'draw_request',
      coordinate: -1,
    };
    console.log('서버로 전송(무승부 요청):', JSON.stringify(moveData));

    alert('무승부 신청이 상대방에게 전송되었습니다.');
  };

  const isMyTurn = currentTurn === myColor;

  // 내 정보와 상대 정보
  const myPlayer = players[myColor];
  const opponentColor = myColor === 'black' ? 'white' : 'black';
  const opponentPlayer = players[opponentColor];

  const myTimePercentage = Math.max(
    0,
    Math.min(100, (myPlayer.mainTime / initialTime[myColor]) * 100)
  );
  const opponentTimePercentage = Math.max(
    0,
    Math.min(100, (opponentPlayer.mainTime / initialTime[opponentColor]) * 100)
  );

  const getTimeBarColor = (percentage: number) => {
    if (percentage > 50) return '#10b981'; // 녹색
    if (percentage > 20) return '#f59e0b'; // 주황색
    return '#ef4444'; // 빨간색
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes)
      .padStart(2, '0')
      .padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 선택된 좌표를 서버좌표(인코딩 값)로 표시
  const selectedCoordinateDisplay = (() => {
    if (!selectedPosition) return '미선택';
    const rowHuman = selectedPosition.row + 1;
    const colHuman = selectedPosition.col + 1;
    const coord = encodeCoordinate(rowHuman, colHuman);
    return String(coord);
  })();

  /* ============================================================================================
     🎙 음성 인식 핸들러
============================================================================================ */
// 🎙 최종 음성 처리
// 🎙 최종 음성 처리: 좌표 선택 + "착수"로 확정
const handleVoiceText = useCallback(
  (text: string) => {
    console.log('🎙 음성 텍스트:', text);
    setLastHeard(text);

    const lower = text.toLowerCase();

    /* ===================== 0) "착수 / 착수하기" → 확정 착수 ===================== */
    if (lower.includes('착수')) {
      console.log('🟢 음성 명령: 착수');

      if (!selectedPosition) {
        console.log('❌ 선택된 좌표가 없어서 착수 명령을 무시합니다.');
        return;
      }

      if (currentTurn !== myColor) {
        console.log('❌ 내 차례가 아니라 착수 명령을 무시합니다.');
        return;
      }

      // 버튼 클릭과 완전히 동일한 로직 사용
      handlePlaceStone();
      return;
    }

    /* ===================== 1) 기권 ===================== */
    if (lower.includes('기권') || lower.includes('포기')) {
      console.log('🟢 음성 명령: 기권');
      handleResign();
      return;
    }

    /* ===================== 2) 무승부 신청 ===================== */
    if (lower.includes('무승부')) {
      console.log('🟢 음성 명령: 무승부 신청');
      handleDrawRequest();
      return;
    }

    /* ===================== 3) 수 넘김 ===================== */
    if (lower.includes('수 넘김') || lower.includes('넘김') || lower.includes('패스')) {
      console.log('🟢 음성 명령: 수 넘김');
      handlePass();
      return;
    }

    /* ===================== 4) 그 외는 "좌표 선택"으로 처리 ===================== */
    if (currentTurn !== myColor) {
      console.log('내 차례가 아니라서 좌표 선택 음성은 무시합니다.');
      return;
    }

    // A4, 3행 5열, 삼행오열 같은 것들 파싱
    const parsed = parseVoiceToCoordinate(text, boardSize);
    if (!parsed) {
      console.log('❌ 좌표 해석 실패 (행/열 패턴이나 A4 패턴 아님):', text);
      return;
    }

    const { row, col, serverCoordinate } = parsed;
    const rowIndex = row - 1;
    const colIndex = col - 1;

    if (board[rowIndex][colIndex] !== null) {
      console.log(`❌ 이미 돌이 있는 위치입니다: ${row}행 ${col}열`);
      return;
    }

    // ✅ 이제는 "바로 착수"가 아니라, 선택만!
    setSelectedPosition({ row: rowIndex, col: colIndex });

    console.log(
      `🟡 좌표 선택: ${row}행 ${col}열 → 서버 좌표 ${serverCoordinate} (착수는 '착수'라고 말할 때 확정)`
    );
  },
  [
    board,
    boardSize,
    currentTurn,
    myColor,
    selectedPosition,
    handlePlaceStone,
    handlePass,
    handleResign,
    handleDrawRequest,
  ]
);



  /* ==================== 음성 인식 시작 / 정리 ==================== */
// 1) 컴포넌트가 처음 나타날 때 한 번만 음성 인식 시작/종료
useEffect(() => {
  startAutoVoice(handleVoiceText);   // 초기 콜백으로 시작

  return () => {
    stopAutoVoice();                 // 페이지 떠날 때 정리
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);  // ← 의도적으로 빈 배열 (한 번만 실행)

// 2) 그 이후로는 handleVoiceText가 바뀔 때마다 콜백만 교체
useEffect(() => {
  updateVoiceCallback(handleVoiceText);
}, [handleVoiceText]);

  /* ============================================================================================
     UI
============================================================================================ */

  return (
    <div className="min-h-screen text-white" style={{ backgroundColor: '#0b0c10' }}>
      {/* Header */}
      <header
        className="flex items-center justify-between px-8 py-4 border-b"
        style={{ borderColor: '#2a2a33' }}
      >
        <div className="flex items-center space-x-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, #1f6feb 0%, #1b4fd8 100%)',
              boxShadow: '0 4px 12px rgba(31, 111, 235, 0.3)',
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="10" cy="10" r="8" fill="white" opacity="0.9" />
              <circle cx="10" cy="10" r="5" fill="black" opacity="0.8" />
            </svg>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Doljabi
          </h1>
        </div>

        <div className="text-lg font-semibold" style={{ color: '#e8eaf0' }}>
          오목 대국
        </div>

        <button
          disabled
          className="px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap border"
          style={{
            backgroundColor: '#141822',
            borderColor: '#2a2a33',
            color: '#9aa1ad',
            opacity: 0.5,
            cursor: 'not-allowed',
          }}
        >
          방 설정
        </button>
      </header>

      {/* Main Content */}
      <div className="flex items-start justify-center min-h-[calc(100vh-72px)] p-6 gap-4">
        {/* 왼쪽: 플레이어 정보 */}
        <div className="w-64 flex flex-col h-[calc(100vh-120px)]">
          {/* 내 정보 - 상단 */}
          <div
            className={`flex-1 rounded-xl p-4 border mb-2 ${
              currentTurn === myColor ? 'ring-2 ring-blue-500' : ''
            }`}
            style={{
              backgroundColor: 'rgba(22,22,28,0.6)',
              borderColor: currentTurn === myColor ? '#1f6feb' : '#2a2a33',
              boxShadow:
                currentTurn === myColor
                  ? '0 0 20px rgba(31, 111, 235, 0.3)'
                  : '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: myColor === 'black' ? '#1a1a1a' : '#f5f5f5',
                  border: '2px solid',
                  borderColor: myColor === 'black' ? '#333' : '#ddd',
                  boxShadow:
                    myColor === 'black'
                      ? '0 2px 8px rgba(0,0,0,0.5)'
                      : '0 2px 8px rgba(255,255,255,0.3)',
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="12" cy="12" r="10" fill={myColor === 'black' ? '#000' : '#fff'} />
                  {myColor === 'white' && <circle cx="9" cy="9" r="3" fill="rgba(0,0,0,0.1)" />}
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-bold" style={{ color: '#e8eaf0' }}>
                  {myPlayer.nickname}
                </div>
                <div className="text-sm flex items-center space-x-1">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 1L7 4L10 4.5L7.5 6.5L8 9.5L6 8L4 9.5L4.5 6.5L2 4.5L5 4L6 1Z"
                      fill="#f59e0b"
                    />
                  </svg>
                  <span style={{ color: '#9aa1ad' }}>{myPlayer.rating}</span>
                </div>
              </div>
            </div>

            {/* 시간 진행 바 */}
            <div className="mb-3">
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: '#141822' }}
              >
                <div
                  className="h-full transition-all duration-1000"
                  style={{
                    width: `${myTimePercentage}%`,
                    backgroundColor: getTimeBarColor(myTimePercentage),
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div
                className="flex items-center justify-between p-2 rounded"
                style={{ backgroundColor: '#141822' }}
              >
                <span className="text-sm" style={{ color: '#9aa1ad' }}>
                  메인 시간
                </span>
                <span
                  className={`font-mono font-bold ${
                    isInByoyomi[myColor] ? 'text-red-500' : ''
                  }`}
                  style={{ color: isInByoyomi[myColor] ? '#ef4444' : '#e8eaf0' }}
                >
                  {formatTime(myPlayer.mainTime)}
                </span>
              </div>

              <div
                className="flex items-center justify-between p-2 rounded"
                style={{ backgroundColor: '#141822' }}
              >
                <span className="text-sm" style={{ color: '#9aa1ad' }}>
                  초읽기
                </span>
                <span
                  className={`font-mono font-bold ${
                    isInByoyomi[myColor] ? 'text-red-500' : ''
                  }`}
                  style={{ color: isInByoyomi[myColor] ? '#ef4444' : '#9aa1ad' }}
                >
                  {formatTime(myPlayer.byoyomiTime)}
                </span>
              </div>
              <div
                className="flex items-center justify-between p-2 rounded"
                style={{ backgroundColor: '#141822' }}
              >
                <span className="text-sm" style={{ color: '#9aa1ad' }}>
                  남은 횟수
                </span>
                <span
                  className={`font-mono font-bold ${
                    isInByoyomi[myColor] ? 'text-red-500' : ''
                  }`}
                  style={{ color: isInByoyomi[myColor] ? '#ef4444' : '#9aa1ad' }}
                >
                  {myPlayer.byoyomiCount}회
                </span>
              </div>
            </div>
          </div>

          {/* 상대방 정보 - 하단 */}
          <div
            className={`flex-1 rounded-xl p-4 border ${
              currentTurn === opponentColor ? 'ring-2 ring-blue-500' : ''
            }`}
            style={{
              backgroundColor: 'rgba(22,22,28,0.6)',
              borderColor: currentTurn === opponentColor ? '#1f6feb' : '#2a2a33',
              boxShadow:
                currentTurn === opponentColor
                  ? '0 0 20px rgba(31, 111, 235, 0.3)'
                  : '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <div className="flex items-center space-x-3 mb-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: opponentColor === 'black' ? '#1a1a1a' : '#f5f5f5',
                  border: '2px solid',
                  borderColor: opponentColor === 'black' ? '#333' : '#ddd',
                  boxShadow:
                    opponentColor === 'black'
                      ? '0 2px 8px rgba(0,0,0,0.5)'
                      : '0 2px 8px rgba(255,255,255,0.3)',
                }}
              >
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    fill={opponentColor === 'black' ? '#000' : '#fff'}
                  />
                  {opponentColor === 'white' && (
                    <circle cx="9" cy="9" r="3" fill="rgba(0,0,0,0.1)" />
                  )}
                </svg>
              </div>
              <div className="flex-1">
                <div className="font-bold" style={{ color: '#e8eaf0' }}>
                  {opponentPlayer.nickname}
                </div>
                <div className="text-sm flex items-center space-x-1">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M6 1L7 4L10 4.5L7.5 6.5L8 9.5L6 8L4 9.5L4.5 6.5L2 4.5L5 4L6 1Z"
                      fill="#f59e0b"
                    />
                  </svg>
                  <span style={{ color: '#9aa1ad' }}>{opponentPlayer.rating}</span>
                </div>
              </div>
            </div>

            {/* 시간 진행 바 */}
            <div className="mb-3">
              <div
                className="h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: '#141822' }}
              >
                <div
                  className="h-full transition-all duration-1000"
                  style={{
                    width: `${opponentTimePercentage}%`,
                    backgroundColor: getTimeBarColor(opponentTimePercentage),
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div
                className="flex items-center justify-between p-2 rounded"
                style={{ backgroundColor: '#141822' }}
              >
                <span className="text-sm" style={{ color: '#9aa1ad' }}>
                  메인 시간
                </span>
                <span
                  className={`font-mono font-bold ${
                    isInByoyomi[opponentColor] ? 'text-red-500' : ''
                  }`}
                  style={{ color: isInByoyomi[opponentColor] ? '#ef4444' : '#e8eaf0' }}
                >
                  {formatTime(opponentPlayer.mainTime)}
                </span>
              </div>

              <div
                className="flex items-center justify-between p-2 rounded"
                style={{ backgroundColor: '#141822' }}
              >
                <span className="text-sm" style={{ color: '#9aa1ad' }}>
                  초읽기
                </span>
                <span
                  className={`font-mono font-bold ${
                    isInByoyomi[opponentColor] ? 'text-red-500' : ''
                  }`}
                  style={{ color: isInByoyomi[opponentColor] ? '#ef4444' : '#9aa1ad' }}
                >
                  {formatTime(opponentPlayer.byoyomiTime)}
                </span>
              </div>
              <div
                className="flex items-center justify-between p-2 rounded"
                style={{ backgroundColor: '#141822' }}
              >
                <span className="text-sm" style={{ color: '#9aa1ad' }}>
                  남은 횟수
                </span>
                <span
                  className={`font-mono font-bold ${
                    isInByoyomi[opponentColor] ? 'text-red-500' : ''
                  }`}
                  style={{ color: isInByoyomi[opponentColor] ? '#ef4444' : '#9aa1ad' }}
                >
                  {opponentPlayer.byoyomiCount}회
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 중앙: 바둑판 */}
        <div className="flex-1 max-w-4xl">
          <div
            className="rounded-2xl p-6 border"
            style={{
              backgroundColor: 'rgba(22,22,28,0.6)',
              borderColor: '#2a2a33',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}
          >
            <div
              className="aspect-square rounded-xl p-8 relative"
              style={{
                background: 'linear-gradient(135deg, #d4a574 0%, #c89968 100%)',
                boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.2)',
              }}
            >
              {/* 🔠 좌표 레이블 (A~ / 1~) */}
              <div className="absolute inset-8 pointer-events-none" style={{ zIndex: 30 }}>
                {/* 열 좌표: A, B, C ... */}
                {Array.from({ length: boardSize }).map((_, colIndex) => {
                  const cellSize = 100 / (boardSize - 1);
                  const left = `${colIndex * cellSize}%`;
                  const letter = String.fromCharCode('A'.charCodeAt(0) + colIndex); // alphaToCol과 맞춤
                  return (
                    <div
                      key={`col-label-${colIndex}`}
                      className="absolute text-[10px] font-semibold"
                      style={{
                        top: 0,
                        left,
                        transform: 'translate(-50%, -115%)',
                        color: 'rgba(0,0,0,0.65)',
                        textShadow: '0 1px 1px rgba(255,255,255,0.6)',
                      }}
                    >
                      {letter}
                    </div>
                  );
                })}

                {/* 행 좌표: 1,2,3,... (위에서 아래로 1~19) */}
                {Array.from({ length: boardSize }).map((_, rowIndex) => {
                  const cellSize = 100 / (boardSize - 1);
                  const top = `${rowIndex * cellSize}%`;
                  const number = rowIndex + 1;
                  return (
                    <div
                      key={`row-label-${rowIndex}`}
                      className="absolute text-[10px] font-semibold"
                      style={{
                        left: 0,
                        top,
                        transform: 'translate(-160%, -60%)',
                        color: 'rgba(0,0,0,0.65)',
                        textShadow: '0 1px 1px rgba(255,255,255,0.6)',
                      }}
                    >
                      {number}
                    </div>
                  );
                })}
              </div>

              {/* 바둑판 그리드 (18x18 셀로 19x19 교차점 생성) */}
              <div
                className="absolute inset-8 grid gap-0"
                style={{
                  gridTemplateColumns: `repeat(${boardSize - 1}, 1fr)`,
                  gridTemplateRows: `repeat(${boardSize - 1}, 1fr)`,
                }}
              >
                {Array.from({ length: boardSize - 1 }).map((_, rowIndex) =>
                  Array.from({ length: boardSize - 1 }).map((_, colIndex) => (
                    <div
                      key={`grid-${rowIndex}-${colIndex}`}
                      className="relative"
                      style={{
                        borderRight:
                          colIndex < boardSize - 2 ? '1px solid rgba(0,0,0,0.3)' : 'none',
                        borderBottom:
                          rowIndex < boardSize - 2 ? '1px solid rgba(0,0,0,0.3)' : 'none',
                      }}
                    />
                  ))
                )}
              </div>

              {/* 외곽 테두리 선 */}
              <div
                className="absolute inset-8 pointer-events-none"
                style={{
                  border: '1px solid rgba(0,0,0,0.3)',
                }}
              />

              {/* 교차점 및 돌 */}
              <div className="absolute inset-8">
                {board.map((row, rowIndex) =>
                  row.map((cell, colIndex) => {
                    const cellSize = 100 / (boardSize - 1);
                    const topPosition = `${rowIndex * cellSize}%`;
                    const leftPosition = `${colIndex * cellSize}%`;

                    return (
                      <div
                        key={`stone-${rowIndex}-${colIndex}`}
                        onClick={() => handleCellClick(rowIndex, colIndex)}
                        className="absolute cursor-pointer flex items-center justify-center"
                        style={{
                          top: topPosition,
                          left: leftPosition,
                          width: '5%',
                          height: '5%',
                          transform: 'translate(-50%, -50%)',
                          backgroundColor:
                            selectedPosition?.row === rowIndex &&
                            selectedPosition?.col === colIndex
                              ? 'rgba(31, 111, 235, 0.4)'
                              : 'transparent',
                          borderRadius: '50%',
                          zIndex: 10,
                        }}
                      >
                        {/* 화점 표시 */}
                        {!cell &&
                          (rowIndex === 3 || rowIndex === 9 || rowIndex === 15) &&
                          (colIndex === 3 || colIndex === 9 || colIndex === 15) && (
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                pointerEvents: 'none',
                              }}
                            />
                          )}

                        {/* 바둑돌 */}
                        {cell && (
                          <div
                            className="rounded-full flex items-center justify-center"
                            style={{
                              width: '100%',
                              height: '100%',
                              backgroundColor: cell === 'black' ? '#1a1a1a' : '#f5f5f5',
                              border: cell === 'black' ? '2px solid #000' : '2px solid #ddd',
                              boxShadow:
                                cell === 'black'
                                  ? '0 2px 6px rgba(0,0,0,0.6)'
                                  : '0 2px 6px rgba(0,0,0,0.3)',
                              pointerEvents: 'none',
                            }}
                          >
                            <svg
                              width="100%"
                              height="100%"
                              viewBox="0 0 32 32"
                              fill="none"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <circle
                                cx="16"
                                cy="16"
                                r="14"
                                fill={cell === 'black' ? '#000' : '#fff'}
                              />
                              {cell === 'white' && (
                                <circle cx="12" cy="12" r="4" fill="rgba(0,0,0,0.1)" />
                              )}
                            </svg>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 오른쪽: 컨트롤 */}
        <div className="w-64 space-y-4">
          {/* 선택된 위치 및 착수 버튼 */}
          <div
            className="rounded-xl p-4 border"
            style={{
              backgroundColor: 'rgba(22,22,28,0.6)',
              borderColor: '#2a2a33',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <div className="text-sm mb-2" style={{ color: '#9aa1ad' }}>
              선택된 위치 (서버 좌표)
            </div>
            <div
              className="text-2xl font-mono font-bold text-center p-3 rounded"
              style={{ backgroundColor: '#141822', color: '#8ab4f8' }}
            >
              {selectedCoordinateDisplay}
            </div>
          </div>

          <button
            onClick={handlePlaceStone}
            disabled={!selectedPosition || !isMyTurn}
            className="w-full py-4 rounded-lg font-semibold transition-all whitespace-nowrap text-white text-lg"
            style={{
              background:
                selectedPosition && isMyTurn
                  ? 'linear-gradient(180deg, #1f6feb, #1b4fd8)'
                  : '#2a2a33',
              boxShadow:
                selectedPosition && isMyTurn
                  ? '0 2px 8px rgba(0,0,0,0.3)'
                  : 'none',
              opacity: selectedPosition && isMyTurn ? 1 : 0.5,
              cursor: selectedPosition && isMyTurn ? 'pointer' : 'not-allowed',
            }}
          >
            착수하기
          </button>

          {/* 게임 컨트롤 */}
          <div className="space-y-3">
            <button
              onClick={handlePass}
              disabled={!isMyTurn}
              className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap border"
              style={{
                backgroundColor: '#141822',
                borderColor: '#2a2a33',
                color: '#e8eaf0',
                opacity: isMyTurn ? 1 : 0.5,
                cursor: isMyTurn ? 'pointer' : 'not-allowed',
              }}
            >
              수 넘김
            </button>

            <button
              onClick={handleDrawRequest}
              disabled={!isMyTurn}
              className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap border"
              style={{
                backgroundColor: '#141822',
                borderColor: '#2a2a33',
                color: '#e8eaf0',
                opacity: isMyTurn ? 1 : 0.5,
                cursor: isMyTurn ? 'pointer' : 'not-allowed',
              }}
            >
              무승부 신청
            </button>

            <button
              onClick={handleResign}
              className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap border"
              style={{
                backgroundColor: '#141822',
                borderColor: '#2a2a33',
                color: '#e8eaf0',
              }}
            >
              기권
            </button>
          </div>

          {/* 현재 차례 표시 */}
          <div
            className="rounded-xl p-4 border text-center"
            style={{
              backgroundColor: 'rgba(22,22,28,0.6)',
              borderColor: '#2a2a33',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <div className="text-sm mb-2" style={{ color: '#9aa1ad' }}>
              현재 차례
            </div>
            <div className="flex items-center justify-center space-x-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: currentTurn === 'black' ? '#1a1a1a' : '#f5f5f5',
                  border: '2px solid',
                  borderColor: currentTurn === 'black' ? '#000' : '#ddd',
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="8"
                    cy="8"
                    r="7"
                    fill={currentTurn === 'black' ? '#000' : '#fff'}
                  />
                </svg>
              </div>
              <span className="text-xl font-bold" style={{ color: '#e8eaf0' }}>
                {currentTurn === 'black' ? '흑' : '백'}
              </span>
            </div>
          </div>

          {/* 마지막 음성 인식 로그 */}
          <div
            className="rounded-xl p-4 border"
            style={{
              backgroundColor: 'rgba(22,22,28,0.6)',
              borderColor: '#2a2a33',
              boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            }}
          >
            <div className="text-sm mb-2" style={{ color: '#9aa1ad' }}>
              마지막 음성 인식
            </div>
            <div
              className="text-sm break-words"
              style={{ color: '#e8eaf0', minHeight: '2rem' }}
            >
              {lastHeard || '아직 인식된 음성이 없습니다.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
