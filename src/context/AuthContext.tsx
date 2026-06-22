"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";
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
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (!profileData) return null;

    const { data: gvData } = await supabase
      .from("global_viewers")
      .select("id")
      .eq("profile_id", userId)
      .maybeSingle();

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
      if (!p || p.employment_status !== "active") {
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
