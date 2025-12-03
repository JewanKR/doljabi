import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateRoomRequest } from '../../../api/endpoints/default/default';
import { SessionManager } from '../../../api/axios-instance';
import type { BadukBoardGameConfig } from '../../../api/model';
import { saveRoomConfig } from '../game-room/enter-room-config';

export default function OmokCreateRoom() {
  const navigate = useNavigate();
  const createRoomMutation = useCreateRoomRequest();

  const [gameConfig, setGameConfig] = useState<BadukBoardGameConfig>({
    main_time: 600,
    fischer_time: 10,
    overtime: 30,
    remaining_overtime: 3
  });

  const handleSliderChange = (field: keyof BadukBoardGameConfig, value: number) => {
    setGameConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateRoom = async () => {
    try {
      const sessionKey = SessionManager.getSessionKey();

      if (!sessionKey) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      const requestData = {
        game_type: 'omok' as const,
        game_config: gameConfig
      };

      const response = await createRoomMutation.mutateAsync({
        data: requestData
      });

      // 방 생성 응답 저장
      const roomConfig = {
        enter_code: response.enter_code,
        session_key: sessionKey,
        game_config: gameConfig,
        isHost: true
      };

      // enter-room-config.ts를 이용해 저장
      saveRoomConfig(roomConfig);

      console.log('방 생성 성공:', response);

      // 방 생성 성공 시 게임방으로 이동
      navigate('/omok/game-room');
    } catch (error) {
      console.error('방 생성 실패:', error);
      alert('방 생성에 실패했습니다.');
    }
  };

  const formatTime = (seconds: number): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) {
      return `${h}시간 ${m}분`;
    }
    if (m > 0) {
      return `${m}분`;
    }
    return `${s}초`;
  };

  return (
    <div className="min-h-screen text-white p-8" style={{ backgroundColor: '#0b0c10' }}>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: '#e8eaf0' }}>오목 방 만들기</h1>
          <p style={{ color: '#9aa1ad' }}>게임 설정을 조정하고 방을 생성하세요</p>
        </div>

        {/* 게임 설정 */}
        <div className="rounded-xl p-6 border mb-6"
          style={{
            backgroundColor: 'rgba(22,22,28,0.6)',
            borderColor: '#2a2a33'
          }}>
          <h3 className="text-xl font-bold mb-6" style={{ color: '#e8eaf0' }}>게임 설정</h3>

          <div className="grid grid-cols-2 gap-8">
            {/* 기본 시간 설정 */}
            <div>
              <h4 className="text-lg font-semibold mb-4" style={{ color: '#8ab4f8' }}>기본 시간 설정</h4>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ color: '#9aa1ad' }}>메인 시간</span>
                    <span className="font-mono font-semibold" style={{ color: '#e8eaf0' }}>
                      {formatTime(gameConfig.main_time)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="3600"
                    step="60"
                    value={gameConfig.main_time}
                    onChange={(e) => handleSliderChange('main_time', parseInt(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #1f6feb 0%, #1f6feb ${(gameConfig.main_time / 3600) * 100}%, #2a2a33 ${(gameConfig.main_time / 3600) * 100}%, #2a2a33 100%)`
                    }}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ color: '#9aa1ad' }}>피셔 시간</span>
                    <span className="font-mono font-semibold" style={{ color: '#e8eaf0' }}>
                      {gameConfig.fischer_time}초
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="1"
                    value={gameConfig.fischer_time}
                    onChange={(e) => handleSliderChange('fischer_time', parseInt(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #1f6feb 0%, #1f6feb ${(gameConfig.fischer_time / 60) * 100}%, #2a2a33 ${(gameConfig.fischer_time / 60) * 100}%, #2a2a33 100%)`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 초읽기 설정 */}
            <div>
              <h4 className="text-lg font-semibold mb-4" style={{ color: '#8ab4f8' }}>초읽기 설정</h4>
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ color: '#9aa1ad' }}>초읽기 시간</span>
                    <span className="font-mono font-semibold" style={{ color: '#e8eaf0' }}>
                      {gameConfig.overtime}초
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="300"
                    step="1"
                    value={gameConfig.overtime}
                    onChange={(e) => handleSliderChange('overtime', parseInt(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #1f6feb 0%, #1f6feb ${(gameConfig.overtime / 300) * 100}%, #2a2a33 ${(gameConfig.overtime / 300) * 100}%, #2a2a33 100%)`
                    }}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span style={{ color: '#9aa1ad' }}>초읽기 횟수</span>
                    <span className="font-mono font-semibold" style={{ color: '#e8eaf0' }}>
                      {gameConfig.remaining_overtime}회
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="1"
                    value={gameConfig.remaining_overtime}
                    onChange={(e) => handleSliderChange('remaining_overtime', parseInt(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, #1f6feb 0%, #1f6feb ${(gameConfig.remaining_overtime / 10) * 100}%, #2a2a33 ${(gameConfig.remaining_overtime / 10) * 100}%, #2a2a33 100%)`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 방 만들기 버튼 */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-4 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap border"
            style={{
              backgroundColor: '#141822',
              borderColor: '#2a2a33',
              color: '#e8eaf0'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#ef4444';
              e.currentTarget.style.color = '#ef4444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#2a2a33';
              e.currentTarget.style.color = '#e8eaf0';
            }}>
            취소
          </button>

          <button
            onClick={handleCreateRoom}
            disabled={createRoomMutation.isPending}
            className="px-8 py-4 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap text-white text-lg"
            style={{
              background: createRoomMutation.isPending ? '#2a2a33' : 'linear-gradient(180deg, #1f6feb, #1b4fd8)',
              boxShadow: createRoomMutation.isPending ? 'none' : '0 2px 8px rgba(0,0,0,0.3)',
              opacity: createRoomMutation.isPending ? 0.5 : 1,
              cursor: createRoomMutation.isPending ? 'not-allowed' : 'pointer'
            }}>
            {createRoomMutation.isPending ? '방 생성 중...' : '방 만들기'}
          </button>
        </div>

        {/* 에러 메시지 */}
        {createRoomMutation.isError && (
          <div className="mt-4 p-4 rounded-lg text-center"
            style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
            방 생성에 실패했습니다. 다시 시도해주세요.
          </div>
        )}
      </div>
    </div>
  );
}
