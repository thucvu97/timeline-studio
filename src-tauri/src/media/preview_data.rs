use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// Единая структура для всех данных превью медиафайла
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaPreviewData {
  /// ID медиафайла
  pub file_id: String,

  /// Путь к исходному файлу
  pub file_path: PathBuf,

  /// Превью для браузера (одиночное)
  pub browser_thumbnail: Option<ThumbnailData>,

  /// Превью для таймлайна (множественные)
  pub timeline_previews: Vec<TimelinePreview>,

  /// Кадры для распознавания
  pub recognition_frames: Vec<RecognitionFrame>,

  /// Результаты распознавания
  pub recognition_results: Option<RecognitionResults>,

  /// Время последнего обновления
  pub last_updated: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ThumbnailData {
  /// Путь к файлу превью
  pub path: PathBuf,

  /// Base64 данные (опционально)
  pub base64_data: Option<String>,

  /// Временная метка кадра
  pub timestamp: f64,

  /// Разрешение
  pub width: u32,
  pub height: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelinePreview {
  /// Временная метка
  pub timestamp: f64,

  /// Путь к превью
  pub path: PathBuf,

  /// Base64 данные (для быстрой загрузки)
  pub base64_data: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecognitionFrame {
  /// Временная метка кадра
  pub timestamp: f64,

  /// Путь к кадру высокого разрешения
  pub path: PathBuf,

  /// Статус обработки
  pub processed: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecognitionResults {
  /// Обнаруженные объекты
  pub objects: Vec<DetectedObject>,

  /// Обнаруженные лица
  pub faces: Vec<DetectedFace>,

  /// Обнаруженные сцены
  pub scenes: Vec<DetectedScene>,

  /// Время обработки
  pub processed_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedObject {
  /// Класс объекта (person, car, etc.)
  pub class: String,

  /// Уверенность (0.0 - 1.0)
  pub confidence: f32,

  /// Временные метки появления
  pub timestamps: Vec<f64>,

  /// Bounding boxes для каждого появления
  pub bounding_boxes: Vec<BoundingBox>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedFace {
  /// ID лица (для группировки)
  pub face_id: Option<String>,

  /// Имя человека (если известно)
  pub person_name: Option<String>,

  /// Уверенность
  pub confidence: f32,

  /// Временные метки появления
  pub timestamps: Vec<f64>,

  /// Bounding boxes
  pub bounding_boxes: Vec<BoundingBox>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DetectedScene {
  /// Тип сцены (indoor, outdoor, etc.)
  pub scene_type: String,

  /// Начало и конец сцены
  pub start_time: f64,
  pub end_time: f64,

  /// Ключевые объекты в сцене
  pub key_objects: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BoundingBox {
  pub x: f32,
  pub y: f32,
  pub width: f32,
  pub height: f32,
}

impl MediaPreviewData {
  pub fn new(file_id: String, file_path: PathBuf) -> Self {
    Self {
      file_id,
      file_path,
      browser_thumbnail: None,
      timeline_previews: Vec::new(),
      recognition_frames: Vec::new(),
      recognition_results: None,
      last_updated: chrono::Utc::now(),
    }
  }

  /// Добавить превью для браузера
  #[allow(dead_code)]
  pub fn set_browser_thumbnail(&mut self, thumbnail: ThumbnailData) {
    self.browser_thumbnail = Some(thumbnail);
    self.last_updated = chrono::Utc::now();
  }

  /// Добавить превью для таймлайна
  #[allow(dead_code)]
  pub fn add_timeline_preview(&mut self, preview: TimelinePreview) {
    self.timeline_previews.push(preview);
    self
      .timeline_previews
      .sort_by(|a, b| a.timestamp.partial_cmp(&b.timestamp).unwrap());
    self.last_updated = chrono::Utc::now();
  }

  /// Добавить кадр для распознавания
  #[allow(dead_code)]
  pub fn add_recognition_frame(&mut self, frame: RecognitionFrame) {
    self.recognition_frames.push(frame);
    self
      .recognition_frames
      .sort_by(|a, b| a.timestamp.partial_cmp(&b.timestamp).unwrap());
    self.last_updated = chrono::Utc::now();
  }

  /// Установить результаты распознавания
  #[allow(dead_code)]
  pub fn set_recognition_results(&mut self, results: RecognitionResults) {
    self.recognition_results = Some(results);
    self.last_updated = chrono::Utc::now();
  }

  /// Получить все временные метки где есть превью
  #[allow(dead_code)]
  pub fn get_all_preview_timestamps(&self) -> Vec<f64> {
    let mut timestamps = Vec::new();

    if let Some(ref thumb) = self.browser_thumbnail {
      timestamps.push(thumb.timestamp);
    }

    for preview in &self.timeline_previews {
      timestamps.push(preview.timestamp);
    }

    for frame in &self.recognition_frames {
      timestamps.push(frame.timestamp);
    }

    timestamps.sort_by(|a, b| a.partial_cmp(b).unwrap());
    timestamps.dedup();
    timestamps
  }
}
