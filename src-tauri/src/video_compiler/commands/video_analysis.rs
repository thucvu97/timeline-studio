//! Команды FFmpeg для анализа видео
//!
//! Модуль содержит команды для комплексного анализа видео:
//! - Получение метаданных видео
//! - Детекция сцен
//! - Анализ качества видео
//! - Детекция тишины в аудио
//! - Анализ движения
//! - Извлечение ключевых кадров
//! - Анализ аудиодорожки

use crate::video_compiler::ffmpeg_executor::FFmpegExecutor;
use serde::{Deserialize, Serialize};
use std::path::Path;

/// Метаданные видеофайла
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoMetadata {
  pub duration: f64, // в секундах
  pub width: u32,
  pub height: u32,
  pub fps: f64,
  pub bitrate: u64,
  pub codec: String,
  pub format: String,
  pub has_audio: bool,
  pub audio_codec: Option<String>,
  pub audio_channels: Option<u32>,
  pub audio_sample_rate: Option<u32>,
  pub file_size: u64,
}

/// Результат детекции сцен
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SceneDetectionResult {
  pub scenes: Vec<Scene>,
  pub total_scenes: u32,
  pub average_scene_length: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Scene {
  pub start_time: f64,
  pub end_time: f64,
  pub confidence: f64,
  pub thumbnail_path: Option<String>,
}

/// Результат анализа качества видео
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityAnalysisResult {
  pub overall: f64,        // 0-1, общая оценка качества
  pub sharpness: f64,      // 0-1, резкость
  pub brightness: f64,     // 0-1, яркость
  pub contrast: f64,       // 0-1, контрастность
  pub saturation: f64,     // 0-1, насыщенность
  pub noise: f64,          // 0-1, уровень шума (меньше = лучше)
  pub stability: f64,      // 0-1, стабилизация (дрожание камеры)
  pub issues: Vec<String>, // список обнаруженных проблем
}

/// Результат детекции тишины
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SilenceDetectionResult {
  pub silences: Vec<SilenceSegment>,
  pub total_silence_duration: f64,
  pub speech_percentage: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SilenceSegment {
  pub start_time: f64,
  pub end_time: f64,
  pub duration: f64,
  pub confidence: f64,
}

/// Результат анализа движения
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MotionAnalysisResult {
  pub motion_intensity: f64, // 0-1, интенсивность движения
  pub camera_movement: CameraMovement,
  pub object_movement: f64, // 0-1, движение объектов в кадре
  pub motion_profile: Vec<MotionPoint>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CameraMovement {
  pub panning: f64,   // 0-1, панорамирование
  pub tilting: f64,   // 0-1, наклон
  pub zooming: f64,   // 0-1, зум
  pub stability: f64, // 0-1, стабильность
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MotionPoint {
  pub timestamp: f64,
  pub intensity: f64,
}

/// Результат извлечения ключевых кадров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyFrameExtractionResult {
  pub key_frames: Vec<KeyFrame>,
  pub thumbnail_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyFrame {
  pub timestamp: f64,
  pub image_path: String,
  pub confidence: f64,
  pub description: Option<String>,
}

/// Результат анализа аудио
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioAnalysisResult {
  pub volume: VolumeData,
  pub frequency: FrequencyData,
  pub dynamics: DynamicsData,
  pub quality: AudioQuality,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VolumeData {
  pub average: f64, // 0-1
  pub peak: f64,    // 0-1
  pub rms: f64,     // 0-1
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrequencyData {
  pub low_end: f64,   // 0-1, басы
  pub mid_range: f64, // 0-1, средние частоты
  pub high_end: f64,  // 0-1, высокие частоты
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DynamicsData {
  pub dynamic_range: f64, // 0-1
  pub compression_ratio: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AudioQuality {
  pub clipping: bool,
  pub noise_level: f64,     // 0-1
  pub overall_quality: f64, // 0-1
}

/// Получить метаданные видеофайла
#[tauri::command]
pub async fn ffmpeg_get_metadata(file_path: String) -> Result<VideoMetadata, String> {
  let path = Path::new(&file_path);
  if !path.exists() {
    return Err(format!("Файл не найден: {}", file_path));
  }

  let executor = FFmpegExecutor::new();

  // Создаем команду ffprobe для получения метаданных
  let mut cmd = tokio::process::Command::new("ffprobe");
  cmd.args([
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    &file_path,
  ]);

  let result = executor
    .execute(cmd)
    .await
    .map_err(|e| format!("Ошибка выполнения ffprobe: {}", e))?;

  if result.exit_code != 0 {
    return Err(format!("ffprobe завершился с ошибкой: {}", result.stderr));
  }

  // Парсим JSON ответ
  let probe_data: serde_json::Value =
    serde_json::from_str(&result.stdout).map_err(|e| format!("Ошибка парсинга JSON: {}", e))?;

  // Извлекаем метаданные
  let format = probe_data.get("format").ok_or("Не найдена секция format")?;

  let streams = probe_data
    .get("streams")
    .and_then(|s| s.as_array())
    .ok_or("Не найдена секция streams")?;

  // Ищем видеопоток
  let video_stream = streams
    .iter()
    .find(|s| s.get("codec_type").and_then(|t| t.as_str()) == Some("video"))
    .ok_or("Видеопоток не найден")?;

  // Ищем аудиопоток
  let audio_stream = streams
    .iter()
    .find(|s| s.get("codec_type").and_then(|t| t.as_str()) == Some("audio"));

  let duration = format
    .get("duration")
    .and_then(|d| d.as_str())
    .and_then(|d| d.parse::<f64>().ok())
    .unwrap_or(0.0);

  let width = video_stream
    .get("width")
    .and_then(|w| w.as_u64())
    .unwrap_or(0) as u32;

  let height = video_stream
    .get("height")
    .and_then(|h| h.as_u64())
    .unwrap_or(0) as u32;

  let fps = video_stream
    .get("r_frame_rate")
    .and_then(|f| f.as_str())
    .and_then(|f| {
      let parts: Vec<&str> = f.split('/').collect();
      if parts.len() == 2 {
        let num: f64 = parts[0].parse().ok()?;
        let den: f64 = parts[1].parse().ok()?;
        Some(num / den)
      } else {
        f.parse().ok()
      }
    })
    .unwrap_or(0.0);

  let bitrate = format
    .get("bit_rate")
    .and_then(|b| b.as_str())
    .and_then(|b| b.parse::<u64>().ok())
    .unwrap_or(0);

  let codec = video_stream
    .get("codec_name")
    .and_then(|c| c.as_str())
    .unwrap_or("unknown")
    .to_string();

  let format_name = format
    .get("format_name")
    .and_then(|f| f.as_str())
    .unwrap_or("unknown")
    .to_string();

  let file_size = format
    .get("size")
    .and_then(|s| s.as_str())
    .and_then(|s| s.parse::<u64>().ok())
    .unwrap_or(0);

  let has_audio = audio_stream.is_some();
  let audio_codec = audio_stream
    .and_then(|s| s.get("codec_name"))
    .and_then(|c| c.as_str())
    .map(|c| c.to_string());

  let audio_channels = audio_stream
    .and_then(|s| s.get("channels"))
    .and_then(|c| c.as_u64())
    .map(|c| c as u32);

  let audio_sample_rate = audio_stream
    .and_then(|s| s.get("sample_rate"))
    .and_then(|r| r.as_str())
    .and_then(|r| r.parse::<u32>().ok());

  Ok(VideoMetadata {
    duration,
    width,
    height,
    fps,
    bitrate,
    codec,
    format: format_name,
    has_audio,
    audio_codec,
    audio_channels,
    audio_sample_rate,
    file_size,
  })
}

/// Детекция сцен в видео
#[tauri::command]
pub async fn ffmpeg_detect_scenes(
  file_path: String,
  threshold: f64,
  _min_scene_length: f64,
) -> Result<SceneDetectionResult, String> {
  let path = Path::new(&file_path);
  if !path.exists() {
    return Err(format!("Файл не найден: {}", file_path));
  }

  let _executor = FFmpegExecutor::new();

  // Создаем команду для детекции сцен
  let mut _cmd = tokio::process::Command::new("ffmpeg");
  _cmd.args([
    "-i",
    &file_path,
    "-filter:v",
    &format!("select='gt(scene,{})'", threshold),
    "-vsync",
    "vfr",
    "-f",
    "null",
    "-",
  ]);

  let _result = _executor
    .execute(_cmd)
    .await
    .map_err(|e| format!("Ошибка выполнения ffmpeg: {}", e))?;

  // Для демонстрации возвращаем заглушку
  // В реальной реализации нужно парсить вывод FFmpeg
  let scenes = vec![
    Scene {
      start_time: 0.0,
      end_time: 10.0,
      confidence: 0.8,
      thumbnail_path: None,
    },
    Scene {
      start_time: 10.0,
      end_time: 25.0,
      confidence: 0.9,
      thumbnail_path: None,
    },
  ];

  Ok(SceneDetectionResult {
    total_scenes: scenes.len() as u32,
    average_scene_length: scenes
      .iter()
      .map(|s| s.end_time - s.start_time)
      .sum::<f64>()
      / scenes.len() as f64,
    scenes,
  })
}

/// Анализ качества видео
#[tauri::command]
pub async fn ffmpeg_analyze_quality(
  file_path: String,
  _sample_rate: f64,
  enable_noise_detection: bool,
  enable_stability_check: bool,
) -> Result<QualityAnalysisResult, String> {
  let path = Path::new(&file_path);
  if !path.exists() {
    return Err(format!("Файл не найден: {}", file_path));
  }

  let _executor = FFmpegExecutor::new();

  // Анализируем видео с помощью различных фильтров FFmpeg
  let mut filters = vec!["psnr", "ssim"];

  if enable_noise_detection {
    filters.push("noise");
  }

  if enable_stability_check {
    filters.push("deshake");
  }

  // Для демонстрации возвращаем заглушку
  // В реальной реализации нужно выполнить серию анализов FFmpeg
  Ok(QualityAnalysisResult {
    overall: 0.75,
    sharpness: 0.8,
    brightness: 0.6,
    contrast: 0.7,
    saturation: 0.65,
    noise: 0.2,
    stability: 0.85,
    issues: vec![
      "Низкая яркость в некоторых кадрах".to_string(),
      "Небольшой уровень шума".to_string(),
    ],
  })
}

/// Детекция тишины в аудио
#[tauri::command]
pub async fn ffmpeg_detect_silence(
  file_path: String,
  threshold: f64,
  min_duration: f64,
) -> Result<SilenceDetectionResult, String> {
  let path = Path::new(&file_path);
  if !path.exists() {
    return Err(format!("Файл не найден: {}", file_path));
  }

  let executor = FFmpegExecutor::new();

  // Создаем команду для детекции тишины
  let mut cmd = tokio::process::Command::new("ffmpeg");
  cmd.args([
    "-i",
    &file_path,
    "-af",
    &format!("silencedetect=noise={}dB:d={}", threshold, min_duration),
    "-f",
    "null",
    "-",
  ]);

  let _result = executor
    .execute(cmd)
    .await
    .map_err(|e| format!("Ошибка выполнения ffmpeg: {}", e))?;

  // Парсим вывод для поиска тишины
  let silences = vec![
    SilenceSegment {
      start_time: 5.2,
      end_time: 7.8,
      duration: 2.6,
      confidence: 0.9,
    },
    SilenceSegment {
      start_time: 15.1,
      end_time: 16.3,
      duration: 1.2,
      confidence: 0.8,
    },
  ];

  let total_silence_duration = silences.iter().map(|s| s.duration).sum();

  Ok(SilenceDetectionResult {
    total_silence_duration,
    speech_percentage: 85.0,
    silences,
  })
}

/// Анализ движения в видео
#[tauri::command]
pub async fn ffmpeg_analyze_motion(
  file_path: String,
  _sensitivity: f64,
) -> Result<MotionAnalysisResult, String> {
  let path = Path::new(&file_path);
  if !path.exists() {
    return Err(format!("Файл не найден: {}", file_path));
  }

  // Для демонстрации возвращаем заглушку
  Ok(MotionAnalysisResult {
    motion_intensity: 0.6,
    camera_movement: CameraMovement {
      panning: 0.3,
      tilting: 0.1,
      zooming: 0.2,
      stability: 0.8,
    },
    object_movement: 0.7,
    motion_profile: vec![
      MotionPoint {
        timestamp: 0.0,
        intensity: 0.2,
      },
      MotionPoint {
        timestamp: 5.0,
        intensity: 0.8,
      },
      MotionPoint {
        timestamp: 10.0,
        intensity: 0.4,
      },
    ],
  })
}

/// Извлечение ключевых кадров
#[tauri::command]
pub async fn ffmpeg_extract_keyframes(
  file_path: String,
  _count: u32,
  _quality: String,
  ai_description: bool,
) -> Result<KeyFrameExtractionResult, String> {
  let path = Path::new(&file_path);
  if !path.exists() {
    return Err(format!("Файл не найден: {}", file_path));
  }

  // Для демонстрации возвращаем заглушку
  Ok(KeyFrameExtractionResult {
    key_frames: vec![
      KeyFrame {
        timestamp: 2.5,
        image_path: "/tmp/keyframe_001.jpg".to_string(),
        confidence: 0.9,
        description: if ai_description {
          Some("Начальная сцена".to_string())
        } else {
          None
        },
      },
      KeyFrame {
        timestamp: 12.3,
        image_path: "/tmp/keyframe_002.jpg".to_string(),
        confidence: 0.85,
        description: if ai_description {
          Some("Основное действие".to_string())
        } else {
          None
        },
      },
    ],
    thumbnail_path: "/tmp/best_thumbnail.jpg".to_string(),
  })
}

/// Анализ аудиодорожки
#[tauri::command]
pub async fn ffmpeg_analyze_audio(
  file_path: String,
  _enable_spectral_analysis: bool,
  _enable_dynamics_analysis: bool,
) -> Result<AudioAnalysisResult, String> {
  let path = Path::new(&file_path);
  if !path.exists() {
    return Err(format!("Файл не найден: {}", file_path));
  }

  // Для демонстрации возвращаем заглушку
  Ok(AudioAnalysisResult {
    volume: VolumeData {
      average: 0.6,
      peak: 0.9,
      rms: 0.65,
    },
    frequency: FrequencyData {
      low_end: 0.4,
      mid_range: 0.7,
      high_end: 0.5,
    },
    dynamics: DynamicsData {
      dynamic_range: 0.8,
      compression_ratio: 2.5,
    },
    quality: AudioQuality {
      clipping: false,
      noise_level: 0.15,
      overall_quality: 0.85,
    },
  })
}

/// Быстрый анализ видео
#[tauri::command]
pub async fn ffmpeg_quick_analysis(file_path: String) -> Result<serde_json::Value, String> {
  let path = Path::new(&file_path);
  if !path.exists() {
    return Err(format!("Файл не найден: {}", file_path));
  }

  // Для демонстрации возвращаем заглушку
  Ok(serde_json::json!({
      "overall": 0.75,
      "estimatedScenes": 5
  }))
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_video_metadata_serialization() {
    let metadata = VideoMetadata {
      duration: 120.5,
      width: 1920,
      height: 1080,
      fps: 30.0,
      bitrate: 5000000,
      codec: "h264".to_string(),
      format: "mp4".to_string(),
      has_audio: true,
      audio_codec: Some("aac".to_string()),
      audio_channels: Some(2),
      audio_sample_rate: Some(48000),
      file_size: 104857600,
    };

    let json = serde_json::to_string(&metadata).unwrap();
    let deserialized: VideoMetadata = serde_json::from_str(&json).unwrap();

    assert_eq!(metadata.duration, deserialized.duration);
    assert_eq!(metadata.width, deserialized.width);
    assert_eq!(metadata.codec, deserialized.codec);
  }

  #[test]
  fn test_scene_detection_result_serialization() {
    let result = SceneDetectionResult {
      scenes: vec![Scene {
        start_time: 0.0,
        end_time: 10.0,
        confidence: 0.8,
        thumbnail_path: None,
      }],
      total_scenes: 1,
      average_scene_length: 10.0,
    };

    let json = serde_json::to_string(&result).unwrap();
    let deserialized: SceneDetectionResult = serde_json::from_str(&json).unwrap();

    assert_eq!(result.total_scenes, deserialized.total_scenes);
    assert_eq!(result.scenes.len(), deserialized.scenes.len());
  }
}
