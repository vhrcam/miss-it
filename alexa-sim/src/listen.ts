// The parts of the Web Speech API's SpeechRecognition this page uses. Chrome
// still ships it as webkitSpeechRecognition.
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: {results: ArrayLike<ArrayLike<{transcript: string}>>}) => void) | null;
  onerror: ((event: {error: string}) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};

type RecognitionConstructor = new () => Recognition;

const speechWindow = window as unknown as {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
};
const SpeechRecognition =
  speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;

export const canListen = SpeechRecognition !== undefined;

type Handlers = {
  // The words heard so far, while the person is still talking.
  heard: (text: string) => void;
  // Called once when listening stops, with the words and any error, like
  // "not-allowed" when the mic is blocked.
  done: (text: string, error?: string) => void;
};

// Push to talk: listens until the person stops talking, then hands over what
// they said. Returns a function that stops listening early.
export function listen({heard, done}: Handlers): () => void {
  if (!SpeechRecognition) {
    done('', 'not-supported');
    return () => {};
  }
  const recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = true;
  recognition.continuous = false;

  let text = '';
  let error: string | undefined;
  recognition.onresult = (event) => {
    text = Array.from(event.results, (result) => result[0]?.transcript ?? '').join('');
    heard(text);
  };
  recognition.onerror = (event) => {
    error = event.error;
  };
  recognition.onend = () => done(text.trim(), error);
  recognition.start();
  return () => recognition.stop();
}
