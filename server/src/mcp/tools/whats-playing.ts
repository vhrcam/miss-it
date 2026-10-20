import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatTimestamp } from "spoiler-safe-context";
import { livePosition } from "../../memory/viewing.js";
import { currentViewing, NOTHING_PLAYING, READ_ONLY, showOnTv, staleNote, textResult, type ToolContext } from "../context.js";

export function registerWhatsPlaying(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    "whats_playing",
    {
      title: "What's playing",
      description:
        "Tell the user what's playing on their TV right now and how far into it they are. " +
        "Use for questions like \"what are we watching?\", \"how far in are we?\" or \"how much is left?\".",
      outputSchema: {
        playing: z.boolean(),
        title: z.string().optional(),
        state: z.enum(["playing", "paused", "ended"]).optional(),
        position: z.string().optional(),
        duration: z.string().optional(),
        remaining: z.string().optional(),
      },
      annotations: { title: "What's playing", ...READ_ONLY },
    },
    async () => {
      const viewing = await currentViewing(ctx);
      if (!viewing) return textResult(NOTHING_PLAYING, { playing: false });

      const positionSec = livePosition(viewing, ctx.now());
      const position = formatTimestamp(positionSec);
      const remainingSec = viewing.durationSec ? Math.max(0, viewing.durationSec - positionSec) : undefined;

      const sentence =
        viewing.state === "ended"
          ? `${viewing.title} just finished.`
          : viewing.state === "paused"
            ? `${viewing.title} is paused at ${position}.`
            : `${viewing.title} is playing, ${position} in${remainingSec === undefined ? "" : `, ${timeLeft(remainingSec)}`}.`;

      await showOnTv(ctx, { tool: "whats_playing", text: sentence });
      return textResult(sentence + staleNote(viewing, ctx), {
        playing: viewing.state === "playing",
        title: viewing.title,
        state: viewing.state,
        position,
        ...(viewing.durationSec ? { duration: formatTimestamp(viewing.durationSec) } : {}),
        ...(remainingSec === undefined ? {} : { remaining: formatTimestamp(remainingSec) }),
      });
    },
  );
}

function timeLeft(seconds: number): string {
  if (seconds < 60) return "less than a minute left";
  const minutes = Math.round(seconds / 60);
  return `about ${minutes} minute${minutes === 1 ? "" : "s"} left`;
}
