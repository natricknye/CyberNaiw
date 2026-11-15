import { isTauri } from "@tauri-apps/api/core";
import { emit, listen, type UnlistenFn } from "@tauri-apps/api/event";
import { load, type Store } from "@tauri-apps/plugin-store";
import {
  DEFAULT_SETTINGS,
  MAX_PET_SCALE,
  MIN_PET_SCALE,
  type PetSettings,
  type WindowPosition,
} from "../types/pet";

const STORE_FILE = "settings.json";
const SETTINGS_KEY = "settings";
const POSITION_KEY = "windowPosition";
const WEB_STORAGE_KEY = "cybernaiwa.settings.v1";
const SETTINGS_CHANGED_EVENT = "cybernaiwa-settings-changed";

let storePromise: Promise<Store> | null = null;

function getStore(): Promise<Store> {
  storePromise ??= load(STORE_FILE, { autoSave: false });
  return storePromise;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function normalizeSettings(value: unknown): PetSettings {
  if (!isRecord(value)) {
    return DEFAULT_SETTINGS;
  }

  const rawScale =
    typeof value.scale === "number" && Number.isFinite(value.scale)
      ? value.scale
      : DEFAULT_SETTINGS.scale;

  const scale = Math.round(
    Math.min(MAX_PET_SCALE, Math.max(MIN_PET_SCALE, rawScale)) * 100,
  ) / 100;

  return {
    alwaysOnTop:
      typeof value.alwaysOnTop === "boolean"
        ? value.alwaysOnTop
        : DEFAULT_SETTINGS.alwaysOnTop,
    scale,
    animationsEnabled:
      typeof value.animationsEnabled === "boolean"
        ? value.animationsEnabled
        : DEFAULT_SETTINGS.animationsEnabled,
    language: value.language === "en" ? "en" : "zh",
    age: value.age === "baby" ? "baby" : "adult",
    palette: value.palette === "original" ? "original" : "cyber",
  };
}

function normalizePosition(value: unknown): WindowPosition | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    typeof value.x !== "number" ||
    typeof value.y !== "number" ||
    !Number.isFinite(value.x) ||
    !Number.isFinite(value.y)
  ) {
    return null;
  }

  return {
    x: Math.round(value.x),
    y: Math.round(value.y),
  };
}

export async function loadSettings(): Promise<PetSettings> {
  if (!isTauri()) {
    const raw = window.localStorage.getItem(WEB_STORAGE_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }

    try {
      return normalizeSettings(JSON.parse(raw));
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  const store = await getStore();
  return normalizeSettings(await store.get(SETTINGS_KEY));
}

export async function saveSettings(settings: PetSettings): Promise<void> {
  if (!isTauri()) {
    window.localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(settings));
    return;
  }

  const store = await getStore();
  await store.set(SETTINGS_KEY, settings);
  await store.save();
}

export async function loadWindowPosition(): Promise<WindowPosition | null> {
  if (!isTauri()) {
    return null;
  }

  const store = await getStore();
  return normalizePosition(await store.get(POSITION_KEY));
}

export async function saveWindowPosition(
  position: WindowPosition,
): Promise<void> {
  if (!isTauri()) {
    return;
  }

  const store = await getStore();
  await store.set(POSITION_KEY, position);
  await store.save();
}

/**
 * Settings live in two webviews. The settings window broadcasts changes so the
 * pet window can resize / toggle always-on-top without a restart.
 */
export async function notifySettingsChanged(
  settings: PetSettings,
): Promise<void> {
  if (!isTauri()) {
    window.dispatchEvent(
      new CustomEvent<PetSettings>(SETTINGS_CHANGED_EVENT, {
        detail: settings,
      }),
    );
    return;
  }

  await emit(SETTINGS_CHANGED_EVENT, settings);
}

export async function listenSettingsChanged(
  handler: (settings: PetSettings) => void,
): Promise<UnlistenFn> {
  if (!isTauri()) {
    const listener = (event: Event) => {
      handler(
        normalizeSettings((event as CustomEvent<unknown>).detail),
      );
    };

    const storageListener = (event: StorageEvent) => {
      if (event.key !== WEB_STORAGE_KEY || !event.newValue) {
        return;
      }

      try {
        handler(normalizeSettings(JSON.parse(event.newValue)));
      } catch {
        // Ignore malformed values written by another tab.
      }
    };

    window.addEventListener(SETTINGS_CHANGED_EVENT, listener);
    window.addEventListener("storage", storageListener);
    return () => {
      window.removeEventListener(SETTINGS_CHANGED_EVENT, listener);
      window.removeEventListener("storage", storageListener);
    };
  }

  return listen<unknown>(SETTINGS_CHANGED_EVENT, (event) => {
    handler(normalizeSettings(event.payload));
  });
}
