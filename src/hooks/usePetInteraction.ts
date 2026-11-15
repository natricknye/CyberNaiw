import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useRef } from "react";
import type {
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
} from "react";
import { showPetMenu } from "../components/PetMenu";
import type { Language } from "../types/pet";

interface PetInteractionOptions {
  onInteract: () => void;
  language: Language;
}

const DRAG_THRESHOLD_PX = 5;

/**
 * A left press becomes a click on release. The native window drag only starts
 * after the pointer moves a few pixels, so a click (and especially a
 * double-click) is not swallowed by the OS drag loop. Right-click opens the
 * native menu.
 */
export function usePetInteraction({
  onInteract,
  language,
}: PetInteractionOptions) {
  const pressRef = useRef<{
    x: number;
    y: number;
    dragged: boolean;
  } | null>(null);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();
      pressRef.current = {
        x: event.clientX,
        y: event.clientY,
        dragged: false,
      };
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const press = pressRef.current;
      if (!press || press.dragged) {
        return;
      }

      const distance = Math.hypot(
        event.clientX - press.x,
        event.clientY - press.y,
      );
      if (distance < DRAG_THRESHOLD_PX) {
        return;
      }

      press.dragged = true;
      if (!isTauri()) {
        return;
      }

      void getCurrentWindow()
        .startDragging()
        .catch((error: unknown) => {
          console.error("Unable to start window drag", error);
        });
    },
    [],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) {
        return;
      }

      const press = pressRef.current;
      pressRef.current = null;
      if (!press || press.dragged) {
        return;
      }

      onInteract();
    },
    [onInteract],
  );

  const handlePointerCancel = useCallback(() => {
    pressRef.current = null;
  }, []);

  const handleContextMenu = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      event.preventDefault();
      void showPetMenu(language);
    },
    [language],
  );

  return {
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
    onContextMenu: handleContextMenu,
  };
}
