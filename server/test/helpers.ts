import { createApp } from "../src/app.js";
import type { Config } from "../src/config.js";
import { Memory } from "../src/memory/memory.js";
import { InMemoryStore } from "../src/memory/store.js";

export { update } from "./fixtures.js";

export const config: Config = { port: 0, deviceKey: "test-key", householdId: "demo" };

export function setup(options: { now?: () => number } = {}) {
  const memory = new Memory(new InMemoryStore());
  const app = createApp({
    config,
    memory,
    now: options.now ?? Date.now,
    log: () => {},
  });
  return { app, memory };
}

let nextId = 1;

export async function mcp(app: ReturnType<typeof setup>["app"], method: string, params: object = {}) {
  const response = await app.request("/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": "2025-11-25",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId++, method, params }),
  });
  return { status: response.status, body: (await response.json()) as { result?: any; error?: any } };
}

export async function callTool(app: ReturnType<typeof setup>["app"], name: string, args: object = {}) {
  const { body } = await mcp(app, "tools/call", { name, arguments: args });
  if (body.error) throw new Error(JSON.stringify(body.error));
  return body.result as { content: { type: string; text: string }[]; structuredContent: any; isError?: boolean };
}
