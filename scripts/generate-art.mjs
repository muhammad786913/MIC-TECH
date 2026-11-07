/**
 * Generates the MIC TECH editorial artwork set (abstract, on-brand SVG).
 * Run: node scripts/generate-art.mjs
 */
import fs from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "public", "images", "editorial");
const W = 1600;
const H = 1000;
const GOLD = "#C5A24B";
const IVORY = "#F5F2EA";
const BLACK = "#151515";

const grain = `
  <filter id="grain" x="0" y="0" width="100%" height="100%">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n"/>
    <feColorMatrix in="n" type="saturate" values="0"/>
    <feComponentTransfer><feFuncA type="linear" slope="0.055"/></feComponentTransfer>
  </filter>`;

const variants = [
  // 1. Golden arches
  `<g>
    ${[0, 1, 2, 3, 4].map((i) => `<circle cx="${520 + i * 130}" cy="${560 + i * 18}" r="${330 - i * 52}" fill="none" stroke="${GOLD}" stroke-width="${i === 1 ? 10 : 2}" opacity="${0.9 - i * 0.13}"/>`).join("")}
    <rect x="1040" y="130" width="420" height="740" fill="${IVORY}"/>
    <rect x="1080" y="180" width="340" height="2" fill="${GOLD}"/>
    <rect x="1080" y="180" width="2" height="640" fill="${GOLD}" opacity=".5"/>
  </g>`,
  // 2. Orbit
  `<g>
    <rect width="${W}" height="${H}" fill="${IVORY}"/>
    <circle cx="800" cy="500" r="300" fill="${BLACK}"/>
    <circle cx="800" cy="500" r="380" fill="none" stroke="${GOLD}" stroke-width="2"/>
    <circle cx="800" cy="500" r="470" fill="none" stroke="${GOLD}" stroke-width="1" opacity=".6"/>
    <circle cx="1180" cy="500" r="16" fill="${GOLD}"/>
    <circle cx="800" cy="30" r="9" fill="${GOLD}"/>
    <path d="M180 820 H1420" stroke="${BLACK}" stroke-width="2"/>
  </g>`,
  // 3. Vertical columns
  `<g>
    <rect width="${W}" height="${H}" fill="${BLACK}"/>
    ${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${160 + i * 195}" y="${180 + (i % 3) * 60}" width="88" height="${640 - (i % 3) * 120}" fill="${i % 2 ? GOLD : IVORY}" opacity="${i % 2 ? 0.9 : 0.12}"/>`).join("")}
    <circle cx="1280" cy="250" r="110" fill="${GOLD}"/>
  </g>`,
  // 4. Waves
  `<g>
    <rect width="${W}" height="${H}" fill="${IVORY}"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M-40 ${330 + i * 90} C 360 ${180 + i * 90}, 700 ${520 + i * 80}, 1080 ${340 + i * 80} S 1500 ${520 + i * 70}, 1660 ${380 + i * 70}" fill="none" stroke="${i === 2 ? GOLD : BLACK}" stroke-width="${i === 2 ? 12 : 2}" opacity="${i === 2 ? 1 : 0.35}"/>`).join("")}
    <rect x="1120" y="700" width="360" height="160" fill="${BLACK}"/>
  </g>`,
  // 5. Prism
  `<g>
    <rect width="${W}" height="${H}" fill="${BLACK}"/>
    <polygon points="0,1000 620,0 980,0 360,1000" fill="${IVORY}" opacity=".08"/>
    <polygon points="520,1000 1140,0 1320,0 700,1000" fill="${GOLD}" opacity=".9"/>
    <polygon points="1080,1000 1420,480 1520,480 1180,1000" fill="${IVORY}" opacity=".85"/>
    <rect x="120" y="120" width="240" height="2" fill="${GOLD}"/>
  </g>`,
  // 6. Grid
  `<g>
    <rect width="${W}" height="${H}" fill="${BLACK}"/>
    ${Array.from({ length: 17 }, (_, i) => `<line x1="${160 + i * 80}" y1="0" x2="${160 + i * 80}" y2="${H}" stroke="${IVORY}" stroke-width="1" opacity=".14"/>`).join("")}
    ${Array.from({ length: 11 }, (_, i) => `<line x1="0" y1="${80 + i * 84}" x2="${W}" y2="${80 + i * 84}" stroke="${IVORY}" stroke-width="1" opacity=".14"/>`).join("")}
    <circle cx="880" cy="470" r="250" fill="none" stroke="${GOLD}" stroke-width="26"/>
    <rect x="1140" y="690" width="250" height="120" fill="${GOLD}"/>
  </g>`,
  // 7. Editorial type block
  `<g>
    <rect width="${W}" height="${H}" fill="${BLACK}"/>
    <text x="110" y="690" font-family="Georgia, 'Times New Roman', serif" font-size="640" fill="${IVORY}" letter-spacing="-20">MIC</text>
    <rect x="116" y="760" width="760" height="10" fill="${GOLD}"/>
    <text x="118" y="860" font-family="Arial, sans-serif" font-size="52" letter-spacing="18" fill="${GOLD}">TECH</text>
    <circle cx="1330" cy="210" r="120" fill="${GOLD}"/>
    <circle cx="1330" cy="210" r="160" fill="none" stroke="${IVORY}" stroke-width="2" opacity=".4"/>
  </g>`,
  // 8. Steps
  `<g>
    <rect width="${W}" height="${H}" fill="${IVORY}"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${180 + i * 120}" y="${700 - i * 90}" width="240" height="${180 + i * 90}" fill="${i % 2 ? GOLD : BLACK}" opacity="${i % 2 ? 0.92 : 0.95}"/>`).join("")}
    <circle cx="1290" cy="240" r="130" fill="none" stroke="${BLACK}" stroke-width="2"/>
    <circle cx="1290" cy="240" r="70" fill="${GOLD}"/>
  </g>`,
  // 9. Halftone
  `<g>
    <rect width="${W}" height="${H}" fill="${GOLD}"/>
    ${Array.from({ length: 18 }, (_, row) => Array.from({ length: 28 }, (_, col) => {
      const r = 2 + ((row * col) % 9);
      return `<circle cx="${70 + col * 55}" cy="${55 + row * 55}" r="${r}" fill="${BLACK}" opacity="${0.25 + ((row + col) % 5) * 0.12}"/>`;
    }).join("")).join("")}
    <rect x="980" y="300" width="420" height="420" fill="${IVORY}"/>
    <rect x="1030" y="350" width="320" height="2" fill="${GOLD}"/>
  </g>`,
  // 10. Frames
  `<g>
    <rect width="${W}" height="${H}" fill="${BLACK}"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${180 + i * 42}" y="${120 + i * 38}" width="${1240 - i * 84}" height="${760 - i * 76}" fill="none" stroke="${i % 2 ? IVORY : GOLD}" stroke-width="${i === 0 ? 3 : 1.4}" opacity="${0.85 - i * 0.1}"/>`).join("")}
    <circle cx="1230" cy="700" r="56" fill="${GOLD}"/>
  </g>`,
  // 11. Horizon
  `<g>
    <rect width="${W}" height="${H}" fill="${IVORY}"/>
    <rect y="640" width="${W}" height="360" fill="${BLACK}"/>
    <circle cx="800" cy="640" r="210" fill="${GOLD}"/>
    <path d="M0 640 H1600" stroke="${GOLD}" stroke-width="3"/>
    <path d="M0 700 H1600 M0 760 H1600 M0 820 H1600" stroke="${IVORY}" stroke-width="1" opacity=".15"/>
  </g>`,
  // 12. Monogram field
  `<g>
    <rect width="${W}" height="${H}" fill="${BLACK}"/>
    ${Array.from({ length: 9 }, (_, i) => `<text x="${40 + (i % 3) * 520}" y="${300 + Math.floor(i / 3) * 300}" font-family="Georgia, serif" font-size="300" fill="${IVORY}" opacity="${0.05 + (i % 3) * 0.03}">M</text>`).join("")}
    <rect x="560" y="250" width="480" height="480" fill="none" stroke="${GOLD}" stroke-width="3"/>
    <text x="800" y="560" text-anchor="middle" font-family="Georgia, serif" font-size="360" fill="${GOLD}">M</text>
  </g>`,
];

function frame(index, content) {
  const background = index === 1 || index === 3 || index === 7 || index === 10 ? IVORY : BLACK;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img">
  <defs>${grain}</defs>
  <rect width="${W}" height="${H}" fill="${background}"/>
  ${content}
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity=".8"/>
  <text x="1540" y="955" text-anchor="end" font-family="Arial, sans-serif" font-size="22" letter-spacing="7" fill="${GOLD}" opacity=".9">MIC TECH</text>
</svg>`;
}

await fs.mkdir(OUT, { recursive: true });
for (let index = 0; index < variants.length; index += 1) {
  const name = String(index + 1).padStart(2, "0");
  await fs.writeFile(path.join(OUT, `${name}.svg`), frame(index, variants[index]), "utf8");
}
console.log(`Generated ${variants.length} editorial artworks in ${OUT}`);
