"use client";

import { Megaphone, Pin } from "lucide-react";
import { ANNOUNCEMENTS, type Announcement } from "@/lib/home-data";
import { AccordionCard } from "./AccordionCard";

type Props = {
  scope: "company" | "dept";
};

export function AnnouncementSection({ scope }: Props) {
  const items = ANNOUNCEMENTS.filter((a) => a.scope === scope).slice(0, 2);
  if (items.length === 0) return null;

   const title = scope === "company" ? "전체 공지" : "부서 공지";
  const latest = items[0];

  return (
    <AccordionCard
      title={title}
      icon={<Megaphone className="h-5 w-5 text-[#3b5bdb]" strokeWidth={2.2} />}
      summary={
        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
          <strong className="text-zinc-700">{items.length}건</strong>
          <span className="text-zinc-300">·</span>
          <span className="max-w-[180px] truncate">{latest.title}</span>
        </span>
      }
    >
      <div className="space-y-2">
        {items.map((a) => (
          <AnnouncementCard key={a.id} item={a} />
        ))}
      </div>
    </AccordionCard>
  );
}

function AnnouncementCard({ item }: { item: Announcement }) {
  return (
    <div className="rounded-xl border border-zinc-100 p-3">
      <div className="mb-1.5 flex items-center gap-1.5">
        {item.pinned && (
          <Pin className="h-3 w-3 text-red-500" strokeWidth={2.5} />
        )}
        <span className="text-[0.9375rem] font-bold text-zinc-900">
          {item.title}
        </span>
      </div>
      <p className="mb-2 text-sm leading-relaxed text-zinc-600">{item.body}</p>
      <p className="text-xs text-zinc-400">{item.date}</p>
    </div>
  );
}