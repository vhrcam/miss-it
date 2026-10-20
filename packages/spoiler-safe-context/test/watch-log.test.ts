import { describe, expect, it } from "vitest";
import { WatchLog, type Cue } from "../src/index.js";

const cue = (startSec: number, text: string, endSec = startSec + 2): Cue => ({ startSec, endSec, text });

describe("WatchLog", () => {
  it("never returns cues past the current position", () => {
    const log = new WatchLog();
    log.add([cue(10, "seen"), cue(50, "not yet")]);
    log.seek(30);

    expect(log.seen().map((c) => c.text)).toEqual(["seen"]);
    expect(log.recent(600).map((c) => c.text)).toEqual(["seen"]);
  });

  it("returns only the recent window", () => {
    const log = new WatchLog();
    log.add([cue(0, "old"), cue(100, "recent"), cue(115, "now")]);
    log.seek(120);

    expect(log.recent(30).map((c) => c.text)).toEqual(["recent", "now"]);
  });

  it("includes a cue that was still on screen at the window edge", () => {
    const log = new WatchLog();
    log.add([cue(85, "long line", 95)]);
    log.seek(150);

    expect(log.recent(60)).toHaveLength(1);
    expect(log.recent(50)).toHaveLength(0);
  });

  it("skips repeats after a rewind", () => {
    const log = new WatchLog();
    expect(log.add([cue(5, "Hello"), cue(9, "Bye")])).toBe(2);
    expect(log.add([cue(5.02, "hello "), cue(9, "Bye")])).toBe(0);
    expect(log.size).toBe(2);
  });

  it("keeps cues sorted when they arrive out of order", () => {
    const log = new WatchLog();
    log.add([cue(30, "c"), cue(10, "a")]);
    log.add([cue(20, "b")]);
    log.seek(40);

    expect(log.seen().map((c) => c.text)).toEqual(["a", "b", "c"]);
  });

  it("follows a backward seek", () => {
    const log = new WatchLog();
    log.add([cue(10, "early"), cue(200, "later")]);
    log.seek(250);
    log.seek(60);

    expect(log.seen().map((c) => c.text)).toEqual(["early"]);
  });

  it("drops the oldest cues past maxCues", () => {
    const log = new WatchLog({ maxCues: 2 });
    log.add([cue(1, "one"), cue(2, "two"), cue(3, "three")]);
    log.seek(10);

    expect(log.seen().map((c) => c.text)).toEqual(["two", "three"]);
    expect(log.add([cue(1, "one")])).toBe(1);
  });

  it("ignores cues without a time or text", () => {
    const log = new WatchLog();
    expect(log.add([cue(Number.NaN, "no time"), cue(4, "   ")])).toBe(0);
  });

  it("keeps a caption and a description at the same moment apart", () => {
    const log = new WatchLog();
    log.add([cue(5, "Hello"), { startSec: 5, endSec: 7, text: "Hello", kind: "description" }]);
    expect(log.size).toBe(2);
  });

  it("rejects an invalid position", () => {
    expect(() => new WatchLog().seek(-1)).toThrow(RangeError);
  });

  it("round-trips through JSON", () => {
    const log = new WatchLog();
    log.add([cue(1, "a"), cue(2, "b")]);
    log.seek(1.5);

    const restored = WatchLog.fromJSON(JSON.parse(JSON.stringify(log)));
    expect(restored.positionSec).toBe(1.5);
    expect(restored.seen()).toEqual(log.seen());
    expect(restored.add([cue(2, "b")])).toBe(0);
  });
});
