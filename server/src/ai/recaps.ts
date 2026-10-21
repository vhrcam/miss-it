import { formatTimestamp, toTranscript } from "spoiler-safe-context";
import type { Memory } from "../memory/memory.js";
import type { StoredRecap, Viewing } from "../memory/viewing.js";
import type { Narrator } from "./narrator.js";

export interface RecapsOptions {
  windowSec?: number;
  timeoutMs?: number;
}

export interface Recap extends StoredRecap {
  ready: boolean;
}

const EARLIER_CHARS = 2000;
const MAX_DRIFT_SEC = 20;

// Alexa+ wants answers in under 500 ms, and a model call takes longer than
// that. So Miss It? writes the "last minute" recap while the show plays, and
// "what did I miss?" becomes a lookup.
export class Recaps {
  readonly windowSec: number;
  readonly #memory: Memory;
  readonly #narrator: Narrator;
  readonly #timeoutMs: number;

  constructor(memory: Memory, narrator: Narrator, options: RecapsOptions = {}) {
    this.#memory = memory;
    this.#narrator = narrator;
    this.windowSec = options.windowSec ?? 60;
    this.#timeoutMs = options.timeoutMs ?? 8000;
  }

  // Called after every playback update. Only calls the model when the stored
  // recap no longer matches what's on screen.
  async refresh(viewing: Viewing): Promise<void> {
    const stored = await this.#memory.recap(viewing.householdId);
    if (isCurrent(stored, viewing)) return;
    await this.#memory.saveRecap(viewing.householdId, await this.#write(viewing, this.windowSec));
  }

  async get(viewing: Viewing, windowSec = this.windowSec): Promise<Recap> {
    if (windowSec === this.windowSec) {
      const stored = await this.#memory.recap(viewing.householdId);
      if (isCurrent(stored, viewing)) return { ...stored, ready: true };
    }
    return { ...(await this.#write(viewing, windowSec)), ready: false };
  }

  async #write(viewing: Viewing, windowSec: number): Promise<StoredRecap> {
    const toSec = viewing.log.positionSec;
    const fromSec = Math.max(0, toSec - windowSec);
    const recent = viewing.log.recent(windowSec);

    const text = recent.length
      ? await this.#narrator.recap(
          {
            title: viewing.title,
            fromSec,
            toSec,
            recent: toTranscript(recent),
            earlier: toTranscript(
              viewing.log.seen().filter((cue) => cue.endSec < fromSec),
              { maxChars: EARLIER_CHARS },
            ),
          },
          AbortSignal.timeout(this.#timeoutMs),
        )
      : `No one has spoken since ${formatTimestamp(fromSec)}.`;

    return { contentId: viewing.contentId, windowSec, fromSec, toSec, text, generatedAt: Date.now() };
  }
}

// A stored recap still holds if the viewer hasn't rewound, hasn't moved far,
// and nothing new has been said since it was written.
function isCurrent(recap: StoredRecap | undefined, viewing: Viewing): recap is StoredRecap {
  if (!recap || recap.contentId !== viewing.contentId) return false;
  const position = viewing.log.positionSec;
  if (position < recap.toSec || position - recap.toSec > MAX_DRIFT_SEC) return false;
  return !viewing.log.seen().some((cue) => cue.startSec > recap.toSec);
}
