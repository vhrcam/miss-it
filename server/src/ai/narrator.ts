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

// Turns transcripts into something Alexa can say. The only implementation
// that ships is Amazon Bedrock; tests use a fake.
export interface Narrator {
  recap(request: RecapRequest, signal?: AbortSignal): Promise<string>;
  answer(request: AnswerRequest, signal?: AbortSignal): Promise<string>;
}
