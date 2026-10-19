import { WatchLog } from "spoiler-safe-context";
import type { PlaybackUpdate } from "../playback/schema.js";
import type { MemoryStore } from "./store.js";
import type { Viewing } from "./viewing.js";

export type RecordResult = "stored" | "stale";

export class Memory {
  readonly #store: MemoryStore;

  constructor(store: MemoryStore) {
    this.#store = store;
  }

  get(householdId: string): Promise<Viewing | undefined> {
    return this.#store.get(householdId);
  }

  async record(update: PlaybackUpdate, now = Date.now()): Promise<RecordResult> {
    const current = await this.#store.get(update.householdId);
    const sameTitle = current?.contentId === update.contentId;

    if (sameTitle && update.sentAt && current.sentAt && update.sentAt < current.sentAt) {
      return "stale";
    }

    const log = sameTitle ? current.log : new WatchLog();
    log.add(update.cues);
    log.seek(update.positionSec);

    await this.#store.put({
      householdId: update.householdId,
      contentId: update.contentId,
      title: update.title,
      durationSec: update.durationSec ?? (sameTitle ? current.durationSec : undefined),
      state: update.state,
      positionSec: update.positionSec,
      sentAt: update.sentAt ?? (sameTitle ? current.sentAt : undefined),
      receivedAt: now,
      log,
    });
    return "stored";
  }
}
