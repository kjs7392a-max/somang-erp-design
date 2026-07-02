"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getWardShifts } from "@/lib/dept/data";
import type { WardShift } from "@/types/dept-calendar";

function currentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function WardShiftView() {
  const { profile } = useAuth();
  const [shifts, setShifts] = useState<WardShift[] | null>(null);

  useEffect(() => {
    if (!profile) return;
    let alive = true;
    getWardShifts(profile.corporation_id, profile.department, currentMonth())
      .then((rows) => { if (alive) setShifts(rows); })
      .catch(() => { if (alive) setShifts([]); });
    return () => { alive = false; };
  }, [profile]);

  if (shifts === null) {
    return <div className="px-4 py-10 text-center text-sm text-zinc-400">불러오는 중…</div>;
  }
  if (shifts.length === 0) {
    return (
      <div className="mx-4 mt-6 rounded-2xl bg-zinc-50 p-8 text-center">
        <p className="text-2xl">🗓️</p>
        <p className="mt-2 text-sm font-semibold text-zinc-600">아직 등록된 근무표가 없습니다</p>
        <p className="mt-1 text-xs text-zinc-400">대시보드에서 근무표가 등록되면 여기에 표시됩니다.</p>
      </div>
    );
  }
  // 데이터가 생기면 이후 Phase에서 그리드 렌더. 지금은 목록 최소 표시.
  return (
    <ul className="mx-4 mt-4 space-y-1">
      {shifts.map((s) => (
        <li key={s.id} className="flex justify-between rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
          <span className="font-semibold text-zinc-700">{s.staffName ?? "-"} {s.ward ? `(${s.ward})` : ""}</span>
          <span className="text-zinc-500">{s.workDate} · {s.shiftCode}</span>
        </li>
      ))}
    </ul>
  );
}
