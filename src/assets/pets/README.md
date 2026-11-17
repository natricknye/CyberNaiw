# Pet assets

All character artwork lives here. The app never downloads artwork at runtime.

## Default skin

`cyber-naiwa` is the default ASCII skin. 原色赛博 (Original Cyber) frames are
112×70 in `cyber-naiwa/naiwa-frames.json` and `naiwa-baby-frames.json`; 量子赛博
(Quantum Cyber) frames are 128×80 in `naiwa-cyber-frames.json` and
`naiwa-cyber-baby-frames.json`. `cyber-naiwa/frames.ts` imports the JSON, maps
characters to colour tones and declares frame timing. The grids use printable
ASCII only and were pixel-mapped from official reference images; those ASCII
reference images are not shipped in this repository.

The adult JSON now covers six base poses: idle/walk/happy/click/wave/beckon; the baby keeps the original five. `beckon`
has its own three-frame 112×70/128×80 conversion; `index.ts` aliases the other
newer adult states to the closest existing pose: run→walk, look/think→idle,
clap→wave, eat→idle, crouch→wave. The laugh (`happy`/`click`) is deliberately
never used by a left-click action. The HUD label, frame interval and action
duration still come from the real state, and the baby never uses these aliases.
Adult `wave` is regenerated from `classic/adult-wave.png` with a fixed 430 px
crop centred at (148,206), not by padding the old cut frames. The shadowed
shins use `%` (shade gold) and only the feet keep the brown `|` tone, so the
left knee and shin read as one continuous leg at 112×70 and 128×80. Adult
`beckon` is converted from the Nailong `招手-01/02/04` art with a fixed 230 px
crop centred at (63,99); warm hand/foot pixels misread as the mouth tone are
restored to `|`.

## Classic skin

`naiwa-classic` is an `ImagePetSkin` using the cut-out original artwork in
`classic/`: adult idle defaults to `classic/idle-chubby/00`–`05.png` (six
frames from the Nailong `待机-01–06` art, 180×210 with a 6 px bottom margin,
600 ms per frame; the loop starts on the most front-facing 06 and matches the
walk/run art style). `adult-idle-aligned.png` remains the tall front fallback, and
`classic/idle/00`–`05.png` keeps the 3/4 side-facing alternative. Wave and baby
idle/happy/wave remain single cut-out PNGs; the three baby images were re-cropped from the
official juvenile sheet with a 14 px inner margin so hands, feet, and knees are
not sliced. The
adult happy/click sequence is `classic/laugh-hd/000`–`024.webp` at 164 ms per
frame (25 × 164 ms ≈ 4.10 s, matching the 4.11 s laugh audio): 25 frames from
the 1080×1474 `naiwa-laugh.mp4` at 6.5–8.75 s, with the
white background, floor shadow, and white crotch gap removed, 3% padding and
Lanczos downscale to 524×720, no sharpening. `classic/laugh-hires/` keeps the
648×888 6× MIT upscale fallback and `classic/laugh-cropped/` keeps the tight
108×148 crop. `adult-idle-aligned.png` is now only a fallback/reference: the
tall cut-out with ×1.14 brightness and ×0.78 colour; `adult-idle.png` keeps the
unmodified cut-out.

Adult walk/run/look/think/wait/review/clap/beckon/crouch live in
`classic/actions/<state>/`. They come from the Nailong-Studio `pet/` MIT frame
sequences (wait/review use the Codex waiting/review APNGs), padded to a 180×210
canvas and bottom-aligned to y=204 (6 px bottom margin), so feet and knees stay
visible. Beckon uses the three `招手-01/02/04` frames at 220 ms per frame. The
`eat` frames stay in the library but are not wired to
the left-click stack: the open-mouth head-back pose reads as a laugh. Use
`frameIntervalMsByState` for per-action cadence; the global `frameIntervalMs`
remains the laugh interval. Image skins may declare a separate `babyFrames`
map; otherwise the adult map is used for both ages. Lie-down lives in
`classic/lie/00–01.png` on a 560×340 (2×) canvas at 800 ms per frame; the
source went through OpenCV FSRCNN x4 super-resolution, bilateral filtering and
alpha anti-aliasing to remove jaggies and the light ground line.

## Adding an image skin

1. Create a folder, for example `src/assets/pets/milk-frog/`.
2. Add one transparent PNG / WEBP / SVG per state, or a frame sequence:
   `idle-1.png`, `idle-2.png`, `walk-1.png`, ...
3. Import the images in `index.ts` and register a new `ImagePetSkin`:

```ts
import idle1 from "./milk-frog/idle-1.png";
import idle2 from "./milk-frog/idle-2.png";
import walk1 from "./milk-frog/walk-1.png";
import happy1 from "./milk-frog/happy-1.png";
import click1 from "./milk-frog/click-1.png";
import wave1 from "./milk-frog/wave-1.png";

{
  id: "milk-frog",
  name: "Milk Frog",
  kind: "image",
  credit: "Artist name / licence",
  frames: {
    idle: [idle1, idle2],
    walk: [walk1],
    happy: [happy1],
    click: [click1],
    wave: [wave1],
  },
  frameIntervalMs: 320,
}
```

4. Change `DEFAULT_PET_SKIN_ID`, or add a skin picker later. The renderer
   already supports both skin kinds.

## Asset rules

- Keep transparent backgrounds; the window is transparent.
- A good source size is 512 × 512 px or larger. The window is 320 × 300 logical
  pixels at 100%, and the art is scaled with `object-fit: contain`.
- Only add assets you have the right to redistribute. Include the artist and
  licence in the skin's `credit` field.
- Animated GIFs work, but the app's `animationsEnabled` setting cannot pause a
  GIF. Prefer frame sequences so the setting stays consistent.
