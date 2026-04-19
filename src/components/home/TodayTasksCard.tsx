"use client";

import { Sparkles, ChevronRight, MapPin } from "lucide-react";
import { AccordionCard } from "./AccordionCard";
import { getTodayEvents } from "@/lib/home-data";
import { CATEGORY_META } from "@/types/calendar";

export function TodayTasksCard({ onGoCalendar }: { onGoCalendar?: () => void }) {
  const events = getTodayEvents();
  const count = events.length;

  return (
    <AccordionCard
      title="오늘의 할 일"
      icon={<Sparkles className="h-5 w-5 text-[#3b5bdb]" strokeWidth={2.2} />}
      summary={
        <span className="text-xs text-zinc-500">
          오늘 <strong className="text-zinc-700">{count}건</strong>
        </span>
      }
      defaultOpen={count > 0}
    >
      {count === 0 ? (
        <p className="py-4 text-center text-sm text-zinc-400">
          오늘은 일정이 없어요
        </p>
      ) : (
        <div className="space-y-2">
          {events.map((e) => {
            const meta = CATEGORY_META[e.category];
            return (
              <div
                key={e.id}
                className="flex items-start gap-3 rounded-xl border border-zinc-100 p-3"
              >
                <span
                  className="mt-0.5 h-8 w-1 shrink-0 rounded-full"
                  style={{ background: meta.color }}
                />
                <div className="flex-1">
                  <div className="mb-0.5 flex items-center gap-1.5">
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[0.625rem] font-bold"
                      style={{ background: meta.bg, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                    {e.startTime && (
                      <span className="text-xs text-zinc-500">
                        {e.startTime}
                        {e.endTime ? `-${e.endTime}` : ""}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-zinc-900">{e.title}</p>
                  {e.location && (
                    <p className="mt-0.5 flex items-center gap-0.5 text-xs text-zinc-500">
                      <MapPin className="h-3 w-3" strokeWidth={2} />
                      {e.location}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          <button
            type="button"
            onClick={onGoCalendar}
            className="mt-2 flex w-full items-center justify-center gap-1 rounded-xl bg-zinc-50 py-2 text-sm font-semibold text-zinc-700 active:bg-zinc-100"
          >
            캘린더에서 보기
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
          </button>
        </div>
      )}
    </AccordionCard>
  );
}