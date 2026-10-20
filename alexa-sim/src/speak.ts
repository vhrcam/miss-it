const VOICES = ['Google US English', 'Samantha', 'Ava', 'Allison'];

function pickVoice() {
  const english = speechSynthesis
    .getVoices()
    .filter((voice) => voice.lang.startsWith('en'));
  return (
    english.find((voice) => VOICES.some((name) => voice.name.includes(name))) ??
    english.find((voice) => voice.default) ??
    english[0]
  );
}

// Reads an answer out loud with the browser's voice, then calls done once.
// It's queued a sentence at a time, since Chrome's voices can stop partway
// through a long text.
export function speak(text: string, done: () => void) {
  speechSynthesis.cancel();
  const sentences = (text.match(/[^.!?\n]+[.!?]*/g) ?? [])
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  if (!sentences.length) {
    done();
    return;
  }

  // If the browser never reports the end (no voices yet, or a stuck queue),
  // stop waiting after about as long as reading the text would take.
  const words = text.split(/\s+/).length;
  let finished = false;
  const finish = () => {
    if (!finished) {
      finished = true;
      clearTimeout(timer);
      done();
    }
  };
  const timer = setTimeout(finish, words * 450 + 2000);
  const voice = pickVoice();
  sentences.forEach((sentence, index) => {
    const utterance = new SpeechSynthesisUtterance(sentence);
    if (voice) {
      utterance.voice = voice;
    }
    utterance.onerror = finish;
    if (index === sentences.length - 1) {
      utterance.onend = finish;
    }
    speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking() {
  speechSynthesis.cancel();
}
