"use client";

import { NotificationsProvider } from "@/context/NotificationsContext";
import { HeadsUpToast } from "@/components/notifications/HeadsUpToast";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NotificationsProvider>
      <HeadsUpToast />
      {children}
    </NotificationsProvider>
  );
}
