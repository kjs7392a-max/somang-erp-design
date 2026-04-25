export type NotifKind = "approval" | "rejected" | "approved" | "notice" | "withdraw" | "shift";

export type NotifDeeplink =
  | { type: "approval"; docId: string }
  | { type: "mydoc"; docId: string }
  | { type: "notice"; noticeId: string }
  | { type: "shift" }
  | { type: "none" };

export type Notif = {
  id: string;
  kind: NotifKind;
  title: string;
  body: string;
  at: string;
  read: boolean;
  deeplink: NotifDeeplink;
};

export const NOTIF_KIND_META: Record<NotifKind, { icon: string; label: string; color: string }> = {
  approval: { icon: "📥", label: "결재 요청", color: "#2563eb" },
  rejected:  { icon: "❌", label: "결재 반려", color: "#dc2626" },
  approved:  { icon: "✅", label: "결재 완료", color: "#16a34a" },
  notice:    { icon: "📢", label: "공지",      color: "#f59e0b" },
  withdraw:  { icon: "↩️", label: "기안 회수", color: "#8b5cf6" },
  shift:     { icon: "🕐", label: "근무 변경", color: "#0891b2" },
};

export const NOTIF_KIND_BAR: Record<NotifKind, string> = {
  approved:  "#16a34a",
  rejected:  "#dc2626",
  approval:  "#2563eb",
  notice:    "#f59e0b",
  withdraw:  "#8b5cf6",
  shift:     "#0891b2",
};

export function notifTimeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)         return "방금";
  if (diff < 3600)       return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400)      return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 7 * 86400)  return `${Math.floor(diff / 86400)}일 전`;
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function seedDate(msAgo: number) {
  return new Date(Date.now() - msAgo).toISOString();
}

export const NOTIF_SEED: Notif[] = [
  {
    id: "NT-101", kind: "approval",
    title: "이재훈 — 연차 신청서",
    body: "결재가 도착했어요. 4/22~4/24 (3일)",
    at: seedDate(35 * 60 * 1000),
    read: false,
    deeplink: { type: "approval", docId: "D-0421-01" },
  },
  {
    id: "NT-102", kind: "notice",
    title: "정기 건강검진 안내",
    body: "2026.04.20 ~ 05.03 · 1층 검진센터",
    at: seedDate(5 * 3600 * 1000),
    read: false,
    deeplink: { type: "notice", noticeId: "N001" },
  },
  {
    id: "NT-103", kind: "approved",
    title: "야간근무 수당 신청 승인",
    body: "최종 승인되었습니다 (총무과장)",
    at: seedDate(22 * 3600 * 1000),
    read: true,
    deeplink: { type: "mydoc", docId: "D-0418-02" },
  },
  {
    id: "NT-104", kind: "shift",
    title: "근무표 변경",
    body: "4/26 (일) D → O 로 변경되었어요",
    at: seedDate(26 * 3600 * 1000),
    read: true,
    deeplink: { type: "shift" },
  },
  {
    id: "NT-105", kind: "rejected",
    title: "교육비 품의 반려",
    body: "예산 항목 재검토 요청 — 정하늘 과장",
    at: seedDate(2 * 24 * 3600 * 1000),
    read: true,
    deeplink: { type: "mydoc", docId: "D-0415-09" },
  },
];
