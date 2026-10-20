import { describe, expect, it } from "vitest";
import { CastGuide } from "../src/cast/guide.js";

const guide = await CastGuide.load(new URL("../data/cast.json", import.meta.url));
const onScreen = (sec: number) => guide.onScreen("tears-of-steel", sec).map((member) => member.character).sort();

describe("Tears of Steel cast guide", () => {
  it("finds Thom and Celia on the bridge", () => {
    expect(onScreen(30)).toEqual(["Celia", "Thom"]);
  });

  it("lists everyone on screen in a stretch of time", () => {
    expect(guide.seenBetween("tears-of-steel", 0, 45).map((member) => member.character).sort()).toEqual(["Celia", "Thom"]);
  });

  it("remembers who just left the screen while their voices carry over", () => {
    const lastSeen = (sec: number) => guide.lastSeen("tears-of-steel", sec).map((member) => member.character).sort();
    expect(onScreen(41)).toEqual([]);
    expect(lastSeen(41)).toEqual(["Celia", "Thom"]);
    expect(lastSeen(52)).not.toContain("Celia");
  });

  it("finds the Tech head when the memory overwrite completes", () => {
    expect(onScreen(540)).toContain("Tech head");
  });

  it("finds Barley in the scene after the credits", () => {
    expect(onScreen(720)).toEqual(["Barley"]);
  });

  it("only describes what has been shown so far", () => {
    expect(guide.describe("tears-of-steel", "Old Thom", 150)?.about).not.toContain("forty years");
    expect(guide.describe("tears-of-steel", "Old Thom", 230)?.about).toContain("forty years");
  });
});
