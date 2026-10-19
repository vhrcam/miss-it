import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { WatchLog, type WatchLogSnapshot } from "spoiler-safe-context";
import type { MemoryStore } from "./store.js";
import type { StoredRecap, Viewing } from "./viewing.js";

type Kind = "viewing" | "recap";

// Watch logs expire a day after the last update, so Rewind never keeps a
// household's viewing history around.
const TTL_SEC = 24 * 60 * 60;

// One table, one partition per household: a "viewing" item and a "recap" item.
// Keeping the recap separate means writing a recap can't overwrite captions
// that arrived while the model was busy.
export class DynamoStore implements MemoryStore {
  readonly #table: string;
  readonly #client: Pick<DynamoDBDocumentClient, "send">;

  constructor(table: string, client?: Pick<DynamoDBDocumentClient, "send">) {
    this.#table = table;
    this.#client =
      client ??
      DynamoDBDocumentClient.from(new DynamoDBClient({}), { marshallOptions: { removeUndefinedValues: true } });
  }

  async get(householdId: string): Promise<Viewing | undefined> {
    const item = await this.#read(householdId, "viewing");
    if (!item) return undefined;
    const { log, ...viewing } = item as Omit<Viewing, "log"> & { log: WatchLogSnapshot };
    return { ...viewing, log: WatchLog.fromJSON(log) };
  }

  async put(viewing: Viewing): Promise<void> {
    await this.#write(viewing.householdId, "viewing", { ...viewing, log: viewing.log.toJSON() });
  }

  async getRecap(householdId: string): Promise<StoredRecap | undefined> {
    return (await this.#read(householdId, "recap")) as StoredRecap | undefined;
  }

  async putRecap(householdId: string, recap: StoredRecap): Promise<void> {
    await this.#write(householdId, "recap", recap);
  }

  async #read(householdId: string, kind: Kind): Promise<Record<string, unknown> | undefined> {
    const { Item } = await this.#client.send(
      new GetCommand({ TableName: this.#table, Key: { pk: householdId, sk: kind }, ConsistentRead: true }),
    );
    if (!Item) return undefined;
    const { pk: _pk, sk: _sk, expiresAt: _expiresAt, ...data } = Item;
    return data;
  }

  async #write(householdId: string, kind: Kind, data: object): Promise<void> {
    await this.#client.send(
      new PutCommand({
        TableName: this.#table,
        Item: { ...data, pk: householdId, sk: kind, expiresAt: Math.floor(Date.now() / 1000) + TTL_SEC },
      }),
    );
  }
}
