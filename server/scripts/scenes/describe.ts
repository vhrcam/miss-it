// Writes a WebVTT descriptions track for a title: Amazon Nova looks at frames
// from Rewind's copy of the video and describes every few seconds in a line.
// The server adds each line to a household's watch log only after that
// stretch has played.
//
//   npm run scenes:describe -w server -- --content tears-of-steel --title "Tears of Steel" \
//     --video ../media/tears-of-steel.mp4 --captions ../media/tears-of-steel.en.vtt
import { BedrockRuntimeClient, ConverseCommand, type ContentBlock } from "@aws-sdk/client-bedrock-runtime";
import { execFile } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { parseArgs, promisify } from "node:util";
import { parseCaptions, type Cue } from "spoiler-safe-context";
import { CastGuide } from "../../src/cast/guide.js";

const SYSTEM_PROMPT = `You write the descriptions track for a film, for someone who looked away from the screen.
- Describe only what is visible in these frames: who is there, what they do, where they are.
- One sentence, present tense, under 15 words.
- Use a person's name only if it's in the list of people on screen. Otherwise describe them, like "a soldier".
- Don't explain what it means for the story, don't guess what happens next, and don't mention frames, shots or the camera.
- For credits or a title card, just say so, like "The end credits roll."`;

const { values: args } = parseArgs({
  options: {
    content: { type: "string" },
    title: { type: "string" },
    video: { type: "string" },
    captions: { type: "string" },
    every: { type: "string", default: "5" },
    model: { type: "string", default: process.env.REWIND_MODEL_ID ?? "us.amazon.nova-2-lite-v1:0" },
    region: { type: "string", default: process.env.AWS_REGION ?? "us-east-1" },
    concurrency: { type: "string", default: "3" },
  },
});
if (!args.content || !args.title || !args.video) {
  throw new Error("Usage: --content <id> --title <title> --video <path> [--captions <vtt>]");
}

const run = promisify(execFile);
const every = Number(args.every);
const bedrock = new BedrockRuntimeClient({ region: args.region, maxAttempts: 6 });
const cast = await CastGuide.load(new URL("../../data/cast.json", import.meta.url));
const captions = args.captions ? parseCaptions(await readFile(args.captions, "utf8")) : [];
const { stdout } = await run("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", args.video]);
const duration = Math.floor(Number(stdout));

async function frame(sec: number): Promise<ContentBlock> {
  const { stdout } = await run(
    "ffmpeg",
    ["-v", "error", "-ss", String(sec), "-i", args.video!, "-frames:v", "1", "-vf", "scale=640:-2", "-q:v", "4", "-f", "image2", "-c:v", "mjpeg", "-"],
    { encoding: "buffer", maxBuffer: 10 * 1024 * 1024 },
  );
  return { image: { format: "jpeg", source: { bytes: stdout } } };
}

async function describe(start: number): Promise<Cue> {
  const end = Math.min(start + every, duration);
  const people = new Set<string>();
  for (let sec = start; sec < end; sec++) {
    for (const member of cast.onScreen(args.content!, sec)) people.add(member.character);
  }
  const lines = captions.filter((cue) => cue.startSec >= start && cue.startSec < end).map((cue) => cue.text.replace(/\s*\n\s*/g, " "));

  const response = await bedrock.send(
    new ConverseCommand({
      modelId: args.model,
      system: [{ text: SYSTEM_PROMPT }],
      messages: [
        {
          role: "user",
          content: [
            await frame(start + every * 0.2),
            await frame(start + every * 0.8),
            {
              text: [
                `${args.title}, ${start} to ${end} seconds in.`,
                `People on screen: ${people.size ? [...people].join(", ") : "not known"}.`,
                `Dialogue in this stretch: ${lines.length ? lines.join(" ") : "none"}.`,
                "Describe what happens on screen.",
              ].join("\n"),
            },
          ],
        },
      ],
      inferenceConfig: { maxTokens: 60, temperature: 0.2 },
    }),
  );
  const text = response.output?.message?.content?.map((block) => block.text ?? "").join("").trim() ?? "";
  return { startSec: start, endSec: end, text };
}

const starts = Array.from({ length: Math.ceil(duration / every) }, (_, i) => i * every);
const cues: Cue[] = [];
let next = 0;
await Promise.all(
  Array.from({ length: Number(args.concurrency) }, async () => {
    while (next < starts.length) {
      const cue = await describe(starts[next++]!);
      if (cue.text) cues.push(cue);
      if (cues.length % 20 === 0) console.log(`  ${cues.length}/${starts.length}`);
    }
  }),
);

// Two stretches in a row that look the same become one cue.
cues.sort((a, b) => a.startSec - b.startSec);
const merged = cues.reduce<Cue[]>((all, cue) => {
  const last = all.at(-1);
  if (last && last.text === cue.text && last.endSec === cue.startSec) last.endSec = cue.endSec;
  else all.push({ ...cue });
  return all;
}, []);

const stamp = (sec: number) => new Date(sec * 1000).toISOString().slice(11, 23);
const vtt = [
  `WEBVTT - ${args.title} scene descriptions`,
  `NOTE Written by ${args.model} on Amazon Bedrock from frames of the film. Each cue describes what is visible on screen.`,
  ...merged.map((cue) => `${stamp(cue.startSec)} --> ${stamp(cue.endSec)}\n${cue.text}`),
].join("\n\n");

const out = new URL(`../../data/descriptions/${args.content}.vtt`, import.meta.url);
await mkdir(new URL(".", out), { recursive: true });
await writeFile(out, `${vtt}\n`);
console.log(`Wrote ${merged.length} descriptions to ${out.pathname}`);
