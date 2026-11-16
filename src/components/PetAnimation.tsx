import { useEffect, useMemo, useRef, useState } from "react";
import {
  BABY_FRAME_INTERVAL_MS,
  FRAME_INTERVAL_MS,
  toneForChar,
  type AsciiTone,
} from "../assets/pets/cyber-naiwa/frames";
import { getPetSkin } from "../assets/pets";
import { UI_STRINGS } from "../i18n/strings";
import type {
  Language,
  PetAge,
  PetAnimationState,
  PetPalette,
} from "../types/pet";

interface PetAnimationProps {
  state: PetAnimationState;
  animated: boolean;
  language: Language;
  age: PetAge;
  palette: PetPalette;
  skinId?: string;
}

interface AsciiSegment {
  tone: AsciiTone;
  text: string;
}

function renderAsciiLine(line: string, lineIndex: number) {
  const segments: AsciiSegment[] = [];

  for (const char of line) {
    const tone = toneForChar(char);
    const previous = segments[segments.length - 1];

    if (previous && previous.tone === tone) {
      previous.text += char;
    } else {
      segments.push({ tone, text: char });
    }
  }

  return (
    <span className="pet-ascii__line" key={lineIndex}>
      {segments.map((segment, index) => (
        <span className={`tone-${segment.tone}`} key={index}>
          {segment.text}
        </span>
      ))}
    </span>
  );
}

export default function PetAnimation({
  state,
  animated,
  language,
  age,
  palette,
  skinId,
}: PetAnimationProps) {
  const asciiSkin = useMemo(() => getPetSkin(skinId), [skinId]);
  const classicSkin = useMemo(() => getPetSkin("naiwa-classic"), []);
  const skin = palette === "classic" ? classicSkin : asciiSkin;
  const ariaLabel = UI_STRINGS[language].pet.stateAria[state];
  const baseFrames =
    skin.kind === "ascii"
      ? (palette === "cyber" ? skin.cyberFrames : skin.frames) ??
        skin.frames
      : age === "baby"
        ? (skin.babyFrames ?? skin.frames)
        : skin.frames;
  const frameSet =
    skin.kind === "ascii" && age === "baby"
      ? (palette === "cyber" ? skin.cyberBabyFrames : skin.babyFrames) ??
        baseFrames
      : baseFrames;
  const frames = frameSet[state];
  const [frameIndex, setFrameIndex] = useState(0);

  const previousState = useRef(state);

  useEffect(() => {
    const previous = previousState.current;
    previousState.current = state;

    // Click and happy are two phases of the same laugh. Do not rewind at the
    // click → happy hand-off, otherwise the hands-on-head beat plays twice.
    if (age === "adult" && state === "happy" && previous === "click") {
      return;
    }

    setFrameIndex(0);
  }, [state, skin.id, age, palette]);

  useEffect(() => {
    if (!animated) {
      setFrameIndex(0);
      return;
    }

    if (frames.length <= 1) {
      return;
    }

    const interval =
      skin.kind === "ascii"
        ? age === "baby"
          ? BABY_FRAME_INTERVAL_MS[state]
          : FRAME_INTERVAL_MS[state]
        : (skin.frameIntervalMs ?? 320);

    const timer = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % frames.length);
    }, interval);

    return () => window.clearInterval(timer);
  }, [animated, frames, state, skin, age]);

  if (frames.length === 0) {
    return null;
  }

  const frame = frames[frameIndex % frames.length];

  if (skin.kind === "ascii") {
    return (
      <div
        className={`pet-visual pet-visual--ascii pet-visual--${state}`}
        role="img"
        aria-label={ariaLabel}
      >
        <div className="pet-ascii-frame">
          <pre className="pet-ascii" aria-hidden="true">
            {frame.split("\n").map(renderAsciiLine)}
          </pre>
          <span className="pet-scanlines" aria-hidden="true" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`pet-visual pet-visual--image pet-visual--${state}`}
      role="img"
      aria-label={ariaLabel}
    >
      <img src={frame} alt="" draggable={false} />
    </div>
  );
}
