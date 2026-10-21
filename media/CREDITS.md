# Media credits

The Miss It? demo plays **Tears of Steel**, a short film by the Blender Foundation.

> (CC) Blender Foundation | mango.blender.org

The film and its subtitles are licensed under [Creative Commons Attribution 3.0](https://creativecommons.org/licenses/by/3.0/). The film's standalone soundtrack files are licensed separately ([CC BY-ND 3.0](https://creativecommons.org/licenses/by-nd/3.0/), (C) Joram Letwory, www.tearsofsteel.org). Miss It? doesn't use them.

## How Miss It? uses it

- The Fire TV app streams the original 720p film from Blender's mirrors, unchanged.
- `tears-of-steel.en.vtt` is Blender's English subtitle file (`TOS-en.srt`) converted from SRT to WebVTT. The text and timings are unchanged.
- `fetch.sh` downloads a local copy for the Miss It? server: the 720p film with its audio re-encoded from MP3 to AAC in an MP4 container (`tears-of-steel.mp4`, about 370 MB, not committed). Nothing is cut or edited.
- The Fire TV Home screen shows a still from 5:30, the Amsterdam skyline, cropped to 16:9 and darkened on the left and bottom so the text stays readable. `firetv/scripts/make-images.sh` makes it from the local copy.

## Get the files

```sh
./media/fetch.sh
```

Needs `curl` and `ffmpeg`.
