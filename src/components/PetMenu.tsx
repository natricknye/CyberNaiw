import { isTauri } from "@tauri-apps/api/core";
import { Menu, type MenuItemOptions } from "@tauri-apps/api/menu";
import { UI_STRINGS } from "../i18n/strings";
import {
  hidePetWindow,
  openSettingsWindow,
  quitApp,
} from "../services/window";
import type { Language } from "../types/pet";

let cachedMenu: { language: Language; menu: Promise<Menu> } | null = null;

function createPetMenu(language: Language): Promise<Menu> {
  const strings = UI_STRINGS[language].menu;

  const hideItem: MenuItemOptions = {
    id: "hide",
    text: strings.hide,
    action: () => {
      void hidePetWindow().catch(console.error);
    },
  };

  const settingsItem: MenuItemOptions = {
    id: "settings",
    text: strings.settings,
    action: () => {
      void openSettingsWindow().catch(console.error);
    },
  };

  const quitItem: MenuItemOptions = {
    id: "quit",
    text: strings.quit,
    action: () => {
      void quitApp().catch(console.error);
    },
  };

  return Menu.new({
    items: [
      hideItem,
      settingsItem,
      { item: "Separator" },
      quitItem,
    ],
  });
}

/**
 * Shows the native context menu at the cursor. Using the OS menu keeps
 * keyboard navigation, shadows and platform placement consistent.
 */
export async function showPetMenu(language: Language): Promise<void> {
  if (!isTauri()) {
    return;
  }

  try {
    if (!cachedMenu || cachedMenu.language !== language) {
      cachedMenu = { language, menu: createPetMenu(language) };
    }
    const menu = await cachedMenu.menu;
    await menu.popup();
  } catch (error) {
    cachedMenu = null;
    console.error("Unable to open the pet menu", error);
  }
}
