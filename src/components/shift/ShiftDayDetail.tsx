"use client";

import { X } from "lucide-react";
import { SHIFT_2026_04, SHIFT_CODE_META, type ShiftCode } from "@/lib/shift-data";

export function ShiftDayDetail({ day, onClose }: { day: number; onClose: () => void }) {
  const idx = day - 1;
  const groups: Partial<Record<ShiftCode, string[]>> = {};
  for (const member of SHIFT_2026_04) {
    const code = member.row[idx];
    if (!groups[code]) groups[code] = [];
    groups[code]!.push(member.name);
  }

  const order: ShiftCode[] = ["D", "E", "N", "V", "T", "O"];

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-black/40" aria-label="닫기" />
      <div className="relative w-full max-w-[430px] rounded-t-3xl bg-white pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <span className="text-[1.0625rem] font-bold text-zinc-900">4월 {day}일 근무</span>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 active:bg-zinc-100" aria-label="닫기">
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        <div className="space-y-4 px-5 py-4">
          {order.map((code) => {
            const names = groups[code];
            if (!names?.length) return null;
            const meta = SHIFT_CODE_META[code];
            return (
              <div key={code}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-lg px-2 py-0.5 text-xs font-bold" style={{ background: meta.bg, color: meta.fg }}>
                    {code} — {meta.desc}
                  </span>
                  <span className="text-xs text-zinc-400">{meta.time}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {names.map((name) => (
                    <span key={name} className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-700">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
