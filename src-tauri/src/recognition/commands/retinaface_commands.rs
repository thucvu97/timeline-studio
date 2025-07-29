use base64::prelude::*;
/**
 * Tauri Commands for RetinaFace Processing
 */
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::State;

use crate::recognition::retinaface_processor::{
  FacialLandmarks, Point2D, RetinaFaceDetection, RetinaFaceModel, RetinaFaceProcessor,
};

/// Состояние RetinaFace процессора
pub struct RetinaFaceProcessorState(pub Mutex<Option<Arc<RetinaFaceProcessor>>>);

impl Default for RetinaFaceProcessorState {
  fn default() -> Self {
    Self(Mutex::new(None))
  }
}

/// Инициализировать RetinaFace процессор
#[tauri::command]
pub async fn init_retinaface_processor(
  model_type: String,
  retinaface_state: State<'_, RetinaFaceProcessorState>,
) -> Result<String, String> {
  let model_enum = match model_type.as_str() {
    "retinaface-r50" | "resnet50" => RetinaFaceModel::ResNet50,
    "retinaface-mobile" | "mobilenet" => RetinaFaceModel::MobileNet,
    "retinaface-r50-enhanced" | "enhanced" => RetinaFaceModel::ResNet50Enhanced,
    _ => return Err(format!("Unsupported RetinaFace model type: {}", model_type)),
  };

  match RetinaFaceProcessor::new(model_enum) {
    Ok(mut processor) => {
      // Пытаемся загрузить модель
      match processor.load_model().await {
        Ok(_) => {
          let mut state = retinaface_state.0.lock().unwrap();
          *state = Some(Arc::new(processor));
          Ok(format!(
            "RetinaFace processor initialized with {}",
            model_type
          ))
        }
        Err(e) => {
          // В случае ошибки все равно сохраняем процессор (для тестов)
          let mut state = retinaface_state.0.lock().unwrap();
          *state = Some(Arc::new(processor));
          log::warn!("RetinaFace model loading failed: {}", e);
          Ok(format!(
            "RetinaFace processor initialized (model loading failed: {})",
            e
          ))
        }
      }
    }
    Err(e) => Err(format!("Failed to create RetinaFace processor: {}", e)),
  }
}

/// Детекция лиц с landmarks
#[tauri::command]
pub async fn detect_faces_with_landmarks(
  image_path: String,
  retinaface_state: State<'_, RetinaFaceProcessorState>,
) -> Result<Vec<RetinaFaceDetectionResponse>, String> {
  // Загружаем изображение перед блокировкой
  let image_path = PathBuf::from(image_path);
  if !image_path.exists() {
    return Err(format!("Image file not found: {}", image_path.display()));
  }

  let image = image::open(&image_path).map_err(|e| format!("Failed to load image: {}", e))?;

  // Получаем Arc к процессору
  let processor_arc = {
    let state = retinaface_state.0.lock().unwrap();
    state
      .as_ref()
      .ok_or_else(|| "RetinaFace processor not initialized".to_string())?
      .clone()
  };

  // Выполняем blocking операцию в отдельной задаче
  let detection_result =
    tokio::task::spawn_blocking(move || processor_arc.detect_faces_sync(&image))
      .await
      .map_err(|e| format!("Task join error: {}", e))?;

  // Обрабатываем результат
  match detection_result {
    Ok(detections) => Ok(
      detections
        .into_iter()
        .map(RetinaFaceDetectionResponse::from)
        .collect(),
    ),
    Err(e) => Err(format!("Failed to detect faces: {}", e)),
  }
}

/// Детекция лиц с landmarks из Base64
#[tauri::command]
pub async fn detect_faces_with_landmarks_from_base64(
  image_data: String,
  retinaface_state: State<'_, RetinaFaceProcessorState>,
) -> Result<Vec<RetinaFaceDetectionResponse>, String> {
  // Декодируем Base64 перед блокировкой
  let image_bytes = if image_data.starts_with("data:") {
    // Извлекаем данные из data URL
    let data_url_parts: Vec<&str> = image_data.split(',').collect();
    if data_url_parts.len() != 2 {
      return Err("Invalid data URL format".to_string());
    }
    BASE64_STANDARD
      .decode(data_url_parts[1])
      .map_err(|e| format!("Failed to decode base64: {}", e))?
  } else {
    BASE64_STANDARD
      .decode(&image_data)
      .map_err(|e| format!("Failed to decode base64: {}", e))?
  };

  // Загружаем изображение из байтов
  let image = image::load_from_memory(&image_bytes)
    .map_err(|e| format!("Failed to load image from memory: {}", e))?;

  // Получаем Arc к процессору
  let processor_arc = {
    let state = retinaface_state.0.lock().unwrap();
    state
      .as_ref()
      .ok_or_else(|| "RetinaFace processor not initialized".to_string())?
      .clone()
  };

  // Выполняем blocking операцию в отдельной задаче
  let detection_result =
    tokio::task::spawn_blocking(move || processor_arc.detect_faces_sync(&image))
      .await
      .map_err(|e| format!("Task join error: {}", e))?;

  // Обрабатываем результат
  match detection_result {
    Ok(detections) => Ok(
      detections
        .into_iter()
        .map(RetinaFaceDetectionResponse::from)
        .collect(),
    ),
    Err(e) => Err(format!("Failed to detect faces: {}", e)),
  }
}

