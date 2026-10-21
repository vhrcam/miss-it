import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StreamableHTTPClientTransport} from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type {ToolCall} from './chooseTool';
import type {ToolResult} from './reply';

const CALL_TIMEOUT_MS = 15000;

// Talks to the Miss It? MCP server the way Alexa+ does: one MCP client over
// Streamable HTTP, connected on first use and again after a failure.
export function createMcpClient(apiUrl: string) {
  let connection: Promise<Client> | undefined;

  const open = async () => {
    const client = new Client({name: 'miss-it-alexa-sim', version: '0.1.0'});
    await client.connect(new StreamableHTTPClientTransport(new URL('/mcp', apiUrl)));
    return client;
  };

  const connect = () => {
    connection ??= open().catch((error: unknown) => {
      connection = undefined;
      throw error;
    });
    return connection;
  };

  return {
    connect: async () => {
      await connect();
    },
    call: async ({name, arguments: args}: ToolCall) => {
      const client = await connect();
      const result = await client.callTool({name, arguments: args}, undefined, {
        timeout: CALL_TIMEOUT_MS,
      });
      return result as ToolResult;
    },
  };
}
