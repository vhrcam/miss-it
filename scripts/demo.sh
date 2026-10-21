#!/usr/bin/env bash
# Sets up Rewind's demo on a Mac: the Fire TV app in the Vega Virtual Device,
# next to the simulated Alexa+ page in Chrome, both talking to the live server.
#
#   scripts/demo.sh start   start the virtual Fire TV, build and open the app,
#                           then start the Alexa+ page and open it in Chrome
#   scripts/demo.sh play    press Play on the TV
#   scripts/demo.sh stop    stop the Alexa+ page and the virtual Fire TV
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STATE="${TMPDIR:-/tmp}/rewind-demo"
PAGE_URL=http://localhost:5173
APP_ID=com.vhrcam.rewind.main
ARCH=$([[ "$(uname -m)" == arm64 ]] && echo aarch64 || echo x86_64)
VPKG="$ROOT/firetv/build/$ARCH-release/rewind-firetv_$ARCH.vpkg"

say() { printf '%s\n' "$*"; }
fail() {
  printf 'demo: %s\n' "$*" >&2
  exit 1
}

# The Vega CLI starts most of its output with a timestamped [INFO] line.
vega_quiet() { vega "$@" 2>&1 | { grep -v '\[INFO\]' || true; }; }

load_vega() {
  [[ -f "$HOME/vega/env" ]] || fail "The Vega SDK isn't installed. See firetv/README.md."
  # shellcheck source=/dev/null
  source "$HOME/vega/env"
  command -v vega >/dev/null || fail "Loaded ~/vega/env, but the vega command still isn't available."
}

check() {
  load_vega
  [[ -d "$ROOT/firetv/node_modules" ]] || fail "Run npm install in firetv/ first."
  [[ -d "$ROOT/alexa-sim/node_modules" ]] || fail "Run npm install in alexa-sim/ first."
  grep -qE '^MISS_IT_DEVICE_KEY=.+' "$ROOT/.env" 2>/dev/null ||
    fail "Set MISS_IT_DEVICE_KEY in .env to the key the Rewind server expects. See the main README."
}

start() {
  check
  mkdir -p "$STATE"

  if [[ "$(vega virtual-device status 2>/dev/null)" == *'"running":true'* ]]; then
    say "The virtual Fire TV is already running."
  else
    say "Starting the virtual Fire TV..."
    (cd "$HOME" && vega_quiet virtual-device start --timeout 300)
  fi

  say "Building the Fire TV app..."
  (cd "$ROOT/firetv" && npm run build:release >"$STATE/firetv-build.log" 2>&1) ||
    fail "The Fire TV build failed. See $STATE/firetv-build.log."
  vega_quiet run-app "$VPKG" "$APP_ID" --deviceId VirtualDevice

  if [[ -f "$STATE/page.pid" ]] && kill -0 "$(cat "$STATE/page.pid")" 2>/dev/null; then
    say "The Alexa+ page is already running."
  else
    say "Starting the Alexa+ page..."
    (cd "$ROOT/alexa-sim" && exec nohup node_modules/.bin/vite --port 5173 --strictPort >"$STATE/page.log" 2>&1) &
    echo $! >"$STATE/page.pid"
    for _ in $(seq 1 40); do
      curl -fs -o /dev/null "$PAGE_URL" && break
      sleep 0.25
    done
    curl -fs -o /dev/null "$PAGE_URL" || fail "The Alexa+ page didn't start. See $STATE/page.log."
  fi

  if [[ -d "/Applications/Google Chrome.app" ]]; then
    open -a "Google Chrome" "$PAGE_URL"
  else
    open "$PAGE_URL"
    say "Voice needs Chrome. In other browsers, type the questions."
  fi

  cat <<EOF

The demo is ready. For a side-by-side recording, put the virtual Fire TV on
the left and Chrome on the right.

  1. Press Play on the TV:  scripts/demo.sh play
  2. In Chrome, press the mic (allow it the first time) and ask:
       "Alexa, what did I miss?"
       "Alexa, who's that?"
       "Alexa, why is she mad at him?"
     The TV shows each answer on a card while Alexa says it.
  3. When you're done:  scripts/demo.sh stop
EOF
}

play() {
  load_vega
  vega_quiet device run-cmd -c 'inputd-cli button_press KEY_ENTER' >/dev/null
  say "Pressed Play on the TV."
}

stop() {
  if [[ -f "$STATE/page.pid" ]]; then
    if kill "$(cat "$STATE/page.pid")" 2>/dev/null; then
      say "Stopped the Alexa+ page."
    fi
    rm -f "$STATE/page.pid"
  fi
  load_vega
  vega_quiet virtual-device stop >/dev/null || true
  say "Stopped the virtual Fire TV."
}

case "${1:-}" in
  start) start ;;
  play) play ;;
  stop) stop ;;
  *)
    say "Usage: scripts/demo.sh start | play | stop"
    exit 1
    ;;
esac
