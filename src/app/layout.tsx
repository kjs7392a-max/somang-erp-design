import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "소망의료재단 ERP",
  description: "소망의료재단 임직원 포털",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}