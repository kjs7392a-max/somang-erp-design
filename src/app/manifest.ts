import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  const corpName = process.env.NEXT_PUBLIC_CORP_NAME ?? "소망의료재단";

  return {
    name: `${corpName} ERP`,
    short_name: `${corpName}`,
    description: `${corpName} 임직원 전자결재 포털`,
    start_url: "/home",
    display: "standalone",
    orientation: "portrait",
    background_color: "#dbeafe",
    theme_color: "#3b82f6",
    lang: "ko",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
