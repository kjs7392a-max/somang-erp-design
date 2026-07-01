"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

type BiometricType = "faceid" | "fingerprint";

function detectBiometricType(): BiometricType {
  if (typeof navigator === "undefined") return "fingerprint";
  return /iPhone/.test(navigator.userAgent) ? "faceid" : "fingerprint";
}

const BIOMETRIC_CONFIG: Record<BiometricType, { label: string; icon: React.ReactNode }> = {
  faceid: {
    label: "Face ID로 로그인하세요",
    icon: (
      <svg width="52" height="52" viewBox="0 0 52 52" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="2" y="2" width="14" height="14" rx="4" stroke="white" strokeWidth="3" fill="none"/>
        <rect x="36" y="2" width="14" height="14" rx="4" stroke="white" strokeWidth="3" fill="none"/>
        <rect x="2" y="36" width="14" height="14" rx="4" stroke="white" strokeWidth="3" fill="none"/>
        <rect x="36" y="36" width="14" height="14" rx="4" stroke="white" strokeWidth="3" fill="none"/>
        <circle cx="19" cy="22" r="2.5" fill="white"/>
        <circle cx="33" cy="22" r="2.5" fill="white"/>
        <path d="M19 32 Q26 38 33 32" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
        <path d="M26 18 L26 28" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
  },
  fingerprint: {
    label: "지문으로 로그인하세요",
    icon: <span style={{ fontSize: 52 }}>👆</span>,
  },
};

export type BiometricLockScreenProps = {
  loading?: boolean;
  error?: string | null;
  canRetry?: boolean;
  onRetry: () => void;
  onFallback: () => void;
};

export function BiometricLockScreen({
  loading = false,
  error = null,
  canRetry = true,
  onRetry,
  onFallback,
}: BiometricLockScreenProps) {
  const [logoOk, setLogoOk] = useState(true);
  const [bioType, setBioType] = useState<BiometricType>("fingerprint");

  useEffect(() => {
    setBioType(detectBiometricType());
  }, []);

  const cfg = BIOMETRIC_CONFIG[bioType];

  return (
    <div className="relative flex min-h-dvh w-full flex-col bg-gradient-to-b from-[#dbeafe] to-[#3b82f6]">
      <div className="flex flex-1 flex-col items-center justify-between px-5 py-8">
        {/* 상단 — 로고 + 타이틀 */}
        <div className="flex flex-col items-center pt-6">
          {logoOk ? (
            <Image
              src="/icon-192.png"
              alt="소망병원 로고"
              width={72}
              height={72}
              priority
              unoptimized
              className="mb-3 h-[72px] w-[72px] rounded-2xl object-contain"
              onError={() => setLogoOk(false)}
            />
          ) : (
            <div className="mb-3 flex h-[72px] w-[72px] items-center justify-center text-sm font-bold text-[#1e293b]">
              소망
            </div>
          )}
          <h1 className="font-display text-center text-[1.8rem] font-bold tracking-[0.088em] text-[#1e293b]">
            소망의료재단
          </h1>
        </div>

        {/* 중앙 — 지문 아이콘 + 상태 */}
        <div className="flex flex-col items-center gap-5">
          <div
            className={`flex h-24 w-24 items-center justify-center rounded-full bg-white/25 shadow-[0_8px_32px_rgba(30,41,91,0.2)] backdrop-blur-sm transition-all duration-300 ${
              loading ? "animate-pulse scale-105" : ""
            }`}
          >
            {cfg.icon}
          </div>

          <p className="text-center text-[1.25rem] font-semibold text-white drop-shadow-sm">
            {loading ? "인증 중..." : error ? "인증 실패" : cfg.label}
          </p>

          {error && (
            <p className="max-w-[260px] rounded-2xl bg-white/20 px-4 py-3 text-center text-sm font-medium leading-relaxed text-white">
              {error.replace(/^NO_CREDENTIAL:\s*/, "")}
            </p>
          )}

          {!loading && canRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 rounded-2xl bg-white px-10 py-3.5 text-[1rem] font-semibold text-[#3b82f6] shadow-[0_4px_16px_rgba(30,41,91,0.2)] active:scale-[0.98] active:opacity-90"
            >
              {error ? "다시 시도" : "인증하기"}
            </button>
          )}
        </div>

        {/* 하단 — 비밀번호 로그인 탈출구 */}
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={onFallback}
            className="rounded-xl border border-white/40 px-6 py-2.5 text-sm font-semibold text-white active:opacity-70"
          >
            비밀번호로 로그인
          </button>
          <p className="text-[0.6875rem] font-normal text-white/85">
            © 2026 소망의료재단. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
