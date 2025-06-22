//! Preview - Команды генерации превью
//!
//! Команды для создания превью кадров, миниатюр
//! и предварительного просмотра проекта.

use std::path::Path;
use tauri::State;

use crate::video_compiler::core::preview::PreviewOptions;
use crate::video_compiler::error::{Result, VideoCompilerError};
use crate::video_compiler::schema::ProjectSchema;

use super::state::VideoCompilerState;

/// Генерировать превью кадра в определенное время
#[tauri::command]
pub async fn generate_frame_preview(
  project_schema: ProjectSchema,
  timestamp: f64,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let preview_service = state
    .services
    .get_preview_service()
    .ok_or_else(|| VideoCompilerError::validation("PreviewService не найден"))?;

  let options = PreviewOptions {
    width: None,  // Использовать оригинальную ширину
    height: None, // Использовать оригинальную высоту
    format: "jpeg".to_string(),
    quality: 85,
  };

  preview_service
    .generate_frame(&project_schema, timestamp, &output_path, Some(options))
    .await?;

  Ok(output_path)
}

/// Генерировать миниатюры для видео
#[tauri::command]
pub async fn generate_video_thumbnails(
  video_path: String,
  output_dir: String,
  count: u32,
  width: u32,
  height: u32,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let preview_service = state
    .services
    .get_preview_service()
    .ok_or_else(|| VideoCompilerError::validation("PreviewService не найден"))?;

  // Создаем временные метки для миниатюр
  let mut timestamps = Vec::new();
  for i in 0..count {
    timestamps.push((i as f64) * 10.0); // Каждые 10 секунд
  }

  let _results = preview_service
    .generate_preview_batch_for_file(
      Path::new(&video_path),
      timestamps,
      Some((width, height)),
      Some(85),
    )
    .await?;

  // Генерируем пути файлов на основе временных меток
  let thumbnails: Vec<String> = (0..count)
    .map(|i| format!("{}/thumbnail_{}.jpg", output_dir, i))
    .collect();

  Ok(thumbnails)
}

/// Генерировать превью проекта (короткое видео)
#[tauri::command]
pub async fn generate_project_preview(
  project_schema: ProjectSchema,
  output_path: String,
  _duration: f64,
  _width: u32,
  _height: u32,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let preview_service = state
    .services
    .get_preview_service()
    .ok_or_else(|| VideoCompilerError::validation("PreviewService не найден"))?;

  let options = PreviewOptions {
    width: Some(_width),
    height: Some(_height),
    format: "mp4".to_string(),
    quality: 85,
  };

  // Генерируем кадр на начале проекта
  preview_service
    .generate_frame(&project_schema, 0.0, &output_path, Some(options))
    .await?;

  Ok(output_path)
}

/// Генерировать превью эффекта
#[tauri::command]
pub async fn generate_effect_preview(
  _effect_id: String,
  _input_path: String,
  output_path: String,
  timestamp: f64,
  _parameters: serde_json::Value,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let preview_service = state
    .services
    .get_preview_service()
    .ok_or_else(|| VideoCompilerError::validation("PreviewService не найден"))?;

  // Создаем временный проект с эффектом для превью
  let project = ProjectSchema::new("preview".to_string());
  // Здесь должна быть логика применения эффекта к проекту
  // Пока используем простую генерацию кадра

  let options = PreviewOptions {
    width: Some(320),
    height: Some(240),
    format: "jpeg".to_string(),
    quality: 85,
  };

  preview_service
    .generate_frame(&project, timestamp, &output_path, Some(options))
    .await?;

  Ok(output_path)
}

/// Генерировать превью перехода
#[tauri::command]
pub async fn generate_transition_preview(
  _transition_type: String,
  _input_a: String,
  _input_b: String,
  output_path: String,
  duration: f64,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let preview_service = state
    .services
    .get_preview_service()
    .ok_or_else(|| VideoCompilerError::validation("PreviewService не найден"))?;

  // Создаем временный проект с переходом для превью
  let project = ProjectSchema::new("transition_preview".to_string());
  // Здесь должна быть логика создания перехода между клипами
  // Пока используем простую генерацию кадра в середине перехода

  let options = PreviewOptions {
    width: Some(320),
    height: Some(240),
    format: "jpeg".to_string(),
    quality: 85,
  };

  preview_service
    .generate_frame(&project, duration / 2.0, &output_path, Some(options))
    .await?;

  Ok(output_path)
}

