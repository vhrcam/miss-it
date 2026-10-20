import {useEffect, useState} from 'react';
import type {LinkStatus} from '../playback/PlaybackReporter';
import {rewind} from '../config';
import {fetchAnswer} from './fetchAnswer';

const CHECK_MS = 10000;

// Checks that Rewind is up and accepts this TV's key, for the badge on Home.
// Asking for the last answer is the lightest call that needs the key.
export function useRewindStatus() {
  const [status, setStatus] = useState<LinkStatus>('connecting');

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        await fetchAnswer(rewind);
        if (active) {
          setStatus('connected');
        }
      } catch {
        if (active) {
          setStatus('offline');
        }
      }
    };
    check();
    const timer = setInterval(check, CHECK_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  return status;
}
