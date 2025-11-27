import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRoom, getSessionKey, type CreateRoomPayload } from '../../../api/authClient';

export default function OmokCreateRoom() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<string>('방 생성 중...');

  useEffect(() => {
    const initGame = async () => {
      // 1. 세션 키 확인
      const sessionKey = getSessionKey();
      if (!sessionKey) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      try {
        // 2. 방 생성 요청 Payload 구성
        const payload: CreateRoomPayload = {
          game_type: 'omok',
          game_config: {
            main_time: 600,        // 10분
            fischer_time: 5,       // 피셔 5초
            overtime: 30,          // 초읽기 30초
            remaining_overtime: 3  // 초읽기 3회
          }
        };

        // 3. API 호출
        const result = await createRoom(payload);

        if (result.status === 201 && result.data) {
          const enterCode = result.data.enter_code;
          
          // 4. 성공 시 대기실로 이동
          // openapi.json의 /room/{enter_code}/session/{session_key} 에 대응하기 위해
          // enter_code를 대기실로 전달합니다. session_key는 authClient에 저장되어 있습니다.
          navigate('/omok/waiting-room', { 
            state: { 
              roomCode: enterCode.toString(),
              isHost: true
            } 
          });
        } else {
          setStatus(`방 생성 실패: ${result.message}`);
          setTimeout(() => navigate('/'), 2000);
        }
      } catch (error) {
        console.error(error);
        setStatus('네트워크 오류가 발생했습니다.');
        setTimeout(() => navigate('/'), 2000);
      }
    };

    initGame();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center text-white" style={{ backgroundColor: '#0b0c10' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
        <h2 className="text-xl font-semibold">{status}</h2>
      </div>
    </div>
  );
}
