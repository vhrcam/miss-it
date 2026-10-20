import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { CastMember } from "../../cast/guide.js";
import { livePosition } from "../../memory/viewing.js";
import {
  currentViewing,
  NOTHING_PLAYING,
  positionLabel,
  READ_ONLY,
  showOnTv,
  staleNote,
  textResult,
  type ToolContext,
} from "../context.js";

const person = z.object({ character: z.string(), actor: z.string(), about: z.string() });

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
        people: z.array(person),
        recent: z.array(person).optional(),
      },
      annotations: { title: "Who's that?", ...READ_ONLY },
    },
    async () => {
      const viewing = await currentViewing(ctx);
      if (!viewing) return textResult(NOTHING_PLAYING, { people: [] });

      const at = positionLabel(viewing, ctx);
      const positionSec = livePosition(viewing, ctx.now());
      const people = ctx.cast.onScreen(viewing.contentId, positionSec);
      const recent = people.length ? [] : ctx.cast.lastSeen(viewing.contentId, positionSec);
      const text = people.length
        ? describe(people)
        : recent.length
          ? `No one is on screen right now. Just before this:\n${describe(recent)}`
          : `I can't tell who's on screen in ${viewing.title} at ${at}.`;

      if (people.length || recent.length) await showOnTv(ctx, { tool: "who_is_on_screen", text });
      return textResult(text + staleNote(viewing, ctx), {
        title: viewing.title,
        at,
        people,
        ...(recent.length ? { recent } : {}),
      });
    },
  );
}

function describe(people: CastMember[]): string {
  return people.map((p) => `${p.character}, played by ${p.actor}.${p.about ? ` ${p.about}` : ""}`).join("\n");
}
