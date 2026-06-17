import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "소망병원 ERP — 병동 대시보드",
};

export default function WardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
