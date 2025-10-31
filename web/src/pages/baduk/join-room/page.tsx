
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function BadukJoinRoom() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  const handleJoinRoom = () => {
    if (!roomCode.trim()) {
      setError('방 입장 코드를 입력해주세요.');
      return;
    }
    
    // 방 코드를 state로 전달하며 대기실로 이동
    navigate('/baduk/waiting-room', { state: { roomCode, isHost: false } });
  };

  return (
    <div className="min-h-screen text-white p-8" style={{ backgroundColor: '#0b0c10' }}>
      <div className="max-w-md mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#e8eaf0' }}>방 입장</h1>
          <p style={{ color: '#9aa1ad' }}>친구의 방 코드를 입력하세요</p>
        </div>

        <div className="rounded-xl p-6 border mb-6"
             style={{ 
               backgroundColor: 'rgba(22,22,28,0.6)', 
               borderColor: '#2a2a33'
             }}>
          {error && (
            <div className="mb-4 p-3 rounded-lg border"
                 style={{ 
                   backgroundColor: 'rgba(239, 68, 68, 0.1)', 
                   borderColor: '#ef4444',
                   color: '#ef4444'
                 }}>
              {error}
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2" style={{ color: '#e8eaf0' }}>
              방 입장 코드
            </label>
            <input
              type="text"
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="예: ABC123"
              className="w-full px-4 py-3 rounded-lg border text-lg text-center font-bold tracking-wider"
              style={{ 
                backgroundColor: '#141822', 
                borderColor: '#2a2a33',
                color: '#e8eaf0'
              }}
              maxLength={6}
            />
          </div>

          <button 
            onClick={handleJoinRoom}
            className="w-full py-4 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap text-white"
            style={{ 
              background: 'linear-gradient(180deg, #1f6feb, #1b4fd8)',
              boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
            }}>
            방 입장하기
          </button>
        </div>

        <button 
          onClick={() => navigate('/')}
          className="w-full py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap border"
          style={{ 
            backgroundColor: '#141822', 
            borderColor: '#2a2a33',
            color: '#e8eaf0'
          }}>
          돌아가기
        </button>
      </div>
    </div>
  );
}
