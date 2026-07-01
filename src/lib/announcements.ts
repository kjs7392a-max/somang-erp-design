import { createClient } from "@/lib/supabase";
import type { Announcement } from "@/lib/home-data";
import type { Profile, Lang } from "@/types/profile";

export type NoticeScope = "company" | "dept" | "ward";

type Corp = "SM" | "HD";
const CORP: Corp = (process.env.NEXT_PUBLIC_CORP === "HD" ? "HD" : "SM");

/**
 * RLS와 동일한 규칙의 클라이언트 미러.
 * 실제 권한 강제는 DB의 RLS가 담당하고, 여기 상수는 대시보드 작성 버튼 노출 같은
 * UI 판단용으로만 쓴다. (서버 = supabase/migrations/20260627_announcements_permissions.sql)
 */
const COMPANY_NOTICE_DEPT: Record<Corp, string> = { SM: "총무과", HD: "기획실" };

const DEPT_NOTICE_WHITELIST: Record<Corp, string[]> = {
  SM: ["총무과", "원무과", "사회복지과", "약국", "영양과", "간호과"],
  HD: ["원무과", "사회복지과", "영양과", "간호과"],
};

/** 법인별 병동 목록 (표시는 code + "병동") */
export const WARDS: Record<Corp, string[]> = {
  SM: ["1", "2", "3", "5", "8", "9", "10-A", "10-B", "11", "12"],
  HD: ["101", "102", "103", "105", "106", "107", "108"],
};

type Row = {
  id: string;
  scope: NoticeScope;
  target_dept: string | null;
  target_ward: string | null;
  title: string;
  body: string;
  content: string | null;
  author_name: string | null;
  author_dept: string | null;
  pinned: boolean | null;
  title_i18n: Partial<Record<Lang, string>> | null;
  body_i18n: Partial<Record<Lang, string>> | null;
  published_at: string | null;
};

function mapRow(r: Row): Announcement {
  return {
    id: r.id,
    // Announcement.scope는 company|dept. ward는 표시상 dept처럼 다룬다.
    scope: r.scope === "company" ? "company" : "dept",
    title: r.title,
    body: r.body,
    content: r.content ?? undefined,
    author: r.author_name ?? undefined,
    department: r.author_dept ?? undefined,
    targetDept: r.target_dept ?? undefined,
    date: (r.published_at ?? "").slice(0, 10),
    pinned: r.pinned ?? false,
    titleI18n: r.title_i18n ?? undefined,
    bodyI18n: r.body_i18n ?? undefined,
  };
}

/**
 * 해당 scope의 공지를 Supabase에서 조회.
 * 어떤 행이 보이는가(법인/부서/병동 격리)는 RLS가 결정하므로 여기선 scope 필터만 건다.
 */
export async function fetchAnnouncements(scope: NoticeScope): Promise<Announcement[]> {
  const sb = createClient();
  const { data, error } = await sb
    .from("announcements")
    .select(
      "id,scope,target_dept,target_ward,title,body,content,author_name,author_dept,pinned,title_i18n,body_i18n,published_at",
    )
    .eq("scope", scope)
    .order("pinned", { ascending: false })
    .order("published_at", { ascending: false });
  if (error || !data) return [];
  return (data as Row[]).map(mapRow);
}

/* ---------- 공지 localStorage 캐시 (홈 진입 즉시 표시용) ---------- */

const ANNOUNCE_CACHE_KEY = (scope: string) => `somang-announcements-${scope}`;

/** 홈 섹션이 표시하는 개수와 동일(상위 2개)하게 잘라 캐시한다. */
const CACHE_LIMIT = 2;

export function readCachedAnnouncements(scope: NoticeScope): Announcement[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ANNOUNCE_CACHE_KEY(scope));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function writeCachedAnnouncements(scope: NoticeScope, items: Announcement[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      ANNOUNCE_CACHE_KEY(scope),
      JSON.stringify(items.slice(0, CACHE_LIMIT)),
    );
  } catch {}
}

/* ---------- 권한 헬퍼 (UI 노출 판단용; 실제 강제는 RLS) ---------- */

export function canPostCompanyNotice(profile: Profile | null): boolean {
  if (!profile) return false;
  return profile.is_super_admin || profile.department === COMPANY_NOTICE_DEPT[CORP];
}

export function canPostDeptNotice(profile: Profile | null): boolean {
  if (!profile) return false;
  if (profile.is_super_admin) return true;
  // 간호과는 dept가 아니라 ward 경로가 기본
  if (profile.department === "간호과") return false;
  return DEPT_NOTICE_WHITELIST[CORP].includes(profile.department);
}

export function canPostWardNotice(profile: Profile | null): boolean {
  if (!profile) return false;
  return profile.is_super_admin || profile.department === "간호과";
}
