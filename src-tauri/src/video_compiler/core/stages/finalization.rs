//! Finalization Stage - Этап финализации проекта

use async_trait::async_trait;
use std::path::PathBuf;
use std::time::{Duration, SystemTime};

use super::{PipelineContext, PipelineStage};
use crate::video_compiler::error::{Result, VideoCompilerError};

/// Этап финализации
pub struct FinalizationStage;

impl FinalizationStage {
  pub fn new() -> Self {
    Self
  }

  /// Очистка временных файлов
  async fn cleanup_temporary_files(&self, context: &mut PipelineContext) -> Result<()> {
    log::info!("🧹 Очистка временных файлов...");

    let mut cleaned_count = 0;
    let mut total_size_cleaned = 0u64;

    // Очищаем промежуточные файлы
    for (key, path) in &context.intermediate_files {
      if path.exists() {
        if let Ok(metadata) = tokio::fs::metadata(path).await {
          total_size_cleaned += metadata.len();
        }

        match tokio::fs::remove_file(path).await {
          Ok(_) => {
            cleaned_count += 1;
            log::debug!("🗑️ Удален временный файл: {} ({})", key, path.display());
          }
          Err(e) => {
            log::warn!("⚠️ Не удалось удалить файл {}: {}", path.display(), e);
          }
        }
      }
    }

    // Очищаем временную директорию
    if context.temp_dir.exists() {
      match tokio::fs::remove_dir_all(&context.temp_dir).await {
        Ok(_) => {
          log::debug!("🗑️ Удалена временная директория: {:?}", context.temp_dir);
        }
        Err(e) => {
          log::warn!("⚠️ Не удалось удалить временную директорию: {e}");
        }
      }
    }

    context.update_progress(30, "Finalization").await?;

    log::info!(
      "✅ Очищено {} файлов, освобождено {} MB",
      cleaned_count,
      total_size_cleaned / 1_000_000
    );
    Ok(())
  }

  /// Генерация метаданных выходного файла
  async fn generate_output_metadata(&self, context: &mut PipelineContext) -> Result<()> {
    log::info!("📋 Генерация метаданных...");

    let metadata = self.collect_output_metadata(context).await?;
    let metadata_path = context.output_path.with_extension("json");

    // Сохраняем метаданные в JSON файл
    let metadata_json = serde_json::to_string_pretty(&metadata)
      .map_err(|e| VideoCompilerError::SerializationError(e.to_string()))?;

    tokio::fs::write(&metadata_path, metadata_json)
      .await
      .map_err(|e| VideoCompilerError::IoError(e.to_string()))?;

    context.update_progress(60, "Finalization").await?;

    log::info!("✅ Метаданные сохранены: {metadata_path:?}");
    Ok(())
  }

  /// Сбор метаданных выходного файла
  async fn collect_output_metadata(&self, context: &PipelineContext) -> Result<OutputMetadata> {
    let mut metadata = OutputMetadata {
      project_name: context.project.metadata.name.clone(),
      output_file: context.output_path.to_string_lossy().to_string(),
      created_at: SystemTime::now(),
      export_settings: context.project.settings.clone(),
      ..Default::default()
    };

    // Получаем информацию о файле
    if let Ok(file_metadata) = tokio::fs::metadata(&context.output_path).await {
      metadata.file_size = file_metadata.len();
    }

    // Получаем медиа информацию через FFprobe
    if let Ok(media_info) = self.get_media_info(&context.output_path).await {
      metadata.duration = media_info.duration;
      metadata.actual_width = media_info.width;
      metadata.actual_height = media_info.height;
      metadata.actual_fps = media_info.fps;
      metadata.bitrate = media_info.bitrate;
      metadata.codec = media_info.codec;
    }

    // Статистика проекта
    metadata.tracks_count = context.project.tracks.len();
    metadata.clips_count = context
      .project
      .tracks
      .iter()
      .map(|track| track.clips.len())
      .sum();

    Ok(metadata)
  }

