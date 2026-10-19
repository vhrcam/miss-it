# spoiler-safe-context

**Turn captions into AI context that never runs ahead of the viewer.**

An assistant that answers questions about what someone is watching needs context. Hand a model the whole script and it spoils the ending. The captions that have *already been on screen* are the right context, as long as something keeps track of where the viewer is. That's this library: it parses WebVTT and SRT, remembers which cues the viewer has seen, and only ever hands back what came before their current position.

- **Spoiler-safe by construction.** Every read is cut off at the viewer's position, including after a rewind.
- **Rewind-proof.** Cues sent twice (a replay, a retried request) are counted once.
- **Small and portable.** No dependencies. Runs in Node, browsers, React Native and serverless functions.
- **Storable.** A watch log serializes to plain JSON, so it fits in DynamoDB, Redis or a file.

Built for [Rewind](https://github.com/vhrcam/rewind), which lets you ask Alexa "what did I miss?" while the TV keeps playing.

## Install

```sh
npm install github:vhrcam/spoiler-safe-context
```

## Quick start

```ts
import { WatchLog, parseCaptions, toTranscript } from "spoiler-safe-context";

const log = new WatchLog();

// Each time the player shows captions, record them and where the viewer is.
log.add(cuesThatWereOnScreen);
log.seek(player.currentTime);

// "What did I miss?": the last minute, and nothing after the viewer.
const lastMinute = toTranscript(log.recent(60));

// Follow-up questions: everything shown so far, keeping the newest lines if it's long.
const soFar = toTranscript(log.seen(), { maxChars: 8000 });
```

`toTranscript` gives you one line per cue, ready to drop into a prompt:

```
[0:23] You're a jerk, Thom.
[0:25] Look Celia, we have to follow our passions;
[0:30] Why don't you just admit that you're freaked out by my robot hand?
```

Already have the whole caption file? Parse it and feed the log as the viewer watches:

```ts
const cues = parseCaptions(await readFile("movie.en.vtt", "utf8"));
log.add(cues.filter((cue) => cue.startSec <= player.currentTime));
```

## API

### Parsing

| Function | What it does |
|---|---|
| `parseCaptions(source)` | Parses WebVTT or SRT into `Cue[]`, sorted by start time. Strips markup (`<i>`, `<c.yellow>`, `{\an8}`), decodes entities, skips headers, `NOTE`, `STYLE` and empty cues. A WebVTT voice tag (`<v Celia>`) becomes the cue's `speaker`. |
| `parseTimestamp(value)` | `"01:02:03.250"`, `"02:03.500"` or SRT's `"00:00:04,100"` to seconds. |
| `cleanCueText(raw)` | The text cleanup on its own: `{ text, speaker? }`. |

### `WatchLog`

| Member | What it does |
|---|---|
| `new WatchLog({ maxCues? })` | An empty log. The oldest cues are dropped past `maxCues` (default 5000). |
| `add(cues)` | Records cues that were on screen. Repeats are skipped (same start time to 0.1 s and the same text). Returns how many were new. |
| `seek(positionSec)` | Moves the viewer's position, forward or back. |
| `seen()` | Every cue that started at or before the position. |
| `recent(windowSec)` | Cues on screen at any point in the last `windowSec` seconds. |
| `positionSec`, `size` | The current position and the number of cues stored. |
| `toJSON()`, `WatchLog.fromJSON(snapshot)` | Save and restore a log as plain JSON. |

### Formatting

| Function | What it does |
|---|---|
| `toTranscript(cues, { timestamps?, maxChars? })` | One line per cue, oldest first. With `maxChars`, the most recent lines that fit win, and the latest line is always kept. |
| `formatTimestamp(seconds)` | `312.9` to `"5:12"`, `3723` to `"1:02:03"`. |

## The guarantee

`seen()` and `recent()` never return a cue whose `startSec` is after the viewer's position. The model can't spoil what it never sees, so put the spoiler line in your prompt too ("Never guess what happens next, even if you recognize the show"). That covers what the model might already know about a famous title.

## Development

```sh
npm install
npm test
npm run build
```

## License

[MIT](./LICENSE)
