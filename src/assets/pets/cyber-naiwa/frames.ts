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
export const CYBER_NAIWA_FRAMES = rawFrames as Partial<
  Record<PetAnimationState, readonly string[]>
>;

export const CYBER_NAIWA_BABY_FRAMES = rawBabyFrames as Partial<
  Record<PetAnimationState, readonly string[]>
>;

export const CYBER_NAIWA_CYBER_FRAMES = rawCyberFrames as Partial<
  Record<PetAnimationState, readonly string[]>
>;

export const CYBER_NAIWA_CYBER_BABY_FRAMES = rawCyberBabyFrames as Partial<
  Record<PetAnimationState, readonly string[]>
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

// Adult laugh: 25 frames at 164 ms ≈ 4.10 s, matching the 4.11 s laugh audio.
// Most new adult actions reuse the closest existing ASCII pose but keep their
// own cadence; `beckon` has a dedicated three-frame wave.
export const FRAME_INTERVAL_MS: Record<PetAnimationState, number> = {
  idle: 1200,
  walk: 260,
  happy: 164,
  click: 164,
  wave: 500,
  beckon: 350,
  run: 130,
  look: 300,
  think: 350,
  wait: 500,
  review: 350,
  clap: 160,
  eat: 260,
  crouch: 500,
  lie: 500,
};

// The baby has only two frames per state; keep the slower original cadence.
export const BABY_FRAME_INTERVAL_MS: Record<PetAnimationState, number> = {
  idle: 1200,
  walk: 260,
  happy: 320,
  click: 180,
  wave: 500,
  beckon: 350,
  run: 260,
  look: 500,
  think: 500,
  wait: 500,
  review: 500,
  clap: 320,
  eat: 320,
  crouch: 500,
  lie: 500,
};
