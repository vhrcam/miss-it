import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { Context } from "hono";
import type { ToolContext } from "./context.js";
import { createMcpServer } from "./server.js";

export type Logger = (line: string) => void;

// Stateless Streamable HTTP: every POST gets a fresh server and a plain JSON
// reply, which keeps answers fast and lets the server scale to zero.
export function mcpHandler(ctx: ToolContext, log: Logger) {
  return async (c: Context): Promise<Response> => {
    const started = performance.now();
    const label = await describe(c.req.raw.clone());
    const server = createMcpServer(ctx);
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    await server.connect(transport);
    try {
      return await transport.handleRequest(c.req.raw);
    } finally {
      await server.close();
      log(`mcp ${label} ${Math.round(performance.now() - started)}ms`);
    }
  };
}

async function describe(request: Request): Promise<string> {
  try {
    const body: unknown = await request.json();
    const messages = (Array.isArray(body) ? body : [body]) as { method?: string; params?: { name?: string } }[];
    return messages
      .map((m) => (m.method === "tools/call" ? `tools/call ${m.params?.name}` : (m.method ?? "response")))
      .join(", ");
  } catch {
    return "invalid";
  }
}
