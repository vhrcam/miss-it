# Playback API

The Fire TV app reports what's playing so Rewind can answer questions about it. Rewind only ever uses what has already been on screen.

## `POST /v1/playback`

Headers

```
Content-Type: application/json
Authorization: Bearer <REWIND_DEVICE_KEY>
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

## Local development

The server listens on `http://localhost:8787`. Try it with:

```sh
curl -i http://localhost:8787/v1/playback \
  -H "Authorization: Bearer dev-device-key" \
  -H "Content-Type: application/json" \
  -d '{"householdId":"demo","contentId":"tears-of-steel","title":"Tears of Steel","positionSec":12,"state":"playing","cues":[]}'
```
