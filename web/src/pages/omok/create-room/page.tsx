
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OmokCreateRoom() {
  const navigate = useNavigate();

  useEffect(() => {
    // 방 생성 시 대기실로 이동
    navigate('/omok/waiting-room');
  }, [navigate]);

  return null;
}
