# Product feedback

What we used to build Miss It?, what worked, what got in the way, and whether we'd build with it again. The [friction log](friction-log.md) has step-by-step detail for each problem.

## At a glance

| Product | What Miss It? uses it for | Build with it again? |
|---|---|---|
| Alexa+ (MCP) | The way Alexa reaches Miss It?: four read-only tools over Streamable HTTP | Yes, once the tools are open to everyone |
| Vega SDK | The Fire TV app: playback, captions, reporting what's on screen | Yes |
| Amazon Bedrock (Nova 2 Lite) | Writing recaps and answering follow-up questions | Yes, but new accounts need a clearer path |
| Amazon Nova API | A backup way to reach Nova while Bedrock was blocked | Maybe, if key management gets fixed |
| Amazon Rekognition | "Who's that?": indexing every face in the film ahead of time | Yes |
| AWS Lambda | Hosting the server behind a public HTTPS URL | Yes |
| Amazon DynamoDB | The watch log, with a one-day expiry | Yes |
| AWS CloudFormation, Amazon S3 | One-command deploys | Yes |
| AWS CLI | Deploys, quotas, and indexing scripts | Yes |

## Alexa+ (MCP)

**What we used it for.** Miss It? is a self-hosted MCP server (spec 2025-11-25, Streamable HTTP) with four tools: `recap_recent`, `who_is_on_screen`, `ask_about_show` and `whats_playing`. Alexa+ picks the tool from what the user says, so there's no skill name to remember.

**What worked.**
- Building on MCP meant we didn't need any Amazon tooling to build and test. The official MCP Inspector and the TypeScript SDK covered everything up to the Alexa+ connection itself.
- Account linking is optional. Our tools give every user the same answers, so we skipped OAuth entirely once we found that out.
- The latency guidance shaped the design for the better. Because Alexa+ wants a fast reply, Miss It? writes the "what did I miss?" recap while the show plays, and a question becomes a lookup.

