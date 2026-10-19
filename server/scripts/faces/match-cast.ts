// Step 2 of "who's that?": search the title's face index with each
// character's reference photos, and turn the matches into the seconds each
// character is on screen. Writes data/cast.json for the server.
//
//   npm run faces:match -w server -- --content tears-of-steel
import { RekognitionClient, SearchFacesByImageCommand } from "@aws-sdk/client-rekognition";
import { readFile, writeFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import type { CastData, CastEntry } from "../../src/cast/guide.js";
import { collectionFor } from "./shared.js";

interface CastFile {
  contentId: string;
  characters: (Omit<CastEntry, "scenes"> & { photos: string[] })[];
}

const { values: args } = parseArgs({
  options: {
    content: { type: "string" },
    region: { type: "string", default: process.env.AWS_REGION ?? "us-east-1" },
    threshold: { type: "string", default: "85" },
  },
});
if (!args.content) throw new Error("Usage: --content <id>");

const data = new URL("../../data/", import.meta.url);
const titleDir = new URL(`cast/${args.content}/`, data);
const castFile = JSON.parse(await readFile(new URL("cast.json", titleDir), "utf8")) as CastFile;
const rekognition = new RekognitionClient({ region: args.region });

// A face can resemble more than one character; it goes to the closest match.
const best = new Map<string, { character: string; similarity: number; sec: number }>();
for (const { character, photos } of castFile.characters) {
  for (const photo of photos) {
    const { FaceMatches = [] } = await rekognition.send(
      new SearchFacesByImageCommand({
        CollectionId: collectionFor(args.content),
        Image: { Bytes: await readFile(new URL(`photos/${photo}`, titleDir)) },
        FaceMatchThreshold: Number(args.threshold),
        MaxFaces: 4096,
      }),
    );
    for (const { Face, Similarity = 0 } of FaceMatches) {
      const sec = Number(Face?.ExternalImageId?.split(":").at(-1));
      const current = best.get(Face!.FaceId!);
      if (!current || Similarity > current.similarity) best.set(Face!.FaceId!, { character, similarity: Similarity, sec });
    }
  }
}

const entries: CastEntry[] = castFile.characters.map(({ photos: _photos, ...entry }) => {
  const seconds = [...best.values()].filter((match) => match.character === entry.character).map((match) => match.sec);
  const scenes = toScenes(seconds);
  console.log(`${entry.character.padEnd(10)} ${String(seconds.length).padStart(3)} frames, ${scenes.length} scenes`);
  return { ...entry, scenes };
});

const outFile = new URL("cast.json", data);
const all = (await readFile(outFile, "utf8").then(JSON.parse, () => ({}))) as CastData;
all[args.content] = entries;
await writeFile(outFile, `${JSON.stringify(all, null, 2)}\n`);
console.log(`Wrote ${outFile.pathname}`);

// Frames are a second apart, so a face missed for a moment shouldn't split a
// scene. Each scene is padded by a second on both sides.
function toScenes(seconds: number[]): [number, number][] {
  const sorted = [...new Set(seconds)].sort((a, b) => a - b);
  const scenes: [number, number][] = [];
  for (const sec of sorted) {
    const last = scenes.at(-1);
    if (last && sec - last[1] <= 3) last[1] = sec + 1;
    else scenes.push([Math.max(0, sec - 1), sec + 1]);
  }
  return scenes;
}
