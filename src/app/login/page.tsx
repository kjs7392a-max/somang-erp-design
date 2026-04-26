"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoginView } from "@/components/auth/LoginView";
import { createClient } from "@/lib/supabase";
import { ROUTES } from "@/lib/routes";

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const fd = new FormData(form);
    const actualUserId = (fd.get("userId") as string | null) || userId;
    const actualPassword = (fd.get("password") as string | null) || password;
    if (!actualUserId.trim() || !actualPassword) {
      setError("사번과 비밀번호를 입력하세요.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: `${actualUserId.trim().toLowerCase()}@somang.internal`,
        password: actualPassword,
      });
      setLoading(false);
      if (authError) {
        setError("사번 또는 비밀번호가 올바르지 않습니다.");
        return;
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
    />
  );
}
