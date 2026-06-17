import type { Profile } from "@/types/profile";

export type ApprovalTab = "my-drafts" | "inbox";

export function getDefaultApprovalTab(profile: Profile): ApprovalTab {
  // 결재권이 있는 사람은 결재함(inbox)이 기본
  if (profile.is_super_admin || profile.is_global_viewer || profile.is_approver) return "inbox";
  return "my-drafts";
}

export function shouldHideMyDraftsTab(profile: Profile): boolean {
  return profile.is_super_admin || profile.is_global_viewer;
}

// 결재권이 없는 일반 직원은 inbox(결재함) 탭 숨김
export function shouldHideInboxTab(profile: Profile): boolean {
  return !profile.is_approver && !profile.is_super_admin && !profile.is_global_viewer;
}
