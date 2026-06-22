"use client";

import { X } from "lucide-react";
import { SHIFT_CODE_META, type ShiftCode, type ShiftMember } from "@/lib/shift-data";
import { useT } from "@/context/LangContext";
import type { TKey } from "@/lib/i18n/translations";

const DESC_KEYS: Record<ShiftCode, TKey> = {
  A:   "shift_desc_A",
  S:   "shift_desc_S",
  V:   "shift_desc_V",
  H:   "shift_desc_H",
  OFF: "shift_desc_OFF",
  D:   "shift_desc_D",
  E:   "shift_desc_E",
  N:   "shift_desc_N",
  DB:  "shift_desc_DB",
};

export function ShiftDayDetail({
  day,
  onClose,
  members,
}: {
  day: number;
  onClose: () => void;
  members: ShiftMember[];
}) {
  const t = useT();
  const idx = day - 1;
  const groups: Partial<Record<ShiftCode, string[]>> = {};
  for (const member of members) {
    const code = member.row[idx];
    if (!groups[code]) groups[code] = [];
    groups[code]!.push(member.name);
  }

  const order: ShiftCode[] = ["A", "S", "V", "H", "OFF"];
  const title = t("shift_day_detail_title")
    .replace("{month}", "4")
    .replace("{day}", String(day));

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-black/40" aria-label={t("action_close")} />
      <div className="relative w-full max-w-[430px] rounded-t-3xl bg-white pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))]">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <span className="text-[1.0625rem] font-bold text-zinc-900">{title}</span>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 active:bg-zinc-100" aria-label={t("action_close")}>
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>
        <div className="space-y-4 px-5 py-4">
          {order.map((code) => {
            const names = groups[code];
            if (!names?.length) return null;
            const meta = SHIFT_CODE_META[code];
            const timeStr = meta.time;
            return (
              <div key={code}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-lg px-2 py-0.5 text-xs font-bold" style={{ background: meta.bg, color: meta.fg }}>
                    {code} — {t(DESC_KEYS[code])}
                  </span>
                  {meta.time !== "—" && <span className="text-xs text-zinc-400">{timeStr}</span>}
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
