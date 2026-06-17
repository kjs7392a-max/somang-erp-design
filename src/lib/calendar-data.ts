"use client";

import { useCallback, useEffect, useState } from "react";
import type { CalendarEvent } from "@/types/calendar";

const STORAGE_KEY = "somang-personal-events";

/** 관리자 배정 + 시스템 자동 생성 목업 */
export const MOCK_EVENTS: CalendarEvent[] = [
  { id: "s1", title: "주간 업무 회의",       date: "2026-04-20", startTime: "10:00", endTime: "11:00", category: "meeting" },
  { id: "s2", title: "행정 역량 강화 교육",  date: "2026-04-22", startTime: "14:00", endTime: "16:00", category: "training" },
  { id: "s3", title: "통합 워크숍",          date: "2026-04-20", startTime: "09:00", endTime: "18:00", category: "event" },
  { id: "s4", title: "월간 보고서 제출",     date: "2026-04-25", category: "deadline" },
  { id: "s5", title: "연차 결재 마감",       date: "2026-04-17", category: "deadline" },
  { id: "s6", title: "부서장 회의",          date: "2026-04-28", startTime: "15:00", endTime: "16:30", category: "meeting" },
  { id: "s7", title: "비품 재고 점검",       date: "2026-04-15", startTime: "10:00", endTime: "11:00", category: "meeting" },
  { id: "s8", title: "박지수 출장",          date: "2026-04-13", category: "shift" },
  { id: "s9", title: "박지수 출장",          date: "2026-04-14", category: "shift" },
];

function loadPersonal(): CalendarEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as CalendarEvent[];
  } catch {
    return [];
  }
}

function savePersonal(evts: CalendarEvent[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(evts));
}

export function usePersonalEvents() {
  const [personal, setPersonal] = useState<CalendarEvent[]>([]);

  // 최초 로드
  useEffect(() => {
    setPersonal(loadPersonal());
  }, []);

  const upsert = useCallback((evt: CalendarEvent) => {
    setPersonal((prev) => {
      const idx = prev.findIndex((e) => e.id === evt.id);
      const next =
        idx >= 0
          ? [...prev.slice(0, idx), evt, ...prev.slice(idx + 1)]
          : [...prev, evt];
      savePersonal(next);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setPersonal((prev) => {
      const next = prev.filter((e) => e.id !== id);
      savePersonal(next);
      return next;
    });
  }, []);

  /** 전체 = 목업 + 개인 */
  const all = [...MOCK_EVENTS, ...personal.map((e) => ({ ...e, mine: true }))];

  return { personal, all, upsert, remove };
}