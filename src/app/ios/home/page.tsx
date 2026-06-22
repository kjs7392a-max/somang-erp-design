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
    supabase.auth.getSession().then(async ({ data: { session } }) => {
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
    });
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
