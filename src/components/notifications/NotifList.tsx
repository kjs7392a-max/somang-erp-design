"use client";

import { X } from "lucide-react";
import { useNotifications } from "@/context/NotificationsContext";
import { NOTIF_KIND_META, notifTimeAgo } from "@/lib/notifications";

export function NotifList({ onClose }: { onClose: () => void }) {
  const { notifications, markRead, markAllRead, clearAll } = useNotifications();

  const SOT = new Date(new Date().setHours(0, 0, 0, 0)).getTime();
  const SOY = SOT - 86400000;
  const SOW = SOT - 6 * 86400000;

  const groups = [
    { label: "오늘",    filter: (t: number) => t >= SOT },
    { label: "어제",    filter: (t: number) => t >= SOY && t < SOT },
    { label: "이번 주", filter: (t: number) => t >= SOW && t < SOY },
    { label: "이전",    filter: (t: number) => t < SOW },
  ]
    .map(({ label, filter }) => ({
      label,
      items: notifications.filter((n) => filter(new Date(n.at).getTime())),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="fixed inset-0 z-[180] flex flex-col bg-white">
      <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 active:bg-zinc-100"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>
        <h2 className="text-[1.0625rem] font-bold text-zinc-900">알림</h2>
        <button
          type="button"
          onClick={markAllRead}
          className="text-sm font-semibold text-[#2d5c6e]"
        >
          모두 읽음
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-zinc-400">
            <span className="mb-3 text-4xl">🔔</span>
            <p className="text-sm">알림이 없어요</p>
          </div>
        ) : (
          <>
            {groups.map(({ label, items }) => (
              <div key={label}>
                <div className="sticky top-0 bg-zinc-50 px-4 py-2 text-xs font-semibold text-zinc-500">
                  {label}
                </div>
                {items.map((notif) => {
                  const meta = NOTIF_KIND_META[notif.kind];
                  return (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => markRead(notif.id)}
                      className={`flex w-full items-start gap-3 border-b border-zinc-50 px-4 py-4 text-left active:bg-zinc-50 ${
                        !notif.read ? "bg-blue-50/60" : ""
                      }`}
                    >
                      <span className="mt-0.5 text-xl">{meta.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`truncate text-[0.9375rem] leading-snug ${
                            !notif.read ? "font-bold text-zinc-900" : "font-medium text-zinc-700"
                          }`}
                        >
                          {notif.title}
                        </p>
                        <p className="mt-0.5 text-xs text-zinc-500">{notif.body}</p>
                        <p className="mt-1 text-[0.6875rem] text-zinc-400">{notifTimeAgo(notif.at)}</p>
                      </div>
                      {!notif.read && (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#2d5c6e]" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
            <div className="p-4">
              <button
                type="button"
                onClick={clearAll}
                className="w-full rounded-xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-500"
              >
                모두 지우기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
