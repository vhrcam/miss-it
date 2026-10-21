import { Hono } from "hono";
import { cors } from "hono/cors";
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
      name: "Miss It?",
      description: "Ask Alexa what you missed on TV and get a spoiler-free recap",
      mcp: "/mcp",
      playback: "/v1/playback",
    }),
  );
  app.get("/health", (c) => c.json({ ok: true }));
  app.route("/v1/playback", playbackRoutes({ memory, deviceKey: config.deviceKey, recaps, now, log }));

  // The tools need no sign-in, so any web page may call them, like the
  // simulated Alexa+ in alexa-sim/. The playback API keeps its device key.
  app.use(
    "/mcp",
    cors({
      origin: "*",
      allowMethods: ["GET", "POST", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type", "Accept", "MCP-Protocol-Version", "Mcp-Session-Id", "Last-Event-ID"],
      exposeHeaders: ["Mcp-Session-Id"],
    }),
  );
  app.post("/mcp", mcp);
  app.on(["GET", "DELETE"], "/mcp", (c) =>
    c.json({ jsonrpc: "2.0", error: { code: -32000, message: "Method not allowed." }, id: null }, 405, {
      Allow: "POST",
    }),
  );

  return app;
}
