import { describe, expect, it } from "vitest";
import { Memory } from "../src/memory/memory.js";
import { InMemoryStore } from "../src/memory/store.js";
import { livePosition } from "../src/memory/viewing.js";
import { update } from "./fixtures.js";

const cue = (startSec: number, text: string) => ({ startSec, endSec: startSec + 2, text });

describe("Memory", () => {
  it("starts a watch log for a new title", async () => {
    const memory = new Memory(new InMemoryStore());
    await memory.record(update({ positionSec: 12, cues: [cue(10, "Hi")] }));

    const viewing = await memory.get("demo");
    expect(viewing?.title).toBe("Tears of Steel");
    expect(viewing?.log.seen().map((c) => c.text)).toEqual(["Hi"]);
  });

  it("keeps adding to the same title's log", async () => {
    const memory = new Memory(new InMemoryStore());
    await memory.record(update({ positionSec: 12, cues: [cue(10, "One")] }));
    await memory.record(update({ positionSec: 20, cues: [cue(10, "One"), cue(18, "Two")] }));

    const viewing = await memory.get("demo");
    expect(viewing?.log.seen().map((c) => c.text)).toEqual(["One", "Two"]);
  });

  it("starts over when the title changes", async () => {
    const memory = new Memory(new InMemoryStore());
    await memory.record(update({ positionSec: 12, cues: [cue(10, "Old show")] }));
    await memory.record(update({ contentId: "charade", title: "Charade", positionSec: 5, cues: [] }));

    const viewing = await memory.get("demo");
    expect(viewing?.title).toBe("Charade");
    expect(viewing?.log.size).toBe(0);
    expect(viewing?.durationSec).toBe(734);
  });

  it("ignores updates older than the newest one", async () => {
    const memory = new Memory(new InMemoryStore());
    await memory.record(update({ positionSec: 30, sentAt: 2000 }));
    const result = await memory.record(update({ positionSec: 25, sentAt: 1000 }));

    expect(result).toBe("stale");
    expect((await memory.get("demo"))?.positionSec).toBe(30);
  });

  it("keeps households apart", async () => {
    const memory = new Memory(new InMemoryStore());
    await memory.record(update({ householdId: "a", positionSec: 10 }));
    await memory.record(update({ householdId: "b", positionSec: 99 }));

    expect((await memory.get("a"))?.positionSec).toBe(10);
    expect((await memory.get("b"))?.positionSec).toBe(99);
  });
});

describe("livePosition", () => {
  it("moves forward while playing, up to a limit", async () => {
    const memory = new Memory(new InMemoryStore());
    await memory.record(update({ positionSec: 100 }), 1_000_000);
    const viewing = (await memory.get("demo"))!;

    expect(livePosition(viewing, 1_003_000)).toBe(103);
    expect(livePosition(viewing, 1_060_000)).toBe(110);
  });

  it("stays put while paused", async () => {
    const memory = new Memory(new InMemoryStore());
    await memory.record(update({ positionSec: 100, state: "paused" }), 1_000_000);

    expect(livePosition((await memory.get("demo"))!, 1_005_000)).toBe(100);
  });
});
