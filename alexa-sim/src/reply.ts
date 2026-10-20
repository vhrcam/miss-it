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

// Turns a Rewind tool result into what a person would hear from Alexa. Some
// results are written for a model to read, like ask_about_show's lines when
// Rewind's own model is down, so those are shown but never read out.
export function replyFor(tool: ToolName, result: ToolResult): Reply {
  const full = (result.content ?? [])
    .map((part) => part.text ?? '')
    .join('\n')
    .trim();
  const [text = '', note] = full.split(NOTE);
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
    return data.title ? reply('No one has spoken in the last minute.') : reply(text);
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
