"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HomeView } from "@/components/views/HomeView";
import { createIOSClient } from "@/lib/supabase-ios";
import { deriveDisplayRole } from "@/lib/role";
import { ROUTES } from "@/lib/routes";
import type { Profile } from "@/types/profile";

const NAV_MAP: Record<string, string> = {
  home: "/ios/home",
  approvalList: ROUTES.approval,
  approval: ROUTES.approval,
  schedule: ROUTES.calendar,
  myInfo: ROUTES.mypage,
  draft: ROUTES.draft,
};

export default function IOSHomePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createIOSClient();

    const init = async () => {
      let session = null;

      // 방금 로그인한 경우: sessionStorage에서 토큰 직접 복원
      const at = sessionStorage.getItem("ios_at");
      const rt = sessionStorage.getItem("ios_rt");
      if (at && rt) {
        sessionStorage.removeItem("ios_at");
        sessionStorage.removeItem("ios_rt");
        const { data, error } = await supabase.auth.setSession({
          access_token: at,
          refresh_token: rt,
        });
        if (!error && data.session) {
          session = data.session;
        }
      }

      // sessionStorage에 없으면 일반 세션 확인 (재방문)
      if (!session) {
        const { data } = await supabase.auth.getSession();
        session = data.session;
      }

      if (!session) {
        router.replace("/ios/login");
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single();

      if (!data || data.employment_status === "퇴직") {
        await supabase.auth.signOut();
        router.replace("/ios/login");
        return;
      }

      setProfile(data as Profile);
      setLoading(false);
    };

    init();
  }, [router]);

  const signOut = async () => {
    const supabase = createIOSClient();
    await supabase.auth.signOut();
    router.replace("/ios/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#3b82f6] border-t-transparent" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <HomeView
      editName={profile.full_name}
      role={deriveDisplayRole(profile)}
      userId={profile.id}
      onNavigate={(p) => router.push(NAV_MAP[p] ?? "/ios/home")}
      onLogout={signOut}
    />
  );
}
