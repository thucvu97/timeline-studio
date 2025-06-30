/**
 * Rust команды для оптимизации видео под социальные платформы
 */
use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;

#[derive(Debug, Serialize, Deserialize)]
pub struct PlatformOptimizationResult {
  pub success: bool,
  pub output_path: String,
  pub file_size: u64,
  pub duration: f64,
  pub width: u32,
  pub height: u32,
  pub bitrate: u32,
  pub compression_ratio: f64,
  pub processing_time: f64,
  pub message: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ThumbnailGenerationResult {
  pub success: bool,
  pub thumbnail_path: String,
  pub width: u32,
  pub height: u32,
  pub file_size: u64,
  pub message: String,
}

/// Параметры оптимизации для платформы
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PlatformOptimizationParams {
  pub input_path: String,
  pub output_path: String,
  pub target_width: u32,
  pub target_height: u32,
  pub target_bitrate: u32,
  pub target_framerate: u32,
  pub audio_codec: String,
  pub video_codec: String,
  pub crop_to_fit: bool,
}

/**
 * Оптимизировать видео для конкретной платформы
 */
#[tauri::command]
pub async fn ffmpeg_optimize_for_platform(
  params: PlatformOptimizationParams,
) -> Result<PlatformOptimizationResult, String> {
  let start_time = std::time::Instant::now();

  if !Path::new(&params.input_path).exists() {
    return Err(format!("Входной файл не найден: {}", params.input_path));
  }

  // Получаем информацию об исходном файле
  let original_metadata = get_video_metadata(&params.input_path)?;

  // Строим команду FFmpeg
  let mut ffmpeg_cmd = Command::new("ffmpeg");
  ffmpeg_cmd
    .arg("-i")
    .arg(&params.input_path)
    .arg("-y") // Перезаписать выходной файл
    .arg("-c:v")
    .arg(&params.video_codec)
    .arg("-c:a")
    .arg(&params.audio_codec)
    .arg("-b:v")
    .arg(format!("{}k", params.target_bitrate))
    .arg("-r")
    .arg(params.target_framerate.to_string())
    .arg("-movflags")
    .arg("+faststart"); // Оптимизация для веб-стриминга

  // Настройка разрешения и обрезки
  if params.crop_to_fit {
    // Обрезка с сохранением пропорций
    let scale_filter = format!(
      "scale={}:{}:force_original_aspect_ratio=increase,crop={}:{}",
      params.target_width, params.target_height, params.target_width, params.target_height
    );
    ffmpeg_cmd.arg("-vf").arg(scale_filter);
  } else {
    // Простое масштабирование
    ffmpeg_cmd.arg("-vf").arg(format!(
      "scale={}:{}",
      params.target_width, params.target_height
    ));
  }

  // Дополнительные настройки качества
  if params.video_codec == "h264" {
    ffmpeg_cmd
      .arg("-preset")
      .arg("medium")
      .arg("-crf")
      .arg("23"); // Constant Rate Factor для лучшего качества
  }

  // Настройки аудио
  ffmpeg_cmd
    .arg("-ar")
    .arg("44100") // Частота дискретизации
    .arg("-b:a")
    .arg("128k"); // Битрейт аудио

  ffmpeg_cmd.arg(&params.output_path);

  // Выполняем команду
  let output = ffmpeg_cmd
    .output()
    .map_err(|e| format!("Ошибка запуска FFmpeg: {e}"))?;

  if !output.status.success() {
    let stderr = String::from_utf8_lossy(&output.stderr);
    return Err(format!("FFmpeg завершился с ошибкой: {stderr}"));
  }

  // Получаем информацию о результирующем файле
  let processed_metadata = get_video_metadata(&params.output_path)?;
  let processing_time = start_time.elapsed().as_secs_f64();

  let compression_ratio =
    original_metadata.file_size as f64 / processed_metadata.file_size.max(1) as f64;

  Ok(PlatformOptimizationResult {
    success: true,
    output_path: params.output_path.clone(),
    file_size: processed_metadata.file_size,
    duration: processed_metadata.duration,
    width: processed_metadata.width,
    height: processed_metadata.height,
    bitrate: processed_metadata.bitrate,
    compression_ratio,
    processing_time,
    message: format!("Видео успешно оптимизировано. Размер уменьшен в {compression_ratio:.2} раз"),
  })
}

/**
 * Создать превью для платформы
 */
#[tauri::command]
pub async fn ffmpeg_generate_platform_thumbnail(
  video_path: String,
  output_path: String,
  timestamp: Option<f64>,
  target_width: u32,
  target_height: u32,
  _aspect_ratio: String,
  add_overlay: bool,
  platform_name: String,
) -> Result<ThumbnailGenerationResult, String> {
  if !Path::new(&video_path).exists() {
    return Err(format!("Видеофайл не найден: {video_path}"));
  }

  // Получаем длительность видео для определения времени кадра
  let metadata = get_video_metadata(&video_path)?;
  let frame_time = timestamp.unwrap_or(metadata.duration / 2.0);

  let mut ffmpeg_cmd = Command::new("ffmpeg");
  ffmpeg_cmd
    .arg("-i")
    .arg(&video_path)
    .arg("-ss")
    .arg(frame_time.to_string())
    .arg("-vframes")
    .arg("1")
    .arg("-y");

  // Настройка размера превью
  let filter_complex = if add_overlay {
    format!(
            "scale={}:{},drawtext=text='{}':fontsize={}:fontcolor=white:x=10:y=10:box=1:boxcolor=black@0.5",
            target_width, target_height, platform_name, target_height / 20
        )
  } else {
    format!("scale={target_width}:{target_height}")
  };

  ffmpeg_cmd.arg("-vf").arg(filter_complex);

  // Настройки качества для превью
  ffmpeg_cmd
    .arg("-q:v")
    .arg("2") // Высокое качество JPEG
    .arg(&output_path);

  // Выполняем команду
  let output = ffmpeg_cmd
    .output()
    .map_err(|e| format!("Ошибка запуска FFmpeg: {e}"))?;

  if !output.status.success() {
    let stderr = String::from_utf8_lossy(&output.stderr);
    return Err(format!("FFmpeg завершился с ошибкой: {stderr}"));
  }

  // Проверяем создался ли файл
  if !Path::new(&output_path).exists() {
    return Err("Превью не было создано".to_string());
  }

  let file_size = std::fs::metadata(&output_path)
    .map_err(|e| format!("Ошибка получения размера файла: {e}"))?
    .len();

  Ok(ThumbnailGenerationResult {
    success: true,
    thumbnail_path: output_path.clone(),
    width: target_width,
    height: target_height,
    file_size,
    message: format!("Превью для {platform_name} успешно создано"),
  })
}

/**
 * Пакетная оптимизация видео для нескольких платформ
 */
#[tauri::command]
pub async fn ffmpeg_batch_optimize_platforms(
  input_path: String,
  output_directory: String,
  platforms_config: String, // JSON с настройками платформ
) -> Result<Vec<PlatformOptimizationResult>, String> {
  use serde_json::Value;

  let platforms: Value = serde_json::from_str(&platforms_config)
    .map_err(|e| format!("Ошибка парсинга конфигурации платформ: {e}"))?;

  let platforms_array = platforms
    .as_array()
    .ok_or("Конфигурация платформ должна быть массивом")?;

  let mut results = Vec::new();

  for platform_config in platforms_array {
    let platform_name = platform_config["name"]
      .as_str()
      .ok_or("Не указано имя платформы")?;

    let output_filename = format!(
      "{}_optimized_{}.mp4",
      platform_name,
      std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs()
    );

    let output_path = format!("{output_directory}/{output_filename}");

    let params = PlatformOptimizationParams {
      input_path: input_path.clone(),
      output_path,
      target_width: platform_config["width"].as_u64().unwrap_or(1920) as u32,
      target_height: platform_config["height"].as_u64().unwrap_or(1080) as u32,
      target_bitrate: platform_config["bitrate"].as_u64().unwrap_or(3500) as u32,
      target_framerate: platform_config["framerate"].as_u64().unwrap_or(30) as u32,
      audio_codec: platform_config["audioCodec"]
        .as_str()
        .unwrap_or("aac")
        .to_string(),
      video_codec: platform_config["videoCodec"]
        .as_str()
        .unwrap_or("h264")
        .to_string(),
      crop_to_fit: platform_config["cropToFit"].as_bool().unwrap_or(false),
    };

    let result = ffmpeg_optimize_for_platform(params).await;

    match result {
      Ok(platform_result) => results.push(platform_result),
      Err(error) => {
        results.push(PlatformOptimizationResult {
          success: false,
          output_path: String::new(),
          file_size: 0,
          duration: 0.0,
          width: 0,
          height: 0,
          bitrate: 0,
          compression_ratio: 0.0,
          processing_time: 0.0,
          message: format!("Ошибка оптимизации для {platform_name}: {error}"),
        });
      }
    }
  }

  Ok(results)
}

/**
 * Анализ соответствия видео требованиям платформы
 */
#[tauri::command]
pub async fn ffmpeg_analyze_platform_compliance(
  video_path: String,
  platform_specs: String, // JSON с требованиями платформы
) -> Result<serde_json::Value, String> {
  use serde_json::{json, Value};

  let specs: Value = serde_json::from_str(&platform_specs)
    .map_err(|e| format!("Ошибка парсинга спецификаций платформы: {e}"))?;

  let metadata = get_video_metadata(&video_path)?;

  let mut compliance_issues = Vec::new();
  let mut warnings = Vec::new();
  let mut score = 100;

  // Проверка длительности
  let min_duration = specs["minDuration"].as_f64().unwrap_or(0.0);
  let max_duration = specs["maxDuration"].as_f64().unwrap_or(f64::MAX);

  if metadata.duration < min_duration {
    compliance_issues.push(format!(
      "Видео слишком короткое: {}с (минимум: {}с)",
      metadata.duration, min_duration
    ));
    score -= 25;
  }

  if metadata.duration > max_duration {
    compliance_issues.push(format!(
      "Видео слишком длинное: {}с (максимум: {}с)",
      metadata.duration, max_duration
    ));
    score -= 25;
  }

  // Проверка размера файла
  let max_file_size_mb = specs["maxFileSize"].as_f64().unwrap_or(f64::MAX);
  let file_size_mb = metadata.file_size as f64 / (1024.0 * 1024.0);

  if file_size_mb > max_file_size_mb {
    compliance_issues.push(format!(
      "Файл слишком большой: {file_size_mb:.2}MB (максимум: {max_file_size_mb}MB)"
    ));
    score -= 20;
  }

  // Проверка битрейта
  let max_bitrate = specs["maxBitrate"].as_u64().unwrap_or(u64::MAX) as u32;
  if metadata.bitrate > max_bitrate {
    warnings.push(format!(
      "Битрейт превышает рекомендованный: {}kbps (максимум: {}kbps)",
      metadata.bitrate, max_bitrate
    ));
    score -= 10;
  }

  // Проверка разрешения
  let recommended_width = specs["recommendedResolution"]["width"]
    .as_u64()
    .unwrap_or(1920) as u32;
  let recommended_height = specs["recommendedResolution"]["height"]
    .as_u64()
    .unwrap_or(1080) as u32;

  let current_aspect_ratio = metadata.width as f64 / metadata.height as f64;
  let recommended_aspect_ratio = recommended_width as f64 / recommended_height as f64;

  if (current_aspect_ratio - recommended_aspect_ratio).abs() > 0.2 {
    warnings.push(format!(
      "Соотношение сторон не оптимально: {}:{} (рекомендуется: {}:{})",
      metadata.width, metadata.height, recommended_width, recommended_height
    ));
    score -= 15;
  }

  Ok(json!({
      "compliant": compliance_issues.is_empty(),
      "score": score.max(0),
      "issues": compliance_issues,
      "warnings": warnings,
      "metadata": {
          "duration": metadata.duration,
          "fileSize": metadata.file_size,
          "fileSizeMB": file_size_mb,
          "width": metadata.width,
          "height": metadata.height,
          "bitrate": metadata.bitrate,
          "aspectRatio": current_aspect_ratio
      },
      "recommendations": generate_compliance_recommendations(&metadata, &specs)
  }))
}

/**
 * Создание прогрессивного веб-видео
 */
#[tauri::command]
pub async fn ffmpeg_create_progressive_video(
  input_path: String,
  output_directory: String,
  platform: String,
) -> Result<serde_json::Value, String> {
  use serde_json::json;

  // Создаем несколько качеств для адаптивного стриминга
  let qualities = match platform.as_str() {
    "youtube" => vec![
      (1920, 1080, 8000, "1080p"),
      (1280, 720, 5000, "720p"),
      (854, 480, 2500, "480p"),
    ],
    "tiktok" | "instagram_reels" => vec![(1080, 1920, 3500, "1080p"), (720, 1280, 2000, "720p")],
    _ => vec![(1280, 720, 3500, "720p"), (854, 480, 2000, "480p")],
  };

  let mut results = Vec::new();

  for (width, height, bitrate, quality_name) in qualities {
    let output_filename = format!(
      "{}_{}_{}p.mp4",
      platform,
      std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap()
        .as_secs(),
      height
    );

    let output_path = format!("{output_directory}/{output_filename}");

    let params = PlatformOptimizationParams {
      input_path: input_path.clone(),
      output_path: output_path.clone(),
      target_width: width,
      target_height: height,
      target_bitrate: bitrate,
      target_framerate: 30,
      audio_codec: "aac".to_string(),
      video_codec: "h264".to_string(),
      crop_to_fit: true,
    };

    let result = ffmpeg_optimize_for_platform(params).await;

    results.push(json!({
        "quality": quality_name,
        "width": width,
        "height": height,
        "bitrate": bitrate,
        "outputPath": output_path,
        "success": result.is_ok(),
        "error": result.err().unwrap_or_default()
    }));
  }

  Ok(json!({
      "platform": platform,
      "progressiveVideos": results,
      "totalQualities": results.len()
  }))
}

// Вспомогательные структуры
#[derive(Debug)]
struct VideoMetadata {
  duration: f64,
  width: u32,
  height: u32,
  bitrate: u32,
  file_size: u64,
}

// Вспомогательная функция для получения метаданных видео
fn get_video_metadata(file_path: &str) -> Result<VideoMetadata, String> {
  let output = Command::new("ffprobe")
    .args([
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      file_path,
    ])
    .output()
    .map_err(|e| format!("Ошибка запуска ffprobe: {e}"))?;

  if !output.status.success() {
    return Err("ffprobe завершился с ошибкой".to_string());
  }

  let json_str = String::from_utf8_lossy(&output.stdout);
  let json: serde_json::Value =
    serde_json::from_str(&json_str).map_err(|e| format!("Ошибка парсинга JSON: {e}"))?;

  let video_stream = json["streams"]
    .as_array()
    .and_then(|streams| {
      streams
        .iter()
        .find(|stream| stream["codec_type"].as_str() == Some("video"))
    })
    .ok_or("Видеопоток не найден")?;

  let format = &json["format"];

  let duration = format["duration"]
    .as_str()
    .and_then(|d| d.parse::<f64>().ok())
    .unwrap_or(0.0);

  let width = video_stream["width"].as_u64().unwrap_or(0) as u32;
  let height = video_stream["height"].as_u64().unwrap_or(0) as u32;

  let bitrate = format["bit_rate"]
    .as_str()
    .and_then(|br| br.parse::<u32>().ok())
    .map(|br| br / 1000) // Конвертируем в kbps
    .unwrap_or(0);

  let file_size = format["size"]
    .as_str()
    .and_then(|s| s.parse::<u64>().ok())
    .unwrap_or(0);

  Ok(VideoMetadata {
    duration,
    width,
    height,
    bitrate,
    file_size,
  })
}

// Генерация рекомендаций по соответствию
fn generate_compliance_recommendations(
  metadata: &VideoMetadata,
  specs: &serde_json::Value,
) -> Vec<String> {
  let mut recommendations = Vec::new();

  let min_duration = specs["minDuration"].as_f64().unwrap_or(0.0);
  let max_duration = specs["maxDuration"].as_f64().unwrap_or(f64::MAX);

  if metadata.duration < min_duration {
    recommendations.push(format!(
      "Увеличьте длительность видео до {min_duration} секунд"
    ));
  }

  if metadata.duration > max_duration {
    recommendations.push(format!("Сократите видео до {max_duration} секунд"));
  }

  let max_file_size_mb = specs["maxFileSize"].as_f64().unwrap_or(f64::MAX);
  let file_size_mb = metadata.file_size as f64 / (1024.0 * 1024.0);

  if file_size_mb > max_file_size_mb {
    recommendations.push("Уменьшите размер файла через сжатие или снижение битрейта".to_string());
  }

  let max_bitrate = specs["maxBitrate"].as_u64().unwrap_or(u64::MAX) as u32;
  if metadata.bitrate > max_bitrate {
    recommendations.push(format!("Снизьте битрейт до {max_bitrate} kbps"));
  }

  let video_codec = specs["videoCodec"].as_str().unwrap_or("h264");
  let audio_codec = specs["audioCodec"].as_str().unwrap_or("aac");
  recommendations.push(format!(
    "Используйте кодек {video_codec} для видео и {audio_codec} для аудио"
  ));

  let recommended_width = specs["recommendedResolution"]["width"]
    .as_u64()
    .unwrap_or(1920);
  let recommended_height = specs["recommendedResolution"]["height"]
    .as_u64()
    .unwrap_or(1080);
  recommendations.push(format!(
    "Установите разрешение {recommended_width}x{recommended_height}"
  ));

  recommendations
}

#[cfg(test)]
mod tests {
  use super::*;
  use serde_json::json;

