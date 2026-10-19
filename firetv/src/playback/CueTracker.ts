import type {Cue} from '../captions/webvtt';

// Playback is polled every half second, so a bigger jump than this is a seek.
const MAX_STEP_SEC = 5;

// Collects the caption cues that were actually on screen since the last
// report. Cues skipped over by a seek are never collected.
export class CueTracker {
  private pending: Cue[] = [];
  private positionSec: number | null = null;

  constructor(private readonly cues: Cue[]) {}

  advance(positionSec: number) {
    const from = this.positionSec;
    if (
      from === null ||
      positionSec < from ||
      positionSec - from > MAX_STEP_SEC
    ) {
      this.seek(positionSec);
      return;
    }
    for (const cue of this.cues) {
      if (cue.startSec > from && cue.startSec <= positionSec) {
        this.add(cue);
      }
    }
    this.positionSec = positionSec;
  }

  seek(positionSec: number) {
    this.positionSec = positionSec;
    const onScreen = this.cues.find(
      (cue) => cue.startSec <= positionSec && cue.endSec > positionSec,
    );
    if (onScreen) {
      this.add(onScreen);
    }
  }

  take(): Cue[] {
    const taken = this.pending;
    this.pending = [];
    return taken;
  }

  private add(cue: Cue) {
    if (!this.pending.includes(cue)) {
      this.pending.push(cue);
    }
  }
}
