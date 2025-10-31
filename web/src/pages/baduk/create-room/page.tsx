
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

type Stone = 'black' | 'white' | null;
type GameState = 'playing' | 'finished';

export default function BadukCreateRoom() {
  const navigate = useNavigate();

  // 컴포넌트 마운트 시 대기실로 이동
  useEffect(() => {
    navigate('/baduk/waiting-room');
  }, [navigate]);

  return null;
}
