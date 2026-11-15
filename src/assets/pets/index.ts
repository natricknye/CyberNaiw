import type { PetAnimationState } from "../../types/pet";
import { CYBER_NAIWA_FRAMES } from "./cyber-naiwa/frames";

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
}

export interface ImagePetSkin extends PetSkinBase {
  kind: "image";
  /**
   * Imported image URLs (PNG / WEBP / SVG, or one GIF per state).
   * Each state can have one or more frames.
   */
  frames: Record<PetAnimationState, readonly string[]>;
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
  },
];

export const DEFAULT_PET_SKIN_ID = "cyber-naiwa";

export function getPetSkin(id: string = DEFAULT_PET_SKIN_ID): PetSkin {
  return PET_SKINS.find((skin) => skin.id === id) ?? PET_SKINS[0];
}
