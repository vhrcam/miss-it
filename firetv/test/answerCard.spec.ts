import {cardFor} from '../src/api/answerCard';
import type {Answer} from '../src/api/fetchAnswer';

const answer = (overrides: Partial<Answer> = {}): Answer => ({
  id: 'a1',
  tool: 'recap_recent',
  text: 'Celia and Thom are fighting on the bridge.',
  ageMs: 1200,
  ...overrides,
});

describe('cardFor', () => {
  it('labels each kind of answer', () => {
    expect(cardFor(answer(), null)?.label).toBe('What you missed');
    expect(cardFor(answer({tool: 'who_is_on_screen'}), null)?.label).toBe(
      'Who’s that',
    );
    expect(
      cardFor(
        answer({tool: 'ask_about_show', question: 'Why is she mad at him?'}),
        null,
      )?.label,
    ).toBe('“Why is she mad at him?”');
  });

  it('keeps the answer text and id', () => {
    expect(cardFor(answer(), null)).toEqual({
      id: 'a1',
      label: 'What you missed',
      text: 'Celia and Thom are fighting on the bridge.',
    });
  });

  it('shows each answer only once', () => {
    expect(cardFor(answer(), 'a1')).toBeNull();
    expect(cardFor(answer({id: 'a2'}), 'a1')).not.toBeNull();
  });

  it('skips answers older than 30 seconds', () => {
    expect(cardFor(answer({ageMs: 29999}), null)).not.toBeNull();
    expect(cardFor(answer({ageMs: 30000}), null)).toBeNull();
  });

  it('skips what’s playing and empty replies', () => {
    expect(cardFor(answer({tool: 'whats_playing'}), null)).toBeNull();
    expect(cardFor(null, null)).toBeNull();
  });
});
