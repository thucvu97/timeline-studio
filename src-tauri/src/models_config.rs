/**
 * Configuration for ML models paths and settings
 */
use std::path::PathBuf;

/// Конфигурация путей к ML моделям
pub struct ModelsConfig {
  pub models_dir: PathBuf,
  pub yolo_models: YoloModelsConfig,
  pub facenet_models: FaceNetModelsConfig,
}

/// Конфигурация YOLO моделей
pub struct YoloModelsConfig {
  pub yolo_face_v8: PathBuf,
  pub yolo_face_v11: PathBuf,
  pub yolo_object_detection: PathBuf,
}

/// Конфигурация FaceNet моделей
pub struct FaceNetModelsConfig {
  pub facenet_512d: PathBuf,
  pub facenet_128d: PathBuf,
  pub arcface_512d: PathBuf,
}

impl Default for ModelsConfig {
  fn default() -> Self {
    let models_dir = PathBuf::from("models");

    Self {
      yolo_models: YoloModelsConfig {
        yolo_face_v8: models_dir.join("yolo/yolov8n-face.onnx"),
        yolo_face_v11: models_dir.join("yolo/yolov11n-face.onnx"),
        yolo_object_detection: models_dir.join("yolo/yolov8n.onnx"),
      },
      facenet_models: FaceNetModelsConfig {
        facenet_512d: models_dir.join("facenet/facenet-512d.onnx"),
        facenet_128d: models_dir.join("facenet/facenet-128d.onnx"),
        arcface_512d: models_dir.join("facenet/arcface-512d.onnx"),
      },
      models_dir,
    }
  }
}

impl ModelsConfig {
  /// Создать конфигурацию с базовой директорией
  pub fn new(base_dir: PathBuf) -> Self {
    let models_dir = base_dir.join("models");

    Self {
      yolo_models: YoloModelsConfig {
        yolo_face_v8: models_dir.join("yolo/yolov8n-face.onnx"),
        yolo_face_v11: models_dir.join("yolo/yolov11n-face.onnx"),
        yolo_object_detection: models_dir.join("yolo/yolov8n.onnx"),
      },
      facenet_models: FaceNetModelsConfig {
        facenet_512d: models_dir.join("facenet/facenet-512d.onnx"),
        facenet_128d: models_dir.join("facenet/facenet-128d.onnx"),
        arcface_512d: models_dir.join("facenet/arcface-512d.onnx"),
      },
      models_dir,
    }
  }

  /// Проверить существование всех моделей
  #[allow(dead_code)]
  pub fn validate_models(&self) -> Result<(), String> {
    let models_to_check = [
      ("YOLO Face v8", &self.yolo_models.yolo_face_v8),
      ("YOLO Face v11", &self.yolo_models.yolo_face_v11),
      (
        "YOLO Object Detection",
        &self.yolo_models.yolo_object_detection,
      ),
      ("FaceNet 512D", &self.facenet_models.facenet_512d),
      ("FaceNet 128D", &self.facenet_models.facenet_128d),
      ("ArcFace 512D", &self.facenet_models.arcface_512d),
    ];

    let mut missing_models = Vec::new();

    for (name, path) in models_to_check {
      if !path.exists() {
        missing_models.push(format!("{}: {}", name, path.display()));
      }
    }

    if !missing_models.is_empty() {
      return Err(format!(
        "Missing model files:\n{}",
        missing_models.join("\n")
      ));
    }

    Ok(())
  }

  /// Получить путь к YOLO модели по типу
  pub fn get_yolo_model_path(&self, model_type: &str) -> Option<&PathBuf> {
    match model_type {
      "yolo-face-v8" => Some(&self.yolo_models.yolo_face_v8),
      "yolo-face-v11" => Some(&self.yolo_models.yolo_face_v11),
      "yolo-object" => Some(&self.yolo_models.yolo_object_detection),
      _ => None,
    }
  }

  /// Получить путь к FaceNet модели по типу
  pub fn get_facenet_model_path(&self, model_type: &str) -> Option<&PathBuf> {
    match model_type {
      "facenet-512d" => Some(&self.facenet_models.facenet_512d),
      "facenet-128d" => Some(&self.facenet_models.facenet_128d),
      "arcface-512d" => Some(&self.facenet_models.arcface_512d),
      _ => None,
    }
  }

  /// Создать директории для моделей если они не существуют
  pub fn ensure_model_directories(&self) -> Result<(), std::io::Error> {
    std::fs::create_dir_all(self.models_dir.join("yolo"))?;
    std::fs::create_dir_all(self.models_dir.join("facenet"))?;
    Ok(())
  }
}

/// Глобальная конфигурация моделей
static mut GLOBAL_MODELS_CONFIG: Option<ModelsConfig> = None;

/// Инициализировать глобальную конфигурацию моделей
pub fn initialize_models_config(app_dir: PathBuf) -> Result<(), String> {
  unsafe {
    let config = ModelsConfig::new(app_dir);
    config
      .ensure_model_directories()
      .map_err(|e| format!("Failed to create model directories: {}", e))?;
    GLOBAL_MODELS_CONFIG = Some(config);
  }
  Ok(())
}

/// Получить глобальную конфигурацию моделей
#[allow(static_mut_refs)]
pub fn get_models_config() -> Result<&'static ModelsConfig, String> {
  unsafe {
    GLOBAL_MODELS_CONFIG
      .as_ref()
      .ok_or_else(|| "Models config not initialized".to_string())
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::fs;

  #[test]
  fn test_models_config_creation() {
    let temp_dir = std::env::temp_dir().join("test_models");
    let config = ModelsConfig::new(temp_dir.clone());

    assert_eq!(config.models_dir, temp_dir.join("models"));
    assert!(config
      .yolo_models
      .yolo_face_v8
      .to_string_lossy()
      .contains("yolov8n-face.onnx"));
    assert!(config
      .facenet_models
      .facenet_512d
      .to_string_lossy()
      .contains("facenet-512d.onnx"));
  }

  #[test]
  fn test_model_path_resolution() {
    let config = ModelsConfig::default();

    assert!(config.get_yolo_model_path("yolo-face-v8").is_some());
    assert!(config.get_yolo_model_path("invalid").is_none());

    assert!(config.get_facenet_model_path("facenet-512d").is_some());
    assert!(config.get_facenet_model_path("invalid").is_none());
  }
}
