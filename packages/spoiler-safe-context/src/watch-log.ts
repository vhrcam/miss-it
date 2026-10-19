import type { Cue } from "./cue.js";

export interface WatchLogOptions {
  maxCues?: number;
}

export interface WatchLogSnapshot {
  positionSec: number;
  cues: Cue[];
}

// Remembers the captions a viewer has actually seen. Every read is cut off at
// the current position, so nothing after it can leak into an answer.
export class WatchLog {
  #cues: Cue[] = [];
  #keys = new Set<string>();
  #positionSec = 0;
  readonly #maxCues: number;

  constructor(options: WatchLogOptions = {}) {
    this.#maxCues = options.maxCues ?? 5000;
  }

  static fromJSON(snapshot: WatchLogSnapshot, options?: WatchLogOptions): WatchLog {
    const log = new WatchLog(options);
    log.add(snapshot.cues);
    log.seek(snapshot.positionSec);
    return log;
  }

  get positionSec(): number {
    return this.#positionSec;
  }

  get size(): number {
    return this.#cues.length;
  }

  seek(positionSec: number): void {
    if (!Number.isFinite(positionSec) || positionSec < 0) {
      throw new RangeError(`Invalid position: ${positionSec}`);
    }
    this.#positionSec = positionSec;
  }

  // Adds cues that were on screen. Repeats (after a rewind, or a resent
  // update) are skipped. Returns how many cues were new.
  add(cues: Iterable<Cue>): number {
    let added = 0;
    for (const cue of cues) {
      if (!Number.isFinite(cue.startSec) || !cue.text.trim()) continue;
      const key = cueKey(cue);
      if (this.#keys.has(key)) continue;
      this.#keys.add(key);
      insertByStart(this.#cues, cue);
      added++;
    }
    while (this.#cues.length > this.#maxCues) {
      this.#keys.delete(cueKey(this.#cues.shift()!));
    }
    return added;
  }

  // Everything shown up to the current position.
  seen(): Cue[] {
    return this.#cues.filter((cue) => cue.startSec <= this.#positionSec);
  }

  // Cues on screen at any point in the last `windowSec` seconds.
  recent(windowSec: number): Cue[] {
    const from = this.#positionSec - windowSec;
    return this.#cues.filter((cue) => cue.startSec <= this.#positionSec && cue.endSec >= from);
  }

  toJSON(): WatchLogSnapshot {
    return { positionSec: this.#positionSec, cues: [...this.#cues] };
  }
}

function cueKey(cue: Cue): string {
  return `${Math.round(cue.startSec * 10)}|${cue.text.replace(/\s+/g, " ").trim().toLowerCase()}`;
}

function insertByStart(cues: Cue[], cue: Cue): void {
  let low = 0;
  let high = cues.length;
  while (low < high) {
    const mid = (low + high) >>> 1;
    if (cues[mid]!.startSec <= cue.startSec) low = mid + 1;
    else high = mid;
  }
  cues.splice(low, 0, cue);
}