  /// Получение медиа информации через FFprobe
  async fn get_media_info(&self, file_path: &PathBuf) -> Result<MediaInfo> {
    let mut command = tokio::process::Command::new("ffprobe");
    command
      .arg("-v")
      .arg("quiet")
      .arg("-print_format")
      .arg("json")
      .arg("-show_format")
      .arg("-show_streams")
      .arg(file_path);

    let output = command
      .output()
      .await
      .map_err(|e| VideoCompilerError::IoError(e.to_string()))?;

    if !output.status.success() {
      let error_msg = String::from_utf8_lossy(&output.stderr);
      return Err(VideoCompilerError::IoError(error_msg.to_string()));
    }

    let json_output = String::from_utf8_lossy(&output.stdout);
    let info: serde_json::Value = serde_json::from_str(&json_output)
      .map_err(|e| VideoCompilerError::SerializationError(e.to_string()))?;

    let mut media_info = MediaInfo::default();

    // Получаем общую длительность
    if let Some(format) = info.get("format") {
      if let Some(duration_str) = format.get("duration").and_then(|d| d.as_str()) {
        media_info.duration = duration_str.parse().unwrap_or(0.0);
      }
      if let Some(bitrate_str) = format.get("bit_rate").and_then(|b| b.as_str()) {
        media_info.bitrate = bitrate_str.parse().unwrap_or(0);
      }
    }

    // Получаем информацию о видеопотоке
    if let Some(streams) = info.get("streams").and_then(|s| s.as_array()) {
      for stream in streams {
        if stream.get("codec_type").and_then(|t| t.as_str()) == Some("video") {
          media_info.width = stream
            .get("width")
            .and_then(|w| w.as_u64())
            .map(|w| w as u32);
          media_info.height = stream
            .get("height")
            .and_then(|h| h.as_u64())
            .map(|h| h as u32);
          media_info.codec = stream
            .get("codec_name")
            .and_then(|c| c.as_str())
            .map(|s| s.to_string());

          // Парсим FPS
          if let Some(fps_str) = stream.get("r_frame_rate").and_then(|f| f.as_str()) {
            media_info.fps = self.parse_fps(fps_str);
          }
          break;
        }
      }
    }

    Ok(media_info)
  }

  /// Парсинг FPS из строки вида "30/1"
  fn parse_fps(&self, fps_str: &str) -> Option<f64> {
    if let Some((num_str, den_str)) = fps_str.split_once('/') {
      if let (Ok(num), Ok(den)) = (num_str.parse::<f64>(), den_str.parse::<f64>()) {
        if den > 0.0 {
          return Some(num / den);
        }
      }
    }
    fps_str.parse().ok()
  }

  /// Создание превью файла
  async fn create_preview_thumbnail(&self, context: &mut PipelineContext) -> Result<()> {
    log::info!("📸 Создание превью...");

    let thumbnail_path = context.output_path.with_extension("jpg");

    let mut command = tokio::process::Command::new("ffmpeg");
    command
      .arg("-i")
      .arg(&context.output_path)
      .arg("-ss")
      .arg("00:00:01") // Кадр через 1 секунду
      .arg("-vframes")
      .arg("1")
      .arg("-vf")
      .arg("scale=320:240") // Маленькое превью
      .arg("-y")
      .arg(&thumbnail_path);

    let output = command
      .output()
      .await
      .map_err(|e| VideoCompilerError::IoError(e.to_string()))?;

    if output.status.success() {
      log::info!("✅ Превью создано: {thumbnail_path:?}");
    } else {
      log::warn!("⚠️ Не удалось создать превью");
    }

    context.update_progress(80, "Finalization").await?;
    Ok(())
  }

