import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateRoomRequest } from '../../../api/endpoints/default/default';
import { SessionManager } from '../../../api/axios-instance';
import { saveRoomConfig } from '../game-room/enter-room-config';

export default function OmokQuickMatch() {
  const navigate = useNavigate();
  const createRoomMutation = useCreateRoomRequest();

  useEffect(() => {
    const startQuickMatch = async () => {
      const sessionKey = SessionManager.getSessionKey();

      if (!sessionKey) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      try {
        // 빠른 대국용 기본 설정으로 방 생성
        const requestData = {
          game_type: 'omok' as const,
          game_config: {
            main_time: 600,     // 10분
            fischer_time: 5,     // 5초
            overtime: 30,        // 30초
            remaining_overtime: 3 // 3회
          }
        };

        const response = await createRoomMutation.mutateAsync({
          data: requestData
        });

        // 방 생성 응답 저장
        const roomConfig = {
          enter_code: response.enter_code,
          session_key: sessionKey,
          game_config: requestData.game_config,
          isHost: true
        };

        saveRoomConfig(roomConfig);
        console.log('✅ 빠른 대국 방 생성 성공:', response);

        // 바로 게임방으로 이동
        navigate('/omok/game-room');
      } catch (error) {
        console.error('❌ 빠른 대국 방 생성 실패:', error);
        alert('빠른 대국 방 생성에 실패했습니다.');
        navigate('/');
      }
    };

    startQuickMatch();
  }, [navigate]);

  return (
    <div className="min-h-screen text-white flex items-center justify-center" style={{ backgroundColor: '#0b0c10' }}>
      <div className="text-center">
        <div className="w-32 h-32 mx-auto mb-8 rounded-full flex items-center justify-center"
             style={{ 
               background: 'linear-gradient(135deg, #1f6feb 0%, #1b4fd8 100%)',
               boxShadow: '0 8px 32px rgba(31, 111, 235, 0.4)'
             }}>
          <svg width="64" height="64" viewBox="0 0 64 64" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="32" r="6" fill="white"/>
            <circle cx="24" cy="32" r="6" fill="white"/>
            <circle cx="32" cy="32" r="6" fill="white"/>
            <circle cx="40" cy="32" r="6" fill="white"/>
            <circle cx="48" cy="32" r="6" fill="white"/>
            <line x1="18" y1="32" x2="46" y2="32" stroke="white" strokeWidth="2"/>
          </svg>
        </div>
        
        <h2 className="text-3xl font-bold mb-4" style={{ color: '#e8eaf0' }}>
          빠른 대국 방 생성 중...
        </h2>
        
        <p className="text-lg" style={{ color: '#9aa1ad' }}>
          곧 대기실로 이동합니다
        </p>
        
        <div className="mt-8 flex justify-center space-x-2">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: '#1f6feb', animationDelay: '0s' }}></div>
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: '#1f6feb', animationDelay: '0.2s' }}></div>
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: '#1f6feb', animationDelay: '0.4s' }}></div>
        </div>
      </div>
    </div>
  );
}
