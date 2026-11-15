import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback } from "react";
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

/**
 * Left press gives immediate feedback and starts a native window drag. The
 * native drag handles DPI and multi-monitor movement correctly on Windows and
 * macOS. Right-click opens a native OS menu.
 */
export function usePetInteraction({
  onInteract,
  language,
}: PetInteractionOptions) {
  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();
      onInteract();

      if (!isTauri()) {
        return;
      }

      void getCurrentWindow()
        .startDragging()
        .catch((error: unknown) => {
          console.error("Unable to start window drag", error);
        });
    },
    [onInteract],
  );

  const handleContextMenu = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      event.preventDefault();
      void showPetMenu(language);
    },
    [language],
  );

  return {
    onPointerDown: handlePointerDown,
    onContextMenu: handleContextMenu,
  };
}
