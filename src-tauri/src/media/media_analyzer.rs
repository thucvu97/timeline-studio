//! Media Analyzer - Анализ медиафайлов

use crate::media::types::MediaFile;
use serde::{Deserialize, Serialize};

/// Результат анализа медиафайла
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaAnalysis {
  pub file_info: MediaFile,
  pub quality_metrics: QualityMetrics,
  pub content_type: ContentType,
  pub recommendations: Vec<String>,
}

/// Метрики качества
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityMetrics {
  pub resolution: Option<(u32, u32)>,
  pub bitrate: Option<u64>,
  pub fps: Option<f64>,
  pub codec: Option<String>,
  pub quality_score: f32, // 0.0 - 1.0
}

/// Тип контента
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ContentType {
  Video {
    is_hdr: bool,
    has_audio: bool,
    aspect_ratio: String,
  },
  Image {
    has_transparency: bool,
    color_space: String,
  },
  Audio {
    channels: u8,
    sample_rate: u32,
  },
}

/// Анализатор медиафайлов
#[allow(dead_code)]
pub struct MediaAnalyzer;

impl MediaAnalyzer {
  /// Создает новый анализатор
  #[allow(dead_code)]
  pub fn new() -> Self {
    Self
  }

  /// Анализирует медиафайл
  #[allow(dead_code)]
  pub async fn analyze(&self, file_info: MediaFile) -> Result<MediaAnalysis, String> {
    let quality_metrics = self.calculate_quality_metrics(&file_info);
    let content_type = self.determine_content_type(&file_info);
    let recommendations = self.generate_recommendations(&file_info, &quality_metrics);

    Ok(MediaAnalysis {
      file_info,
      quality_metrics,
      content_type,
      recommendations,
    })
  }

  /// Вычисляет метрики качества
  #[allow(dead_code)]
  fn calculate_quality_metrics(&self, file_info: &MediaFile) -> QualityMetrics {
    let mut resolution = None;
    let mut bitrate = None;
    let mut fps = None;
    let mut codec = None;

    // Извлекаем информацию из потоков
    if let Some(video_stream) = file_info
      .probe_data
      .streams
      .iter()
      .find(|s| s.codec_type == "video")
    {
      resolution = Some((
        video_stream.width.unwrap_or(0),
        video_stream.height.unwrap_or(0),
      ));

      if let Some(fps_str) = &video_stream.r_frame_rate {
        if let Some(fps_val) = Self::parse_frame_rate(fps_str) {
          fps = Some(fps_val);
        }
      }

      codec = video_stream.codec_name.clone();

      if let Some(br) = video_stream
        .bit_rate
        .as_ref()
        .and_then(|b| b.parse::<u64>().ok())
      {
        bitrate = Some(br);
      }
    }

    // Если bitrate не найден в потоке, берем из format
    if bitrate.is_none() {
      bitrate = file_info
        .probe_data
        .format
        .bit_rate
        .as_ref()
        .and_then(|b| b.parse::<u64>().ok());
    }

    let quality_score = self.calculate_quality_score(&resolution, &bitrate, &fps);

    QualityMetrics {
      resolution,
      bitrate,
      fps,
      codec,
      quality_score,
    }
  }

  /// Определяет тип контента
  #[allow(dead_code)]
  fn determine_content_type(&self, file_info: &MediaFile) -> ContentType {
    if file_info.is_video {
      let has_audio = file_info
        .probe_data
        .streams
        .iter()
        .any(|s| s.codec_type == "audio");

      let video_stream = file_info
        .probe_data
        .streams
        .iter()
        .find(|s| s.codec_type == "video");

      let aspect_ratio = if let Some(stream) = video_stream {
        if let (Some(w), Some(h)) = (stream.width, stream.height) {
          format!("{w}:{h}")
        } else {
          "unknown".to_string()
        }
      } else {
        "unknown".to_string()
      };

      ContentType::Video {
        is_hdr: self.detect_hdr_content(file_info), // Детекция HDR из метаданных
        has_audio,
        aspect_ratio,
      }
    } else if file_info.is_image {
      ContentType::Image {
        has_transparency: self.detect_image_transparency(file_info), // Детекция прозрачности
        color_space: self.detect_color_space(file_info), // Детекция цветового пространства
      }
    } else if file_info.is_audio {
      let audio_stream = file_info
        .probe_data
        .streams
        .iter()
        .find(|s| s.codec_type == "audio");

      let channels = audio_stream.and_then(|s| s.channels).unwrap_or(2);

      let sample_rate = audio_stream
        .and_then(|s| s.sample_rate.as_ref())
        .and_then(|r| r.parse::<u32>().ok())
        .unwrap_or(44100);

      ContentType::Audio {
        channels,
        sample_rate,
      }
    } else {
      // Fallback
      ContentType::Video {
        is_hdr: false,
        has_audio: false,
        aspect_ratio: "unknown".to_string(),
      }
    }
  }

  /// Генерирует рекомендации
  #[allow(dead_code)]
  fn generate_recommendations(
    &self,
    file_info: &MediaFile,
    metrics: &QualityMetrics,
  ) -> Vec<String> {
    let mut recommendations = Vec::new();

    // Рекомендации по разрешению
    if let Some((width, height)) = metrics.resolution {
      if width < 1280 || height < 720 {
        recommendations
          .push("Consider upgrading to HD resolution (1280x720) or higher".to_string());
      }
    }

    // Рекомендации по битрейту
    if let Some(bitrate) = metrics.bitrate {
      if file_info.is_video && bitrate < 1_000_000 {
        recommendations
          .push("Video bitrate is low, consider re-encoding with higher quality".to_string());
      }
    }

    // Рекомендации по FPS
    if let Some(fps) = metrics.fps {
      if fps < 24.0 {
        recommendations.push("Frame rate is below 24 fps, video may appear choppy".to_string());
      }
    }

    // Рекомендации по кодеку
    if let Some(codec) = &metrics.codec {
      if codec != "h264" && codec != "hevc" {
        recommendations.push(format!(
          "Consider using H.264 or H.265 codec instead of {codec}"
        ));
      }
    }

    recommendations
  }

