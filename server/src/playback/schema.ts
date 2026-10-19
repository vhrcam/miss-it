import { z } from "zod";

export const cueSchema = z.object({
  startSec: z.number().nonnegative(),
  endSec: z.number().nonnegative(),
  text: z.string().max(1000),
  speaker: z.string().max(100).optional(),
});

export const playbackUpdateSchema = z.object({
  householdId: z.string().min(1).max(64),
  contentId: z.string().min(1).max(128),
  title: z.string().min(1).max(200),
  durationSec: z.number().positive().optional(),
  positionSec: z.number().nonnegative(),
  state: z.enum(["playing", "paused", "ended"]),
  event: z.enum(["tick", "play", "pause", "seek", "ended"]).optional(),
  sentAt: z.number().int().positive().optional(),
  cues: z.array(cueSchema).max(500),
});

export type PlaybackUpdate = z.infer<typeof playbackUpdateSchema>;
