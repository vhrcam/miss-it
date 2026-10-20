import type { Config } from "../config.js";
import { BedrockNarrator } from "./bedrock.js";
import { CooldownNarrator } from "./cooldown.js";
import { NovaApiNarrator } from "./nova-api.js";

export interface RecapRequest {
  title: string;
  fromSec: number;
  toSec: number;
  recent: string;
  earlier: string;
}

export interface AnswerRequest {
  title: string;
  upToSec: number;
  transcript: string;
  question: string;
}

// Turns transcripts into something Alexa can say. Rewind ships Amazon Bedrock,
// plus Amazon's direct Nova API when NOVA_API_KEY is set; tests use a fake.
export interface Narrator {
  recap(request: RecapRequest, signal?: AbortSignal): Promise<string>;
  answer(request: AnswerRequest, signal?: AbortSignal): Promise<string>;
}

export function createNarrator(config: Config): Narrator | undefined {
  if (!config.ai.enabled) return undefined;
  return new CooldownNarrator(config.novaApi ? new NovaApiNarrator(config.novaApi) : new BedrockNarrator(config.ai));
}
