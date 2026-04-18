/** App Router 경로 (실서비스 URL 단일 출처) */
export const ROUTES = {
  home: "/home",
  approval: "/approval",
  approvalDetail: (id: string) => `/approval/${encodeURIComponent(id)}`,
  calendar: "/calendar",
  mypage: "/mypage",
  draft: "/draft",
  login: "/login",
} as const;
