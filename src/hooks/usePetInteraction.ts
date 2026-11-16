import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useCallback, useEffect, useRef } from "react";
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
const imageAlphaCache = new Map<string, CanvasRenderingContext2D>();

function isOpaqueImagePoint(
  image: HTMLImageElement,
  event: ReactPointerEvent<HTMLElement>,
): boolean {
  const rect = image.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0 || image.naturalWidth === 0) {
    return false;
  }

  const x = Math.floor(
    ((event.clientX - rect.left) / rect.width) * image.naturalWidth,
  );
  const y = Math.floor(
    ((event.clientY - rect.top) / rect.height) * image.naturalHeight,
  );
  if (x < 0 || y < 0 || x >= image.naturalWidth || y >= image.naturalHeight) {
    return false;
  }

  const source = image.currentSrc || image.src;
  let context = imageAlphaCache.get(source);
  if (!context) {
    const canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const nextContext = canvas.getContext("2d", { willReadFrequently: true });
    if (!nextContext) {
      return false;
    }
    nextContext.drawImage(image, 0, 0);
    context = nextContext;
    imageAlphaCache.set(source, context);
  }

  return context.getImageData(x, y, 1, 1).data[3] > 16;
}

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
    onCharacter: boolean;
  } | null>(null);

  useEffect(() => {
    const resetPress = () => {
      pressRef.current = null;
    };

    window.addEventListener("pointerup", resetPress);
    window.addEventListener("pointercancel", resetPress);
    window.addEventListener("blur", resetPress);
    return () => {
      window.removeEventListener("pointerup", resetPress);
      window.removeEventListener("pointercancel", resetPress);
      window.removeEventListener("blur", resetPress);
    };
  }, []);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.button !== 0) {
        return;
      }

      const target = event.target;
      let character: Element | null = null;
      if (target instanceof Element) {
        character = target.closest(
          '.pet-ascii [class^="tone-"]:not(.tone-empty)',
        );
        if (!character) {
          const image = target.closest(".pet-visual--image img");
          if (
            image instanceof HTMLImageElement &&
            isOpaqueImagePoint(image, event)
          ) {
            character = image;
          }
        }
      }

      event.preventDefault();
      pressRef.current = {
        x: event.clientX,
        y: event.clientY,
        dragged: false,
        onCharacter: Boolean(character),
      };
    },
    [],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const press = pressRef.current;
      if (!press) {
        return;
      }

      if ((event.buttons & 1) === 0) {
        pressRef.current = null;
        return;
      }

      if (press.dragged) {
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
      if (!press || press.dragged || !press.onCharacter) {
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
