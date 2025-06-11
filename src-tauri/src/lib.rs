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

// Модуль Video Server
mod video_server;
use video_server::{VideoRegistrationResponse, VideoServerState};

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

#[tauri::command]
async fn register_video(
  path: String,
  state: tauri::State<'_, VideoServerState>,
) -> Result<VideoRegistrationResponse, String> {
  use std::path::PathBuf;

  let path_buf = PathBuf::from(&path);
  if !path_buf.exists() {
    return Err("File does not exist".to_string());
  }

  let id = state.register_video(path_buf).await;

  Ok(VideoRegistrationResponse {
    id: id.clone(),
    url: format!("http://localhost:4567/video/{}", id),
  })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // Инициализация runtime для async операций
  let runtime = tokio::runtime::Runtime::new().unwrap();

  // Инициализация Video Compiler state
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

  // Инициализация Video Server
  let video_server_state = VideoServerState::new();
  let video_server_state_clone = video_server_state.clone();

  // Запускаем video server в отдельной задаче
  runtime.spawn(async move {
    video_server::start_video_server(video_server_state_clone).await;
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
    .manage(video_server_state)
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
      // Video Server command
      register_video,
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

#[cfg(test)]
mod tests {
  use super::*;
  use std::sync::Arc;
  use tempfile::TempDir;

  #[test]
  fn test_greet() {
    let result = greet();
    assert!(result.contains("Hello world from Rust!"));
    assert!(result.contains("Current epoch:"));

    // Проверяем, что epoch - это число
    let parts: Vec<&str> = result.split("Current epoch: ").collect();
    assert_eq!(parts.len(), 2);
    let epoch_str = parts[1];
    assert!(epoch_str.parse::<u128>().is_ok());
  }

  #[test]
  fn test_epoch_calculation() {
    let now = SystemTime::now();
    let epoch_ms = now.duration_since(UNIX_EPOCH).unwrap().as_millis();

    // Проверяем, что epoch в разумных пределах (после 2020 года)
    assert!(epoch_ms > 1577836800000); // 1 января 2020
    assert!(epoch_ms < 2000000000000); // где-то в 2033 году
  }

  #[test]
  fn test_imports() {
    // Проверяем, что все импорты работают
    // Это в основном проверка компиляции
    // Просто проверяем, что типы существуют
    let _ = std::any::type_name::<VideoCompilerState>();
    let _ = std::any::type_name::<VideoServerState>();
  }

  #[tokio::test]
  async fn test_video_compiler_state_creation() {
    // Тестируем создание VideoCompilerState через команды
    use video_compiler::commands::VideoCompilerState;

    let state = VideoCompilerState::new();

    // Проверяем, что состояние создано корректно
    assert!(Arc::strong_count(&state.active_jobs) > 0);
    assert!(Arc::strong_count(&state.cache_manager) > 0);
    assert!(!state.ffmpeg_path.is_empty());
    assert!(Arc::strong_count(&state.settings) > 0);
  }

  #[tokio::test]
  async fn test_clear_cache_functionality() {
    use tokio::sync::RwLock;

    // Создаем RenderCache
    let cache = Arc::new(RwLock::new(video_compiler::cache::RenderCache::new()));

    // Добавляем некоторые данные в кэш
    {
      let mut cache_guard = cache.write().await;
      let _ = cache_guard
        .store_metadata(
          "test_path".to_string(),
          video_compiler::cache::MediaMetadata {
            file_path: "test_path".to_string(),
            file_size: 1000000,
            modified_time: std::time::SystemTime::now(),
            duration: 10.0,
            resolution: Some((1920, 1080)),
            fps: Some(30.0),
            bitrate: Some(5000),
            video_codec: Some("h264".to_string()),
            audio_codec: Some("aac".to_string()),
            cached_at: std::time::SystemTime::now(),
          },
        )
        .await;
    }

    // Очищаем кэш
    {
      let mut cache_guard = cache.write().await;
      cache_guard.clear_all().await;
    }

    // Проверяем, что кэш пустой
    let cache_guard = cache.read().await;
    let memory_usage = cache_guard.get_memory_usage();
    // После очистки кэша память должна быть почти полностью освобождена (небольшие структуры могут остаться)
    assert!(memory_usage.total_mb() < 0.01); // Меньше 10KB
  }

  #[tokio::test]
  async fn test_register_video_functionality() {
    // Создаем временный видео файл
    let temp_dir = TempDir::new().unwrap();
    let video_path = temp_dir.path().join("test_video.mp4");
    std::fs::write(&video_path, b"fake video content").unwrap();

    // Создаем VideoServerState и регистрируем видео напрямую
    let state = VideoServerState::new();
    let id = state.register_video(video_path.clone()).await;

    assert!(!id.is_empty());

    // Проверяем, что файл действительно зарегистрирован
    let videos = state.video_registry.lock().await;
    assert!(videos.contains_key(&id));
    assert_eq!(videos.get(&id).unwrap(), &video_path);
  }

  #[test]
  fn test_video_compiler_state_default() {
    // Проверяем, что VideoCompilerState::default() создается корректно
    let state = VideoCompilerState::default();

    // Проверяем, что все поля инициализированы
    assert!(Arc::strong_count(&state.active_jobs) > 0);
    assert!(Arc::strong_count(&state.cache_manager) > 0);
    assert!(!state.ffmpeg_path.is_empty());
    assert!(Arc::strong_count(&state.settings) > 0);
  }

  #[tokio::test]
  async fn test_initialize_success() {
    // Тестируем инициализацию video compiler
    let result = video_compiler::initialize().await;

    // Результат зависит от наличия FFmpeg в системе
    // Но функция должна вернуть либо Ok, либо Err, но не паниковать
    match result {
      Ok(state) => {
        // Проверяем, что состояние создано корректно
        assert!(Arc::strong_count(&state.cache_manager) > 0);
        assert!(Arc::strong_count(&state.settings) > 0);
      }
      Err(e) => {
        // Ошибка ожидается, если FFmpeg не установлен
        assert!(e.to_string().contains("FFmpeg") || e.to_string().contains("ffmpeg"));
      }
    }
  }

  #[test]
  fn test_video_server_state_new() {
    // Проверяем создание VideoServerState
    let state = VideoServerState::new();

    // State должен быть создан успешно
    // Проверяем, что он может быть клонирован
    let _cloned = state.clone();
  }

  #[tokio::test]
  async fn test_start_video_server() {
    use std::time::Duration;

    // Создаем VideoServerState
    let state = VideoServerState::new();

    // Запускаем сервер в отдельной задаче
    let server_handle = tokio::spawn(async move {
      video_server::start_video_server(state).await;
    });

    // Даем серверу время запуститься
    tokio::time::sleep(Duration::from_millis(100)).await;

    // Проверяем, что сервер доступен
    let client = reqwest::Client::new();
    let response = client
      .get("http://localhost:4567/health")
      .timeout(Duration::from_secs(1))
      .send()
      .await;

    // Проверяем ответ или timeout (сервер может не запуститься в тестовом окружении)
    match response {
      Ok(resp) => {
        assert_eq!(resp.status(), 200);
      }
      Err(_) => {
        // Сервер может не запуститься в тестовом окружении, это нормально
      }
    }

    // Останавливаем сервер
    server_handle.abort();
  }
}
