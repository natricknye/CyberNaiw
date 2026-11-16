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

The JSON still covers the five original poses. `index.ts` aliases the newer
adult states to the closest existing pose: run→walk, look/think→idle,
clap→wave, eat→idle, crouch→wave. The laugh (`happy`/`click`) is deliberately
never used by a left-click action. The HUD label, frame interval and action
duration still come from the real state, and the baby never uses these aliases.

## Classic skin

`naiwa-classic` is an `ImagePetSkin` using the cut-out original artwork in
`classic/`: adult idle/wave and baby idle/happy/wave are single PNGs, while the
adult happy/click sequence is `classic/laugh-hd/000`–`024.webp` at 90 ms per
frame. The 524×720 transparent WebP frames come from the 1080×1474
`naiwa-laugh.mp4` segment at 6.5–8.75 s: 25 frames are extracted, background
and floor shadow are removed, the character is padded by 3% and downscaled with
Lanczos, with no sharpening. `classic/laugh-hires/` keeps the 648×888 6×
upscale fallback built from the 180×180 MIT frames (`classic/laugh/`), and
`classic/laugh-cropped/` keeps the tight 108×148 crop. The video source has no
explicit redistribution licence in `SOURCES.md`; the project owner approved its
fan-use inclusion, and it can be swapped back to `laugh-hires` if needed.
`adult-idle-aligned.png` is the product standing frame: the original cut-out is
multiplied by 1.09 brightness and 0.80 colour, bringing its mean
luminance/saturation close to the Nailong action frames. `adult-idle.png` keeps
the unmodified cut-out.

Adult walk/run/look/think/clap/eat/crouch live in `classic/actions/<state>/`.
They come from the Nailong-Studio `pet/` MIT frame sequences, padded to a
180×210 canvas and bottom-aligned to y=204 (6 px bottom margin), so feet and
knees stay visible. Use `frameIntervalMsByState` for per-action cadence; the
global `frameIntervalMs` remains the laugh interval. Image skins may declare a
separate `babyFrames` map; otherwise the adult map is used for both ages.

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
