"use client";

import { useCallback, useEffect, useState } from "react";
import type { UserRole } from "@/types/role";

const STORAGE_KEY = "somang-user-role";
const DEFAULT_ROLE: UserRole = "staff";

export function useUserRole() {
  const [role, setRoleState] = useState<UserRole>(DEFAULT_ROLE);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY) as UserRole | null;
      if (raw === "staff" || raw === "manager" || raw === "exec") {
        setRoleState(raw);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const setRole = useCallback((r: UserRole) => {
    setRoleState(r);
    try {
      window.localStorage.setItem(STORAGE_KEY, r);
    } catch {
      /* ignore */
    }
  }, []);

  return { role, setRole };
}