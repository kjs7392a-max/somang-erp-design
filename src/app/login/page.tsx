"use client";

import { useState, useEffect } from "react";
import { LoginView } from "@/components/auth/LoginView";
import { BiometricLockScreen } from "@/components/auth/BiometricLockScreen";
import { createClient } from "@/lib/supabase";
import { ROUTES } from "@/lib/routes";
import { useWebAuthn } from "@/hooks/useWebAuthn";
import {
  registerBiometric,
  getRegisteredEmployeeId,
  prefetchAuthOptions,
} from "@/lib/webauthn-client";

export default function LoginPage() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);

  // 첫 렌더 시점에 등록 여부 확인 & options 미리 fetch
  const [initiallyRegistered] = useState(() => {
    const registered = !!getRegisteredEmployeeId();
    if (registered) prefetchAuthOptions();
    return registered;
  });

  const {
    isSupported,
    hasRegistered,
    loading: bioLoading,
    error: bioError,
    authenticate,
  } = useWebAuthn();

  // 지문 등록 기기: 마운트 즉시 인증 시작
  useEffect(() => {
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

    // @ 포함 시 이메일 그대로, 없으면 법인별 도메인 추가
    const domain = process.env.NEXT_PUBLIC_CORP_EMAIL_DOMAIN ?? "somang.internal";
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
      // 로그인한 계정이 이 법인 소속인지 검증
      const { data: { user } } = await supabase.auth.getUser();
      const userDomain = user?.email?.split("@")[1];
      if (userDomain && userDomain !== domain) {
        // is_global_employee 확인
        const { data: staff } = await supabase
          .from("staff_directory")
          .select("is_global_employee")
          .eq("profile_id", user.id)
          .single();
        if (!staff?.is_global_employee) {
          await supabase.auth.signOut();
          setLoading(false);
          setError("이 앱에 접근 권한이 없습니다.");
          return;
        }
      }
      // ID/PW 로그인 시 항상 재등록 (클라우드 패스키 → 기기 로컬 마이그레이션)
      if (isSupported) {
        try {
          await Promise.race([
            registerBiometric(rawId, true),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("timeout")), 5000)
            ),
          ]);
        } catch {
          // 취소, 실패, 타임아웃 → 홈으로
        }
      }
      window.location.href = ROUTES.home;
    } catch {
      setLoading(false);
      setError("로그인 중 오류가 발생했습니다. 다시 시도해주세요.");
    }
  };

  // 지문 등록 기기 & 폼 미표시 → 잠금화면
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
