import { readdir, readFile } from "node:fs/promises";
import { parseCaptions, type Cue } from "spoiler-safe-context";

// Notes on what's visible on screen, one WebVTT descriptions track per title
// (data/descriptions/<contentId>.vtt). They fill in the stretches without
// dialogue, like an action scene.
export class Descriptions {
  readonly #titles: Map<string, Cue[]>;

  constructor(titles: Record<string, Cue[]> = {}) {
    this.#titles = new Map(
      Object.entries(titles).map(([contentId, cues]) => [contentId, cues.map((cue) => ({ ...cue, kind: "description" as const }))]),
    );
  }

  static async load(dir: URL): Promise<Descriptions> {
    const files = await readdir(dir).catch((error: NodeJS.ErrnoException) => {
      if (error.code === "ENOENT") return [];
      throw error;
    });
    const titles: Record<string, Cue[]> = {};
    for (const file of files.filter((name) => name.endsWith(".vtt"))) {
      titles[file.slice(0, -".vtt".length)] = parseCaptions(await readFile(new URL(file, dir), "utf8"));
    }
    return new Descriptions(titles);
  }

  // Descriptions that finished while the viewer watched from `fromSec` to `toSec`.
  playedBetween(contentId: string, fromSec: number, toSec: number): Cue[] {
    return (this.#titles.get(contentId) ?? []).filter((cue) => cue.endSec > fromSec && cue.endSec <= toSec);
  }
}
