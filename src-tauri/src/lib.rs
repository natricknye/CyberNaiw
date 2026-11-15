use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};

fn show_pet(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("pet") {
        let _ = window.show();
    }
}

fn hide_pet(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("pet") {
        let _ = window.hide();
    }
}

fn toggle_pet(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("pet") {
        match window.is_visible() {
            Ok(true) => {
                let _ = window.hide();
            }
            _ => {
                let _ = window.show();
            }
        }
    }
}

fn open_settings(app: &AppHandle) {
    if let Some(window) = app.get_webview_window("settings") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            let show_item =
                MenuItem::with_id(app, "show", "显示桌宠", true, None::<&str>)?;
            let hide_item =
                MenuItem::with_id(app, "hide", "隐藏桌宠", true, None::<&str>)?;
            let settings_item =
                MenuItem::with_id(app, "settings", "显示设置", true, None::<&str>)?;
            let separator = PredefinedMenuItem::separator(app)?;
            let quit_item =
                MenuItem::with_id(app, "quit", "退出 CyberNaiwa", true, None::<&str>)?;

            let menu = Menu::with_items(
                app,
                &[
                    &show_item,
                    &hide_item,
                    &settings_item,
                    &separator,
                    &quit_item,
                ],
            )?;

            let icon = app
                .default_window_icon()
                .cloned()
                .expect("CyberNaiwa is missing its default window icon");

            TrayIconBuilder::new()
                .icon(icon)
                .tooltip("CyberNaiwa · 奶蛙在线")
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => show_pet(app),
                    "hide" => hide_pet(app),
                    "settings" => open_settings(app),
                    "quit" => app.exit(0),
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        toggle_pet(tray.app_handle());
                    }
                })
                .build(app)?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![quit_app])
        .run(tauri::generate_context!())
        .expect("error while running CyberNaiwa");
}
