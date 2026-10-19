import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatTimestamp, toTranscript } from "spoiler-safe-context";
import { currentViewing, NOTHING_PLAYING, READ_ONLY, staleNote, textResult, type ToolContext } from "../context.js";

export function registerRecapRecent(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    "recap_recent",
    {
      title: "Recap what I missed",
      description:
        "Catch the user up on the show or movie playing on their TV: what happened in the last minute or so, " +
        "for someone who stepped away or zoned out. Use for \"what did I miss?\", \"what just happened?\" or " +
        "\"catch me up\". Only covers what has already been shown, never anything ahead.",
      inputSchema: {
        seconds: z
          .number()
          .int()
          .min(10)
          .max(900)
          .optional()
          .describe("How far back to look, in seconds. Defaults to 60."),
      },
      outputSchema: {
        playing: z.boolean(),
        title: z.string().optional(),
        from: z.string().optional(),
        to: z.string().optional(),
        lines: z.array(z.string()).optional(),
      },
      annotations: { title: "Recap what I missed", ...READ_ONLY },
    },
    async ({ seconds = 60 }) => {
      const viewing = await currentViewing(ctx);
      if (!viewing) return textResult(`${NOTHING_PLAYING} There's nothing to recap.`, { playing: false });

      const to = viewing.log.positionSec;
      const from = Math.max(0, to - seconds);
      const range = { from: formatTimestamp(from), to: formatTimestamp(to) };
      const cues = viewing.log.recent(seconds);
      const transcript = toTranscript(cues);

      const text = cues.length
        ? `Everything said in ${viewing.title} from ${range.from} to ${range.to}. Nothing after ${range.to} has been shown yet.\n${transcript}`
        : `No one spoke in ${viewing.title} from ${range.from} to ${range.to}.`;

      return textResult(text + staleNote(viewing, ctx), {
        playing: viewing.state === "playing",
        title: viewing.title,
        ...range,
        lines: transcript ? transcript.split("\n") : [],
      });
    },
  );
}
