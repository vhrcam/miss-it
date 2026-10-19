// Step 1 of "who's that?": grab one frame per second from Rewind's copy of a
// title and index every face in it into an Amazon Rekognition collection.
//
//   npm run faces:index -w server -- --content tears-of-steel --video ../media/tears-of-steel.mp4
import {
  CreateCollectionCommand,
  IndexFacesCommand,
  RekognitionClient,
  ResourceAlreadyExistsException,
} from "@aws-sdk/client-rekognition";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { parseArgs, promisify } from "node:util";
import { collectionFor, facesFile, type IndexedFace } from "./shared.js";

const { values: args } = parseArgs({
  options: {
    content: { type: "string" },
    video: { type: "string" },
    region: { type: "string", default: process.env.AWS_REGION ?? "us-east-1" },
    concurrency: { type: "string", default: "4" },
  },
});
if (!args.content || !args.video) throw new Error("Usage: --content <id> --video <path>");

const rekognition = new RekognitionClient({ region: args.region });
const collection = collectionFor(args.content);

await rekognition.send(new CreateCollectionCommand({ CollectionId: collection })).catch((error) => {
  if (!(error instanceof ResourceAlreadyExistsException)) throw error;
});

const frames = await mkdtemp(join(tmpdir(), "rewind-frames-"));
console.log(`Grabbing one frame per second from ${args.video}`);
await promisify(execFile)("ffmpeg", ["-v", "error", "-i", args.video, "-vf", "fps=1", "-q:v", "3", join(frames, "%05d.jpg")]);
const files = (await readdir(frames)).filter((file) => file.endsWith(".jpg")).sort();

const faces: IndexedFace[] = [];
let next = 0;
async function worker() {
  while (next < files.length) {
    const file = files[next++]!;
    const sec = Number.parseInt(file, 10) - 1;
    const { FaceRecords = [] } = await rekognition.send(
      new IndexFacesCommand({
        CollectionId: collection,
        Image: { Bytes: await readFile(join(frames, file)) },
        ExternalImageId: `${args.content}:${sec}`,
        MaxFaces: 15,
        QualityFilter: "AUTO",
      }),
    );
    for (const record of FaceRecords) {
      const { FaceId, BoundingBox, Confidence } = record.Face ?? {};
      if (FaceId && BoundingBox) faces.push({ faceId: FaceId, sec, box: BoundingBox, confidence: Confidence ?? 0 });
    }
    if (sec % 60 === 0) console.log(`  ${sec / 60} min in, ${faces.length} faces so far`);
  }
}
await Promise.all(Array.from({ length: Number(args.concurrency) }, worker));
await rm(frames, { recursive: true, force: true });

faces.sort((a, b) => a.sec - b.sec);
const out = facesFile(args.content);
await mkdir(new URL(".", out), { recursive: true });
await writeFile(out, JSON.stringify(faces, null, 2));
console.log(`Indexed ${faces.length} faces from ${files.length} frames into ${collection}. Saved ${out.pathname}`);
