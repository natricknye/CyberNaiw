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
  openSettingsWindow,
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

const BABY_DOUBLE_CLICK_MS = 300;
const ADULT_ACTION_DEBOUNCE_MS = 260;

export default function Pet() {
  const [settings, setSettings] = useState<PetSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const strings = UI_STRINGS[settings.language];
  const { state, reaction, interact, advanceAction, speak } = usePetState(
    ready && settings.animationsEnabled,
    settings.language,
    settings.age,
  );

  const lastActionAt = useRef(0);
  const lastBabyClickAt = useRef(0);

  const handleInteract = useCallback(() => {
    // Baby keeps its own action stack: click = one meme line, no laugh.
    if (settings.age === "baby") {
      const now = Date.now();
      if (now - lastBabyClickAt.current < BABY_DOUBLE_CLICK_MS) {
        return;
      }
      lastBabyClickAt.current = now;

      const nextReaction = interact("meme");
      if (settings.soundEnabled) {
        playNaiwaVoice(nextReaction.voice, "baby");
      }
      return;
    }

    // Adult: left-click advances the action stack and plays a meme line.
    const now = Date.now();
    if (now - lastActionAt.current < ADULT_ACTION_DEBOUNCE_MS) {
      return;
    }
    lastActionAt.current = now;

    advanceAction();
    const nextReaction = speak("meme");
    if (settings.soundEnabled) {
      playNaiwaVoice(nextReaction.voice, "adult");
    }
  }, [
    advanceAction,
    interact,
    settings.age,
    settings.soundEnabled,
    speak,
  ]);

  const handleLaugh = useCallback(() => {
    if (settings.age !== "adult") {
      return;
    }

    const nextReaction = interact("laugh");
    if (settings.soundEnabled) {
      playNaiwaVoice(nextReaction.voice, "adult");
    }
  }, [interact, settings.age, settings.soundEnabled]);

  useEffect(() => {
    lastActionAt.current = 0;
    lastBabyClickAt.current = 0;
  }, [settings.age]);

  const interaction = usePetInteraction({
    onInteract: handleInteract,
    onSecondary: settings.age === "adult" ? handleLaugh : undefined,
    onOpenSettings: () => {
      void openSettingsWindow().catch((settingsError: unknown) => {
        console.error("Unable to open the settings window", settingsError);
      });
    },
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
