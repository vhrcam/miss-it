import {CueTracker} from '../src/playback/CueTracker';

const cues = [
  {startSec: 1, endSec: 3, text: 'one'},
  {startSec: 4, endSec: 6, text: 'two'},
  {startSec: 20, endSec: 24, text: 'three'},
  {startSec: 30, endSec: 31, text: 'four'},
];

const texts = (tracker: CueTracker) => tracker.take().map((cue) => cue.text);

describe('CueTracker', () => {
  it('collects cues as playback moves through them', () => {
    const tracker = new CueTracker(cues);
    tracker.seek(0);
    tracker.advance(0.5);
    expect(texts(tracker)).toEqual([]);
    tracker.advance(1);
    tracker.advance(4.5);
    expect(texts(tracker)).toEqual(['one', 'two']);
    expect(texts(tracker)).toEqual([]);
  });

  it('never collects cues skipped by a forward seek', () => {
    const tracker = new CueTracker(cues);
    tracker.seek(0);
    tracker.advance(2);
    tracker.seek(25);
    tracker.advance(25.5);
    expect(texts(tracker)).toEqual(['one']);
  });

  it('collects the cue already on screen where a seek lands', () => {
    const tracker = new CueTracker(cues);
    tracker.seek(21);
    expect(texts(tracker)).toEqual(['three']);
  });

  it('treats a big jump in position as a seek', () => {
    const tracker = new CueTracker(cues);
    tracker.seek(0);
    tracker.advance(0.5);
    tracker.advance(29);
    tracker.advance(30.5);
    expect(texts(tracker)).toEqual(['four']);
  });

  it('collects replayed cues again after a backward seek', () => {
    const tracker = new CueTracker(cues);
    tracker.seek(0);
    tracker.advance(4.5);
    tracker.take();
    tracker.advance(0.5);
    tracker.advance(1.5);
    expect(texts(tracker)).toEqual(['one']);
  });
});
