import { serve } from "@hono/node-server";
import { BedrockNarrator } from "./ai/bedrock.js";
import { createApp } from "./app.js";
import { CastGuide } from "./cast/guide.js";
import { loadConfig } from "./config.js";
import { Memory } from "./memory/memory.js";
import { InMemoryStore } from "./memory/store.js";
import { Descriptions } from "./scenes/descriptions.js";

const config = loadConfig();
const cast = await CastGuide.load(new URL("../data/cast.json", import.meta.url));
const descriptions = await Descriptions.load(new URL("../data/descriptions/", import.meta.url));
const narrator = config.ai.enabled ? new BedrockNarrator(config.ai) : undefined;
const app = createApp({ config, memory: new Memory(new InMemoryStore(), { descriptions }), cast, narrator });

serve({ fetch: app.fetch, port: config.port }, ({ port }) => {
  console.log(`Rewind is listening on http://localhost:${port}`);
  console.log(`  MCP endpoint   http://localhost:${port}/mcp`);
  console.log(`  TV updates     http://localhost:${port}/v1/playback`);
  console.log(`  AI             ${narrator ? `${config.ai.modelId} on Amazon Bedrock (${config.ai.region})` : "off"}`);
});
