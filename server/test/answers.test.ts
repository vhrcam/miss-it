import { describe, expect, it } from "vitest";
import { setup } from "./helpers.js";

const latest = (app: ReturnType<typeof setup>["app"], key = "test-key") =>
  app.request("/v1/playback/demo/answer", { headers: { Authorization: `Bearer ${key}` } });

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
