import type { StoredAnswer, StoredRecap, Viewing } from "./viewing.js";

export interface MemoryStore {
  get(householdId: string): Promise<Viewing | undefined>;
  put(viewing: Viewing): Promise<void>;
  getRecap(householdId: string): Promise<StoredRecap | undefined>;
  putRecap(householdId: string, recap: StoredRecap): Promise<void>;
  getAnswer(householdId: string): Promise<StoredAnswer | undefined>;
  putAnswer(householdId: string, answer: StoredAnswer): Promise<void>;
}

export class InMemoryStore implements MemoryStore {
  #viewings = new Map<string, Viewing>();
  #recaps = new Map<string, StoredRecap>();
  #answers = new Map<string, StoredAnswer>();

  async get(householdId: string): Promise<Viewing | undefined> {
    return this.#viewings.get(householdId);
  }

  async put(viewing: Viewing): Promise<void> {
    this.#viewings.set(viewing.householdId, viewing);
  }

  async getRecap(householdId: string): Promise<StoredRecap | undefined> {
    return this.#recaps.get(householdId);
  }

  async putRecap(householdId: string, recap: StoredRecap): Promise<void> {
    this.#recaps.set(householdId, recap);
  }

  async getAnswer(householdId: string): Promise<StoredAnswer | undefined> {
    return this.#answers.get(householdId);
  }

  async putAnswer(householdId: string, answer: StoredAnswer): Promise<void> {
    this.#answers.set(householdId, answer);
  }
}
