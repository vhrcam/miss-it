import { Hono } from "hono";
import { bearerAuth } from "hono/bearer-auth";
import { formatTimestamp, toTranscript } from "spoiler-safe-context";
import type { Memory } from "../memory/memory.js";
import { isStale, livePosition } from "../memory/viewing.js";
import { playbackUpdateSchema } from "./schema.js";

export function playbackRoutes(memory: Memory, deviceKey: string): Hono {
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
    await memory.record(parsed.data);
    return c.body(null, 204);
  });

  // A peek at what Rewind remembers, for checking the TV app's updates.
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
    });
  });

  return app;
}
