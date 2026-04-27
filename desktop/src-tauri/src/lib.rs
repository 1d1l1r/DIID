use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::{
    Manager,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
};

struct BackendProcess(Mutex<Option<Child>>);

fn find_sidecar() -> PathBuf {
    let exe_path = std::env::current_exe().unwrap();
    let exe_dir = exe_path.parent().unwrap().to_path_buf();

    #[cfg(target_os = "windows")]
    let binary = "diid-backend.exe";
    #[cfg(not(target_os = "windows"))]
    let binary = "diid-backend";

    // macOS .app bundle: exe is at Contents/MacOS/DIID
    // resources land at  Contents/Resources/diid-backend/diid-backend
    #[cfg(target_os = "macos")]
    let prod = exe_dir
        .parent().unwrap_or(&exe_dir)   // Contents/
        .join("Resources")
        .join("diid-backend")
        .join(binary);

    // Windows / Linux: sidecar sits next to the exe
    #[cfg(not(target_os = "macos"))]
    let prod = exe_dir.join("diid-backend").join(binary);

    if prod.exists() {
        return prod;
    }
    // Dev fallback: walk up to find desktop/dist/diid-backend
    exe_dir
        .ancestors()
        .find_map(|p| {
            let candidate = p.join("desktop").join("dist").join("diid-backend").join(binary);
            if candidate.exists() { Some(candidate) } else { None }
        })
        .unwrap_or(prod)
}

fn kill_backend(app: &tauri::AppHandle) {
    if let Some(mut child) = app
        .state::<BackendProcess>()
        .0
        .lock()
        .unwrap()
        .take()
    {
        let _ = child.kill();
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(BackendProcess(Mutex::new(None)))
        .setup(|app| {
            // ── Start backend sidecar ────────────────────────────────────
            let sidecar_path = find_sidecar();
            let child = Command::new(&sidecar_path)
                .spawn()
                .expect("Failed to start DIID backend");
            *app.state::<BackendProcess>().0.lock().unwrap() = Some(child);
            std::thread::sleep(std::time::Duration::from_millis(800));

            // ── System tray ──────────────────────────────────────────────
            let show = MenuItem::with_id(app, "show", "Open DIID", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;

            let _tray = TrayIconBuilder::new()
                .icon(app.default_window_icon().unwrap().clone())
                .menu(&menu)
                .tooltip("DIID")
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "show" => {
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.set_focus();
                        }
                    }
                    "quit" => {
                        kill_backend(app);
                        app.exit(0);
                    }
                    _ => {}
                })
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(win) = app.get_webview_window("main") {
                            let _ = win.show();
                            let _ = win.set_focus();
                        }
                    }
                })
                .build(app)?;

            Ok(())
        })
        // ── Hide to tray on close, don't quit ────────────────────────────
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running DIID desktop");
}
