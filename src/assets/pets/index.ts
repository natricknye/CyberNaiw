import type { PetAnimationState } from "../../types/pet";
import {
  CYBER_NAIWA_BABY_FRAMES,
  CYBER_NAIWA_CYBER_BABY_FRAMES,
  CYBER_NAIWA_CYBER_FRAMES,
  CYBER_NAIWA_FRAMES,
} from "./cyber-naiwa/frames";
import adultIdle from "./classic/adult-idle.png";
import adultWave from "./classic/adult-wave.png";
import babyIdle from "./classic/baby-idle.png";
import babyHappy from "./classic/baby-happy.png";
import babyWave from "./classic/baby-wave.png";

const CLASSIC_LAUGH_MODULES = import.meta.glob("./classic/laugh-hires/*.webp", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const CLASSIC_LAUGH_FRAMES = Object.keys(CLASSIC_LAUGH_MODULES)
  .sort()
  .map((key) => CLASSIC_LAUGH_MODULES[key]);
const CLASSIC_HAPPY_FRAMES = CLASSIC_LAUGH_FRAMES;

export type PetSkinKind = "ascii" | "image";

interface PetSkinBase {
  id: string;
  name: string;
  /** Human-readable credit, shown in the future skin picker. */
  credit?: string;
}

export interface AsciiPetSkin extends PetSkinBase {
  kind: "ascii";
  frames: Record<PetAnimationState, readonly string[]>;
  babyFrames?: Record<PetAnimationState, readonly string[]>;
  /** Optional denser frame set used by the cyber palette. */
  cyberFrames?: Record<PetAnimationState, readonly string[]>;
  cyberBabyFrames?: Record<PetAnimationState, readonly string[]>;
}

export interface ImagePetSkin extends PetSkinBase {
  kind: "image";
  /**
   * Imported image URLs (PNG / WEBP / SVG, or one GIF per state).
   * Each state can have one or more frames.
   */
  frames: Record<PetAnimationState, readonly string[]>;
  babyFrames?: Record<PetAnimationState, readonly string[]>;
  frameIntervalMs?: number;
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
    frames: CYBER_NAIWA_FRAMES,
    babyFrames: CYBER_NAIWA_BABY_FRAMES,
    cyberFrames: CYBER_NAIWA_CYBER_FRAMES,
    cyberBabyFrames: CYBER_NAIWA_CYBER_BABY_FRAMES,
  },
  {
    id: "naiwa-classic",
    name: "奶家经典",
    kind: "image",
    credit:
      "Original Naiwa artwork; adult laugh frames from liaosongjie/Codex-Voice-Input (MIT)",
    frames: {
      idle: [adultIdle],
      walk: [adultIdle],
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
    frameIntervalMs: 90,
  },
];

export const DEFAULT_PET_SKIN_ID = "cyber-naiwa";

export function getPetSkin(id: string = DEFAULT_PET_SKIN_ID): PetSkin {
  return PET_SKINS.find((skin) => skin.id === id) ?? PET_SKINS[0];
}
