export type EventCategory =
  | "shift"      // 근무
  | "meeting"    // 회의
  | "training"   // 교육
  | "event"      // 병원 행사
  | "deadline"   // 결재 마감
  | "personal";  // 개인

export type CalendarEvent = {
  id: string;
  title: string;
  /** ISO 날짜 "YYYY-MM-DD" */
  date: string;
  /** "HH:MM" — 선택 */
  startTime?: string;
  endTime?: string;
  category: EventCategory;
  /** 개인 일정일 때만 의미 있음. true면 본인만. */
  isPrivate?: boolean;
  location?: string;
  memo?: string;
  /** true면 본인이 수정/삭제 가능 (personal) */
  mine?: boolean;
};

export const CATEGORY_META: Record<
  EventCategory,
  { label: string; color: string; bg: string }
> = {
  shift:    { label: "근무",       color: "#e03131", bg: "#ffe3e3" },
  meeting:  { label: "회의",       color: "#2f9e44", bg: "#d3f9d8" },
  training: { label: "교육",       color: "#f08c00", bg: "#ffe8cc" },
  event:    { label: "병원 행사",  color: "#3b5bdb", bg: "#dbe4ff" },
  deadline: { label: "결재 마감",  color: "#7048e8", bg: "#e5dbff" },
  personal: { label: "개인",       color: "#0ca678", bg: "#c3fae8" },
};