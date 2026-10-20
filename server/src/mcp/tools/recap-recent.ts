import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatTimestamp, toTranscript } from "spoiler-safe-context";
import { currentViewing, NOTHING_PLAYING, READ_ONLY, showOnTv, staleNote, textResult, type ToolContext } from "../context.js";

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
        recap: z.string().optional(),
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
      const lines = transcript ? transcript.split("\n") : [];
      const playing = viewing.state === "playing";

      if (ctx.recaps && cues.length) {
        try {
          const recap = await ctx.recaps.get(viewing, seconds);
          await showOnTv(ctx, { tool: "recap_recent", text: recap.text });
          return textResult(recap.text + staleNote(viewing, ctx), {
            playing,
            title: viewing.title,
            ...range,
            recap: recap.text,
            lines,
          });
        } catch (error) {
          ctx.log(`recap_recent fell back to the transcript: ${(error as Error).message}`);
        }
      }

      // Without the model, the card shows the last couple of lines.
      if (cues.length) await showOnTv(ctx, { tool: "recap_recent", text: toTranscript(cues.slice(-2), { timestamps: false }) });

      const text = cues.length
        ? `Everything from ${range.from} to ${range.to} in ${viewing.title}. Nothing after ${range.to} has been shown yet.\n${transcript}`
        : `No one spoke in ${viewing.title} from ${range.from} to ${range.to}.`;

      return textResult(text + staleNote(viewing, ctx), { playing, title: viewing.title, ...range, lines });
    },
  );
}
