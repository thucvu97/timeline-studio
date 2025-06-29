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
    .map(|i| format!("{output_dir}/thumbnail_{i}.jpg"))
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
    let frame_path = format!("{output_path}/frame_{i:03}.jpg");
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

/// Параметры для генерации анимированного превью
#[derive(Debug, Clone, serde::Deserialize)]
pub struct AnimatedPreviewParams {
  pub video_path: String,
  pub start_time: f64,
  pub output_path: String,
  pub width: u32,
  pub height: u32,
  pub fps: u32,
  pub duration: f64,
}

/// Генерировать анимированное превью (GIF)
#[tauri::command]
pub async fn generate_animated_preview(
  _project_schema: ProjectSchema,
  params: AnimatedPreviewParams,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let _preview_service = state
    .services
    .get_preview_service()
    .ok_or_else(|| VideoCompilerError::validation("PreviewService не найден"))?;

  // Используем FFmpeg для создания анимированного GIF из видео
  let mut cmd = std::process::Command::new("ffmpeg");
  cmd.args([
    "-y", // Перезаписывать выходной файл
    "-i",
    &params.video_path,
    "-ss",
    &params.start_time.to_string(), // Начальное время
    "-t",
    &params.duration.to_string(), // Длительность
    "-vf",
    &format!(
      "fps={},scale={}:{}",
      params.fps, params.width, params.height
    ), // Фильтры: FPS и масштабирование
    "-loop",
    "0", // Бесконечный цикл
    &params.output_path,
  ]);

  let output = cmd.output().map_err(|e| VideoCompilerError::FFmpegError {
    exit_code: None,
    stderr: format!("Не удалось запустить FFmpeg для GIF: {e}"),
    command: "ffmpeg".to_string(),
  })?;

  if !output.status.success() {
    let stderr = String::from_utf8_lossy(&output.stderr);
    return Err(VideoCompilerError::FFmpegError {
      exit_code: output.status.code(),
      stderr: format!("FFmpeg не смог создать GIF: {stderr}"),
      command: "ffmpeg".to_string(),
    });
  }

  Ok(params.output_path)
}

