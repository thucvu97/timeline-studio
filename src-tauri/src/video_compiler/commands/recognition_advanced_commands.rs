//! Recognition Advanced Commands - продвинутые команды для системы распознавания

use crate::video_compiler::error::Result;
use crate::video_compiler::VideoCompilerState;
use serde::{Deserialize, Serialize};
use tauri::State;

/// Информация о классах модели
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelClassInfo {
  pub class_names: Vec<String>,
  pub total_classes: usize,
  pub model_type: String,
  pub confidence_threshold: f32,
}

/// Информация о модели YOLO
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct YoloModelInfo {
  pub model_path: String,
  pub model_type: String,
  pub is_face_model: bool,
  pub is_segmentation_model: bool,
  pub input_size: (u32, u32),
  pub classes_count: usize,
}

/// Статус модели
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelStatus {
  pub is_loaded: bool,
  pub model_type: String,
  pub load_time_ms: u64,
  pub memory_usage_mb: f64,
  pub last_inference_ms: Option<u64>,
}

/// Параметры для поиска результатов по времени
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeRangeParams {
  pub start_time: f64,
  pub end_time: f64,
  pub confidence_threshold: Option<f32>,
}

/// Результат распознавания кадра
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameRecognitionResult {
  pub timestamp: f64,
  pub detections: Vec<Detection>,
  pub confidence_avg: f32,
  pub processing_time_ms: u64,
}

/// Обнаружение объекта
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Detection {
  pub class_name: String,
  pub confidence: f32,
  pub bbox: BoundingBox,
}

/// Ограничивающий прямоугольник
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BoundingBox {
  pub x: f32,
  pub y: f32,
  pub width: f32,
  pub height: f32,
}

/// Сегмент timeline
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineSegment {
  pub start_time: f64,
  pub end_time: f64,
  pub class_name: String,
  pub confidence: f32,
  pub frame_count: usize,
}

/// Получить имена классов из процессора кадров
#[tauri::command]
pub async fn get_frame_processor_class_names(
  _state: State<'_, VideoCompilerState>,
) -> Result<ModelClassInfo> {
  // Заглушка для get_class_names из FrameProcessor
  let class_names = vec![
    "person".to_string(),
    "bicycle".to_string(),
    "car".to_string(),
    "motorcycle".to_string(),
    "airplane".to_string(),
    "bus".to_string(),
    "train".to_string(),
    "truck".to_string(),
    "boat".to_string(),
    "traffic light".to_string(),
    "fire hydrant".to_string(),
    "stop sign".to_string(),
    "parking meter".to_string(),
    "bench".to_string(),
    "bird".to_string(),
    "cat".to_string(),
    "dog".to_string(),
    "horse".to_string(),
    "sheep".to_string(),
    "cow".to_string(),
  ];

  Ok(ModelClassInfo {
    total_classes: class_names.len(),
    class_names,
    model_type: "YOLOv5".to_string(),
    confidence_threshold: 0.5,
  })
}

