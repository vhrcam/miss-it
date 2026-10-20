import { handle } from "hono/aws-lambda";
import { BedrockNarrator } from "./ai/bedrock.js";
import { createApp } from "./app.js";
import { CastGuide } from "./cast/guide.js";
import { loadConfig } from "./config.js";
import { DynamoStore } from "./memory/dynamo-store.js";
import { Memory } from "./memory/memory.js";
import { Descriptions } from "./scenes/descriptions.js";

const table = process.env.REWIND_TABLE;
if (!table) throw new Error("REWIND_TABLE is not set");

const config = loadConfig();
const app = createApp({
  config,
  memory: new Memory(new DynamoStore(table), {
    descriptions: await Descriptions.load(new URL("./data/descriptions/", import.meta.url)),
  }),
  cast: await CastGuide.load(new URL("./data/cast.json", import.meta.url)),
  narrator: config.ai.enabled ? new BedrockNarrator(config.ai) : undefined,
});

export const handler = handle(app);
