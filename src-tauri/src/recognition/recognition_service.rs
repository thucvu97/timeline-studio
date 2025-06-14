use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::RwLock;

use super::yolo_processor::{Detection, YoloModel, YoloProcessor};
// Временно закомментируем пока не интегрируем полностью
// use crate::media::preview_data::{RecognitionResults, DetectedObject, DetectedFace, DetectedScene, BoundingBox};
// use crate::media::preview_manager::PreviewDataManager;

// Временные структуры для компиляции
use crate::media::preview_data::{
  BoundingBox, DetectedFace, DetectedObject, DetectedScene, RecognitionResults,
};

/// Сервис для распознавания объектов и лиц
pub struct RecognitionService {
  /// YOLO процессор для объектов
  object_detector: Arc<RwLock<YoloProcessor>>,

  /// YOLO процессор для лиц
  face_detector: Arc<RwLock<YoloProcessor>>,

  // /// Менеджер данных превью
  // preview_manager: Arc<PreviewDataManager>,
  /// Директория для результатов
  results_dir: PathBuf,
}

impl RecognitionService {
  pub fn new(base_dir: PathBuf) -> Result<Self> {
    let results_dir = base_dir.join("Recognition");
    std::fs::create_dir_all(&results_dir)?;

    // Создаем процессоры
    let object_detector = YoloProcessor::new(YoloModel::YoloV11Detection, 0.5)?;
    let face_detector = YoloProcessor::new(YoloModel::YoloV11Face, 0.7)?;

    Ok(Self {
      object_detector: Arc::new(RwLock::new(object_detector)),
      face_detector: Arc::new(RwLock::new(face_detector)),
      // preview_manager,
      results_dir,
    })
  }

  /// Обработать видео файл
  pub async fn process_video(
    &self,
    file_id: &str,
    frame_paths: Vec<PathBuf>,
  ) -> Result<RecognitionResults> {
    // Используем переданные пути к кадрам

    // Обрабатываем каждый кадр
    let mut all_objects: Vec<(f64, Detection)> = Vec::new();
    let mut all_faces: Vec<(f64, Detection)> = Vec::new();

    for (idx, frame_path) in frame_paths.iter().enumerate() {
      // Вычисляем примерную временную метку
      let timestamp = idx as f64 * 1.0; // Простая метка времени

      // Обнаружение объектов
      let mut object_detector = self.object_detector.write().await;
      let objects = object_detector.process_image(frame_path).await?;
      all_objects.extend(objects.into_iter().map(|d| (timestamp, d)));

      // Обнаружение лиц
      let mut face_detector = self.face_detector.write().await;
      let faces = face_detector.process_image(frame_path).await?;
      all_faces.extend(faces.into_iter().map(|d| (timestamp, d)));
    }

    // Группируем результаты
    let grouped_objects = self.group_objects(all_objects);
    let grouped_faces = self.group_faces(all_faces);
    let scenes = self.detect_scenes(&grouped_objects);

    let results = RecognitionResults {
      objects: grouped_objects,
      faces: grouped_faces,
      scenes,
      processed_at: chrono::Utc::now(),
    };

    // Сохраняем результаты
    self.save_results(file_id, &results).await?;

    // Временно закомментировано - обновление данных превью
    // let mut preview_data = self.preview_manager.get_preview_data(file_id).await.unwrap();
    // preview_data.set_recognition_results(results.clone());

    Ok(results)
  }

  /// Группировать обнаруженные объекты по классам
  fn group_objects(&self, detections: Vec<(f64, Detection)>) -> Vec<DetectedObject> {
    use std::collections::HashMap;

    let mut grouped: HashMap<String, Vec<(f64, Detection)>> = HashMap::new();

    for (timestamp, detection) in detections {
      grouped
        .entry(detection.class.clone())
        .or_default()
        .push((timestamp, detection));
    }

    grouped
      .into_iter()
      .map(|(class, detections)| {
        let mut timestamps = Vec::new();
        let mut bounding_boxes = Vec::new();
        let mut total_confidence = 0.0;

        for (timestamp, detection) in detections {
          timestamps.push(timestamp);
          bounding_boxes.push(BoundingBox {
            x: detection.bbox.x,
            y: detection.bbox.y,
            width: detection.bbox.width,
            height: detection.bbox.height,
          });
          total_confidence += detection.confidence;
        }

        DetectedObject {
          class,
          confidence: total_confidence / timestamps.len() as f32,
          timestamps,
          bounding_boxes,
        }
      })
      .collect()
  }

  /// Группировать обнаруженные лица
  fn group_faces(&self, detections: Vec<(f64, Detection)>) -> Vec<DetectedFace> {
    // В реальной реализации здесь бы была кластеризация лиц
    // Сейчас просто преобразуем детекции в лица

    detections
      .into_iter()
      .enumerate()
      .map(|(idx, (timestamp, detection))| DetectedFace {
        face_id: Some(format!("face_{}", idx)),
        person_name: None,
        confidence: detection.confidence,
        timestamps: vec![timestamp],
        bounding_boxes: vec![BoundingBox {
          x: detection.bbox.x,
          y: detection.bbox.y,
          width: detection.bbox.width,
          height: detection.bbox.height,
        }],
      })
      .collect()
  }

