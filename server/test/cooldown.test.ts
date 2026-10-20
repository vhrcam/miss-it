import { describe, expect, it } from "vitest";
import { CooldownNarrator } from "../src/ai/cooldown.js";
import { FakeNarrator } from "./fake-narrator.js";

const recap = { title: "Tears of Steel", fromSec: 0, toSec: 60, recent: "[0:23] You're a jerk, Thom.", earlier: "" };
const question = { title: "Tears of Steel", upToSec: 60, transcript: "[0:23] You're a jerk, Thom.", question: "Why is she mad?" };

describe("CooldownNarrator", () => {
  it("skips the model for a minute after it fails", async () => {
    let now = 0;
    const model = new FakeNarrator();
    const narrator = new CooldownNarrator(model, { now: () => now });

    model.failing = true;
    await expect(narrator.recap(recap)).rejects.toThrow("model unavailable");

    model.failing = false;
    await expect(narrator.recap(recap)).rejects.toThrow("paused");
    await expect(narrator.answer(question)).rejects.toThrow("paused");
    expect(model.recaps).toHaveLength(0);
    expect(model.answers).toHaveLength(0);

    now += 60_000;
    await expect(narrator.recap(recap)).resolves.toBe("Recap #1");
  });

  it("passes calls straight through while the model works", async () => {
    const model = new FakeNarrator();
    const narrator = new CooldownNarrator(model);

    await expect(narrator.answer(question)).resolves.toBe("Answer to: Why is she mad?");
    await expect(narrator.recap(recap)).resolves.toBe("Recap #1");
  });
});
