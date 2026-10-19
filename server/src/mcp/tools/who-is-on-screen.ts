import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { livePosition } from "../../memory/viewing.js";
import { currentViewing, NOTHING_PLAYING, positionLabel, READ_ONLY, staleNote, textResult, type ToolContext } from "../context.js";

export function registerWhoIsOnScreen(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    "who_is_on_screen",
    {
      title: "Who's that?",
      description:
        "Identify who is on the TV screen right now: the character, the actor who plays them, and one line on " +
        "who they are so far in the story. Use for \"who's that?\", \"who is she?\" or \"who plays him?\".",
      outputSchema: {
        title: z.string().optional(),
        at: z.string().optional(),
        people: z.array(z.object({ character: z.string(), actor: z.string(), about: z.string() })),
      },
      annotations: { title: "Who's that?", ...READ_ONLY },
    },
    async () => {
      const viewing = await currentViewing(ctx);
      if (!viewing) return textResult(NOTHING_PLAYING, { people: [] });

      const at = positionLabel(viewing, ctx);
      const people = ctx.cast.onScreen(viewing.contentId, livePosition(viewing, ctx.now()));
      const text = people.length
        ? people
            .map((p) => `${p.character}, played by ${p.actor}.${p.about ? ` ${p.about}` : ""}`)
            .join("\n")
        : `I can't tell who's on screen in ${viewing.title} at ${at}.`;

      return textResult(text + staleNote(viewing, ctx), { title: viewing.title, at, people });
    },
  );
}
