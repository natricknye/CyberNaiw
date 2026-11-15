import { useEffect, useMemo, useState } from "react";
import {
  FRAME_INTERVAL_MS,
  toneForChar,
  type AsciiTone,
} from "../assets/pets/cyber-naiwa/frames";
import { getPetSkin } from "../assets/pets";
import type { PetAnimationState } from "../types/pet";

interface PetAnimationProps {
  state: PetAnimationState;
  animated: boolean;
  skinId?: string;
}

const STATE_ARIA: Record<PetAnimationState, string> = {
  idle: "待机",
  walk: "走动",
  sleep: "睡觉",
  happy: "开心",
  click: "被点击",
};

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
  skinId,
}: PetAnimationProps) {
  const skin = useMemo(() => getPetSkin(skinId), [skinId]);
  const frames = skin.frames[state];
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    setFrameIndex(0);
  }, [state, skin.id]);

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
        ? FRAME_INTERVAL_MS[state]
        : (skin.frameIntervalMs ?? 320);

    const timer = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % frames.length);
    }, interval);

    return () => window.clearInterval(timer);
  }, [animated, frames, state, skin]);

  if (frames.length === 0) {
    return null;
  }

  const frame = frames[frameIndex % frames.length];

  if (skin.kind === "ascii") {
    return (
      <div
        className={`pet-visual pet-visual--ascii pet-visual--${state}`}
        role="img"
        aria-label={`赛博奶蛙，${STATE_ARIA[state]}`}
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
      aria-label={`奶蛙皮肤，${STATE_ARIA[state]}`}
    >
      <img src={frame} alt="" draggable={false} />
    </div>
  );
}
