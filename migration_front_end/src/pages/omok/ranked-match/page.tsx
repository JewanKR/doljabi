
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OmokRankedMatch() {
  const navigate = useNavigate();

  useEffect(() => {
    // 즉시 대기실로 이동
    navigate('/omok/waiting-room', { 
      state: { 
        isHost: true,
        gameType: 'ranked'
      } 
    });
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
          등급전 매칭 중...
        </h2>
        
        <p className="text-lg" style={{ color: '#9aa1ad' }}>
          레이팅이 비슷한 상대를 찾고 있습니다
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
