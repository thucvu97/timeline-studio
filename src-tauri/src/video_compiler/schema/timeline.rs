//! Timeline - Timeline, треки и клипы

use serde::{Deserialize, Serialize};
use std::path::PathBuf;

use super::common::AspectRatio;

/// Источник клипа
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum ClipSource {
  /// Файл на диске
  File(String),
  /// Сгенерированный контент (цветовая заливка, тестовые сигналы и т.д.)
  Generated,
  /// Поток (URL, RTMP и т.д.)
  Stream(String),
  /// Устройство (камера, микрофон)
  Device(String),
}

/// Настройки timeline
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Timeline {
  /// Общая продолжительность в секундах
  pub duration: f64,
  /// Кадры в секунду
  pub fps: u32,
  /// Разрешение видео (ширина, высота)
  pub resolution: (u32, u32),
  /// Частота дискретизации аудио
  pub sample_rate: u32,
  /// Соотношение сторон
  pub aspect_ratio: AspectRatio,
}

impl Default for Timeline {
  fn default() -> Self {
    Self {
      duration: 0.0,
      fps: 30,
      resolution: (1920, 1080),
      sample_rate: 48000,
      aspect_ratio: AspectRatio::Ratio16x9,
    }
  }
}

/// Дорожка timeline (видео, аудио, субтитры)
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Track {
  /// Уникальный идентификатор трека
  pub id: String,
  /// Тип трека
  pub track_type: TrackType,
  /// Название трека
  pub name: String,
  /// Включен ли трек
  pub enabled: bool,
  /// Громкость трека (0.0 - 1.0)
  pub volume: f32,
  /// Заблокирован ли трек для редактирования
  pub locked: bool,
  /// Список клипов в треке
  pub clips: Vec<Clip>,
  /// ID эффектов, применяемых ко всему треку
  pub effects: Vec<String>,
  /// ID фильтров, применяемых ко всему треку
  pub filters: Vec<String>,
}

impl Track {
  /// Создать новый трек
  pub fn new(track_type: TrackType, name: String) -> Self {
    Self {
      id: uuid::Uuid::new_v4().to_string(),
      track_type,
      name,
      enabled: true,
      volume: 1.0,
      locked: false,
      clips: Vec::new(),
      effects: Vec::new(),
      filters: Vec::new(),
    }
  }

  /// Валидация трека
  pub fn validate(&self) -> Result<(), String> {
    if self.name.is_empty() {
      return Err("Название трека не может быть пустым".to_string());
    }

    if self.volume < 0.0 || self.volume > 2.0 {
      return Err("Громкость трека должна быть в диапазоне 0.0-2.0".to_string());
    }

    // Валидация клипов
    for clip in &self.clips {
      clip.validate()?;
    }

    Ok(())
  }

  /// Добавить клип в трек
  pub fn add_clip(&mut self, clip: Clip) {
    self.clips.push(clip);
    self
      .clips
      .sort_by(|a, b| a.start_time.partial_cmp(&b.start_time).unwrap());
  }

  /// Удалить клип из трека
  pub fn remove_clip(&mut self, clip_id: &str) {
    self.clips.retain(|c| c.id != clip_id);
  }
}

/// Тип трека
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum TrackType {
  /// Видео трек
  Video,
  /// Аудио трек
  Audio,
  /// Трек субтитров
  Subtitle,
}

/// Медиаклип на треке
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Clip {
  /// Уникальный идентификатор клипа
  pub id: String,
  /// Источник клипа
  pub source: ClipSource,
  /// Время начала клипа на timeline
  pub start_time: f64,
  /// Время окончания клипа на timeline
  pub end_time: f64,
  /// Время начала в исходном файле
  pub source_start: f64,
  /// Время окончания в исходном файле
  pub source_end: f64,
  /// Скорость воспроизведения (1.0 = нормальная)
  pub speed: f64,
  /// Прозрачность (0.0 - 1.0)
  pub opacity: f32,
  /// ID эффектов, применяемых к клипу
  pub effects: Vec<String>,
  /// ID фильтров, применяемых к клипу
  pub filters: Vec<String>,
  /// ID шаблона раскладки (для многокамерных эффектов)
  pub template_id: Option<String>,
  /// Позиция клипа в шаблоне
  pub template_position: Option<usize>,
  /// Настройки цветокоррекции
  pub color_correction: Option<ColorCorrection>,
  /// Настройки обрезки (кроп)
  pub crop: Option<CropSettings>,
  /// Настройки трансформации
  pub transform: Option<TransformSettings>,
  /// Альтернативный аудио трек
  pub audio_track_index: Option<u32>,
  /// Дополнительные свойства клипа
  pub properties: ClipProperties,
}

