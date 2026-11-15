import { useCallback, useEffect, useRef, useState } from "react";
import type { PetAnimationState } from "../types/pet";

export interface PetReaction {
  id: number;
  message: string;
}

const REACTIONS = [
  "呱？",
  "奶量 +1",
  "别戳啦，在充电",
  "赛博奶蛙，在线摸鱼",
  "检测到人类手指",
  "今日份可爱已到账",
  "呱呱！",
  "让我再睡五分钟…",
] as const;

const CLICK_STATE_MS = 380;
const HAPPY_STATE_MS = 1100;
const REACTION_MS = 2400;

const IDLE_MIN_MS = 7000;
const IDLE_RANDOM_MS = 7000;
const WALK_STATE_MS = 3200;
const SLEEP_STATE_MS = 9000;

export function usePetState(animationsEnabled: boolean) {
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
    const message = REACTIONS[Math.floor(Math.random() * REACTIONS.length)];
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
  }, [clearTransition]);

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
      setState(Math.random() < 0.55 ? "walk" : "sleep");
    }, IDLE_MIN_MS + Math.random() * IDLE_RANDOM_MS);

    return () => window.clearTimeout(timer);
  }, [animationsEnabled, state]);

  // Walk/sleep are temporary; return to idle on their own.
  useEffect(() => {
    if (!animationsEnabled || (state !== "walk" && state !== "sleep")) {
      return;
    }

    const timer = window.setTimeout(
      () => setState("idle"),
      state === "walk" ? WALK_STATE_MS : SLEEP_STATE_MS,
    );

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
