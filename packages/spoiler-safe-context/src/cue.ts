// A caption, or with kind "description", a note on what's visible on screen
// (like a WebVTT descriptions track).
export interface Cue {
  startSec: number;
  endSec: number;
  text: string;
  speaker?: string;
  kind?: "description";
}
