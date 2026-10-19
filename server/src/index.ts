import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { CastGuide } from "./cast/guide.js";
import { loadConfig } from "./config.js";
import { Memory } from "./memory/memory.js";
import { InMemoryStore } from "./memory/store.js";

const config = loadConfig();
const cast = await CastGuide.load(new URL("../data/cast.json", import.meta.url));
const app = createApp({ config, memory: new Memory(new InMemoryStore()), cast });

serve({ fetch: app.fetch, port: config.port }, ({ port }) => {
  console.log(`Rewind is listening on http://localhost:${port}`);
  console.log(`  MCP endpoint   http://localhost:${port}/mcp`);
  console.log(`  TV updates     http://localhost:${port}/v1/playback`);
});
