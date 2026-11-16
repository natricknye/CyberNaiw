import rawFrames from "./naiwa-frames.json";
import rawBabyFrames from "./naiwa-baby-frames.json";
import rawCyberFrames from "./naiwa-cyber-frames.json";
import rawCyberBabyFrames from "./naiwa-cyber-baby-frames.json";
import type { PetAnimationState } from "../../../types/pet";

/**
 * Original-colour frames are 112 × 70; the cyber palette uses a denser
 * 128 × 80 grid so its fine terminal lines stay sharp. Both sets share the
 * same five states; adult happy/click use 25 frames, the rest use two.
 */
export const CYBER_NAIWA_FRAMES = rawFrames as Record<
  PetAnimationState,
  readonly string[]
>;

export const CYBER_NAIWA_BABY_FRAMES = rawBabyFrames as Record<
  PetAnimationState,
  readonly string[]
>;

export const CYBER_NAIWA_CYBER_FRAMES = rawCyberFrames as Record<
  PetAnimationState,
  readonly string[]
>;

export const CYBER_NAIWA_CYBER_BABY_FRAMES = rawCyberBabyFrames as Record<
  PetAnimationState,
  readonly string[]
>;

export type AsciiTone =
  | "body"
  | "light"
  | "shade"
  | "belly"
  | "eye"
  | "pupil"
  | "mouth"
  | "teeth"
  | "mouthline"
  | "limb"
  | "accent"
  | "empty";

export function toneForChar(char: string): AsciiTone {
  switch (char) {
    case "#":
      return "body";
    case "&":
      return "light";
    case "%":
      return "shade";
    case "+":
      return "belly";
    case "O":
    case "~":
    case "^":
      return "eye";
    case "@":
      return "pupil";
    case "_":
      return "mouth";
    case "=":
      return "teeth";
    case "-":
      return "mouthline";
    case "/":
    case "\\":
    case "|":
      return "limb";
    case "*":
    case "!":
      return "accent";
    default:
      return "empty";
  }
}

// Adult laugh: 25 frames at 90 ms = the source GIF's 2.25 s loop.
export const FRAME_INTERVAL_MS: Record<PetAnimationState, number> = {
  idle: 1200,
  walk: 260,
  happy: 90,
  click: 90,
  wave: 500,
};

// The baby has only two frames per state; keep the slower original cadence.
export const BABY_FRAME_INTERVAL_MS: Record<PetAnimationState, number> = {
  idle: 1200,
  walk: 260,
  happy: 320,
  click: 180,
  wave: 500,
};
