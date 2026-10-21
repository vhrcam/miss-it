import type { WatchLog } from "spoiler-safe-context";

export type PlaybackState = "playing" | "paused" | "ended";

// What one household's TV is showing, and the captions seen so far.
export interface Viewing {
  householdId: string;
  contentId: string;
  title: string;
  durationSec?: number;
  state: PlaybackState;
  positionSec: number;
  sentAt?: number;
  receivedAt: number;
  log: WatchLog;
}

// A recap written ahead of time, covering fromSec..toSec of one title.
export interface StoredRecap {
  contentId: string;
  windowSec: number;
  fromSec: number;
  toSec: number;
  text: string;
  generatedAt: number;
}

export type AnswerTool = "recap_recent" | "who_is_on_screen" | "ask_about_show" | "whats_playing";

// The last thing Miss It? told Alexa, kept so the TV can show it as a card.
export interface StoredAnswer {
  id: string;
  tool: AnswerTool;
  question?: string;
  text: string;
  answeredAt: number;
}

const MAX_DRIFT_SEC = 10;
const STALE_AFTER_MS = 2 * 60 * 1000;

// The TV reports every few seconds, so while it plays the real position is a
// little past the last report. Drift is capped in case the reports stop.
export function livePosition(viewing: Viewing, now = Date.now()): number {
  if (viewing.state !== "playing") return viewing.positionSec;
  const drift = Math.min(Math.max(0, (now - viewing.receivedAt) / 1000), MAX_DRIFT_SEC);
  const position = viewing.positionSec + drift;
  return viewing.durationSec ? Math.min(position, viewing.durationSec) : position;
}

export function isStale(viewing: Viewing, now = Date.now()): boolean {
  return now - viewing.receivedAt > STALE_AFTER_MS;
}
