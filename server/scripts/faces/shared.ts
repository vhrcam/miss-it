import type { BoundingBox } from "@aws-sdk/client-rekognition";

export interface IndexedFace {
  faceId: string;
  sec: number;
  box: BoundingBox;
  confidence: number;
}

export const collectionFor = (contentId: string) => `miss-it-${contentId}`;

// Face IDs only mean something to one Rekognition collection, so the index
// stays out of git.
export const facesFile = (contentId: string) => new URL(`../../.cache/faces/${contentId}.json`, import.meta.url);
