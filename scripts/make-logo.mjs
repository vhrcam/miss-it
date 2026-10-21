// Draws the Miss It? logo, an eye with a play button for a pupil, and writes
// every file that uses it: the SVGs in docs/brand, a PNG of the icon for
// uploads, the Fire TV app icon, the eye the TV app shows on screen, and the
// icon and eye on the simulated Alexa+ page.
// Run it with `npm run logo` after changing the shapes or colors below.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Everything is drawn on a 1024 × 1024 tile.
const DEFS = `<defs>
    <linearGradient id="tile" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="#15263F"/>
      <stop offset="0.55" stop-color="#0E1828"/>
      <stop offset="1" stop-color="#0B131F"/>
    </linearGradient>
    <linearGradient id="iris" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#0F1825"/>
      <stop offset="1" stop-color="#142336"/>
    </linearGradient>
    <linearGradient id="play" x1="0" y1="0" x2="0.4" y2="1">
      <stop offset="0" stop-color="#18B0FF"/>
      <stop offset="1" stop-color="#1690F7"/>
    </linearGradient>
  </defs>`;

// The white of the eye is stroked as well as filled, which rounds its corners.
const EYE = `<path d="M124 517 C268 205 756 205 900 517 C756 848 268 848 124 517 Z" fill="#F4F6F9" stroke="#F4F6F9" stroke-width="28" stroke-linejoin="round"/>
  <ellipse cx="512" cy="526" rx="216" ry="190" fill="url(#iris)"/>
  <path d="M451.6 416.4 L615.4 514.6 Q636 527 615.4 539.4 L451.6 637.6 Q431 650 431 626 L431 428 Q431 404 451.6 416.4 Z" fill="url(#play)"/>`;

const svg = (viewBox, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">
  ${DEFS}
  ${body}
</svg>
`;

// The app icon: the eye on a rounded navy tile.
const icon = svg(
  "0 0 1024 1024",
  `<rect x="2" y="2" width="1020" height="1020" rx="180" fill="url(#tile)" stroke="#1D2B3F" stroke-width="4"/>
  ${EYE}`,
);

// Just the eye, for the badge on screen and other small places.
const eye = svg("106 265 812 518", EYE);

// Fire TV's "Your apps" row shows the icon in a wide tile and crops its top
// and bottom (friction log #15), which would cut the rounded corners off. So
// the TV gets a square tile, with the eye a little smaller so it has room
// inside the part that stays visible.
const tvIcon = svg(
  "0 0 1024 1024",
  `<rect width="1024" height="1024" fill="url(#tile)"/>
  <g transform="translate(512 520) scale(0.78) translate(-512 -520)">${EYE}</g>`,
);

function write(path, contents) {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), contents);
  console.log(`Wrote ${path}`);
}

const png = (source, width) =>
  new Resvg(source, { fitTo: { mode: "width", value: width } }).render().asPng();

write("docs/brand/miss-it-icon.svg", icon);
write("docs/brand/miss-it-eye.svg", eye);
write("docs/brand/miss-it-icon.png", png(icon, 1024));
write("firetv/assets/image/miss-it-icon.png", png(tvIcon, 512));
write("firetv/src/assets/eye.png", png(eye, 256));
write("alexa-sim/public/icon.svg", icon);
write("alexa-sim/public/eye.svg", eye);
