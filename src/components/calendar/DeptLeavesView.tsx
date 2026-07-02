"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getDeptLeaves } from "@/lib/dept/data";
import type { Leave } from "@/types/dept-calendar";

function monthRange(): { start: string; end: string } {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const lastDay = String(new Date(y, d.getMonth() + 1, 0).getDate()).padStart(2, "0");
  return { start: `${y}-${m}-01`, end: `${y}-${m}-${lastDay}` };
}

export function DeptLeavesView() {
  const { profile } = useAuth();
  const [leaves, setLeaves] = useState<Leave[] | null>(null);

  useEffect(() => {
    if (!profile) return;
    let alive = true;
    getDeptLeaves(profile.corporation_id, profile.department, monthRange())
      .then((rows) => { if (alive) setLeaves(rows); })
      .catch(() => { if (alive) setLeaves([]); });
    return () => { alive = false; };
  }, [profile]);

  if (leaves === null) {
    return <div className="px-4 py-10 text-center text-sm text-zinc-400">불러오는 중…</div>;
  }
  if (leaves.length === 0) {
    return (
      <div className="mx-4 mt-6 rounded-2xl bg-zinc-50 p-8 text-center">
        <p className="text-2xl">🌴</p>
        <p className="mt-2 text-sm font-semibold text-zinc-600">등록된 부서 휴가가 없습니다</p>
        <p className="mt-1 text-xs text-zinc-400">휴가 결재가 최종 승인되면 여기에 표시됩니다.</p>
      </div>
    );
  }
  return (
    <ul className="mx-4 mt-4 space-y-1">
      {leaves.map((l) => (
        <li key={l.id} className="flex justify-between rounded-lg bg-white px-3 py-2 text-sm shadow-sm">
          <span className="font-semibold text-zinc-700">{l.staffName ?? "-"}</span>
          <span className="text-zinc-500">{l.startDate}~{l.endDate} · {l.leaveType}</span>
        </li>
      ))}
    </ul>
  );
}
