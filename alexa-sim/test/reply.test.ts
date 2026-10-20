import {describe, expect, it} from 'vitest';
import {replyFor} from '../src/reply';

const result = (text: string, structuredContent: Record<string, unknown>) => ({
  content: [{type: 'text', text}],
  structuredContent,
});

const STALE =
  '\n\nNote: the TV hasn’t checked in for a few minutes, so this may be out of date.';

describe('replyFor recap_recent', () => {
  it('says the recap when the model wrote one', () => {
    const recap = 'Celia and Thom are fighting on the bridge.';
    const reply = replyFor(
      'recap_recent',
      result(recap, {playing: true, title: 'Tears of Steel', recap, lines: []}),
    );
    expect(reply).toMatchObject({speech: recap, headline: recap, lines: []});
  });

  it('reads the last minute of dialogue without timestamps otherwise', () => {
    const reply = replyFor(
      'recap_recent',
      result('Everything from 0:00 to 0:31 in Tears of Steel.', {
        playing: true,
        title: 'Tears of Steel',
        lines: ['[0:23] You’re a jerk, Thom.', '[0:25] Look Celia, we have to follow our passions;'],
      }),
    );
    expect(reply.headline).toBe('Here’s what was said in the last minute:');
    expect(reply.lines).toEqual([
      'You’re a jerk, Thom.',
      'Look Celia, we have to follow our passions;',
    ]);
    expect(reply.speech).toBe(
      'Here’s what was said in the last minute: You’re a jerk, Thom. Look Celia, we have to follow our passions;',
    );
  });

  it('says so when no one has spoken', () => {
    const reply = replyFor(
      'recap_recent',
      result('No one spoke in Tears of Steel from 0:00 to 0:20.', {
        playing: true,
        title: 'Tears of Steel',
        lines: [],
      }),
    );
    expect(reply.speech).toBe('No one spoke in the last minute.');
  });

  it('says who was on screen when no one spoke', () => {
    const silent = (onScreen: string[]) =>
      replyFor(
        'recap_recent',
        result('No one spoke in Tears of Steel from 7:11 to 8:11.', {
          playing: true,
          title: 'Tears of Steel',
          lines: [],
          onScreen,
        }),
      ).speech;
    expect(silent(['Barley'])).toBe('No one spoke in the last minute. On screen: Barley.');
    expect(silent(['Celia', 'Thom'])).toBe(
      'No one spoke in the last minute. On screen: Celia and Thom.',
    );
    expect(silent(['Barley', 'Celia', 'Thom'])).toBe(
      'No one spoke in the last minute. On screen: Barley, Celia and Thom.',
    );
  });

  it('passes on that nothing is playing', () => {
    const text = 'Nothing is playing on the TV right now. There’s nothing to recap.';
    expect(replyFor('recap_recent', result(text, {playing: false})).speech).toBe(text);
  });
});

describe('replyFor ask_about_show', () => {
  it('says the model’s answer', () => {
    const answer = 'Thom is leaving to chase his dream of going to space.';
    const reply = replyFor(
      'ask_about_show',
      result(answer, {title: 'Tears of Steel', upTo: '0:40', answer, context: '[0:23] You’re a jerk, Thom.'}),
    );
    expect(reply.speech).toBe(answer);
    expect(reply.lines).toEqual([]);
  });

  it('never reads out the lines meant for a model', () => {
    const reply = replyFor(
      'ask_about_show',
      result(
        'To answer "Why is she mad at him?", use only these lines from Tears of Steel. They are everything shown up to 0:40; don’t guess what happens next.\n[0:23] You’re a jerk, Thom.',
        {title: 'Tears of Steel', upTo: '0:40', context: '[0:23] You’re a jerk, Thom.\n[0:30] Why don’t you just admit it?'},
      ),
    );
    expect(reply.speech).toBe(
      'I can’t answer that one right now, because Rewind’s model is unavailable.',
    );
    expect(reply.speech).not.toContain('use only these lines');
    expect(reply.lines).toEqual(['You’re a jerk, Thom.', 'Why don’t you just admit it?']);
  });

  it('passes on plain answers when there is nothing to go on', () => {
    const text = 'Nothing has been said in Tears of Steel yet, so there’s nothing to go on.';
    const reply = replyFor('ask_about_show', result(text, {title: 'Tears of Steel', upTo: '0:10', context: ''}));
    expect(reply.speech).toBe(text);
  });
});

describe('replyFor who_is_on_screen and whats_playing', () => {
  it('says the text and moves the stale-TV note to small print', () => {
    const reply = replyFor(
      'whats_playing',
      result('Tears of Steel is paused at 0:31.' + STALE, {playing: false, title: 'Tears of Steel'}),
    );
    expect(reply.speech).toBe('Tears of Steel is paused at 0:31.');
    expect(reply.note).toBe(
      'The TV hasn’t checked in for a few minutes, so this may be out of date.',
    );
  });

  it('keeps both lines of a "just before this" answer', () => {
    const text =
      'No one is on screen right now. Just before this:\nCelia, played by Denise Rebergen. Thom’s girlfriend, who has a robot hand.';
    const reply = replyFor('who_is_on_screen', result(text, {people: [], recent: []}));
    expect(reply.speech).toBe(text);
  });

  it('apologizes for a tool error', () => {
    const reply = replyFor('who_is_on_screen', {
      content: [{type: 'text', text: 'Internal error'}],
      isError: true,
    });
    expect(reply.speech).toBe('Sorry, Rewind couldn’t answer that.');
    expect(reply.note).toBe('Internal error');
  });
});
