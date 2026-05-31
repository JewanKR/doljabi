/**
 * 사용자 과거 대국 기록 API.
 *
 * ⚠ 백엔드 미구현 상태로, 아래 시그니처가 추가될 것을 가정하고 작성함.
 *   백엔드 스펙이 다르게 확정되면 이 파일에서만 어댑팅하면 됨.
 *
 *   GET /api/user/games/session/{sessionKey}
 *     → { success: true, games: GameSummary[] }
 *
 *   GET /api/user/games/{gameId}/session/{sessionKey}
 *     → { success: true, game: GameDetail }
 *
 * 타입:
 *   GameSummary = {
 *     id:        string,        // 백엔드 고유 ID
 *     gameType:  'go' | 'omok',
 *     blackName: string,
 *     whiteName: string,
 *     result:    string,        // 'B+R' / 'W+5.5' / '0' / ...
 *     playedAt:  string,        // ISO datetime
 *     moveCount: number,
 *   }
 *   GameDetail = GameSummary & {
 *     history:   Array<{ col, row, color: 'black'|'white', pass?: boolean }>,
 *     komi?:     number,
 *     ruleset?:  string,
 *     timeLimit?: number,       // 초
 *   }
 */
import { useQuery } from '@tanstack/react-query';
import { customInstance } from './axios-instance';

export const fetchMyGames = (sessionKey) =>
  customInstance({
    url: `/api/user/games/session/${sessionKey}`,
    method: 'GET',
  });

export const fetchGameDetail = (sessionKey, gameId) =>
  customInstance({
    url: `/api/user/games/${encodeURIComponent(gameId)}/session/${sessionKey}`,
    method: 'GET',
  });

/**
 * 대국 목록 조회 훅.
 * sessionKey가 falsy면 자동 비활성화.
 */
export const useMyGames = (sessionKey) =>
  useQuery({
    queryKey: ['myGames', sessionKey],
    queryFn: () => fetchMyGames(sessionKey),
    enabled: !!sessionKey,
    retry: false, // 백엔드 미구현 상태에서 무한 재시도 방지
  });
