use std::process::{Command, Child};
use std::sync::Mutex;
use tauri::Manager;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

struct BackendProcess(Mutex<Option<Child>>);

fn start_backend() -> Result<Child, std::io::Error> {
  let backend_path = "C:/Program Files/biyo/biyo-backend.exe";

  #[cfg(target_os = "windows")]
  {
    // CREATE_NO_WINDOW flag = 0x08000000
    Command::new(backend_path)
      .creation_flags(0x08000000)
      .spawn()
  }

  #[cfg(not(target_os = "windows"))]
  {
    Command::new(backend_path).spawn()
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Start backend process
      match start_backend() {
        Ok(child) => {
          app.manage(BackendProcess(Mutex::new(Some(child))));
          log::info!("Backend process started successfully");
        }
        Err(e) => {
          log::warn!("Failed to start backend process: {}", e);
          // Continue anyway - backend might already be running
        }
      }

      Ok(())
    })
    .on_window_event(|window, event| {
      if let tauri::WindowEvent::CloseRequested { .. } = event {
        // Kill backend process when app closes
        if let Some(backend) = window.app_handle().try_state::<BackendProcess>() {
          if let Ok(mut process) = backend.0.lock() {
            if let Some(mut child) = process.take() {
              let _ = child.kill();
              log::info!("Backend process terminated");
            }
          }
        }
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
