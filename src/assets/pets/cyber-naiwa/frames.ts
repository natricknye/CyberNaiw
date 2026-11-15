import rawFrames from "./naiwa-frames.json";
import type { PetAnimationState } from "../../../types/pet";

/**
 * 64 × 40 pixel-mapped ASCII frames. The base frame is a pixel restoration of
 * the yellow 奶蛙 reference; the mouth is filled/opened programmatically for
 * the different states. Every frame is exactly 64 characters wide and
 * 40 lines tall.
 */
export const CYBER_NAIWA_FRAMES = rawFrames as Record<
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
  | "limb"
  | "accent"
  | "sleep"
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
    case "-":
      return "pupil";
    case "_":
      return "mouth";
    case "/":
    case "\\":
    case "|":
      return "limb";
    case "*":
    case "!":
      return "accent";
    case "z":
    case "Z":
      return "sleep";
    default:
      return "empty";
  }
}

export const FRAME_INTERVAL_MS: Record<PetAnimationState, number> = {
  idle: 1200,
  walk: 260,
  sleep: 1300,
  happy: 320,
  click: 180,
};
