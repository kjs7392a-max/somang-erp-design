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
    if (!userId.trim() || !password) {
      setError("사번과 비밀번호를 입력하세요.");
      return;
    }
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: `${userId.trim().toLowerCase()}@somang.internal`,
      password,
    });
    setLoading(false);
    if (authError) {
      setError("사번 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    router.push(ROUTES.home);
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
