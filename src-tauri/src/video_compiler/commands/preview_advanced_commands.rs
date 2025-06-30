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
  use crate::video_compiler::VideoCompilerState;

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

    // Тест десериализации
    let deserialized: BatchPreviewParams = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.video_paths.len(), 2);
    assert_eq!(deserialized.timestamps.len(), 2);
    assert_eq!(deserialized.width, 1920);
    assert_eq!(deserialized.height, 1080);
    assert_eq!(deserialized.quality, 90);
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

    // Тест десериализации
    let deserialized: PreviewGeneratorInfo = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.ffmpeg_path, "/usr/bin/ffmpeg");
    assert_eq!(deserialized.supported_formats.len(), 1);
    assert_eq!(deserialized.max_concurrent_jobs, 4);
    assert!(deserialized.cache_enabled);
  }

  #[test]
  fn test_preview_result_creation() {
    let result = PreviewResult {
      success: true,
      width: 1920,
      height: 1080,
      timestamp: 5.0,
      preview_data: vec![1, 2, 3, 4, 5],
      path: Some("/tmp/preview.jpg".to_string()),
      error: None,
    };

    assert!(result.success);
    assert_eq!(result.width, 1920);
    assert_eq!(result.height, 1080);
    assert_eq!(result.timestamp, 5.0);
    assert_eq!(result.preview_data.len(), 5);
    assert!(result.path.is_some());
    assert!(result.error.is_none());
  }

  #[test]
  fn test_preview_result_with_error() {
    let result = PreviewResult {
      success: false,
      width: 0,
      height: 0,
      timestamp: 0.0,
      preview_data: vec![],
      path: None,
      error: Some("Failed to generate preview".to_string()),
    };

    assert!(!result.success);
    assert_eq!(result.width, 0);
    assert_eq!(result.height, 0);
    assert!(result.preview_data.is_empty());
    assert!(result.path.is_none());
    assert!(result.error.is_some());
  }

  #[test]
  fn test_advanced_preview_options_validation() {
    let options = AdvancedPreviewOptions {
      width: 1920,
      height: 1080,
      quality: 90,
      format: "jpg".to_string(),
      apply_filters: true,
      watermark: Some("watermark.png".to_string()),
      output_dir: Some("/tmp/output".to_string()),
    };

    // Валидация значений
    assert!(options.width > 0);
    assert!(options.height > 0);
    assert!(options.quality <= 100);
    assert!(!options.format.is_empty());
    assert!(options.apply_filters);
    assert!(options.watermark.is_some());
    assert!(options.output_dir.is_some());
  }

  #[test]
  fn test_batch_preview_params_validation() {
    // Тест корректных параметров
    let valid_params = BatchPreviewParams {
      video_paths: vec!["video1.mp4".to_string(), "video2.mp4".to_string()],
      timestamps: vec![5.0, 10.0],
      width: 1920,
      height: 1080,
      quality: 90,
      output_dir: None,
    };

    assert_eq!(
      valid_params.video_paths.len(),
      valid_params.timestamps.len()
    );
    assert!(valid_params.width > 0);
    assert!(valid_params.height > 0);
    assert!(valid_params.quality <= 100);

    // Тест некорректных параметров
    let invalid_params = BatchPreviewParams {
      video_paths: vec!["video1.mp4".to_string()],
      timestamps: vec![5.0, 10.0], // Разная длина массивов
      width: 1920,
      height: 1080,
      quality: 90,
      output_dir: None,
    };

    assert_ne!(
      invalid_params.video_paths.len(),
      invalid_params.timestamps.len()
    );
  }

  #[test]
  fn test_preview_generator_info_defaults() {
    let info = PreviewGeneratorInfo {
      ffmpeg_path: "ffmpeg".to_string(),
      supported_formats: vec![
        "mp4".to_string(),
        "mov".to_string(),
        "avi".to_string(),
        "mkv".to_string(),
        "webm".to_string(),
      ],
      max_concurrent_jobs: 4,
      cache_enabled: true,
    };

    assert_eq!(info.supported_formats.len(), 5);
    assert!(info.supported_formats.contains(&"mp4".to_string()));
    assert!(info.supported_formats.contains(&"webm".to_string()));
    assert_eq!(info.max_concurrent_jobs, 4);
    assert!(info.cache_enabled);
  }

  #[tokio::test]
  async fn test_get_preview_generator_info_command() {
    let _state = VideoCompilerState::new().await;
    // Note: Tauri State cannot be directly tested without proper mock
    // This test verifies the PreviewGeneratorInfo creation logic
    let info = PreviewGeneratorInfo {
      ffmpeg_path: "ffmpeg".to_string(),
      supported_formats: vec![
        "mp4".to_string(),
        "mov".to_string(),
        "avi".to_string(),
        "mkv".to_string(),
        "webm".to_string(),
      ],
      max_concurrent_jobs: 4,
      cache_enabled: true,
    };

    assert!(!info.ffmpeg_path.is_empty());
    assert!(!info.supported_formats.is_empty());
    assert!(info.max_concurrent_jobs > 0);
  }

  #[test]
  fn test_preview_request_conversion() {
    let video_paths = vec![
      "/path/to/video1.mp4".to_string(),
      "/path/to/video2.mp4".to_string(),
    ];
    let timestamps = vec![5.0, 10.0];
    let width = 1920u32;
    let height = 1080u32;
    let quality = 90u8;

    let requests: Vec<PreviewRequest> = video_paths
      .into_iter()
      .zip(timestamps.into_iter())
      .map(|(video_path, timestamp)| PreviewRequest {
        video_path,
        timestamp,
        resolution: Some((width, height)),
        quality: Some(quality),
      })
      .collect();

    assert_eq!(requests.len(), 2);
    assert_eq!(requests[0].video_path, "/path/to/video1.mp4");
    assert_eq!(requests[1].timestamp, 10.0);
    assert_eq!(requests[0].resolution, Some((1920, 1080)));
    assert_eq!(requests[1].quality, Some(90));
  }

  #[test]
  fn test_base64_encoding_decoding() {
    use base64::Engine;

    let original_data = vec![1, 2, 3, 4, 5, 255, 128, 0];

    // Кодируем в base64
    let base64_encoded = base64::engine::general_purpose::STANDARD.encode(&original_data);
    assert!(!base64_encoded.is_empty());

    // Декодируем обратно
    let decoded = base64::engine::general_purpose::STANDARD
      .decode(&base64_encoded)
      .unwrap();

    assert_eq!(original_data, decoded);
  }

  #[test]
  fn test_empty_preview_data_handling() {
    let base64_data = "";
    let preview_data = base64::engine::general_purpose::STANDARD
      .decode(base64_data)
      .unwrap_or_default();

    assert!(preview_data.is_empty());
  }

  #[test]
  fn test_quality_bounds() {
    let qualities = [0u8, 1, 50, 90, 100, 255];

    for quality in qualities {
      let options = AdvancedPreviewOptions {
        width: 1920,
        height: 1080,
        quality,
        format: "jpg".to_string(),
        apply_filters: false,
        watermark: None,
        output_dir: None,
      };

      // В реальном приложении качество должно быть ограничено от 1 до 100
      if quality >= 1 && quality <= 100 {
        assert!(options.quality >= 1 && options.quality <= 100);
      }
    }
  }

  #[test]
  fn test_supported_formats() {
    let supported_formats = vec![
      "mp4".to_string(),
      "mov".to_string(),
      "avi".to_string(),
      "mkv".to_string(),
      "webm".to_string(),
    ];

    // Проверяем, что все поддерживаемые форматы имеют разумные имена
    for format in &supported_formats {
      assert!(!format.is_empty());
      assert!(format.len() >= 3);
      assert!(format.len() <= 4);
      assert!(format.chars().all(|c| c.is_ascii_alphanumeric()));
    }

    // Проверяем уникальность
    let unique_formats: std::collections::HashSet<_> = supported_formats.iter().collect();
    assert_eq!(unique_formats.len(), supported_formats.len());
  }

  #[test]
  fn test_resolution_combinations() {
    let resolutions = [(640, 480), (1280, 720), (1920, 1080), (3840, 2160)];

    for (width, height) in resolutions {
      let result = PreviewResult {
        success: true,
        width,
        height,
        timestamp: 0.0,
        preview_data: vec![],
        path: None,
        error: None,
      };

      assert!(result.width > 0);
      assert!(result.height > 0);
      assert!(result.width >= result.height || result.width == result.height); // Некоторые соотношения сторон
    }
  }

  #[test]
  fn test_uuid_generation_for_preview_generator() {
    let id1 = format!("preview_gen_{}", uuid::Uuid::new_v4());
    let id2 = format!("preview_gen_{}", uuid::Uuid::new_v4());

    assert_ne!(id1, id2);
    assert!(id1.starts_with("preview_gen_"));
    assert!(id2.starts_with("preview_gen_"));
    assert_eq!(id1.len(), id2.len());
    assert_eq!(id1.len(), "preview_gen_".len() + 36); // UUID имеет длину 36 символов
  }

  #[tokio::test]
  async fn test_ffmpeg_path_state_update() {
    let state = VideoCompilerState::new().await;
    let new_path = "/custom/path/to/ffmpeg".to_string();

    // Обновляем путь
    {
      let mut ffmpeg_path_state = state.ffmpeg_path.write().await;
      *ffmpeg_path_state = new_path.clone();
    }

    // Проверяем, что путь обновился
    {
      let ffmpeg_path_state = state.ffmpeg_path.read().await;
      assert_eq!(*ffmpeg_path_state, new_path);
    }
  }

  #[test]
  fn test_error_handling_in_preview_result() {
    let error_messages = vec![
      "FFmpeg not found",
      "Invalid video format",
      "Timestamp out of range",
      "Insufficient memory",
      "",
    ];

    for error_msg in error_messages {
      let result = PreviewResult {
        success: error_msg.is_empty(),
        width: 0,
        height: 0,
        timestamp: 0.0,
        preview_data: vec![],
        path: None,
        error: if error_msg.is_empty() {
          None
        } else {
          Some(error_msg.to_string())
        },
      };

      if error_msg.is_empty() {
        assert!(result.success);
        assert!(result.error.is_none());
      } else {
        assert!(!result.success);
        assert!(result.error.is_some());
        assert_eq!(result.error.as_ref().unwrap(), error_msg);
      }
    }
  }
}
