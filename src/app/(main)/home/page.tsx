"use client";

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
  const { profile, signOut } = useAuth();
  const { role } = useUserRole();

  if (!profile) return null;

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
