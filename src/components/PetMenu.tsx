import { isTauri } from "@tauri-apps/api/core";
import { Menu, type MenuItemOptions } from "@tauri-apps/api/menu";
import {
  hidePetWindow,
  openSettingsWindow,
  quitApp,
} from "../services/window";

let menuPromise: Promise<Menu> | null = null;

function createPetMenu(): Promise<Menu> {
  const hideItem: MenuItemOptions = {
    id: "hide",
    text: "隐藏桌宠",
    action: () => {
      void hidePetWindow().catch(console.error);
    },
  };

  const settingsItem: MenuItemOptions = {
    id: "settings",
    text: "显示设置",
    action: () => {
      void openSettingsWindow().catch(console.error);
    },
  };

  const quitItem: MenuItemOptions = {
    id: "quit",
    text: "退出 CyberNaiwa",
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
export async function showPetMenu(): Promise<void> {
  if (!isTauri()) {
    return;
  }

  try {
    menuPromise ??= createPetMenu();
    const menu = await menuPromise;
    await menu.popup();
  } catch (error) {
    menuPromise = null;
    console.error("Unable to open the pet menu", error);
  }
}