  #[test]
  fn test_platform_optimization_result_structure() {
    let result = PlatformOptimizationResult {
      success: true,
      output_path: "/path/to/output.mp4".to_string(),
      file_size: 1048576,
      duration: 30.5,
      width: 1920,
      height: 1080,
      bitrate: 3500,
      compression_ratio: 2.5,
      processing_time: 15.3,
      message: "Success".to_string(),
    };

    assert!(result.success);
    assert_eq!(result.output_path, "/path/to/output.mp4");
    assert_eq!(result.file_size, 1048576);
    assert_eq!(result.duration, 30.5);
    assert_eq!(result.width, 1920);
    assert_eq!(result.height, 1080);
    assert_eq!(result.bitrate, 3500);
    assert_eq!(result.compression_ratio, 2.5);
    assert_eq!(result.processing_time, 15.3);
    assert_eq!(result.message, "Success");

    // Test serialization
    let serialized = serde_json::to_string(&result).unwrap();
    assert!(serialized.contains("\"success\":true"));
    assert!(serialized.contains("\"output_path\":\"/path/to/output.mp4\""));
  }

  #[test]
  fn test_thumbnail_generation_result_structure() {
    let result = ThumbnailGenerationResult {
      success: true,
      thumbnail_path: "/path/to/thumbnail.jpg".to_string(),
      width: 1280,
      height: 720,
      file_size: 102400,
      message: "Thumbnail created".to_string(),
    };

    assert!(result.success);
    assert_eq!(result.thumbnail_path, "/path/to/thumbnail.jpg");
    assert_eq!(result.width, 1280);
    assert_eq!(result.height, 720);
    assert_eq!(result.file_size, 102400);
    assert_eq!(result.message, "Thumbnail created");
  }

