import { useCallback, useEffect, useRef, useState } from "react";
import { UI_STRINGS } from "../i18n/strings";
import type {
  Language,
  NaiwaVoice,
  PetAge,
  PetAnimationState,
} from "../types/pet";

export interface PetReaction {
  id: number;
  message: string;
  voice: NaiwaVoice;
}

export type PetReactionKind = "laugh" | "meme";

const CLICK_STATE_MS = 380;
// The adult laugh audio is 4.11 s. Click (380 ms) + happy (3730 ms) keeps the
// 25-frame animation and the sound ending together.
const HAPPY_STATE_MS = 3730;
const BABY_HAPPY_STATE_MS = 1100;
const MEME_REACTION_MS = 2400;
const LAUGH_REACTION_MS = 4200;

/**
 * Adult left-click walks this stack. The first click after launch is the
 * horse stance, then the rest of the action library. `idle` is the reset step.
 */
export const ADULT_ACTION_STACK = [
  "idle",
  "wave",
  "walk",
  "run",
  "look",
  "think",
  "clap",
  "crouch",
] as const satisfies readonly PetAnimationState[];

const ACTION_DURATION_MS: Partial<Record<PetAnimationState, number>> = {
  wave: 2400,
  walk: 2200,
  run: 1500,
  look: 1900,
  think: 2200,
  clap: 1400,
  crouch: 1800,
};

// Adult idles only stand or occasionally shift into the horse stance. Every
// other action is deliberately click-only.
const ADULT_STANCE_MIN_MS = 9000;
const ADULT_STANCE_RANDOM_MS = 7000;
const BABY_IDLE_MIN_MS = 7000;
const BABY_IDLE_RANDOM_MS = 7000;
const BABY_WALK_STATE_MS = 3200;
const BABY_WAVE_STATE_MS = 2400;

export function usePetState(
  animationsEnabled: boolean,
  language: Language,
  age: PetAge,
) {
  const [state, setState] = useState<PetAnimationState>("idle");
  const [reaction, setReaction] = useState<PetReaction | null>(null);

  const transitionTimer = useRef<number | null>(null);
  const reactionTimer = useRef<number | null>(null);
  const reactionId = useRef(0);
  const actionIndex = useRef(0);

  const clearTransition = useCallback(() => {
    if (transitionTimer.current !== null) {
      window.clearTimeout(transitionTimer.current);
      transitionTimer.current = null;
    }
  }, []);

  const clearReaction = useCallback(() => {
    if (reactionTimer.current !== null) {
      window.clearTimeout(reactionTimer.current);
      reactionTimer.current = null;
    }
  }, []);

  /** Pick a line and show it. Does not touch the animation state. */
  const speak = useCallback(
    (kind: PetReactionKind = "meme") => {
      reactionId.current += 1;
      const reactions = UI_STRINGS[language].pet.reactions;
      const pool =
        kind === "laugh"
          ? reactions.filter((reaction) => reaction.voice === "laugh")
          : reactions.filter((reaction) => reaction.voice !== "laugh");
      const picked = pool[Math.floor(Math.random() * pool.length)] ?? reactions[0];
      const nextReaction: PetReaction = {
        id: reactionId.current,
        message: picked.text,
        voice: picked.voice,
      };
      setReaction(nextReaction);

      clearReaction();
      const reactionDuration =
        kind === "laugh" ? LAUGH_REACTION_MS : MEME_REACTION_MS;
      reactionTimer.current = window.setTimeout(() => {
        reactionTimer.current = null;
        setReaction(null);
      }, reactionDuration);

      return nextReaction;
    },
    [clearReaction, language],
  );

  /** Click reaction: short pop, then the happy/laugh phase. */
  const interact = useCallback(
    (kind: PetReactionKind = "meme") => {
      clearTransition();
      setState("click");
      const nextReaction = speak(kind);
      const happyDuration =
        age === "adult" ? HAPPY_STATE_MS : BABY_HAPPY_STATE_MS;

      transitionTimer.current = window.setTimeout(() => {
        transitionTimer.current = null;
        setState("happy");
        transitionTimer.current = window.setTimeout(() => {
          transitionTimer.current = null;
          setState("idle");
        }, happyDuration);
      }, CLICK_STATE_MS);

      return nextReaction;
    },
    [age, clearTransition, speak],
  );

  /**
   * Advance the adult manual action stack. The index is kept after the action
   * returns to idle, so repeated clicks eventually reach every action.
   */
  const advanceAction = useCallback(() => {
    if (age !== "adult") {
      return null;
    }

    clearTransition();
    actionIndex.current =
      (actionIndex.current + 1) % ADULT_ACTION_STACK.length;
    const next = ADULT_ACTION_STACK[actionIndex.current];
    setState(next);

    if (next === "idle") {
      return next;
    }

    transitionTimer.current = window.setTimeout(() => {
      transitionTimer.current = null;
      setState("idle");
    }, ACTION_DURATION_MS[next] ?? 2000);

    return next;
  }, [age, clearTransition]);

  // Changing age switches to a different action stack. Start both at standing.
  useEffect(() => {
    actionIndex.current = 0;
    clearTransition();
    clearReaction();
    setState("idle");
    setReaction(null);
  }, [age, clearReaction, clearTransition]);

  // Turning animations off cancels any in-flight automatic/click transition.
  useEffect(() => {
    if (animationsEnabled) {
      return;
    }

    clearTransition();
    setState("idle");
  }, [animationsEnabled, clearTransition]);

  // Adult: stand, then occasionally shift into the horse stance. Baby: keep
  // its separate waddle/wave idle behaviour. No automatic adult walk/run/etc.
  useEffect(() => {
    if (!animationsEnabled || state !== "idle") {
      return;
    }

    const adult = age === "adult";
    const delay = adult
      ? ADULT_STANCE_MIN_MS + Math.random() * ADULT_STANCE_RANDOM_MS
      : BABY_IDLE_MIN_MS + Math.random() * BABY_IDLE_RANDOM_MS;

    const timer = window.setTimeout(() => {
      if (adult) {
        setState("wave");
        transitionTimer.current = window.setTimeout(() => {
          transitionTimer.current = null;
          setState("idle");
        }, ACTION_DURATION_MS.wave ?? 2400);
        return;
      }

      const next = Math.random() < 0.5 ? "walk" : "wave";
      setState(next);
      transitionTimer.current = window.setTimeout(() => {
        transitionTimer.current = null;
        setState("idle");
      }, next === "walk" ? BABY_WALK_STATE_MS : BABY_WAVE_STATE_MS);
    }, delay);

    return () => window.clearTimeout(timer);
  }, [age, animationsEnabled, state]);

  useEffect(() => {
    return () => {
      clearTransition();
      clearReaction();
    };
  }, [clearReaction, clearTransition]);

  return { state, reaction, interact, advanceAction, speak };
}