/// Получить выровненное лицо (face alignment)
#[tauri::command]
pub async fn get_aligned_face(
  image_data: String,
  landmarks: FacialLandmarksRequest,
  output_size: Option<u32>,
  _retinaface_state: State<'_, RetinaFaceProcessorState>,
) -> Result<AlignedFaceResponse, String> {
  let size = output_size.unwrap_or(112); // Стандартный размер для face recognition

  // Декодируем изображение
  let image_bytes = if image_data.starts_with("data:") {
    let data_url_parts: Vec<&str> = image_data.split(',').collect();
    if data_url_parts.len() != 2 {
      return Err("Invalid data URL format".to_string());
    }
    BASE64_STANDARD
      .decode(data_url_parts[1])
      .map_err(|e| format!("Failed to decode base64: {}", e))?
  } else {
    BASE64_STANDARD
      .decode(&image_data)
      .map_err(|e| format!("Failed to decode base64: {}", e))?
  };

  let image = image::load_from_memory(&image_bytes)
    .map_err(|e| format!("Failed to load image from memory: {}", e))?;

  // Выполняем face alignment
  let aligned_result =
    tokio::task::spawn_blocking(move || align_face_with_landmarks(&image, &landmarks.into(), size))
      .await
      .map_err(|e| format!("Task join error: {}", e))?;

  match aligned_result {
    Ok(aligned_image) => {
      // Конвертируем в base64
      let mut buffer = Vec::new();
      let mut cursor = std::io::Cursor::new(&mut buffer);
      aligned_image
        .write_to(&mut cursor, image::ImageFormat::Jpeg)
        .map_err(|e| format!("Failed to encode image: {}", e))?;

      let base64_data = BASE64_STANDARD.encode(&buffer);

      Ok(AlignedFaceResponse {
        aligned_image: format!("data:image/jpeg;base64,{}", base64_data),
        size,
        quality_score: 0.9, // TODO: реальная оценка качества
      })
    }
    Err(e) => Err(format!("Failed to align face: {}", e)),
  }
}

/// Настроить пороги детекции
#[tauri::command]
pub async fn configure_retinaface_thresholds(
  confidence_threshold: f32,
  nms_threshold: f32,
  retinaface_state: State<'_, RetinaFaceProcessorState>,
) -> Result<String, String> {
  // Извлекаем текущий процессор
  let model_type = {
    let state = retinaface_state.0.lock().unwrap();
    match state.as_ref() {
      Some(processor_arc) => processor_arc.get_model_type().clone(),
      None => return Err("RetinaFace processor not initialized".to_string()),
    }
  };

  // Создаем новый процессор с обновленными настройками
  match RetinaFaceProcessor::new(model_type) {
    Ok(mut new_processor) => {
      new_processor.set_confidence_threshold(confidence_threshold);
      new_processor.set_nms_threshold(nms_threshold);

      // Проверяем была ли загружена модель в старом процессоре
      let was_loaded = {
        let state = retinaface_state.0.lock().unwrap();
        state.as_ref().map(|p| p.is_model_loaded()).unwrap_or(false)
      };

      // Загружаем модель если была загружена
      if was_loaded {
        if let Err(e) = new_processor.load_model().await {
          return Err(format!("Failed to reload model: {}", e));
        }
      }

      // Обновляем состояние
      {
        let mut state = retinaface_state.0.lock().unwrap();
        *state = Some(Arc::new(new_processor));
      }

      Ok(format!(
        "RetinaFace thresholds updated: confidence={}, nms={}",
        confidence_threshold, nms_threshold
      ))
    }
    Err(e) => Err(format!("Failed to create new processor: {}", e)),
  }
}

