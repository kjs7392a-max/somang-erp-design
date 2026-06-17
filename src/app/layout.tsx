import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { PwaRegister } from "@/components/PwaRegister";

const corpName = process.env.NEXT_PUBLIC_CORP_NAME ?? "소망의료재단";

export const metadata: Metadata = {
  title: `${corpName} ERP`,
  description: `${corpName} 임직원 전자결재 포털`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: `${corpName} ERP`,
  },
};

export const viewport: Viewport = {
  themeColor: "#3b82f6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body>
        <Providers>{children}</Providers>
        <PwaRegister />
      </body>
    </html>
  );
}
