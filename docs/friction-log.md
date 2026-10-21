# Friction log

The problems we ran into while building Miss It?, in two parts: Alexa+ and AWS first, then the Fire TV app on Vega, each in the order we hit them. Severity: **High** blocks progress, **Medium** costs hours or changes the design, **Low** is an annoyance.

## Alexa+ and AWS

### 1. Finding out whether an add-on needs OAuth

| | |
|---|---|
| **Task** | Decide whether Miss It?, which has no user accounts, has to run an OAuth server before it can connect to Alexa+. |
| **Steps** | Read the MCP Toolkit QuickStart ("Authentication checklist"), then the Authentication page, then Account Linking. |
| **Expected** | A clear line near the top of the QuickStart saying auth is optional when every user gets the same tools. |
| **Actual** | The QuickStart lists the 401 behavior, Protected Resource Metadata and PKCE as a checklist marked "Required". The Authentication page says Tier 1 applies "if you have a private MCP Server". Only the Account Linking page says "Account linking is optional." |
| **Severity** | Medium. We nearly planned a day of Cognito work we didn't need. |
| **Workaround** | Read all three pages and skipped auth. Our tools don't need to know who is asking. |
| **Suggestion** | Open the QuickStart's auth section with a one-line decision: "No per-user data? You can skip auth." |

### 2. Installing the Alexa AI CLI

| | |
|---|---|
| **Task** | Install the Alexa AI CLI to deploy the add-on and test it in the Alexa+ web simulator. |
| **Steps** | `npm view @alexa-ai/cli` returns 404 on the public registry. The setup page instead asks for an IAM user that assumes the `AddOn3PDeveloperToolsRead` role in an Amazon-owned account, a CodeArtifact login, and "the AWS account that you provided to the Alexa Solutions Architect". |
| **Expected** | A public npm package (like `ask-cli`), or a self-serve way in for hackathon builders. |
| **Actual** | The install path looks gated to Preview partners who work with a Solutions Architect. The hackathon Resources page doesn't mention the CLI at all. |
| **Severity** | High for hackathon builders. Without the CLI there's no add-on deployment and no web simulator. |
| **Workaround** | We built and tested the MCP server first, since it's needed either way. |
| **Suggestion** | Publish the CLI to npm or allowlist hackathon participants, and say on the Resources page which path builders should take. |

### 3. The 500 ms latency rule

| | |
|---|---|
| **Task** | Plan how much AI work (Bedrock summaries) can happen during a tool call. |
| **Steps** | The QuickStart's Performance section says the server "must meet a round-trip query response latency of less than 500 ms". Functional Requirements says "Best practice: Return results within 3 seconds". |
| **Expected** | One number, with what it measures (every `tools/call`? `initialize`? p50 or p99?) and what to do when a tool is slower. |
| **Actual** | Two different numbers and no scope. |
| **Severity** | Medium. It changed our architecture. |
| **Workaround** | Miss It? does its AI work while the show plays, so a tool call is a lookup. Our tools answer in single-digit milliseconds locally. |
| **Suggestion** | Define the latency metric and percentile, and say whether it applies to `tools/call`. |

### 4. Protocol version in the client lifecycle docs

| | |
|---|---|
| **Task** | Confirm which MCP protocol version Alexa+ speaks. |
| **Steps** | The hackathon requires servers on spec 2025-11-25 or later. The Client Lifecycle page shows Alexa+ sending `"protocolVersion": "2025-03-26"` in `initialize`. |
| **Expected** | The docs and the hackathon rules agree, or the docs say which versions the client negotiates. |
| **Actual** | Unclear whether Alexa+ uses anything newer than 2025-03-26. |
| **Severity** | Low. The MCP SDK negotiates down, so both work. |
| **Workaround** | Miss It? supports 2025-11-25 and accepts older clients. |
| **Suggestion** | List the protocol versions the Alexa+ client supports. |

### 5. `llms.txt` is an HTML page

| | |
|---|---|
| **Task** | Point a coding agent at the docs index. Every docs page says "Fetch the complete documentation index at: /docs/llms.txt". |
| **Steps** | `curl https://developer.amazon.com/docs/llms.txt` |
| **Expected** | A plain-text index of pages. |
| **Actual** | An 80 KB HTML page with the site header, scripts and styles. |
| **Severity** | Low. |
| **Workaround** | Downloaded the doc pages and converted them to text. |
| **Suggestion** | Serve `llms.txt` as `text/plain`, plus Markdown versions of each page. |

### 6. Bedrock says "Operation not allowed" on a new account

