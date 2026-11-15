import { isTauri } from "@tauri-apps/api/core";
import { getCurrentWindow } from "@tauri-apps/api/window";
import Pet from "./components/Pet";
import Settings from "./components/Settings";

export type WindowKind = "pet" | "settings";

export function resolveWindowKind(): WindowKind {
  if (isTauri()) {
    return getCurrentWindow().label === "settings" ? "settings" : "pet";
  }

  const previewWindow = new URLSearchParams(window.location.search).get(
    "window",
  );
  return previewWindow === "settings" ? "settings" : "pet";
}

export default function App({ kind }: { kind: WindowKind }) {
  return kind === "settings" ? <Settings /> : <Pet />;
}
