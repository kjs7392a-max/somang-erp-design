// 부서축 레지스트리 — isNurseProfile() 휴리스틱을 대체하는 명시적 맵.
// 특수 뷰가 필요한 부서는 간호과·원무과 2개뿐, 그 외 전부 personal.

export type CalendarVariant = "ward_shift" | "dept_leaves" | "personal";

// 실 DB 노이즈 정규화(2026-07-02 조회 기준)
const DEPT_ALIASES: Record<string, string> = {
  "조리": "영양과",
  "조리과": "영양과",
  "재무관리과": "경리과",
};

const CALENDAR_VARIANT: Record<string, CalendarVariant> = {
  "간호과": "ward_shift",
  "원무과": "dept_leaves",
};

export function normalizeDept(raw: string): string {
  const v = (raw ?? "").trim();
  return DEPT_ALIASES[v] ?? v;
}

export function calendarVariantFor(dept: string): CalendarVariant {
  return CALENDAR_VARIANT[normalizeDept(dept)] ?? "personal";
}
