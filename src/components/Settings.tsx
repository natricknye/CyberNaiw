import { getVersion } from "@tauri-apps/api/app";
import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";
import { useSettings } from "../hooks/useSettings";
import type { SettingsStatus } from "../hooks/useSettings";
import { hideSettingsWindow } from "../services/window";
import { MAX_PET_SCALE, MIN_PET_SCALE } from "../types/pet";
import "../styles/settings.css";

const STATUS_TEXT: Record<SettingsStatus, string> = {
  loading: "读取中",
  saving: "保存中…",
  saved: "已保存",
  error: "保存失败",
};

export default function Settings() {
  const { settings, loaded, status, error, update, reset } = useSettings();
  const [version, setVersion] = useState("0.1.0");

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
      if (event.key === "Escape") {
        void hideSettingsWindow();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const sliderValue = Math.round(settings.scale * 100);

  return (
    <main className="settings-shell">
      <header className="settings-header">
        <div className="settings-brand">
          <span className="settings-brand__mark" aria-hidden="true">
            [N]
          </span>
          <div>
            <p className="settings-eyebrow">CYBERNAIWA // CONTROL</p>
            <h1>奶蛙控制台</h1>
          </div>
        </div>
        <p className="settings-intro">
          一只住在桌面上的赛博 ASCII 奶蛙。
          <br />
          设置只保存在本机，不联网、不登录。
        </p>
      </header>

      {error ? (
        <div className="settings-alert" role="alert">
          设置读写失败：{error}
        </div>
      ) : null}

      <section className="settings-card" aria-labelledby="appearance-title">
        <div className="settings-card__head">
          <h2 id="appearance-title">外观</h2>
          <span className={`settings-status settings-status--${status}`}>
            {STATUS_TEXT[status]}
          </span>
        </div>

        <div className="settings-row">
          <div className="settings-row__copy">
            <span className="settings-label">始终置顶</span>
            <span className="settings-hint">让奶蛙待在其他窗口上方。</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-label="始终置顶"
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
            <span className="settings-label">桌宠大小</span>
            <span className="settings-hint">窗口和 ASCII 角色一起缩放。</span>
          </div>
          <div className="settings-slider">
            <input
              type="range"
              min={Math.round(MIN_PET_SCALE * 100)}
              max={Math.round(MAX_PET_SCALE * 100)}
              step={5}
              value={sliderValue}
              aria-label="桌宠大小"
              onChange={(event) =>
                update({ scale: Number(event.currentTarget.value) / 100 })
              }
              disabled={!loaded}
            />
            <output>{sliderValue}%</output>
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-row__copy">
            <span className="settings-label">动画</span>
            <span className="settings-hint">
              待机、走动、睡觉和逐帧动画。
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-label="动画"
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

        <p className="settings-note">
          关闭动画后奶蛙保持静态；点击仍会切换表情作为即时反馈，但不会自动走动或睡觉。
        </p>
      </section>

      <section className="settings-card" aria-labelledby="about-title">
        <div className="settings-card__head">
          <h2 id="about-title">关于</h2>
          <span className="settings-badge">LOCAL ONLY</span>
        </div>
        <dl className="settings-meta">
          <div>
            <dt>版本</dt>
            <dd>{version}</dd>
          </div>
          <div>
            <dt>数据</dt>
            <dd>本地 JSON · 无云端</dd>
          </div>
          <div>
            <dt>许可</dt>
            <dd>MIT</dd>
          </div>
        </dl>
        <p className="settings-note">
          关闭设置窗口后，奶蛙会继续在桌面运行。要完全退出，请使用托盘或奶蛙右键菜单。
        </p>
      </section>

      <footer className="settings-footer">
        <button
          type="button"
          className="button button--ghost"
          onClick={reset}
          disabled={!loaded}
        >
          恢复默认设置
        </button>
        <button
          type="button"
          className="button button--primary"
          onClick={() => void hideSettingsWindow()}
        >
          收起设置
        </button>
      </footer>
    </main>
  );
}
