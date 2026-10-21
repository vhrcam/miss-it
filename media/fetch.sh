#!/usr/bin/env bash
# Downloads Tears of Steel and its English subtitles from Blender's mirrors,
# then converts them to what Miss It? plays: MP4 (H.264 + AAC) and WebVTT.
set -euo pipefail

cd "$(dirname "$0")"

MIRRORS=(
  https://ftp.nluug.nl/pub/graphics/blender/demo/movies/ToS
  https://ftp.halifax.rwth-aachen.de/blender/demo/movies/ToS
  https://mirrors.dotsrc.org/blender/blender-demo/movies/ToS
)

fetch() {
  for mirror in "${MIRRORS[@]}"; do
    curl -fL --retry 3 -C - -o "$2" "$mirror/$1" && return 0
  done
  echo "Couldn't download $1 from any mirror." >&2
  return 1
}

command -v ffmpeg >/dev/null || { echo "ffmpeg is required: brew install ffmpeg" >&2; exit 1; }

if [[ ! -f tears-of-steel.mp4 ]]; then
  fetch tears_of_steel_720p.mov tears_of_steel_720p.mov
  ffmpeg -v error -i tears_of_steel_720p.mov -map 0:v:0 -map 0:a:0 \
    -c:v copy -c:a aac -b:a 160k -movflags +faststart tears-of-steel.mp4
  rm tears_of_steel_720p.mov
fi

if [[ ! -f tears-of-steel.en.vtt ]]; then
  fetch subtitles/TOS-en.srt TOS-en.srt
  ffmpeg -v error -i TOS-en.srt tears-of-steel.en.vtt
  rm TOS-en.srt
fi

echo "Ready: media/tears-of-steel.mp4 and media/tears-of-steel.en.vtt"
