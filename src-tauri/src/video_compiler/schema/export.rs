//! Export - Настройки экспорта и форматы вывода

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use super::common::Resolution;

/// Настройки проекта
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProjectSettings {
  /// Настройки экспорта
  pub export: ExportSettings,
  /// Настройки превью
  pub preview: PreviewSettings,
  /// Пользовательские настройки
  pub custom: HashMap<String, serde_json::Value>,
  /// Настройки вывода (для обратной совместимости)
  pub output: OutputSettings,
  /// Разрешение (для обратной совместимости)
  pub resolution: Resolution,
  /// Частота кадров (для обратной совместимости)
  pub frame_rate: f64,
  /// Соотношение сторон (для обратной совместимости)
  pub aspect_ratio: super::common::AspectRatio,
}

/// Настройки вывода (для обратной совместимости)
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct OutputSettings {
  /// Формат вывода
  pub format: OutputFormat,
  /// Качество (от 0 до 100)
  pub quality: u32,
  /// Видео битрейт в kbps
  pub video_bitrate: Option<u32>,
  /// Аудио битрейт в kbps
  pub audio_bitrate: Option<u32>,
  /// Длительность вывода
  pub duration: f64,
}

impl Default for OutputSettings {
  fn default() -> Self {
    Self {
      format: OutputFormat::Mp4,
      quality: 85,
      video_bitrate: None,
      audio_bitrate: Some(192),
      duration: 0.0,
    }
  }
}

impl Default for ProjectSettings {
  fn default() -> Self {
    Self {
      export: ExportSettings::default(),
      preview: PreviewSettings::default(),
      custom: HashMap::new(),
      output: OutputSettings::default(),
      resolution: Resolution::full_hd(),
      frame_rate: 30.0,
      aspect_ratio: crate::video_compiler::schema::AspectRatio::default(),
    }
  }
}

/// Настройки экспорта
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ExportSettings {
  /// Формат вывода
  pub format: OutputFormat,
  /// Качество (от 1 до 100)
  pub quality: u8,
  /// Битрейт видео (kbps)
  pub video_bitrate: u32,
  /// Битрейт аудио (kbps)
  pub audio_bitrate: u32,
  /// Использовать аппаратное ускорение
  pub hardware_acceleration: bool,
  /// Предпочитаемый GPU кодировщик (опционально)
  pub preferred_gpu_encoder: Option<String>,
  /// Дополнительные параметры FFmpeg
  pub ffmpeg_args: Vec<String>,

  // Новые поля для расширенных настроек
  /// Профиль кодирования
  pub encoding_profile: Option<String>,
  /// Режим контроля битрейта
  pub rate_control_mode: Option<String>,
  /// Интервал ключевых кадров (GOP size)
  pub keyframe_interval: Option<u32>,
  /// Количество B-кадров
  pub b_frames: Option<u32>,
  /// Количество проходов кодирования (1 или 2)
  pub multi_pass: Option<u8>,
  /// Пресет скорости кодирования
  pub preset: Option<String>,
  /// Максимальный битрейт
  pub max_bitrate: Option<u32>,
  /// Минимальный битрейт
  pub min_bitrate: Option<u32>,
  /// CRF значение (0-51)
  pub crf: Option<u8>,
  /// Оптимизация для скорости
  pub optimize_for_speed: Option<bool>,
  /// Оптимизация для сети
  pub optimize_for_network: Option<bool>,
  /// Нормализация аудио
  pub normalize_audio: Option<bool>,
  /// Целевой уровень аудио в LKFS
  pub audio_target: Option<f32>,
  /// Пиковый уровень аудио в dBTP
  pub audio_peak: Option<f32>,
}

impl Default for ExportSettings {
  fn default() -> Self {
    Self {
      format: OutputFormat::Mp4,
      quality: 85,
      video_bitrate: 8000,
      audio_bitrate: 192,
      hardware_acceleration: true,
      preferred_gpu_encoder: None,
      ffmpeg_args: Vec::new(),

      // Новые поля по умолчанию
      encoding_profile: Some("main".to_string()),
      rate_control_mode: Some("vbr".to_string()),
      keyframe_interval: Some(60),
      b_frames: Some(2),
      multi_pass: Some(1),
      preset: Some("medium".to_string()),
      max_bitrate: None,
      min_bitrate: None,
      crf: None,
      optimize_for_speed: Some(false),
      optimize_for_network: Some(false),
      normalize_audio: Some(false),
      audio_target: Some(-23.0),
      audio_peak: Some(-1.0),
    }
  }
}

/// Формат вывода видео
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum OutputFormat {
  Mp4,
  Avi,
  Mov,
  Mkv,
  WebM,
  Gif,
  Custom(String),
}

/// Настройки превью
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PreviewSettings {
  /// Разрешение превью
  pub resolution: (u32, u32),
  /// Качество превью (от 1 до 100)
  pub quality: u8,
  /// FPS превью
  pub fps: u32,
  /// Формат превью
  pub format: PreviewFormat,
}

impl Default for PreviewSettings {
  fn default() -> Self {
    Self {
      resolution: (640, 360),
      quality: 75,
      fps: 15,
      format: PreviewFormat::Jpeg,
    }
  }
}

/// Формат превью
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum PreviewFormat {
  Jpeg,
  Png,
  WebP,
}

#[cfg(test)]
mod export_tests;
