import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import type { AnswerRequest, Narrator, RecapRequest } from "./narrator.js";
import { answerPrompt, recapPrompt, SYSTEM_PROMPT } from "./prompts.js";

export interface BedrockNarratorOptions {
  modelId: string;
  region: string;
  client?: BedrockRuntimeClient;
}

export class BedrockNarrator implements Narrator {
  readonly #client: BedrockRuntimeClient;
  readonly #modelId: string;

  constructor(options: BedrockNarratorOptions) {
    this.#client = options.client ?? new BedrockRuntimeClient({ region: options.region });
    this.#modelId = options.modelId;
  }

  recap(request: RecapRequest, signal?: AbortSignal): Promise<string> {
    return this.#converse(recapPrompt(request), 120, signal);
  }

  answer(request: AnswerRequest, signal?: AbortSignal): Promise<string> {
    return this.#converse(answerPrompt(request), 160, signal);
  }

  async #converse(prompt: string, maxTokens: number, signal?: AbortSignal): Promise<string> {
    const response = await this.#client.send(
      new ConverseCommand({
        modelId: this.#modelId,
        system: [{ text: SYSTEM_PROMPT }],
        messages: [{ role: "user", content: [{ text: prompt }] }],
        inferenceConfig: { maxTokens, temperature: 0.2 },
      }),
      { abortSignal: signal },
    );

    const text = response.output?.message?.content
      ?.map((block) => block.text ?? "")
      .join("")
      .trim();
    if (!text) throw new Error(`${this.#modelId} returned no text (stop reason: ${response.stopReason})`);
    return text;
  }
}