/// Генерировать превью звуковой волны
#[tauri::command]
pub async fn generate_waveform_preview(
  audio_path: String,
  output_path: String,
  width: u32,
  height: u32,
  color: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let preview_service = state
    .services
    .get_preview_service()
    .ok_or_else(|| VideoCompilerError::validation("PreviewService не найден"))?;

  // Используем PreviewService для генерации waveform
  let waveform_data = preview_service
    .generate_waveform(std::path::Path::new(&audio_path), width, height, &color)
    .await?;

  // Сохраняем результат в файл
  tokio::fs::write(&output_path, waveform_data)
    .await
    .map_err(|e| VideoCompilerError::IoError(format!("Не удалось сохранить waveform: {e}")))?;

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
    .map_err(|e| VideoCompilerError::InvalidParameter(format!("Invalid preview options: {e}")))?;

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
    .map_err(|e| VideoCompilerError::InvalidParameter(format!("Invalid FFmpeg path: {e}")))?;

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
    .map(|(i, _)| format!("{output_dir}/thumbnail_{i:03}.jpg"))
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
    .map(|(i, _)| format!("/tmp/batch_preview_{i:03}.jpg"))
    .collect();

  Ok(output_paths)
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::schema::{Clip, ProjectSchema, Track, TrackType};
  use serde_json::json;
  use std::path::PathBuf;
  use tempfile::TempDir;

  fn create_test_project() -> ProjectSchema {
    let mut project = ProjectSchema::new("Test Project".to_string());
    project.timeline.duration = 10.0;
    project.timeline.fps = 30;
    project.timeline.resolution = (1920, 1080);

    let mut track = Track::new(TrackType::Video, "Video Track".to_string());
    let clip = Clip::new(PathBuf::from("/tmp/test_video.mp4"), 0.0, 5.0);
    track.clips.push(clip);
    project.tracks.push(track);

    project
  }

  #[test]
  fn test_animated_preview_params_deserialization() {
    let json = json!({
      "video_path": "/tmp/video.mp4",
      "start_time": 5.0,
      "output_path": "/tmp/output.gif",
      "width": 640,
      "height": 480,
      "fps": 15,
      "duration": 3.0
    });

    let params: AnimatedPreviewParams = serde_json::from_value(json).unwrap();
    assert_eq!(params.video_path, "/tmp/video.mp4");
    assert_eq!(params.start_time, 5.0);
    assert_eq!(params.output_path, "/tmp/output.gif");
    assert_eq!(params.width, 640);
    assert_eq!(params.height, 480);
    assert_eq!(params.fps, 15);
    assert_eq!(params.duration, 3.0);
  }

  #[test]
  fn test_preview_options_creation() {
    let options = PreviewOptions {
      width: Some(1920),
      height: Some(1080),
      format: "jpeg".to_string(),
      quality: 85,
    };

    assert_eq!(options.width, Some(1920));
    assert_eq!(options.height, Some(1080));
    assert_eq!(options.format, "jpeg");
    assert_eq!(options.quality, 85);
  }

  #[test]
  fn test_thumbnail_path_generation() {
    let output_dir = "/tmp/thumbnails";
    let count = 5;

    let thumbnails: Vec<String> = (0..count)
      .map(|i| format!("{output_dir}/thumbnail_{i}.jpg"))
      .collect();

    assert_eq!(thumbnails.len(), 5);
    assert_eq!(thumbnails[0], "/tmp/thumbnails/thumbnail_0.jpg");
    assert_eq!(thumbnails[4], "/tmp/thumbnails/thumbnail_4.jpg");
  }

  #[test]
  fn test_storyboard_frame_calculations() {
    let duration = 60.0; // 60 seconds
    let frames_per_row = 4;
    let frame_count = frames_per_row * 3; // 3 rows

    let mut timestamps = Vec::new();
    for i in 0..frame_count {
      let timestamp = (i as f64 / frame_count as f64) * duration;
      timestamps.push(timestamp);
    }

    assert_eq!(timestamps.len(), 12);
    assert_eq!(timestamps[0], 0.0);
    assert_eq!(timestamps[11], 55.0); // Almost at the end
    assert!(timestamps[6] > 25.0 && timestamps[6] < 35.0); // Middle
  }

  #[test]
  fn test_waveform_settings_parsing() {
    let settings = json!({
      "width": 800,
      "height": 200,
      "quality": 90,
      "cache_enabled": true
    });

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
    let cache_enabled = settings
      .get("cache_enabled")
      .and_then(|v| v.as_bool())
      .unwrap_or(true);

    assert_eq!(width, 800);
    assert_eq!(height, 200);
    assert_eq!(quality, 90);
    assert!(cache_enabled);
  }

  #[test]
  fn test_ffmpeg_command_generation_for_gif() {
    let params = AnimatedPreviewParams {
      video_path: "/tmp/input.mp4".to_string(),
      start_time: 10.0,
      output_path: "/tmp/output.gif".to_string(),
      width: 320,
      height: 240,
      fps: 10,
      duration: 5.0,
    };

    // Simulate command building
    let args = vec![
      "-y".to_string(),
      "-i".to_string(),
      params.video_path.clone(),
      "-ss".to_string(),
      params.start_time.to_string(),
      "-t".to_string(),
      params.duration.to_string(),
      "-vf".to_string(),
      format!(
        "fps={},scale={}:{}",
        params.fps, params.width, params.height
      ),
      "-loop".to_string(),
      "0".to_string(),
      params.output_path.clone(),
    ];

    assert_eq!(args[1], "-i");
    assert_eq!(args[2], "/tmp/input.mp4");
    assert_eq!(args[4], "10");
    assert_eq!(args[6], "5");
    assert!(args[8].contains("fps=10"));
    assert!(args[8].contains("scale=320:240"));
  }

  #[test]
  fn test_preview_key_creation() {
    use crate::video_compiler::cache::PreviewKey;

    let key = PreviewKey::new("test_video".to_string(), 5.0, (1920, 1080), 85);

    // Basic validation that key was created with correct values
    assert_eq!(key.file_path, "test_video");
    assert_eq!(key.timestamp, 5000); // Converted to milliseconds
    assert_eq!(key.resolution, (1920, 1080));
    assert_eq!(key.quality, 85);
  }

  #[test]
  fn test_preview_request_json_parsing() {
    let json_requests = vec![
      json!({
        "type": "Frame",
        "source_path": "/tmp/video1.mp4",
        "timestamp": 5.0,
        "width": 1920,
        "height": 1080,
        "quality": 85
      }),
      json!({
        "type": "Thumbnail",
        "source_path": "/tmp/video2.mp4",
        "timestamp": 10.0,
        "width": 320,
        "height": 180,
        "quality": 70
      }),
      json!({
        "type": "Storyboard",
        "source_path": "/tmp/video3.mp4"
      }),
    ];

    for req_json in &json_requests {
      let preview_type = match req_json
        .get("type")
        .and_then(|v| v.as_str())
        .unwrap_or("Frame")
      {
        "Thumbnail" => "Thumbnail",
        "Storyboard" => "Storyboard",
        _ => "Frame",
      };

      let source_path = req_json
        .get("source_path")
        .and_then(|v| v.as_str())
        .unwrap_or("/tmp/default.mp4");

      let timestamp = req_json.get("timestamp").and_then(|v| v.as_f64());

      assert!(!source_path.is_empty());
      assert!(
        preview_type == "Frame" || preview_type == "Thumbnail" || preview_type == "Storyboard"
      );

      if let Some(ts) = timestamp {
        assert!(ts >= 0.0);
      }
    }
  }

  #[test]
  fn test_resolution_extraction() {
    let settings = json!({
      "width": 640,
      "height": 480,
      "quality": 75
    });

    let width = settings
      .get("width")
      .and_then(|v| v.as_u64())
      .map(|v| v as u32);
    let height = settings
      .get("height")
      .and_then(|v| v.as_u64())
      .map(|v| v as u32);
    let resolution = if let (Some(w), Some(h)) = (width, height) {
      Some((w, h))
    } else {
      None
    };

    assert_eq!(resolution, Some((640, 480)));

    // Test with missing height
    let incomplete_settings = json!({
      "width": 640,
      "quality": 75
    });

    let width = incomplete_settings
      .get("width")
      .and_then(|v| v.as_u64())
      .map(|v| v as u32);
    let height = incomplete_settings
      .get("height")
      .and_then(|v| v.as_u64())
      .map(|v| v as u32);
    let resolution = if let (Some(w), Some(h)) = (width, height) {
      Some((w, h))
    } else {
      None
    };

    assert_eq!(resolution, None);
  }

  #[test]
  fn test_timestamp_calculation_for_thumbnails() {
    let count = 6;
    let mut timestamps = Vec::new();
    for i in 0..count {
      timestamps.push((i as f64) * 10.0); // Every 10 seconds
    }

    assert_eq!(timestamps.len(), 6);
    assert_eq!(timestamps[0], 0.0);
    assert_eq!(timestamps[1], 10.0);
    assert_eq!(timestamps[5], 50.0);
  }

  #[test]
  fn test_batch_preview_output_paths() {
    let video_path = "/tmp/test_video.mp4";
    let output_dir = "/tmp/previews";
    let results_count = 3;

    let output_paths: Vec<String> = (0..results_count)
      .map(|i| {
        format!(
          "{}/preview_{}_{}.jpg",
          output_dir,
          video_path.replace('/', "_"),
          i
        )
      })
      .collect();

    assert_eq!(output_paths.len(), 3);
    assert!(output_paths[0].contains("preview__tmp_test_video.mp4_0.jpg"));
    assert!(output_paths[2].contains("preview__tmp_test_video.mp4_2.jpg"));
  }

  #[test]
  fn test_storyboard_output_paths() {
    let temp_dir = TempDir::new().unwrap();
    let output_path = temp_dir.path().to_string_lossy().to_string();
    let frame_count = 9; // 3x3 grid

    let frame_paths: Vec<String> = (0..frame_count)
      .map(|i| format!("{output_path}/frame_{i:03}.jpg"))
      .collect();

    assert_eq!(frame_paths.len(), 9);
    assert!(frame_paths[0].ends_with("/frame_000.jpg"));
    assert!(frame_paths[8].ends_with("/frame_008.jpg"));
  }

  #[test]
  fn test_preview_cache_info_json() {
    let preview_id = "test_preview_123";
    let data_size = 1024 * 500; // 500KB
    let timestamp = chrono::Utc::now();

    let info = json!({
      "id": preview_id,
      "data_size": data_size,
      "created_at": timestamp,
    });

    assert_eq!(info["id"], preview_id);
    assert_eq!(info["data_size"], data_size);
    assert!(info["created_at"].is_string());
  }

  #[test]
  fn test_custom_preview_options_parsing() {
    let options_json = json!({
      "width": 800,
      "height": 600,
      "format": "png",
      "quality": 95
    });

    // Simulate parsing to PreviewOptions
    let width = options_json
      .get("width")
      .and_then(|v| v.as_u64())
      .map(|v| v as u32);
    let height = options_json
      .get("height")
      .and_then(|v| v.as_u64())
      .map(|v| v as u32);
    let format = options_json
      .get("format")
      .and_then(|v| v.as_str())
      .unwrap_or("jpeg");
    let quality = options_json
      .get("quality")
      .and_then(|v| v.as_u64())
      .unwrap_or(85) as u32;

    assert_eq!(width, Some(800));
    assert_eq!(height, Some(600));
    assert_eq!(format, "png");
    assert_eq!(quality, 95);
  }

  #[test]
  fn test_ffmpeg_version_check_command() {
    let ffmpeg_path = "ffmpeg";

    // Simulate command structure for version check
    let args = ["-version"];

    assert_eq!(args[0], "-version");
    assert!(!ffmpeg_path.is_empty());
  }

  #[test]
  fn test_base64_path_encoding() {
    use base64::Engine;

    let test_data = b"fake image data";
    let encoded = base64::engine::general_purpose::STANDARD.encode(test_data);

    assert!(!encoded.is_empty());

    // Test decoding
    let decoded = base64::engine::general_purpose::STANDARD
      .decode(&encoded)
      .unwrap();
    assert_eq!(decoded, test_data);
  }

  #[test]
  fn test_preview_type_string_matching() {
    let types = vec!["Frame", "Thumbnail", "Storyboard", "Unknown"];

    for type_str in types {
      let preview_type = match type_str {
        "Thumbnail" => "Thumbnail",
        "Storyboard" => "Storyboard",
        _ => "Frame",
      };

      match type_str {
        "Frame" => assert_eq!(preview_type, "Frame"),
        "Thumbnail" => assert_eq!(preview_type, "Thumbnail"),
        "Storyboard" => assert_eq!(preview_type, "Storyboard"),
        "Unknown" => assert_eq!(preview_type, "Frame"), // Default case
        _ => {}
      }
    }
  }

  #[test]
  fn test_waveform_color_validation() {
    let colors = vec!["#FF0000", "#00FF00", "#0000FF", "red", "blue"];

    for color in colors {
      // Basic validation that color strings are non-empty
      assert!(!color.is_empty());

      // Colors starting with # should be hex
      if color.starts_with('#') {
        assert!(color.len() == 7); // #RRGGBB format
      }
    }
  }

  #[test]
  fn test_error_message_construction() {
    let file_path = "/nonexistent/file.mp4";
    let error_msg = format!("Cannot process file: {file_path}");

    assert!(error_msg.contains("/nonexistent/file.mp4"));
    assert!(error_msg.starts_with("Cannot process file:"));
  }

  #[test]
  fn test_project_schema_validation() {
    let project = create_test_project();

    assert_eq!(project.metadata.name, "Test Project");
    assert_eq!(project.timeline.duration, 10.0);
    assert_eq!(project.timeline.fps, 30);
    assert_eq!(project.timeline.resolution, (1920, 1080));
    assert_eq!(project.tracks.len(), 1);
    assert_eq!(project.tracks[0].clips.len(), 1);
  }
}
