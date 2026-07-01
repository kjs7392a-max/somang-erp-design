"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
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
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);

  async function fetchProfile(userId: string): Promise<Profile | null> {
    // 생체인식 직후엔 verify 응답에 포함된 profile 캐시 사용 (Supabase 재조회 생략)
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
      // 데이터의 재직 상태값은 "재직"/"퇴직"(한글). 과거 "active" 비교는 실제
      // 직원(재직)을 전부 막았음. 퇴직자만 차단하고 나머지는 허용. (BUG-004)
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
    await supabase.auth.signOut();
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem("logged_out", "1");
    }
    // /login 이동 전 webauthn 함수 미리 예열 (cold start 방지)
    fetch("/api/auth/webauthn/authenticate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "ping" }),
    }).catch(() => {});
    if (!pathnameRef.current.startsWith("/ward")) {
      router.push("/login");
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
