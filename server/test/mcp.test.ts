import { describe, expect, it } from "vitest";
import { callTool, mcp, setup, update } from "./helpers.js";

const cue = (startSec: number, text: string) => ({ startSec, endSec: startSec + 3, text });

describe("MCP server", () => {
  it("negotiates the 2025-11-25 protocol", async () => {
    const { app } = setup();
    const { body } = await mcp(app, "initialize", {
      protocolVersion: "2025-11-25",
      capabilities: {},
      clientInfo: { name: "test", version: "1.0.0" },
    });

    expect(body.result.protocolVersion).toBe("2025-11-25");
    expect(body.result.serverInfo.name).toBe("rewind");
    expect(body.result.instructions).toContain("spoiler-free");
  });

  it("lists the four tools", async () => {
    const { app } = setup();
    const { body } = await mcp(app, "tools/list");

    expect(body.result.tools.map((tool: { name: string }) => tool.name)).toEqual([
      "recap_recent",
      "who_is_on_screen",
      "ask_about_show",
      "whats_playing",
    ]);
    for (const tool of body.result.tools) {
      expect(tool.annotations.readOnlyHint).toBe(true);
    }
  });

  it("rejects GET because it doesn't stream", async () => {
    const { app } = setup();
    expect((await app.request("/mcp")).status).toBe(405);
  });

  it("lets web pages call the tools", async () => {
    const { app } = setup();
    const preflight = await app.request("/mcp", {
      method: "OPTIONS",
      headers: {
        Origin: "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type,mcp-protocol-version",
      },
    });

    expect(preflight.status).toBe(204);
    expect(preflight.headers.get("Access-Control-Allow-Origin")).toBe("*");
    expect(preflight.headers.get("Access-Control-Allow-Headers")).toContain("MCP-Protocol-Version");
  });

  it("keeps web pages out of the playback API", async () => {
    const { app } = setup();
    const response = await app.request("/v1/playback/demo", {
      headers: { Origin: "http://localhost:5173", Authorization: "Bearer test-key" },
    });
    expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });
});

describe("recap_recent", () => {
  it("covers the last minute and nothing after the viewer", async () => {
    const { app, memory } = setup();
    await memory.record(
      update({
        positionSec: 130,
        cues: [cue(30, "Too early"), cue(80, "You left me"), cue(125, "I had to")],
      }),
    );
    await memory.record(update({ positionSec: 130, cues: [cue(200, "From the future")] }));

    const result = await callTool(app, "recap_recent");
    expect(result.structuredContent).toEqual({
      playing: true,
      title: "Tears of Steel",
      from: "1:10",
      to: "2:10",
      lines: ["[1:20] You left me", "[2:05] I had to"],
    });
    expect(result.content[0]!.text).not.toContain("Too early");
    expect(result.content[0]!.text).not.toContain("future");
  });

  it("looks further back when asked", async () => {
    const { app, memory } = setup();
    await memory.record(update({ positionSec: 130, cues: [cue(30, "Too early"), cue(125, "I had to")] }));

    const result = await callTool(app, "recap_recent", { seconds: 120 });
    expect(result.structuredContent.lines).toEqual(["[0:30] Too early", "[2:05] I had to"]);
  });

  it("says who was on screen when no one spoke", async () => {
    const cast = {
      "tears-of-steel": [
        { character: "Celia", actor: "Denise Rebergen", bios: [], scenes: [[40, 120]] as [number, number][] },
        { character: "Thom", actor: "Vanja Rukavina", bios: [], scenes: [[90, 130]] as [number, number][] },
      ],
    };
    const { app, memory } = setup({ cast });
    await memory.record(update({ positionSec: 100, cues: [] }));

    const result = await callTool(app, "recap_recent");
    expect(result.content[0]!.text).toBe("No one spoke in Tears of Steel from 0:40 to 1:40. On screen: Celia and Thom.");
    expect(result.structuredContent.onScreen).toEqual(["Celia", "Thom"]);
  });

  it("says when nothing is playing", async () => {
    const { app } = setup();
    const result = await callTool(app, "recap_recent");
    expect(result.content[0]!.text).toContain("Nothing is playing");
    expect(result.structuredContent).toEqual({ playing: false });
  });
});

describe("whats_playing", () => {
  it("gives the title, position and time left", async () => {
    let now = 1_000_000;
    const { app, memory } = setup({ now: () => now });
    await memory.record(update({ positionSec: 312 }), now);
    now += 2000;

    const result = await callTool(app, "whats_playing");
    expect(result.content[0]!.text).toBe("Tears of Steel is playing, 5:14 in, about 7 minutes left.");
    expect(result.structuredContent).toMatchObject({ position: "5:14", duration: "12:14", remaining: "7:00" });
  });

  it("mentions when the TV has gone quiet", async () => {
    let now = 1_000_000;
    const { app, memory } = setup({ now: () => now });
    await memory.record(update({ positionSec: 60, state: "paused" }), now);
    now += 5 * 60 * 1000;

    const result = await callTool(app, "whats_playing");
    expect(result.content[0]!.text).toContain("paused at 1:00");
    expect(result.content[0]!.text).toContain("hasn't checked in");
  });
});

describe("who_is_on_screen", () => {
  const cast = {
    "tears-of-steel": [
      {
        character: "Celia",
        actor: "Denise Rebergen",
        bios: [
          { fromSec: 0, text: "She's breaking up with Thom." },
          { fromSec: 500, text: "A later reveal." },
        ],
        scenes: [[40, 120]] as [number, number][],
      },
    ],
  };

  it("names who is on screen with what's known so far", async () => {
    const { app, memory } = setup({ cast });
    await memory.record(update({ positionSec: 60, state: "paused" }));

    const result = await callTool(app, "who_is_on_screen");
    expect(result.content[0]!.text).toBe("Celia, played by Denise Rebergen. She's breaking up with Thom.");
    expect(result.content[0]!.text).not.toContain("later reveal");
  });

  it("names who was on screen a moment ago", async () => {
    const { app, memory } = setup({ cast });
    await memory.record(update({ positionSec: 125, state: "paused" }));

    const result = await callTool(app, "who_is_on_screen");
    expect(result.content[0]!.text).toBe(
      "No one is on screen right now. Just before this:\nCelia, played by Denise Rebergen. She's breaking up with Thom.",
    );
    expect(result.structuredContent.recent).toHaveLength(1);
  });

  it("admits when it can't tell", async () => {
    const { app, memory } = setup({ cast });
    await memory.record(update({ positionSec: 300, state: "paused" }));

    const result = await callTool(app, "who_is_on_screen");
    expect(result.content[0]!.text).toContain("can't tell");
  });
});

describe("ask_about_show", () => {
  it("answers from what has been shown so far", async () => {
    const { app, memory } = setup();
    await memory.record(update({ positionSec: 90, cues: [cue(20, "You never listen"), cue(400, "Spoiler")] }));

    const result = await callTool(app, "ask_about_show", { question: "Why is she mad at him?" });
    expect(result.structuredContent.context).toBe("[0:20] You never listen");
    expect(result.content[0]!.text).toContain("Why is she mad at him?");
    expect(result.content[0]!.text).not.toContain("Spoiler");
  });
});
