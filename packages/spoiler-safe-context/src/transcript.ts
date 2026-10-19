import type { Cue } from "./cue.js";

export interface TranscriptOptions {
  timestamps?: boolean;
  maxChars?: number;
}

export function formatTimestamp(totalSec: number): string {
  const whole = Math.max(0, Math.floor(totalSec));
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const seconds = String(whole % 60).padStart(2, "0");
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`
    : `${minutes}:${seconds}`;
}

// One line per cue, oldest first. With `maxChars`, the most recent lines win.
export function toTranscript(cues: readonly Cue[], options: TranscriptOptions = {}): string {
  const { timestamps = true, maxChars = Infinity } = options;
  const lines: string[] = [];
  let length = 0;

  for (let i = cues.length - 1; i >= 0; i--) {
    const cue = cues[i]!;
    const stamp = timestamps ? `[${formatTimestamp(cue.startSec)}] ` : "";
    const speaker = cue.speaker ? `${cue.speaker}: ` : "";
    const line = `${stamp}${speaker}${cue.text.replace(/\s*\n\s*/g, " ")}`;
    if (lines.length && length + line.length + 1 > maxChars) break;
    lines.push(line);
    length += line.length + 1;
  }
  return lines.reverse().join("\n");
}
