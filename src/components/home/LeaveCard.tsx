"use client";

import { Plane } from "lucide-react";
import { AccordionCard } from "./AccordionCard";
import { LEAVE_INFO } from "@/lib/home-data";
import { useT } from "@/context/LangContext";

export function LeaveCard() {
  const t = useT();

  return (
    <AccordionCard
      title={t("leave_title")}
      icon={<Plane className="h-5 w-5 text-[#3b5bdb]" strokeWidth={2.2} />}
      summary={
        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
          {t("leave_used_days").replace("{n}", String(LEAVE_INFO.used))}
          <span className="text-zinc-300">·</span>
          {t("leave_remain_days").replace("{n}", String(LEAVE_INFO.remaining))}
        </span>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-2 rounded-xl bg-zinc-50 p-3 text-center">
          <Stat label={t("leave_total")}     value={t("leave_days").replace("{n}", String(LEAVE_INFO.total))} />
          <Stat label={t("leave_used")}      value={t("leave_days").replace("{n}", String(LEAVE_INFO.used))} />
          <Stat label={t("leave_remaining")} value={t("leave_days").replace("{n}", String(LEAVE_INFO.remaining))} highlight />
          <Stat label={t("leave_carried")}   value={t("leave_days").replace("{n}", String(LEAVE_INFO.carriedOver))} />
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-zinc-500">{t("leave_monthly")}</p>
          <div className="grid grid-cols-4 gap-2">
            {LEAVE_INFO.monthly.map((m) => (
              <div key={m.month} className="flex flex-col items-center rounded-lg border border-zinc-100 py-2">
                <span className="text-xs text-zinc-500">{m.month}</span>
                <span className="mt-0.5 text-sm font-bold text-zinc-900">
                  {t("leave_days").replace("{n}", String(m.used))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AccordionCard>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div>
      <p className="text-[0.625rem] text-zinc-500">{label}</p>
      <p className={`mt-0.5 text-sm font-bold ${highlight ? "text-[#3b5bdb]" : "text-zinc-900"}`}>
        {value}
      </p>
    </div>
  );
}
