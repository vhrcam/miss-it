import { Hono } from "hono";
import type { Config } from "./config.js";
import type { Memory } from "./memory/memory.js";
import { playbackRoutes } from "./playback/routes.js";

export interface AppDeps {
  config: Config;
  memory: Memory;
}

export function createApp({ config, memory }: AppDeps): Hono {
  const app = new Hono();

  app.get("/", (c) =>
    c.json({
      name: "Rewind",
      description: "Ask Alexa what you missed on TV and get a spoiler-free recap",
      playback: "/v1/playback",
    }),
  );
  app.get("/health", (c) => c.json({ ok: true }));
  app.route("/v1/playback", playbackRoutes(memory, config.deviceKey));

  return app;
}
