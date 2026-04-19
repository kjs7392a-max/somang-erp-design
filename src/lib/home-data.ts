import type { CalendarEvent } from "@/types/calendar";
import { MOCK_EVENTS } from "@/lib/calendar-data";

/* ---------- 공지 ---------- */
export type Announcement = {
  id: string;
  scope: "company" | "dept";
  title: string;
  body: string;
  date: string; // YYYY-MM-DD
  pinned?: boolean;
};

export const ANNOUNCEMENTS: Announcement[] = [
  // 전사
  {
    id: "a-c-1",
    scope: "company",
    title: "2026년 4월 20일 통합 워크숍 안내",
    body: "전 직원 대상 통합 워크숍을 4월 20일(월) 오전 9시부터 본관 대강당에서 실시합니다. 참석 대상은 별도 공지를 확인해주세요.",
    date: "2026-04-15",
    pinned: true,
  },
  {
    id: "a-c-2",
    scope: "company",
    title: "사내 메신저 시스템 점검 안내",
    body: "4월 22일(수) 02:00~04:00 동안 메신저 서버 점검이 있습니다. 해당 시간 로그인이 제한됩니다.",
    date: "2026-04-14",
  },
  // 부서
  {
    id: "a-d-1",
    scope: "dept",
    title: "외과 2병동 근무표 변경 공지",
    body: "5월 근무표가 확정되어 배포되었습니다. 변경사항 확인 후 이상 있으면 수간호사에게 문의 바랍니다.",
    date: "2026-04-15",
    pinned: true,
  },
  {
    id: "a-d-2",
    scope: "dept",
    title: "외과 2병동 감염관리 교육 일정",
    body: "4월 28일(화) 13:00 외과 2병동 스테이션에서 감염관리 교육을 진행합니다. 전원 참석 바랍니다.",
    date: "2026-04-12",
  },
];

/* ---------- 내 기안 ---------- */
export type DraftStatus = "pending" | "rejected" | "done" | "draft";

export type ApproverStep = {
  name: string;
  position: string;
  state: "done" | "current" | "waiting" | "rejected";
};

export type MyDraft = {
  id: string;
  title: string;
  date: string;
  status: DraftStatus;
  approvalLine: ApproverStep[];
};

export const MY_DRAFTS: MyDraft[] = [
  {
    id: "d1",
    title: "연차 신청서 (4/25-4/26)",
    date: "2026-04-15",
    status: "pending",
    approvalLine: [
      { name: "박지영", position: "기안자", state: "done" },
      { name: "최영희", position: "수간호사", state: "done" },
      { name: "이철수", position: "부서장", state: "current" },
      { name: "김원장", position: "원장", state: "waiting" },
    ],
  },
  {
    id: "d2",
    title: "경비 청구 - 3월",
    date: "2026-04-10",
    status: "pending",
    approvalLine: [
      { name: "박지영", position: "기안자", state: "done" },
      { name: "최영희", position: "수간호사", state: "current" },
      { name: "이철수", position: "부서장", state: "waiting" },
    ],
  },
  {
    id: "d3",
    title: "초과근무 신청 (4/8)",
    date: "2026-04-08",
    status: "pending",
    approvalLine: [
      { name: "박지영", position: "기안자", state: "done" },
      { name: "최영희", position: "수간호사", state: "current" },
      { name: "이철수", position: "부서장", state: "waiting" },
    ],
  },
  {
    id: "d4",
    title: "물품 구매 요청",
    date: "2026-04-02",
    status: "rejected",
    approvalLine: [
      { name: "박지영", position: "기안자", state: "done" },
      { name: "최영희", position: "수간호사", state: "rejected" },
    ],
  },
  {
    id: "d5",
    title: "경비 청구 - 2월",
    date: "2026-03-05",
    status: "done",
    approvalLine: [
      { name: "박지영", position: "기안자", state: "done" },
      { name: "최영희", position: "수간호사", state: "done" },
      { name: "이철수", position: "부서장", state: "done" },
    ],
  },
];
export const DRAFT_COUNTS = {
  pending: MY_DRAFTS.filter((d) => d.status === "pending").length,
  rejected: MY_DRAFTS.filter((d) => d.status === "rejected").length,
  done: MY_DRAFTS.filter((d) => d.status === "done").length,
};

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