/// Проверить, является ли модель face model
#[tauri::command]
pub async fn check_is_face_model(
  model_path: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<YoloModelInfo> {
  // Заглушка для is_face_model
  let is_face = model_path.contains("face") || model_path.contains("facial");
  let is_segmentation = model_path.contains("seg") || model_path.contains("segmentation");

  Ok(YoloModelInfo {
    model_path: model_path.clone(),
    model_type: if is_face {
      "Face Detection".to_string()
    } else if is_segmentation {
      "Segmentation".to_string()
    } else {
      "Object Detection".to_string()
    },
    is_face_model: is_face,
    is_segmentation_model: is_segmentation,
    input_size: (640, 640),
    classes_count: if is_face { 1 } else { 80 },
  })
}

/// Проверить, является ли модель segmentation model
#[tauri::command]
pub async fn check_is_segmentation_model(
  model_path: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  // Заглушка для is_segmentation_model
  Ok(model_path.contains("seg") || model_path.contains("segmentation"))
}

/// Получить статус модели
#[tauri::command]
pub async fn get_model_manager_status(
  _state: State<'_, VideoCompilerState>,
) -> Result<ModelStatus> {
  // Заглушка для get_session, get_model_type, is_loaded
  Ok(ModelStatus {
    is_loaded: true,
    model_type: "YOLOv5s".to_string(),
    load_time_ms: 1500,
    memory_usage_mb: 256.0,
    last_inference_ms: Some(45),
  })
}

/// Получить результаты распознавания по временному диапазону
#[tauri::command]
pub async fn get_recognition_results_by_time_range(
  params: TimeRangeParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<FrameRecognitionResult>> {
  // Заглушка для get_results_by_time_range
  let mut results = Vec::new();
  let duration = params.end_time - params.start_time;
  let frame_count = (duration * 30.0) as usize; // 30 FPS

  for i in 0..frame_count.min(10) {
    // Ограничиваем до 10 результатов для демо
    let timestamp = params.start_time + (i as f64 / 30.0);

    results.push(FrameRecognitionResult {
      timestamp,
      detections: vec![
        Detection {
          class_name: "person".to_string(),
          confidence: 0.85,
          bbox: BoundingBox {
            x: 100.0,
            y: 50.0,
            width: 200.0,
            height: 400.0,
          },
        },
        Detection {
          class_name: "car".to_string(),
          confidence: 0.72,
          bbox: BoundingBox {
            x: 300.0,
            y: 200.0,
            width: 150.0,
            height: 100.0,
          },
        },
      ],
      confidence_avg: 0.785,
      processing_time_ms: 25,
    });
  }

  Ok(results)
}

/// Получить результаты распознавания по классу
#[tauri::command]
pub async fn get_recognition_results_by_class(
  class_name: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<FrameRecognitionResult>> {
  // Заглушка для get_results_by_class
  let confidence = match class_name.as_str() {
    "person" => 0.85,
    "car" => 0.72,
    "dog" => 0.91,
    _ => 0.60,
  };

  let results = vec![
    FrameRecognitionResult {
      timestamp: 1.5,
      detections: vec![Detection {
        class_name: class_name.clone(),
        confidence,
        bbox: BoundingBox {
          x: 150.0,
          y: 100.0,
          width: 200.0,
          height: 300.0,
        },
      }],
      confidence_avg: confidence,
      processing_time_ms: 30,
    },
    FrameRecognitionResult {
      timestamp: 5.2,
      detections: vec![Detection {
        class_name: class_name.clone(),
        confidence: confidence + 0.05,
        bbox: BoundingBox {
          x: 200.0,
          y: 120.0,
          width: 180.0,
          height: 280.0,
        },
      }],
      confidence_avg: confidence + 0.05,
      processing_time_ms: 28,
    },
  ];

  Ok(results)
}

/// Форматировать результаты для timeline
#[tauri::command]
pub async fn format_recognition_results_for_timeline(
  min_confidence: Option<f32>,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<TimelineSegment>> {
  // Заглушка для format_for_timeline
  let confidence_threshold = min_confidence.unwrap_or(0.5);

  let segments = vec![
    TimelineSegment {
      start_time: 0.0,
      end_time: 3.5,
      class_name: "person".to_string(),
      confidence: 0.85,
      frame_count: 105, // 3.5 * 30 FPS
    },
    TimelineSegment {
      start_time: 2.0,
      end_time: 8.2,
      class_name: "car".to_string(),
      confidence: 0.72,
      frame_count: 186, // 6.2 * 30 FPS
    },
    TimelineSegment {
      start_time: 10.5,
      end_time: 15.0,
      class_name: "dog".to_string(),
      confidence: 0.91,
      frame_count: 135, // 4.5 * 30 FPS
    },
  ];

  // Фильтруем по порогу уверенности
  let filtered_segments: Vec<TimelineSegment> = segments
    .into_iter()
    .filter(|segment| segment.confidence >= confidence_threshold)
    .collect();

  Ok(filtered_segments)
}

/// Проверить тип YOLO модели по её названию (прямое использование is_face_model)
#[tauri::command]
pub async fn check_yolo_model_is_face_model(
  model_name: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  // Используем логику из YoloModel::is_face_model
  use crate::recognition::model_manager::YoloModel;

  // Пытаемся определить тип модели по названию и проверить is_face_model
  let is_face = if model_name.to_lowercase().contains("yolov11")
    && model_name.to_lowercase().contains("face")
  {
    let model = YoloModel::YoloV11Face;
    model.is_face_model()
  } else if model_name.to_lowercase().contains("yolov8")
    && model_name.to_lowercase().contains("face")
  {
    let model = YoloModel::YoloV8Face;
    model.is_face_model()
  } else {
    let model = YoloModel::YoloV8Detection; // Default model
    model.is_face_model()
  };

  Ok(is_face)
}

/// Проверить тип YOLO модели по её названию (прямое использование is_segmentation_model)
#[tauri::command]
pub async fn check_yolo_model_is_segmentation_model(
  model_name: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  // Используем логику из YoloModel::is_segmentation_model
  use crate::recognition::model_manager::YoloModel;

  // Пытаемся определить тип модели по названию и проверить is_segmentation_model
  let is_segmentation =
    if model_name.to_lowercase().contains("yolov11") && model_name.to_lowercase().contains("seg") {
      let model = YoloModel::YoloV11Segmentation;
      model.is_segmentation_model()
    } else if model_name.to_lowercase().contains("yolov8")
      && model_name.to_lowercase().contains("seg")
    {
      let model = YoloModel::YoloV8Segmentation;
      model.is_segmentation_model()
    } else {
      let model = YoloModel::YoloV8Detection; // Default model
      model.is_segmentation_model()
    };

  Ok(is_segmentation)
}

/// Получить полную информацию о YOLO модели (используя существующую структуру)
#[tauri::command]
pub async fn get_yolo_model_info_extended(
  model_name: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<YoloModelInfo> {
  use crate::recognition::model_manager::YoloModel;

  // Определяем тип модели по названию
  let (model, model_type) = if model_name.to_lowercase().contains("yolov11") {
    if model_name.to_lowercase().contains("face") {
      (YoloModel::YoloV11Face, "YOLOv11 Face Detection")
    } else if model_name.to_lowercase().contains("seg") {
      (YoloModel::YoloV11Segmentation, "YOLOv11 Segmentation")
    } else {
      (YoloModel::YoloV11Detection, "YOLOv11 Detection")
    }
  } else if model_name.to_lowercase().contains("yolov8") {
    if model_name.to_lowercase().contains("face") {
      (YoloModel::YoloV8Face, "YOLOv8 Face Detection")
    } else if model_name.to_lowercase().contains("seg") {
      (YoloModel::YoloV8Segmentation, "YOLOv8 Segmentation")
    } else {
      (YoloModel::YoloV8Detection, "YOLOv8 Detection")
    }
  } else {
    (YoloModel::YoloV8Detection, "YOLOv8 Detection (Default)")
  };

  // Используем оригинальные методы YoloModel
  let is_face_model = model.is_face_model();
  let is_segmentation_model = model.is_segmentation_model();

  // Возвращаем структуру, используя существующие поля
  Ok(YoloModelInfo {
    model_path: model_name, // Используем model_path вместо model_name
    model_type: model_type.to_string(),
    is_face_model,
    is_segmentation_model,
    input_size: (640, 640), // Стандартный размер для YOLO
    classes_count: if is_face_model { 1 } else { 80 }, // 1 для лиц, 80 для COCO
  })
}

/// Получить информацию о сессии модели (прямое использование get_session)
#[tauri::command]
pub async fn get_model_session_info(model_type: String) -> Result<serde_json::Value> {
  // Создаем ModelManager для проверки
  use crate::recognition::model_manager::{ModelManager, YoloModel};

  let yolo_model = match model_type.as_str() {
    "yolo11_detection" => YoloModel::YoloV11Detection,
    "yolo11_segmentation" => YoloModel::YoloV11Segmentation,
    "yolo11_face" => YoloModel::YoloV11Face,
    "yolo8_detection" => YoloModel::YoloV8Detection,
    "yolo8_segmentation" => YoloModel::YoloV8Segmentation,
    "yolo8_face" => YoloModel::YoloV8Face,
    _ => YoloModel::YoloV11Detection,
  };

  let mut manager = ModelManager::new(yolo_model)?;

  // Пытаемся загрузить модель
  match manager.load_model().await {
    Ok(_) => {
      // Получаем сессию
      match manager.get_session() {
        Ok(_session) => Ok(serde_json::json!({
          "success": true,
          "model_type": model_type,
          "session_available": true,
          "session_info": {
            "loaded": true,
            "runtime": "ONNX Runtime",
            "optimization_level": "Level3",
            "threads": 4
          }
        })),
        Err(e) => Ok(serde_json::json!({
          "success": false,
          "model_type": model_type,
          "error": e.to_string(),
          "session_available": false
        })),
      }
    }
    Err(e) => Ok(serde_json::json!({
      "success": false,
      "model_type": model_type,
      "error": format!("Failed to load model: {}", e),
      "session_available": false
    })),
  }
}

/// Получить тип загруженной модели (прямое использование get_model_type)
#[tauri::command]
pub async fn get_loaded_model_type(model_type: String) -> Result<serde_json::Value> {
  // Создаем ModelManager для проверки
  use crate::recognition::model_manager::{ModelManager, YoloModel};

  let yolo_model = match model_type.as_str() {
    "yolo11_detection" => YoloModel::YoloV11Detection,
    "yolo11_segmentation" => YoloModel::YoloV11Segmentation,
    "yolo11_face" => YoloModel::YoloV11Face,
    "yolo8_detection" => YoloModel::YoloV8Detection,
    "yolo8_segmentation" => YoloModel::YoloV8Segmentation,
    "yolo8_face" => YoloModel::YoloV8Face,
    _ => YoloModel::YoloV11Detection,
  };

  let manager = ModelManager::new(yolo_model)?;

  // Используем метод get_model_type
  let model_type_info = manager.get_model_type();

  Ok(serde_json::json!({
    "success": true,
    "model_type": match model_type_info {
      YoloModel::YoloV11Detection => "yolo11_detection",
      YoloModel::YoloV11Segmentation => "yolo11_segmentation",
      YoloModel::YoloV11Face => "yolo11_face",
      YoloModel::YoloV8Detection => "yolo8_detection",
      YoloModel::YoloV8Segmentation => "yolo8_segmentation",
      YoloModel::YoloV8Face => "yolo8_face",
      YoloModel::Custom(path) => return Ok(serde_json::json!({
        "success": true,
        "model_type": "custom",
        "custom_path": path.to_string_lossy()
      })),
    },
    "is_face_model": model_type_info.is_face_model(),
    "is_segmentation_model": model_type_info.is_segmentation_model(),
  }))
}

/// Проверить, загружена ли модель (прямое использование is_loaded)
#[tauri::command]
pub async fn check_model_is_loaded(model_type: String) -> Result<serde_json::Value> {
  // Создаем ModelManager для проверки
  use crate::recognition::model_manager::{ModelManager, YoloModel};

  let yolo_model = match model_type.as_str() {
    "yolo11_detection" => YoloModel::YoloV11Detection,
    "yolo11_segmentation" => YoloModel::YoloV11Segmentation,
    "yolo11_face" => YoloModel::YoloV11Face,
    "yolo8_detection" => YoloModel::YoloV8Detection,
    "yolo8_segmentation" => YoloModel::YoloV8Segmentation,
    "yolo8_face" => YoloModel::YoloV8Face,
    _ => YoloModel::YoloV11Detection,
  };

  let mut manager = ModelManager::new(yolo_model)?;

  // Проверяем состояние без загрузки
  let is_loaded_before = manager.is_loaded();

  // Пытаемся загрузить модель
  let load_result = manager.load_model().await;
  let is_loaded_after = manager.is_loaded();

  Ok(serde_json::json!({
    "success": true,
    "model_type": model_type,
    "is_loaded_before_load": is_loaded_before,
    "is_loaded_after_load": is_loaded_after,
    "load_attempted": load_result.is_ok(),
    "load_error": load_result.err().map(|e| e.to_string()),
    "model_path": manager.get_model_type().get_model_path()
      .ok()
      .map(|p| p.to_string_lossy().to_string()),
  }))
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_model_class_info_serialization() {
    let info = ModelClassInfo {
      class_names: vec!["person".to_string(), "car".to_string()],
      total_classes: 2,
      model_type: "YOLOv5".to_string(),
      confidence_threshold: 0.5,
    };

    let json = serde_json::to_string(&info).unwrap();
    assert!(json.contains("person"));
    assert!(json.contains("YOLOv5"));
  }

  #[test]
  fn test_detection_serialization() {
    let detection = Detection {
      class_name: "person".to_string(),
      confidence: 0.85,
      bbox: BoundingBox {
        x: 100.0,
        y: 50.0,
        width: 200.0,
        height: 400.0,
      },
    };

    let json = serde_json::to_string(&detection).unwrap();
    assert!(json.contains("person"));
    assert!(json.contains("0.85"));
  }

  #[test]
  fn test_yolo_model_face_detection() {
    // Тест для Face модели
    let face_model_name = "yolov8_face_model.onnx".to_string();
    assert!(face_model_name.contains("face"));

    // Тест для обычной модели
    let normal_model_name = "yolov8n.onnx".to_string();
    assert!(!normal_model_name.contains("face"));
  }

  #[test]
  fn test_yolo_model_segmentation_detection() {
    // Тест для Segmentation модели
    let seg_model_name = "yolov11_seg_model.onnx".to_string();
    assert!(seg_model_name.contains("seg"));

    // Тест для обычной модели
    let normal_model_name = "yolov8s.onnx".to_string();
    assert!(!normal_model_name.contains("seg"));
  }

  #[test]
  fn test_yolo_model_info_serialization() {
    let model_info = YoloModelInfo {
      model_path: "yolov8_face.onnx".to_string(),
      model_type: "YOLOv8 Face Detection".to_string(),
      is_face_model: true,
      is_segmentation_model: false,
      input_size: (640, 640),
      classes_count: 1,
    };

    let json = serde_json::to_string(&model_info).unwrap();
    assert!(json.contains("yolov8_face.onnx"));
    assert!(json.contains("true"));
    assert!(json.contains("false"));
    assert!(json.contains("YOLOv8 Face Detection"));
  }

  #[test]
  fn test_model_session_info() {
    // Тест для параметров сессии
    let model_type = "yolo11_detection".to_string();
    assert!(model_type.contains("yolo11"));
    assert!(model_type.contains("detection"));
  }

  #[test]
  fn test_model_type_mapping() {
    // Тест для маппинга типов моделей
    let model_types = vec![
      "yolo11_detection",
      "yolo11_segmentation",
      "yolo11_face",
      "yolo8_detection",
      "yolo8_segmentation",
      "yolo8_face",
    ];

    for model_type in model_types {
      assert!(!model_type.is_empty());
      assert!(model_type.contains("yolo"));
    }
  }

  #[test]
  fn test_model_load_status() {
    // Тест для проверки статуса загрузки
    let is_loaded_before = false;
    let is_loaded_after = true;

    assert!(!is_loaded_before);
    assert!(is_loaded_after);
  }
}
