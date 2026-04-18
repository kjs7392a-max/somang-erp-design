"use client";

import Image from "next/image";
import { useState } from "react";

export type LoginViewProps = {
  userId: string;
  password: string;
  onUserIdChange: (v: string) => void;
  onPasswordChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
};

export function LoginView({
  userId,
  password,
  onUserIdChange,
  onPasswordChange,
  onSubmit,
}: LoginViewProps) {
  const [logoOk, setLogoOk] = useState(true);

  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-gradient-to-b from-[#d4ebf2] to-[#5bb5cf]">
      <div className="relative flex flex-1 flex-col justify-between px-4 py-6">
        <div className="animate-somang-fade-in flex flex-col items-center pt-4">
          <div className="mb-4">
            {logoOk ? (
              <Image
                src="/somang-logo.svg"
                alt="소망병원 로고"
                width={240}
                height={120}
                priority
                unoptimized
                className="h-[120px] w-auto object-contain"
                onError={() => setLogoOk(false)}
              />
            ) : (
              <span className="text-2xl font-bold text-[#2d5c6e]">소망병원</span>
            )}
          </div>
          <h1 className="-mt-2 mb-2 text-center text-2xl font-bold tracking-[0.088em] text-[#2d5c6e]">
            소망의료재단
          </h1>
        </div>

        <div className="animate-somang-slide-up">
          <div className="rounded-3xl bg-white p-5 shadow-[0_8px_24px_rgba(91,181,207,0.15)]">
            <form onSubmit={onSubmit} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="userId"
                  className="mb-2 block text-[0.9375rem] font-semibold text-[#00a0c6]"
                >
                  아이디
                </label>
                <input
                  id="userId"
                  type="text"
                  value={userId}
                  onChange={(e) => onUserIdChange(e.target.value)}
                  placeholder="아이디를 입력하세요"
                  className="w-full rounded-xl border border-[#e0eff3] bg-[#f5f9fa] px-4 py-3.5 text-[0.9375rem] text-[#2d5c6e] outline-none transition-all duration-300 focus:border-[#5bb5cf] focus:bg-white"
                />
              </div>
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="mb-2 block text-[0.9375rem] font-semibold text-[#00a0c6]"
                >
                  비밀번호
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  className="w-full rounded-xl border border-[#e0eff3] bg-[#f5f9fa] px-4 py-3.5 text-[0.9375rem] text-[#2d5c6e] outline-none transition-all duration-300 focus:border-[#5bb5cf] focus:bg-white"
                />
              </div>
              <div className="pt-1">
                <label className="flex cursor-pointer items-center gap-2 active:opacity-70">
                  <input
                    type="checkbox"
                    className="h-[17px] w-[17px] accent-[#5bb5cf]"
                  />
                  <span className="text-sm font-medium text-[#6b8c9a]">
                    로그인 유지
                  </span>
                </label>
              </div>
              <button
                type="submit"
                className="mt-6 w-full cursor-pointer rounded-2xl border-none bg-[#5bb5cf] py-4 text-[1.0625rem] font-semibold text-white shadow-[0_4px_12px_rgba(91,181,207,0.3)] transition-all duration-200 active:scale-[0.98]"
              >
                로그인
              </button>
              <div className="flex items-center justify-center gap-8 pt-4">
                <a
                  href="#"
                  className="text-sm font-medium text-[#8ba8b3] no-underline active:opacity-70"
                  onClick={(e) => e.preventDefault()}
                >
                  아이디 찾기
                </a>
                <div className="h-3 w-px bg-[#d0dfe5]" />
                <a
                  href="#"
                  className="text-sm font-medium text-[#8ba8b3] no-underline active:opacity-70"
                  onClick={(e) => e.preventDefault()}
                >
                  비밀번호 찾기
                </a>
              </div>
            </form>
          </div>
        </div>

        <div className="pt-4 text-center">
          <p className="text-[0.6875rem] font-normal text-white/85">
            © 2026 소망의료재단. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
