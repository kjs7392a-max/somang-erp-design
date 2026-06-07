"use client";

import { useState, useEffect, useRef } from "react";
import { LoginView } from "@/components/auth/LoginView";
import { createClient } from "@/lib/supabase";
import { ROUTES } from "@/lib/routes";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import { registerBiometric } from "@/lib/webauthn-client";

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const autoTriggered = useRef(false);

  const {
    isSupported,
    hasRegistered,
    loading: bioLoading,
    error: bioError,
    authenticate,
  } = useWebAuthn();

  // 지문 등록된 기기면 앱 시작 시 즉시 지문 인증 팝업
  useEffect(() => {
    if (!autoTriggered.current && isSupported && hasRegistered) {
      autoTriggered.current = true;
      authenticate();
    }
  }, [isSupported, hasRegistered]); // eslint-disable-line react-hooks/exhaustive-deps

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
      // 지문 미등록 기기면 바로 지문 스캔 팝업 (모달 없음)
      if (isSupported && !hasRegistered) {
        try {
          await registerBiometric(actualUserId);
        } catch {
          // 취소 또는 실패 → 그냥 홈으로 (다음 로그인 때 다시 시도)
        }
      }
      window.location.href = ROUTES.home;
    } catch {
      setLoading(false);
      setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

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
