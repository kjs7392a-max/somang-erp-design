"use client";

import { useState, useEffect } from "react";
import { LoginView } from "@/components/auth/LoginView";
import { BiometricLockScreen } from "@/components/auth/BiometricLockScreen";
import { createClient } from "@/lib/supabase";
import { ROUTES } from "@/lib/routes";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { registerBiometric, getRegisteredEmployeeId } from "@/lib/webauthn-client";

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);

  // localStorage 동기 체크 — 첫 렌더 전에 확정되므로 화면 깜빡임 없음
  const [initiallyRegistered] = useState(() => !!getRegisteredEmployeeId());

  const {
    isSupported,
    hasRegistered,
    loading: bioLoading,
    error: bioError,
    authenticate,
  } = useWebAuthn();

  // 지문 등록 기기: isSupported 대기 없이 마운트 즉시 인증 시작
  useEffect(() => {
    if (initiallyRegistered) {
      authenticate();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const actualUserId = ((fd.get("userId") as string | null) || userId).trim();
    const actualPassword = (fd.get("password") as string | null) || password;
    if (!actualUserId || !actualPassword) {
      setError("사번과 비밀번호를 입력하세요.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: `${actualUserId.toLowerCase()}@somang.internal`,
        password: actualPassword,
      });
      if (authError) {
        setLoading(false);
        setError("사번 또는 비밀번호가 올바르지 않습니다.");
        return;
      }
      // 지문 미등록 기기면 바로 지문 스캔 팝업
      if (isSupported && !hasRegistered) {
        try {
          await registerBiometric(actualUserId);
        } catch {
          // 취소 또는 실패 → 홈으로
        }
      }
      window.location.href = ROUTES.home;
    } catch {
      setLoading(false);
      setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  // 지문 등록된 기기 & 폼 미표시 → 잠금화면
  if (initiallyRegistered && !showLoginForm) {
    return (
      <BiometricLockScreen
        loading={bioLoading}
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
