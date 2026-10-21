import {chooseTool, stripWakeWord} from './chooseTool';
import {canListen, listen} from './listen';
import {replyFor, type Reply} from './reply';
import {createMcpClient} from './mcpClient';
import {speak, stopSpeaking} from './speak';

type State = 'ready' | 'listening' | 'thinking' | 'speaking';

const LAMBDA_URL =
  'https://xxdrmxupoeq6ttp22pja6mjbfe0wbwjg.lambda-url.us-east-1.on.aws';

// ?api=http://localhost:8787 points the page at a local Miss It? server.
const apiUrl = new URLSearchParams(location.search).get('api') ?? LAMBDA_URL;
const mcp = createMcpClient(apiUrl);

const element = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;

const server = element('server');
const serverLabel = element('server-label');
const intro = element('intro');
const listening = element('listening');
const transcript = element('transcript');
const exchange = element('exchange');
const asked = element('asked');
const headline = element('headline');
const lines = element<HTMLUListElement>('lines');
const note = element('note');
const meta = element('meta');
const tool = element('tool');
const timing = element('timing');
const mic = element<HTMLButtonElement>('mic');
const micLabel = element('mic-label');
const form = element<HTMLFormElement>('ask');
const input = element<HTMLInputElement>('question');

const MIC_LABELS: Record<State, string> = {
  ready: canListen ? 'Press to talk' : 'Voice needs Chrome. Type below.',
  listening: 'Listening. Press to stop.',
  thinking: 'Asking Miss It?…',
  speaking: 'Alexa is answering',
};

function setState(state: State) {
  document.body.dataset.state = state;
  micLabel.textContent = MIC_LABELS[state];
  mic.setAttribute(
    'aria-label',
    state === 'listening' ? 'Stop listening' : 'Press to talk',
  );
}

function setServer(status: 'connected' | 'offline') {
  server.dataset.status = status;
  serverLabel.textContent =
    status === 'offline'
      ? 'Can’t reach Miss It?'
      : apiUrl === LAMBDA_URL
        ? 'Miss It? server on AWS'
        : `Miss It? server at ${new URL(apiUrl).host}`;
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
let listenSession = 0;
let stopListening: (() => void) | undefined;

// A chip or a typed question while the mic is on wins over what it hears.
function dropListening() {
  if (stopListening) {
    listenSession++;
    stopListening();
    stopListening = undefined;
    listening.hidden = true;
  }
}

async function ask(said: string) {
  const question = stripWakeWord(said);
  if (!question) {
    setState('ready');
    return;
  }
  const call = chooseTool(question);
  const id = ++latest;
  dropListening();
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
    reply = replyFor(call.name, await mcp.call(call));
    if (id !== latest) {
      return;
    }
    const seconds = (performance.now() - started) / 1000;
    timing.textContent = `Miss It? answered in ${seconds.toFixed(1)} s`;
    setServer('connected');
  } catch (error) {
    if (id !== latest) {
      return;
    }
    setServer('offline');
    const sorry = 'Sorry, I can’t reach Miss It? right now.';
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

mic.disabled = !canListen;
mic.addEventListener('click', () => {
  if (stopListening) {
    stopListening();
    return;
  }
  latest++;
  stopSpeaking();
  const answered = !exchange.hidden;
  intro.hidden = true;
  exchange.hidden = true;
  listening.hidden = false;
  transcript.textContent = '';
  setState('listening');

  const session = ++listenSession;
  stopListening = listen({
    heard: (text) => {
      transcript.textContent = text;
    },
    done: (text, error) => {
      if (session !== listenSession) {
        return;
      }
      stopListening = undefined;
      listening.hidden = true;
      if (text) {
        void ask(text);
        return;
      }
      intro.hidden = answered;
      exchange.hidden = !answered;
      setState('ready');
      if (error === 'not-allowed' || error === 'service-not-allowed') {
        micLabel.textContent = 'Allow the mic in Chrome to talk';
      }
    },
  });
});

mcp.connect().then(
  () => setServer('connected'),
  () => setServer('offline'),
);
