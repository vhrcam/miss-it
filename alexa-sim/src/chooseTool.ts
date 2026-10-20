export type ToolName =
  | 'recap_recent'
  | 'who_is_on_screen'
  | 'whats_playing'
  | 'ask_about_show';

export type ToolCall = {
  name: ToolName;
  arguments: Record<string, string>;
};

const RULES: [RegExp, ToolName][] = [
  [/\bmiss(ed)?\b|catch me up|what happened/, 'recap_recent'],
  [/\bwho\b/, 'who_is_on_screen'],
  [/what are we watching|how much is left|how far/, 'whats_playing'],
];

// "Who dies?" is about the story, not the screen. ask_about_show answers it,
// and it won't spoil anything that hasn't been shown.
const ABOUT_THE_STORY = /\bwho\b.*\b(wins?|dies|die|survives?|will|going to|gonna)\b/;

// Real Alexa+ picks a tool on its own, from the description the Rewind server
// gives each one. This page has no model to do that, so keyword rules stand
// in. Anything they don't catch goes to ask_about_show as a question.
export function chooseTool(question: string): ToolCall {
  const text = question.toLowerCase();
  if (!ABOUT_THE_STORY.test(text)) {
    for (const [pattern, name] of RULES) {
      if (pattern.test(text)) {
        return {name, arguments: {}};
      }
    }
  }
  return {name: 'ask_about_show', arguments: {question}};
}

// "Alexa, what did I miss?" asks the same thing as "what did I miss?".
export function stripWakeWord(said: string): string {
  return said.replace(/^\s*alexa\b[\s,.!?:;-]*/i, '').trim();
}
