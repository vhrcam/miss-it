#!/usr/bin/env bash
# Makes the app's images from Tears of Steel. Needs ffmpeg and the local film
# from media/fetch.sh.
set -euo pipefail

cd "$(dirname "$0")/.."
FILM=../media/tears-of-steel.mp4
OUT=src/assets
mkdir -p "$OUT"

# The Home backdrop is the Amsterdam skyline at 5:30. Vega has no gradient
# view, so the shading behind the title and the hints is baked into the still.
LEFT="if(lt(X/W,0.34),0.97-0.07*X/W/0.34,if(lt(X/W,0.6),0.9-0.45*(X/W-0.34)/0.26,if(lt(X/W,0.84),0.45-0.4*(X/W-0.6)/0.24,0.05)))"
BOTTOM="if(gt(H-1-Y,460),0,if(lt((H-1-Y)/460,0.45),1-0.28*(H-1-Y)/460/0.45,0.72-0.72*((H-1-Y)/460-0.45)/0.55))"

ffmpeg -v error -y -ss 330 -i "$FILM" -f lavfi -i color=c=0x0B0D12:s=1920x1080:d=1 -filter_complex \
  "[0:v]scale=-2:1080:flags=lanczos,crop=1920:1080:iw-1920:0,format=rgba[still];
   [1:v]format=rgba,geq=r=11:g=13:b=18:a='255*(1-(1-($LEFT))*(1-($BOTTOM)))'[shade];
   [still][shade]overlay" -frames:v 1 -q:v 3 "$OUT/home.jpg"

# The fades that darken the video behind the player controls.
ffmpeg -v error -y -f lavfi -i color=c=black:s=1920x280:d=1 \
  -vf "format=rgba,geq=r=0:g=0:b=0:a='204*(1-Y/(H-1))'" -frames:v 1 -pix_fmt rgba "$OUT/fade-top.png"
ffmpeg -v error -y -f lavfi -i color=c=black:s=1920x480:d=1 \
  -vf "format=rgba,geq=r=0:g=0:b=0:a='255*if(lt((H-1-Y)/(H-1),0.5),0.94-0.64*(H-1-Y)/(H-1),1.24-1.24*(H-1-Y)/(H-1))'" \
  -frames:v 1 -pix_fmt rgba "$OUT/fade-bottom.png"

echo "Wrote $OUT/home.jpg, $OUT/fade-top.png and $OUT/fade-bottom.png"
