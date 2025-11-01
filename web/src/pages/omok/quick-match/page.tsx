import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OmokQuickMatch() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // 카운트다운 종료 후 대기실로 이동
      const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      navigate('/omok/waiting-room', { 
        state: { 
          roomCode,
          isHost: true,
          opponent: {
            nickname: '매칭된플레이어',
            rating: 1520
          }
        } 
      });
    }
  }, [countdown, navigate]);

  return (
    <div className="min-h-screen text-white flex items-center justify-center" style={{ backgroundColor: '#0b0c10' }}>
      <div className="text-center">
        <div className="w-32 h-32 mx-auto mb-8 rounded-full flex items-center justify-center"
             style={{ 
               background: 'linear-gradient(135deg, #1f6feb 0%, #1b4fd8 100%)',
               boxShadow: '0 8px 32px rgba(31, 111, 235, 0.4)'
             }}>
          <div className="text-6xl font-bold text-white">
            {countdown}
          </div>
        </div>
        
        <h2 className="text-3xl font-bold mb-4" style={{ color: '#e8eaf0' }}>
          상대를 찾는 중...
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