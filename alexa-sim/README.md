# Simulated Alexa+

A stand-in for Alexa+ in Rewind's demo. Ask it about what's on the TV, out loud or by typing, and it calls Rewind's MCP tools the way Alexa+ would, then says the answer. The [Fire TV app](../firetv) shows the same answer on a card at the same moment.

![The Fire TV app showing a "What you missed" card while the simulated Alexa+ page answers the same question](screenshots/demo.jpg)

The Fire TV app in the Vega Virtual Device on the left, and this page on the right, right after "Alexa, what did I miss?". While Rewind's model is unavailable, both fall back to the dialogue.

## Why it's simulated

Rewind is built as an Alexa+ add-on: Alexa+ reaches it over MCP. Deploying an add-on to the real Alexa+ takes the Alexa AI CLI, and installing it looks limited to Preview partners for now ([friction log #2](../docs/friction-log.md#2-installing-the-alexa-ai-cli)). So this page plays Alexa's part, which the hackathon's Alexa+ track allows as a simulated Alexa+ experience in a web app.

## How it works

1. **Listen.** Press the mic and ask. Chrome's speech recognition turns it into text, and the page drops a leading "Alexa". You can also type a question or press one of the examples.
2. **Pick a tool.** Real Alexa+ chooses a tool on its own, from the description the Rewind server gives each one. This page has no model to do that, so simple keyword rules stand in ([`src/chooseTool.ts`](src/chooseTool.ts)):

   | Question | Tool |
   |---|---|
   | "What did I miss?", "catch me up", "what happened?" | `recap_recent` |
   | "Who's that?", "who plays him?" | `who_is_on_screen` |
   | "What are we watching?", "how much is left?", "how far in are we?" | `whats_playing` |
   | Anything else | `ask_about_show`, with the question |

3. **Call Rewind.** The page is a real MCP client. It uses the official MCP TypeScript SDK (`Client` with `StreamableHTTPClientTransport`), the same SDK the Rewind server is built on, and calls the server's `/mcp` endpoint.
4. **Answer.** Alexa says only what a person would hear ([`src/reply.ts`](src/reply.ts)). Some results are written for a model to read, like `ask_about_show`'s lines while Rewind's model is unavailable, so those are shown on the page but never read out. Without the model, a recap is the last minute of dialogue: the page shows all of it and reads out the last three lines. The server's note that the TV hasn't checked in shows as small print.

Under each answer, the page shows which tool it called and how long Rewind took.

## Run it

You need Node.js 22 or newer, and Chrome for voice. Typing works in any browser.

```sh
cd alexa-sim
npm install
npm run dev
```

Open http://localhost:5173 in Chrome and allow the microphone. The page talks to the Rewind server on AWS.

To use a local server instead (`npm run dev` in the repo root), open http://localhost:5173/?api=http://localhost:8787.

For the demo, play the film in the Fire TV app ([how](../firetv/README.md#run-it-on-the-vega-virtual-device)) next to this page. Ask "What did I miss?", and the TV shows the answer on a card while Alexa says it.

## Tests

```sh
npm run typecheck
npm run lint
npm test
```

The tests cover the keyword rules and what Alexa says for every tool, including that lines meant for a model are never read out.

## Files

| Path | What's in it |
|---|---|
| `index.html`, `src/style.css` | The page |
| `src/main.ts` | Connects the mic, the examples and the question box to Rewind |
| `src/chooseTool.ts` | Picks a Rewind tool for a question |
| `src/rewind.ts` | The MCP client |
| `src/reply.ts` | What Alexa says for each tool |
| `src/listen.ts`, `src/speak.ts` | Speech recognition and speech, from the browser's Web Speech API |
