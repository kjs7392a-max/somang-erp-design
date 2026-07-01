"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { resolveWelcomeMessage } from "@/lib/welcome";
import { corp } from "@/lib/corp";

export type LoginViewProps = {
  userId: string;
  password: string;
  onUserIdChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  error?: string | null;
  loading?: boolean;
  showBiometric?: boolean;
  biometricLoading?: boolean;
  onBiometricLogin?: () => void;
  biometricError?: string | null;
};

export function LoginView({
  userId,
  password,
  onUserIdChange,
  onPasswordChange,
  onSubmit,
  error = null,
  loading = false,
  showBiometric = false,
  biometricLoading = false,
  onBiometricLogin,
  biometricError = null,
}: LoginViewProps) {
  const [logoOk, setLogoOk] = useState(true);
  const [welcome, setWelcome] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const tick = () => {
      const { message } = resolveWelcomeMessage({ useSpecials: true, useRandom: true });
      setWelcome(message);
    };
    tick();
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-gradient-to-b from-[#dbeafe] to-[#3b82f6]">
      <div className="relative flex flex-1 flex-col justify-between px-5 py-8">
        {/* 상단 — 로고 + 타이틀 + 웰컴 */}
        <div className="animate-somang-fade-in flex flex-col items-center pt-6">
          <div className="mb-3">
            {logoOk ? (
              <Image
                src="/icon-192.png"
                alt="소망병원 로고"
                width={88}
                height={88}
                priority
                unoptimized
                className="h-[88px] w-[88px] rounded-2xl object-contain"
                onError={() => setLogoOk(false)}
              />
            ) : (
              <div className="flex h-[88px] w-[88px] items-center justify-center text-sm font-bold text-[#1e293b]">
                소망
              </div>
            )}
          </div>

          <h1 className="font-display mb-1 text-center text-[1.8rem] font-bold tracking-[0.088em] text-[#1e293b]">
            {corp.name}
          </h1>

          <p
            className="font-display mt-[21px] whitespace-pre-line text-center text-[1.5rem] font-bold leading-[1.25] tracking-[-0.4px] text-[#fdfefe]"
            style={{ textShadow: "0 1px 3px rgba(30,41,91,0.35), 0 2px 12px rgba(30,41,91,0.18)" }}
          >
            {welcome || " \n "}
          </p>
        </div>

        {/* 중앙 — 로그인 카드 */}
        <div className="animate-somang-slide-up">
          <div className="rounded-3xl bg-[#e8f0fd] p-6 shadow-[0_20px_40px_rgba(30,41,91,0.2)]">
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="userId" className="mb-1 block text-[0.9375rem] font-semibold text-[#1e40af]">
                  아이디
                </label>
                <input
                  id="userId"
                  name="userId"
                  type="text"
                  value={userId}
                  onChange={(e) => onUserIdChange(e.target.value.toUpperCase())}
                  placeholder="아이디를 입력하세요"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  className="w-full rounded-xl border border-[#cddcfa] bg-white px-4 py-3.5 text-[0.9375rem] text-[#1e293b] outline-none transition-all duration-300 placeholder:text-[#9bafd5] focus:border-[#3b82f6] focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="mb-1 block text-[0.9375rem] font-semibold text-[#1e40af]">
                  비밀번호
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => onPasswordChange(e.target.value)}
                    placeholder="비밀번호를 입력하세요"
                    className="w-full rounded-xl border border-[#cddcfa] bg-white px-4 py-3.5 pr-12 text-[0.9375rem] text-[#1e293b] outline-none transition-all duration-300 placeholder:text-[#9bafd5] focus:border-[#3b82f6] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#9bafd5] transition-colors hover:text-[#3b82f6]"
                    aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
                  {error}
                </p>
              )}

              {biometricError && (
                <p className="rounded-xl bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-700">
                  지문 인증 오류: {biometricError.replace(/^NO_CREDENTIAL:\s*/, "")}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-4 w-full cursor-pointer rounded-2xl border-none bg-[#3b82f6] py-4 text-[1.0625rem] font-semibold text-white shadow-[0_4px_12px_rgba(59,130,246,0.35)] transition-all duration-200 hover:bg-[#2563eb] active:scale-[0.98] disabled:opacity-60"
              >
                {loading ? "로그인 중..." : "로그인"}
              </button>

              {showBiometric && (
                <>
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-[#c5d2ec]" />
                    <span className="text-xs font-medium text-[#9bafd5]">또는</span>
                    <div className="h-px flex-1 bg-[#c5d2ec]" />
                  </div>
                  <button
                    type="button"
                    onClick={onBiometricLogin}
                    disabled={biometricLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#3b82f6] bg-white py-4 text-[1.0625rem] font-semibold text-[#3b82f6] transition-all duration-200 active:scale-[0.98] disabled:opacity-60"
                  >
                    <span className="text-xl leading-none">👆</span>
                    {biometricLoading ? "인증 중..." : "지문으로 로그인"}
                  </button>
                </>
              )}

              <div className="flex items-center justify-center gap-8 pt-2">
                <a href="#" className="text-sm font-medium text-[#6b7aa1] no-underline active:opacity-70" onClick={(e) => e.preventDefault()}>
                  아이디 찾기
                </a>
                <div className="h-3 w-px bg-[#c5d2ec]" />
                <a href="#" className="text-sm font-medium text-[#6b7aa1] no-underline active:opacity-70" onClick={(e) => e.preventDefault()}>
                  비밀번호 찾기
                </a>
              </div>
            </form>
          </div>
        </div>

        {/* 하단 저작권 */}
        <div className="pt-4 text-center">
          <p className="text-[0.6875rem] font-normal text-white/85">
            {corp.copyright}
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginView;