  /// Вычисляет оценку качества
  #[allow(dead_code)]
  fn calculate_quality_score(
    &self,
    resolution: &Option<(u32, u32)>,
    bitrate: &Option<u64>,
    fps: &Option<f64>,
  ) -> f32 {
    let mut score = 0.0;
    let mut total_weight = 0.0;

    // Оценка разрешения
    if let Some((width, height)) = resolution {
      let pixels = (*width as f32) * (*height as f32);
      let resolution_score = (pixels / (3840.0 * 2160.0)).min(1.0); // 4K as reference
      score += resolution_score * 0.4;
      total_weight += 0.4;
    }

    // Оценка битрейта
    if let Some(br) = bitrate {
      let bitrate_score = (*br as f32 / 10_000_000.0).min(1.0); // 10 Mbps as reference
      score += bitrate_score * 0.3;
      total_weight += 0.3;
    }

    // Оценка FPS
    if let Some(f) = fps {
      let fps_score = ((*f as f32) / 60.0).min(1.0); // 60 fps as reference
      score += fps_score * 0.3;
      total_weight += 0.3;
    }

    if total_weight > 0.0 {
      score / total_weight
    } else {
      0.5 // Default middle score
    }
  }

  /// Парсит frame rate из строки вида "30/1"
  #[allow(dead_code)]
  fn parse_frame_rate(fps_str: &str) -> Option<f64> {
    if fps_str.contains('/') {
      let parts: Vec<&str> = fps_str.split('/').collect();
      if parts.len() == 2 {
        if let (Ok(num), Ok(den)) = (parts[0].parse::<f64>(), parts[1].parse::<f64>()) {
          if den > 0.0 {
            return Some(num / den);
          }
        }
      }
    } else if let Ok(fps) = fps_str.parse::<f64>() {
      return Some(fps);
    }
    None
  }
  /// Детекция HDR контента из метаданных FFmpeg
  fn detect_hdr_content(&self, file_info: &MediaFile) -> bool {
    // Проверяем цветовое пространство и transfer characteristics
    let streams = &file_info.probe_data.streams;
    for stream in streams {
      // HDR обычно определяется по видеокодеку и битности
      // Проверяем кодек для HDR индикаторов

      // Проверяем по codec name
      if stream.codec_type == "video" {
        if let Some(codec_name) = &stream.codec_name {
          if codec_name.contains("hevc")
            || codec_name.contains("h265")
            || codec_name.contains("vp9")
          {
            // HDR обычно используется с HEVC/H.265 или VP9
            return true;
          }
        }
      }
    }

    false
  }

  /// Детекция прозрачности в изображениях
  fn detect_image_transparency(&self, file_info: &MediaFile) -> bool {
    // Проверяем формат файла - некоторые форматы поддерживают прозрачность
    if let Some(format_name) = &file_info.probe_data.format.format_name {
      if format_name.contains("png") || format_name.contains("webp") || format_name.contains("gif")
      {
        // PNG, WebP, GIF поддерживают прозрачность
        // Проверяем pixel format
        let streams = &file_info.probe_data.streams;
        for stream in streams {
          // Для изображений проверяем по расширению и типу
          // FFprobe не предоставляет pixel format в нашей структуре
          if stream.codec_type == "video"
            && stream
              .codec_name
              .as_ref()
              .is_some_and(|n| n.contains("png") || n.contains("webp"))
          {
            return true;
          }
        }
      }
    }

    false
  }

  /// Детекция цветового пространства
  fn detect_color_space(&self, file_info: &MediaFile) -> String {
    let streams = &file_info.probe_data.streams;
    for stream in streams {
      // Определяем цветовое пространство по типу кодека
      if stream.codec_type == "video" {
        if let Some(codec_name) = &stream.codec_name {
          // Большинство видеокодеков используют YUV
          if codec_name.contains("h264")
            || codec_name.contains("h265")
            || codec_name.contains("vp9")
          {
            return "YUV".to_string();
          }
        }
      }
    }

    // По умолчанию RGB для изображений
    "RGB".to_string()
  }
}

impl Default for MediaAnalyzer {
  fn default() -> Self {
    Self::new()
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_parse_frame_rate() {
    assert_eq!(MediaAnalyzer::parse_frame_rate("30/1"), Some(30.0));
    assert_eq!(
      MediaAnalyzer::parse_frame_rate("24000/1001"),
      Some(23.976023976023978)
    );
    assert_eq!(MediaAnalyzer::parse_frame_rate("25"), Some(25.0));
    assert_eq!(MediaAnalyzer::parse_frame_rate("invalid"), None);
  }

  #[test]
  fn test_quality_score_calculation() {
    let analyzer = MediaAnalyzer::new();

    // High quality
    let score = analyzer.calculate_quality_score(
      &Some((3840, 2160)), // 4K
      &Some(10_000_000),   // 10 Mbps
      &Some(60.0),         // 60 fps
    );
    assert!(score > 0.9);

    // Low quality
    let score = analyzer.calculate_quality_score(
      &Some((640, 480)), // SD
      &Some(500_000),    // 500 Kbps
      &Some(15.0),       // 15 fps
    );
    assert!(score < 0.3);
  }
}
