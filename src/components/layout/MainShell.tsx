"use client";

import { AppBottomNav } from "@/components/layout/AppBottomNav";

export function MainShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh w-full bg-[#f5f5f5]">
      <div className="relative mx-auto min-h-dvh w-full max-w-[430px] pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]">
        {children}
      </div>
      <AppBottomNav />
    </div>
  );
}
