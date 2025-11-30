// page.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  startAutoVoice,
  stopAutoVoice,
  updateVoiceCallback,
} from '../../../voice_control/autoVoiceHandler';
import GameRoomView from './View';

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

// "삼" / "십오" / "15" → 숫자 변환 함수
function koreanTextToNumber(text: string): number | null {
  const t = text.replace(/\s+/g, '');

  if (/^\d+$/.test(t)) {
    return parseInt(t, 10);
  }

  if (t === '십') return 10;
  if (t.startsWith('십')) {
    const tail = t.slice(1);
    const ones = KOREAN_NUM_MAP[tail];
    return ones ? 10 + ones : null;
  }

  return KOREAN_NUM_MAP[t] ?? null;
}

// "A" ~ "Z" → 1 ~ 26
function alphaToCol(ch: string): number | null {
  const upper = ch.toUpperCase();
  const code = upper.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
  if (code < 1 || code > 26) return null;
  return code;
}

function parseVoiceToCoordinate(
  rawText: string,
  boardSize: number
): { row: number; col: number; serverCoordinate: number } | null {
  const text = rawText.replace(/\s+/g, '');

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

/* ============================================================================================
   GameRoom 컨테이너 컴포넌트 (로직 담당)
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
  const [selectedPosition, setSelectedPosition] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const [myColor] = useState<'black' | 'white'>('black');
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
            setIsInByoyomi(prevState => ({ ...prevState, [currentTurn]: true }));
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
    if (currentTurn !== myColor) return;
    if (!selectedPosition) {
      alert('착수할 위치를 선택해주세요.');
      return;
    }

    const { row, col } = selectedPosition;

    if (board[row][col] !== null) {
      alert('이미 돌이 놓인 위치입니다.');
      return;
    }

    const rowHuman = row + 1;
    const colHuman = col + 1;

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
    if (currentTurn !== myColor) return;

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

  const handleVoiceText = useCallback(
    (text: string) => {
      console.log('🎙 음성 텍스트:', text);
      setLastHeard(text);

      const lower = text.toLowerCase();

      // 0) 착수
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

        handlePlaceStone();
        return;
      }

      // 1) 기권
      if (lower.includes('기권') || lower.includes('포기')) {
        console.log('🟢 음성 명령: 기권');
        handleResign();
        return;
      }

      // 2) 무승부
      if (lower.includes('무승부')) {
        console.log('🟢 음성 명령: 무승부 신청');
        handleDrawRequest();
        return;
      }

      // 3) 수 넘김
      if (lower.includes('수 넘김') || lower.includes('넘김') || lower.includes('패스')) {
        console.log('🟢 음성 명령: 수 넘김');
        handlePass();
        return;
      }

      // 4) 좌표 선택
      if (currentTurn !== myColor) {
        console.log('내 차례가 아니라서 좌표 선택 음성은 무시합니다.');
        return;
      }

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
  useEffect(() => {
    startAutoVoice(handleVoiceText);

    return () => {
      stopAutoVoice();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    updateVoiceCallback(handleVoiceText);
  }, [handleVoiceText]);

  /* ==================== View 렌더 ==================== */

  return (
    <GameRoomView
      boardSize={boardSize}
      board={board}
      currentTurn={currentTurn}
      myColor={myColor}
      selectedPosition={selectedPosition}
      myPlayer={myPlayer}
      opponentPlayer={opponentPlayer}
      opponentColor={opponentColor}
      myTimePercentage={myTimePercentage}
      opponentTimePercentage={opponentTimePercentage}
      isInByoyomi={isInByoyomi}
      selectedCoordinateDisplay={selectedCoordinateDisplay}
      isMyTurn={isMyTurn}
      lastHeard={lastHeard}
      onCellClick={handleCellClick}
      onPlaceStone={handlePlaceStone}
      onPass={handlePass}
      onDrawRequest={handleDrawRequest}
      onResign={handleResign}
    />
  );
}
