import { formatTimestamp } from "spoiler-safe-context";
import type { Narrator } from "../ai/narrator.js";
import type { Recaps } from "../ai/recaps.js";
import type { CastGuide } from "../cast/guide.js";
import type { Memory } from "../memory/memory.js";
import { isStale, livePosition, type Viewing } from "../memory/viewing.js";

export interface ToolContext {
  memory: Memory;
  cast: CastGuide;
  householdId: string;
  now: () => number;
  log: (line: string) => void;
  narrator?: Narrator;
  recaps?: Recaps;
}

export const NOTHING_PLAYING = "Nothing is playing on the TV right now.";

export const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false,
} as const;

export async function currentViewing(ctx: ToolContext): Promise<Viewing | undefined> {
  return ctx.memory.get(ctx.householdId);
}

export function positionLabel(viewing: Viewing, ctx: ToolContext): string {
  return formatTimestamp(livePosition(viewing, ctx.now()));
}

export function staleNote(viewing: Viewing, ctx: ToolContext): string {
  return isStale(viewing, ctx.now())
    ? "\n\nNote: the TV hasn't checked in for a few minutes, so this may be out of date."
    : "";
}

export function textResult<T extends Record<string, unknown>>(text: string, structuredContent: T) {
  return { content: [{ type: "text" as const, text }], structuredContent };
}
