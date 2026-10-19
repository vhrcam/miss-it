import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ToolContext } from "./context.js";
import { registerRecapRecent } from "./tools/recap-recent.js";

const INSTRUCTIONS =
  "Rewind knows what is playing on the user's TV and everything that has been shown so far. Use it whenever " +
  "the user asks about the show or movie they're watching: what they missed, who is on screen, what is " +
  "playing, or questions about the story. Rewind is spoiler-free by design. It only knows what has already " +
  "been shown, so never add details about what happens later.";

export function createMcpServer(ctx: ToolContext): McpServer {
  const server = new McpServer({ name: "rewind", title: "Rewind", version: "0.1.0" }, { instructions: INSTRUCTIONS });
  registerRecapRecent(server, ctx);
  return server;
}
