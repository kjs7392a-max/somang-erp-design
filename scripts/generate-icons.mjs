// 병원 로고 SVG → PNG 아이콘 생성 (192x192, 512x512)
// 파란 배경 + 흰색 로고
// 실행: node scripts/generate-icons.mjs

import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "../public");

// 파란 배경에 로고를 올린 SVG 생성
function makeIconSvg(size) {
  const padding = Math.round(size * 0.12);
  const logoSize = size - padding * 2;
  const rx = Math.round(size * 0.2);

  const logoSvg = fs.readFileSync(path.join(publicDir, "somang-logo.svg"), "utf8");

  const whiteLogo = logoSvg
    .replace(/fill="#BFBFBF"/g, 'fill="#ffffff"')
    .replace(/fill="#80BFBF"/g, 'fill="#ffffff"')
    .replace(/fill-opacity="\d+\.?\d*"/g, 'fill-opacity="1"')
    .replace(/fill-opacity='\d+\.?\d*'/g, "fill-opacity='1'");

  const viewBoxMatch = whiteLogo.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 684 777";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${rx}" fill="#3b82f6"/>
  <svg x="${padding}" y="${padding}" width="${logoSize}" height="${logoSize}" viewBox="${viewBox}">
    ${whiteLogo.replace(/<svg[^>]*>/, "").replace("</svg>", "")}
  </svg>
</svg>`;
}

async function generate() {
  for (const size of [192, 512]) {
    const svg = makeIconSvg(size);
    const outPath = path.join(publicDir, `icon-${size}.png`);

    await sharp(Buffer.from(svg))
      .png()
      .toFile(outPath);

    console.log(`[OK] icon-${size}.png 생성됨 → ${outPath}`);
  }
}

generate().catch(console.error);
