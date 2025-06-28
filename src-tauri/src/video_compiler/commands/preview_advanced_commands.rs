//! Preview Advanced Commands - дополнительные команды для работы с превью

use crate::video_compiler::core::preview::{PreviewGenerator, PreviewOptions, PreviewRequest};
use crate::video_compiler::error::Result;
use crate::video_compiler::VideoCompilerState;
use base64::Engine;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::State;

/// Параметры для пакетной генерации превью
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchPreviewParams {
  pub video_paths: Vec<String>,
  pub timestamps: Vec<f64>,
  pub width: u32,
  pub height: u32,
  pub quality: u8,
  pub output_dir: Option<String>,
}

/// Результат генерации превью
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreviewResult {
  pub success: bool,
  pub width: u32,
  pub height: u32,
  pub timestamp: f64,
  pub preview_data: Vec<u8>,
  pub path: Option<String>,
  pub error: Option<String>,
}

/// Создать генератор превью с кастомным путем к FFmpeg
#[tauri::command]
pub async fn create_preview_generator_with_ffmpeg(
  ffmpeg_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  // Создаем новый генератор с указанным путем к FFmpeg
  let _generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path.clone());

  // Генерируем уникальный ID для генератора
  let generator_id = format!("preview_gen_{}", uuid::Uuid::new_v4());

  // В реальной реализации здесь бы сохранялся генератор в состоянии
  // Пока просто обновляем путь к FFmpeg в состоянии
  {
    let mut ffmpeg_path_state = state.ffmpeg_path.write().await;
    *ffmpeg_path_state = ffmpeg_path;
  }

  Ok(generator_id)
}

/// Установить путь к FFmpeg для существующего генератора (расширенная версия)
#[tauri::command]
pub async fn set_preview_generator_ffmpeg_path_advanced(
  new_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  // Обновляем путь к FFmpeg в состоянии
  {
    let mut ffmpeg_path_state = state.ffmpeg_path.write().await;
    *ffmpeg_path_state = new_path.clone();
  }

  // В реальной реализации здесь бы обновлялся путь в конкретном генераторе
  log::info!("FFmpeg path updated to: {new_path}");

  Ok(())
}

/// Генерировать превью для пакета видео
#[tauri::command]
pub async fn generate_preview_batch_advanced(
  params: BatchPreviewParams,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<PreviewResult>> {
  if params.video_paths.len() != params.timestamps.len() {
    return Err(
      crate::video_compiler::error::VideoCompilerError::validation(
        "Video paths and timestamps must have the same length".to_string(),
      ),
    );
  }

  // Получаем путь к FFmpeg
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();

  // Создаем генератор
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);

  // Настройки превью
  let _options = PreviewOptions {
    width: Some(params.width),
    height: Some(params.height),
    quality: params.quality,
    format: "jpg".to_string(),
  };

  // Подготавливаем список запросов
  let requests: Vec<PreviewRequest> = params
    .video_paths
    .into_iter()
    .zip(params.timestamps.into_iter())
    .map(|(video_path, timestamp)| PreviewRequest {
      video_path,
      timestamp,
      resolution: Some((params.width, params.height)),
      quality: Some(params.quality),
    })
    .collect();

  // Генерируем превью пакетом
  let results = generator.generate_preview_batch(requests).await?;

  // Конвертируем результаты в нужный формат
  Ok(
    results
      .into_iter()
      .map(|r| {
        // Декодируем base64 обратно в байты если есть данные
        let preview_data = if let Some(base64_data) = r.image_data {
          base64::engine::general_purpose::STANDARD
            .decode(&base64_data)
            .unwrap_or_default()
        } else {
          Vec::new()
        };

        PreviewResult {
          success: r.error.is_none(),
          width: params.width,
          height: params.height,
          timestamp: r.timestamp,
          preview_data,
          path: None,
          error: r.error,
        }
      })
      .collect(),
  )
}

/// Генерировать отдельный кадр из видео
#[tauri::command]
pub async fn generate_single_frame_preview(
  video_path: String,
  timestamp: f64,
  _output_path: Option<String>,
  width: Option<u32>,
  height: Option<u32>,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<u8>> {
  // Получаем путь к FFmpeg
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();

  // Создаем генератор
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);

  // Генерируем кадр используя generate_preview
  let video_path = PathBuf::from(video_path);
  let resolution = match (width, height) {
    (Some(w), Some(h)) => Some((w, h)),
    _ => Some((1920, 1080)),
  };

  let result = generator
    .generate_preview(&video_path, timestamp, resolution, Some(90))
    .await?;

  Ok(result)
}

/// Информация о возможностях генератора превью
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PreviewGeneratorInfo {
  pub ffmpeg_path: String,
  pub supported_formats: Vec<String>,
  pub max_concurrent_jobs: usize,
  pub cache_enabled: bool,
}

/// Получить информацию о генераторе превью
#[tauri::command]
pub async fn get_preview_generator_info(
  state: State<'_, VideoCompilerState>,
) -> Result<PreviewGeneratorInfo> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();

  Ok(PreviewGeneratorInfo {
    ffmpeg_path,
    supported_formats: vec![
      "mp4".to_string(),
      "mov".to_string(),
      "avi".to_string(),
      "mkv".to_string(),
      "webm".to_string(),
    ],
    max_concurrent_jobs: 4,
    cache_enabled: true,
  })
}

/// Параметры для генерации превью с расширенными опциями
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AdvancedPreviewOptions {
  pub width: u32,
  pub height: u32,
  pub quality: u8,
  pub format: String,
  pub apply_filters: bool,
  pub watermark: Option<String>,
  pub output_dir: Option<String>,
}

/// Генерировать превью с расширенными опциями
#[tauri::command]
pub async fn generate_preview_with_options(
  video_path: String,
  timestamp: f64,
  options: AdvancedPreviewOptions,
  state: State<'_, VideoCompilerState>,
) -> Result<PreviewResult> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);

  // В реальной реализации здесь бы применялись дополнительные фильтры и watermark
  let video_path = PathBuf::from(video_path);

  // Генерируем превью
  let resolution = Some((options.width, options.height));
  let preview_data = generator
    .generate_preview(&video_path, timestamp, resolution, Some(options.quality))
    .await?;

  Ok(PreviewResult {
    success: true,
    width: options.width,
    height: options.height,
    timestamp,
    preview_data,
    path: options.output_dir,
    error: None,
  })
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_batch_preview_params_serialization() {
    let params = BatchPreviewParams {
      video_paths: vec!["video1.mp4".to_string(), "video2.mp4".to_string()],
      timestamps: vec![5.0, 10.0],
      width: 1920,
      height: 1080,
      quality: 90,
      output_dir: Some("/tmp/previews".to_string()),
    };

    let json = serde_json::to_string(&params).unwrap();
    assert!(json.contains("video1.mp4"));
    assert!(json.contains("1920"));
  }

  #[test]
  fn test_preview_generator_info_serialization() {
    let info = PreviewGeneratorInfo {
      ffmpeg_path: "/usr/bin/ffmpeg".to_string(),
      supported_formats: vec!["mp4".to_string()],
      max_concurrent_jobs: 4,
      cache_enabled: true,
    };

    let json = serde_json::to_string(&info).unwrap();
    assert!(json.contains("ffmpeg"));
    assert!(json.contains("mp4"));
  }
}
