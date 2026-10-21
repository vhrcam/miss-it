import type { AnswerRequest, Narrator, RecapRequest } from "./narrator.js";

// After the model fails, Miss It? answers from the transcript for a minute
// instead of asking again on every question. A blocked or throttled model can
// take a few hundred milliseconds to say no, and Alexa+ wants answers fast.
export class CooldownNarrator implements Narrator {
  readonly model: Narrator;
  readonly #cooldownMs: number;
  readonly #now: () => number;
  #pausedUntil = 0;

  constructor(model: Narrator, options: { cooldownMs?: number; now?: () => number } = {}) {
    this.model = model;
    this.#cooldownMs = options.cooldownMs ?? 60_000;
    this.#now = options.now ?? Date.now;
  }

  recap(request: RecapRequest, signal?: AbortSignal): Promise<string> {
    return this.#call(() => this.model.recap(request, signal));
  }

  answer(request: AnswerRequest, signal?: AbortSignal): Promise<string> {
    return this.#call(() => this.model.answer(request, signal));
  }

  async #call(ask: () => Promise<string>): Promise<string> {
    if (this.#now() < this.#pausedUntil) throw new Error("the model failed recently, so it's paused");
    try {
      return await ask();
    } catch (error) {
      this.#pausedUntil = this.#now() + this.#cooldownMs;
      throw error;
    }
  }
}