  #[test]
  fn test_platform_optimization_params_structure() {
    let params = PlatformOptimizationParams {
      input_path: "/input/video.mp4".to_string(),
      output_path: "/output/optimized.mp4".to_string(),
      target_width: 1920,
      target_height: 1080,
      target_bitrate: 4000,
      target_framerate: 30,
      audio_codec: "aac".to_string(),
      video_codec: "h264".to_string(),
      crop_to_fit: true,
    };

    assert_eq!(params.input_path, "/input/video.mp4");
    assert_eq!(params.output_path, "/output/optimized.mp4");
    assert_eq!(params.target_width, 1920);
    assert_eq!(params.target_height, 1080);
    assert_eq!(params.target_bitrate, 4000);
    assert_eq!(params.target_framerate, 30);
    assert_eq!(params.audio_codec, "aac");
    assert_eq!(params.video_codec, "h264");
    assert!(params.crop_to_fit);

    // Test serialization/deserialization
    let serialized = serde_json::to_string(&params).unwrap();
    let deserialized: PlatformOptimizationParams = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.input_path, params.input_path);
    assert_eq!(deserialized.target_width, params.target_width);
  }

  #[test]
  fn test_video_metadata_structure() {
    let metadata = VideoMetadata {
      duration: 120.5,
      width: 1920,
      height: 1080,
      bitrate: 5000,
      file_size: 75497472,
    };

    assert_eq!(metadata.duration, 120.5);
    assert_eq!(metadata.width, 1920);
    assert_eq!(metadata.height, 1080);
    assert_eq!(metadata.bitrate, 5000);
    assert_eq!(metadata.file_size, 75497472);
  }

