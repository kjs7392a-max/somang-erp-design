"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { HomeView } from "@/components/views/HomeView";
import { useAuth } from "@/context/AuthContext";
import { useUserRole } from "@/lib/role";
import { ROUTES } from "@/lib/routes";
import type { AppPage } from "@/types/navigation";

const NAV: Record<AppPage, string> = {
  home: ROUTES.home,
  approvalList: ROUTES.approval,
  approval: ROUTES.approval,
  schedule: ROUTES.calendar,
  myInfo: ROUTES.mypage,
  draft: ROUTES.draft,
};

export default function HomePage() {
  const router = useRouter();
  const { profile, loading, signOut } = useAuth();
  const { role } = useUserRole();

  useEffect(() => {
    if (!loading && !profile) {
      router.replace(ROUTES.login);
    }
  }, [loading, profile, router]);

  if (loading || !profile) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3b82f6] border-t-transparent" />
      </div>
    );
  }

  return (
    <HomeView
      editName={profile.full_name}
      role={role}
      userId={profile.id}
      onNavigate={(p) => router.push(NAV[p])}
      onLogout={signOut}
    />
  );
}

