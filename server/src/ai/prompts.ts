import { formatTimestamp } from "spoiler-safe-context";
import type { AnswerRequest, RecapRequest } from "./narrator.js";

export const SYSTEM_PROMPT = `You are Miss It?, a TV companion that Alexa uses to catch people up on what they're watching.

You only know the transcript you're given: the captions the viewer's TV has shown so far, in order, plus notes marked (on screen) that describe what was visible. Treat it as everything that exists.
- Never mention, hint at or guess what happens next, even if you recognize the show.
- Captions don't say who is talking. Only name a speaker when the lines make it clear.
- If the transcript doesn't cover something, say so in a few words instead of guessing.
- Talk like a friend on the couch: plain words, no lists, no timestamps, no long quotes.
- Your reply is read aloud, so keep it short.`;

export function recapPrompt(request: RecapRequest): string {
  return [
    `Show: ${request.title}`,
    request.earlier && `Earlier, for names and who's who only. Don't recap this part:\n${request.earlier}`,
    `What they missed, from ${formatTimestamp(request.fromSec)} to ${formatTimestamp(request.toSec)}:\n${request.recent}`,
    "In at most two short sentences, tell them what they missed.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

export function answerPrompt(request: AnswerRequest): string {
  return [
    `Show: ${request.title}`,
    `Everything shown so far, up to ${formatTimestamp(request.upToSec)}:\n${request.transcript}`,
    `Their question: ${request.question}`,
    "Answer in one or two short sentences, using only what has been shown.",
  ].join("\n\n");
}
