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

export const NOTIF_KIND_BAR = Object.fromEntries(
  Object.entries(NOTIF_KIND_META).map(([k, v]) => [k, v.color]),
) as Record<NotifKind, string>;

export function notifTimeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60)         return "방금";
  if (diff < 3600)       return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400)      return `${Math.floor(diff / 3600)}시간 전`;
  if (diff < 7 * 86400)  return `${Math.floor(diff / 86400)}일 전`;
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export const NOTIF_SEED: Notif[] = [];
