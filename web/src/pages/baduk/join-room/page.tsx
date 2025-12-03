import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionManager } from '../../../api/axios-instance';

export default function BadukJoinRoom() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [error, setError] = useState('');

  const handleJoinRoom = () => {
    const sessionKey = SessionManager.getSessionKey();

    console.log('🚪 바둑 방 입장 시도:', roomCode);
    console.log('🔑 세션키:', sessionKey ? '있음' : '없음');

    if (!roomCode.trim()) {
      setError('방 입장 코드를 입력해주세요.');
      return;
    }

    if (!sessionKey) {
      console.error('❌ 로그인 필요');
      setError('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    // 방 입장 정보 저장
    const roomData = {
      enter_code: parseInt(roomCode, 10),
      session_key: sessionKey,
      isHost: false
    };

    localStorage.setItem('baduk_room_data', JSON.stringify(roomData));
    console.log('💾 방 입장 설정 저장:', roomData);

    console.log('🚀 게임방으로 이동');
    navigate('/baduk/game-room');
  };

  return (
    <div className="min-h-screen text-white p-8" style={{ backgroundColor: '#0b0c10' }}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#e8eaf0' }}>바둑 방 입장</h1>
          <p style={{ color: '#9aa1ad' }}>입장 코드를 입력하세요</p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="rounded-xl p-8 border"
               style={{
                 backgroundColor: 'rgba(22,22,28,0.6)',
                 borderColor: '#2a2a33',
                 boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
               }}>
            <h3 className="text-2xl font-bold mb-6" style={{ color: '#e8eaf0' }}>입장 코드 입력</h3>

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
              <label className="block text-sm font-medium mb-3" style={{ color: '#e8eaf0' }}>
                방 입장 코드
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(e.target.value);
                  setError('');
                }}
                placeholder="예: 12345"
                className="w-full px-4 py-4 rounded-lg border text-xl text-center font-bold tracking-wider"
                style={{
                  backgroundColor: '#141822',
                  borderColor: '#2a2a33',
                  color: '#e8eaf0'
                }}
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

          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/')}
              className="px-8 py-3 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap border"
              style={{
                backgroundColor: '#141822',
                borderColor: '#2a2a33',
                color: '#e8eaf0'
              }}>
              돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
