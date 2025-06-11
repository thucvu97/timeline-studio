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

// Модуль Video Compiler
mod video_compiler;
use video_compiler::{initialize, PreviewGenerator, VideoCompilerState};

// Импортируем GPU и Frame Extraction команды
use video_compiler::commands::{
  cancel_render, check_ffmpeg_capabilities, check_hardware_acceleration, clear_frame_cache,
  clear_prerender_cache, clear_preview_cache, compile_video, extract_recognition_frames,
  extract_subtitle_frames, extract_timeline_frames, generate_preview, get_active_jobs,
  get_cache_stats, get_compiler_settings, get_current_gpu_info, get_gpu_capabilities,
  get_prerender_cache_info, get_render_progress, get_system_info, prerender_segment,
  set_ffmpeg_path, update_compiler_settings,
};

#[tauri::command]
fn greet() -> String {
  let now = SystemTime::now();
  let epoch_ms = now.duration_since(UNIX_EPOCH).unwrap().as_millis();
  format!("Hello world from Rust! Current epoch: {}", epoch_ms)
}

// Video Compiler Commands (non-duplicate ones only)

#[tauri::command]
async fn get_video_info(
  file_path: String,
  state: tauri::State<'_, VideoCompilerState>,
) -> Result<video_compiler::preview::VideoInfo, String> {
  use std::path::Path;

  let path = Path::new(&file_path);
  let preview_generator = PreviewGenerator::new(state.cache_manager.clone());

  match preview_generator.get_video_info(path).await {
    Ok(info) => Ok(info),
    Err(e) => {
      log::error!("Ошибка получения информации о видео: {}", e);
      Err(e.to_string())
    }
  }
}

#[tauri::command]
async fn clear_all_cache(state: tauri::State<'_, VideoCompilerState>) -> Result<(), String> {
  let mut cache = state.cache_manager.write().await;
  cache.clear_all().await;
  log::info!("Весь кэш очищен");
  Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // Инициализация Video Compiler state
  let runtime = tokio::runtime::Runtime::new().unwrap();
  let video_compiler_state = runtime.block_on(async {
    match initialize().await {
      Ok(state) => {
        log::info!("Video Compiler успешно инициализирован");
        state
      }
      Err(e) => {
        log::error!("Ошибка инициализации Video Compiler: {}", e);
        // Возвращаем состояние по умолчанию, если FFmpeg недоступен
        VideoCompilerState::default()
      }
    }
  });

  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::new().build())
    .plugin(tauri_plugin_notification::init())
    .plugin(tauri_plugin_global_shortcut::Builder::new().build())
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_websocket::init())
    .plugin(tauri_plugin_opener::init())
    .plugin(tauri_plugin_store::Builder::default().build())
    .manage(video_compiler_state)
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
      filesystem::get_absolute_path,
      // Video Compiler commands
      compile_video,
      get_render_progress,
      generate_preview,
      prerender_segment,
      get_prerender_cache_info,
      clear_prerender_cache,
      cancel_render,
      get_active_jobs,
      get_video_info,
      clear_preview_cache,
      get_cache_stats,
      clear_all_cache,
      // GPU команды
      get_gpu_capabilities,
      get_current_gpu_info,
      check_hardware_acceleration,
      get_compiler_settings,
      update_compiler_settings,
      set_ffmpeg_path,
      get_system_info,
      check_ffmpeg_capabilities,
      // Frame extraction команды
      extract_timeline_frames,
      extract_recognition_frames,
      extract_subtitle_frames,
      clear_frame_cache
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
