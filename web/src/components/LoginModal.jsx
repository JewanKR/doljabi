/**
 * 🔐 LoginModal 컴포넌트
 * - 로그인 모달 팝업
 * - useLogin 훅으로 실제 서버 인증
 */
import React, { useState } from 'react';
import { useLogin } from '../api/endpoints/auth/auth';
import { SessionManager } from '../api/axios-instance';

export const LoginModal = ({ isOpen = true, onClose, onLogin, onSignupClick }) => {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const { mutate: login, isPending } = useLogin({
    mutation: {
      onSuccess: (data) => {
        if (data.success && data.session_key) {
          SessionManager.setSessionKey(data.session_key);
          onLogin && onLogin({ id: loginId });
          onClose && onClose();
        } else {
          setErrorMsg(data.message || '로그인에 실패했습니다.');
        }
      },
      onError: () => {
        setErrorMsg('아이디 또는 비밀번호가 올바르지 않습니다.');
      },
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!loginId || !password) {
      setErrorMsg('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    login({ data: { login_id: loginId, password } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-md bg-on-surface/20">
      <div className="bg-surface-container-lowest w-full max-w-lg rounded-3xl shadow-2xl p-8">
        <div className="flex items-center justify-between mb-8">
          <h3 className="font-bold text-xl text-on-surface">Login</h3>
          <button onClick={onClose} className="p-2 text-on-surface hover:bg-surface-container rounded-full transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              아이디
            </label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              placeholder="sensei_player"
              className="w-full bg-surface-container-low border-none rounded-2xl p-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 placeholder:text-outline/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
              비밀번호
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-surface-container-low border-none rounded-2xl p-4 text-sm text-on-surface focus:ring-2 focus:ring-primary/20 placeholder:text-outline/50"
            />
          </div>

          {errorMsg && (
            <p className="text-sm text-error font-medium">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-primary text-on-primary font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <span>{isPending ? '로그인 중...' : '로그인'}</span>
            {!isPending && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-surface-container-high text-center">
          <p className="text-sm text-outline font-medium">
            계정이 없으신가요?{' '}
            <button
              onClick={onSignupClick}
              className="text-primary font-bold hover:underline ml-1"
            >
              회원가입
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
