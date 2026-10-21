import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { formatTimestamp, toTranscript } from "spoiler-safe-context";
import type { Recaps } from "../ai/recaps.js";
import type { Memory } from "../memory/memory.js";
import { isStale, livePosition } from "../memory/viewing.js";
import { playbackUpdateSchema } from "./schema.js";

export interface PlaybackDeps {
  memory: Memory;
  deviceKey: string;
  recaps?: Recaps;
  now?: () => number;
  log: (line: string) => void;
}

export function playbackRoutes({ memory, deviceKey, recaps, now = Date.now, log }: PlaybackDeps): Hono {
  const app = new Hono();
  app.use("*", bearerAuth({ token: deviceKey }));

  app.post("/", async (c) => {
    const body = await c.req.json().catch(() => undefined);
    const parsed = playbackUpdateSchema.safeParse(body);
    if (!parsed.success) {
      const issues = parsed.error.issues.map((issue) => ({
        field: issue.path.join(".") || "body",
        message: issue.message,
      }));
      return c.json({ error: "invalid_playback_update", issues }, 400);
    }
    const result = await memory.record(parsed.data);
    if (result.status === "stored" && recaps) {
      // Keeps the "what did I miss?" answer ready. A failure here only means
      // the next question gets answered live, so it never fails the update.
      await recaps.refresh(result.viewing).catch((error: Error) => log(`recap refresh failed: ${error.message}`));
    }
    return c.body(null, 204);
  });

  // A peek at what Miss It? remembers, for checking the TV app's updates.
  app.get("/:householdId", async (c) => {
    const viewing = await memory.get(c.req.param("householdId"));
    if (!viewing) return c.json({ error: "nothing_playing" }, 404);
    return c.json({
      contentId: viewing.contentId,
      title: viewing.title,
      state: viewing.state,
      position: formatTimestamp(livePosition(viewing)),
      stale: isStale(viewing),
      cuesSeen: viewing.log.seen().length,
      lastMinute: toTranscript(viewing.log.recent(60)),
      recap: (await memory.recap(viewing.householdId))?.text ?? null,
    });
  });

  // The last answer Alexa got, for the TV's answer card. The age is measured
  // here, so it doesn't matter if the TV's clock is off.
  app.get("/:householdId/answer", async (c) => {
    const answer = await memory.answer(c.req.param("householdId"));
    if (!answer) return c.json({ answer: null });
    const { answeredAt, ...card } = answer;
    return c.json({ answer: { ...card, ageMs: Math.max(0, now() - answeredAt) } });
  });

  return app;
}
