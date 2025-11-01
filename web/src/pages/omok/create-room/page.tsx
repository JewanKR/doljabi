import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OmokCreateRoom() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/omok/waiting-room');
  }, [navigate]);

  return null;
}