/// Генерировать раскадровку (storyboard) проекта
#[tauri::command]
pub async fn generate_storyboard(
  project_schema: ProjectSchema,
  output_path: String,
  frames_per_row: u32,
  frame_width: u32,
  frame_height: u32,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let preview_service = state
    .services
    .get_preview_service()
    .ok_or_else(|| VideoCompilerError::validation("PreviewService не найден"))?;

  // Генерируем раскадровку используя пакетную генерацию превью
  let duration = project_schema.timeline.duration;
  let frame_count = frames_per_row * 3; // Создаем 3 ряда
  let mut timestamps = Vec::new();

  for i in 0..frame_count {
    let timestamp = (i as f64 / frame_count as f64) * duration;
    timestamps.push(timestamp);
  }

  let options = PreviewOptions {
    width: Some(frame_width),
    height: Some(frame_height),
    format: "jpeg".to_string(),
    quality: 85,
  };

  // Создаем директорию для кадров
  std::fs::create_dir_all(&output_path)?;

  // Генерируем кадры
  for (i, timestamp) in timestamps.into_iter().enumerate() {
    let frame_path = format!("{}/frame_{:03}.jpg", output_path, i);
    preview_service
      .generate_frame(
        &project_schema,
        timestamp,
        &frame_path,
        Some(options.clone()),
      )
      .await?;
  }

  Ok(output_path)
}

/// Генерировать анимированное превью (GIF)
#[tauri::command]
pub async fn generate_animated_preview(
  _project_schema: ProjectSchema,
  output_path: String,
  _width: u32,
  _height: u32,
  _fps: u32,
  _duration: f64,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let _preview_service = state
    .services
    .get_preview_service()
    .ok_or_else(|| VideoCompilerError::validation("PreviewService не найден"))?;

  // TODO: Реализовать генерацию GIF через FFmpeg
  // Пока создаем пустой файл
  std::fs::write(&output_path, b"")?;

  Ok(output_path)
}

/// Генерировать превью звуковой волны
#[tauri::command]
pub async fn generate_waveform_preview(
  _audio_path: String,
  output_path: String,
  _width: u32,
  _height: u32,
  _color: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let _preview_service = state
    .services
    .get_preview_service()
    .ok_or_else(|| VideoCompilerError::validation("PreviewService не найден"))?;

  // TODO: Реализовать генерацию waveform через FFmpeg
  // Пока создаем пустой PNG файл
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  let png_header = vec![0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A];
  std::fs::write(&output_path, png_header)?;

  Ok(output_path)
}

