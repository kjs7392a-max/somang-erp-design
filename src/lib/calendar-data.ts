"use client";

import { useCallback, useEffect, useState } from "react";
import type { CalendarEvent } from "@/types/calendar";

const STORAGE_KEY = "somang-personal-events";

/** 간호부 병동 6월 일정 */
export const MOCK_EVENTS: CalendarEvent[] = [
  // ── 1주차 ──
  { id: "n0602a", title: "병동 주간 회의",       date: "2026-06-02", startTime: "09:00", endTime: "10:00", category: "meeting",  location: "간호부 회의실" },
  { id: "n0603a", title: "낙상 예방 교육",        date: "2026-06-03", startTime: "14:00", endTime: "15:00", category: "training", location: "교육실" },
  { id: "n0605a", title: "감염관리 월례 보고",    date: "2026-06-05", startTime: "10:00", endTime: "11:00", category: "meeting",  location: "간호부 회의실" },
  // ── 2주차 ──
  { id: "n0609a", title: "병동 주간 회의",       date: "2026-06-09", startTime: "09:00", endTime: "10:00", category: "meeting",  location: "간호부 회의실" },
  { id: "n0610a", title: "욕창 예방 케이스 컨퍼런스", date: "2026-06-10", startTime: "14:00", endTime: "15:30", category: "training", location: "교육실" },
  { id: "n0612a", title: "QI 활동 발표",         date: "2026-06-12", startTime: "13:00", endTime: "14:30", category: "event",    location: "강당" },
  // ── 3주차 ──
  { id: "n0616a", title: "병동 주간 회의",       date: "2026-06-16", startTime: "09:00", endTime: "10:00", category: "meeting",  location: "간호부 회의실" },
  { id: "n0617a", title: "CPR·제세동기 교육",    date: "2026-06-17", startTime: "14:00", endTime: "16:00", category: "training", location: "교육실" },
  { id: "n0619a", title: "간호부 전체 회의",     date: "2026-06-19", startTime: "10:00", endTime: "11:30", category: "meeting",  location: "강당" },
  // ── 4주차 ──
  { id: "n0623a", title: "병동 주간 회의",       date: "2026-06-23", startTime: "09:00", endTime: "10:00", category: "meeting",  location: "간호부 회의실" },
  { id: "n0624a", title: "신규 간호사 멘토링",   date: "2026-06-24", startTime: "13:00", endTime: "14:00", category: "training", location: "간호부 회의실" },
  { id: "n0626a", title: "환자 안전 교육",       date: "2026-06-26", startTime: "14:00", endTime: "15:30", category: "training", location: "교육실" },
  // ── 5주차 ──
  { id: "n0630a", title: "6월 업무 결산 회의",   date: "2026-06-30", startTime: "10:00", endTime: "11:30", category: "meeting",  location: "간호부 회의실" },
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

  const all = personal.map((e) => ({ ...e, mine: true }));

  return { personal, all, upsert, remove };
}