  /// Валидация результата
  async fn validate_result(&self, context: &mut PipelineContext) -> Result<()> {
    log::info!("✅ Валидация результата...");

    // Проверяем существование файла
    if !context.output_path.exists() {
      return Err(VideoCompilerError::ValidationError(
        "Выходной файл не существует".to_string(),
      ));
    }

    // Проверяем размер файла
    let metadata = tokio::fs::metadata(&context.output_path)
      .await
      .map_err(|e| VideoCompilerError::IoError(e.to_string()))?;

    if metadata.len() == 0 {
      return Err(VideoCompilerError::ValidationError(
        "Выходной файл пуст".to_string(),
      ));
    }

    // Проверяем целостность через FFprobe
    let media_info = self.get_media_info(&context.output_path).await?;

    if media_info.duration <= 0.0 {
      return Err(VideoCompilerError::ValidationError(
        "Выходной файл имеет нулевую длительность".to_string(),
      ));
    }

    // Проверяем соответствие настройкам экспорта
    let export_settings = &context.project.settings;

    if let (Some(width), Some(height)) = (media_info.width, media_info.height) {
      if width != export_settings.resolution.width || height != export_settings.resolution.height {
        log::warn!(
          "⚠️ Разрешение не соответствует настройкам: {}x{} вместо {}x{}",
          width,
          height,
          export_settings.resolution.width,
          export_settings.resolution.height
        );
      }
    }

    context.update_progress(95, "Finalization").await?;

    log::info!("✅ Результат валиден");
    log::info!("📊 Размер файла: {} MB", metadata.len() / 1_000_000);
    log::info!("⏱️ Длительность: {:.2}s", media_info.duration);

    Ok(())
  }

  /// Отправка уведомления о завершении
  async fn send_completion_notification(&self, context: &mut PipelineContext) -> Result<()> {
    log::info!("📧 Отправка уведомления о завершении...");

    // Здесь можно добавить отправку уведомлений
    // Например, через webhook, email, или системные уведомления

    context.update_progress(100, "Finalization").await?;

    log::info!("🎉 Обработка завершена успешно!");
    log::info!("📁 Выходной файл: {:?}", context.output_path);

    Ok(())
  }
}

#[async_trait]
impl PipelineStage for FinalizationStage {
  async fn process(&self, context: &mut PipelineContext) -> Result<()> {
    log::info!("🏁 === Этап финализации ===");

    // Валидация результата
    self.validate_result(context).await?;

    // Создание превью
    self.create_preview_thumbnail(context).await?;

    // Генерация метаданных
    self.generate_output_metadata(context).await?;

    // Очистка временных файлов
    self.cleanup_temporary_files(context).await?;

    // Отправка уведомления
    self.send_completion_notification(context).await?;

    log::info!("✅ Финализация завершена успешно");
    Ok(())
  }

  fn name(&self) -> &str {
    "Finalization"
  }

  fn estimated_duration(&self) -> Duration {
    Duration::from_secs(30)
  }
}

impl Default for FinalizationStage {
  fn default() -> Self {
    Self::new()
  }
}

/// Метаданные выходного файла
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
struct OutputMetadata {
  project_name: String,
  output_file: String,
  created_at: SystemTime,
  file_size: u64,
  duration: f64,
  export_settings: crate::video_compiler::schema::export::ProjectSettings,
  actual_width: Option<u32>,
  actual_height: Option<u32>,
  actual_fps: Option<f64>,
  bitrate: u64,
  codec: Option<String>,
  tracks_count: usize,
  clips_count: usize,
}

impl Default for OutputMetadata {
  fn default() -> Self {
    Self {
      project_name: String::new(),
      output_file: String::new(),
      created_at: SystemTime::now(),
      file_size: 0,
      duration: 0.0,
      export_settings: crate::video_compiler::schema::export::ProjectSettings::default(),
      actual_width: None,
      actual_height: None,
      actual_fps: None,
      bitrate: 0,
      codec: None,
      tracks_count: 0,
      clips_count: 0,
    }
  }
}

/// Информация о медиафайле
#[derive(Debug, Default)]
struct MediaInfo {
  duration: f64,
  width: Option<u32>,
  height: Option<u32>,
  fps: Option<f64>,
  bitrate: u64,
  codec: Option<String>,
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_fps_parsing() {
    let stage = FinalizationStage::new();
    assert_eq!(stage.parse_fps("30/1"), Some(30.0));
    assert_eq!(stage.parse_fps("24000/1001"), Some(23.976023976023978));
    assert_eq!(stage.parse_fps("25"), Some(25.0));
    assert_eq!(stage.parse_fps("invalid"), None);
  }

  #[tokio::test]
  async fn test_finalization_stage_basic() {
    let stage = FinalizationStage::new();
    assert_eq!(stage.name(), "Finalization");
    assert!(!stage.estimated_duration().is_zero());
  }
}
