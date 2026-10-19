import { Hono } from "hono";
import type { Config } from "./config.js";
import type { Memory } from "./memory/memory.js";
import { mcpHandler, type Logger } from "./mcp/route.js";
import { playbackRoutes } from "./playback/routes.js";

export interface AppDeps {
  config: Config;
  memory: Memory;
  now?: () => number;
  log?: Logger;
}

export function createApp({ config, memory, now = Date.now, log = console.log }: AppDeps): Hono {
  const app = new Hono();
  const mcp = mcpHandler({ memory, householdId: config.householdId, now }, log);

  app.get("/", (c) =>
    c.json({
      name: "Rewind",
      description: "Ask Alexa what you missed on TV and get a spoiler-free recap",
      mcp: "/mcp",
      playback: "/v1/playback",
    }),
  );
  app.get("/health", (c) => c.json({ ok: true }));
  app.route("/v1/playback", playbackRoutes(memory, config.deviceKey));

  app.post("/mcp", mcp);
  app.on(["GET", "DELETE"], "/mcp", (c) =>
    c.json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null }, 405, {
      Allow: "POST",
    }),
  );

  return app;
}
