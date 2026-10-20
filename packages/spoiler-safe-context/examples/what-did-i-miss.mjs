// A viewer watches the first 45 seconds of a mystery, steps away, and asks
// what they missed. Run it with: npm run build && node examples/what-did-i-miss.mjs
import { WatchLog, parseCaptions, toTranscript } from "../dist/index.js";

const captions = `WEBVTT

00:00:05.000 --> 00:00:08.000
<v Ada>The painting was on this wall an hour ago.

00:00:21.000 --> 00:00:24.000
<v Ben>Nobody came in. I was at the door the whole time.

00:00:37.000 --> 00:00:40.000
<v Ada>Then it never left this room.

00:01:30.000 --> 00:01:33.000
<v Ben>Fine. I took it.
`;

const cues = parseCaptions(captions);
const log = new WatchLog();

// The player records each caption as it appears, then reports where it is.
log.add(cues.filter((cue) => cue.startSec <= 45));
log.seek(45);

console.log("What did I miss? (the last 30 seconds)");
console.log(toTranscript(log.recent(30)));

// Even if every caption in the file gets added, reads stop at the viewer.
log.add(cues);
console.log("\nEverything so far, with the whole file loaded:");
console.log(toTranscript(log.seen()));

// After a rewind, the log forgets nothing but shows only what came before.
log.seek(20);
console.log("\nAfter rewinding to 0:20:");
console.log(toTranscript(log.seen()));
