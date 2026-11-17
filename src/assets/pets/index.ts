import type { PetAnimationState } from "../../types/pet";
import {
  CYBER_NAIWA_BABY_FRAMES,
  CYBER_NAIWA_CYBER_BABY_FRAMES,
  CYBER_NAIWA_CYBER_FRAMES,
  CYBER_NAIWA_FRAMES,
} from "./cyber-naiwa/frames";
import adultIdle from "./classic/adult-idle-aligned.png";
import adultWave from "./classic/adult-wave.png";
import babyIdle from "./classic/baby-idle.png";
import babyHappy from "./classic/baby-happy.png";
import babyWave from "./classic/baby-wave.png";

type FrameMap = Partial<Record<PetAnimationState, readonly string[]>>;

const CLASSIC_LAUGH_MODULES = import.meta.glob("./classic/laugh-hd/*.webp", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const CLASSIC_LAUGH_FRAMES = Object.keys(CLASSIC_LAUGH_MODULES)
  .sort()
  .map((key) => CLASSIC_LAUGH_MODULES[key]);
const CLASSIC_HAPPY_FRAMES = CLASSIC_LAUGH_FRAMES;

const CLASSIC_IDLE_MODULES = import.meta.glob(
  "./classic/idle-chubby/*.png",
  { eager: true, import: "default" },
) as Record<string, string>;

const CLASSIC_IDLE_FRAMES = Object.keys(CLASSIC_IDLE_MODULES)
  .sort()
  .map((key) => CLASSIC_IDLE_MODULES[key]);

const CLASSIC_LIE_MODULES = import.meta.glob(
  "./classic/lie/*.png",
  { eager: true, import: "default" },
) as Record<string, string>;

const CLASSIC_LIE_FRAMES = Object.keys(CLASSIC_LIE_MODULES)
  .sort()
  .map((key) => CLASSIC_LIE_MODULES[key]);

const CLASSIC_ACTION_MODULES = import.meta.glob(
  "./classic/actions/*/*.png",
  { eager: true, import: "default" },
) as Record<string, string>;

const CLASSIC_ACTION_FRAMES: Record<string, string[]> = {};
for (const key of Object.keys(CLASSIC_ACTION_MODULES).sort()) {
  const match = key.match(/actions\/([^/]+)\//);
  if (!match) {
    continue;
  }
  (CLASSIC_ACTION_FRAMES[match[1]] ??= []).push(
    CLASSIC_ACTION_MODULES[key],
  );
}

// The adult action stack is shared by all three art forms. Most ASCII actions
// still reuse the closest existing pose; `beckon` has its own three-frame
// conversion. Never point a left-click action at happy/click: those frames are
// the laugh, and the laugh must only be reachable through right-click.
const ADULT_ASCII_FRAMES: FrameMap = {
  ...CYBER_NAIWA_FRAMES,
  run: CYBER_NAIWA_FRAMES.walk,
  look: CYBER_NAIWA_FRAMES.idle,
  think: CYBER_NAIWA_FRAMES.idle,
  wait: CYBER_NAIWA_FRAMES.idle,
  review: CYBER_NAIWA_FRAMES.idle,
  clap: CYBER_NAIWA_FRAMES.wave,
  eat: CYBER_NAIWA_FRAMES.idle,
  crouch: CYBER_NAIWA_FRAMES.wave,
  lie: CYBER_NAIWA_FRAMES.crouch,
};

const ADULT_ASCII_CYBER_FRAMES: FrameMap = {
  ...CYBER_NAIWA_CYBER_FRAMES,
  run: CYBER_NAIWA_CYBER_FRAMES.walk,
  look: CYBER_NAIWA_CYBER_FRAMES.idle,
  think: CYBER_NAIWA_CYBER_FRAMES.idle,
  wait: CYBER_NAIWA_CYBER_FRAMES.idle,
  review: CYBER_NAIWA_CYBER_FRAMES.idle,
  clap: CYBER_NAIWA_CYBER_FRAMES.wave,
  eat: CYBER_NAIWA_CYBER_FRAMES.idle,
  crouch: CYBER_NAIWA_CYBER_FRAMES.wave,
  lie: CYBER_NAIWA_CYBER_FRAMES.crouch,
};

export type PetSkinKind = "ascii" | "image";

interface PetSkinBase {
  id: string;
  name: string;
  /** Human-readable credit, shown in the future skin picker. */
  credit?: string;
}

export interface AsciiPetSkin extends PetSkinBase {
  kind: "ascii";
  frames: FrameMap;
  babyFrames?: FrameMap;
  /** Optional denser frame set used by the cyber palette. */
  cyberFrames?: FrameMap;
  cyberBabyFrames?: FrameMap;
}

export interface ImagePetSkin extends PetSkinBase {
  kind: "image";
  /**
   * Imported image URLs (PNG / WEBP / SVG, or one GIF per state).
   * Each state can have one or more frames.
   */
  frames: FrameMap;
  babyFrames?: FrameMap;
  frameIntervalMs?: number;
  frameIntervalMsByState?: Partial<Record<PetAnimationState, number>>;
}

export type PetSkin = AsciiPetSkin | ImagePetSkin;

/**
 * Register new character skins here. The first entry is used by default.
 * A skin can be ASCII (default, no external assets) or a local image sequence.
 */
export const PET_SKINS: readonly PetSkin[] = [
  {
    id: "cyber-naiwa",
    name: "Cyber Naiwa",
    kind: "ascii",
    credit: "Original ASCII art for CyberNaiwa",
    frames: ADULT_ASCII_FRAMES,
    babyFrames: CYBER_NAIWA_BABY_FRAMES,
    cyberFrames: ADULT_ASCII_CYBER_FRAMES,
    cyberBabyFrames: CYBER_NAIWA_CYBER_BABY_FRAMES,
  },
  {
    id: "naiwa-classic",
    name: "奶家经典",
    kind: "image",
    credit:
      "Original Naiwa artwork; adult laugh frames from liaosongjie/Codex-Voice-Input (MIT); action frames from Nailong-Studio/NaiWa-Wallpaper; wait/review frames from timerring/codex-pet-naiwa",
    frames: {
      idle:
        CLASSIC_IDLE_FRAMES.length > 0 ? CLASSIC_IDLE_FRAMES : [adultIdle],
      beckon: CLASSIC_ACTION_FRAMES.beckon ?? [adultIdle],
      lie: CLASSIC_LIE_FRAMES.length > 0 ? CLASSIC_LIE_FRAMES : [adultIdle],
      walk: CLASSIC_ACTION_FRAMES.walk ?? [adultIdle],
      run: CLASSIC_ACTION_FRAMES.run ?? [adultIdle],
      look: CLASSIC_ACTION_FRAMES.look ?? [adultIdle],
      think: CLASSIC_ACTION_FRAMES.think ?? [adultIdle],
      wait: CLASSIC_ACTION_FRAMES.wait ?? [adultIdle],
      review: CLASSIC_ACTION_FRAMES.review ?? [adultIdle],
      clap: CLASSIC_ACTION_FRAMES.clap ?? [adultIdle],
      eat: CLASSIC_ACTION_FRAMES.eat ?? [adultIdle],
      crouch: CLASSIC_ACTION_FRAMES.crouch ?? [adultIdle],
      happy: CLASSIC_HAPPY_FRAMES,
      click: CLASSIC_HAPPY_FRAMES,
      wave: [adultWave],
    },
    babyFrames: {
      idle: [babyIdle],
      walk: [babyIdle],
      happy: [babyHappy],
      click: [babyHappy],
      wave: [babyWave],
    },
    frameIntervalMs: 164,
    frameIntervalMsByState: {
      idle: 600,
      beckon: 220,
      lie: 800,
      walk: 140,
      run: 90,
      look: 220,
      think: 260,
      wait: 150,
      review: 150,
      clap: 110,
      eat: 180,
      crouch: 160,
    },
  },
];

export const DEFAULT_PET_SKIN_ID = "cyber-naiwa";

export function getPetSkin(id: string = DEFAULT_PET_SKIN_ID): PetSkin {
  return PET_SKINS.find((skin) => skin.id === id) ?? PET_SKINS[0];
}
