//! Простые YOLO команды для интеграции с существующей системой

use crate::recognition::yolo_processor::{Detection, YoloModel, YoloProcessor};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::State;

/// Запрос на анализ видео
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YoloAnalysisRequest {
  pub video_path: String,
  pub confidence_threshold: f32,
  pub skip_frames: usize,
}

/// Результат детекции YOLO
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YoloDetectionResult {
  pub frame_number: usize,
  pub timestamp: f64,
  pub detections: Vec<Detection>,
}

/// Инициализировать YOLO процессор
#[tauri::command]
pub async fn init_yolo_processor(
  model_type: String,
  confidence_threshold: f32,
  yolo_state: State<'_, Mutex<Option<YoloProcessor>>>,
) -> Result<String, String> {
  log::info!("Инициализация YOLO процессора с моделью: {}", model_type);

  // Определяем тип модели
  let yolo_model = match model_type.as_str() {
    "yolo11-face" => YoloModel::YoloV11Face,
    "yolo8-face" => YoloModel::YoloV8Face,
    "yolo11-detection" => YoloModel::YoloV11Detection,
    "yolo8-detection" => YoloModel::YoloV8Detection,
    _ => YoloModel::YoloV11Face, // По умолчанию используем модель для лиц
  };

  // Создаем процессор
  let mut processor = YoloProcessor::new(yolo_model, confidence_threshold)
    .map_err(|e| format!("Ошибка создания процессора: {}", e))?;

  // Загружаем модель асинхронно
  processor
    .load_model()
    .await
    .map_err(|e| format!("Ошибка загрузки модели: {}", e))?;

  // Сохраняем в состоянии после загрузки модели
  {
    let mut state = yolo_state.lock().map_err(|e| e.to_string())?;
    *state = Some(processor);
  }

  Ok(format!(
    "YOLO процессор инициализирован с моделью {}",
    model_type
  ))
}

/// Детектировать объекты на изображении
#[tauri::command]
pub async fn detect_objects_in_image(
  image_path: String,
  yolo_state: State<'_, Mutex<Option<YoloProcessor>>>,
) -> Result<Vec<Detection>, String> {
  // Проверяем, инициализирован ли процессор
  {
    let state = yolo_state.lock().map_err(|e| e.to_string())?;
    if state.is_none() {
      return Err("YOLO процессор не инициализирован".to_string());
    }
  }

  // Временная заглушка - в реальности здесь должна быть обработка изображения
  // без удержания MutexGuard через await
  let path = PathBuf::from(&image_path);
  log::info!("Обработка изображения: {:?}", path);

  // Возвращаем пустой результат для тестирования
  Ok(vec![])
}

/// Анализировать видео с YOLO
#[tauri::command]
pub async fn analyze_video_with_yolo(
  request: YoloAnalysisRequest,
  yolo_state: State<'_, Mutex<Option<YoloProcessor>>>,
) -> Result<Vec<YoloDetectionResult>, String> {
  let state = yolo_state.lock().map_err(|e| e.to_string())?;

  if let Some(_processor) = state.as_ref() {
    // Здесь должна быть реальная обработка видео
    // Пока возвращаем заглушку
    log::info!("Анализ видео: {}", request.video_path);

    Ok(vec![YoloDetectionResult {
      frame_number: 0,
      timestamp: 0.0,
      detections: vec![],
    }])
  } else {
    Err("YOLO процессор не инициализирован".to_string())
  }
}

/// Получить названия классов YOLO (новая версия)
#[tauri::command]
pub async fn get_yolo_class_names_advanced(
  yolo_state: State<'_, Mutex<Option<YoloProcessor>>>,
) -> Result<Vec<String>, String> {
  let state = yolo_state.lock().map_err(|e| e.to_string())?;

  if let Some(processor) = state.as_ref() {
    Ok(processor.get_class_names())
  } else {
    // Возвращаем дефолтные классы для лиц
    Ok(vec!["face".to_string()])
  }
}

/// Обновить порог уверенности
#[tauri::command]
pub async fn update_yolo_confidence_threshold(
  threshold: f32,
  yolo_state: State<'_, Mutex<Option<YoloProcessor>>>,
) -> Result<(), String> {
  let mut state = yolo_state.lock().map_err(|e| e.to_string())?;

  if let Some(processor) = state.as_mut() {
    processor.set_confidence_threshold(threshold);
    Ok(())
  } else {
    Err("YOLO процессор не инициализирован".to_string())
  }
}

/// Сохранить данные YOLO
#[tauri::command]
pub async fn save_yolo_data(video_id: String, _data: serde_json::Value) -> Result<(), String> {
  log::info!("Сохранение данных YOLO для видео: {}", video_id);
  // TODO: Реальное сохранение в БД или файл
  Ok(())
}

/// Загрузить данные YOLO
#[tauri::command]
pub async fn load_yolo_data(video_id: String) -> Result<Option<serde_json::Value>, String> {
  log::info!("Загрузка данных YOLO для видео: {}", video_id);
  // TODO: Реальная загрузка из БД или файла
  Ok(None)
}

/// Проверить доступность GPU
#[tauri::command]
pub async fn check_gpu_availability() -> Result<bool, String> {
  // TODO: Реальная проверка GPU через ONNX Runtime
  Ok(false)
}