| | |
|---|---|
| **Task** | Call Amazon Nova 2 Lite on a brand-new AWS account to write our recaps. |
| **Steps** | Created the account, signed in with `aws login`, called `converse` with `us.amazon.nova-2-lite-v1:0`. For the first hour the error was "Your account is currently being verified". After that, every Nova model returned `ValidationException: Operation not allowed`, in the CLI and in the console playground. Lambda, DynamoDB and Rekognition all worked from the start. |
| **Expected** | Bedrock works once verification ends, or the error says what's missing. |
| **Actual** | Service Quotas showed every Nova inference quota at 0, including "Model invocation max tokens per day for Amazon Nova 2 Lite", which can't be adjusted. `get-foundation-model-availability` said `NOT_AUTHORIZED`. Nothing in the error or the console pointed at quotas. The console's Model access page says models turn on by themselves the first time they're called, and the free plan marked "Use a foundation model in the Amazon Bedrock playground" as done and paid its $20 credit, though no call on the account had ever succeeded. Asking for more in Service Quotas doesn't work either: a request for 200,000 tokens a minute is refused with "You must provide a quota value greater than the default quota value of 8000000.0", because the account's value is 0 but the default is 8 million. That leaves a support case as the only way out. |
| **Severity** | High. It blocked every AI feature on day one of a four-day hackathon. |
| **Workaround** | Built and tested against a fake model, shipped a fallback that reads out the real dialogue, and opened a support case to raise the quotas. |
| **Suggestion** | Make the error say "your account's quota for this model is 0", link to how to raise it, let Service Quotas accept a request up to the default when an account's value is below it, and warn hackathon builders on new accounts on the Resources page. |

### 7. A lost Nova API key can't be replaced

| | |
|---|---|
| **Task** | Get a key for Amazon's direct Nova API at nova.amazon.com/dev-apis, so Miss It? could reach Nova while Bedrock was blocked. |
| **Steps** | Signed in, clicked **Generate Key** and named the key. The full key is shown once, and our copy failed because the browser blocked clipboard access. After that the key list only shows it masked (`xxxxxxxx-****-****-****-xxxxxxxxxxxx`). Clicked **Generate Key** again, which said the key limit was reached and to deactivate a key first, then chose **Deactivate** from the key's menu. |
| **Expected** | Deactivating frees the slot for a new key, or a lost key can be regenerated. |
| **Actual** | Deactivate reported success, but the key stayed in the Active list and Generate Key still said the limit was reached. Same in Chrome and Brave. The page doesn't say what the limit is. |
| **Severity** | High. With Bedrock blocked too, this closed the last way to reach Nova. |
| **Workaround** | Kept the dialogue fallback running and followed up on the AWS support case. A day later we got a new key, and Miss It? now reaches Nova through it. |
| **Suggestion** | Make Deactivate free the slot right away, show the key limit on the page, and add a Regenerate action for a key whose secret was lost. |

## Fire TV (Vega SDK)

### 8. The default template's media player is still an alpha

| | |
|---|---|
| **Task** | Start a Vega app that plays video with the W3C media player. |
| **Steps** | `vega project list-templates` shows `helloWorld` (React Native 0.83) first and `helloWorld-rn72` second. `npm view @amazon-devices/react-native-w3cmedia dist-tags` shows `latest: 2.3.2` and `rn83-alpha: 2.3.4-rn-83`. |
| **Expected** | The default template works with the stable media package. |
| **Actual** | The React Native 0.83 build of the media package is only published under an alpha tag. Nothing in the template list says so. |
| **Severity** | Low. We caught it before writing code. |
| **Workaround** | Generated the project from `helloWorld-rn72` and used `react-native-w3cmedia` 2.3.2. |
| **Suggestion** | Note in `list-templates` (or the media player docs) which template the stable media packages support. |

### 9. Closing the virtual device window leaves `start` waiting

| | |
|---|---|
| **Task** | Boot the Vega Virtual Device. |
| **Steps** | `vega virtual-device start --timeout 300`, then the device window was closed while it booted. |
| **Expected** | `start` notices the emulator exited and fails right away. |
| **Actual** | `vega virtual-device status` reported `"running": false`, but `start` kept waiting for the full timeout. |
| **Severity** | Low. |
| **Workaround** | Stopped the waiting command and ran `start` again. The second boot took 14 seconds. |
| **Suggestion** | Watch the emulator process during `start` and exit with an error if it dies. |

### 10. `http://` video fails with error 4 and no request

