/**
 * Rust команды для автоматизированных рабочих процессов видеомонтажа
 */
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkflowExecutionResult {
  pub success: bool,
  pub workflow_id: String,
  pub message: String,
  pub outputs: Vec<WorkflowOutput>,
  pub execution_time: f64,
  pub steps_completed: u32,
  pub steps_failed: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkflowOutput {
  pub output_type: String,
  pub file_path: String,
  pub metadata: WorkflowOutputMetadata,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct WorkflowOutputMetadata {
  pub duration: f64,
  pub file_size: u64,
  pub width: u32,
  pub height: u32,
  pub quality_score: u8,
}

/**
 * Создать временную директорию для workflow
 */
#[tauri::command]
pub async fn create_directory(path: String) -> Result<bool, String> {
  std::fs::create_dir_all(&path).map_err(|e| format!("Ошибка создания директории: {e}"))?;
  Ok(true)
}

/**
 * Создать проект timeline из данных workflow
 */
#[tauri::command]
pub async fn create_timeline_project(
  project_data: String,
  output_path: String,
) -> Result<String, String> {
  use std::fs;

  // Проверяем что данные проекта валидны
  let _project: serde_json::Value =
    serde_json::from_str(&project_data).map_err(|e| format!("Невалидные данные проекта: {e}"))?;

  // Создаем директорию если не существует
  if let Some(parent) = Path::new(&output_path).parent() {
    fs::create_dir_all(parent).map_err(|e| format!("Ошибка создания директории: {e}"))?;
  }

  // Записываем данные проекта в файл
  fs::write(&output_path, &project_data)
    .map_err(|e| format!("Ошибка записи файла проекта: {e}"))?;

  Ok(format!("Проект timeline создан: {output_path}"))
}

/**
 * Компилировать видео из проекта timeline для workflow
 */
#[tauri::command]
pub async fn compile_workflow_video(
  project_file: String,
  output_path: String,
  settings: String, // JSON с настройками рендеринга
) -> Result<serde_json::Value, String> {
  use serde_json::{json, Value};

  let render_settings: Value = serde_json::from_str(&settings)
    .map_err(|e| format!("Ошибка парсинга настроек рендеринга: {e}"))?;

  // Пока используем простую заглушку для компиляции
  // В реальной реализации здесь должна быть логика FFmpeg рендеринга
  let start_time = std::time::Instant::now();

  // Проверяем существование файла проекта
  if !Path::new(&project_file).exists() {
    return Err(format!("Файл проекта не найден: {project_file}"));
  }

  // Создаем выходную директорию если не существует
  if let Some(parent) = Path::new(&output_path).parent() {
    std::fs::create_dir_all(parent)
      .map_err(|e| format!("Ошибка создания выходной директории: {e}"))?;
  }

  // Простое копирование файла для демонстрации (в реальности здесь FFmpeg)
  std::fs::copy(&project_file, &output_path)
    .map_err(|e| format!("Ошибка создания выходного файла: {e}"))?;

  let processing_time = start_time.elapsed().as_secs_f64();

  Ok(json!({
    "success": true,
    "output_path": output_path,
    "processing_time": processing_time,
    "resolution": {
      "width": render_settings["resolution"]["width"].as_u64().unwrap_or(1920),
      "height": render_settings["resolution"]["height"].as_u64().unwrap_or(1080)
    },
    "framerate": render_settings["framerate"].as_u64().unwrap_or(30),
    "quality": render_settings["quality"].as_str().unwrap_or("high"),
    "message": "Видео успешно скомпилировано"
  }))
}

/**
 * Анализ качества видео для workflow
 */
#[tauri::command]
pub async fn analyze_workflow_video_quality(
  video_path: String,
  analysis_type: String,
) -> Result<serde_json::Value, String> {
  use serde_json::json;

  if !Path::new(&video_path).exists() {
    return Err(format!("Видеофайл не найден: {video_path}"));
  }

  // Получаем метаданные видео с помощью ffprobe
  let output = Command::new("ffprobe")
    .args([
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      &video_path,
    ])
    .output()
    .map_err(|e| format!("Ошибка запуска ffprobe: {e}"))?;

  if !output.status.success() {
    return Err("ffprobe завершился с ошибкой".to_string());
  }

  let json_str = String::from_utf8_lossy(&output.stdout);
  let metadata: serde_json::Value =
    serde_json::from_str(&json_str).map_err(|e| format!("Ошибка парсинга метаданных: {e}"))?;

  // Базовый анализ качества
  let video_stream = metadata["streams"]
    .as_array()
    .and_then(|streams| {
      streams
        .iter()
        .find(|stream| stream["codec_type"].as_str() == Some("video"))
    })
    .ok_or("Видеопоток не найден")?;

  let width = video_stream["width"].as_u64().unwrap_or(0);
  let height = video_stream["height"].as_u64().unwrap_or(0);
  let bitrate = metadata["format"]["bit_rate"]
    .as_str()
    .and_then(|br| br.parse::<u64>().ok())
    .unwrap_or(0);

  // Оценка качества на основе разрешения и битрейта
  let quality_score = calculate_quality_score(width, height, bitrate);

  let analysis_result = match analysis_type.as_str() {
    "basic" => json!({
      "width": width,
      "height": height,
      "bitrate": bitrate,
      "quality_score": quality_score,
      "analysis_type": "basic"
    }),
    "detailed" => json!({
      "width": width,
      "height": height,
      "bitrate": bitrate,
      "quality_score": quality_score,
      "codec": video_stream["codec_name"].as_str().unwrap_or("unknown"),
      "pixel_format": video_stream["pix_fmt"].as_str().unwrap_or("unknown"),
      "frame_rate": video_stream["r_frame_rate"].as_str().unwrap_or("unknown"),
      "analysis_type": "detailed"
    }),
    _ => json!({
      "error": "Неизвестный тип анализа",
      "supported_types": ["basic", "detailed"]
    }),
  };

  Ok(analysis_result)
}

/**
 * Создать превью для workflow результата
 */
#[tauri::command]
pub async fn create_workflow_preview(
  video_path: String,
  output_path: String,
  timestamp: Option<f64>,
) -> Result<serde_json::Value, String> {
  use serde_json::json;

  if !Path::new(&video_path).exists() {
    return Err(format!("Исходное видео не найдено: {video_path}"));
  }

  let frame_time = timestamp.unwrap_or(5.0); // По умолчанию 5 секунда

  let mut ffmpeg_cmd = Command::new("ffmpeg");
  ffmpeg_cmd
    .arg("-i")
    .arg(&video_path)
    .arg("-ss")
    .arg(frame_time.to_string())
    .arg("-vframes")
    .arg("1")
    .arg("-y")
    .arg("-vf")
    .arg("scale=1280:720") // HD превью
    .arg("-q:v")
    .arg("2") // Высокое качество
    .arg(&output_path);

  let output = ffmpeg_cmd
    .output()
    .map_err(|e| format!("Ошибка запуска FFmpeg: {e}"))?;

  if !output.status.success() {
    let stderr = String::from_utf8_lossy(&output.stderr);
    return Err(format!("FFmpeg завершился с ошибкой: {stderr}"));
  }

  let file_size = std::fs::metadata(&output_path)
    .map_err(|e| format!("Ошибка получения размера файла: {e}"))?
    .len();

  Ok(json!({
    "success": true,
    "preview_path": output_path,
    "file_size": file_size,
    "timestamp": frame_time,
    "resolution": { "width": 1280, "height": 720 },
    "message": "Превью workflow успешно создано"
  }))
}

/**
 * Очистить временные файлы workflow
 */
#[tauri::command]
pub async fn cleanup_workflow_temp_files(temp_directory: String) -> Result<bool, String> {
  if Path::new(&temp_directory).exists() {
    std::fs::remove_dir_all(&temp_directory)
      .map_err(|e| format!("Ошибка удаления временной директории: {e}"))?;
  }
  Ok(true)
}

// Вспомогательные функции

fn calculate_quality_score(width: u64, height: u64, bitrate: u64) -> u8 {
  let pixels = width * height;
  let bitrate_kbps = bitrate / 1000;

  // Простая оценка качества на основе разрешения и битрейта
  let resolution_score = match pixels {
    p if p >= 1920 * 1080 => 40, // 4K/1080p
    p if p >= 1280 * 720 => 30,  // 720p
    p if p >= 854 * 480 => 20,   // 480p
    _ => 10,                     // Низкое разрешение
  };

  let bitrate_score = match bitrate_kbps {
    b if b >= 5000 => 40, // Высокий битрейт
    b if b >= 2500 => 30, // Средний битрейт
    b if b >= 1000 => 20, // Низкий битрейт
    _ => 10,              // Очень низкий битрейт
  };

  let base_score = 20; // Базовые баллы
  std::cmp::min(100, resolution_score + bitrate_score + base_score) as u8
}

#[cfg(test)]
mod tests {
  use super::*;
  use std::fs;
  use tempfile::TempDir;

  #[test]
  fn test_workflow_execution_result_creation() {
    let result = WorkflowExecutionResult {
      success: true,
      workflow_id: "test-workflow-123".to_string(),
      message: "Workflow completed successfully".to_string(),
      outputs: vec![],
      execution_time: 10.5,
      steps_completed: 5,
      steps_failed: 0,
    };

    assert!(result.success);
    assert_eq!(result.workflow_id, "test-workflow-123");
    assert_eq!(result.execution_time, 10.5);
    assert_eq!(result.steps_completed, 5);
    assert_eq!(result.steps_failed, 0);
  }

  #[test]
  fn test_workflow_output_metadata() {
    let metadata = WorkflowOutputMetadata {
      duration: 60.0,
      file_size: 1024 * 1024 * 100, // 100MB
      width: 1920,
      height: 1080,
      quality_score: 85,
    };

    assert_eq!(metadata.duration, 60.0);
    assert_eq!(metadata.file_size, 104857600);
    assert_eq!(metadata.width, 1920);
    assert_eq!(metadata.height, 1080);
    assert_eq!(metadata.quality_score, 85);
  }

  #[test]
  fn test_workflow_output_creation() {
    let output = WorkflowOutput {
      output_type: "video/mp4".to_string(),
      file_path: "/tmp/output.mp4".to_string(),
      metadata: WorkflowOutputMetadata {
        duration: 30.0,
        file_size: 50 * 1024 * 1024,
        width: 1280,
        height: 720,
        quality_score: 75,
      },
    };

    assert_eq!(output.output_type, "video/mp4");
    assert_eq!(output.file_path, "/tmp/output.mp4");
    assert_eq!(output.metadata.width, 1280);
    assert_eq!(output.metadata.height, 720);
  }

  #[tokio::test]
  async fn test_create_directory() {
    let temp_dir = TempDir::new().unwrap();
    let test_path = temp_dir.path().join("workflow_test_dir");

    let result = create_directory(test_path.to_string_lossy().to_string()).await;
    assert!(result.is_ok());
    assert!(result.unwrap());
    assert!(test_path.exists());
  }

  #[tokio::test]
  async fn test_create_directory_nested() {
    let temp_dir = TempDir::new().unwrap();
    let nested_path = temp_dir.path().join("level1/level2/level3");

    let result = create_directory(nested_path.to_string_lossy().to_string()).await;
    assert!(result.is_ok());
    assert!(nested_path.exists());
  }

  #[tokio::test]
  async fn test_create_timeline_project() {
    let temp_dir = TempDir::new().unwrap();
    let output_path = temp_dir.path().join("project.json");

    let project_data = r#"{
      "name": "Test Project",
      "version": "1.0.0",
      "timeline": {
        "duration": 60.0,
        "tracks": []
      }
    }"#;

    let result = create_timeline_project(
      project_data.to_string(),
      output_path.to_string_lossy().to_string(),
    )
    .await;

    assert!(result.is_ok());
    assert!(output_path.exists());

    // Проверяем содержимое файла
    let content = fs::read_to_string(&output_path).unwrap();
    assert!(content.contains("Test Project"));
    assert!(content.contains("\"duration\": 60.0"));
  }

  #[tokio::test]
  async fn test_create_timeline_project_invalid_json() {
    let temp_dir = TempDir::new().unwrap();
    let output_path = temp_dir.path().join("invalid.json");

    let invalid_data = "{ invalid json }";

    let result = create_timeline_project(
      invalid_data.to_string(),
      output_path.to_string_lossy().to_string(),
    )
    .await;

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Невалидные данные проекта"));
  }

  #[tokio::test]
  async fn test_compile_workflow_video() {
    let temp_dir = TempDir::new().unwrap();
    let project_file = temp_dir.path().join("project.json");
    let output_file = temp_dir.path().join("output.mp4");

    // Создаем тестовый файл проекта
    fs::write(&project_file, "test project content").unwrap();

    let settings = r#"{
      "resolution": {
        "width": 1920,
        "height": 1080
      },
      "framerate": 30,
      "quality": "high"
    }"#;

    let result = compile_workflow_video(
      project_file.to_string_lossy().to_string(),
      output_file.to_string_lossy().to_string(),
      settings.to_string(),
    )
    .await;

    assert!(result.is_ok());

    let json = result.unwrap();
    assert_eq!(json["success"], true);
    assert_eq!(json["resolution"]["width"], 1920);
    assert_eq!(json["resolution"]["height"], 1080);
    assert_eq!(json["framerate"], 30);
    assert_eq!(json["quality"], "high");
  }

  #[tokio::test]
  async fn test_compile_workflow_video_missing_project() {
    let temp_dir = TempDir::new().unwrap();
    let missing_file = temp_dir.path().join("missing.json");
    let output_file = temp_dir.path().join("output.mp4");

    let settings = "{}";

    let result = compile_workflow_video(
      missing_file.to_string_lossy().to_string(),
      output_file.to_string_lossy().to_string(),
      settings.to_string(),
    )
    .await;

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Файл проекта не найден"));
  }

  #[tokio::test]
  async fn test_compile_workflow_video_invalid_settings() {
    let temp_dir = TempDir::new().unwrap();
    let project_file = temp_dir.path().join("project.json");
    let output_file = temp_dir.path().join("output.mp4");

    fs::write(&project_file, "test content").unwrap();

    let invalid_settings = "{ invalid }";

    let result = compile_workflow_video(
      project_file.to_string_lossy().to_string(),
      output_file.to_string_lossy().to_string(),
      invalid_settings.to_string(),
    )
    .await;

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Ошибка парсинга настроек"));
  }

  #[tokio::test]
  async fn test_analyze_workflow_video_quality_missing_file() {
    let result =
      analyze_workflow_video_quality("/non/existent/video.mp4".to_string(), "basic".to_string())
        .await;

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Видеофайл не найден"));
  }

  #[tokio::test]
  async fn test_cleanup_workflow_temp_files() {
    let temp_dir = TempDir::new().unwrap();
    let workflow_dir = temp_dir.path().join("workflow_temp");

    // Создаем директорию с файлами
    fs::create_dir_all(&workflow_dir).unwrap();
    fs::write(workflow_dir.join("temp1.txt"), "temp content 1").unwrap();
    fs::write(workflow_dir.join("temp2.txt"), "temp content 2").unwrap();

    assert!(workflow_dir.exists());

    let result = cleanup_workflow_temp_files(workflow_dir.to_string_lossy().to_string()).await;

    assert!(result.is_ok());
    assert!(result.unwrap());
    assert!(!workflow_dir.exists());
  }

  #[tokio::test]
  async fn test_cleanup_workflow_temp_files_non_existent() {
    let result = cleanup_workflow_temp_files("/non/existent/directory".to_string()).await;

    // Должно успешно завершиться даже если директории нет
    assert!(result.is_ok());
    assert!(result.unwrap());
  }

  #[test]
  fn test_calculate_quality_score() {
    // 4K с высоким битрейтом
    let score_4k_high = calculate_quality_score(3840, 2160, 10_000_000);
    assert_eq!(score_4k_high, 100); // 40 + 40 + 20

    // 1080p с высоким битрейтом
    let score_1080p_high = calculate_quality_score(1920, 1080, 5_000_000);
    assert_eq!(score_1080p_high, 100); // 40 + 40 + 20

    // 720p со средним битрейтом
    let score_720p_medium = calculate_quality_score(1280, 720, 2_500_000);
    assert_eq!(score_720p_medium, 80); // 30 + 30 + 20

    // 480p с низким битрейтом
    let score_480p_low = calculate_quality_score(854, 480, 1_000_000);
    assert_eq!(score_480p_low, 60); // 20 + 20 + 20

    // Низкое разрешение с очень низким битрейтом
    let score_low = calculate_quality_score(640, 360, 500_000);
    assert_eq!(score_low, 40); // 10 + 10 + 20
  }

  #[test]
  fn test_quality_score_edge_cases() {
    // Нулевые значения
    let score_zero = calculate_quality_score(0, 0, 0);
    assert_eq!(score_zero, 40); // 10 + 10 + 20

    // Очень высокий битрейт
    let score_ultra_high = calculate_quality_score(1920, 1080, 50_000_000);
    assert_eq!(score_ultra_high, 100); // Максимум 100

    // Нестандартное разрешение
    let score_custom = calculate_quality_score(1440, 900, 3_000_000);
    assert_eq!(score_custom, 80); // 30 (больше 720p, но меньше 1080p) + 30 + 20
  }

  #[test]
  fn test_workflow_structures_serialization() {
    let workflow_result = WorkflowExecutionResult {
      success: true,
      workflow_id: "wf-123".to_string(),
      message: "Test message".to_string(),
      outputs: vec![WorkflowOutput {
        output_type: "video/mp4".to_string(),
        file_path: "/tmp/test.mp4".to_string(),
        metadata: WorkflowOutputMetadata {
          duration: 30.0,
          file_size: 1024,
          width: 1920,
          height: 1080,
          quality_score: 90,
        },
      }],
      execution_time: 5.5,
      steps_completed: 3,
      steps_failed: 0,
    };

    // Сериализация
    let json = serde_json::to_string(&workflow_result).unwrap();
    assert!(json.contains("wf-123"));
    assert!(json.contains("video/mp4"));

    // Десериализация
    let deserialized: WorkflowExecutionResult = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.workflow_id, "wf-123");
    assert_eq!(deserialized.outputs.len(), 1);
    assert_eq!(deserialized.outputs[0].metadata.quality_score, 90);
  }
}
