"use client";

import AppHeader from "@/components/layout/AppHeader";
import { AppBottomNav } from "@/components/layout/AppBottomNav";
import { useApprovalNotify } from "@/hooks/useApprovalNotify";
import { usePushSubscription } from "@/hooks/usePushSubscription";

export type MainShellProps = {
  children: React.ReactNode;
  headerTitle?: string;
};

function ApprovalNotifyBridge() {
  useApprovalNotify();
  usePushSubscription();
  return null;
}

export function MainShell({ children, headerTitle }: MainShellProps) {
  return (
    <div className="min-h-dvh w-full bg-[#f5f5f5]">
      <div className="relative mx-auto min-h-dvh w-full max-w-[430px] pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] bg-white">
        <AppHeader title={headerTitle} />
        {children}
      </div>
      <AppBottomNav />
      <ApprovalNotifyBridge />
    </div>
  );
}