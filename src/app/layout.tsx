import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "@/components/layout/Providers";
import { PwaRegister } from "@/components/PwaRegister";
import { IOSDebugOverlay } from "@/components/IOSDebugOverlay";

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
        {/* 임시 진단: 번들과 별개로 도는 ES5 인라인 에러 캐처.
            JS 번들이 iOS에서 파싱/로드 실패하는 원인을 화면 상단에 직접 표시. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){function show(m){try{var el=document.getElementById('__diagerr');if(!el){el=document.createElement('div');el.id='__diagerr';el.style.cssText='position:fixed;top:0;left:0;right:0;z-index:2147483647;background:#b91c1c;color:#fff;font:11px monospace;padding:6px;white-space:pre-wrap;word-break:break-all;max-height:55vh;overflow:auto';(document.body||document.documentElement).appendChild(el);}el.appendChild(document.createTextNode(m+'\\n'));}catch(e){}}window.addEventListener('error',function(e){var t=e.target;if(t&&(t.src||t.href)){show('LOAD-FAIL: '+(t.src||t.href));}else{show('ERR: '+(e.message||'')+' @ '+(e.filename||'')+':'+(e.lineno||'')+':'+(e.colno||''));}},true);window.addEventListener('unhandledrejection',function(e){var r=e.reason;show('REJ: '+((r&&(r.message||r))||''));});window.__diag='catcher-ok diag5';})();",
          }}
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@700;800;900&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="manifest" href="/api/manifest" />
      </head>
      <body>
        <Providers>{children}</Providers>
        <PwaRegister />
        <IOSDebugOverlay />
      </body>
    </html>
  );
}
