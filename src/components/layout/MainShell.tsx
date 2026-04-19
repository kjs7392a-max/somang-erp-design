"use client";

import AppHeader from "@/components/layout/AppHeader";
import { AppBottomNav } from "@/components/layout/AppBottomNav";

export type MainShellProps = {
  children: React.ReactNode;
  /** 헤더 제목 (각 page에서 덮어쓰기 가능) */
  headerTitle?: string;
};

export function MainShell({ children, headerTitle }: MainShellProps) {
  return (
    <div className="min-h-dvh w-full bg-[#f5f5f5]">
      <div className="relative mx-auto min-h-dvh w-full max-w-[430px] pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] bg-white">
        <AppHeader title={headerTitle} />
        {children}
      </div>
      <AppBottomNav />
    </div>
  );
}