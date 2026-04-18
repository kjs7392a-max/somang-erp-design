"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LoginView } from "@/components/auth/LoginView";
import { ROUTES } from "@/lib/routes";

export default function LoginPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(ROUTES.home);
  };

  return (
    <LoginView
      userId={userId}
      password={password}
      onUserIdChange={setUserId}
      onPasswordChange={setPassword}
      onSubmit={handleLogin}
    />
  );
}
