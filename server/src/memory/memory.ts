import { WatchLog } from "spoiler-safe-context";
import type { PlaybackUpdate } from "../playback/schema.js";
import { Descriptions } from "../scenes/descriptions.js";
import type { MemoryStore } from "./store.js";
import type { StoredRecap, Viewing } from "./viewing.js";

export type RecordResult =
  | { status: "stored"; viewing: Viewing; added: number }
  | { status: "stale" };

// Playback can jump a little between updates; anything bigger is a skip.
const MAX_STEP_SEC = 15;

export class Memory {
  readonly #store: MemoryStore;
  readonly #descriptions: Descriptions;

  constructor(store: MemoryStore, options: { descriptions?: Descriptions } = {}) {
    this.#store = store;
    this.#descriptions = options.descriptions ?? new Descriptions();
  }

  get(householdId: string): Promise<Viewing | undefined> {
    return this.#store.get(householdId);
  }

  recap(householdId: string): Promise<StoredRecap | undefined> {
    return this.#store.getRecap(householdId);
  }

  saveRecap(householdId: string, recap: StoredRecap): Promise<void> {
    return this.#store.putRecap(householdId, recap);
  }

  async record(update: PlaybackUpdate, now = Date.now()): Promise<RecordResult> {
    const current = await this.#store.get(update.householdId);
    const sameTitle = current?.contentId === update.contentId;

    if (sameTitle && update.sentAt && current.sentAt && update.sentAt < current.sentAt) {
      return { status: "stale" };
    }

    const log = sameTitle ? current.log : new WatchLog();
    let added = log.add(update.cues);

    // On-screen descriptions only count for stretches that actually played,
    // the same way the TV only sends captions it showed.
    const fromSec = sameTitle ? current.positionSec : update.positionSec;
    const step = update.positionSec - fromSec;
    if (update.event !== "seek" && step > 0 && step <= MAX_STEP_SEC) {
      added += log.add(this.#descriptions.playedBetween(update.contentId, fromSec, update.positionSec));
    }
    log.seek(update.positionSec);

    const viewing: Viewing = {
      householdId: update.householdId,
      contentId: update.contentId,
      title: update.title,
      durationSec: update.durationSec ?? (sameTitle ? current.durationSec : undefined),
      state: update.state,
      positionSec: update.positionSec,
      sentAt: update.sentAt ?? (sameTitle ? current.sentAt : undefined),
      receivedAt: now,
      log,
    };
    await this.#store.put(viewing);
    return { status: "stored", viewing, added };
  }
}
