import { describe, expect, it } from "vitest";
import { setup, update } from "./helpers.js";

const post = (app: ReturnType<typeof setup>["app"], body: unknown, key = "test-key") =>
  app.request("/v1/playback", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("POST /v1/playback", () => {
  it("stores a valid update", async () => {
    const { app, memory } = setup();
    const response = await post(app, update({ positionSec: 42, cues: [{ startSec: 40, endSec: 41, text: "Hey" }] }));

    expect(response.status).toBe(204);
    expect((await memory.get("demo"))?.positionSec).toBe(42);
  });

  it("rejects a wrong device key", async () => {
    const { app } = setup();
    expect((await post(app, update(), "nope")).status).toBe(401);
  });

  it("says which field is wrong", async () => {
    const { app } = setup();
    const response = await post(app, { ...update(), positionSec: -5, state: "rewinding" });

    expect(response.status).toBe(400);
    const body = (await response.json()) as { issues: { field: string }[] };
    expect(body.issues.map((issue) => issue.field).sort()).toEqual(["positionSec", "state"]);
  });

  it("rejects a body that isn't JSON", async () => {
    const { app } = setup();
    const response = await app.request("/v1/playback", {
      method: "POST",
      headers: { Authorization: "Bearer test-key", "Content-Type": "application/json" },
      body: "{not json",
    });
    expect(response.status).toBe(400);
  });
});

describe("GET /v1/playback/:householdId", () => {
  it("shows what Rewind remembers", async () => {
    const { app } = setup();
    await post(app, update({ positionSec: 75, state: "paused", cues: [{ startSec: 70, endSec: 72, text: "Stay." }] }));

    const response = await app.request("/v1/playback/demo", { headers: { Authorization: "Bearer test-key" } });
    expect(await response.json()).toMatchObject({ title: "Tears of Steel", position: "1:15", lastMinute: "[1:10] Stay." });
  });

  it("returns 404 before anything plays", async () => {
    const { app } = setup();
    const response = await app.request("/v1/playback/demo", { headers: { Authorization: "Bearer test-key" } });
    expect(response.status).toBe(404);
  });
});
