# Friction log

What got in the way while building Rewind, in the order we hit it. Severity: **High** blocks progress, **Medium** costs hours or changes the design, **Low** is an annoyance.

## 1. Finding out whether an add-on needs OAuth

| | |
|---|---|
| **Task** | Decide whether Rewind, which has no user accounts, has to run an OAuth server before it can connect to Alexa+. |
| **Steps** | Read the MCP Toolkit QuickStart ("Authentication checklist"), then the Authentication page, then Account Linking. |
| **Expected** | A clear line near the top of the QuickStart saying auth is optional when every user gets the same tools. |
| **Actual** | The QuickStart lists the 401 behavior, Protected Resource Metadata and PKCE as a checklist marked "Required". The Authentication page says Tier 1 applies "if you have a private MCP Server". Only the Account Linking page says "Account linking is optional." |
| **Severity** | Medium. We nearly planned a day of Cognito work we didn't need. |
| **Workaround** | Read all three pages and skipped auth. Rewind's tools don't need to know who is asking. |
| **Suggestion** | Open the QuickStart's auth section with a one-line decision: "No per-user data? You can skip auth." |

## 2. Installing the Alexa AI CLI

| | |
|---|---|
| **Task** | Install the Alexa AI CLI to deploy the add-on and test it in the Alexa+ web simulator. |
| **Steps** | `npm view @alexa-ai/cli` returns 404 on the public registry. The setup page instead asks for an IAM user that assumes the `AddOn3PDeveloperToolsRead` role in an Amazon-owned account, a CodeArtifact login, and "the AWS account that you provided to the Alexa Solutions Architect". |
| **Expected** | A public npm package (like `ask-cli`), or a self-serve way in for hackathon builders. |
| **Actual** | The install path looks gated to Preview partners who work with a Solutions Architect. The hackathon Resources page doesn't mention the CLI at all. |
| **Severity** | High for hackathon builders. Without the CLI there's no add-on deployment and no web simulator. |
| **Workaround** | We built and tested the MCP server first, since it's needed either way. |
| **Suggestion** | Publish the CLI to npm or allowlist hackathon participants, and say on the Resources page which path builders should take. |

## 3. The 500 ms latency rule

| | |
|---|---|
| **Task** | Plan how much AI work (Bedrock summaries) can happen during a tool call. |
| **Steps** | The QuickStart's Performance section says the server "must meet a round-trip query response latency of less than 500 ms". Functional Requirements says "Best practice: Return results within 3 seconds". |
| **Expected** | One number, with what it measures (every `tools/call`? `initialize`? p50 or p99?) and what to do when a tool is slower. |
| **Actual** | Two different numbers and no scope. |
| **Severity** | Medium. It changed Rewind's architecture. |
| **Workaround** | Rewind does its AI work while the show plays, so a tool call is a lookup. Our tools answer in single-digit milliseconds locally. |
| **Suggestion** | Define the latency metric and percentile, and say whether it applies to `tools/call`. |

## 4. Protocol version in the client lifecycle docs

| | |
|---|---|
| **Task** | Confirm which MCP protocol version Alexa+ speaks. |
| **Steps** | The hackathon requires servers on spec 2025-11-25 or later. The Client Lifecycle page shows Alexa+ sending `"protocolVersion": "2025-03-26"` in `initialize`. |
| **Expected** | The docs and the hackathon rules agree, or the docs say which versions the client negotiates. |
| **Actual** | Unclear whether Alexa+ uses anything newer than 2025-03-26. |
| **Severity** | Low. The MCP SDK negotiates down, so both work. |
| **Workaround** | Rewind supports 2025-11-25 and accepts older clients. |
| **Suggestion** | List the protocol versions the Alexa+ client supports. |

## 5. `llms.txt` is an HTML page

| | |
|---|---|
| **Task** | Point a coding agent at the docs index. Every docs page says "Fetch the complete documentation index at: /docs/llms.txt". |
| **Steps** | `curl https://developer.amazon.com/docs/llms.txt` |
| **Expected** | A plain-text index of pages. |
| **Actual** | An 80 KB HTML page with the site header, scripts and styles. |
| **Severity** | Low. |
| **Workaround** | Downloaded the doc pages and converted them to text. |
| **Suggestion** | Serve `llms.txt` as `text/plain`, plus Markdown versions of each page. |

## 6. Bedrock says "Operation not allowed" on a new account

| | |
|---|---|
| **Task** | Call Amazon Nova 2 Lite on a brand-new AWS account to write Rewind's recaps. |
| **Steps** | Created the account, signed in with `aws login`, called `converse` with `us.amazon.nova-2-lite-v1:0`. For the first hour the error was "Your account is currently being verified". After that, every Nova model returned `ValidationException: Operation not allowed`, in the CLI and in the console playground. Lambda, DynamoDB and Rekognition all worked from the start. |
| **Expected** | Bedrock works once verification ends, or the error says what's missing. |
| **Actual** | Service Quotas showed every Nova inference quota at 0, including "Model invocation max tokens per day for Amazon Nova 2 Lite", which can't be adjusted. `get-foundation-model-availability` said `NOT_AUTHORIZED`. Nothing in the error or the console pointed at quotas. The console's Model access page says models turn on by themselves the first time they're called, and the free plan marked "Use a foundation model in the Amazon Bedrock playground" as done and paid its $20 credit, though no call on the account had ever succeeded. |
| **Severity** | High. It blocked every AI feature on day one of a four-day hackathon. |
| **Workaround** | Built and tested against a fake model, shipped a fallback that reads out the real dialogue, and opened a support case to raise the quotas. |
| **Suggestion** | Make the error say "your account's quota for this model is 0", link to how to raise it, and warn hackathon builders on new accounts on the Resources page. |

## 7. A lost Nova API key can't be replaced

| | |
|---|---|
| **Task** | Get a key for Amazon's direct Nova API at nova.amazon.com/dev-apis, so Rewind could reach Nova while Bedrock was blocked. |
| **Steps** | Signed in, clicked **Generate Key** and named the key. The full key is shown once, and our copy failed because the browser blocked clipboard access. After that the key list only shows it masked (`xxxxxxxx-****-****-****-xxxxxxxxxxxx`). Clicked **Generate Key** again, which said the key limit was reached and to deactivate a key first, then chose **Deactivate** from the key's menu. |
| **Expected** | Deactivating frees the slot for a new key, or a lost key can be regenerated. |
| **Actual** | Deactivate reported success, but the key stayed in the Active list and Generate Key still said the limit was reached. Same in Chrome and Brave. The page doesn't say what the limit is. |
| **Severity** | High. With Bedrock blocked too, this closed the last way to reach Nova. |
| **Workaround** | Kept the dialogue fallback running and followed up on the AWS support case. |
| **Suggestion** | Make Deactivate free the slot right away, show the key limit on the page, and add a Regenerate action for a key whose secret was lost. |
