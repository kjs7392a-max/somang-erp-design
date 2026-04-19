export type UserRole = "staff" | "manager" | "exec";

export const ROLE_META: Record<UserRole, { label: string; short: string }> = {
  staff:   { label: "일반 직원",       short: "직원" },
  manager: { label: "중간 관리자",     short: "관리자" },
  exec:    { label: "임원",            short: "임원" },
};