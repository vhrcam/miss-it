import type { Cue } from "./cue.js";

const TIMING = /^\s*((?:\d+:)?\d{1,2}:\d{2}[.,]\d{1,3})\s+-->\s+((?:\d+:)?\d{1,2}:\d{2}[.,]\d{1,3})/;

const ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
  "&lrm;": "",
  "&rlm;": "",
};

export function parseTimestamp(value: string): number {
  let seconds = 0;
  for (const part of value.trim().replace(",", ".").split(":")) {
    seconds = seconds * 60 + Number(part);
  }
  if (!Number.isFinite(seconds)) {
    throw new Error(`Invalid timestamp: ${value}`);
  }
  return Math.round(seconds * 1000) / 1000;
}

export function cleanCueText(raw: string): { text: string; speaker?: string } {
  const speaker = raw.match(/<v(?:\.[^\s>]+)?\s+([^>]+)>/)?.[1]?.trim();
  const text = raw
    // WebVTT and SRT markup: <i>, <b>, <c.yellow>, <v Name>, <00:01.000>
    .replace(/<[^>]*>/g, "")
    // SSA-style positioning that some SRT files carry, like {\an8}
    .replace(/\{\\[^}]*\}/g, "")
    .replace(/&(?:amp|lt|gt|quot|#39|nbsp|lrm|rlm);/g, (entity) => ENTITIES[entity] ?? entity)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .join("\n");
  return speaker ? { text, speaker } : { text };
}

// Reads WebVTT and SRT. Both are blocks separated by blank lines with a
// "start --> end" timing line, so one pass handles either format.
export function parseCaptions(source: string): Cue[] {
  const blocks = source
    .replace(/^﻿/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/^[ \t]+$/gm, "")
    .split(/\n{2,}/);

  const cues: Cue[] = [];
  for (const block of blocks) {
    const lines = block.split("\n");
    const timingIndex = lines.findIndex((line) => line.includes("-->"));
    const timing = timingIndex === -1 ? null : TIMING.exec(lines[timingIndex]!);
    if (!timing) continue;

    const { text, speaker } = cleanCueText(lines.slice(timingIndex + 1).join("\n"));
    if (!text) continue;

    cues.push({
      startSec: parseTimestamp(timing[1]!),
      endSec: parseTimestamp(timing[2]!),
      text,
      ...(speaker ? { speaker } : {}),
    });
  }
  return cues.sort((a, b) => a.startSec - b.startSec);
}
