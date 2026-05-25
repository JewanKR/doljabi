/**
 * ✍️ SignUpModal 컴포넌트
 * - 회원가입 모달 팝업
 * - useSignup 훅으로 실제 서버 회원가입
 */
import React, { useState } from 'react';
import { useSignup } from '../api/endpoints/auth/auth';

export const SignUpModal = ({ isOpen = true, onClose = () => {}, onLoginClick }) => {
  const [nickname, setNickname] = useState('');
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { mutate: signup, isPending } = useSignup({
    mutation: {
      onSuccess: (data) => {
        if (data.success) {
          setSuccessMsg('회원가입이 완료됐습니다. 로그인해주세요.');
          setTimeout(() => { onLoginClick && onLoginClick(); }, 1500);
        } else {
          setErrorMsg(data.message || '회원가입에 실패했습니다.');
        }
      },
      onError: () => {
        setErrorMsg('이미 사용 중인 아이디이거나 서버 오류가 발생했습니다.');
      },
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    if (!nickname || !loginId || !password) {
      setErrorMsg('모든 항목을 입력해주세요.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (!agreeTerms) {
      setErrorMsg('약관에 동의해주세요.');
      return;
    }
    signup({ data: { username: nickname, login_id: loginId, password } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-xl overflow-hidden flex flex-col relative shadow-2xl">
        <div className="h-2 bg-gradient-to-r from-primary to-primary-container w-full"></div>

        <div className="p-8 md:p-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-surface-container-high rounded-xl mb-4">
              <span className="material-symbols-outlined text-primary text-3xl">token</span>
            </div>
            <h1 className="text-2xl font-black text-on-surface tracking-tight">계정 생성</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              계정을 생성하여 새로운 모험을 시작하세요!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant px-1">
                닉네임
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="TheGoMaster99"
                className="block w-full px-4 py-3 bg-surface-container-low border-none rounded-lg text-sm text-on-surface placeholder:text-outline-variant focus:ring-1 focus:ring-primary focus:bg-surface-container-highest transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant px-1">
                아이디
              </label>
              <input
                type="text"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="sensei_player"
                className="block w-full px-4 py-3 bg-surface-container-low border-none rounded-lg text-sm text-on-surface placeholder:text-outline-variant focus:ring-1 focus:ring-primary focus:bg-surface-container-highest transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant px-1">
                  비밀번호
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full px-4 py-3 bg-surface-container-low border-none rounded-lg text-sm text-on-surface placeholder:text-outline-variant focus:ring-1 focus:ring-primary focus:bg-surface-container-highest transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant px-1">
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full px-4 py-3 bg-surface-container-low border-none rounded-lg text-sm text-on-surface placeholder:text-outline-variant focus:ring-1 focus:ring-primary focus:bg-surface-container-highest transition-all"
                />
              </div>
            </div>

            <div className="flex items-start gap-3 py-2">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 text-primary border-outline-variant rounded focus:ring-primary bg-surface-container-low mt-1"
              />
              <label className="text-xs text-on-surface-variant leading-tight">
                본인은 서비스 약관에 동의하며{' '}
                <a className="text-primary font-bold hover:underline" href="#">개인정보 보호정책을</a>
                {' '}숙지했습니다.
              </label>
            </div>

            {errorMsg && <p className="text-sm text-error font-medium">{errorMsg}</p>}
            {successMsg && <p className="text-sm text-primary font-medium">{successMsg}</p>}

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-lg shadow-lg hover:scale-[0.98] active:scale-[0.96] transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span>{isPending ? '처리 중...' : '회원가입'}</span>
              {!isPending && <span className="material-symbols-outlined text-lg">arrow_forward</span>}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-surface-container-high text-center">
            <p className="text-xs text-on-surface-variant">
              이미 계정이 있으신가요?{' '}
              <button
                onClick={onLoginClick}
                className="text-primary font-black ml-1 hover:underline tracking-tight"
              >
                로그인
              </button>
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-on-surface hover:bg-surface-container-high rounded-full transition-colors"
        >
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
    </div>
  );
};
