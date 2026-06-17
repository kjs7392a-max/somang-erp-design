"use client";

import { createContext, useContext } from "react";
import { T, type TKey } from "@/lib/i18n/translations";
import { useAuth } from "@/context/AuthContext";
import type { Lang } from "@/types/profile";

const LangContext = createContext<Lang>("ko");

export function LangProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

/** AuthContext에서 profile.lang을 읽어 LangProvider로 자동 주입 */
export function LangBridge({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const lang: Lang = profile?.lang ?? "ko";
  return <LangProvider lang={lang}>{children}</LangProvider>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}

export function useT() {
  const lang = useContext(LangContext);
  return (key: TKey): string => T[lang]?.[key] ?? T["ko"][key];
}
