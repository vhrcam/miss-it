import { Hono } from "hono";
import type { Narrator } from "./ai/narrator.js";
import { Recaps } from "./ai/recaps.js";
import type { CastGuide } from "./cast/guide.js";
import type { Config } from "./config.js";
import type { Memory } from "./memory/memory.js";
import { mcpHandler } from "./mcp/route.js";
import { playbackRoutes } from "./playback/routes.js";

export interface AppDeps {
  config: Config;
  memory: Memory;
  cast: CastGuide;
  narrator?: Narrator;
  now?: () => number;
  log?: (line: string) => void;
}

export function createApp({ config, memory, cast, narrator, now = Date.now, log = console.log }: AppDeps): Hono {
  const app = new Hono();
  const recaps = narrator && new Recaps(memory, narrator);
  const mcp = mcpHandler({ memory, cast, householdId: config.householdId, now, log, narrator, recaps });

  app.get("/", (c) =>
    c.json({
      name: "Rewind",
      description: "Ask Alexa what you missed on TV and get a spoiler-free recap",
      mcp: "/mcp",
      playback: "/v1/playback",
    }),
  );
  app.get("/health", (c) => c.json({ ok: true }));
  app.route("/v1/playback", playbackRoutes({ memory, deviceKey: config.deviceKey, recaps, log }));

  app.post("/mcp", mcp);
  app.on(["GET", "DELETE"], "/mcp", (c) =>
    c.json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null }, 405, {
      Allow: "POST",
    }),
  );

  return app;
}