  /// Определить сцены на основе объектов
  fn detect_scenes(&self, objects: &[DetectedObject]) -> Vec<DetectedScene> {
    // Простая эвристика для определения сцен
    let mut scenes = Vec::new();

    // Сцена с людьми
    if objects.iter().any(|o| o.class == "person") {
      let person_timestamps: Vec<f64> = objects
        .iter()
        .filter(|o| o.class == "person")
        .flat_map(|o| o.timestamps.clone())
        .collect();

      if !person_timestamps.is_empty() {
        let start = person_timestamps
          .iter()
          .min_by(|a, b| a.partial_cmp(b).unwrap())
          .copied()
          .unwrap_or(0.0);
        let end = person_timestamps
          .iter()
          .max_by(|a, b| a.partial_cmp(b).unwrap())
          .copied()
          .unwrap_or(0.0);

        scenes.push(DetectedScene {
          scene_type: "people".to_string(),
          start_time: start,
          end_time: end,
          key_objects: vec!["person".to_string()],
        });
      }
    }

    // Сцена с транспортом
    let vehicle_classes = ["car", "truck", "bus", "motorcycle", "bicycle"];
    let vehicles: Vec<&DetectedObject> = objects
      .iter()
      .filter(|o| vehicle_classes.contains(&o.class.as_str()))
      .collect();

    if !vehicles.is_empty() {
      let vehicle_timestamps: Vec<f64> =
        vehicles.iter().flat_map(|o| o.timestamps.clone()).collect();

      let start = vehicle_timestamps
        .iter()
        .min_by(|a, b| a.partial_cmp(b).unwrap())
        .copied()
        .unwrap_or(0.0);
      let end = vehicle_timestamps
        .iter()
        .max_by(|a, b| a.partial_cmp(b).unwrap())
        .copied()
        .unwrap_or(0.0);

      let key_objects: Vec<String> = vehicles
        .iter()
        .map(|o| o.class.clone())
        .collect::<std::collections::HashSet<_>>()
        .into_iter()
        .collect();

      scenes.push(DetectedScene {
        scene_type: "traffic".to_string(),
        start_time: start,
        end_time: end,
        key_objects,
      });
    }

    scenes
  }

  /// Сохранить результаты в файл
  async fn save_results(&self, file_id: &str, results: &RecognitionResults) -> Result<()> {
    let results_file = self
      .results_dir
      .join(format!("{}_recognition.json", file_id));
    let json = serde_json::to_string_pretty(results)?;
    tokio::fs::write(results_file, json).await?;
    Ok(())
  }

  /// Загрузить результаты из файла
  pub async fn load_results(&self, file_id: &str) -> Result<Option<RecognitionResults>> {
    let results_file = self
      .results_dir
      .join(format!("{}_recognition.json", file_id));

    if results_file.exists() {
      let json = tokio::fs::read_to_string(results_file).await?;
      let results: RecognitionResults = serde_json::from_str(&json)?;
      Ok(Some(results))
    } else {
      Ok(None)
    }
  }

  /// Обработать пакет видео
  pub async fn process_batch(
    &self,
    file_ids: Vec<String>,
    frame_paths_map: std::collections::HashMap<String, Vec<PathBuf>>,
  ) -> Result<Vec<(String, RecognitionResults)>> {
    let mut results = Vec::new();

    for file_id in file_ids {
      if let Some(frame_paths) = frame_paths_map.get(&file_id) {
        match self.process_video(&file_id, frame_paths.clone()).await {
          Ok(recognition_results) => {
            results.push((file_id, recognition_results));
          }
          Err(e) => {
            eprintln!("Failed to process file {}: {}", file_id, e);
          }
        }
      }
    }

    Ok(results)
  }

  /// Получить доступ к детектору объектов
  pub fn get_object_detector(&self) -> Arc<RwLock<YoloProcessor>> {
    self.object_detector.clone()
  }

  /// Получить доступ к детектору лиц
  pub fn get_face_detector(&self) -> Arc<RwLock<YoloProcessor>> {
    self.face_detector.clone()
  }

  /// Загрузить модель для детектора объектов
  pub async fn load_object_model(&self) -> Result<()> {
    let mut detector = self.object_detector.write().await;
    detector.load_model().await
  }

  /// Загрузить модель для детектора лиц
  pub async fn load_face_model(&self) -> Result<()> {
    let mut detector = self.face_detector.write().await;
    detector.load_model().await
  }

  /// Установить целевые классы для детектора объектов
  pub async fn set_object_classes(&self, classes: Vec<String>) {
    let mut detector = self.object_detector.write().await;
    detector.set_target_classes(classes);
  }

  /// Получить классы объектов
  pub async fn get_object_classes(&self) -> Vec<String> {
    let detector = self.object_detector.read().await;
    detector.get_class_names()
  }

  /// Пакетная обработка изображений детектором объектов
  pub async fn process_objects_batch(&self, image_paths: Vec<PathBuf>) -> Result<Vec<Vec<Detection>>> {
    let mut detector = self.object_detector.write().await;
    detector.process_batch(image_paths).await
  }
}

/// События распознавания для отправки на фронтенд
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
#[allow(clippy::enum_variant_names)]
pub enum RecognitionEvent {
  /// Начало обработки
  ProcessingStarted { file_id: String },

  /// Прогресс обработки
  ProcessingProgress {
    file_id: String,
    current: usize,
    total: usize,
  },

  /// Обработка завершена
  ProcessingCompleted {
    file_id: String,
    results: RecognitionResults,
  },

  /// Ошибка обработки
  ProcessingError { file_id: String, error: String },
}
