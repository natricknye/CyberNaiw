import { getVersion } from "@tauri-apps/api/app";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useSettings } from "../hooks/useSettings";
import type { SettingsStatus } from "../hooks/useSettings";
import { UI_STRINGS } from "../i18n/strings";
import { hideSettingsWindow } from "../services/window";
import { MAX_PET_SCALE, MIN_PET_SCALE } from "../types/pet";
import "../styles/settings.css";

export default function Settings() {
  const { settings, loaded, status, error, update } = useSettings();
  const [version, setVersion] = useState("0.2.2");
  const [aboutOpen, setAboutOpen] = useState(false);

  const strings = UI_STRINGS[settings.language];
  const statusText = {
    loading: strings.settings.loading,
    saving: strings.settings.saving,
    saved: strings.settings.saved,
    error: strings.settings.saveFailed,
  } satisfies Record<SettingsStatus, string>;

  useEffect(() => {
    if (!isTauri()) {
      return;
    }

    void getVersion()
      .then(setVersion)
      .catch((versionError: unknown) => {
        console.error("Unable to read the app version", versionError);
      });
  }, []);

  useEffect(() => {
    document.documentElement.lang = settings.language === "zh" ? "zh-CN" : "en";

    if (!isTauri()) {
      return;
    }

    void getCurrentWindow()
      .setTitle(strings.settings.windowTitle)
      .catch((titleError: unknown) => {
        console.error("Unable to set the settings window title", titleError);
      });
  }, [settings.language, strings.settings.windowTitle]);

  useEffect(() => {
    if (!isTauri()) {
      return;
    }

    let disposed = false;
    let unlisten: (() => void) | undefined;

    void getCurrentWindow()
      .onCloseRequested(async (event) => {
        event.preventDefault();
        await hideSettingsWindow();
      })
      .then((stopListening) => {
        if (disposed) {
          stopListening();
          return;
        }
        unlisten = stopListening;
      });

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") {
        return;
      }

      if (aboutOpen) {
        setAboutOpen(false);
        return;
      }

      void hideSettingsWindow();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [aboutOpen]);

  const sliderValue = Math.round(settings.scale * 100);
  const sliderMin = Math.round(MIN_PET_SCALE * 100);
  const sliderMax = Math.round(MAX_PET_SCALE * 100);
  const sliderFill = `${((sliderValue - sliderMin) / (sliderMax - sliderMin)) * 100}%`;

  return (
    <main className="settings-shell">
      <header className="settings-header">
        <div className="settings-header__top">
          <div className="settings-brand">
            <p className="settings-eyebrow">CYBERNAIWA</p>
            <h1>{strings.settings.title}</h1>
          </div>

        </div>

        <p className="settings-intro">{strings.settings.intro}</p>
      </header>

      {error ? (
        <div className="settings-alert" role="alert">
          {strings.settings.errorPrefix}
          {error}
        </div>
      ) : null}

      <section
        className="settings-card settings-card--main"
        aria-labelledby="appearance-title"
      >
        <div className="settings-card__head">
          <h2 id="appearance-title">{strings.settings.appearance}</h2>
          <span className={`settings-status settings-status--${status}`}>
            {statusText[status]}
          </span>
        </div>

        <div className="settings-row">
          <div className="settings-row__copy">
            <span className="settings-label">
              {strings.settings.alwaysOnTop}
            </span>
            <span className="settings-hint">
              {strings.settings.alwaysOnTopHint}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-label={strings.settings.alwaysOnTop}
            aria-checked={settings.alwaysOnTop}
            className={`toggle${settings.alwaysOnTop ? " is-on" : ""}`}
            onClick={() => update({ alwaysOnTop: !settings.alwaysOnTop })}
            disabled={!loaded}
          >
            <span className="toggle__thumb" />
          </button>
        </div>

        <div className="settings-row settings-row--stack">
          <div className="settings-row__copy">
            <span className="settings-label">{strings.settings.petSize}</span>
            <span className="settings-hint">{strings.settings.petSizeHint}</span>
          </div>
          <div className="settings-slider">
            <input
              type="range"
              min={sliderMin}
              max={sliderMax}
              step={5}
              value={sliderValue}
              aria-label={strings.settings.petSize}
              style={{ "--range-fill": sliderFill } as CSSProperties}
              onChange={(event) =>
                update({ scale: Number(event.currentTarget.value) / 100 })
              }
              disabled={!loaded}
            />
            <output>{sliderValue}%</output>
          </div>
        </div>

        <div className="settings-row settings-row--choice">
          <div className="settings-row__copy">
            <span className="settings-label">{strings.settings.age}</span>
            <span className="settings-hint">{strings.settings.ageHint}</span>
          </div>
          <div className="segmented" role="group" aria-label={strings.settings.age}>
            <button
              type="button"
              className={settings.age === "adult" ? "is-active" : ""}
              aria-pressed={settings.age === "adult"}
              onClick={() => update({ age: "adult" })}
              disabled={!loaded}
            >
              {strings.settings.adult}
            </button>
            <button
              type="button"
              className={settings.age === "baby" ? "is-active" : ""}
              aria-pressed={settings.age === "baby"}
              onClick={() => update({ age: "baby" })}
              disabled={!loaded}
            >
              {strings.settings.baby}
            </button>
          </div>
        </div>

        <div className="settings-row settings-row--choice">
          <div className="settings-row__copy">
            <span className="settings-label">{strings.settings.palette}</span>
            <span className="settings-hint">
              {strings.settings.paletteHint}
            </span>
          </div>
          <div
            className="segmented"
            role="group"
            aria-label={strings.settings.palette}
          >
            <button
              type="button"
              className={settings.palette === "original" ? "is-active" : ""}
              aria-pressed={settings.palette === "original"}
              onClick={() => update({ palette: "original" })}
              disabled={!loaded}
            >
              {strings.settings.original}
            </button>
            <button
              type="button"
              className={settings.palette === "cyber" ? "is-active" : ""}
              aria-pressed={settings.palette === "cyber"}
              onClick={() => update({ palette: "cyber" })}
              disabled={!loaded}
            >
              {strings.settings.cyber}
            </button>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-row__copy">
            <span className="settings-label">{strings.settings.animation}</span>
            <span className="settings-hint">
              {strings.settings.animationHint}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-label={strings.settings.animation}
            aria-checked={settings.animationsEnabled}
            className={`toggle${settings.animationsEnabled ? " is-on" : ""}`}
            onClick={() =>
              update({ animationsEnabled: !settings.animationsEnabled })
            }
            disabled={!loaded}
          >
            <span className="toggle__thumb" />
          </button>
        </div>

        <p className="settings-note">{strings.settings.animationNote}</p>

        <div className="settings-row">
          <div className="settings-row__copy">
            <span className="settings-label">{strings.settings.hud}</span>
            <span className="settings-hint">{strings.settings.hudHint}</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-label={strings.settings.hud}
            aria-checked={settings.hudEnabled}
            className={`toggle${settings.hudEnabled ? " is-on" : ""}`}
            onClick={() => update({ hudEnabled: !settings.hudEnabled })}
            disabled={!loaded}
          >
            <span className="toggle__thumb" />
          </button>
        </div>

        <div className="settings-row">
          <div className="settings-row__copy">
            <span className="settings-label">{strings.settings.sound}</span>
            <span className="settings-hint">{strings.settings.soundHint}</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-label={strings.settings.sound}
            aria-checked={settings.soundEnabled}
            className={`toggle${settings.soundEnabled ? " is-on" : ""}`}
            onClick={() =>
              update({ soundEnabled: !settings.soundEnabled })
            }
            disabled={!loaded}
          >
            <span className="toggle__thumb" />
          </button>
        </div>
      </section>

      <footer className="settings-footer">
        <button
          type="button"
          className="button button--ghost"
          aria-expanded={aboutOpen}
          aria-controls="about-panel"
          onClick={() => setAboutOpen(true)}
        >
          {strings.settings.about}
        </button>
        <button
          type="button"
          className="button button--primary"
          onClick={() => void hideSettingsWindow()}
        >
          {strings.settings.done}
        </button>
      </footer>

      {aboutOpen ? (
        <div
          className="settings-about-layer"
          role="dialog"
          aria-modal="true"
          aria-labelledby="about-title"
          onClick={(event) => {
            if (event.target === event.currentTarget) {
              setAboutOpen(false);
            }
          }}
        >
          <section
            id="about-panel"
            className="settings-card settings-card--about"
          >
            <div className="settings-card__head">
              <h2 id="about-title">{strings.settings.about}</h2>
              <button
                type="button"
                className="settings-about-close"
                autoFocus
                onClick={() => setAboutOpen(false)}
              >
                {strings.settings.aboutClose}
              </button>
            </div>
            <dl className="settings-meta">
              <div>
                <dt>{strings.settings.version}</dt>
                <dd>{version}</dd>
              </div>
              <div>
                <dt>{strings.settings.data}</dt>
                <dd>{strings.settings.dataValue}</dd>
              </div>
              <div>
                <dt>{strings.settings.license}</dt>
                <dd>MIT</dd>
              </div>
            </dl>
            <p className="settings-note">{strings.settings.aboutNote}</p>
          </section>
        </div>
      ) : null}
    </main>
  );
}
