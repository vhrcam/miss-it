import { describe, expect, it } from "vitest";
import { formatTimestamp, toTranscript, type Cue } from "../src/index.js";

describe("formatTimestamp", () => {
  it("formats minutes and hours", () => {
    expect(formatTimestamp(0)).toBe("0:00");
    expect(formatTimestamp(312.9)).toBe("5:12");
    expect(formatTimestamp(3723)).toBe("1:02:03");
  });
});

describe("toTranscript", () => {
  const cues: Cue[] = [
    { startSec: 61, endSec: 63, text: "First line", speaker: "Thom" },
    { startSec: 70, endSec: 72, text: "Second\nline" },
    { startSec: 80, endSec: 82, text: "Third line" },
  ];

  it("writes one timestamped line per cue", () => {
    expect(toTranscript(cues)).toBe("[1:01] Thom: First line\n[1:10] Second line\n[1:20] Third line");
  });

  it("can leave out timestamps", () => {
    expect(toTranscript(cues, { timestamps: false })).toBe("Thom: First line\nSecond line\nThird line");
  });

  it("keeps the most recent lines within maxChars", () => {
    expect(toTranscript(cues, { maxChars: 40 })).toBe("[1:10] Second line\n[1:20] Third line");
  });

  it("always keeps the latest line", () => {
    expect(toTranscript(cues, { maxChars: 5 })).toBe("[1:20] Third line");
  });
});
