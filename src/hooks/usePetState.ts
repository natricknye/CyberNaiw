import { useCallback, useEffect, useRef, useState } from "react";
import { UI_STRINGS } from "../i18n/strings";
import type {
  Language,
  NaiwaVoice,
  PetAnimationState,
} from "../types/pet";

export interface PetReaction {
  id: number;
  message: string;
  voice: NaiwaVoice;
}

export type PetReactionKind = "laugh" | "meme";

const CLICK_STATE_MS = 380;
const HAPPY_STATE_MS = 1100;
const REACTION_MS = 2400;

const IDLE_MIN_MS = 7000;
const IDLE_RANDOM_MS = 7000;
const WALK_STATE_MS = 3200;
const WAVE_STATE_MS = 2400;

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

  const interact = useCallback((kind: PetReactionKind = "meme") => {
    clearTransition();
    setState("click");

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

    return nextReaction;
  }, [clearTransition, language]);

  // Turning animations off cancels any in-flight automatic/click transition.
  useEffect(() => {
    if (animationsEnabled) {
      return;
    }

    clearTransition();
    setState("idle");
  }, [animationsEnabled, clearTransition]);

  // Gentle idle behaviour: occasionally walk or wave.
  useEffect(() => {
    if (!animationsEnabled || state !== "idle") {
      return;
    }

    const timer = window.setTimeout(() => {
      const next = Math.random() < 0.5 ? "walk" : "wave";
      setState(next);
    }, IDLE_MIN_MS + Math.random() * IDLE_RANDOM_MS);

    return () => window.clearTimeout(timer);
  }, [animationsEnabled, state]);

  // Walk/wave are temporary; return to idle on their own.
  useEffect(() => {
    if (!animationsEnabled || !["walk", "wave"].includes(state)) {
      return;
    }

    const duration = state === "walk" ? WALK_STATE_MS : WAVE_STATE_MS;

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
