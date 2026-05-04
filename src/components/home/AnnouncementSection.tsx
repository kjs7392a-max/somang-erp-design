"use client";

import { useState, useEffect } from "react";
import { Megaphone, Pin, ChevronRight } from "lucide-react";
import { ANNOUNCEMENTS, type Announcement } from "@/lib/home-data";
import { AccordionCard } from "./AccordionCard";
import { AnnouncementDetailModal } from "./AnnouncementDetailModal";

type Props = {
  scope: "company" | "dept";
};

const READ_KEY = "somang-read-announcements";

function readStoredIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStoredIds(ids: string[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(READ_KEY, JSON.stringify(ids));
}

export function AnnouncementSection({ scope }: Props) {
  const items = ANNOUNCEMENTS.filter((a) => a.scope === scope).slice(0, 2);
  const [selected, setSelected] = useState<Announcement | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(() => new Set()); // 서버/클라 동일
  const [mounted, setMounted] = useState(false);

  // mount 후에만 localStorage 읽기 → hydration mismatch 방지
  useEffect(() => {
    setReadIds(new Set(readStoredIds()));
    setMounted(true);
  }, []);

  if (items.length === 0) return null;

  const title = scope === "company" ? "전체 공지" : "부서 공지";
  const latest = items[0];
  const unreadCount = mounted
    ? items.filter((a) => !readIds.has(a.id)).length
    : 0; // 서버 렌더 시엔 0 → 뱃지 안 그림

  const handleOpen = (item: Announcement) => {
    setSelected(item);
    if (!readIds.has(item.id)) {
      const next = new Set(readIds);
      next.add(item.id);
      setReadIds(next);
      writeStoredIds([...next]);
    }
  };

  return (
    <>
      <AccordionCard
        title={title}
        icon={<Megaphone className="h-5 w-5 text-[#3b5bdb]" strokeWidth={2.2} />}
        summary={
          <span className="flex items-center gap-1.5 text-xs text-zinc-500">
            <strong className="text-zinc-700">{items.length}건</strong>
            {unreadCount > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-red-500 px-1.5 text-[0.625rem] font-bold text-white min-w-[1rem] h-4">
                {unreadCount}
              </span>
            )}
            <span className="text-zinc-300">·</span>
            <span className="max-w-[160px] truncate">{latest.title}</span>
          </span>
        }
      >
        <div className="space-y-2">
          {items.map((a) => (
            <AnnouncementCard
              key={a.id}
              item={a}
              unread={mounted && !readIds.has(a.id)}
              onClick={() => handleOpen(a)}
            />
          ))}
        </div>
      </AccordionCard>

      <AnnouncementDetailModal
        item={selected}
        onClose={() => setSelected(null)}
      />
    </>
  );
}

function AnnouncementCard({
  item,
  unread,
  onClick,
}: {
  item: Announcement;
  unread: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-xl border border-zinc-100 p-3 transition active:scale-[0.99] hover:border-zinc-200"
    >
      <div className="mb-1.5 flex items-center gap-1.5">
        {item.pinned && (
          <Pin className="h-3 w-3 text-red-500" strokeWidth={2.5} />
        )}
        {unread && (
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-red-500" />
        )}
        <span className="flex-1 text-[0.9375rem] font-bold text-zinc-900">
          {item.title}
        </span>
        <ChevronRight className="h-4 w-4 text-zinc-300" strokeWidth={2.2} />
      </div>
      <p className="mb-2 line-clamp-2 text-sm leading-relaxed text-zinc-600">
        {item.body}
      </p>
      <p className="text-xs text-zinc-400">{item.date}</p>
    </button>
  );
}