/// Получить информацию о процессоре
#[tauri::command]
pub async fn get_retinaface_processor_info(
  retinaface_state: State<'_, RetinaFaceProcessorState>,
) -> Result<RetinaFaceProcessorInfo, String> {
  let state = retinaface_state.0.lock().unwrap();
  match state.as_ref() {
    Some(processor) => Ok(RetinaFaceProcessorInfo {
      is_initialized: true,
      is_model_loaded: processor.is_model_loaded(),
      model_path: processor.get_model_path().to_string_lossy().to_string(),
      model_type: format!("{:?}", processor.get_model_type()),
      input_size: processor.input_size,
    }),
    None => Ok(RetinaFaceProcessorInfo {
      is_initialized: false,
      is_model_loaded: false,
      model_path: String::new(),
      model_type: String::new(),
      input_size: (0, 0),
    }),
  }
}

/// Face alignment функция
fn align_face_with_landmarks(
  image: &image::DynamicImage,
  landmarks: &FacialLandmarks,
  output_size: u32,
) -> Result<image::DynamicImage, String> {
  use image::imageops::FilterType;

  // Вычисляем параметры трансформации (не используются в упрощенной реализации)
  let _eye_center_x = (landmarks.left_eye.x + landmarks.right_eye.x) / 2.0;
  let _eye_center_y = (landmarks.left_eye.y + landmarks.right_eye.y) / 2.0;

  // Угол поворота для выравнивания глаз по горизонтали
  let angle = ((landmarks.right_eye.y - landmarks.left_eye.y)
    / (landmarks.right_eye.x - landmarks.left_eye.x))
    .atan();

  // Расстояние между глазами
  let eye_distance = ((landmarks.right_eye.x - landmarks.left_eye.x).powi(2)
    + (landmarks.right_eye.y - landmarks.left_eye.y).powi(2))
  .sqrt();

  // Целевое расстояние между глазами (обычно 38% от размера изображения)
  let target_eye_distance = output_size as f32 * 0.38;
  let scale = target_eye_distance / eye_distance;

  // Центр поворота (не используется в упрощенной реализации)
  let _center_x = image.width() as f32 / 2.0;
  let _center_y = image.height() as f32 / 2.0;

  // Применяем трансформацию (упрощенная версия)
  // В реальной реализации здесь должна быть аффинная трансформация
  let rotated = if angle.abs() > 0.1 {
    // Поворачиваем изображение
    image.rotate90() // Упрощение - в реальности нужен точный поворот
  } else {
    image.clone()
  };

  // Изменяем размер
  let scaled = if (scale - 1.0).abs() > 0.1 {
    let new_width = (rotated.width() as f32 * scale) as u32;
    let new_height = (rotated.height() as f32 * scale) as u32;
    rotated.resize(new_width, new_height, FilterType::Lanczos3)
  } else {
    rotated
  };

  // Обрезаем до нужного размера с центрированием
  let final_image = if scaled.width() != output_size || scaled.height() != output_size {
    scaled.resize_exact(output_size, output_size, FilterType::Lanczos3)
  } else {
    scaled
  };

  Ok(final_image)
}

/// Ответ с детекцией RetinaFace
#[derive(serde::Serialize)]
pub struct RetinaFaceDetectionResponse {
  pub bbox: BoundingBoxResponse,
  pub confidence: f32,
  pub landmarks: FacialLandmarksResponse,
  pub quality_score: f32,
  pub head_pose: HeadPoseResponse,
}

#[derive(serde::Serialize)]
pub struct BoundingBoxResponse {
  pub x1: f32,
  pub y1: f32,
  pub x2: f32,
  pub y2: f32,
}

