import { describe, expect, it } from "vitest";
import { cleanCueText, parseCaptions, parseTimestamp } from "../src/index.js";

describe("parseTimestamp", () => {
  it("reads minutes and hours", () => {
    expect(parseTimestamp("02:03.500")).toBe(123.5);
    expect(parseTimestamp("01:02:03.250")).toBe(3723.25);
  });

  it("accepts the SRT comma", () => {
    expect(parseTimestamp("00:00:04,100")).toBe(4.1);
  });

  it("rejects garbage", () => {
    expect(() => parseTimestamp("soon")).toThrow("Invalid timestamp");
  });
});

describe("cleanCueText", () => {
  it("strips markup and decodes entities", () => {
    expect(cleanCueText("<i>Run</i> &amp; <b>hide</b>&nbsp;now").text).toBe("Run & hide now");
  });

  it("keeps the speaker from a voice tag", () => {
    expect(cleanCueText("<v Celia>You left.</v>")).toEqual({ text: "You left.", speaker: "Celia" });
  });

  it("drops SSA positioning", () => {
    expect(cleanCueText("{\\an8}Up here").text).toBe("Up here");
  });
});

describe("parseCaptions", () => {
  it("parses WebVTT and skips headers, notes and styles", () => {
    const vtt = [
      "﻿WEBVTT - Tears of Steel",
      "",
      "NOTE This is a comment",
      "",
      "STYLE",
      "::cue { color: yellow }",
      "",
      "intro",
      "00:00:01.000 --> 00:00:04.000 line:90%",
      "<v Thom>Celia, wait.",
      "",
      "00:05.500 --> 00:07.000",
      "Two",
      "lines",
    ].join("\r\n");

    expect(parseCaptions(vtt)).toEqual([
      { startSec: 1, endSec: 4, text: "Celia, wait.", speaker: "Thom" },
      { startSec: 5.5, endSec: 7, text: "Two\nlines" },
    ]);
  });

  it("parses SRT", () => {
    const srt = "1\n00:00:01,000 --> 00:00:02,500\nHello.\n\n2\n00:00:03,000 --> 00:00:04,000\n<i>Bye.</i>\n";
    expect(parseCaptions(srt)).toEqual([
      { startSec: 1, endSec: 2.5, text: "Hello." },
      { startSec: 3, endSec: 4, text: "Bye." },
    ]);
  });

  it("sorts cues and drops empty ones", () => {
    const vtt = "WEBVTT\n\n00:10.000 --> 00:11.000\nLater\n\n00:02.000 --> 00:03.000\n<i></i>\n\n00:01.000 --> 00:02.000\nFirst";
    expect(parseCaptions(vtt).map((cue) => cue.text)).toEqual(["First", "Later"]);
  });
});