| | |
|---|---|
| **Task** | Play an MP4 in `VideoPlayer` (URL mode) from a dev server on the Mac. |
| **Steps** | Set `player.src` to `http://10.0.2.2:8788/tears-of-steel.mp4`, then to `http://localhost:8788/...` with `vega device start-port-forwarding -p 8788 -f false`. |
| **Expected** | The video plays, or an error that says plain HTTP isn't allowed. |
| **Actual** | Both fire `error` with `MediaError` code 4 (`MEDIA_ERR_SRC_NOT_SUPPORTED`). The server never gets a request, and no log line says why. The same app's `fetch()` to the same server works, and an `https://` MP4 plays. |
| **Severity** | High. Playback was blocked for about 40 minutes, and the code 4 pointed at the file format instead of the URL scheme. |
| **Workaround** | Stream the film over HTTPS from Blender's mirrors, and bundle the captions in the app. |
| **Suggestion** | Say in the media player docs that sources must be HTTPS, and log the reason when a URL is rejected. Allowing `http://` on the virtual device would make local testing much easier. |

### 11. App logs are suppressed at startup

| | |
|---|---|
| **Task** | Read the app's logs to debug #10. |
| **Steps** | `vda shell journalctl ...` answers "journalctl is not supported in developer mode shell. Please use loggingctl instead." `loggingctl log -v com.vhrcam.missit` shows "Log suppression ended at level [info]. [52] logs were suppressed", and the media player logs `hasEnded` twice a second. `loggingctl config --set-rate com.vhrcam.missit 100000` returns `"status": "failed"`. |
| **Expected** | An app's own warnings are always visible in developer mode. |
| **Actual** | Startup logs were dropped, and our own `console.warn` calls never showed up. |
| **Severity** | Medium. It made #10 much slower to find. |
| **Workaround** | Showed the media error code on screen, and took screenshots. |
| **Suggestion** | Don't rate-limit warnings and errors from the app being debugged, make `--set-rate` work for developer apps, and quiet the media player's `hasEnded` logging. |

### 12. No screenshot command

| | |
|---|---|
| **Task** | Take screenshots of the app on the virtual device to check the UI and for the submission. |
| **Steps** | Looked through `vega device --help` and `vda help`. |
| **Expected** | Something like `vega device screenshot`. |
| **Actual** | There isn't one. |
| **Severity** | Low. |
| **Workaround** | The virtual device runs on the Android emulator, so its console on port 5554 accepts `screenrecord screenshot <dir>` after `auth <token from ~/.emulator_console_auth_token>`. |
| **Suggestion** | Add `vega device screenshot`, for the virtual device at least. |

### 13. The docs disagree about captions

| | |
|---|---|
| **Task** | Show WebVTT captions the app parsed itself. |
| **Steps** | Read the `react-native-w3cmedia` README and the "Implement Closed Captions" guide. |
| **Expected** | One consistent story. |
| **Actual** | The README lists `addTextTrack` as unsupported and says captions only render after `vdcm set com.amazon.devconf/system/accessibility/ClosedCaptioningEnabled 1`. The guide uses `addTextTrack`. On the virtual device, `addTextTrack` + `VTTCue` + `KeplerCaptionsView` rendered captions without the `vdcm` setting. |
| **Severity** | Low. |
| **Workaround** | Followed the guide. |
| **Suggestion** | Update the README to match the guide. |

### 14. The caption view keeps the frame it started with

| | |
|---|---|
| **Task** | Move the captions above the player controls while the controls are on screen. |
| **Steps** | Changed the `KeplerCaptionsView` style from full screen to `bottom: 220` while the controls showed, then back. |
| **Expected** | The captions move with the view. |
| **Actual** | The captions stayed at the bottom of the screen, under the controls. A new caption view with the same style put them in the right place, so the view seems to read its frame only once, when it's created. |
| **Severity** | Low. |
| **Workaround** | Gave the caption view a React `key` that changes with the controls, so it's created again with the new frame. Its new handle goes to `setCaptionViewHandle`. |
| **Suggestion** | Apply layout changes to the caption view, or add a prop for where captions sit (like a bottom inset for player controls). |

### 15. The square app icon is cropped in "Your apps"

| | |
|---|---|
| **Task** | Give the app an icon. |
| **Steps** | Added a 512 × 512 PNG as `[package] icon` in `manifest.toml`, as the manifest docs ask, then opened "Your apps" on the virtual device. |
| **Expected** | The docs say where the icon appears and how it's fitted. They name only Settings › Applications, and the virtual device's Settings has no Applications screen to check. |
| **Actual** | "Your apps" shows the icon too, in a wide tile about 1.55:1. The square image is scaled to the tile's width, so its top and bottom are cut off, and our round logo lost its top and bottom edges. |
| **Severity** | Low. It took two extra builds to find a size that fits. |
| **Workaround** | Gave the icon a full square background and kept the logo inside the part of the 512 × 512 canvas that stays visible. |
| **Suggestion** | Document every place the icon appears, with the safe area that "Your apps" keeps, or accept a separate wide image for the tile. |
