import {chooseTool, stripWakeWord} from './chooseTool';
import {replyFor, type Reply} from './reply';
import {createRewind} from './rewind';
import {speak, stopSpeaking} from './speak';

type State = 'ready' | 'listening' | 'thinking' | 'speaking';

const LAMBDA_URL =
  'https://xxdrmxupoeq6ttp22pja6mjbfe0wbwjg.lambda-url.us-east-1.on.aws';

// ?api=http://localhost:8787 points the page at a local Rewind server.
const apiUrl = new URLSearchParams(location.search).get('api') ?? LAMBDA_URL;
const rewind = createRewind(apiUrl);

const element = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;

const server = element('server');
const serverLabel = element('server-label');
const intro = element('intro');
const exchange = element('exchange');
const asked = element('asked');
const headline = element('headline');
const lines = element<HTMLUListElement>('lines');
const note = element('note');
const meta = element('meta');
const tool = element('tool');
const timing = element('timing');
const micLabel = element('mic-label');
const form = element<HTMLFormElement>('ask');
const input = element<HTMLInputElement>('question');

const MIC_LABELS: Record<State, string> = {
  ready: 'Press to talk',
  listening: 'Listening. Press to stop.',
  thinking: 'Asking Rewind…',
  speaking: 'Alexa is answering',
};

function setState(state: State) {
  document.body.dataset.state = state;
  micLabel.textContent = MIC_LABELS[state];
}

function setServer(status: 'connected' | 'offline') {
  server.dataset.status = status;
  serverLabel.textContent =
    status === 'offline'
      ? 'Can’t reach Rewind'
      : apiUrl === LAMBDA_URL
        ? 'Rewind server on AWS'
        : `Rewind server at ${new URL(apiUrl).host}`;
}

function show(reply: Reply) {
  headline.textContent = reply.headline;
  lines.replaceChildren(
    ...reply.lines.map((line) => {
      const item = document.createElement('li');
      item.textContent = line;
      return item;
    }),
  );
  lines.hidden = reply.lines.length === 0;
  note.textContent = reply.note ?? '';
  note.hidden = !reply.note;
}

let latest = 0;

async function ask(said: string) {
  const question = stripWakeWord(said);
  if (!question) {
    setState('ready');
    return;
  }
  const call = chooseTool(question);
  const id = ++latest;
  stopSpeaking();

  intro.hidden = true;
  exchange.hidden = false;
  asked.textContent = `“${said.trim()}”`;
  show({speech: '', headline: '…', lines: []});
  tool.textContent = call.name;
  timing.textContent = '';
  meta.hidden = false;
  setState('thinking');

  const started = performance.now();
  let reply: Reply;
  try {
    reply = replyFor(call.name, await rewind.call(call));
    if (id !== latest) {
      return;
    }
    const seconds = (performance.now() - started) / 1000;
    timing.textContent = `Rewind answered in ${seconds.toFixed(1)} s`;
    setServer('connected');
  } catch (error) {
    if (id !== latest) {
      return;
    }
    setServer('offline');
    const sorry = 'Sorry, I can’t reach Rewind right now.';
    reply = {speech: sorry, headline: sorry, lines: [], note: String(error)};
  }

  show(reply);
  setState('speaking');
  speak(reply.speech, () => {
    if (id === latest) {
      setState('ready');
    }
  });
}

for (const chip of document.querySelectorAll<HTMLButtonElement>('.chip')) {
  chip.addEventListener('click', () => {
    void ask(chip.dataset.question ?? chip.textContent ?? '');
  });
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const said = input.value;
  input.value = '';
  void ask(said);
});

rewind.connect().then(
  () => setServer('connected'),
  () => setServer('offline'),
);
