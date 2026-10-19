import { createApp } from "../src/app.js";
import type { Config } from "../src/config.js";
import { Memory } from "../src/memory/memory.js";
import { InMemoryStore } from "../src/memory/store.js";

export { update } from "./fixtures.js";

export const config: Config = { port: 0, deviceKey: "test-key", householdId: "demo" };

export function setup() {
  const memory = new Memory(new InMemoryStore());
  const app = createApp({ config, memory });
  return { app, memory };
}
