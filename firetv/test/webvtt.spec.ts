import {parseTimestamp, parseWebVTT} from '../src/captions/webvtt';
import tearsOfSteel from '../src/captions/tearsOfSteel';

describe('parseTimestamp', () => {
  it('reads minutes and hours forms', () => {
    expect(parseTimestamp('00:23.000')).toBe(23);
    expect(parseTimestamp('01:02:03.500')).toBe(3723.5);
  });
});

describe('parseWebVTT', () => {
  it('parses cues with ids, tags, entities and CRLF line endings', () => {
    const vtt = [
      'WEBVTT',
      '',
      'NOTE a comment --- not a cue',
      '',
      'intro',
      '00:00:01.000 --> 00:00:02.500 align:center',
      '<i>Hello</i> &amp; welcome',
      '',
      '00:03.000 --> 00:04.000',
      'Two',
      'lines',
    ].join('\r\n');

    expect(parseWebVTT(vtt)).toEqual([
      {startSec: 1, endSec: 2.5, text: 'Hello & welcome'},
      {startSec: 3, endSec: 4, text: 'Two\nlines'},
    ]);
  });

  it('sorts cues and skips empty ones', () => {
    const vtt =
      'WEBVTT\n\n00:05.000 --> 00:06.000\nLater\n\n00:01.000 --> 00:02.000\n<b></b>\n\n00:02.000 --> 00:03.000\nSooner';
    expect(parseWebVTT(vtt).map((cue) => cue.text)).toEqual([
      'Sooner',
      'Later',
    ]);
  });

  it('reads the bundled Tears of Steel captions', () => {
    const cues = parseWebVTT(tearsOfSteel);
    expect(cues).toHaveLength(76);
    expect(cues[0]).toEqual({
      startSec: 23,
      endSec: 24.5,
      text: "You're a jerk, Thom.",
    });
  });
});