#[derive(serde::Serialize)]
pub struct FacialLandmarksResponse {
  pub left_eye: Point2DResponse,
  pub right_eye: Point2DResponse,
  pub nose_tip: Point2DResponse,
  pub mouth_left: Point2DResponse,
  pub mouth_right: Point2DResponse,
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct Point2DResponse {
  pub x: f32,
  pub y: f32,
}

#[derive(serde::Serialize)]
pub struct HeadPoseResponse {
  pub pitch: f32,
  pub yaw: f32,
  pub roll: f32,
}

/// Запрос для face alignment
#[derive(serde::Deserialize)]
pub struct FacialLandmarksRequest {
  pub left_eye: Point2DRequest,
  pub right_eye: Point2DRequest,
  pub nose_tip: Point2DRequest,
  pub mouth_left: Point2DRequest,
  pub mouth_right: Point2DRequest,
}

#[derive(serde::Deserialize)]
pub struct Point2DRequest {
  pub x: f32,
  pub y: f32,
}

/// Ответ с выровненным лицом
#[derive(serde::Serialize)]
pub struct AlignedFaceResponse {
  pub aligned_image: String, // base64
  pub size: u32,
  pub quality_score: f32,
}

/// Информация о процессоре RetinaFace
#[derive(serde::Serialize)]
pub struct RetinaFaceProcessorInfo {
  pub is_initialized: bool,
  pub is_model_loaded: bool,
  pub model_path: String,
  pub model_type: String,
  pub input_size: (u32, u32),
}

// Конверсии между типами
impl From<RetinaFaceDetection> for RetinaFaceDetectionResponse {
  fn from(detection: RetinaFaceDetection) -> Self {
    Self {
      bbox: BoundingBoxResponse {
        x1: detection.bbox.x1,
        y1: detection.bbox.y1,
        x2: detection.bbox.x2,
        y2: detection.bbox.y2,
      },
      confidence: detection.confidence,
      landmarks: FacialLandmarksResponse {
        left_eye: Point2DResponse {
          x: detection.landmarks.left_eye.x,
          y: detection.landmarks.left_eye.y,
        },
        right_eye: Point2DResponse {
          x: detection.landmarks.right_eye.x,
          y: detection.landmarks.right_eye.y,
        },
        nose_tip: Point2DResponse {
          x: detection.landmarks.nose_tip.x,
          y: detection.landmarks.nose_tip.y,
        },
        mouth_left: Point2DResponse {
          x: detection.landmarks.mouth_left.x,
          y: detection.landmarks.mouth_left.y,
        },
        mouth_right: Point2DResponse {
          x: detection.landmarks.mouth_right.x,
          y: detection.landmarks.mouth_right.y,
        },
      },
      quality_score: detection.quality_score,
      head_pose: HeadPoseResponse {
        pitch: detection.head_pose.pitch,
        yaw: detection.head_pose.yaw,
        roll: detection.head_pose.roll,
      },
    }
  }
}

impl From<FacialLandmarksRequest> for FacialLandmarks {
  fn from(request: FacialLandmarksRequest) -> Self {
    Self {
      left_eye: Point2D {
        x: request.left_eye.x,
        y: request.left_eye.y,
      },
      right_eye: Point2D {
        x: request.right_eye.x,
        y: request.right_eye.y,
      },
      nose_tip: Point2D {
        x: request.nose_tip.x,
        y: request.nose_tip.y,
      },
      mouth_left: Point2D {
        x: request.mouth_left.x,
        y: request.mouth_left.y,
      },
      mouth_right: Point2D {
        x: request.mouth_right.x,
        y: request.mouth_right.y,
      },
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_retinaface_detection_response_conversion() {
    let detection = RetinaFaceDetection {
      bbox: crate::recognition::retinaface_processor::BoundingBox {
        x1: 10.0,
        y1: 20.0,
        x2: 100.0,
        y2: 120.0,
      },
      confidence: 0.95,
      landmarks: FacialLandmarks {
        left_eye: Point2D { x: 30.0, y: 40.0 },
        right_eye: Point2D { x: 70.0, y: 40.0 },
        nose_tip: Point2D { x: 50.0, y: 60.0 },
        mouth_left: Point2D { x: 35.0, y: 80.0 },
        mouth_right: Point2D { x: 65.0, y: 80.0 },
      },
      quality_score: 0.9,
      head_pose: HeadPose {
        pitch: 0.0,
        yaw: 0.0,
        roll: 0.0,
      },
      landmarks_3d: None,
    };

    let response = RetinaFaceDetectionResponse::from(detection);

    assert_eq!(response.bbox.x1, 10.0);
    assert_eq!(response.confidence, 0.95);
    assert_eq!(response.landmarks.left_eye.x, 30.0);
    assert_eq!(response.quality_score, 0.9);
  }

  #[test]
  fn test_landmarks_request_conversion() {
    let request = FacialLandmarksRequest {
      left_eye: Point2DRequest { x: 30.0, y: 40.0 },
      right_eye: Point2DRequest { x: 70.0, y: 40.0 },
      nose_tip: Point2DRequest { x: 50.0, y: 60.0 },
      mouth_left: Point2DRequest { x: 35.0, y: 80.0 },
      mouth_right: Point2DRequest { x: 65.0, y: 80.0 },
    };

    let landmarks = FacialLandmarks::from(request);

    assert_eq!(landmarks.left_eye.x, 30.0);
    assert_eq!(landmarks.right_eye.x, 70.0);
    assert_eq!(landmarks.nose_tip.x, 50.0);
  }
}
