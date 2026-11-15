import { invoke, isTauri } from "@tauri-apps/api/core";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_SETTINGS,
  type PetSettings,
} from "../types/pet";
import {
  loadSettings,
  normalizeSettings,
  notifySettingsChanged,
  saveSettings,
} from "../services/settings";

export type SettingsStatus = "loading" | "saving" | "saved" | "error";

const SAVE_DEBOUNCE_MS = 180;

export function useSettings() {
  const [settings, setSettings] = useState<PetSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [status, setStatus] = useState<SettingsStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const skipNextSave = useRef(true);
  const skipNextNotify = useRef(true);
  const saveTimer = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadSettings()
      .then((value) => {
        if (cancelled) {
          return;
        }

        setSettings(value);
        setLoaded(true);
        setStatus("saved");
      })
      .catch((loadError: unknown) => {
        if (cancelled) {
          return;
        }

        setLoaded(true);
        setStatus("error");
        setError(
          loadError instanceof Error ? loadError.message : String(loadError),
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the native tray labels in sync with the selected UI language.
  useEffect(() => {
    if (!isTauri()) {
      return;
    }

    void invoke("set_tray_language", {
      language: settings.language,
    }).catch((trayError: unknown) => {
      console.error("Unable to update the tray language", trayError);
    });
  }, [settings.language]);

  // Notify the pet window immediately so sliders feel live.
  useEffect(() => {
    if (!loaded) {
      return;
    }

    if (skipNextNotify.current) {
      skipNextNotify.current = false;
      return;
    }

    void notifySettingsChanged(settings).catch((notifyError: unknown) => {
      console.error("Unable to notify the pet window", notifyError);
    });
  }, [settings, loaded]);

  // Persist with a short debounce so dragging the size slider does not hammer
  // the JSON store with one write per pixel.
  useEffect(() => {
    if (!loaded) {
      return;
    }

    if (skipNextSave.current) {
      skipNextSave.current = false;
      return;
    }

    setStatus("saving");

    if (saveTimer.current !== null) {
      window.clearTimeout(saveTimer.current);
    }

    saveTimer.current = window.setTimeout(() => {
      saveTimer.current = null;

      void saveSettings(settings)
        .then(() => {
          setStatus("saved");
          setError(null);
        })
        .catch((saveError: unknown) => {
          setStatus("error");
          setError(
            saveError instanceof Error ? saveError.message : String(saveError),
          );
        });
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (saveTimer.current !== null) {
        window.clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    };
  }, [settings, loaded]);

  const update = useCallback((patch: Partial<PetSettings>) => {
    setSettings((current) => normalizeSettings({ ...current, ...patch }));
  }, []);

  return {
    settings,
    loaded,
    status,
    error,
    update,
  };
}
