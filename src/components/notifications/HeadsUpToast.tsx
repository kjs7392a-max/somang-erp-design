"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/context/NotificationsContext";
import { NOTIF_KIND_META, NOTIF_KIND_BAR } from "@/lib/notifications";
import { ROUTES } from "@/lib/routes";

export function HeadsUpToast() {
  const { headsUp, dismissHeadsUp, markRead } = useNotifications();
  const [closing, setClosing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const close = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      dismissHeadsUp();
      setClosing(false);
    }, 220);
  }, [dismissHeadsUp]);

  useEffect(() => {
    if (!headsUp) return;
    setClosing(false);
    timerRef.current = setTimeout(close, 4500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [headsUp?.id, close]);

  if (!headsUp) return null;

  const meta = NOTIF_KIND_META[headsUp.kind];
  const barColor = NOTIF_KIND_BAR[headsUp.kind] ?? "#64748b";

  const handleTap = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    markRead(headsUp.id);
    close();
    const dl = headsUp.deeplink;
    if (dl.type === "approval") router.push(ROUTES.approval);
    else if (dl.type === "mydoc") router.push(ROUTES.approval);
    else if (dl.type === "notice") router.push(ROUTES.home);
    else if (dl.type === "shift") router.push(ROUTES.calendar);
  };

  return (
    <div
      className="fixed left-3 right-3 z-[200]"
      style={{
        top: 12,
        animation: closing
          ? "notifSlideUp 0.22s ease-in forwards"
          : "notifSlideDown 0.3s ease-out forwards",
      }}
    >
      <button
        type="button"
        onClick={handleTap}
        className="flex w-full overflow-hidden rounded-2xl text-left"
        style={{
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
          borderLeft: `4px solid ${barColor}`,
        }}
      >
        <div className="flex flex-1 items-center gap-3 px-4 py-3.5">
          <span className="text-xl">{meta.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="truncate text-[0.875rem] font-bold text-zinc-900">{headsUp.title}</p>
            <p className="mt-0.5 truncate text-[0.75rem] font-medium text-zinc-500">{headsUp.body}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); close(); }}
          className="flex items-center px-4 text-lg text-zinc-400 active:text-zinc-600"
          aria-label="닫기"
        >
          ✕
        </button>
      </button>
    </div>
  );
}
