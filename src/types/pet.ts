export const PET_ANIMATION_STATES = [
  "idle",
  "walk",
  "happy",
  "click",
  "wave",
  "beckon",
  "run",
  "look",
  "think",
  "clap",
  "eat",
  "crouch",
  "lie",
] as const;

export type PetAnimationState = (typeof PET_ANIMATION_STATES)[number];

export type Language = "zh" | "en";

export type PetAge = "adult" | "baby";

export type PetPalette = "original" | "cyber" | "classic";

export type NaiwaVoice =
  | "andi"
  | "gaga"
  | "ganbade"
  | "laugh"
  | "ola"
  | "gajiucai";

export interface NaiwaReaction {
  text: string;
  voice: NaiwaVoice;
}

export interface PetSettings {
  alwaysOnTop: boolean;
  scale: number;
  animationsEnabled: boolean;
  soundEnabled: boolean;
  language: Language;
  age: PetAge;
  palette: PetPalette;
}

export interface WindowPosition {
  x: number;
  y: number;
}

export const DEFAULT_SETTINGS: PetSettings = {
  alwaysOnTop: true,
  scale: 1,
  animationsEnabled: true,
  soundEnabled: true,
  language: "zh",
  age: "adult",
  palette: "cyber",
};

export const MIN_PET_SCALE = 0.7;
export const MAX_PET_SCALE = 1.5;

/**
 * Logical size of the pet window at 100% scale.
 * The ASCII renderer scales with the viewport, so the art fills the window.
 */
export const PET_WINDOW_BASE_WIDTH = 380;
export const PET_WINDOW_BASE_HEIGHT = 420;

export const PET_STATE_LABELS: Record<PetAnimationState, string> = {
  idle: "IDLE",
  walk: "WALK",
  happy: "HAPPY",
  click: "CLICK",
  wave: "STANCE",
  beckon: "BECKON",
  run: "RUN",
  look: "LOOK",
  think: "THINK",
  clap: "CLAP",
  eat: "EAT",
  crouch: "CROUCH",
  lie: "LIE",
};
