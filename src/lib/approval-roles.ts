import type { Profile } from "@/types/profile";

export type ApprovalTab = "my-drafts" | "inbox";

export function getDefaultApprovalTab(profile: Profile): ApprovalTab {
  if (profile.is_super_admin || profile.is_global_viewer) return "inbox";
  return "my-drafts";
}

export function shouldHideMyDraftsTab(profile: Profile): boolean {
  return profile.is_super_admin;
}
