// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::Manager;

// Command registry module
mod command_registry;
pub use command_registry::CommandRegistry;

// App builder module
mod app_builder;

// Модуль для работы с языком
mod language_tauri;
use language_tauri::LanguageState;

// Модуль для работы с медиафайлами
mod media;
use media::preview_manager::PreviewDataManager;
use media::{MediaProcessor, ThumbnailOptions};

// Модуль для работы с файловой системой
mod filesystem;

// Модуль управления директориями приложения
mod app_dirs;

// Модуль Video Compiler
mod video_compiler;
use video_compiler::VideoCompilerState;

// Модуль распознавания (YOLO)
mod recognition;
use recognition::commands::yolo_commands::YoloProcessorState;
use recognition::RecognitionState;

// Модуль безопасности и API ключей
mod security;

// Simple commands that don't belong to specific modules yet

#[tauri::command]
fn greet() -> String {
  let now = SystemTime::now();
  let epoch_ms = now.duration_since(UNIX_EPOCH).unwrap().as_millis();
  format!("Hello world from Rust! Current epoch: {}", epoch_ms)
}

#[tauri::command]
async fn scan_media_folder<R: tauri::Runtime>(
  folder_path: String,
  app_handle: tauri::AppHandle<R>,
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
async fn scan_media_folder_with_thumbnails<R: tauri::Runtime>(
  folder_path: String,
  width: u32,
  height: u32,
  app_handle: tauri::AppHandle<R>,
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

// This is where you export your tauri app
pub fn run() {
  // Ensure app directories exist on startup
  tauri::async_runtime::block_on(async {
    if let Err(e) = app_dirs::create_app_directories().await {
      eprintln!("Failed to create app directories: {}", e);
    }
  });

  // Build the app with all registered commands
  app_builder::build_app()
    .manage(LanguageState::default())
    .manage(PreviewDataManager::new(
      dirs::cache_dir()
        .unwrap_or_default()
        .join("timeline-studio"),
    ))
    .setup(|app: &mut tauri::App<tauri::Wry>| {
      // Initialize Video Compiler
      let video_compiler_state = tauri::async_runtime::block_on(video_compiler::initialize());
      match video_compiler_state {
        Ok(state) => {
          app.manage(state);
        }
        Err(e) => {
          log::error!("Failed to initialize Video Compiler: {}", e);
          // Продолжаем работу даже если Video Compiler не инициализирован
          // Создаем дефолтное состояние
          app.manage(tauri::async_runtime::block_on(VideoCompilerState::new()));
        }
      }

      // Create Recognition State
      let recognition_state = RecognitionState::new();
      app.manage(recognition_state);

      // Create YOLO Processor State
      let yolo_processor_state = YoloProcessorState::default();
      app.manage(yolo_processor_state);

      log::info!("Application setup completed");
      Ok(())
    })
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
  }

  #[tokio::test]
  async fn test_video_compiler_state_creation() {
    // Тестируем создание VideoCompilerState через команды
    use video_compiler::commands::VideoCompilerState;

    let state = VideoCompilerState::new().await;

    // Проверяем, что состояние создано корректно
    assert!(Arc::strong_count(&state.active_jobs) > 0);
    assert!(Arc::strong_count(&state.cache_manager) > 0);
    assert!(!state.ffmpeg_path.read().await.is_empty());
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

    // Проверяем, что данные есть в кэше
    {
      let mut cache_guard = cache.write().await;
      assert!(cache_guard.get_metadata("test_path").await.is_some());
    }

    // Очищаем кэш
    {
      let mut cache_guard = cache.write().await;
      cache_guard.clear().await.unwrap();
    }

    // Проверяем, что кэш пуст
    {
      let mut cache_guard = cache.write().await;
      assert!(cache_guard.get_metadata("test_path").await.is_none());
    }
  }

  #[tokio::test]
  async fn test_preview_manager_functionality() {
    // Создаем временную директорию для тестов
    let temp_dir = TempDir::new().unwrap();
    let temp_path = temp_dir.path().to_path_buf();

    // Создаем PreviewDataManager с путем к кешу
    let manager = PreviewDataManager::new(temp_path.clone());

    // Тестируем получение данных для несуществующего файла
    let result = manager.get_preview_data("non_existent_file.mp4").await;
    assert!(result.is_none());

    // Тестируем получение всех файлов (изначально пустой список)
    let all_files = manager.get_all_files_with_previews().await;
    assert_eq!(all_files.len(), 0);

    // Тестируем очистку данных для несуществующего файла
    let clear_result = manager.clear_file_data("non_existent_file.mp4").await;
    assert!(clear_result.is_ok());
  }

  #[tokio::test]
  async fn test_panic_recovery() {
    // Тестируем, что приложение корректно обрабатывает ошибки
    // и не падает при неправильных входных данных

    // Создаем временный PreviewDataManager с временной директорией
    let temp_dir = TempDir::new().unwrap();
    let manager = PreviewDataManager::new(temp_dir.path().to_path_buf());

    // Пытаемся получить данные для несуществующего файла
    let result = manager.get_preview_data("non_existent_file.mp4").await;
    assert!(result.is_none());

    // Пытаемся удалить данные для несуществующего файла (не должно вызвать panic)
    let _ = manager.clear_file_data("non_existent_file.mp4").await;

    // Создаем VideoCompilerState
    let _state = VideoCompilerState::new().await;

    // Тестируем обработку невалидных путей через команды media модуля
    use crate::media::commands::get_media_metadata;

    // Тестируем с пустым путем
    let result = get_media_metadata("".to_string());
    assert!(result.is_err());

    // Тестируем с невалидным путем
    let result = get_media_metadata("/invalid/path/to/video.mp4".to_string());
    assert!(result.is_err());

    // Все операции завершились без panic - тест прошел
    log::info!("Panic recovery test completed successfully");
  }
}
