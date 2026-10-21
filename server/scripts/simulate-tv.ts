// Plays a caption file into Rewind the way the Fire TV app does, so the MCP
// tools can be tried without a TV.
//
//   npm run simulate -w server                     play Tears of Steel from the start
//   npm run simulate -w server -- --from 120 --speed 4
//   npm run simulate -w server -- --seek 300      jump to 5:00 and stop
import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { formatTimestamp, parseCaptions, type Cue } from "spoiler-safe-context";

const { values: args } = parseArgs({
  options: {
    file: { type: "string", default: new URL("../../media/tears-of-steel.en.vtt", import.meta.url).pathname },
    url: { type: "string", default: process.env.MISS_IT_API_URL ?? "http://localhost:8787" },
    key: { type: "string", default: process.env.MISS_IT_DEVICE_KEY ?? "dev-device-key" },
    household: { type: "string", default: "demo" },
    content: { type: "string", default: "tears-of-steel" },
    title: { type: "string", default: "Tears of Steel" },
    duration: { type: "string", default: "734" },
    from: { type: "string", default: "0" },
    speed: { type: "string", default: "1" },
    seek: { type: "string" },
  },
});

const cues = parseCaptions(await readFile(args.file, "utf8"));
const durationSec = Number(args.duration);
const speed = Number(args.speed);
const TICK_MS = 5000;

async function send(positionSec: number, state: "playing" | "paused" | "ended", event: string, shown: Cue[]) {
  const response = await fetch(`${args.url}/v1/playback`, {
    method: "POST",
    headers: { Authorization: `Bearer ${args.key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      householdId: args.household,
      contentId: args.content,
      title: args.title,
      durationSec,
      positionSec,
      state,
      event,
      sentAt: Date.now(),
      cues: shown,
    }),
  });
  if (!response.ok) throw new Error(`Rewind answered ${response.status}: ${await response.text()}`);

  const latest = shown.at(-1)?.text.replace(/\s*\n\s*/g, " ") ?? "";
  console.log(`${state === "playing" ? "▶" : "⏸"} ${formatTimestamp(positionSec).padStart(5)}  ${latest}`);
}

const between = (from: number, to: number) => cues.filter((cue) => cue.startSec > from && cue.startSec <= to);

if (args.seek) {
  const position = Number(args.seek);
  await send(position, "paused", "seek", between(-1, position));
  process.exit(0);
}

let position = Number(args.from);
await send(position, "playing", "play", between(position - 60, position));

const timer = setInterval(async () => {
  const next = Math.min(position + (TICK_MS / 1000) * speed, durationSec);
  const shown = between(position, next);
  position = next;
  if (position >= durationSec) {
    clearInterval(timer);
    await send(position, "ended", "ended", shown);
    return;
  }
  await send(position, "playing", "tick", shown);
}, TICK_MS);

process.on("SIGINT", async () => {
  clearInterval(timer);
  await send(position, "paused", "pause", []).catch(() => {});
  process.exit(0);
});
