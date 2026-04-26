"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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
  const supabase = createClient();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(userId: string): Promise<Profile | null> {
    const { data } = await supabase
      .from("profiles")
      .select("*, departments!department_id(name)")
      .eq("id", userId)
      .single();
    if (!data) return null;
    const { departments, ...rest } = data as typeof data & {
      departments: { name: string } | null;
    };
    return { ...rest, department_name: departments?.name ?? null };
  }

  async function handleSession(s: Session | null) {
    setSession(s);
    if (!s) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const p = await fetchProfile(s.user.id);
    if (!p || p.employment_status !== "active") {
      await supabase.auth.signOut();
      setSession(null);
      setProfile(null);
      setLoading(false);
      router.push("/login");
      return;
    }
    setProfile(p);
    setLoading(false);
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
    router.push("/login");
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
