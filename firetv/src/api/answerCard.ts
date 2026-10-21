import type {Answer} from './fetchAnswer';

export type Card = {
  id: string;
  label: string;
  text: string;
};

// Answers older than this were given before the viewer could see them.
const FRESH_MS = 30000;

// Labels an answer for the card on the TV, or returns null when it doesn't
// get one: no answer, one already shown, an old one, or "what's playing?",
// which the player's controls already answer.
export function cardFor(
  answer: Answer | null,
  shownId: string | null,
): Card | null {
  if (!answer || answer.id === shownId || answer.ageMs >= FRESH_MS) {
    return null;
  }
  const {id, text} = answer;
  switch (answer.tool) {
    case 'recap_recent':
      return {id, label: 'What you missed', text};
    case 'who_is_on_screen':
      return {id, label: 'Who’s that', text};
    case 'ask_about_show':
      return {
        id,
        label: answer.question ? `“${answer.question}”` : 'Your question',
        text,
      };
    default:
      return null;
  }
}
