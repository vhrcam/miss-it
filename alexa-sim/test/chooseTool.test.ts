import {describe, expect, it} from 'vitest';
import {chooseTool, stripWakeWord} from '../src/chooseTool';

const toolFor = (question: string) => chooseTool(question).name;

describe('chooseTool', () => {
  it('recaps for "what did I miss?" and friends', () => {
    expect(toolFor('What did I miss?')).toBe('recap_recent');
    expect(toolFor('Did I miss anything')).toBe('recap_recent');
    expect(toolFor('Catch me up')).toBe('recap_recent');
    expect(toolFor('What happened?')).toBe('recap_recent');
  });

  it('asks who is on screen for "who" questions', () => {
    expect(toolFor('Who’s that?')).toBe('who_is_on_screen');
    expect(toolFor('who plays him')).toBe('who_is_on_screen');
  });

  it('asks what is playing for questions about the show itself', () => {
    expect(toolFor('What are we watching?')).toBe('whats_playing');
    expect(toolFor('How much is left?')).toBe('whats_playing');
    expect(toolFor('How far in are we?')).toBe('whats_playing');
  });

  it('sends everything else to ask_about_show with the question', () => {
    expect(chooseTool('Why is she mad at him?')).toEqual({
      name: 'ask_about_show',
      arguments: {question: 'Why is she mad at him?'},
    });
    expect(toolFor('What’s the mission?')).toBe('ask_about_show');
  });
});

describe('stripWakeWord', () => {
  it('drops a leading "Alexa"', () => {
    expect(stripWakeWord('Alexa, what did I miss?')).toBe('what did I miss?');
    expect(stripWakeWord('alexa who plays him')).toBe('who plays him');
  });

  it('leaves other words alone', () => {
    expect(stripWakeWord('Alexandra is here')).toBe('Alexandra is here');
    expect(stripWakeWord('Why is she mad at him?')).toBe(
      'Why is she mad at him?',
    );
  });
});
