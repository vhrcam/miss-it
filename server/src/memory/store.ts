import type { Viewing } from "./viewing.js";

export interface MemoryStore {
  get(householdId: string): Promise<Viewing | undefined>;
  put(viewing: Viewing): Promise<void>;
}

export class InMemoryStore implements MemoryStore {
  #viewings = new Map<string, Viewing>();

  async get(householdId: string): Promise<Viewing | undefined> {
    return this.#viewings.get(householdId);
  }

  async put(viewing: Viewing): Promise<void> {
    this.#viewings.set(viewing.householdId, viewing);
  }
}
