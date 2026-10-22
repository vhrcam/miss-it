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

// "Miss It?" in Inter Bold (SIL Open Font License), outlined so drawing it
// doesn't need the font. It's set at a font size of 100, baseline at y = 0.
const WORDMARK =
  "M21.4 0L6.6 0L6.6-72.8L29.4-72.8L41.3-39.4Q42.0-37.0 42.9-33.3Q43.9-29.6 44.9-25.3Q45.8-21.0 46.7-16.9Q47.6-12.9 48.1-9.9L48.1-9.9L45.2-9.9Q45.8-12.8 46.6-16.9Q47.5-20.9 48.4-25.2Q49.4-29.5 50.4-33.3Q51.3-37.0 52.1-39.4L52.1-39.4L63.7-72.8L86.6-72.8L86.6 0L71.6 0L71.6-34.3Q71.6-36.7 71.7-40.2Q71.8-43.8 71.9-47.9Q72.0-52.1 72.1-56.2Q72.2-60.4 72.3-64.1L72.3-64.1L73.2-64.1Q72.3-60.1 71.1-55.7Q70.0-51.4 68.9-47.4Q67.7-43.3 66.7-39.9Q65.7-36.5 64.9-34.3L64.9-34.3L52.9 0L40.3 0L28.1-34.3Q27.3-36.5 26.3-39.9Q25.3-43.2 24.1-47.3Q23.0-51.3 21.8-55.6Q20.7-60.0 19.6-64.1L19.6-64.1L20.8-64.1Q20.8-60.6 20.9-56.4Q21.0-52.3 21.1-48.1Q21.2-43.9 21.3-40.4Q21.4-36.8 21.4-34.3L21.4-34.3L21.4 0ZM112.8 0L98.1 0L98.1-54.6L112.8-54.6L112.8 0ZM105.4-61.7L105.4-61.7Q102.1-61.7 99.8-63.9Q97.4-66.1 97.4-69.2L97.4-69.2Q97.4-72.4 99.8-74.6Q102.1-76.8 105.4-76.8L105.4-76.8Q108.8-76.8 111.1-74.6Q113.5-72.4 113.5-69.2L113.5-69.2Q113.5-66.1 111.1-63.9Q108.8-61.7 105.4-61.7ZM145.6 1.1L145.6 1.1Q139.0 1.1 133.9-0.8Q128.8-2.7 125.6-6.3Q122.4-9.9 121.5-14.9L121.5-14.9L135.1-17.3Q136.2-13.5 138.9-11.6Q141.5-9.7 146.0-9.7L146.0-9.7Q150.2-9.7 152.6-11.3Q155.1-12.8 155.1-15.3L155.1-15.3Q155.1-17.4 153.3-18.8Q151.6-20.2 148.0-20.9L148.0-20.9L138.6-22.9Q130.7-24.5 126.8-28.3Q122.9-32.2 122.9-38.3L122.9-38.3Q122.9-43.6 125.8-47.4Q128.7-51.2 133.8-53.2Q138.9-55.3 145.8-55.3L145.8-55.3Q152.3-55.3 157.0-53.5Q161.8-51.7 164.7-48.4Q167.6-45.2 168.6-40.7L168.6-40.7L155.6-38.4Q154.8-41.2 152.4-43.0Q150.0-44.8 146.0-44.8L146.0-44.8Q142.4-44.8 140.0-43.3Q137.5-41.7 137.5-39.2L137.5-39.2Q137.5-37.2 139.1-35.7Q140.7-34.3 144.6-33.5L144.6-33.5L154.4-31.6Q162.3-30.0 166.2-26.3Q170.0-22.7 170.0-16.8L170.0-16.8Q170.0-11.5 166.9-7.4Q163.8-3.4 158.3-1.2Q152.8 1.1 145.6 1.1ZM200.3 1.1L200.3 1.1Q193.7 1.1 188.6-0.8Q183.6-2.7 180.3-6.3Q177.1-9.9 176.2-14.9L176.2-14.9L189.8-17.3Q190.9-13.5 193.6-11.6Q196.2-9.7 200.7-9.7L200.7-9.7Q204.9-9.7 207.4-11.3Q209.8-12.8 209.8-15.3L209.8-15.3Q209.8-17.4 208.0-18.8Q206.3-20.2 202.7-20.9L202.7-20.9L193.3-22.9Q185.4-24.5 181.5-28.3Q177.6-32.2 177.6-38.3L177.6-38.3Q177.6-43.6 180.5-47.4Q183.4-51.2 188.5-53.2Q193.6-55.3 200.5-55.3L200.5-55.3Q207.0-55.3 211.7-53.5Q216.5-51.7 219.4-48.4Q222.3-45.2 223.3-40.7L223.3-40.7L210.3-38.4Q209.5-41.2 207.1-43.0Q204.7-44.8 200.7-44.8L200.7-44.8Q197.1-44.8 194.7-43.3Q192.2-41.7 192.2-39.2L192.2-39.2Q192.2-37.2 193.8-35.7Q195.4-34.3 199.3-33.5L199.3-33.5L209.1-31.6Q217.0-30.0 220.9-26.3Q224.7-22.7 224.7-16.8L224.7-16.8Q224.7-11.5 221.6-7.4Q218.5-3.4 213.0-1.2Q207.5 1.1 200.3 1.1ZM256.0-72.8L270.9-72.8L270.9 0L256.0 0L256.0-72.8ZM277.2-54.6L309.6-54.6L309.6-43.4L277.2-43.4L277.2-54.6ZM284.7-14.7L284.7-67.6L299.4-67.6L299.4-16.0Q299.4-13.4 300.5-12.1Q301.7-10.9 304.4-10.9L304.4-10.9Q305.2-10.9 306.7-11.1Q308.2-11.3 309.0-11.5L309.0-11.5L311.1-0.5Q308.7 0.2 306.2 0.5Q303.8 0.8 301.6 0.8L301.6 0.8Q293.4 0.8 289.1-3.2Q284.7-7.2 284.7-14.7L284.7-14.7ZM343.7-22.4L330.6-22.4L330.6-23.5Q330.6-29.7 331.7-33.3Q332.8-36.9 334.9-39.0Q336.9-41.1 340.0-42.9L340.0-42.9Q343.2-45.1 345.5-47.6Q347.7-50.0 347.7-53.6L347.7-53.6Q347.7-56.2 346.5-58.0Q345.3-59.9 343.3-60.9Q341.3-61.9 338.8-61.9L338.8-61.9Q336.5-61.9 334.4-60.9Q332.3-59.9 331.0-57.9Q329.6-55.9 329.5-52.9L329.5-52.9L315.4-52.9Q315.5-59.9 318.7-64.5Q321.9-69.1 327.2-71.4Q332.6-73.7 338.9-73.7L338.9-73.7Q345.9-73.7 351.3-71.4Q356.7-69.0 359.7-64.6Q362.8-60.3 362.8-54.1L362.8-54.1Q362.8-47.9 359.8-43.7Q356.9-39.6 351.9-36.6L351.9-36.6Q349.1-34.9 347.3-33.2Q345.4-31.5 344.6-29.3Q343.7-27.1 343.7-23.5L343.7-23.5L343.7-22.4ZM337.2 0.9L337.2 0.9Q333.4 0.9 330.9-1.4Q328.5-3.7 328.5-7.3L328.5-7.3Q328.5-11.0 330.9-13.3Q333.4-15.6 337.2-15.6L337.2-15.6Q341.0-15.6 343.4-13.3Q345.8-11.0 345.8-7.3L345.8-7.3Q345.8-3.7 343.4-1.4Q341.0 0.9 337.2 0.9Z";

// Fire TV's "Your apps" row shows the icon in a wide tile, about 1.55:1, and
// crops the square's top and bottom (friction log #15). So the TV icon fills
// the whole tile: the app's night color edge to edge, and the eye, with a soft
// blue glow, next to the name, all inside the band that stays visible.
const tvIcon = svg(
  "0 0 1024 1024",
  `<defs>
    <radialGradient id="glow">
      <stop offset="0" stop-color="#1AA3FF" stop-opacity="0.34"/>
      <stop offset="1" stop-color="#1AA3FF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1024" height="1024" fill="#0B0D12"/>
  <circle cx="247.5" cy="512" r="280" fill="url(#glow)"/>
  <g transform="translate(75.5 336) scale(0.3358)">${EYE}</g>
  <path transform="translate(439.9 559.3) scale(1.3)" fill="#F5F7FA" d="${WORDMARK}"/>`,
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