impl Clip {
  /// Создать новый клип
  pub fn new(source_path: PathBuf, start_time: f64, duration: f64) -> Self {
    Self {
      id: uuid::Uuid::new_v4().to_string(),
      source: ClipSource::File(source_path.to_string_lossy().to_string()),
      start_time,
      end_time: start_time + duration,
      source_start: 0.0,
      source_end: duration,
      speed: 1.0,
      opacity: 1.0,
      effects: Vec::new(),
      filters: Vec::new(),
      template_id: None,
      template_position: None,
      color_correction: None,
      crop: None,
      transform: None,
      audio_track_index: None,
      properties: ClipProperties::default(),
    }
  }

  /// Валидация клипа
  pub fn validate(&self) -> Result<(), String> {
    if let ClipSource::File(path) = &self.source {
      if path.is_empty() {
        return Err("Путь к исходному файлу не может быть пустым".to_string());
      }
    }

    if self.start_time < 0.0 {
      return Err("Время начала клипа не может быть отрицательным".to_string());
    }

    if self.end_time <= self.start_time {
      return Err("Время окончания должно быть больше времени начала".to_string());
    }

    if self.speed <= 0.0 {
      return Err("Скорость воспроизведения должна быть больше 0".to_string());
    }

    if self.opacity < 0.0 || self.opacity > 1.0 {
      return Err("Прозрачность должна быть в диапазоне 0.0-1.0".to_string());
    }

    Ok(())
  }

  /// Получить длительность клипа на timeline
  pub fn get_timeline_duration(&self) -> f64 {
    self.end_time - self.start_time
  }

  /// Получить длительность из исходного файла
  pub fn get_source_duration(&self) -> f64 {
    (self.source_end - self.source_start) / self.speed
  }

  /// Проверить, содержит ли клип заданную точку времени
  pub fn contains_time(&self, time: f64) -> bool {
    time >= self.start_time && time < self.end_time
  }
}

/// Настройки цветокоррекции
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ColorCorrection {
  pub brightness: f32,
  pub contrast: f32,
  pub saturation: f32,
  pub hue: f32,
  pub gamma: f32,
  pub highlights: f32,
  pub shadows: f32,
  pub whites: f32,
  pub blacks: f32,
}

impl Default for ColorCorrection {
  fn default() -> Self {
    Self {
      brightness: 0.0,
      contrast: 1.0,
      saturation: 1.0,
      hue: 0.0,
      gamma: 1.0,
      highlights: 0.0,
      shadows: 0.0,
      whites: 0.0,
      blacks: 0.0,
    }
  }
}

/// Настройки обрезки (кроп)
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct CropSettings {
  pub left: u32,
  pub top: u32,
  pub right: u32,
  pub bottom: u32,
}

/// Настройки трансформации
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TransformSettings {
  pub scale_x: f32,
  pub scale_y: f32,
  pub position_x: f32,
  pub position_y: f32,
  pub rotation: f32,
  pub anchor_x: f32,
  pub anchor_y: f32,
}

impl Default for TransformSettings {
  fn default() -> Self {
    Self {
      scale_x: 1.0,
      scale_y: 1.0,
      position_x: 0.0,
      position_y: 0.0,
      rotation: 0.0,
      anchor_x: 0.5,
      anchor_y: 0.5,
    }
  }
}

/// Дополнительные свойства клипа
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct ClipProperties {
  /// Заметки о клипе
  pub notes: Option<String>,
  /// Теги для поиска и организации
  pub tags: Vec<String>,
  /// Пользовательские метаданные
  pub custom_metadata: std::collections::HashMap<String, serde_json::Value>,
}
