import type {ToolName} from './chooseTool';

export type ToolResult = {
  content?: {type: string; text?: string}[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
};

export type Reply = {
  // What Alexa says out loud.
  speech: string;
  // The big text on the page.
  headline: string;
  // Lines of dialogue shown under the headline.
  lines: string[];
  // Small print, like the server's note that the TV hasn't checked in.
  note?: string;
};

const NOTE = '\n\nNote: ';
const STAMP = /^\[\d+(?::\d{2}){1,2}\]\s*/;
const CONTEXT_LINES = 8;

const strings = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];

// "Celia and Thom", or "Barley, Celia and Thom", the way the server says it.
const listNames = (names: string[]) =>
  names.length < 3
    ? names.join(' and ')
    : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;

// Turns a Rewind tool result into what a person would hear from Alexa. Some
// results are written for a model to read, like ask_about_show's lines when
// Rewind's own model is down, so those are shown but never read out.
export function replyFor(tool: ToolName, result: ToolResult): Reply {
  const full = (result.content ?? [])
    .map((part) => part.text ?? '')
    .join('\n')
    .trim();
  const [text = '', rawNote] = full.split(NOTE);
  const note = rawNote && rawNote[0]?.toUpperCase() + rawNote.slice(1);
  const data = result.structuredContent ?? {};
  const reply = (headline: string, lines: string[] = [], readLines = false) => ({
    speech: readLines ? [headline, ...lines].join(' ') : headline,
    headline,
    lines,
    note,
  });

  if (result.isError) {
    return {...reply('Sorry, Rewind couldn’t answer that.'), note: text};
  }

  if (tool === 'recap_recent') {
    if (typeof data.recap === 'string') {
      return reply(data.recap);
    }
    const lines = strings(data.lines).map((line) => line.replace(STAMP, ''));
    if (lines.length) {
      return reply('Here’s what was said in the last minute:', lines, true);
    }
    if (!data.title) {
      return reply(text);
    }
    const onScreen = strings(data.onScreen);
    return reply(
      onScreen.length
        ? `No one spoke in the last minute. On screen: ${listNames(onScreen)}.`
        : 'No one spoke in the last minute.',
    );
  }

  if (tool === 'ask_about_show') {
    if (typeof data.answer === 'string') {
      return reply(data.answer);
    }
    const context = typeof data.context === 'string' ? data.context : '';
    const lines = context
      .split('\n')
      .filter(Boolean)
      .map((line) => line.replace(STAMP, ''))
      .slice(-CONTEXT_LINES);
    if (lines.length) {
      return reply(
        'I can’t answer that one right now, because Rewind’s model is unavailable.',
        lines,
      );
    }
  }

  return reply(text);
}
