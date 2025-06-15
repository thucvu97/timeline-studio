use serde::{Deserialize, Serialize};

/// Результаты распознавания
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
