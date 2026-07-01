"use client";

import { useEffect } from "react";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { HeadsUpToast } from "@/components/notifications/HeadsUpToast";

function WebAuthnWarmup() {
  useEffect(() => {
    // 앱 첫 로드 시 webauthn 함수 예열 — /login 도착 전 cold start 제거
    fetch("/api/auth/webauthn/authenticate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ping" }),
    }).catch(() => {});
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NotificationsProvider>
      <WebAuthnWarmup />
      <HeadsUpToast />
      {children}
    </NotificationsProvider>
  );
}
