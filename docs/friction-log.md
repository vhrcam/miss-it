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
