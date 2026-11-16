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
clap/eat→happy, crouch→wave. The HUD label, frame interval and action duration
still come from the real state, and the baby never uses these aliases.

## Classic skin

`naiwa-classic` is an `ImagePetSkin` using the cut-out original artwork in
`classic/`: adult idle/wave and baby idle/happy/wave are single PNGs, while the
adult happy/click sequence is `classic/laugh-hires/000`–`024.webp` at 90 ms per
frame. The 648×888 transparent WebP frames are 6× Lanczos upscales of the
108×148 tight crop (`classic/laugh-cropped/`) with no extra sharpening;
`classic/laugh/` keeps the original 180×180 MIT frames. The crop removes the
transparent margins so the laugh body matches the idle height, and the upscale
keeps the edges clean at the window sizes the app supports.

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
