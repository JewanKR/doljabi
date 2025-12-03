
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BadukCreateRoom() {
  const navigate = useNavigate();

  useEffect(() => {
    // 방 생성 시 대기실로 이동
    navigate('/baduk/waiting-room');
  }, [navigate]);

  return null;
}
