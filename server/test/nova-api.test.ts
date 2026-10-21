import { describe, expect, it } from "vitest";
import { BedrockNarrator } from "../src/ai/bedrock.js";
import { CooldownNarrator } from "../src/ai/cooldown.js";
import { createNarrator } from "../src/ai/narrator.js";
import { NovaApiNarrator } from "../src/ai/nova-api.js";
import { SYSTEM_PROMPT } from "../src/ai/prompts.js";
import { loadConfig } from "../src/config.js";

function fakeFetch(status: number, body: unknown) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetch = async (url: string | URL | Request, init: RequestInit = {}) => {
    calls.push({ url: String(url), init });
    return new Response(JSON.stringify(body), { status });
  };
  return { calls, fetch: fetch as typeof globalThis.fetch };
}

const recap = { title: "Tears of Steel", fromSec: 0, toSec: 60, recent: "[0:23] You're a jerk, Thom.", earlier: "" };

describe("the Nova API narrator", () => {
  it("asks Nova 2 Lite for the recap", async () => {
    const { calls, fetch } = fakeFetch(200, {
      choices: [{ message: { content: " Thom got called a jerk. " }, finish_reason: "stop" }],
    });
    const narrator = new NovaApiNarrator({ apiKey: "nova-key", modelId: "nova-2-lite-v1", fetch });

    expect(await narrator.recap(recap)).toBe("Thom got called a jerk.");
    expect(calls[0]!.url).toBe("https://api.nova.amazon.com/v1/chat/completions");
    expect(new Headers(calls[0]!.init.headers).get("Authorization")).toBe("Bearer nova-key");

    const body = JSON.parse(String(calls[0]!.init.body));
    expect(body.model).toBe("nova-2-lite-v1");
    expect(body.messages[0]).toEqual({ role: "system", content: SYSTEM_PROMPT });
    expect(body.messages[1].content[0].text).toContain("You're a jerk, Thom.");
  });

  it("passes on the API's error", async () => {
    const { fetch } = fakeFetch(429, { error: { message: "Too many requests" } });
    const narrator = new NovaApiNarrator({ apiKey: "nova-key", modelId: "nova-2-lite-v1", fetch });

    await expect(narrator.recap(recap)).rejects.toThrow("Nova API returned 429");
  });

  it("fails when the reply has no text", async () => {
    const { fetch } = fakeFetch(200, { choices: [{ message: { content: "" }, finish_reason: "length" }] });
    const narrator = new NovaApiNarrator({ apiKey: "nova-key", modelId: "nova-2-lite-v1", fetch });

    await expect(narrator.recap(recap)).rejects.toThrow("finish reason: length");
  });
});

describe("picking a narrator", () => {
  it("uses the Nova API when NOVA_API_KEY is set", () => {
    const narrator = createNarrator(loadConfig({ NOVA_API_KEY: "nova-key" })) as CooldownNarrator;
    expect(narrator).toBeInstanceOf(CooldownNarrator);
    expect(narrator.model).toBeInstanceOf(NovaApiNarrator);
  });

  it("uses Bedrock without a key", () => {
    const narrator = createNarrator(loadConfig({})) as CooldownNarrator;
    expect(narrator).toBeInstanceOf(CooldownNarrator);
    expect(narrator.model).toBeInstanceOf(BedrockNarrator);
  });

  it("uses neither when AI is off", () => {
    expect(createNarrator(loadConfig({ NOVA_API_KEY: "nova-key", MISS_IT_AI: "off" }))).toBeUndefined();
  });
});