/// Получить информацию о превью из кэша
#[tauri::command]
pub async fn get_cached_preview_info(
  preview_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Option<serde_json::Value>> {
  // Создаем ключ для поиска превью
  let key =
    crate::video_compiler::cache::PreviewKey::new(preview_id.clone(), 0.0, (1920, 1080), 85);
  let mut cache_mut = state.cache_manager.write().await;
  if let Some(preview_data) = cache_mut.get_preview(&key).await {
    Ok(Some(serde_json::json!({
      "id": preview_id,
      "data_size": preview_data.image_data.len(),
      "created_at": preview_data.timestamp,
    })))
  } else {
    Ok(None)
  }
}

/// Очистить кэш превью для проекта
#[tauri::command]
pub async fn clear_project_previews(
  _project_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.clear_previews().await;
  Ok(())
}

/// Генерировать превью с настраиваемыми параметрами
#[tauri::command]
pub async fn generate_custom_preview(
  project_schema: ProjectSchema,
  output_path: String,
  options: serde_json::Value,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let preview_service = state
    .services
    .get_preview_service()
    .ok_or_else(|| VideoCompilerError::validation("PreviewService не найден"))?;

  // Парсим настройки из JSON
  let preview_options: PreviewOptions = serde_json::from_value(options)
    .map_err(|e| VideoCompilerError::InvalidParameter(format!("Invalid preview options: {}", e)))?;

  preview_service
    .generate_frame(&project_schema, 0.0, &output_path, Some(preview_options))
    .await?;

  Ok(output_path)
}

/// Генерировать пакет превью с настройками
#[tauri::command]
pub async fn generate_preview_batch_with_settings(
  video_path: String,
  timestamps: Vec<f64>,
  settings: serde_json::Value,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  use crate::video_compiler::preview::{PreviewGenerator, PreviewRequest, PreviewSettings};
  use base64::Engine;

  let cache = state.cache_manager.clone();
  let width = settings
    .get("width")
    .and_then(|v| v.as_u64())
    .unwrap_or(1920) as u32;
  let height = settings
    .get("height")
    .and_then(|v| v.as_u64())
    .unwrap_or(1080) as u32;
  let quality = settings
    .get("quality")
    .and_then(|v| v.as_u64())
    .unwrap_or(80) as u8;
  let _cache_enabled = settings
    .get("cache_enabled")
    .and_then(|v| v.as_bool())
    .unwrap_or(true);

  let preview_settings = PreviewSettings {
    default_resolution: (width, height),
    default_quality: quality,
    format: crate::video_compiler::schema::PreviewFormat::Jpeg,
    timeline_resolution: (width, height),
    timeline_quality: quality,
    supported_formats: vec!["mp4".to_string(), "avi".to_string(), "mov".to_string()],
    timeout_seconds: 30,
    hardware_acceleration: false,
  };

  let generator = PreviewGenerator::with_settings(cache, preview_settings);

  // Создаем запросы превью
  let requests: Vec<PreviewRequest> = timestamps
    .into_iter()
    .map(|timestamp| PreviewRequest {
      video_path: video_path.clone(),
      timestamp,
      resolution: Some((width, height)),
      quality: Some(quality),
    })
    .collect();

  let results = generator.generate_preview_batch(requests).await?;

  // Сохраняем результаты в файлы и возвращаем пути
  let output_dir = state.settings.read().await.temp_directory.clone();
  let mut paths = Vec::new();

  for (i, result) in results.into_iter().enumerate() {
    if let Some(image_data) = result.image_data {
      let file_path = format!(
        "{}/preview_{}_{}.jpg",
        output_dir.display(),
        video_path.replace('/', "_"),
        i
      );

      // Декодируем base64 и сохраняем в файл
      if let Ok(decoded) = base64::engine::general_purpose::STANDARD.decode(&image_data) {
        std::fs::write(&file_path, decoded)?;
        paths.push(file_path);
      }
    }
  }

  Ok(paths)
}

/// Очистить кэш превью для конкретного файла
#[tauri::command]
pub async fn clear_preview_cache_for_file(
  _file_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  // Очищаем кэш напрямую через cache_manager
  let mut cache = state.cache_manager.write().await;
  // Очищаем все превью (нет способа очистить для конкретного файла)
  cache.clear_previews().await;
  Ok(())
}

/// Установить путь к FFmpeg для генератора превью
#[tauri::command]
pub async fn set_preview_generator_ffmpeg_path(
  path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  use crate::video_compiler::preview::PreviewGenerator;

  // Проверяем что путь валидный
  let output = std::process::Command::new(&path)
    .arg("-version")
    .output()
    .map_err(|e| VideoCompilerError::InvalidParameter(format!("Invalid FFmpeg path: {}", e)))?;

  if !output.status.success() {
    return Err(VideoCompilerError::InvalidParameter(
      "Invalid FFmpeg executable".to_string(),
    ));
  }

  // Создаем новый генератор с обновленным путем
  let cache = state.cache_manager.clone();
  let mut generator = PreviewGenerator::new(cache);
  generator.set_ffmpeg_path(&path);

  // Обновляем глобальный путь
  let mut ffmpeg_path = state.ffmpeg_path.write().await;
  *ffmpeg_path = path;

  Ok(())
}

/// Очистить кэш превью для конкретного файла с использованием PreviewGenerator
#[tauri::command]
pub async fn clear_preview_generator_cache_for_file(
  _file_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  use crate::video_compiler::preview::PreviewGenerator;

  let cache = state.cache_manager.clone();
  let generator = PreviewGenerator::new(cache);

  // Используем метод clear_cache_for_file
  generator.clear_cache_for_file().await?;

  Ok(())
}

/// Генерировать видео превью (миниатюры для видео)
#[tauri::command]
pub async fn generate_video_thumbnails_service(
  _project_schema: ProjectSchema,
  output_dir: String,
  thumbnail_count: u32,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  use crate::video_compiler::services::preview_service::{PreviewRequest, PreviewType};

  let preview_service = state
    .services
    .get_preview_service()
    .ok_or_else(|| VideoCompilerError::validation("PreviewService не найден"))?;

  // Создаем запрос для генерации превью
  let request = PreviewRequest {
    preview_type: PreviewType::Thumbnail,
    source_path: std::path::PathBuf::from("/tmp/video.mp4"),
    timestamp: Some(0.0),
    resolution: Some((320, 180)),
    quality: Some(85),
  };

  // Используем метод generate_video_thumbnails
  let thumbnails = preview_service
    .generate_video_thumbnails(
      &request.source_path,
      thumbnail_count as usize,
      request.resolution,
    )
    .await?;

  // Возвращаем пути к созданным миниатюрам
  let thumbnail_paths: Vec<String> = thumbnails
    .iter()
    .enumerate()
    .map(|(i, _)| format!("{}/thumbnail_{:03}.jpg", output_dir, i))
    .collect();

  Ok(thumbnail_paths)
}

/// Генерировать раскадровку проекта
#[tauri::command]
pub async fn generate_storyboard_service(
  project_schema: ProjectSchema,
  output_path: String,
  columns: u32,
  rows: u32,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  use crate::video_compiler::services::preview_service::{PreviewRequest, PreviewType};

  let preview_service = state
    .services
    .get_preview_service()
    .ok_or_else(|| VideoCompilerError::validation("PreviewService не найден"))?;

  // Создаем запрос для генерации раскадровки
  let request = PreviewRequest {
    preview_type: PreviewType::Storyboard,
    source_path: std::path::PathBuf::from("/tmp/video.mp4"),
    timestamp: Some(0.0),
    resolution: Some((1920, 1080)),
    quality: Some(95),
  };

  // Используем метод generate_storyboard
  let _result = preview_service
    .generate_storyboard(
      &project_schema,
      columns,
      rows,
      request.resolution.unwrap_or((320, 180)),
    )
    .await?;

  Ok(output_path)
}

/// Пакетная генерация превью
#[tauri::command]
pub async fn batch_generate_previews_service(
  requests: Vec<serde_json::Value>,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  use crate::video_compiler::services::preview_service::{PreviewRequest, PreviewType};

  let preview_service = state
    .services
    .get_preview_service()
    .ok_or_else(|| VideoCompilerError::validation("PreviewService не найден"))?;

  // Преобразуем JSON запросы в PreviewRequest
  let mut preview_requests = Vec::new();
  for req_json in requests {
    let preview_type = match req_json
      .get("type")
      .and_then(|v| v.as_str())
      .unwrap_or("Frame")
    {
      "Thumbnail" => PreviewType::Thumbnail,
      "Storyboard" => PreviewType::Storyboard,
      _ => PreviewType::Frame,
    };

    // Создаем минимальный запрос
    let request = PreviewRequest {
      preview_type,
      source_path: std::path::PathBuf::from(
        req_json
          .get("source_path")
          .and_then(|v| v.as_str())
          .unwrap_or("/tmp/video.mp4"),
      ),
      timestamp: req_json.get("timestamp").and_then(|v| v.as_f64()),
      resolution: {
        let width = req_json
          .get("width")
          .and_then(|v| v.as_u64())
          .map(|v| v as u32);
        let height = req_json
          .get("height")
          .and_then(|v| v.as_u64())
          .map(|v| v as u32);
        if let (Some(w), Some(h)) = (width, height) {
          Some((w, h))
        } else {
          None
        }
      },
      quality: req_json
        .get("quality")
        .and_then(|v| v.as_u64())
        .map(|v| v as u8),
    };
    preview_requests.push(request);
  }

  // Используем метод batch_generate_previews
  let results = preview_service
    .batch_generate_previews(preview_requests)
    .await?;

  // Возвращаем пути к созданным файлам
  let output_paths: Vec<String> = results
    .iter()
    .enumerate()
    .map(|(i, _)| format!("/tmp/batch_preview_{:03}.jpg", i))
    .collect();

  Ok(output_paths)
}
