import {useEffect, useRef, useState} from 'react';
import {api} from '../config';
import {Card, cardFor} from './answerCard';
import {fetchAnswer} from './fetchAnswer';

const POLL_MS = 2000;
const SHOW_MS = 10000;

// Checks with the server every 2 seconds while the player is open, and shows
// each new answer Alexa gives for about 10 seconds.
export function useAnswerCard() {
  const [card, setCard] = useState<Card | null>(null);
  const shownIdRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    let busy = false;
    let hideTimer = 0;

    const poll = async () => {
      if (busy) {
        return;
      }
      busy = true;
      try {
        const next = cardFor(await fetchAnswer(api), shownIdRef.current);
        if (active && next) {
          shownIdRef.current = next.id;
          setCard(next);
          clearTimeout(hideTimer);
          hideTimer = setTimeout(() => setCard(null), SHOW_MS);
        }
      } catch {
        // The badge already says when the server can't be reached.
      } finally {
        busy = false;
      }
    };

    poll();
    const timer = setInterval(poll, POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
      clearTimeout(hideTimer);
    };
  }, []);

  return card;
}
