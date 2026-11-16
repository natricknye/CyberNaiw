import { isTauri } from "@tauri-apps/api/core";
import { cursorPosition, getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useRef } from "react";
import { isCharacterPointAt } from "../services/hitTest";

interface UseClickThroughOptions {
  enabled: boolean;
  /** Fired when the cursor enters/leaves the pet window rectangle. */
  onPointerInsideChange?: (inside: boolean) => void;
}

const POLL_MS = 32;
const RETRY_MS = 500;
const MAX_FAILURES = 8;
const GEAR_PADDING_PX = 2;

function isInsideSettingsButton(x: number, y: number): boolean {
  const button = document.querySelector<HTMLElement>(".pet-settings-button");
  if (!button) {
    return false;
  }
  const rect = button.getBoundingClientRect();
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    x >= rect.left - GEAR_PADDING_PX &&
    x <= rect.right + GEAR_PADDING_PX &&
    y >= rect.top - GEAR_PADDING_PX &&
    y <= rect.bottom + GEAR_PADDING_PX
  );
}

/**
 * Keeps the transparent window click-through except over the actual pet
 * pixels and the settings button.
 *
 * `setIgnoreCursorEvents` is all-or-nothing, so a short global cursor poll
 * toggles it. The webview keeps running while the window ignores the mouse,
 * which lets the poll re-enable clicks when the cursor reaches the pet.
 */
export function useClickThrough({
  enabled,
  onPointerInsideChange,
}: UseClickThroughOptions) {
  const insideRef = useRef(false);
  const ignoreRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!enabled || !isTauri()) {
      return;
    }

    const win = getCurrentWindow();
    let cancelled = false;
    let stopped = false;
    let timer: number | null = null;
    let failures = 0;

    const setInside = (next: boolean) => {
      if (insideRef.current === next) {
        return;
      }
      insideRef.current = next;
      onPointerInsideChange?.(next);
    };

    const setIgnore = async (next: boolean): Promise<boolean> => {
      if (ignoreRef.current === next) {
        return true;
      }
      try {
        await win.setIgnoreCursorEvents(next);
        ignoreRef.current = next;
        return true;
      } catch (error) {
        console.error("Unable to toggle pet click-through", error);
        return false;
      }
    };

    const schedule = (delay: number) => {
      if (cancelled || stopped) {
        return;
      }
      timer = window.setTimeout(() => void tick(), delay);
    };

    const stop = async () => {
      stopped = true;
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
      setInside(false);
      // Never leave the whole window permanently click-through if polling
      // fails after repeated retries.
      ignoreRef.current = null;
      try {
        await win.setIgnoreCursorEvents(false);
      } catch {
        // Ignore cleanup errors.
      }
    };

    const tick = async () => {
      if (cancelled || stopped) {
        return;
      }

      try {
        const [cursor, origin] = await Promise.all([
          cursorPosition(),
          win.innerPosition(),
        ]);
        const scale = window.devicePixelRatio || 1;
        const x = (cursor.x - origin.x) / scale;
        const y = (cursor.y - origin.y) / scale;
        if (cancelled || stopped) {
          return;
        }

        const inside =
          x >= 0 &&
          y >= 0 &&
          x < window.innerWidth &&
          y < window.innerHeight;

        setInside(inside);

        const hit =
          inside &&
          (isCharacterPointAt(x, y) || isInsideSettingsButton(x, y));

        if (cancelled || stopped) {
          return;
        }

        if (!(await setIgnore(!hit))) {
          failures += 1;
          if (failures >= MAX_FAILURES) {
            await stop();
            return;
          }
          schedule(RETRY_MS);
          return;
        }

        failures = 0;
        schedule(POLL_MS);
      } catch (error) {
        failures += 1;
        if (failures === 1) {
          console.error("Pet click-through polling failed", error);
        }
        if (failures >= MAX_FAILURES) {
          await stop();
          return;
        }
        schedule(RETRY_MS);
      }
    };

    // Start click-through; the first poll restores clicks if the cursor is
    // already on the character. Await the initial toggle so it cannot race a
    // first-tick `false` and leave the window click-through.
    const start = async () => {
      await setIgnore(true);
      if (!cancelled && !stopped) {
        void tick();
      }
    };
    void start();

    return () => {
      cancelled = true;
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
      setInside(false);
      ignoreRef.current = null;
      void win.setIgnoreCursorEvents(false).catch(() => {
        // Ignore cleanup errors.
      });
    };
  }, [enabled, onPointerInsideChange]);
}
