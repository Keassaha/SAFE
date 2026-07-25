import sharp from "sharp";

const input =
  "public/images/linear-style/safe-dashboard-hybrid-production-concept-v3-real-logo.png";
const output =
  "public/images/linear-style/safe-dashboard-hybrid-production-concept-v5-official-logos.png";

const upperPath =
  "M 4.5,5.5 Q 3.5,3.5 5.5,4 L 12.5,4 Q 14.5,3.5 13.5,5.5 L 10,12.5 Q 9,14.5 8,12.5 Z";
const lowerPath =
  "M 19.5,18.5 Q 20.5,20.5 18.5,20 L 11.5,20 Q 9.5,20.5 10.5,18.5 L 14,11.5 Q 15,9.5 16,11.5 Z";

const overlay = `
<svg width="1589" height="989" viewBox="0 0 1589 989" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="erase-feather" x="-20%" y="-30%" width="140%" height="160%">
      <feGaussianBlur stdDeviation="20"/>
    </filter>
    <linearGradient id="canvas" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fbfcfa"/>
      <stop offset="1" stop-color="#fafbf9"/>
    </linearGradient>
    <linearGradient id="engraved-face" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f5f7f4" stop-opacity=".94"/>
      <stop offset=".48" stop-color="#eef2ee" stop-opacity=".72"/>
      <stop offset="1" stop-color="#eef3ef" stop-opacity=".08"/>
    </linearGradient>
    <linearGradient id="engraved-shadow" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#294638" stop-opacity=".18"/>
      <stop offset=".55" stop-color="#587061" stop-opacity=".09"/>
      <stop offset="1" stop-color="#789081" stop-opacity="0"/>
    </linearGradient>
    <mask id="logo-fade">
      <rect x="0" y="0" width="24" height="24" fill="url(#fade-mask)"/>
    </mask>
    <linearGradient id="fade-mask" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="white"/>
      <stop offset=".58" stop-color="white" stop-opacity=".8"/>
      <stop offset=".93" stop-color="black"/>
    </linearGradient>
  </defs>

  <!-- Efface uniquement l'ancien symbole généré, avec des bords fondus. -->
  <rect x="745" y="65" width="355" height="230" rx="76"
        fill="url(#canvas)" opacity=".98" filter="url(#erase-feather)"/>
  <rect x="770" y="78" width="305" height="205" rx="58"
        fill="url(#canvas)"/>

  <!-- Remplace aussi le symbole approximatif de la barre latérale. -->
  <rect x="34" y="32" width="49" height="58" rx="12" fill="#f3f5f2"/>
  <rect x="40" y="43" width="36" height="39" rx="9"
        fill="#fbfcfa" stroke="#dfe5df" stroke-width="1"/>
  <g transform="translate(43 47) scale(1.18)">
    <path d="${upperPath}" fill="#1f3a2e"/>
    <path d="${lowerPath}" fill="#1f3a2e" fill-opacity=".55"/>
  </g>

  <!-- Véritable tracé SAFE, gravé dans la surface. -->
  <g transform="translate(800 53) scale(10.2)" mask="url(#logo-fade)">
    <g transform="translate(0.20 0.30)" fill="url(#engraved-shadow)">
      <path d="${upperPath}"/>
      <path d="${lowerPath}" fill-opacity=".55"/>
    </g>
    <g transform="translate(-0.14 -0.18)" fill="#ffffff" fill-opacity=".9">
      <path d="${upperPath}"/>
      <path d="${lowerPath}" fill-opacity=".5"/>
    </g>
    <g fill="url(#engraved-face)" stroke="#dce3dd" stroke-width=".10">
      <path d="${upperPath}"/>
      <path d="${lowerPath}" fill-opacity=".55"/>
    </g>
  </g>
</svg>`;

await sharp(input)
  .composite([{ input: Buffer.from(overlay), top: 0, left: 0 }])
  .png()
  .toFile(output);

console.log(output);
