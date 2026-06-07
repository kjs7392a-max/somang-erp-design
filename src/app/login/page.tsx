"use client";

import { useState } from "react";
import { LoginView } from "@/components/auth/LoginView";
import { WebAuthnPrompt } from "@/components/auth/WebAuthnPrompt";
import { createClient } from "@/lib/supabase";
import { ROUTES } from "@/lib/routes";
import { useWebAuthn } from "@/hooks/useWebAuthn";

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  // submittedUserId: 로그인 성공 시 확정된 사번 — autofill 문제 없이 WebAuthn에 전달
  const [submittedUserId, setSubmittedUserId] = useState("");

  const {
    isSupported,
    hasRegistered,
    loading: bioLoading,
    error: bioError,
    register,
    authenticate,
  } = useWebAuthn(submittedUserId);

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
      setLoading(false);
      if (authError) {
        setError("사번 또는 비밀번호가 올바르지 않습니다.");
        return;
      }
      setSubmittedUserId(actualUserId);
      if (isSupported && !hasRegistered) {
        setShowPrompt(true);
      } else {
        window.location.href = ROUTES.home;
      }
    } catch {
      setLoading(false);
      setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  const handleRegister = async () => {
    await register();
    if (localStorage.getItem("wn_registered")) {
      setShowPrompt(false);
      window.location.href = ROUTES.home;
    }
  };

  const handleSkip = () => {
    setShowPrompt(false);
    window.location.href = ROUTES.home;
  };

  return (
    <>
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
      />
      {showPrompt && (
        <WebAuthnPrompt
          onRegister={handleRegister}
          onSkip={handleSkip}
          loading={bioLoading}
          error={bioError}
        />
      )}
    </>
  );
}
