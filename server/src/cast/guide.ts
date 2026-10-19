import { readFile } from "node:fs/promises";

export interface CastMember {
  character: string;
  actor: string;
  about: string;
}

// `bios` grow as the story reveals more, so a description never gets ahead of
// the viewer. `scenes` are [start, end] seconds when the character is on screen.
export interface CastEntry {
  character: string;
  actor: string;
  bios: { fromSec: number; text: string }[];
  scenes: [number, number][];
}

export type CastData = Record<string, CastEntry[]>;

export class CastGuide {
  readonly #titles: Map<string, CastEntry[]>;

  constructor(data: CastData = {}) {
    this.#titles = new Map(Object.entries(data));
  }

  static async load(path: URL): Promise<CastGuide> {
    try {
      return new CastGuide(JSON.parse(await readFile(path, "utf8")) as CastData);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return new CastGuide();
      throw error;
    }
  }

  describe(contentId: string, character: string, positionSec: number): CastMember | undefined {
    const entry = this.#titles.get(contentId)?.find((e) => e.character === character);
    return entry && toMember(entry, positionSec);
  }

  onScreen(contentId: string, positionSec: number): CastMember[] {
    return (this.#titles.get(contentId) ?? [])
      .filter((entry) => entry.scenes.some(([start, end]) => start <= positionSec && positionSec <= end))
      .map((entry) => toMember(entry, positionSec));
  }
}

function toMember(entry: CastEntry, positionSec: number): CastMember {
  const known = entry.bios.filter((bio) => bio.fromSec <= positionSec);
  return {
    character: entry.character,
    actor: entry.actor,
    about: known.at(-1)?.text ?? "",
  };
}
