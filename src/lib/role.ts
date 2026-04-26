"use client";

import { useAuth } from "@/context/AuthContext";
import type { Profile } from "@/types/profile";
import type { UserRole } from "@/types/role";

export function deriveDisplayRole(profile: Profile): UserRole {
  if (profile.is_global_viewer) return "exec";
  if (profile.is_approver || profile.is_department_head) return "manager";
  return "staff";
}

export function useUserRole(): { role: UserRole } {
  const { profile } = useAuth();
  const role: UserRole = profile ? deriveDisplayRole(profile) : "staff";
  return { role };
}
