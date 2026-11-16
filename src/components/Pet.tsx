import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { usePetInteraction } from "../hooks/usePetInteraction";
import { usePetState } from "../hooks/usePetState";
import { UI_STRINGS } from "../i18n/strings";
import {
  listenSettingsChanged,
  loadSettings,
  loadWindowPosition,
  saveWindowPosition,
} from "../services/settings";
import { playNaiwaVoice } from "../services/sound";
import {
  applyPetWindowLiveSettings,
  applyPetWindowOnStartup,
  showPetWindow,
  watchPetWindowPosition,
} from "../services/window";
import {
  DEFAULT_SETTINGS,
  PET_STATE_LABELS,
  type PetSettings,
} from "../types/pet";
import PetAnimation from "./PetAnimation";
import SpeechBubble from "./SpeechBubble";
import "../styles/pet.css";

const DOUBLE_CLICK_WINDOW_MS = 300;
const LAUGH_DELAY_MS = 300;

export default function Pet() {
  const [settings, setSettings] = useState<PetSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const strings = UI_STRINGS[settings.language];
  const { state, reaction, interact } = usePetState(
    ready && settings.animationsEnabled,
    settings.language,
    settings.age,
  );

  const laughTimer = useRef<number | null>(null);
  const lastClickAt = useRef(0);

  const clearLaughTimer = useCallback(() => {
    if (laughTimer.current !== null) {
      window.clearTimeout(laughTimer.current);
      laughTimer.current = null;
    }
  }, []);

  const handleInteract = useCallback(() => {
    const now = Date.now();
    const isDouble = now - lastClickAt.current < DOUBLE_CLICK_WINDOW_MS;
    lastClickAt.current = now;

    // The baby has no laugh clip: every click is one of the meme lines.
    if (settings.age === "baby") {
      if (isDouble) {
        return;
      }

      const nextReaction = interact("meme");
      if (settings.soundEnabled) {
        playNaiwaVoice(nextReaction.voice, "baby");
      }
      return;
    }

    // Adult double-click: cancel the pending laugh and play a meme line.
    if (isDouble) {
      clearLaughTimer();
      const nextReaction = interact("meme");
      if (settings.soundEnabled) {
        playNaiwaVoice(nextReaction.voice, "adult");
      }
      return;
    }

    // Adult single-click: laugh only. Delay it briefly so a second click can
    // cancel it and switch to the meme line instead.
    interact("laugh");
    if (!settings.soundEnabled) {
      return;
    }

    clearLaughTimer();
    laughTimer.current = window.setTimeout(() => {
      laughTimer.current = null;
      playNaiwaVoice("laugh", "adult");
    }, LAUGH_DELAY_MS);
  }, [clearLaughTimer, interact, settings.age, settings.soundEnabled]);

  useEffect(() => {
    lastClickAt.current = 0;
    clearLaughTimer();
    return clearLaughTimer;
  }, [clearLaughTimer, settings.age, settings.soundEnabled]);

  const interaction = usePetInteraction({
    onInteract: handleInteract,
    language: settings.language,
  });

  useEffect(() => {
    let cancelled = false;
    const unlisteners: Array<() => void> = [];

    const initialise = async () => {
      try {
        const [loadedSettings, savedPosition] = await Promise.all([
          loadSettings(),
          loadWindowPosition(),
        ]);

        if (cancelled) {
          return;
        }

        setSettings(loadedSettings);
        await applyPetWindowOnStartup(loadedSettings, savedPosition);

        if (cancelled) {
          return;
        }

        setReady(true);
        await showPetWindow();

        if (cancelled) {
          return;
        }

        const unlistenPosition = await watchPetWindowPosition((position) => {
          void saveWindowPosition(position).catch((positionError: unknown) => {
            console.error("Unable to save the pet position", positionError);
          });
        });

        if (cancelled) {
          unlistenPosition();
          return;
        }
        unlisteners.push(unlistenPosition);

        const unlistenSettings = await listenSettingsChanged(
          (nextSettings) => {
            setSettings(nextSettings);
            void applyPetWindowLiveSettings(nextSettings).catch(
              (windowError: unknown) => {
                console.error(
                  "Unable to apply live window settings",
                  windowError,
                );
              },
            );
          },
        );

        if (cancelled) {
          unlistenSettings();
          return;
        }
        unlisteners.push(unlistenSettings);
      } catch (error) {
        console.error("CyberNaiwa failed to initialise", error);

        if (cancelled) {
          return;
        }

        setLoadError(error instanceof Error ? error.message : String(error));
        setReady(true);
        await showPetWindow().catch(showError => {
          console.error("Unable to show the pet window", showError);
        });
      }
    };

    void initialise();

    return () => {
      cancelled = true;
      for (const unlisten of unlisteners) {
        unlisten();
      }
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = settings.language === "zh" ? "zh-CN" : "en";
  }, [settings.language]);

  const bubbleMessage = loadError
    ? strings.pet.settingsError
    : settings.soundEnabled
      ? null
      : (reaction?.message ?? null);

  return (
    <main
      className={`pet-stage pet-stage--${settings.age} pet-stage--palette-${settings.palette}`}
      style={{ "--pet-scale": settings.scale } as CSSProperties}
      aria-label={strings.pet.aria}
      {...interaction}
    >
      <SpeechBubble message={bubbleMessage} nonce={reaction?.id} />
      <div className="pet-shadow" aria-hidden="true" />
      <PetAnimation
        state={state}
        animated={settings.animationsEnabled}
        language={settings.language}
        age={settings.age}
        palette={settings.palette}
      />
      {settings.hudEnabled ? (
        <div className="pet-hud" aria-hidden="true">
          <span className={`pet-hud-dot${ready ? " is-online" : ""}`} />
          NAIWA//{PET_STATE_LABELS[state]}
        </div>
      ) : null}
    </main>
  );
}
