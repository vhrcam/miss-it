# Fire TV friction notes

What got in the way while building the Vega app, in the order we hit it. Severity: **High** blocks progress, **Medium** costs hours or changes the design, **Low** is an annoyance.

## 1. The default template's media player is still an alpha

| | |
|---|---|
| **Task** | Start a Vega app that plays video with the W3C media player. |
| **Steps** | `vega project list-templates` shows `helloWorld` (React Native 0.83) first and `helloWorld-rn72` second. `npm view @amazon-devices/react-native-w3cmedia dist-tags` shows `latest: 2.3.2` and `rn83-alpha: 2.3.4-rn-83`. |
| **Expected** | The default template works with the stable media package. |
| **Actual** | The React Native 0.83 build of the media package is only published under an alpha tag. Nothing in the template list says so. |
| **Severity** | Low. We caught it before writing code. |
| **Workaround** | Generated the project from `helloWorld-rn72` and used `react-native-w3cmedia` 2.3.2. |
| **Suggestion** | Note in `list-templates` (or the media player docs) which template the stable media packages support. |

## 2. Closing the virtual device window leaves `start` waiting

| | |
|---|---|
| **Task** | Boot the Vega Virtual Device. |
| **Steps** | `vega virtual-device start --timeout 300`, then the device window was closed while it booted. |
| **Expected** | `start` notices the emulator exited and fails right away. |
| **Actual** | `vega virtual-device status` reported `"running": false`, but `start` kept waiting for the full timeout. |
| **Severity** | Low. |
| **Workaround** | Stopped the waiting command and ran `start` again. The second boot took 14 seconds. |
| **Suggestion** | Watch the emulator process during `start` and exit with an error if it dies. |

## 3. `http://` video fails with error 4 and no request

| | |
|---|---|
| **Task** | Play an MP4 in `VideoPlayer` (URL mode) from a dev server on the Mac. |
| **Steps** | Set `player.src` to `http://10.0.2.2:8788/tears-of-steel.mp4`, then to `http://localhost:8788/...` with `vega device start-port-forwarding -p 8788 -f false`. |
| **Expected** | The video plays, or an error that says plain HTTP isn't allowed. |
| **Actual** | Both fire `error` with `MediaError` code 4 (`MEDIA_ERR_SRC_NOT_SUPPORTED`). The server never gets a request, and no log line says why. The same app's `fetch()` to the same server works, and an `https://` MP4 plays. |
| **Severity** | High. Playback was blocked for about 40 minutes, and the code 4 pointed at the file format instead of the URL scheme. |
| **Workaround** | Stream the film over HTTPS from Blender's mirrors, and bundle the captions in the app. |
| **Suggestion** | Say in the media player docs that sources must be HTTPS, and log the reason when a URL is rejected. Allowing `http://` on the virtual device would make local testing much easier. |

## 4. App logs are suppressed at startup

| | |
|---|---|
| **Task** | Read the app's logs to debug item 3. |
| **Steps** | `vda shell journalctl ...` answers "journalctl is not supported in developer mode shell. Please use loggingctl instead." `loggingctl log -v com.vhrcam.rewind` shows "Log suppression ended at level [info]. [52] logs were suppressed", and the media player logs `hasEnded` twice a second. `loggingctl config --set-rate com.vhrcam.rewind 100000` returns `"status": "failed"`. |
| **Expected** | An app's own warnings are always visible in developer mode. |
| **Actual** | Startup logs were dropped, and our own `console.warn` calls never showed up. |
| **Severity** | Medium. It made item 3 much slower to find. |
| **Workaround** | Showed the media error code on screen, and took screenshots. |
| **Suggestion** | Don't rate-limit warnings and errors from the app being debugged, make `--set-rate` work for developer apps, and quiet the media player's `hasEnded` logging. |

## 5. No screenshot command

| | |
|---|---|
| **Task** | Take screenshots of the app on the virtual device to check the UI and for the submission. |
| **Steps** | Looked through `vega device --help` and `vda help`. |
| **Expected** | Something like `vega device screenshot`. |
| **Actual** | There isn't one. |
| **Severity** | Low. |
| **Workaround** | The virtual device runs on the Android emulator, so its console on port 5554 accepts `screenrecord screenshot <dir>` after `auth <token from ~/.emulator_console_auth_token>`. |
| **Suggestion** | Add `vega device screenshot`, for the virtual device at least. |

## 6. The docs disagree about captions

| | |
|---|---|
| **Task** | Show WebVTT captions the app parsed itself. |
| **Steps** | Read the `react-native-w3cmedia` README and the "Implement Closed Captions" guide. |
| **Expected** | One consistent story. |
| **Actual** | The README lists `addTextTrack` as unsupported and says captions only render after `vdcm set com.amazon.devconf/system/accessibility/ClosedCaptioningEnabled 1`. The guide uses `addTextTrack`. On the virtual device, `addTextTrack` + `VTTCue` + `KeplerCaptionsView` rendered captions without the `vdcm` setting. |
| **Severity** | Low. |
| **Workaround** | Followed the guide. |
| **Suggestion** | Update the README to match the guide. |
