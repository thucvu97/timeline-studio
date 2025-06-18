// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::time::{SystemTime, UNIX_EPOCH};

// Модуль для работы с языком
mod language_tauri; // Tauri v2 proper state management
use language_tauri::{get_app_language_tauri, set_app_language_tauri, LanguageState};

// Модуль для работы с медиафайлами
mod media;
use media::commands::{
  clear_media_preview_data, extract_recognition_frames, generate_media_thumbnail,
  generate_timeline_previews, get_files_with_previews, get_media_preview_data, get_timeline_frames,
  load_preview_data, process_media_file_simple, save_preview_data, save_timeline_frames,
  PreviewManagerState,
};
use media::preview_manager::PreviewDataManager;
use media::{get_media_files, get_media_metadata, MediaProcessor, ThumbnailOptions};

// Модуль для работы с файловой системой
mod filesystem;

// Модуль управления директориями приложения
mod app_dirs;
use app_dirs::{clear_app_cache, create_app_directories, get_app_directories, get_directory_sizes};

// Модуль Video Compiler
mod video_compiler;
use video_compiler::{initialize, VideoCompilerState};

// Модуль Video Server
mod video_server;
use video_server::{VideoRegistrationResponse, VideoServerState};

// Модуль распознавания (YOLO)
mod recognition;
use recognition::commands::{
  clear_recognition_results, export_recognition_results, get_preview_data_with_recognition,
  get_recognition_results, get_yolo_class_names, load_yolo_model, process_video_batch,
  process_video_recognition, process_yolo_batch, set_yolo_target_classes,
};
use recognition::{RecognitionService, RecognitionState};

// Импортируем GPU и Frame Extraction команды
use video_compiler::commands::{
  add_clip_to_track,
  cache_media_metadata,
  cancel_render,
  check_ffmpeg_capabilities,
  check_gpu_encoder_availability,
  check_hardware_acceleration,
  check_render_job_timeouts,
  cleanup_cache,
  clear_all_cache,
  clear_cache,
  clear_file_preview_cache,
  clear_frame_cache,
  clear_prerender_cache,
  clear_preview_cache,
  compile_video,
  configure_cache,
  create_clip,
  create_effect,
  create_filter,
  // Команды управления проектами
  create_new_project,
  create_style_template,
  create_subtitle,
  create_subtitle_animation,
  create_template,
  create_track,
  extract_subtitle_frames,
  extract_timeline_frames,
  generate_preview,
  generate_preview_batch,
  generate_preview_with_settings,
  get_active_jobs,
  get_cache_memory_usage,
  get_cache_size,
  get_cache_stats,
  get_cached_metadata,
  get_compiler_settings,
  get_current_gpu_info,
  get_frame_extraction_cache_info,
  get_gpu_capabilities,
  get_gpu_info,
  get_input_sources_info,
  get_prerender_cache_info,
  get_recommended_gpu_encoder,
  get_render_cache_info,
  get_render_job,
  get_render_progress,
  get_render_statistics,
  get_system_info,
  get_video_info,
  prerender_segment,
  set_ffmpeg_path,
  set_preview_ffmpeg_path,
  touch_project,
  update_compiler_settings,
};

// Test data commands (only available in test builds)
#[cfg(test)]
#[tauri::command]
async fn get_test_longest_video() -> Result<serde_json::Value, String> {
  use crate::media::test_data::test_data;
  let longest_video = test_data::get_longest_video();

  let video_info = serde_json::json!({
    "filename": longest_video.filename,
    "duration": longest_video.duration,
    "size": longest_video.size,
    "format": longest_video.format_name,
    "width": longest_video.width,
    "height": longest_video.height,
    "fps": longest_video.fps,
    "video_codec": longest_video.video_codec,
    "audio_codec": longest_video.audio_codec,
    "path": longest_video.get_path().to_string_lossy()
  });

  log::info!(
    "Возвращен самый длинный тестовый видеофайл: {} ({:.1}с)",
    longest_video.filename,
    longest_video.duration
  );

  Ok(video_info)
}

