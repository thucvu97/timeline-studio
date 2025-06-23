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

/**
 * Оптимизировать видео для конкретной платформы
 */
#[tauri::command]
pub async fn ffmpeg_optimize_for_platform(
  input_path: String,
  output_path: String,
  target_width: u32,
  target_height: u32,
  target_bitrate: u32,
  target_framerate: u32,
  audio_codec: String,
  video_codec: String,
  crop_to_fit: bool,
) -> Result<PlatformOptimizationResult, String> {
  let start_time = std::time::Instant::now();

  if !Path::new(&input_path).exists() {
    return Err(format!("Входной файл не найден: {}", input_path));
  }

  // Получаем информацию об исходном файле
  let original_metadata = get_video_metadata(&input_path)?;

  // Строим команду FFmpeg
  let mut ffmpeg_cmd = Command::new("ffmpeg");
  ffmpeg_cmd
    .arg("-i")
    .arg(&input_path)
    .arg("-y") // Перезаписать выходной файл
    .arg("-c:v")
    .arg(&video_codec)
    .arg("-c:a")
    .arg(&audio_codec)
    .arg("-b:v")
    .arg(format!("{}k", target_bitrate))
    .arg("-r")
    .arg(target_framerate.to_string())
    .arg("-movflags")
    .arg("+faststart"); // Оптимизация для веб-стриминга

  // Настройка разрешения и обрезки
  if crop_to_fit {
    // Обрезка с сохранением пропорций
    let scale_filter = format!(
      "scale={}:{}:force_original_aspect_ratio=increase,crop={}:{}",
      target_width, target_height, target_width, target_height
    );
    ffmpeg_cmd.arg("-vf").arg(scale_filter);
  } else {
    // Простое масштабирование
    ffmpeg_cmd
      .arg("-vf")
      .arg(format!("scale={}:{}", target_width, target_height));
  }

  // Дополнительные настройки качества
  if video_codec == "h264" {
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

  ffmpeg_cmd.arg(&output_path);

  // Выполняем команду
  let output = ffmpeg_cmd
    .output()
    .map_err(|e| format!("Ошибка запуска FFmpeg: {}", e))?;

  if !output.status.success() {
    let stderr = String::from_utf8_lossy(&output.stderr);
    return Err(format!("FFmpeg завершился с ошибкой: {}", stderr));
  }

  // Получаем информацию о результирующем файле
  let processed_metadata = get_video_metadata(&output_path)?;
  let processing_time = start_time.elapsed().as_secs_f64();

  let compression_ratio =
    original_metadata.file_size as f64 / processed_metadata.file_size.max(1) as f64;

  Ok(PlatformOptimizationResult {
    success: true,
    output_path: output_path.clone(),
    file_size: processed_metadata.file_size,
    duration: processed_metadata.duration,
    width: processed_metadata.width,
    height: processed_metadata.height,
    bitrate: processed_metadata.bitrate,
    compression_ratio,
    processing_time,
    message: format!(
      "Видео успешно оптимизировано. Размер уменьшен в {:.2} раз",
      compression_ratio
    ),
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
    return Err(format!("Видеофайл не найден: {}", video_path));
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
    format!("scale={}:{}", target_width, target_height)
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
    .map_err(|e| format!("Ошибка запуска FFmpeg: {}", e))?;

  if !output.status.success() {
    let stderr = String::from_utf8_lossy(&output.stderr);
    return Err(format!("FFmpeg завершился с ошибкой: {}", stderr));
  }

  // Проверяем создался ли файл
  if !Path::new(&output_path).exists() {
    return Err("Превью не было создано".to_string());
  }

  let file_size = std::fs::metadata(&output_path)
    .map_err(|e| format!("Ошибка получения размера файла: {}", e))?
    .len();

  Ok(ThumbnailGenerationResult {
    success: true,
    thumbnail_path: output_path.clone(),
    width: target_width,
    height: target_height,
    file_size,
    message: format!("Превью для {} успешно создано", platform_name),
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
    .map_err(|e| format!("Ошибка парсинга конфигурации платформ: {}", e))?;

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

    let output_path = format!("{}/{}", output_directory, output_filename);

    let result = ffmpeg_optimize_for_platform(
      input_path.clone(),
      output_path,
      platform_config["width"].as_u64().unwrap_or(1920) as u32,
      platform_config["height"].as_u64().unwrap_or(1080) as u32,
      platform_config["bitrate"].as_u64().unwrap_or(3500) as u32,
      platform_config["framerate"].as_u64().unwrap_or(30) as u32,
      platform_config["audioCodec"]
        .as_str()
        .unwrap_or("aac")
        .to_string(),
      platform_config["videoCodec"]
        .as_str()
        .unwrap_or("h264")
        .to_string(),
      platform_config["cropToFit"].as_bool().unwrap_or(false),
    )
    .await;

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
          message: format!("Ошибка оптимизации для {}: {}", platform_name, error),
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
    .map_err(|e| format!("Ошибка парсинга спецификаций платформы: {}", e))?;

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
      "Файл слишком большой: {:.2}MB (максимум: {}MB)",
      file_size_mb, max_file_size_mb
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

    let output_path = format!("{}/{}", output_directory, output_filename);

    let result = ffmpeg_optimize_for_platform(
      input_path.clone(),
      output_path.clone(),
      width,
      height,
      bitrate,
      30,
      "aac".to_string(),
      "h264".to_string(),
      true,
    )
    .await;

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
    .map_err(|e| format!("Ошибка запуска ffprobe: {}", e))?;

  if !output.status.success() {
    return Err("ffprobe завершился с ошибкой".to_string());
  }

  let json_str = String::from_utf8_lossy(&output.stdout);
  let json: serde_json::Value =
    serde_json::from_str(&json_str).map_err(|e| format!("Ошибка парсинга JSON: {}", e))?;

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
      "Увеличьте длительность видео до {} секунд",
      min_duration
    ));
  }

  if metadata.duration > max_duration {
    recommendations.push(format!("Сократите видео до {} секунд", max_duration));
  }

  let max_file_size_mb = specs["maxFileSize"].as_f64().unwrap_or(f64::MAX);
  let file_size_mb = metadata.file_size as f64 / (1024.0 * 1024.0);

  if file_size_mb > max_file_size_mb {
    recommendations.push("Уменьшите размер файла через сжатие или снижение битрейта".to_string());
  }

  let max_bitrate = specs["maxBitrate"].as_u64().unwrap_or(u64::MAX) as u32;
  if metadata.bitrate > max_bitrate {
    recommendations.push(format!("Снизьте битрейт до {} kbps", max_bitrate));
  }

  let video_codec = specs["videoCodec"].as_str().unwrap_or("h264");
  let audio_codec = specs["audioCodec"].as_str().unwrap_or("aac");
  recommendations.push(format!(
    "Используйте кодек {} для видео и {} для аудио",
    video_codec, audio_codec
  ));

  let recommended_width = specs["recommendedResolution"]["width"]
    .as_u64()
    .unwrap_or(1920);
  let recommended_height = specs["recommendedResolution"]["height"]
    .as_u64()
    .unwrap_or(1080);
  recommendations.push(format!(
    "Установите разрешение {}x{}",
    recommended_width, recommended_height
  ));

  recommendations
}
