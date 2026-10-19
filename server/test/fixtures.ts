import type { PlaybackUpdate } from "../src/playback/schema.js";

export function update(overrides: Partial<PlaybackUpdate> = {}): PlaybackUpdate {
  return {
    householdId: "demo",
    contentId: "tears-of-steel",
    title: "Tears of Steel",
    durationSec: 734,
    positionSec: 0,
    state: "playing",
    cues: [],
    ...overrides,
  };
}
