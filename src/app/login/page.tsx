"use client";

import { useState, useEffect } from "react";
import { LoginView } from "@/components/auth/LoginView";
import { BiometricLockScreen } from "@/components/auth/BiometricLockScreen";
import { createClient } from "@/lib/supabase";
import { ROUTES } from "@/lib/routes";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { getRegisteredEmployeeId } from "@/lib/webauthn-client";

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);

  const [initiallyRegistered] = useState(() => !!getRegisteredEmployeeId());

  const {
    isSupported,
    hasRegistered,
    loading: bioLoading,
    error: bioError,
    authenticate,
  } = useWebAuthn();

  // 지문 등록 기기: 마운트 즉시 인증 시작 + 함수 예열 (cold start 방지)
  useEffect(() => {
    // authenticate 함수 예열 (cold start 2~3초 제거)
    fetch("/api/auth/webauthn/authenticate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ping" }),
    }).catch(() => {});
    if (initiallyRegistered) {
      authenticate();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const rawId = ((fd.get("userId") as string | null) || userId).trim();
    const actualPassword = (fd.get("password") as string | null) || password;

    if (!rawId || !actualPassword) {
      setError("아이디와 비밀번호를 입력하세요.");
      return;
    }
    setError(null);
    setLoading(true);

    // 사번 prefix로 법인 도메인 자동 결정
    // SM- → somang.internal, HD- → hyundai.internal
    const DOMAIN_MAP: Record<string, string> = {
      SM: "somang.internal",
      HD: "hyundai.internal",
    };
    const prefix = rawId.toUpperCase().split("-")[0];
    const domain = DOMAIN_MAP[prefix] ?? (process.env.NEXT_PUBLIC_CORP_EMAIL_DOMAIN ?? "somang.internal");
    const email = rawId.includes("@")
      ? rawId.toLowerCase()
      : `${rawId.toLowerCase()}@${domain}`;

    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: actualPassword,
      });
      if (authError) {
        setLoading(false);
        setError("아이디 또는 비밀번호가 올바르지 않습니다.");
        return;
      }
      window.location.href = ROUTES.home;
    } catch {
      setLoading(false);
      setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  // 지문 등록 기기 & 폼 미표시 → 인증 시도 중엔 배경만, 실패 시 잠금화면
  if (initiallyRegistered && !showLoginForm) {
    if (bioLoading && !bioError) {
      return <div className="min-h-dvh bg-gradient-to-b from-[#dbeafe] to-[#3b82f6]" />;
    }
    return (
      <BiometricLockScreen
        loading={false}
        error={bioError}
        canRetry={hasRegistered}
        onRetry={authenticate}
        onFallback={() => setShowLoginForm(true)}
      />
    );
  }

  return (
    <LoginView
      userId={userId}
      password={password}
      onUserIdChange={setUserId}
      onPasswordChange={setPassword}
      onSubmit={handleLogin}
      error={error}
      loading={loading}
      showBiometric={isSupported && hasRegistered}
      biometricLoading={bioLoading}
      onBiometricLogin={authenticate}
      biometricError={bioError}
    />
  );
}
