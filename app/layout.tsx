import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "소망 ERP",
  description: "소망/현대 통합 ERP 시스템",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "소망 ERP" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2F80ED",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${geist.variable} h-full antialiased`}>
      <body className="h-full bg-gray-50 font-sans">{children}</body>
    </html>
  );
}
