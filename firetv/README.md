# Rewind for Fire TV

The Fire TV half of [Rewind](../README.md). It plays the show and tells the Rewind server which captions have been on screen, so Alexa can catch you up without spoilers.

It's a Vega OS app built with React Native 0.72 and Amazon's W3C media player (`@amazon-devices/react-native-w3cmedia`).

## What it does

- Plays *Tears of Steel* with English captions. The film streams over HTTPS from Blender's mirrors, and if one fails, the next takes over. The captions are bundled into the app.
- Every 5 seconds while playing, and right away on play, pause, seek and end, it sends Rewind the playback position and the captions that appeared since the last update. The format is in the [playback API](../docs/api.md).
- A badge in the top-right corner shows whether Rewind is hearing it: "Rewind is listening", "Connecting to Rewind" or "Rewind is offline".

The app opens straight into the film.

| Remote button | What it does |
|---|---|
| Select or Play/Pause | Play or pause |
| Left or Rewind | Back 10 seconds |
| Right or Fast Forward | Ahead 10 seconds |
| Back | Leave the player |

## Only what's been on screen

Rewind's spoiler guarantee starts on the TV.

- Twice a second, the app collects the captions whose start time playback just passed.
- A jump of more than 5 seconds counts as a seek. Captions skipped by a seek are never collected, so fast-forwarding past a scene keeps it out of Rewind's memory.
- Updates go out one at a time and in order, so Rewind never gets an older position after a newer one. If Rewind can't be reached, the collected captions go out with the next update.

## Requirements

- macOS with [Homebrew](https://brew.sh). These steps were tested on an Apple silicon Mac.
- Node.js 18 or newer
- About 20 GB of free disk space for the Vega SDK

## Set up

1. Install Rosetta 2 (Apple silicon only) and the tools the Vega SDK needs:

   ```sh
   [[ $(arch) == "arm64" ]] && softwareupdate --install-rosetta --agree-to-license
   brew update && brew install binutils coreutils gawk findutils grep jq lz4 gnu-sed watchman
   ```

2. Install the Vega SDK. It includes the `vega` CLI and the Vega Virtual Device, a virtual Fire TV that runs on your Mac. The installer asks a few questions; press Enter to accept the defaults.

   ```sh
   curl -fsSL https://sdk-installer.vega.labcollab.net/get_vvm.sh | bash && source ~/vega/env
   vega --version
   ```

   `vega --version` should print an `Active SDK Version` and a `Vega CLI Version`. Rewind was built with SDK 0.24.

3. Install the app's packages:

   ```sh
   cd firetv
   npm install
   ```

Run the rest of the commands from `firetv/`.

## Configure

The app reads two settings from the `.env` file in the repo root, the same file `infra/deploy.sh` uses:

| Variable | Default | What it's for |
|---|---|---|
| `REWIND_API_URL` | The Rewind server on AWS Lambda | Where the app sends playback updates |
| `REWIND_DEVICE_KEY` | `dev-device-key`, which only a local server accepts | The key the server checks on every update |

Before each build, `scripts/write-env.js` writes them into `src/env.ts`. Git ignores that file, so the key never lands in the repo. Environment variables override `.env`. After changing either setting, build again.

## Build

```sh
npm run build:release
```

On an Apple silicon Mac, the package for the virtual device is `build/aarch64-release/rewind-firetv_aarch64.vpkg`. The same build makes `x86_64-release` for Intel Macs and `armv7-release` for a Fire TV Stick.

## Run it on the Vega Virtual Device

```sh
vega virtual-device start --timeout 300
vega run-app build/aarch64-release/rewind-firetv_aarch64.vpkg com.vhrcam.rewind.main --deviceId VirtualDevice
```

The first boot can be slow, so `--timeout` raises the wait from the default 60 seconds. `run-app` installs the app and opens it, and the film starts playing.

To restart the app without reinstalling it:

```sh
vega device terminate-app --appName com.vhrcam.rewind.main
vega device launch-app --appName com.vhrcam.rewind.main
```

When you're done:

```sh
vega virtual-device stop
```

## Check that Rewind hears it

Once the badge says "Rewind is listening", ask the server what it remembers. Fill in your server URL and device key:

```sh
curl -s <REWIND_API_URL>/v1/playback/demo -H "Authorization: Bearer <REWIND_DEVICE_KEY>"
```

The reply has the title, the position, how many captions Rewind has seen, the last minute of dialogue, and the recap that's ready for "what did I miss?".

## Use a local server

Start the server from the repo root (see the [main README](../README.md#run-it-locally)):

```sh
npm run dev
```

Then, from `firetv/`, build the app against it and run it again. The virtual device reaches your Mac at `10.0.2.2`, and the local server accepts `dev-device-key` unless you set `REWIND_DEVICE_KEY` for it.

```sh
REWIND_API_URL=http://10.0.2.2:8787 REWIND_DEVICE_KEY=dev-device-key npm run build:release
vega run-app build/aarch64-release/rewind-firetv_aarch64.vpkg com.vhrcam.rewind.main --deviceId VirtualDevice
```

Plain `http://` is fine for the server. Only the video has to be HTTPS. To check what the local server remembers:

```sh
curl -s http://localhost:8787/v1/playback/demo -H "Authorization: Bearer dev-device-key"
```

## Tests

```sh
npm test
npm run lint
npx tsc --noEmit
```

The tests cover the WebVTT parser (including the bundled Tears of Steel captions), the cue tracker (seeks never collect skipped lines), and the reporter (one update at a time, in order, with captions kept after a failed send).

## Captions

`src/captions/tearsOfSteel.ts` is generated from [`media/tears-of-steel.en.vtt`](../media/tears-of-steel.en.vtt). After changing the WebVTT file, run:

```sh
npm run captions
```

## Troubleshooting

| What you see | What to do |
|---|---|
| "Media error 4" on screen | Use an HTTPS video URL. The Vega media player rejects `http://` sources with this code, which looks like a file format error but isn't. |
| "Rewind is offline" | Check `REWIND_API_URL`, and that the device key matches the server's. A wrong key gets a 401. Then build and run the app again. |
| `vega virtual-device start` keeps waiting after the device window closed | Stop it with Ctrl+C and run it again. |

What else tripped us up building for Vega, with workarounds, is in [FRICTION.md](FRICTION.md).

## Project layout

| Path | What's in it |
|---|---|
| `src/screens/PlayerScreen.tsx` | The player: video, captions, controls, the Rewind badge and the remote |
| `src/player/usePlayback.ts` | Runs the media player: mirrors and retries, captions, and the updates |
| `src/playback/CueTracker.ts` | Collects the captions that were actually on screen |
| `src/playback/PlaybackReporter.ts` | Sends the updates to Rewind, in order |
| `src/captions/webvtt.ts` | WebVTT parser |
| `src/config.ts` | The film, its mirrors and the Rewind settings |
| `scripts/` | Build-time scripts for `.env` and the captions |
| `test/` | Unit tests |
| `manifest.toml` | Vega app manifest (`com.vhrcam.rewind`) |

## Credits

*Tears of Steel* is (CC) Blender Foundation, [mango.blender.org](https://mango.blender.org), licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/). Details are in [media/CREDITS.md](../media/CREDITS.md).
