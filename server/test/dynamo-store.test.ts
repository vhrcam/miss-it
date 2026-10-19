import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { WatchLog } from "spoiler-safe-context";
import { describe, expect, it } from "vitest";
import { DynamoStore } from "../src/memory/dynamo-store.js";
import type { Viewing } from "../src/memory/viewing.js";

// Stands in for DynamoDB: a map keyed by pk + sk.
class FakeTable {
  items = new Map<string, Record<string, unknown>>();

  async send(command: unknown): Promise<any> {
    if (command instanceof PutCommand) {
      const item = structuredClone(command.input.Item!);
      this.items.set(`${item.pk}/${item.sk}`, item);
      return {};
    }
    if (command instanceof GetCommand) {
      const { pk, sk } = command.input.Key!;
      const item = this.items.get(`${pk}/${sk}`);
      return { Item: item && structuredClone(item) };
    }
    throw new Error("unexpected command");
  }
}

function viewing(log: WatchLog): Viewing {
  return {
    householdId: "demo",
    contentId: "tears-of-steel",
    title: "Tears of Steel",
    durationSec: 734,
    state: "playing",
    positionSec: 42,
    receivedAt: 1000,
    log,
  };
}

describe("DynamoStore", () => {
  it("round-trips a viewing with its watch log", async () => {
    const table = new FakeTable();
    const store = new DynamoStore("rewind", table);
    const log = new WatchLog();
    log.add([{ startSec: 23, endSec: 24.5, text: "You're a jerk, Thom." }]);
    log.seek(42);

    await store.put(viewing(log));
    const restored = await store.get("demo");

    expect(restored?.title).toBe("Tears of Steel");
    expect(restored?.log.seen().map((cue) => cue.text)).toEqual(["You're a jerk, Thom."]);
    expect(restored?.log.positionSec).toBe(42);
  });

  it("keeps the recap in its own item with an expiry", async () => {
    const table = new FakeTable();
    const store = new DynamoStore("rewind", table);
    const recap = { contentId: "tears-of-steel", windowSec: 60, fromSec: 0, toSec: 42, text: "Celia dumps Thom.", generatedAt: 5 };

    await store.put(viewing(new WatchLog()));
    await store.putRecap("demo", recap);

    expect(await store.getRecap("demo")).toEqual(recap);
    expect([...table.items.keys()].sort()).toEqual(["demo/recap", "demo/viewing"]);
    expect(table.items.get("demo/recap")?.expiresAt).toBeGreaterThan(Date.now() / 1000);
  });

  it("returns nothing for an unknown household", async () => {
    const store = new DynamoStore("rewind", new FakeTable());
    expect(await store.get("nobody")).toBeUndefined();
    expect(await store.getRecap("nobody")).toBeUndefined();
  });
});
