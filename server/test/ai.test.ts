import { describe, expect, it } from "vitest";
import { Descriptions } from "../src/scenes/descriptions.js";
import { FakeNarrator } from "./fake-narrator.js";
import { callTool, setup, update } from "./helpers.js";

const cue = (startSec: number, text: string) => ({ startSec, endSec: startSec + 3, text });

function rewind(narrator = new FakeNarrator(), descriptions?: Descriptions) {
  const { app, memory } = setup({ narrator, descriptions });
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

  it("cover action scenes with no dialogue", async () => {
    const descriptions = new Descriptions({
      "tears-of-steel": [{ startSec: 430, endSec: 435, text: "Robots smash through the church doors." }],
    });
    const { narrator, play } = rewind(new FakeNarrator(), descriptions);
    await play({ positionSec: 428, cues: [] });
    await play({ positionSec: 436, cues: [] });

    expect(narrator.recaps.at(-1)!.recent).toBe("[7:10] (on screen) Robots smash through the church doors.");
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

describe("answers", () => {
  it("come from what has been shown so far", async () => {
    const { app, narrator, play } = rewind();
    await play({ positionSec: 60, cues: [cue(23, "You're a jerk, Thom."), cue(400, "Spoiler")] });

    const result = await callTool(app, "ask_about_show", { question: "Why is she mad at him?" });
    expect(result.content[0]!.text).toBe("Answer to: Why is she mad at him?");
    expect(narrator.answers[0]!.transcript).toBe("[0:23] You're a jerk, Thom.");
    expect(narrator.answers[0]!.upToSec).toBe(60);
  });

  it("fall back to the transcript when the model is down", async () => {
    const narrator = new FakeNarrator();
    narrator.failing = true;
    const { app, play } = rewind(narrator);
    await play({ positionSec: 60, cues: [cue(23, "You're a jerk, Thom.")] });

    const result = await callTool(app, "ask_about_show", { question: "Why is she mad?" });
    expect(result.content[0]!.text).toContain("use only these lines");
  });
});
