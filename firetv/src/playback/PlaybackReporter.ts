import type {Cue} from '../captions/webvtt';

export type PlaybackState = 'playing' | 'paused' | 'ended';
export type PlaybackEvent = 'tick' | 'play' | 'pause' | 'seek' | 'ended';
export type LinkStatus = 'connecting' | 'connected' | 'offline';

export type Snapshot = {
  positionSec: number;
  durationSec: number;
  state: PlaybackState;
};

type Options = {
  apiUrl: string;
  deviceKey: string;
  householdId: string;
  contentId: string;
  title: string;
  snapshot: () => Snapshot;
  takeCues: () => Cue[];
  onStatus: (status: LinkStatus) => void;
};

const REQUEST_TIMEOUT_MS = 4000;
const MAX_UNSENT_CUES = 200;

const round = (sec: number) => Math.round(sec * 10) / 10;

// Sends playback updates one at a time and in order, so Rewind never gets an
// older update after a newer one. Cues from a failed send go out with the next.
export class PlaybackReporter {
  private queue: PlaybackEvent[] = [];
  private unsent: Cue[] = [];
  private sending = false;
  private status: LinkStatus = 'connecting';

  constructor(private readonly options: Options) {}

  report(event: PlaybackEvent) {
    if (event === 'tick' && this.queue.includes('tick')) {
      return;
    }
    this.queue.push(event);
    this.flush();
  }

  private async flush() {
    if (this.sending) {
      return;
    }
    this.sending = true;
    for (let event = this.queue.shift(); event; event = this.queue.shift()) {
      await this.send(event);
    }
    this.sending = false;
  }

  private async send(event: PlaybackEvent) {
    const {apiUrl, deviceKey, householdId, contentId, title} = this.options;
    const {positionSec, durationSec, state} = this.options.snapshot();
    const cues = [...this.unsent, ...this.options.takeCues()];
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`${apiUrl}/v1/playback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${deviceKey}`,
        },
        body: JSON.stringify({
          householdId,
          contentId,
          title,
          durationSec: durationSec > 0 ? round(durationSec) : undefined,
          positionSec: round(positionSec),
          state,
          event,
          sentAt: Date.now(),
          cues,
        }),
        signal: controller.signal,
      });
      // A 4xx won't get better on retry, so only server errors keep the cues.
      this.unsent = response.status >= 500 ? cues.slice(-MAX_UNSENT_CUES) : [];
      this.setStatus(response.ok ? 'connected' : 'offline');
    } catch {
      this.unsent = cues.slice(-MAX_UNSENT_CUES);
      this.setStatus('offline');
    } finally {
      clearTimeout(timeout);
    }
  }

  private setStatus(status: LinkStatus) {
    if (status !== this.status) {
      this.status = status;
      this.options.onStatus(status);
    }
  }
}
