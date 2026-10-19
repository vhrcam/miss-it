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

  it("lists its tools", async () => {
    const { app } = setup();
    const { body } = await mcp(app, "tools/list");

    expect(body.result.tools.map((tool: { name: string }) => tool.name)).toEqual([
      "recap_recent",
    ]);
    for (const tool of body.result.tools) {
      expect(tool.annotations.readOnlyHint).toBe(true);
    }
  });

  it("rejects GET because it doesn't stream", async () => {
    const { app } = setup();
    expect((await app.request("/mcp")).status).toBe(405);
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

  it("says when nothing is playing", async () => {
    const { app } = setup();
    const result = await callTool(app, "recap_recent");
    expect(result.content[0]!.text).toContain("Nothing is playing");
    expect(result.structuredContent).toEqual({ playing: false });
  });
});