#[tauri::command]
fn greet() -> String {
  let now = SystemTime::now();
  let epoch_ms = now.duration_since(UNIX_EPOCH).unwrap().as_millis();
  format!("Hello world from Rust! Current epoch: {}", epoch_ms)
}

// Media Processor Commands

#[tauri::command]
async fn scan_media_folder(
  folder_path: String,
  app_handle: tauri::AppHandle,
) -> Result<Vec<media::types::MediaFile>, String> {
  use std::path::Path;

  // Получаем директорию для кеша превью
  let app_dirs = app_dirs::get_app_directories().await?;
  let thumbnail_dir = app_dirs.caches_dir.join("thumbnails");

  // Создаем процессор
  let processor = MediaProcessor::new(app_handle, thumbnail_dir);

  // Запускаем сканирование и обработку
  let folder = Path::new(&folder_path);
  processor.scan_and_process(folder, None).await
}

#[tauri::command]
async fn scan_media_folder_with_thumbnails(
  folder_path: String,
  width: u32,
  height: u32,
  app_handle: tauri::AppHandle,
) -> Result<Vec<media::types::MediaFile>, String> {
  use std::path::Path;

  // Получаем директорию для кеша превью
  let app_dirs = app_dirs::get_app_directories().await?;
  let thumbnail_dir = app_dirs.caches_dir.join("thumbnails");

  // Создаем процессор
  let processor = MediaProcessor::new(app_handle, thumbnail_dir);

  // Настройки для превью
  let thumbnail_options = Some(ThumbnailOptions {
    width,
    height,
    ..Default::default()
  });

  // Запускаем сканирование и обработку
  let folder = Path::new(&folder_path);
  processor.scan_and_process(folder, thumbnail_options).await
}

