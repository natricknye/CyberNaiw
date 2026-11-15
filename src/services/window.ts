import { invoke, isTauri } from "@tauri-apps/api/core";
import { LogicalSize, PhysicalPosition, PhysicalSize } from "@tauri-apps/api/dpi";
import type { EventCallback, UnlistenFn } from "@tauri-apps/api/event";
import {
  availableMonitors,
  getCurrentWindow,
  monitorFromPoint,
  type Monitor,
  type Window,
} from "@tauri-apps/api/window";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import {
  PET_WINDOW_BASE_HEIGHT,
  PET_WINDOW_BASE_WIDTH,
  type PetSettings,
  type WindowPosition,
} from "../types/pet";

type ManagedWindow = Window | WebviewWindow;

async function getPetWindow(): Promise<ManagedWindow | null> {
  if (!isTauri()) {
    return null;
  }

  const current = getCurrentWindow();
  if (current.label === "pet") {
    return current;
  }

  return WebviewWindow.getByLabel("pet");
}

export function scaledPetSize(scale: number): LogicalSize {
  return new LogicalSize(
    Math.round(PET_WINDOW_BASE_WIDTH * scale),
    Math.round(PET_WINDOW_BASE_HEIGHT * scale),
  );
}

async function isPositionUsable(
  position: WindowPosition,
  size: PhysicalSize,
): Promise<boolean> {
  const monitors = await availableMonitors();
  if (monitors.length === 0) {
    return false;
  }

  const minimumVisibleWidth = Math.min(96, size.width);
  const minimumVisibleHeight = Math.min(64, size.height);

  return monitors.some((monitor) => {
    const area = monitor.workArea;
    const overlapX =
      Math.min(position.x + size.width, area.position.x + area.size.width) -
      Math.max(position.x, area.position.x);
    const overlapY =
      Math.min(position.y + size.height, area.position.y + area.size.height) -
      Math.max(position.y, area.position.y);

    return (
      overlapX >= minimumVisibleWidth && overlapY >= minimumVisibleHeight
    );
  });
}

async function monitorForWindow(
  win: ManagedWindow,
): Promise<Monitor | null> {
  const position = await win.outerPosition();
  const size = await win.outerSize();

  return monitorFromPoint(
    position.x + Math.round(size.width / 2),
    position.y + Math.round(size.height / 2),
  );
}

async function placePetAtDefaultPosition(win: ManagedWindow): Promise<void> {
  const monitor = await monitorForWindow(win);
  if (!monitor) {
    return;
  }

  const size = await win.outerSize();
  const margin = Math.round(28 * monitor.scaleFactor);
  const area = monitor.workArea;
  const maxX = area.position.x + area.size.width - size.width - margin;
  const maxY = area.position.y + area.size.height - size.height - margin;

  await win.setPosition(
    new PhysicalPosition(
      Math.max(area.position.x + margin, maxX),
      Math.max(area.position.y + margin, maxY),
    ),
  );
}

async function clampPetToMonitor(win: ManagedWindow): Promise<void> {
  const monitor = await monitorForWindow(win);
  if (!monitor) {
    return;
  }

  const position = await win.outerPosition();
  const size = await win.outerSize();
  const area = monitor.workArea;
  const margin = Math.round(12 * monitor.scaleFactor);
  const minX = area.position.x + margin;
  const minY = area.position.y + margin;
  const maxX = area.position.x + area.size.width - size.width - margin;
  const maxY = area.position.y + area.size.height - size.height - margin;

  const x = Math.min(Math.max(position.x, minX), Math.max(minX, maxX));
  const y = Math.min(Math.max(position.y, minY), Math.max(minY, maxY));

  if (x !== position.x || y !== position.y) {
    await win.setPosition(new PhysicalPosition(x, y));
  }
}

/**
 * Applied once when the pet window boots: size, always-on-top and a saved (or
 * default) position. The window stays hidden until this has finished.
 */
export async function applyPetWindowOnStartup(
  settings: PetSettings,
  savedPosition: WindowPosition | null,
): Promise<void> {
  if (!isTauri()) {
    return;
  }

  const win = await getPetWindow();
  if (!win) {
    return;
  }

  await win.setAlwaysOnTop(settings.alwaysOnTop);
  await win.setSize(scaledPetSize(settings.scale));

  const size = await win.outerSize();
  if (savedPosition && (await isPositionUsable(savedPosition, size))) {
    await win.setPosition(
      new PhysicalPosition(savedPosition.x, savedPosition.y),
    );
  } else {
    await placePetAtDefaultPosition(win);
  }

  // A saved position can be partially off-screen after a DPI change or a size
  // change. Clamp once at startup so the pet is always draggable.
  await clampPetToMonitor(win);
}

/**
 * Applied when the settings window changes something. It deliberately does not
 * move the pet back to a stored position, so a live resize never teleports it.
 */
export async function applyPetWindowLiveSettings(
  settings: PetSettings,
): Promise<void> {
  if (!isTauri()) {
    return;
  }

  const win = await getPetWindow();
  if (!win) {
    return;
  }

  await win.setAlwaysOnTop(settings.alwaysOnTop);
  await win.setSize(scaledPetSize(settings.scale));
  await clampPetToMonitor(win);
}

export async function showPetWindow(): Promise<void> {
  if (!isTauri()) {
    return;
  }

  const win = await getPetWindow();
  await win?.show();
}

export async function hidePetWindow(): Promise<void> {
  if (!isTauri()) {
    return;
  }

  const win = await getPetWindow();
  await win?.hide();
}

export async function openSettingsWindow(): Promise<void> {
  if (!isTauri()) {
    return;
  }

  const win = await WebviewWindow.getByLabel("settings");
  if (!win) {
    return;
  }

  await win.show();
  await win.unminimize();
  await win.setFocus();
}

export async function hideSettingsWindow(): Promise<void> {
  if (!isTauri()) {
    return;
  }

  await getCurrentWindow().hide();
}

export async function quitApp(): Promise<void> {
  if (!isTauri()) {
    return;
  }

  await invoke("quit_app");
}

/**
 * Saves the pet position (physical pixels) after the user stops moving it.
 * Returns an unsubscribe function.
 */
export async function watchPetWindowPosition(
  onMove: (position: WindowPosition) => void,
): Promise<UnlistenFn> {
  if (!isTauri()) {
    return () => undefined;
  }

  const win = getCurrentWindow();
  let timer: number | undefined;

  const callback: EventCallback<PhysicalPosition> = ({ payload }) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      onMove({ x: Math.round(payload.x), y: Math.round(payload.y) });
    }, 500);
  };

  const unlisten = await win.onMoved(callback);

  return () => {
    window.clearTimeout(timer);
    unlisten();
  };
}
