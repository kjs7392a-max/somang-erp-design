"use client";

import { useAuth } from "@/context/AuthContext";
import type { Profile } from "@/types/profile";
import type { UserRole } from "@/types/role";

export function deriveDisplayRole(profile: Profile): UserRole {
  if (profile.is_super_admin || profile.is_global_viewer) return "exec";
  return "staff";
}

export function useUserRole(): { role: UserRole } {
  const { profile } = useAuth();
  const role: UserRole = profile ? deriveDisplayRole(profile) : "staff";
  return { role };
}
