"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

/**
 * 총무과 대시보드 접근 제어.
 * 허용: 총무과 직원 · super_admin · 전사 열람권(is_global_viewer, 예: 이사장).
 * 그 외 로그인 사용자는 /home, 미로그인은 /login 으로 보낸다.
 */
export function GeneralGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { profile, loading } = useAuth();

  const allowed =
    !!profile &&
    (profile.department === "총무과" ||
      profile.is_super_admin ||
      profile.is_global_viewer);

  useEffect(() => {
    if (loading) return;
    if (!profile) {
      router.replace("/login");
    } else if (!allowed) {
      router.replace("/home");
    }
  }, [loading, profile, allowed, router]);

  if (loading || !profile || !allowed) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3b82f6] border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
