// src/pages/omok/create-room/CreateRoom.tsx

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateRoomRequest } from '../../../api/endpoints/default/default';
import { SessionManager } from '../../../api/axios-instance';
import type { BadukBoardGameConfig } from '../../../api/model';
import CreateRoomView, { GameSettings } from './CreateRoomView';

type TimeToggleOptions = {
  useMainTime: boolean;
  useAdditionalTime: boolean;
  useByoyomiTime: boolean;
  useByoyomiCount: boolean;
};

export default function OmokCreateRoom() {
  const navigate = useNavigate();
  const createRoomMutation = useCreateRoomRequest();

  // 서버에 보낼 실제 config
  const [gameConfig, setGameConfig] = useState<BadukBoardGameConfig>({
    main_time: 600,
    fischer_time: 10,
    overtime: 30,
    remaining_overtime: 3,
  });

  // 토글 상태
  const [timeOptions, setTimeOptions] = useState<TimeToggleOptions>({
    useMainTime: true,
    useAdditionalTime: true,
    useByoyomiTime: true,
    useByoyomiCount: true,
  });

  // API용 config 조절
  const handleConfigSliderChange = (
    field: keyof BadukBoardGameConfig,
    value: number,
  ) => {
    setGameConfig((prev) => ({ ...prev, [field]: value }));
  };

  // UI용 슬라이더 변경 → 내부 config로 맵핑
  const handleUiSliderChange = (
    field: 'mainTime' | 'additionalTime' | 'byoyomiTime' | 'byoyomiCount',
    value: number,
  ) => {
    switch (field) {
      case 'mainTime':
        handleConfigSliderChange('main_time', value);
        break;
      case 'additionalTime':
        handleConfigSliderChange('fischer_time', value);
        break;
      case 'byoyomiTime':
        handleConfigSliderChange('overtime', value);
        break;
      case 'byoyomiCount':
        handleConfigSliderChange('remaining_overtime', value);
        break;
    }
  };

  const toggleSetting = (field: keyof TimeToggleOptions) => {
    setTimeOptions((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleCreateRoom = async () => {
    try {
      const sessionKey = SessionManager.getSessionKey();

      if (!sessionKey) {
        alert('로그인이 필요합니다.');
        navigate('/login');
        return;
      }

      // 토글 상태를 반영한 최종 config 생성
      const finalConfig: BadukBoardGameConfig = {
        ...gameConfig,
        main_time: timeOptions.useMainTime ? gameConfig.main_time : 0,
        fischer_time: timeOptions.useAdditionalTime ? gameConfig.fischer_time : 0,
        overtime: timeOptions.useByoyomiTime ? gameConfig.overtime : 0,
        remaining_overtime: timeOptions.useByoyomiCount
          ? gameConfig.remaining_overtime
          : 0,
      };

      const requestData = {
        game_type: 'omok' as const,
        game_config: finalConfig,
      };

      const response = await createRoomMutation.mutateAsync({
        data: requestData,
      });

      const roomData = {
        enter_code: response.enter_code,
        session_key: sessionKey,
        myColor: 'black' as const,
        game_config: finalConfig,
      };

      localStorage.setItem('omok_room_data', JSON.stringify(roomData));

      console.log('방 생성 성공:', response);

      navigate('/omok/game-room', {
        state: roomData,
      });
    } catch (error) {
      console.error('방 생성 실패:', error);
      alert('방 생성에 실패했습니다.');
    }
  };
  
  const handleLeaveRoom = () => {
    navigate('/');
  };

  // UI에 넘겨줄 형태로 매핑
  const uiSettings: GameSettings = {
    gameType: 'omok',
    mainTime: gameConfig.main_time,
    additionalTime: gameConfig.fischer_time,
    byoyomiTime: gameConfig.overtime,
    byoyomiCount: gameConfig.remaining_overtime,
    useMainTime: timeOptions.useMainTime,
    useAdditionalTime: timeOptions.useAdditionalTime,
    useByoyomiTime: timeOptions.useByoyomiTime,
    useByoyomiCount: timeOptions.useByoyomiCount,
  };

  const canEditSettings = true;
  const isHost = true;

  return (
    <CreateRoomView
      gameSettings={uiSettings}
      canEditSettings={canEditSettings}
      isHost={isHost}
      onToggleSetting={toggleSetting}
      onChangeSlider={handleUiSliderChange}
      onStartGame={handleCreateRoom}
      onLeaveRoom={handleLeaveRoom}
    />
  );
}