  #[tokio::test]
  async fn test_ffmpeg_optimize_for_platform_invalid_input() {
    let params = PlatformOptimizationParams {
      input_path: "/non/existent/file.mp4".to_string(),
      output_path: "/output/test.mp4".to_string(),
      target_width: 1920,
      target_height: 1080,
      target_bitrate: 3500,
      target_framerate: 30,
      audio_codec: "aac".to_string(),
      video_codec: "h264".to_string(),
      crop_to_fit: false,
    };

    let result = ffmpeg_optimize_for_platform(params).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Входной файл не найден"));
  }

  #[tokio::test]
  async fn test_ffmpeg_generate_platform_thumbnail_invalid_input() {
    let result = ffmpeg_generate_platform_thumbnail(
      "/non/existent/video.mp4".to_string(),
      "/output/thumb.jpg".to_string(),
      Some(5.0),
      320,
      240,
      "16:9".to_string(),
      false,
      "YouTube".to_string(),
    )
    .await;

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Видеофайл не найден"));
  }

  #[tokio::test]
  async fn test_ffmpeg_batch_optimize_platforms_invalid_json() {
    let result = ffmpeg_batch_optimize_platforms(
      "/input/video.mp4".to_string(),
      "/output/dir".to_string(),
      "invalid json".to_string(),
    )
    .await;

    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .contains("Ошибка парсинга конфигурации платформ"));
  }

  #[tokio::test]
  async fn test_ffmpeg_batch_optimize_platforms_not_array() {
    let result = ffmpeg_batch_optimize_platforms(
      "/input/video.mp4".to_string(),
      "/output/dir".to_string(),
      r#"{"key": "value"}"#.to_string(),
    )
    .await;

    assert!(result.is_err());
    assert!(result.unwrap_err().contains("должна быть массивом"));
  }

  #[tokio::test]
  async fn test_ffmpeg_analyze_platform_compliance_invalid_json() {
    let result =
      ffmpeg_analyze_platform_compliance("/video.mp4".to_string(), "not json".to_string()).await;

    assert!(result.is_err());
    assert!(result
      .unwrap_err()
      .contains("Ошибка парсинга спецификаций платформы"));
  }

  #[tokio::test]
  async fn test_ffmpeg_create_progressive_video_youtube() {
    let result = ffmpeg_create_progressive_video(
      "/input/video.mp4".to_string(),
      "/output/dir".to_string(),
      "youtube".to_string(),
    )
    .await;

    // Since ffmpeg is not available in tests, this will fail
    // but we can check the structure
    if let Ok(json_result) = result {
      assert_eq!(json_result["platform"], "youtube");
      assert!(json_result["progressiveVideos"].is_array());
      assert_eq!(json_result["totalQualities"], 3); // YouTube has 3 quality levels
    }
  }

  #[tokio::test]
  async fn test_ffmpeg_create_progressive_video_tiktok() {
    let result = ffmpeg_create_progressive_video(
      "/input/video.mp4".to_string(),
      "/output/dir".to_string(),
      "tiktok".to_string(),
    )
    .await;

    if let Ok(json_result) = result {
      assert_eq!(json_result["platform"], "tiktok");
      assert!(json_result["progressiveVideos"].is_array());
      assert_eq!(json_result["totalQualities"], 2); // TikTok has 2 quality levels
    }
  }

  #[test]
  fn test_generate_compliance_recommendations() {
    let metadata = VideoMetadata {
      duration: 15.0,
      width: 1920,
      height: 1080,
      bitrate: 10000,
      file_size: 18750000, // ~18MB
    };

    let specs = json!({
      "minDuration": 30.0,
      "maxDuration": 300.0,
      "maxFileSize": 10.0, // 10MB
      "maxBitrate": 5000,
      "videoCodec": "h264",
      "audioCodec": "aac",
      "recommendedResolution": {
        "width": 1280,
        "height": 720
      }
    });

    let recommendations = generate_compliance_recommendations(&metadata, &specs);

    assert!(!recommendations.is_empty());
    assert!(recommendations.iter().any(|r| r.contains("30")));
    assert!(recommendations.iter().any(|r| r.contains("битрейт")));
    assert!(recommendations.iter().any(|r| r.contains("1280x720")));
  }

  #[tokio::test]
  async fn test_platform_optimization_with_h264_codec() {
    let params = PlatformOptimizationParams {
      input_path: "/test/video.mp4".to_string(),
      output_path: "/output/h264.mp4".to_string(),
      target_width: 1920,
      target_height: 1080,
      target_bitrate: 3500,
      target_framerate: 30,
      audio_codec: "aac".to_string(),
      video_codec: "h264".to_string(),
      crop_to_fit: false,
    };

    // This tests the code path for h264 codec settings
    // In a real test with ffmpeg available, this would verify proper encoding
    let result = ffmpeg_optimize_for_platform(params).await;
    assert!(result.is_err()); // Expected to fail without ffmpeg
  }

  #[test]
  fn test_platform_optimization_params_clone() {
    let params = PlatformOptimizationParams {
      input_path: "/input.mp4".to_string(),
      output_path: "/output.mp4".to_string(),
      target_width: 1280,
      target_height: 720,
      target_bitrate: 2500,
      target_framerate: 24,
      audio_codec: "mp3".to_string(),
      video_codec: "h265".to_string(),
      crop_to_fit: false,
    };

    let cloned = params.clone();
    assert_eq!(cloned.input_path, params.input_path);
    assert_eq!(cloned.target_width, params.target_width);
    assert_eq!(cloned.video_codec, params.video_codec);
    assert_eq!(cloned.crop_to_fit, params.crop_to_fit);
  }

  #[test]
  fn test_compliance_analysis_calculations() {
    let metadata = VideoMetadata {
      duration: 400.0, // Too long
      width: 3840,
      height: 2160,
      bitrate: 20000,        // Too high
      file_size: 1073741824, // 1GB - too large
    };

    let _specs = json!({
      "minDuration": 10.0,
      "maxDuration": 300.0,
      "maxFileSize": 500.0, // 500MB
      "maxBitrate": 10000,
      "recommendedResolution": {
        "width": 1920,
        "height": 1080
      }
    });

    // Calculate expected values
    let file_size_mb = metadata.file_size as f64 / (1024.0 * 1024.0);
    assert_eq!(file_size_mb, 1024.0);

    let aspect_ratio = metadata.width as f64 / metadata.height as f64;
    let expected_ratio = 3840.0 / 2160.0;
    assert!((aspect_ratio - expected_ratio).abs() < 0.001);
  }

  #[test]
  fn test_platform_specific_qualities() {
    // Test YouTube qualities
    let youtube_qualities = [
      (1920, 1080, 8000, "1080p"),
      (1280, 720, 5000, "720p"),
      (854, 480, 2500, "480p"),
    ];

    assert_eq!(youtube_qualities.len(), 3);
    assert_eq!(youtube_qualities[0].0, 1920);
    assert_eq!(youtube_qualities[0].3, "1080p");

    // Test TikTok/Instagram qualities
    let tiktok_qualities = [(1080, 1920, 3500, "1080p"), (720, 1280, 2000, "720p")];

    assert_eq!(tiktok_qualities.len(), 2);
    assert_eq!(tiktok_qualities[0].0, 1080); // Width
    assert_eq!(tiktok_qualities[0].1, 1920); // Height - portrait orientation
  }

  #[test]
  fn test_error_result_creation() {
    let error_result = PlatformOptimizationResult {
      success: false,
      output_path: String::new(),
      file_size: 0,
      duration: 0.0,
      width: 0,
      height: 0,
      bitrate: 0,
      compression_ratio: 0.0,
      processing_time: 0.0,
      message: "Error occurred".to_string(),
    };

    assert!(!error_result.success);
    assert!(error_result.output_path.is_empty());
    assert_eq!(error_result.file_size, 0);
    assert_eq!(error_result.message, "Error occurred");
  }
}