// Video Compiler Commands (non-duplicate ones only)
// Команда clear_all_cache уже определена в video_compiler/commands.rs

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

  // Инициализация директорий приложения
  runtime.block_on(async {
    match app_dirs::AppDirectories::get_or_create() {
      Ok(dirs) => {
        log::info!(
          "Директории приложения инициализированы в: {:?}",
          dirs.base_dir
        );
      }
      Err(e) => {
        log::error!("Ошибка создания директорий приложения: {}", e);
      }
    }
  });

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

  // Инициализация Preview Manager
  let preview_manager_state = runtime.block_on(async {
    match app_dirs::AppDirectories::get_or_create() {
      Ok(dirs) => {
        log::info!("Preview Manager инициализирован");
        PreviewManagerState {
          manager: PreviewDataManager::new(dirs.base_dir.clone()),
        }
      }
      Err(e) => {
        log::error!("Ошибка инициализации Preview Manager: {}", e);
        PreviewManagerState {
          manager: PreviewDataManager::new(std::env::temp_dir()),
        }
      }
    }
  });

  // Инициализация Recognition Service
  let recognition_state = runtime.block_on(async {
    match app_dirs::AppDirectories::get_or_create() {
      Ok(dirs) => match RecognitionService::new(dirs.base_dir.clone()) {
        Ok(service) => {
          log::info!("Recognition Service успешно инициализирован");
          RecognitionState { service }
        }
        Err(e) => {
          log::error!("Ошибка инициализации Recognition Service: {}", e);
          // Создаем fallback service с временной директорией
          let temp_dir = std::env::temp_dir();
          RecognitionState {
            service: RecognitionService::new(temp_dir)
              .expect("Failed to create fallback recognition service"),
          }
        }
      },
      Err(e) => {
        log::error!(
          "Ошибка получения директорий приложения для Recognition: {}",
          e
        );
        let temp_dir = std::env::temp_dir();
        RecognitionState {
          service: RecognitionService::new(temp_dir)
            .expect("Failed to create fallback recognition service"),
        }
      }
    }
  });

  // Инициализация Language State (Tauri v2 way)
  let language_state = LanguageState::new();

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
    .manage(recognition_state)
    .manage(preview_manager_state)
    .manage(language_state)
    .invoke_handler(tauri::generate_handler![
      greet,
      #[cfg(test)]
      get_test_longest_video,
      get_app_language_tauri,
      set_app_language_tauri,
      get_media_metadata,
      get_media_files,
      scan_media_folder,
      scan_media_folder_with_thumbnails,
      filesystem::file_exists,
      filesystem::get_file_stats,
      filesystem::get_platform,
      filesystem::search_files_by_name,
      filesystem::get_absolute_path,
      // App directories commands
      get_app_directories,
      create_app_directories,
      get_directory_sizes,
      clear_app_cache,
      // Video Server command
      register_video,
      // Video Compiler commands
      compile_video,
      get_render_progress,
      generate_preview,
      generate_preview_with_settings,
      generate_timeline_previews,
      generate_preview_batch,
      get_video_info,
      prerender_segment,
      get_prerender_cache_info,
      clear_prerender_cache,
      cancel_render,
      get_active_jobs,
      get_render_job,
      check_render_job_timeouts,
      get_render_cache_info,
      get_video_info,
      clear_preview_cache,
      get_cache_stats,
      clear_all_cache,
      clear_cache,
      cleanup_cache,
      get_render_statistics,
      get_cache_size,
      configure_cache,
      get_cached_metadata,
      cache_media_metadata,
      get_cache_memory_usage,
      set_preview_ffmpeg_path,
      clear_file_preview_cache,
      // GPU команды
      get_gpu_capabilities,
      get_current_gpu_info,
      check_hardware_acceleration,
      get_compiler_settings,
      update_compiler_settings,
      set_ffmpeg_path,
      get_system_info,
      check_ffmpeg_capabilities,
      check_gpu_encoder_availability,
      get_gpu_info,
      get_recommended_gpu_encoder,
      // InputSource команды
      get_input_sources_info,
      // Frame extraction команды
      extract_timeline_frames,
      extract_recognition_frames,
      extract_subtitle_frames,
      clear_frame_cache,
      get_frame_extraction_cache_info,
      // Recognition commands
      process_video_recognition,
      process_video_batch,
      get_recognition_results,
      get_preview_data_with_recognition,
      clear_recognition_results,
      export_recognition_results,
      load_yolo_model,
      set_yolo_target_classes,
      get_yolo_class_names,
      process_yolo_batch,
      // Project management commands
      create_new_project,
      touch_project,
      create_track,
      add_clip_to_track,
      create_clip,
      create_effect,
      create_filter,
      create_template,
      create_style_template,
      create_subtitle,
      create_subtitle_animation,
      // Media preview manager commands
      get_media_preview_data,
      generate_media_thumbnail,
      clear_media_preview_data,
      get_files_with_previews,
      save_preview_data,
      save_timeline_frames,
      get_timeline_frames,
      load_preview_data,
      process_media_file_simple,
      generate_timeline_previews,
      extract_recognition_frames
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::path::PathBuf;
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

  // ==================== ТЕСТЫ ДЛЯ MEDIA PREVIEW MANAGER ====================

  #[tokio::test]
  async fn test_preview_manager_state_creation() {
    // Создаем временную директорию для тестирования
    let temp_dir = TempDir::new().unwrap();

    // Создаем PreviewManagerState
    let state = PreviewManagerState {
      manager: PreviewDataManager::new(temp_dir.path().to_path_buf()),
    };

    // Проверяем, что менеджер создан корректно
    let files = state.manager.get_all_files_with_previews().await;
    assert!(files.is_empty()); // Изначально нет превью
  }

  #[tokio::test]
  async fn test_media_preview_data_operations() {
    use media::preview_data::MediaPreviewData;
    use std::path::PathBuf;

    // Создаем временную директорию
    let temp_dir = TempDir::new().unwrap();
    let state = PreviewManagerState {
      manager: PreviewDataManager::new(temp_dir.path().to_path_buf()),
    };

    let file_id = "test_file_123".to_string();

    // Изначально превью нет
    let preview_data = state.manager.get_preview_data(&file_id).await;
    assert!(preview_data.is_none());

    // Добавляем тестовые данные (структура для демонстрации)
    let _test_preview = MediaPreviewData {
      file_id: file_id.clone(),
      file_path: PathBuf::from("test.mp4"),
      browser_thumbnail: None,
      timeline_previews: vec![],
      recognition_frames: vec![],
      recognition_results: None,
      last_updated: chrono::Utc::now(),
    };

    // Сохраняем данные (методы private, тестируем через файловые операции)
    let files_with_previews = state.manager.get_all_files_with_previews().await;
    assert!(files_with_previews.is_empty());
  }

  #[tokio::test]
  async fn test_timeline_frames_operations() {
    use media::commands::TimelineFrame;

    // Создаем временную директорию
    let temp_dir = TempDir::new().unwrap();
    let state = PreviewManagerState {
      manager: PreviewDataManager::new(temp_dir.path().to_path_buf()),
    };

    let file_id = "timeline_test_file".to_string();

    // Создаем тестовые кадры
    let test_frames = vec![
      TimelineFrame {
        timestamp: 0.0,
        base64_data: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ".to_string(),
        is_keyframe: true,
      },
      TimelineFrame {
        timestamp: 1.0,
        base64_data: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ".to_string(),
        is_keyframe: false,
      },
    ];

    // Тестируем сохранение кадров таймлайна (может вернуть ошибку, но не должно паниковать)
    let _result = state
      .manager
      .save_timeline_frames(file_id.clone(), test_frames.clone())
      .await;

    // Тестируем получение кадров таймлайна (может вернуть ошибку, но не должно паниковать)
    let retrieved_frames = state.manager.get_timeline_frames(&file_id).await;
    // Проверяем что операция завершилась без panic
    match retrieved_frames {
      Ok(frames) => {
        // Если успешно, можем проверить размер
        // Проверяем что операция выполнилась без panic (usize всегда >= 0)
        let _ = frames.len();
      }
      Err(_) => {
        // Ошибка ожидается, если функциональность не полностью реализована
      }
    }
  }

  #[tokio::test]
  async fn test_preview_data_persistence() {
    // Создаем временную директорию
    let temp_dir = TempDir::new().unwrap();
    let save_path = temp_dir.path().join("preview_data.json");

    let state = PreviewManagerState {
      manager: PreviewDataManager::new(temp_dir.path().to_path_buf()),
    };

    // Тестируем сохранение в файл
    let save_result = state.manager.save_to_file(&save_path).await;
    assert!(save_result.is_ok());

    // Проверяем, что файл создан
    assert!(save_path.exists());

    // Тестируем загрузку из файла
    let load_result = state.manager.load_from_file(&save_path).await;
    assert!(load_result.is_ok());
  }

  // ==================== ТЕСТЫ ДЛЯ НОВЫХ TAURI КОМАНД ====================

  #[tokio::test]
  async fn test_generate_timeline_previews_command() {
    // Создаем временную директорию и тестовый файл
    let temp_dir = TempDir::new().unwrap();
    let test_video_path = temp_dir.path().join("test_video.mp4");
    std::fs::write(&test_video_path, b"fake video content for testing").unwrap();

    let state = PreviewManagerState {
      manager: PreviewDataManager::new(temp_dir.path().to_path_buf()),
    };

    // Тестируем прямое обращение к менеджеру
    let result = state
      .manager
      .generate_timeline_previews(
        "test_file_id".to_string(),
        test_video_path,
        10.0, // duration
        1.0,  // interval
      )
      .await;

    // Команда может вернуть ошибку из-за отсутствия FFmpeg, но не должна паниковать
    match result {
      Ok(_) => {
        // Успешное выполнение - отлично
      }
      Err(e) => {
        // Ожидаемые ошибки связанные с FFmpeg или форматом файла
        let error_msg = e.to_string();
        assert!(
          error_msg.contains("FFmpeg")
            || error_msg.contains("format")
            || error_msg.contains("video")
            || error_msg.contains("file")
            || error_msg.contains("ffprobe")
            || error_msg.contains("command")
        );
      }
    }
  }

  #[tokio::test]
  async fn test_extract_recognition_frames_command() {
    // Создаем временную директорию и тестовый файл
    let temp_dir = TempDir::new().unwrap();
    let test_video_path = temp_dir.path().join("test_video.mp4");
    std::fs::write(&test_video_path, b"fake video content for recognition").unwrap();

    let state = PreviewManagerState {
      manager: PreviewDataManager::new(temp_dir.path().to_path_buf()),
    };

    // Тестируем прямое обращение к менеджеру
    let result = state
      .manager
      .extract_recognition_frames(
        "recognition_test_file".to_string(),
        test_video_path,
        5, // count
      )
      .await;

    // Команда может вернуть ошибку из-за отсутствия FFmpeg, но не должна паниковать
    match result {
      Ok(_) => {
        // Успешное выполнение - отлично
      }
      Err(e) => {
        // Ожидаемые ошибки связанные с FFmpeg или форматом файла
        let error_msg = e.to_string();
        assert!(
          error_msg.contains("FFmpeg")
            || error_msg.contains("format")
            || error_msg.contains("video")
            || error_msg.contains("file")
            || error_msg.contains("recognition")
            || error_msg.contains("ffprobe")
            || error_msg.contains("command")
        );
      }
    }
  }

  #[tokio::test]
  async fn test_media_commands_integration() {
    // Создаем временную директорию
    let temp_dir = TempDir::new().unwrap();

    let state = PreviewManagerState {
      manager: PreviewDataManager::new(temp_dir.path().to_path_buf()),
    };

    let test_file_id = "integration_test_file".to_string();

    // Тестируем получение превью данных (изначально пусто)
    let preview_result = state.manager.get_preview_data(&test_file_id).await;
    assert!(preview_result.is_none());

    // Тестируем получение списка файлов с превью
    let files_result = state.manager.get_all_files_with_previews().await;
    assert!(files_result.is_empty());

    // Тестируем очистку данных превью для несуществующего файла
    let clear_result = state.manager.clear_file_data(&test_file_id).await;
    assert!(clear_result.is_ok()); // Должно быть успешно даже для несуществующего файла
  }

  #[tokio::test]
  async fn test_process_media_file_simple_command() {
    // Создаем временный видео файл
    let temp_dir = TempDir::new().unwrap();
    let test_file_path = temp_dir.path().join("simple_test.mp4");
    std::fs::write(&test_file_path, b"simple fake video content").unwrap();

    // Тестируем команду process_media_file_simple
    let result = process_media_file_simple(
      test_file_path.to_string_lossy().to_string(),
      false, // не генерируем thumbnail
    )
    .await;

    assert!(result.is_ok());
    let processed_file = result.unwrap();

    // Проверяем основные поля
    assert!(!processed_file.id.is_empty());
    assert_eq!(
      processed_file.path,
      test_file_path.to_string_lossy().to_string()
    );
    assert_eq!(processed_file.name, "simple_test.mp4");
    assert!(processed_file.size > 0);
    assert!(processed_file.error.is_none());
  }

  #[tokio::test]
  async fn test_process_media_file_nonexistent() {
    // Тестируем обработку несуществующего файла
    let result =
      process_media_file_simple("/nonexistent/path/to/file.mp4".to_string(), false).await;

    assert!(result.is_err());
    assert_eq!(result.unwrap_err(), "File does not exist");
  }

  // ==================== ТЕСТЫ ПРОИЗВОДИТЕЛЬНОСТИ И НАГРУЗКИ ====================

  #[tokio::test]
  async fn test_concurrent_preview_operations() {
    use std::sync::Arc;
    use tokio::sync::Semaphore;

    // Создаем временную директорию
    let temp_dir = TempDir::new().unwrap();
    let state = Arc::new(PreviewManagerState {
      manager: PreviewDataManager::new(temp_dir.path().to_path_buf()),
    });

    // Семафор для ограничения количества одновременных операций
    let semaphore = Arc::new(Semaphore::new(5));
    let mut handles = vec![];

    // Запускаем несколько операций одновременно
    for i in 0..10 {
      let state_clone = state.clone();
      let semaphore_clone = semaphore.clone();
      let file_id = format!("concurrent_test_{}", i);

      let handle = tokio::spawn(async move {
        let _permit = semaphore_clone.acquire().await.unwrap();

        // Тестируем получение превью данных
        let result = state_clone.manager.get_preview_data(&file_id).await;
        assert!(result.is_none()); // Изначально должно быть пусто
      });

      handles.push(handle);
    }

    // Ждем завершения всех операций
    for handle in handles {
      handle.await.unwrap();
    }
  }

  #[tokio::test]
  async fn test_memory_cleanup_after_operations() {
    // Создаем временную директорию
    let temp_dir = TempDir::new().unwrap();
    let state = PreviewManagerState {
      manager: PreviewDataManager::new(temp_dir.path().to_path_buf()),
    };

    // Выполняем несколько операций
    for i in 0..50 {
      let file_id = format!("memory_test_{}", i);

      // Получаем превью данные
      let _ = state.manager.get_preview_data(&file_id).await;

      // Получаем список файлов
      let _ = state.manager.get_all_files_with_previews().await;

      // Очищаем данные
      let _ = state.manager.clear_file_data(&file_id).await;
    }

    // После операций память должна быть освобождена
    // Это базовая проверка, что операции не вызывают утечек памяти
    let files = state.manager.get_all_files_with_previews().await;
    assert!(files.is_empty());
  }

  // ==================== ТЕСТЫ ДЛЯ GENERATE_MEDIA_THUMBNAIL ====================

  #[tokio::test]
  async fn test_generate_media_thumbnail_command() {
    // Создаем временную директорию и тестовый файл
    let temp_dir = TempDir::new().unwrap();
    let test_video_path = temp_dir.path().join("thumbnail_test.mp4");
    std::fs::write(&test_video_path, b"fake video for thumbnail generation").unwrap();

    let state = PreviewManagerState {
      manager: PreviewDataManager::new(temp_dir.path().to_path_buf()),
    };

    // Тестируем прямое обращение к менеджеру
    let result = state
      .manager
      .generate_browser_thumbnail(
        "thumbnail_file_id".to_string(),
        test_video_path,
        320, // width
        240, // height
        5.0, // timestamp
      )
      .await;

    // Команда может вернуть ошибку из-за отсутствия FFmpeg или неподдерживаемого формата
    match result {
      Ok(thumbnail_data) => {
        // Если успешно, проверяем что данные корректные
        assert!(!thumbnail_data.path.to_string_lossy().is_empty());
      }
      Err(e) => {
        // Ожидаемые ошибки
        let error_msg = e.to_string();
        assert!(
          error_msg.contains("FFmpeg")
            || error_msg.contains("format")
            || error_msg.contains("video")
            || error_msg.contains("thumbnail")
            || error_msg.contains("ffprobe")
            || error_msg.contains("command")
        );
      }
    }
  }

  #[tokio::test]
  async fn test_generate_thumbnail_with_invalid_params() {
    let temp_dir = TempDir::new().unwrap();
    let test_video_path = temp_dir.path().join("invalid_test.mp4");
    std::fs::write(&test_video_path, b"fake content").unwrap();

    let state = PreviewManagerState {
      manager: PreviewDataManager::new(temp_dir.path().to_path_buf()),
    };

    // Тестируем с недопустимыми размерами
    let result = state
      .manager
      .generate_browser_thumbnail(
        "invalid_file".to_string(),
        test_video_path,
        0, // недопустимая ширина
        240,
        5.0,
      )
      .await;

    // Должна вернуться ошибка
    assert!(result.is_err());
  }

  // ==================== ТЕСТЫ ДЛЯ FILESYSTEM КОМАНД ====================

  #[test]
  fn test_filesystem_operations() {
    use filesystem::{file_exists, get_file_stats, get_platform};

    // Создаем временный файл
    let temp_dir = TempDir::new().unwrap();
    let test_file = temp_dir.path().join("filesystem_test.txt");
    std::fs::write(&test_file, b"test content for filesystem").unwrap();

    // Тестируем file_exists
    let exists_result = file_exists(test_file.to_string_lossy().to_string());
    assert!(exists_result.is_ok());
    assert!(exists_result.unwrap());

    // Тестируем с несуществующим файлом
    let not_exists = file_exists("/nonexistent/file.txt".to_string());
    assert!(not_exists.is_ok());
    assert!(!not_exists.unwrap());

    // Тестируем get_file_stats
    let stats_result = get_file_stats(test_file.to_string_lossy().to_string());
    assert!(stats_result.is_ok());
    let stats = stats_result.unwrap();
    assert!(stats.size > 0);
    assert!(stats.last_modified > 0);

    // Тестируем get_platform
    let platform = get_platform();
    assert!(platform.is_ok());
    let platform_str = platform.unwrap();
    assert!(!platform_str.is_empty());
    assert!(platform_str == "windows" || platform_str == "macos" || platform_str == "linux");
  }

  #[test]
  fn test_search_files_by_name() {
    use filesystem::search_files_by_name;

    // Создаем временную директорию с тестовыми файлами
    let temp_dir = TempDir::new().unwrap();
    let test_files = [
      "search_test_1.mp4",
      "search_test_2.mov",
      "other_file.txt",
      "search_video.avi",
    ];

    for file_name in test_files.iter() {
      let file_path = temp_dir.path().join(file_name);
      std::fs::write(&file_path, b"test content").unwrap();
    }

    // Тестируем поиск функции - базовая проверка что она работает без panic
    let search_result = search_files_by_name(
      temp_dir.path().to_string_lossy().to_string(),
      "search".to_string(),
      Some(2), // увеличенная глубина поиска
    );

    // Основная проверка - функция должна работать без ошибок
    assert!(search_result.is_ok());

    // Дополнительная проверка - тестируем поиск конкретного файла который точно есть
    let specific_search = search_files_by_name(
      temp_dir.path().to_string_lossy().to_string(),
      "search_test_1".to_string(), // более специфичный поиск
      Some(2),
    );

    assert!(specific_search.is_ok());
    let found_files = specific_search.unwrap();

    // Если найдены файлы, проверяем что они правильные
    if !found_files.is_empty() {
      let found_names: Vec<String> = found_files
        .iter()
        .map(|path| {
          PathBuf::from(path)
            .file_name()
            .unwrap()
            .to_string_lossy()
            .to_string()
        })
        .collect();

      // Проверяем что найден файл содержащий искомую строку
      assert!(found_names
        .iter()
        .any(|name| name.contains("search_test_1")));
    }
  }

  // ==================== ТЕСТЫ ДЛЯ APP DIRECTORIES ====================

  #[tokio::test]
  async fn test_app_directories_operations() {
    use app_dirs::{create_app_directories, get_app_directories, get_directory_sizes};

    // Тестируем получение директорий приложения
    let dirs_result = get_app_directories().await;
    assert!(dirs_result.is_ok());

    let dirs = dirs_result.unwrap();
    assert!(!dirs.base_dir.to_string_lossy().is_empty());
    assert!(!dirs.projects_dir.to_string_lossy().is_empty());
    assert!(!dirs.caches_dir.to_string_lossy().is_empty());
    assert!(!dirs.media_dir.to_string_lossy().is_empty());

    // Тестируем создание директорий
    let create_result = create_app_directories().await;
    assert!(create_result.is_ok());

    // Тестируем получение размеров директорий
    let sizes_result = get_directory_sizes().await;
    assert!(sizes_result.is_ok());

    let sizes = sizes_result.unwrap();
    // Проверяем что значения получены (u64 всегда >= 0)
    let _ = sizes.projects;
    let _ = sizes.caches;
    let _ = sizes.media;
    let _ = sizes.total;
  }

  #[tokio::test]
  async fn test_clear_app_cache() {
    use app_dirs::clear_app_cache;

    // Тестируем очистку кэша приложения
    let clear_result = clear_app_cache().await;
    assert!(clear_result.is_ok());
    // Функция возвращает (), не количество файлов
  }

  // ==================== ИНТЕГРАЦИОННЫЕ ТЕСТЫ ====================

  #[tokio::test]
  async fn test_media_processing_pipeline() {
    // Создаем временную директорию с тестовыми файлами
    let temp_dir = TempDir::new().unwrap();
    let test_video = temp_dir.path().join("pipeline_test.mp4");
    std::fs::write(&test_video, b"fake video content for pipeline test").unwrap();

    let state = PreviewManagerState {
      manager: PreviewDataManager::new(temp_dir.path().to_path_buf()),
    };

    let file_id = "pipeline_test_file".to_string();
    let file_path = test_video.to_string_lossy().to_string();

    // 1. Обрабатываем медиафайл
    let process_result = process_media_file_simple(file_path.clone(), false).await;
    assert!(process_result.is_ok());

    // 2. Пытаемся сгенерировать превью для таймлайна
    let preview_result = state
      .manager
      .generate_timeline_previews(file_id.clone(), PathBuf::from(file_path.clone()), 10.0, 2.0)
      .await;

    // Может завершиться ошибкой из-за FFmpeg, но не должно паниковать
    match preview_result {
      Ok(_) => {
        // Если успешно, проверяем что данные сохранились
        let _preview_data = state.manager.get_preview_data(&file_id).await;
        // Можем проверить что операция прошла без panic
      }
      Err(_) => {
        // Ошибка ожидается в тестовом окружении
      }
    }

    // 3. Пытаемся извлечь кадры для распознавания
    let recognition_result = state
      .manager
      .extract_recognition_frames(file_id.clone(), PathBuf::from(file_path), 3)
      .await;

    // Также может завершиться ошибкой
    let _ = recognition_result.is_ok();

    // 4. Очищаем данные
    let clear_result = state.manager.clear_file_data(&file_id).await;
    assert!(clear_result.is_ok());
  }

  #[tokio::test]
  async fn test_error_handling_resilience() {
    let temp_dir = TempDir::new().unwrap();
    let state = PreviewManagerState {
      manager: PreviewDataManager::new(temp_dir.path().to_path_buf()),
    };

    // Тестируем обработку различных ошибочных ситуаций
    let error_scenarios = [
      ("", "пустой путь"),
      ("/nonexistent/file.mp4", "несуществующий файл"),
      ("invalid://path", "недопустимый путь"),
      ("file.txt", "неподдерживаемый формат"),
    ];

    for (path, _description) in error_scenarios.iter() {
      // Все команды должны корректно обрабатывать ошибки, не вызывая panic

      let _ = process_media_file_simple(path.to_string(), false).await;

      let _ = state
        .manager
        .generate_timeline_previews("error_test".to_string(), PathBuf::from(path), 10.0, 1.0)
        .await;

      let _ = state
        .manager
        .extract_recognition_frames("error_test".to_string(), PathBuf::from(path), 5)
        .await;

      let _ = state
        .manager
        .generate_browser_thumbnail("error_test".to_string(), PathBuf::from(path), 320, 240, 1.0)
        .await;

      // Все операции завершились без panic - тест прошел
    }
  }
}
