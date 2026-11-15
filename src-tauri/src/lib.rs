use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager,
};

const TRAY_ID: &str = "cybernaiwa";

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

fn tray_menu(app: &AppHandle, language: &str) -> tauri::Result<Menu<tauri::Wry>> {
    let (show, hide, settings, quit) = if language == "en" {
        ("Show pet", "Hide pet", "Settings", "Quit CyberNaiwa")
    } else {
        ("显示桌宠", "隐藏桌宠", "显示设置", "退出 CyberNaiwa")
    };

    let show_item = MenuItem::with_id(app, "show", show, true, None::<&str>)?;
    let hide_item = MenuItem::with_id(app, "hide", hide, true, None::<&str>)?;
    let settings_item =
        MenuItem::with_id(app, "settings", settings, true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit_item = MenuItem::with_id(app, "quit", quit, true, None::<&str>)?;

    Menu::with_items(
        app,
        &[
            &show_item,
            &hide_item,
            &settings_item,
            &separator,
            &quit_item,
        ],
    )
}

#[tauri::command]
fn quit_app(app: AppHandle) {
    app.exit(0);
}

#[tauri::command]
fn set_tray_language(app: AppHandle, language: String) -> Result<(), String> {
    let language = if language == "en" { "en" } else { "zh" };
    let tray = app
        .tray_by_id(TRAY_ID)
        .ok_or_else(|| "tray icon not found".to_string())?;
    let menu = tray_menu(&app, language).map_err(|error| error.to_string())?;
    tray.set_menu(Some(menu))
        .map_err(|error| error.to_string())?;

    let tooltip = if language == "en" {
        "CyberNaiwa · Naiwa is online"
    } else {
        "CyberNaiwa · 奶蛙在线"
    };
    tray.set_tooltip(Some(tooltip))
        .map_err(|error| error.to_string())?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .setup(|app| {
            let menu = tray_menu(app.handle(), "zh")?;
            let icon = app
                .default_window_icon()
                .cloned()
                .expect("CyberNaiwa is missing its default window icon");

            TrayIconBuilder::with_id(TRAY_ID)
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
        .invoke_handler(tauri::generate_handler![quit_app, set_tray_language])
        .run(tauri::generate_context!())
        .expect("error while running CyberNaiwa");
}
