import type { Metadata } from "next";
import { AuthProvider } from "@/context/AuthContext";
import { GeneralGuard } from "@/features/general-dashboard/components/GeneralGuard";

export const metadata: Metadata = {
  title: "소망병원 ERP — 총무과 대시보드",
};

export const dynamic = "force-dynamic";

export default function GeneralLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <GeneralGuard>{children}</GeneralGuard>
    </AuthProvider>
  );
}
