import { useCallback, useEffect, useRef, useState } from "react";
import { UI_STRINGS } from "../i18n/strings";
import type { Language, PetAnimationState } from "../types/pet";

export interface PetReaction {
  id: number;
  message: string;
}

const CLICK_STATE_MS = 380;
const HAPPY_STATE_MS = 1100;
const REACTION_MS = 2400;

const IDLE_MIN_MS = 7000;
const IDLE_RANDOM_MS = 7000;
const WALK_STATE_MS = 3200;
const SLEEP_STATE_MS = 9000;
const WAVE_STATE_MS = 2400;
const SAD_STATE_MS = 3000;

export function usePetState(
  animationsEnabled: boolean,
  language: Language,
) {
  const [state, setState] = useState<PetAnimationState>("idle");
  const [reaction, setReaction] = useState<PetReaction | null>(null);

  const transitionTimer = useRef<number | null>(null);
  const reactionTimer = useRef<number | null>(null);
  const reactionId = useRef(0);

  const clearTransition = useCallback(() => {
    if (transitionTimer.current !== null) {
      window.clearTimeout(transitionTimer.current);
      transitionTimer.current = null;
    }
  }, []);

  const interact = useCallback(() => {
    clearTransition();
    setState("click");

    reactionId.current += 1;
    const reactions = UI_STRINGS[language].pet.reactions;
    const message = reactions[Math.floor(Math.random() * reactions.length)];
    setReaction({ id: reactionId.current, message });

    if (reactionTimer.current !== null) {
      window.clearTimeout(reactionTimer.current);
    }
    reactionTimer.current = window.setTimeout(() => {
      reactionTimer.current = null;
      setReaction(null);
    }, REACTION_MS);

    transitionTimer.current = window.setTimeout(() => {
      transitionTimer.current = null;
      setState("happy");
      transitionTimer.current = window.setTimeout(() => {
        transitionTimer.current = null;
        setState("idle");
      }, HAPPY_STATE_MS);
    }, CLICK_STATE_MS);
  }, [clearTransition, language]);

  // Turning animations off cancels any in-flight automatic/click transition.
  useEffect(() => {
    if (animationsEnabled) {
      return;
    }

    clearTransition();
    setState("idle");
  }, [animationsEnabled, clearTransition]);

  // Gentle idle behaviour: occasionally walk or nap.
  useEffect(() => {
    if (!animationsEnabled || state !== "idle") {
      return;
    }

    const timer = window.setTimeout(() => {
      const roll = Math.random();
      const next =
        roll < 0.38
          ? "walk"
          : roll < 0.68
            ? "sleep"
            : roll < 0.86
              ? "wave"
              : "sad";
      setState(next);
    }, IDLE_MIN_MS + Math.random() * IDLE_RANDOM_MS);

    return () => window.clearTimeout(timer);
  }, [animationsEnabled, state]);

  // Walk/sleep/wave/sad are temporary; return to idle on their own.
  useEffect(() => {
    if (
      !animationsEnabled ||
      !["walk", "sleep", "wave", "sad"].includes(state)
    ) {
      return;
    }

    const duration =
      state === "walk"
        ? WALK_STATE_MS
        : state === "sleep"
          ? SLEEP_STATE_MS
          : state === "wave"
            ? WAVE_STATE_MS
            : SAD_STATE_MS;

    const timer = window.setTimeout(() => setState("idle"), duration);
    return () => window.clearTimeout(timer);
  }, [animationsEnabled, state]);

  useEffect(() => {
    return () => {
      clearTransition();
      if (reactionTimer.current !== null) {
        window.clearTimeout(reactionTimer.current);
      }
    };
  }, [clearTransition]);

  return { state, reaction, interact };
}
