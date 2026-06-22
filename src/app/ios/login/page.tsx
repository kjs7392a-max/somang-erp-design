"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LoginView } from "@/components/auth/LoginView";
import { createIOSClient } from "@/lib/supabase-ios";

const DOMAIN_MAP: Record<string, string> = {
  SM: "somang.internal",
  HD: "hyundai.internal",
};

export default function IOSLoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

    const prefix = rawId.toUpperCase().split("-")[0];
    const domain = DOMAIN_MAP[prefix] ?? "somang.internal";
    const email = rawId.includes("@")
      ? rawId.toLowerCase()
      : `${rawId.toLowerCase()}@${domain}`;

    try {
      const supabase = createIOSClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password: actualPassword,
      });
      if (authError) {
        setLoading(false);
        setError("아이디 또는 비밀번호가 올바르지 않습니다.");
        return;
      }
      router.push("/ios/home");
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
