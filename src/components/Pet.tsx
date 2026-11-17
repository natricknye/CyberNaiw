import { useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useClickThrough } from "../hooks/useClickThrough";
import { usePetInteraction } from "../hooks/usePetInteraction";
import {
  ADULT_LAUGH_FLOW_MS,
  BABY_REACTION_FLOW_MS,
  usePetState,
} from "../hooks/usePetState";
import { UI_STRINGS } from "../i18n/strings";
import {
  listenSettingsChanged,
  loadSettings,
  loadWindowPosition,
  saveWindowPosition,
} from "../services/settings";
import { playNaiwaVoice, stopNaiwaVoice } from "../services/sound";
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

const ADULT_DOUBLE_CLICK_MS = 300;

export default function Pet() {
  const [settings, setSettings] = useState<PetSettings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const strings = UI_STRINGS[settings.language];
  const { state, reaction, interact, advanceAction, speak, clearReaction } =
    usePetState(
      ready && settings.animationsEnabled,
      settings.language,
      settings.age,
    );

  const flowLock = useRef(false);
  const flowTimer = useRef<number | null>(null);
  const singleClickTimer = useRef<number | null>(null);
  const lastLeftClickAt = useRef(0);

  const lockFlow = useCallback((durationMs: number) => {
    flowLock.current = true;
    if (flowTimer.current !== null) {
      window.clearTimeout(flowTimer.current);
    }
    flowTimer.current = window.setTimeout(() => {
      flowTimer.current = null;
      flowLock.current = false;
    }, Math.max(0, durationMs) + 50);
  }, []);

  const performAdultAction = useCallback(() => {
    if (flowLock.current) {
      return;
    }

    const next = advanceAction();
    if (!next) {
      return;
    }

    // Walking and running are intentionally silent: no voice and no subtitle.
    if (next.state === "walk" || next.state === "run") {
      clearReaction();
      lockFlow(next.duration);
      return;
    }

    const nextReaction = speak("meme");
    const voiceMs = settings.soundEnabled
      ? playNaiwaVoice(nextReaction.voice, "adult")
      : 0;
    lockFlow(Math.max(next.duration, voiceMs));
  }, [
    advanceAction,
    clearReaction,
    lockFlow,
    settings.soundEnabled,
    speak,
  ]);

  const handleLaugh = useCallback(() => {
    if (flowLock.current || settings.age !== "adult") {
      return;
    }

    const nextReaction = interact("laugh");
    const voiceMs = settings.soundEnabled
      ? playNaiwaVoice(nextReaction.voice, "adult")
      : 0;
    lockFlow(Math.max(ADULT_LAUGH_FLOW_MS, voiceMs));
  }, [interact, lockFlow, settings.age, settings.soundEnabled]);

  const handleInteract = useCallback(() => {
    // A click belongs to the current flow only when that flow has completely
    // ended (animation + voice). Otherwise it is ignored.
    if (flowLock.current) {
      return;
    }

    // Baby keeps its own action stack: click = one meme line, no laugh.
    if (settings.age === "baby") {
      const nextReaction = interact("meme");
      const voiceMs = settings.soundEnabled
        ? playNaiwaVoice(nextReaction.voice, "baby")
        : 0;
      lockFlow(Math.max(BABY_REACTION_FLOW_MS, voiceMs));
      return;
    }

    // Adult: wait one double-click window before advancing, so a second
    // click can cancel the action and trigger the laugh instead.
    const now = Date.now();
    if (now - lastLeftClickAt.current <= ADULT_DOUBLE_CLICK_MS) {
      lastLeftClickAt.current = 0;
      if (singleClickTimer.current !== null) {
        window.clearTimeout(singleClickTimer.current);
        singleClickTimer.current = null;
      }
      handleLaugh();
      return;
    }

    lastLeftClickAt.current = now;
    if (singleClickTimer.current !== null) {
      window.clearTimeout(singleClickTimer.current);
    }
    singleClickTimer.current = window.setTimeout(() => {
      singleClickTimer.current = null;
      lastLeftClickAt.current = 0;
      performAdultAction();
    }, ADULT_DOUBLE_CLICK_MS);
  }, [
    handleLaugh,
    interact,
    lockFlow,
    performAdultAction,
    settings.age,
    settings.soundEnabled,
  ]);

  useEffect(() => {
    flowLock.current = false;
    if (flowTimer.current !== null) {
      window.clearTimeout(flowTimer.current);
      flowTimer.current = null;
    }
    if (singleClickTimer.current !== null) {
      window.clearTimeout(singleClickTimer.current);
      singleClickTimer.current = null;
    }
    lastLeftClickAt.current = 0;
    stopNaiwaVoice();
  }, [settings.age]);

  useEffect(() => {
    if (!settings.soundEnabled) {
      stopNaiwaVoice();
    }
  }, [settings.soundEnabled]);

  useEffect(() => {
    return () => {
      if (flowTimer.current !== null) {
        window.clearTimeout(flowTimer.current);
      }
      if (singleClickTimer.current !== null) {
        window.clearTimeout(singleClickTimer.current);
      }
    };
  }, []);

  const handleOpenSettings = useCallback(() => {
    void openSettingsWindow().catch((settingsError: unknown) => {
      console.error("Unable to open the settings window", settingsError);
    });
  }, []);

  const interaction = usePetInteraction({
    onInteract: handleInteract,
    onOpenSettings: handleOpenSettings,
    language: settings.language,
  });

  useClickThrough({ enabled: ready });

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
      {settings.palette !== "classic" ? (
        <div className="pet-hud" aria-hidden="true">
          <span className={`pet-hud-dot${ready ? " is-online" : ""}`} />
          NAIWA//{PET_STATE_LABELS[state]}
        </div>
      ) : null}
    </main>
  );
}
