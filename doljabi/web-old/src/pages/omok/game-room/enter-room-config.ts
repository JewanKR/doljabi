// 방 입장 관련 설정을 관리하는 모듈

export interface RoomConfig {
  enter_code: number;
  session_key: string;
  game_config?: any;
  isHost?: boolean;
}

const ROOM_CONFIG_KEY = 'omok_room_config';

/**
 * 방 입장 설정을 저장합니다.
 */
export function saveRoomConfig(config: RoomConfig): void {
  try {
    localStorage.setItem(ROOM_CONFIG_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('방 설정 저장 실패:', error);
  }
}

/**
 * 저장된 방 입장 설정을 불러옵니다.
 */
export function loadRoomConfig(): RoomConfig | null {
  try {
    const stored = localStorage.getItem(ROOM_CONFIG_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('방 설정 불러오기 실패:', error);
    return null;
  }
}

/**
 * 저장된 방 입장 설정을 삭제합니다.
 */
export function clearRoomConfig(): void {
  try {
    localStorage.removeItem(ROOM_CONFIG_KEY);
  } catch (error) {
    console.error('방 설정 삭제 실패:', error);
  }
}

/**
 * 방 입장 코드만 가져옵니다.
 */
export function getEnterCode(): number | null {
  const config = loadRoomConfig();
  return config?.enter_code || null;
}

/**
 * 세션 키만 가져옵니다.
 */
export function getSessionKey(): string | null {
  const config = loadRoomConfig();
  return config?.session_key || null;
}

/**
 * 게임 설정만 가져옵니다.
 */
export function getGameConfig(): any {
  const config = loadRoomConfig();
  return config?.game_config;
}
