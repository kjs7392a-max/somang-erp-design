import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "소망병원 ERP — 총무과 대시보드",
};

export default function GeneralLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