**What needs work.**
- The QuickStart presents OAuth as a "Required" checklist, and only the Account Linking page says it's optional (friction log #1).
- The Alexa AI CLI isn't on public npm. Installing it needs a role in an Amazon-owned account and a Solutions Architect, so hackathon builders can't deploy an add-on or reach the web simulator (#2).
- The docs give two latency targets, 500 ms and 3 seconds, without saying what's measured (#3).
- The Client Lifecycle page shows Alexa+ sending protocol version 2025-03-26, while the hackathon requires servers on 2025-11-25 or later (#4).
- `llms.txt` is served as an HTML page instead of plain text (#5).

**Getting started.** Writing the MCP server was the easy part. The hard part was finding out how an outside developer gets it in front of Alexa+. Without the CLI, we built a [simulated Alexa+ page](../alexa-sim) that calls the same MCP server with the official SDK client, and that's what our demo shows. We'd much rather have shown the real thing.

## Vega SDK (Fire TV)

**What we used it for.** A React Native app that plays the demo film with the W3C media player, shows WebVTT captions with `KeplerCaptionsView`, and reports which captions were on screen to our server every five seconds. We developed and tested it entirely on the Vega Virtual Device.

**What worked.**
- The W3C media player works like the HTML5 media element (`play()`, `currentTime`, `seeked` and `waiting` events, `addTextTrack`, `VTTCue`), so the player code reads like web video code. The Vega-specific parts are passing the video surface and caption view handles to the player.
- TV focus worked with standard React Native props (`hasTVPreferredFocus`, `onFocus` and `onBlur` on `TouchableOpacity`) on the first build.
- Once set up, the virtual device boots in 7 to 14 seconds, a release build takes about 11 seconds, and `vega run-app` installs and opens the app in one step.
- `inputd-cli button_press`, run through `vega device run-cmd`, presses remote buttons from a script, which made testing on the virtual device quick.
- Captions through `addTextTrack`, `VTTCue` and `KeplerCaptionsView` worked as the Closed Captions guide describes.

**What needs work.**
- `http://` video sources fail with `MediaError` code 4 and no request or log line, so it looks like a file format problem. We lost about 40 minutes to it (friction log #10).
- The app's own warnings were dropped by log rate limiting at startup, and `loggingctl config --set-rate` failed (#11).
- The default template targets React Native 0.83, but the media package for 0.83 is only published under an alpha tag (#8).
- The media player README and the Closed Captions guide disagree about `addTextTrack` (#13), and the caption view keeps the frame it was created with (#14).
- There's no screenshot command for the virtual device (#12), and `virtual-device start` keeps waiting after the device window is closed (#9).
- The manifest docs say where the app icon appears only for Settings › Applications. "Your apps" also uses it, cropped to a wide tile (#15).

**Getting started.** Setup was quick. With Homebrew and Node already on the Mac, Rosetta, the Homebrew packages and Amazon's installer script took about five minutes, unattended. Generating the project, installing its packages, the first build and a running virtual device took about seven more, including one restart (#9). The virtual device reached the Mac at `10.0.2.2` and the internet with no extra setup. Most of the lost time was in media playback, where errors didn't say what was wrong.

## Amazon Bedrock (Nova 2 Lite)

**What we used it for.** Writing the two-sentence "what did I miss?" recap from the captions seen so far, answering follow-up questions with only what's been shown, and describing what's on screen in scenes with no dialogue. We call Nova 2 Lite through the Converse API with the `us.amazon.nova-2-lite-v1:0` inference profile.

**What worked.** The Converse API docs were clear, and one request shape covers text and images, so the scene descriptions needed little extra code. We could only test that code against a stand-in model, though, for the reason below.

**What needs work.** On our brand-new account, every Nova call returned `ValidationException: Operation not allowed`, in the CLI and in the console playground. Service Quotas showed every Nova quota at 0, and the tokens-per-day quota can't be adjusted. Nothing in the error pointed to quotas, the Model access page says models turn on by themselves, and the free plan still paid out its "use a foundation model in the Bedrock playground" credit (friction log #6). As of this writing, the support case is still open.

**Getting started.** Everything else on the account worked on day one: Lambda, DynamoDB, Rekognition, CloudFormation. Bedrock was the one service a new account couldn't use, and the account was the only way to get at it.

## Amazon Nova API

**What we used it for.** A backup path to the same model through `api.nova.amazon.com`. Miss It? switches to it whenever `NOVA_API_KEY` is set.

**What worked.** The API mirrors the familiar chat-completions shape, so the client took a few minutes to write.

**What needs work.** A key is shown once. When our first copy failed, the only way forward was a new key, but the page said we'd hit the key limit. Deactivating the old key reported success, yet the key stayed active and the limit didn't change (friction log #7).

## Amazon Rekognition

**What we used it for.** "Who's that?" Miss It? grabs a frame every second from its own copy of the film, indexes every face into a collection, and matches them against one reference photo per character. Asking Alexa is then a lookup by timestamp, with no image work at question time.

**What worked.** Indexing and search were fast and accurate. It matched all six characters we could confirm from the film's credits, and it worked on a new account from the first call.

**What needs work.** One reference photo was cropped so tightly that Rekognition found no face in it, and the response didn't say why. A looser crop fixed it. A note in the docs about how much of the head a photo needs to show would save time.

## AWS Lambda, Amazon DynamoDB, AWS CloudFormation and Amazon S3

**What we used them for.** The server runs on Lambda behind a function URL, so it has public HTTPS with no API Gateway. Each household's watch log lives in DynamoDB with a time-to-live, so viewing history expires a day after the TV stops reporting. One script packages the server to S3 and deploys the stack with CloudFormation.

**What worked.** All of it, on the first deploy. A function URL is exactly the right amount of infrastructure for an MCP server, and DynamoDB's TTL means no cleanup job.

**What needs work.** Very little. The first request after the function sits idle takes about a second. While a show plays, the TV's updates keep it warm, so Alexa's questions don't pay that cost.

## AWS CLI

**What we used it for.** Deploys, checking Bedrock availability and quotas, and the Rekognition indexing scripts.

**What worked.** `aws login` is a big improvement for new accounts: one browser sign-in, no access keys to create or store.

**What needs work.** Without a region in the profile, every call fails with `NoRegion` even after `aws login --region us-east-1`, so the region has to be passed on every command.
