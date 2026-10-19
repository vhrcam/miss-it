import type { AnswerRequest, Narrator, RecapRequest } from "../src/ai/narrator.js";

export class FakeNarrator implements Narrator {
  recaps: RecapRequest[] = [];
  answers: AnswerRequest[] = [];
  failing = false;

  async recap(request: RecapRequest): Promise<string> {
    if (this.failing) throw new Error("model unavailable");
    this.recaps.push(request);
    return `Recap #${this.recaps.length}`;
  }

  async answer(request: AnswerRequest): Promise<string> {
    if (this.failing) throw new Error("model unavailable");
    this.answers.push(request);
    return `Answer to: ${request.question}`;
  }
}
