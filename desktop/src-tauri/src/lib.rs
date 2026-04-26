use std::path::PathBuf;
use std::process::{Child, Command};
use std::sync::Mutex;
use tauri::Manager;

struct BackendProcess(Mutex<Option<Child>>);

fn find_sidecar() -> PathBuf {
    // In production the sidecar lives next to the .exe in resources/diid-backend/
    let exe_dir = std::env::current_exe()
        .unwrap()
        .parent()
        .unwrap()
        .to_path_buf();

    #[cfg(target_os = "windows")]
    let binary = "diid-backend.exe";
    #[cfg(not(target_os = "windows"))]
    let binary = "diid-backend";

    // Try resources/diid-backend/ first (production bundle)
    let prod = exe_dir.join("diid-backend").join(binary);
    if prod.exists() {
        return prod;
    }
    // Dev fallback: dist/diid-backend/ relative to workspace root
    let dev = exe_dir
        .ancestors()
        .find_map(|p| {
            let candidate = p.join("desktop").join("dist").join("diid-backend").join(binary);
            if candidate.exists() { Some(candidate) } else { None }
        })
        .unwrap_or(prod);
    dev
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(BackendProcess(Mutex::new(None)))
        .setup(|app| {
            let sidecar_path = find_sidecar();
            let child = Command::new(&sidecar_path)
                .spawn()
                .expect("Failed to start DIID backend");

            *app.state::<BackendProcess>().0.lock().unwrap() = Some(child);

            // Give the backend a moment to start before the window loads
            std::thread::sleep(std::time::Duration::from_millis(800));

            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { .. } = event {
                if let Some(mut child) = window
                    .app_handle()
                    .state::<BackendProcess>()
                    .0
                    .lock()
                    .unwrap()
                    .take()
                {
                    let _ = child.kill();
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running DIID desktop");
}
