import { describe, expect, it } from "vitest";
import { FakeNarrator } from "./fake-narrator.js";
import { callTool, setup, update } from "./helpers.js";

type App = ReturnType<typeof setup>["app"];

const cue = (startSec: number, text: string) => ({ startSec, endSec: startSec + 3, text });

const latest = (app: App, key = "test-key") =>
  app.request("/v1/playback/demo/answer", { headers: { Authorization: `Bearer ${key}` } });

const card = async (app: App) => ((await (await latest(app)).json()) as { answer: any }).answer;

describe("GET /v1/playback/:householdId/answer", () => {
  it("has nothing before anyone asks Alexa", async () => {
    const { app } = setup();
    const response = await latest(app);

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ answer: null });
  });

  it("rejects a wrong device key", async () => {
    const { app } = setup();
    expect((await latest(app, "nope")).status).toBe(401);
  });

  it("gives the last answer and how old it is", async () => {
    let now = 1_000_000;
    const { app, memory } = setup({ now: () => now });
    await memory.saveAnswer("demo", { id: "a1", tool: "who_is_on_screen", text: "Celia, played by Denise Rebergen.", answeredAt: now });
    now += 4200;

    expect(await (await latest(app)).json()).toEqual({
      answer: { id: "a1", tool: "who_is_on_screen", text: "Celia, played by Denise Rebergen.", ageMs: 4200 },
    });
  });
});

describe("answer cards", () => {
  it("show the recap Alexa reads out", async () => {
    const { app, memory } = setup({ narrator: new FakeNarrator() });
    await memory.record(update({ positionSec: 90, cues: [cue(60, "You left me")] }));

    await callTool(app, "recap_recent");
    expect(await card(app)).toMatchObject({ tool: "recap_recent", text: "Recap #1" });
  });

  it("show the last two lines when the model is down", async () => {
    const narrator = new FakeNarrator();
    narrator.failing = true;
    const { app, memory } = setup({ narrator });
    await memory.record(update({ positionSec: 100, cues: [cue(50, "One"), cue(70, "Two"), cue(90, "Three")] }));

    await callTool(app, "recap_recent");
    expect(await card(app)).toMatchObject({ tool: "recap_recent", text: "Two\nThree" });
  });

  it("name who is on screen", async () => {
    const cast = {
      "tears-of-steel": [
        {
          character: "Celia",
          actor: "Denise Rebergen",
          bios: [{ fromSec: 0, text: "She's breaking up with Thom." }],
          scenes: [[40, 120]] as [number, number][],
        },
      ],
    };
    const { app, memory } = setup({ cast });
    await memory.record(update({ positionSec: 60, state: "paused" }));

    await callTool(app, "who_is_on_screen");
    expect(await card(app)).toMatchObject({
      tool: "who_is_on_screen",
      text: "Celia, played by Denise Rebergen. She's breaking up with Thom.",
    });
  });

  it("keep the question with a follow-up answer", async () => {
    const { app, memory } = setup({ narrator: new FakeNarrator() });
    await memory.record(update({ positionSec: 90, cues: [cue(20, "You never listen")] }));

    await callTool(app, "ask_about_show", { question: "Why is she mad at him?" });
    expect(await card(app)).toMatchObject({
      tool: "ask_about_show",
      question: "Why is she mad at him?",
      text: "Answer to: Why is she mad at him?",
    });
  });

  it("are skipped when Alexa has to write the answer itself", async () => {
    const { app, memory } = setup();
    await memory.record(update({ positionSec: 90, cues: [cue(20, "You never listen")] }));

    await callTool(app, "ask_about_show", { question: "Why is she mad at him?" });
    expect(await card(app)).toBeNull();
  });

  it("get a new id for every answer", async () => {
    const { app, memory } = setup();
    await memory.record(update({ positionSec: 90 }));

    await callTool(app, "whats_playing");
    const first = await card(app);
    await callTool(app, "whats_playing");
    const second = await card(app);

    expect(first.tool).toBe("whats_playing");
    expect(second.id).not.toBe(first.id);
  });
});
