import { describe, expect, it } from "vitest";
import { FakeNarrator } from "./fake-narrator.js";
import { callTool, setup, update } from "./helpers.js";

const cue = (startSec: number, text: string) => ({ startSec, endSec: startSec + 3, text });

function rewind(narrator = new FakeNarrator()) {
  const { app, memory } = setup({ narrator });
  const play = (overrides: Parameters<typeof update>[0]) =>
    app.request("/v1/playback", {
      method: "POST",
      headers: { Authorization: "Bearer test-key", "Content-Type": "application/json" },
      body: JSON.stringify(update(overrides)),
    });
  return { app, memory, narrator, play };
}

describe("ready recaps", () => {
  it("are written while the show plays, so asking is a lookup", async () => {
    const { app, narrator, play } = rewind();
    await play({ positionSec: 30, cues: [cue(23, "You're a jerk, Thom.")] });
    expect(narrator.recaps).toHaveLength(1);

    const result = await callTool(app, "recap_recent");
    expect(result.content[0]!.text).toBe("Recap #1");
    expect(result.structuredContent.recap).toBe("Recap #1");
    expect(narrator.recaps).toHaveLength(1);
  });

  it("are only rewritten when something new is said", async () => {
    const { narrator, play } = rewind();
    await play({ positionSec: 30, cues: [cue(23, "One")] });
    await play({ positionSec: 35, cues: [] });
    expect(narrator.recaps).toHaveLength(1);

    await play({ positionSec: 40, cues: [cue(37, "Two")] });
    expect(narrator.recaps).toHaveLength(2);
  });

  it("are rewritten after a rewind", async () => {
    const { narrator, play } = rewind();
    await play({ positionSec: 100, cues: [cue(20, "Early"), cue(90, "Late")] });
    await play({ positionSec: 50, event: "seek", cues: [] });

    expect(narrator.recaps).toHaveLength(2);
    expect(narrator.recaps[1]!.toSec).toBe(50);
    expect(narrator.recaps[1]!.recent).toContain("Early");
    expect(narrator.recaps[1]!.recent).not.toContain("Late");
  });

  it("never show the model anything past the viewer", async () => {
    const { narrator, play } = rewind();
    await play({ positionSec: 100, cues: [cue(10, "Early"), cue(95, "Now"), cue(300, "Later")] });

    const request = narrator.recaps[0]!;
    expect(request.recent).toBe("[1:35] Now");
    expect(request.earlier).toBe("[0:10] Early");
    expect(JSON.stringify(request)).not.toContain("Later");
  });

  it("are written live for a longer window", async () => {
    const { app, narrator, play } = rewind();
    await play({ positionSec: 130, cues: [cue(30, "Too early"), cue(125, "I had to")] });

    const result = await callTool(app, "recap_recent", { seconds: 120 });
    expect(result.content[0]!.text).toBe("Recap #2");
    expect(narrator.recaps[1]!.recent).toContain("Too early");
  });

  it("fall back to the transcript when the model is down", async () => {
    const narrator = new FakeNarrator();
    narrator.failing = true;
    const { app, play } = rewind(narrator);

    expect((await play({ positionSec: 30, cues: [cue(23, "You're a jerk, Thom.")] })).status).toBe(204);
    const result = await callTool(app, "recap_recent");
    expect(result.content[0]!.text).toContain("You're a jerk, Thom.");
  });
});
