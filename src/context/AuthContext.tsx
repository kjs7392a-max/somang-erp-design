"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
import { PROFILE_CACHE_KEY } from "@/lib/webauthn-client";
import type { Profile } from "@/types/profile";

type AuthState = {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState>({
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);

  async function fetchProfile(userId: string): Promise<Profile | null> {
    // 생체인식 직후 window.location.href 리로드 시 sessionStorage 캐시 사용 (Supabase 재조회 생략)
    if (typeof sessionStorage !== "undefined") {
      const cached = sessionStorage.getItem(PROFILE_CACHE_KEY);
      if (cached) {
        sessionStorage.removeItem(PROFILE_CACHE_KEY);
        const parsed: Profile = JSON.parse(cached);
        if (parsed.id === userId) return parsed;
      }
    }

    const [{ data: profileData }, { data: gvData }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("global_viewers").select("id").eq("profile_id", userId).maybeSingle(),
    ]);
    if (!profileData) return null;
    return { ...profileData, is_global_viewer: !!gvData };
  }

  async function handleSession(s: Session | null) {
    setSession(s);
    if (!s) {
      setProfile(null);
      setLoading(false);
      return;
    }
    try {
      const p = await fetchProfile(s.user.id);
      // 퇴직자만 차단, 나머지는 허용 (BUG-004)
      if (!p || p.employment_status === "퇴직") {
        await supabase.auth.signOut().catch(() => {});
        setSession(null);
        setProfile(null);
      } else {
        setProfile(p);
      }
    } catch {
      await supabase.auth.signOut().catch(() => {});
      setSession(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      handleSession(s);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      handleSession(s);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    // 로그아웃 후 자동 생체인식 재시도 방지
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("logged_out", "1");
    }
    // scope: local → 네트워크 응답을 기다리지 않고 로컬 세션만 즉시 제거(스피너 제거)
    supabase.auth.signOut({ scope: "local" }).catch(() => {});
    if (!pathnameRef.current.startsWith("/ward")) {
      // 하드 리다이렉트로 홈 스피너 깜빡임 없이 로그인 화면으로 전환
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
