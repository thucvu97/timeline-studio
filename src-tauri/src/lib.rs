// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::time::{SystemTime, UNIX_EPOCH};

// Модуль для работы с языком
mod language;
use language::{get_app_language, set_app_language};

// Модуль для работы с медиафайлами
mod media;
use media::{get_media_files, get_media_metadata};

// Модуль для работы с файловой системой
mod filesystem;

#[tauri::command]
fn greet() -> String {
  let now = SystemTime::now();
  let epoch_ms = now.duration_since(UNIX_EPOCH).unwrap().as_millis();
  format!("Hello world from Rust! Current epoch: {}", epoch_ms)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::new().build())
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_global_shortcut::Builder::new().build())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_websocket::init())
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_store::Builder::default().build())
    .invoke_handler(tauri::generate_handler![
      greet,
      get_app_language,
      set_app_language,
      get_media_metadata,
      get_media_files,
      filesystem::file_exists,
      filesystem::get_file_stats,
      filesystem::get_platform,
      filesystem::search_files_by_name,
      filesystem::get_absolute_path
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
