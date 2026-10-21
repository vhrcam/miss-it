# Playback API

The Fire TV app reports what's playing so Rewind can answer questions about it. Rewind only ever uses what has already been on screen.

## `POST /v1/playback`

Headers

```
Content-Type: application/json
Authorization: Bearer <MISS_IT_DEVICE_KEY>
```

Body

| Field | Type | Required | Notes |
|---|---|---|---|
| `householdId` | string | yes | `"demo"` in the hackathon build. A pairing code replaces it later. |
| `contentId` | string | yes | Stable ID for the title, e.g. `"tears-of-steel"`. A new ID starts a fresh watch log. |
| `title` | string | yes | Display title. |
| `durationSec` | number | no | Runtime in seconds. |
| `positionSec` | number | yes | Current playback position in seconds. |
| `state` | `"playing"` \| `"paused"` \| `"ended"` | yes | Player state after this update. |
| `event` | `"tick"` \| `"play"` \| `"pause"` \| `"seek"` \| `"ended"` | no | What triggered the update. |
| `sentAt` | number | no | Epoch milliseconds when the app sent it. Updates older than the newest one stored are ignored. |
| `cues` | `Cue[]` | yes | Caption cues that appeared on screen since the last update. May be empty. |

`Cue`

| Field | Type | Notes |
|---|---|---|
| `startSec` | number | When the cue appeared. |
| `endSec` | number | When the cue disappeared. |
| `text` | string | Caption text. Line breaks are fine. |

Example

```json
{
  "householdId": "demo",
  "contentId": "tears-of-steel",
  "title": "Tears of Steel",
  "durationSec": 734.1,
  "positionSec": 312.4,
  "state": "playing",
  "event": "tick",
  "sentAt": 1792451000000,
  "cues": [
    { "startSec": 305.2, "endSec": 308.9, "text": "You're a coward, Thom." }
  ]
}
```

Responses

| Status | Meaning |
|---|---|
| `204` | Stored. |
| `400` | Invalid body. The JSON error says which field. |
| `401` | Missing or wrong device key. |

## Rules

- Send an update every 5 seconds while playing, and right away on play, pause, seek and end.
- Only send cues that were actually shown. Cues skipped by a forward seek are never sent.
- After a backward seek, cues may be sent again as they replay. Rewind dedupes on `startSec` + `text`.
- Rewind never uses a cue that starts after `positionSec`, so answers can't run ahead of the viewer.

## `GET /v1/playback/{householdId}/answer`

The last answer Rewind gave Alexa, so the TV can show it as a card. It takes the same `Authorization` header as `POST /v1/playback`.

Response `200`

```json
{
  "answer": {
    "id": "7c5a74a3-7582-4572-b3b1-5e157ae9f776",
    "tool": "ask_about_show",
    "question": "Why is she mad at him?",
    "text": "Thom is leaving to chase his dream of going to space, and she thinks he's freaked out by her robot hand.",
    "ageMs": 4200
  }
}
```

Before anyone asks Alexa anything, the response is `{"answer": null}`.

| Field | Notes |
|---|---|
| `id` | New for every answer. Show a card only for an id you haven't shown yet. |
| `tool` | The MCP tool Alexa called: `recap_recent`, `who_is_on_screen`, `ask_about_show` or `whats_playing`. |
| `question` | The user's question. Only on `ask_about_show`. |
| `text` | Short text for display. Without the model, `recap_recent` gives the last two caption lines, and `ask_about_show` posts nothing because Alexa writes that answer itself. |
| `ageMs` | How old the answer is, measured on the server, so the TV's clock doesn't matter. |

Poll it every 2 seconds while the player is open, and only show answers younger than 30 seconds.

## Local development

The server listens on `http://localhost:8787`. Try it with:

```sh
curl -i http://localhost:8787/v1/playback \
  -H "Authorization: Bearer dev-device-key" \
  -H "Content-Type: application/json" \
  -d '{"householdId":"demo","contentId":"tears-of-steel","title":"Tears of Steel","positionSec":12,"state":"playing","cues":[]}'
```
