import type { AnswerRequest, Narrator, RecapRequest } from "./narrator.js";
import { answerPrompt, recapPrompt, SYSTEM_PROMPT } from "./prompts.js";

export interface NovaApiNarratorOptions {
  apiKey: string;
  modelId: string;
  baseUrl?: string;
  fetch?: typeof fetch;
}

interface ChatCompletion {
  choices?: { message?: { content?: string | null }; finish_reason?: string }[];
}

// Amazon's direct Nova API (api.nova.amazon.com) runs the same Nova 2 Lite as
// Bedrock with a plain API key, for accounts whose Bedrock quotas are still 0.
export class NovaApiNarrator implements Narrator {
  readonly #apiKey: string;
  readonly #modelId: string;
  readonly #baseUrl: string;
  readonly #fetch: typeof fetch;

  constructor(options: NovaApiNarratorOptions) {
    this.#apiKey = options.apiKey;
    this.#modelId = options.modelId;
    this.#baseUrl = options.baseUrl ?? "https://api.nova.amazon.com/v1";
    this.#fetch = options.fetch ?? fetch;
  }

  recap(request: RecapRequest, signal?: AbortSignal): Promise<string> {
    return this.#complete(recapPrompt(request), 120, signal);
  }

  answer(request: AnswerRequest, signal?: AbortSignal): Promise<string> {
    return this.#complete(answerPrompt(request), 160, signal);
  }

  async #complete(prompt: string, maxTokens: number, signal?: AbortSignal): Promise<string> {
    const response = await this.#fetch(`${this.#baseUrl}/chat/completions`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.#apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: this.#modelId,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: [{ type: "text", text: prompt }] },
        ],
        max_completion_tokens: maxTokens,
        temperature: 0.2,
      }),
      signal,
    });
    if (!response.ok) throw new Error(`Nova API returned ${response.status}: ${await response.text()}`);

    const choice = ((await response.json()) as ChatCompletion).choices?.[0];
    const text = choice?.message?.content?.trim();
    if (!text) throw new Error(`${this.#modelId} returned no text (finish reason: ${choice?.finish_reason})`);
    return text;
  }
}
