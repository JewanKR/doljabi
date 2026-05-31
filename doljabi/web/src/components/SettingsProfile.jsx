/**
 * ⚙️ SettingsProfile 컴포넌트
 * - 설정 및 프로필 페이지
 * - 통계, 닉네임, 테마, 보안 설정
 */
import React, { useState, useEffect } from 'react';
import { SideNav } from './SideNav';
import { useGetUserProfileHandler, useUpdateUsername, useUpdatePassword, useDeleteUser, useGetGameResult } from '../api/endpoints/user/user';
import { SessionManager } from '../api/axios-instance';
import { useMyGames, fetchGameDetail } from '../api/games';
import { buildSgf, downloadSgf, defaultSgfFilename } from '../utils/sgf';

export const SettingsProfile = ({ onNavigate, currentUser, theme = 'light', setTheme, onUsernameChange }) => {
  const [nickname, setNickname] = useState('');
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [profileMsg, setProfileMsg] = useState('');
  const [pwMsg, setPwMsg] = useState('');

  const sessionKey = SessionManager.getSessionKey() || '';

  // 프로필 조회
  const { mutate: fetchProfile, data: profileData } = useGetUserProfileHandler({
    mutation: {
      onSuccess: (data) => {
        if (data.success && data.user?.username) {
          setNickname(data.user.username);
        }
      },
    },
  });

  // 게임 전적 조회
  const { data: gameResult } = useGetGameResult(sessionKey, {
    query: { enabled: !!sessionKey },
  });

  // 내 대국 기록 (백엔드 미구현 시 isError로 처리)
  const { data: myGamesResp, isLoading: gamesLoading, isError: gamesError } = useMyGames(sessionKey);
  const myGames = myGamesResp?.games ?? [];

  // 개별 대국별 다운로드 진행 상태
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadError, setDownloadError] = useState('');

  const handleDownloadGame = async (game) => {
    setDownloadError('');
    setDownloadingId(game.id);
    try {
      const resp = await fetchGameDetail(sessionKey, game.id);
      const detail = resp?.game || resp; // 백엔드 응답 형태 두 가지 모두 허용
      if (!detail || !Array.isArray(detail.history)) {
        throw new Error('잘못된 응답 형식');
      }
      const size = (detail.gameType || game.gameType) === 'omok' ? 15 : 19;
      const sgf = buildSgf(detail.history, {
        size,
        blackName: detail.blackName ?? game.blackName,
        whiteName: detail.whiteName ?? game.whiteName,
        komi: detail.komi,
        ruleset: detail.ruleset,
        timeLimit: detail.timeLimit,
        date: detail.playedAt ?? game.playedAt,
        result: detail.result ?? game.result,
      });
      downloadSgf(sgf, defaultSgfFilename({
        blackName: detail.blackName ?? game.blackName,
        whiteName: detail.whiteName ?? game.whiteName,
        date: detail.playedAt ?? game.playedAt,
      }));
    } catch (e) {
      setDownloadError(`다운로드 실패: ${e?.message || e}`);
    } finally {
      setDownloadingId(null);
    }
  };

  const formatPlayedAt = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' });
  };

  useEffect(() => {
    if (sessionKey) {
      fetchProfile({ data: { session_key: sessionKey } });
    }
  }, [sessionKey]);

  // 닉네임 변경
  const { mutate: updateUsername, isPending: isUpdatingName } = useUpdateUsername({
    mutation: {
      onSuccess: (data) => {
        setProfileMsg(data.success ? '닉네임이 변경됐습니다.' : data.message || '변경 실패');
        if (data.success) onUsernameChange && onUsernameChange(nickname);
      },
      onError: () => setProfileMsg('닉네임 변경 중 오류가 발생했습니다.'),
    },
  });

  // 비밀번호 변경
  const { mutate: updatePassword, isPending: isUpdatingPw } = useUpdatePassword({
    mutation: {
      onSuccess: (data) => {
        setPwMsg(data.success ? '비밀번호가 변경됐습니다.' : data.message || '변경 실패');
        if (data.success) { setCurrentPw(''); setNewPw(''); setConfirmPw(''); }
      },
      onError: () => setPwMsg('비밀번호 변경 중 오류가 발생했습니다.'),
    },
  });

  // 계정 삭제
  const { mutate: deleteUser } = useDeleteUser({
    mutation: {
      onSuccess: () => {
        SessionManager.clearSessionKey();
        onNavigate && onNavigate('logout');
      },
    },
  });

  const handleNicknameSubmit = (e) => {
    e.preventDefault();
    setProfileMsg('');
    updateUsername({ data: { session_key: sessionKey, new_username: nickname } });
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    setPwMsg('');
    if (newPw !== confirmPw) { setPwMsg('새 비밀번호가 일치하지 않습니다.'); return; }
    updatePassword({ data: { session_key: sessionKey, current_password: currentPw, new_password: newPw } });
  };

  const handleDeleteAccount = () => {
    if (window.confirm('정말 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      deleteUser({ data: { session_key: sessionKey } });
    }
  };

  const win = gameResult?.win ?? 0;
  const lose = gameResult?.lose ?? 0;
  const draw = gameResult?.draw ?? 0;
  const total = win + lose + draw;

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <SideNav activeNav="settings" onNavigate={onNavigate} currentUser={currentUser} />

      <main className="md:ml-64 pt-16 md:pt-12 px-3 md:px-12 pb-12 overflow-x-hidden">
        <div className="max-w-6xl mx-auto space-y-6">
          <h2 className="text-2xl md:text-5xl font-black text-on-surface tracking-tighter">설정</h2>

          <div className="flex flex-col gap-4">

            {/* 테마 */}
            <div className="bg-surface-container-lowest rounded-xl p-4 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">palette</span>
                <h3 className="text-base font-bold">테마 설정</h3>
              </div>
              <div className="flex items-center justify-between p-3 bg-surface rounded-xl flex-wrap gap-2">
                <span className="font-medium text-sm">화면 모드</span>
                <div className="flex bg-surface-container-high p-1 rounded-lg">
                  <button
                    onClick={() => setTheme('light')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      theme === 'light' ? 'bg-surface-container-lowest shadow-sm text-on-surface' : 'text-on-surface-variant'
                    }`}
                  >
                    라이트
                  </button>
                  <button
                    onClick={() => setTheme('dark')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      theme === 'dark' ? 'bg-surface-container-lowest shadow-sm text-on-surface' : 'text-on-surface-variant'
                    }`}
                  >
                    다크
                  </button>
                </div>
              </div>
            </div>

            {/* 로그인 상태에서만 표시 */}
            {currentUser && (
              <>
                {/* 승률 통계 */}
                <div className="bg-surface-container-lowest rounded-xl p-4 flex flex-col gap-4">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <h3 className="text-xs font-bold tracking-widest uppercase text-on-surface-variant">전적 분석</h3>
                      <p className="text-lg font-bold text-on-surface">승률 통계</p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-on-surface-variant block uppercase tracking-wide">총 대국</span>
                      <span className="text-2xl font-black text-primary">{total.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    {total > 0 ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold">전체</span>
                          <span className="text-xs font-bold px-2 py-1 rounded-full text-on-secondary-container bg-secondary-container">
                            {Math.round((win / total) * 100)}% 승률
                          </span>
                        </div>
                        <div className="relative h-3 w-full bg-surface-container-high rounded-full overflow-hidden">
                          <div
                            className="absolute h-full bg-primary rounded-full"
                            style={{ width: `${Math.round((win / total) * 100)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                          <span>승: {win}</span>
                          <span>무: {draw}</span>
                          <span>패: {lose}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-on-surface-variant">아직 게임 기록이 없습니다.</p>
                    )}
                  </div>
                </div>

                {/* 내 대국 기록 (SGF 다운로드) */}
                <div className="bg-surface-container-lowest rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary text-lg">history</span>
                      <h3 className="text-base font-bold">내 대국 기록</h3>
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      SGF 다운로드
                    </span>
                  </div>

                  {gamesLoading && (
                    <p className="text-sm text-on-surface-variant py-2">대국 목록 불러오는 중…</p>
                  )}

                  {gamesError && (
                    <p className="text-xs text-on-surface-variant py-2">
                      대국 기록을 불러올 수 없습니다. (백엔드 API 준비 중)
                    </p>
                  )}

                  {!gamesLoading && !gamesError && myGames.length === 0 && (
                    <p className="text-sm text-on-surface-variant py-2">아직 저장된 대국이 없습니다.</p>
                  )}

                  {!gamesLoading && !gamesError && myGames.length > 0 && (
                    <ul className="flex flex-col gap-1 max-h-80 overflow-y-auto">
                      {myGames.map((game) => (
                        <li
                          key={game.id}
                          className="grid grid-cols-[1fr_auto] items-center gap-2 p-3 rounded-lg hover:bg-surface-container transition-colors"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-sm font-bold truncate">
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-primary/15 text-primary uppercase">
                                {game.gameType === 'omok' ? '오목' : '바둑'}
                              </span>
                              <span className="truncate">{game.blackName ?? '?'}</span>
                              <span className="text-on-surface-variant">vs</span>
                              <span className="truncate">{game.whiteName ?? '?'}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-on-surface-variant">
                              <span className="font-mono">{game.result || '-'}</span>
                              <span>·</span>
                              <span>{game.moveCount ?? '?'}수</span>
                              <span>·</span>
                              <span>{formatPlayedAt(game.playedAt)}</span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleDownloadGame(game)}
                            disabled={downloadingId === game.id}
                            className="flex items-center gap-1 px-3 py-2 bg-primary text-on-primary rounded-lg text-xs font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-base">download</span>
                            {downloadingId === game.id ? '받는중…' : 'SGF'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {downloadError && (
                    <p className="text-xs text-error font-medium">{downloadError}</p>
                  )}
                </div>

                {/* 프로필 */}
                <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-4">
                  <h3 className="text-base font-bold">프로필</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center text-on-primary text-2xl font-black flex-shrink-0">
                      {(nickname || currentUser.id).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">랭크</span>
                      <p className="font-black text-lg text-primary">
                        {profileData?.user?.rating != null ? `${profileData.user.rating}점` : '-'}
                      </p>
                    </div>
                  </div>
                  <form className="space-y-3" onSubmit={handleNicknameSubmit}>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">닉네임</label>
                      <input
                        type="text"
                        value={nickname}
                        onChange={(e) => setNickname(e.target.value)}
                        className="w-full bg-surface-container-highest border-none rounded-lg focus:ring-2 focus:ring-primary text-sm p-3 text-on-surface"
                      />
                    </div>
                    {profileMsg && <p className="text-xs text-primary font-medium">{profileMsg}</p>}
                    <button
                      type="submit"
                      disabled={isUpdatingName}
                      className="w-full py-3 bg-primary text-on-primary rounded-lg text-sm font-bold active:scale-95 transition-all disabled:opacity-60"
                    >
                      {isUpdatingName ? '변경 중...' : '닉네임 변경'}
                    </button>
                  </form>
                </div>

                {/* 비밀번호 변경 */}
                <div className="bg-surface-container-lowest rounded-xl p-4 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-lg">shield_lock</span>
                    <h3 className="text-base font-bold">비밀번호 변경</h3>
                  </div>
                  <form className="space-y-3" onSubmit={handlePasswordSubmit}>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">현재 비밀번호</label>
                      <input
                        type="password"
                        value={currentPw}
                        onChange={(e) => setCurrentPw(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-surface-container border-none rounded-lg focus:ring-2 focus:ring-primary text-sm p-3"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">새 비밀번호</label>
                      <input
                        type="password"
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-surface-container border-none rounded-lg focus:ring-2 focus:ring-primary text-sm p-3"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">비밀번호 확인</label>
                      <input
                        type="password"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-surface-container border-none rounded-lg focus:ring-2 focus:ring-primary text-sm p-3"
                      />
                    </div>
                    {pwMsg && <p className="text-xs text-primary font-medium">{pwMsg}</p>}
                    <button
                      type="submit"
                      disabled={isUpdatingPw}
                      className="w-full py-3 bg-surface-container-high text-primary rounded-lg text-sm font-bold hover:bg-surface-container-highest transition-colors disabled:opacity-60"
                    >
                      {isUpdatingPw ? '변경 중...' : '변경하기'}
                    </button>
                  </form>
                </div>

                {/* 계정 삭제 */}
                <div className="bg-error-container/20 rounded-xl p-4 border border-error/10 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-error text-lg">warning</span>
                    <h3 className="text-base font-bold text-error">계정 삭제</h3>
                  </div>
                  <p className="text-sm text-on-surface-variant">
                    계정을 삭제하면 모든 대국 기록, 랭킹, 칭호가 영구적으로 삭제되며 복구할 수 없습니다.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="w-full py-3 bg-error text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors active:scale-95"
                  >
                    계정 삭제
                  </button>
                </div>
              </>
            )}

            {/* 비로그인 안내 */}
            {!currentUser && (
              <div className="bg-surface-container-low rounded-xl p-8 flex flex-col items-center gap-4 text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant">lock</span>
                <p className="text-on-surface-variant text-sm">로그인하면 승률, 프로필, 보안 설정을 이용할 수 있습니다.</p>
                <button
                  onClick={() => onNavigate && onNavigate('login')}
                  className="mt-2 px-6 py-3 bg-primary text-on-primary rounded-xl font-bold active:scale-95 transition-all"
                >
                  로그인하기
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
