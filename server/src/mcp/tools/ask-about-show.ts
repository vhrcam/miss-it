import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatTimestamp, toTranscript } from "spoiler-safe-context";
import { currentViewing, NOTHING_PLAYING, READ_ONLY, showOnTv, staleNote, textResult, type ToolContext } from "../context.js";

const MAX_CONTEXT_CHARS = 24_000;
const ANSWER_TIMEOUT_MS = 8000;

export function registerAskAboutShow(server: McpServer, ctx: ToolContext): void {
  server.registerTool(
    "ask_about_show",
    {
      title: "Ask about the show",
      description:
        "Answer a follow-up question about the show or movie playing on the user's TV, using only what has " +
        "been shown so far, so the answer is spoiler-free. Use for questions like \"why is she mad at him?\", " +
        "\"where are they?\" or \"what's the robot thing about?\".",
      inputSchema: {
        question: z.string().min(1).max(500).describe("The user's question, in their own words."),
      },
      outputSchema: {
        title: z.string().optional(),
        upTo: z.string().optional(),
        answer: z.string().optional(),
        context: z.string().optional(),
      },
      annotations: { title: "Ask about the show", ...READ_ONLY },
    },
    async ({ question }) => {
      const viewing = await currentViewing(ctx);
      if (!viewing) return textResult(NOTHING_PLAYING, {});

      const upTo = formatTimestamp(viewing.log.positionSec);
      const context = toTranscript(viewing.log.seen(), { maxChars: MAX_CONTEXT_CHARS });

      if (ctx.narrator && context) {
        try {
          const answer = await ctx.narrator.answer(
            { title: viewing.title, upToSec: viewing.log.positionSec, transcript: context, question },
            AbortSignal.timeout(ANSWER_TIMEOUT_MS),
          );
          await showOnTv(ctx, { tool: "ask_about_show", question, text: answer });
          return textResult(answer + staleNote(viewing, ctx), { title: viewing.title, upTo, answer, context });
        } catch (error) {
          ctx.log(`ask_about_show fell back to the transcript: ${(error as Error).message}`);
        }
      }

      // Alexa writes this answer itself from the lines, so there's no card.
      const text = context
        ? `To answer "${question}", use only these lines from ${viewing.title}. They are everything shown up to ${upTo}; ` +
          `don't guess what happens next.\n${context}`
        : `Nothing has been said in ${viewing.title} yet, so there's nothing to go on.`;

      return textResult(text + staleNote(viewing, ctx), { title: viewing.title, upTo, context });
    },
  );
}
