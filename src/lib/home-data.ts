import type { CalendarEvent } from "@/types/calendar";
import { MOCK_EVENTS } from "@/lib/calendar-data";

/* ---------- 공지 ---------- */
export type Announcement = {
  id: string;
  scope: "company" | "dept";
  title: string;
  body: string;         // 요약 (카드용)
  content?: string;     // 본문 전체 (모달용, 없으면 body 사용)
  author?: string;      // 작성자
  department?: string;  // 작성 부서
  date: string;         // YYYY-MM-DD
  pinned?: boolean;
};
export const ANNOUNCEMENTS: Announcement[] = [
  // 전사
  {
    id: "a-c-1",
    scope: "company",
    title: "2026년 4월 20일 통합 워크숍 안내",
    body: "전 직원 대상 통합 워크숍을 4월 20일(월) 오전 9시부터 본관 대강당에서 실시합니다. 참석 대상은 별도 공지를 확인해주세요.",
    author: "김행정 팀장",       // ← 추가
    department: "인사팀",         // ← 추가
    date: "2026-04-15",
    pinned: true,
  },
  {
    id: "a-c-2",
    scope: "company",
    title: "사내 메신저 시스템 점검 안내",
    body: "4월 22일(수) 02:00~04:00 동안 메신저 서버 점검이 있습니다. 해당 시간 로그인이 제한됩니다.",
    author: "박시스 과장",       // ← 추가
    department: "정보전산팀",     // ← 추가
    date: "2026-04-14",
  },
  // 부서
  {
    id: "a-d-1",
    scope: "dept",
    title: "외과 2병동 근무표 변경 공지",
    body: "5월 근무표가 확정되어 배포되었습니다. 변경사항 확인 후 이상 있으면 수간호사에게 문의 바랍니다.",
    author: "이수간 수간호사",
    department: "외과 2병동",
    date: "2026-04-15",
    pinned: true,
  },
  {
    id: "a-d-2",
    scope: "dept",
    title: "외과 2병동 감염관리 교육 일정",
    body: "4월 28일(화) 13:00 외과 2병동 스테이션에서 감염관리 교육을 진행합니다. 전원 참석 바랍니다.",
    author: "정감염 감염관리전담",
    department: "감염관리실",
    date: "2026-04-12",
  },
];

/* ---------- 월차 ---------- */
export const LEAVE_INFO = {
  total: 15,
  used: 2,
  remaining: 13,
  carriedOver: 0,
  monthly: [
    { month: "1월", used: 0 },
    { month: "2월", used: 1 },
    { month: "3월", used: 1 },
    { month: "4월", used: 0 },
  ],
};

/* ---------- 오늘 할 일 ---------- */
export function getTodayEvents(today = new Date()): CalendarEvent[] {
  const iso = toISO(today);
  return MOCK_EVENTS.filter((e) => e.date === iso).slice(0, 3);
}

function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
