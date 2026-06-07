"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { resolveWelcomeMessage } from "@/lib/welcome";

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

  useEffect(() => {
    const tick = () => {
      const { message } = resolveWelcomeMessage({
        useSpecials: true,
        useRandom: true,
      });
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
                src="/somang-logo.svg"
                alt="소망병원 로고"
                width={88}
                height={88}
                priority
                unoptimized
                className="h-[88px] w-[88px] object-contain"
                onError={() => setLogoOk(false)}
              />
            ) : (
              <div className="flex h-[88px] w-[88px] items-center justify-center text-sm font-bold text-[#1e293b]">
                소망
              </div>
            )}
          </div>

          <h1 className="font-display mb-2 text-center text-[1.8rem] font-bold tracking-[0.088em] text-[#1e293b]">
            소망의료재단
          </h1>

          <p
            className="font-display mt-[21px] whitespace-pre-line text-center text-[1.5rem] font-bold leading-[1.25] tracking-[-0.4px] text-[#fdfefe]"
            style={{
              textShadow:
                "0 1px 3px rgba(30,41,91,0.35), 0 2px 12px rgba(30,41,91,0.18)",
            }}
          >
            {welcome || " \n "}
          </p>
        </div>

        {/* 중앙 — 로그인 카드 (연한 블루) */}
        <div className="animate-somang-slide-up">
          <div className="rounded-3xl bg-[#e8f0fd] p-6 shadow-[0_20px_40px_rgba(30,41,91,0.2)]">
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="userId"
                  className="mb-1 block text-[0.9375rem] font-semibold text-[#1e40af]"
                >
                  아이디
                </label>
                <input
                  id="userId"
                  name="userId"
                  type="text"
                  value={userId}
                  onChange={(e) => onUserIdChange(e.target.value)}
                  placeholder="아이디를 입력하세요"
                  className="w-full rounded-xl border border-[#cddcfa] bg-white px-4 py-3.5 text-[0.9375rem] text-[#1e293b] outline-none transition-all duration-300 placeholder:text-[#9bafd5] focus:border-[#3b82f6] focus:bg-white"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="mb-1 block text-[0.9375rem] font-semibold text-[#1e40af]"
                >
                  비밀번호
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full rounded-xl border border-[#cddcfa] bg-white px-4 py-3.5 text-[0.9375rem] text-[#1e293b] outline-none transition-all duration-300 placeholder:text-[#9bafd5] focus:border-[#3b82f6] focus:bg-white"
                />
              </div>

              <div className="pt-1">
                <label className="flex cursor-pointer items-center gap-2 active:opacity-70">
                  <input
                    type="checkbox"
                    className="h-[17px] w-[17px] accent-[#3b82f6]"
                  />
                  <span className="text-sm font-medium text-[#4b5d8a]">
                    로그인 유지
                  </span>
                </label>
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
                <a
                  href="#"
                  className="text-sm font-medium text-[#6b7aa1] no-underline active:opacity-70"
                  onClick={(e) => e.preventDefault()}
                >
                  아이디 찾기
                </a>
                <div className="h-3 w-px bg-[#c5d2ec]" />
                <a
                  href="#"
                  className="text-sm font-medium text-[#6b7aa1] no-underline active:opacity-70"
                  onClick={(e) => e.preventDefault()}
                >
                  비밀번호 찾기
                </a>
              </div>
            </form>
          </div>
        </div>

        {/* 하단 저작권 */}
        <div className="pt-4 text-center">
          <p className="text-[0.6875rem] font-normal text-white/85">
            © 2026 소망의료재단. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
