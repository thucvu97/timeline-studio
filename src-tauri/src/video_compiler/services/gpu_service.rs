//! Сервис работы с GPU

use crate::video_compiler::{
  core::{
    error::{Result, VideoCompilerError},
    gpu::{GpuDetector, GpuEncoder, GpuInfo},
  },
  services::Service,
};
use async_trait::async_trait;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Возможности GPU
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct GpuCapabilities {
  pub available_encoders: Vec<GpuEncoder>,
  pub gpu_info: Vec<GpuInfo>,
  pub hardware_acceleration_available: bool,
  pub recommended_encoder: Option<GpuEncoder>,
}

/// Результат бенчмарка GPU
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct GpuBenchmarkResult {
  pub encoder: GpuEncoder,
  pub encoding_speed: f64,   // кадров в секунду
  pub quality_score: f64,    // от 0 до 100
  pub power_efficiency: f64, // от 0 до 100
}

/// Трейт для сервиса GPU
#[async_trait]
#[allow(dead_code)]
pub trait GpuService: Service + Send + Sync {
  /// Обнаружить доступные GPU
  async fn detect_gpus(&self) -> Result<Vec<GpuInfo>>;

  /// Получить возможности GPU
  async fn get_capabilities(&self) -> Result<GpuCapabilities>;

  /// Проверить поддержку аппаратного ускорения
  async fn check_hardware_acceleration(&self) -> Result<bool>;

  /// Провести бенчмарк GPU
  async fn benchmark_gpu(&self, encoder: GpuEncoder) -> Result<GpuBenchmarkResult>;

  /// Получить рекомендуемый кодировщик
  async fn get_recommended_encoder(&self) -> Result<Option<GpuEncoder>>;

  /// Обновить информацию о GPU
  async fn refresh_gpu_info(&self) -> Result<()>;
}

/// Реализация сервиса GPU
pub struct GpuServiceImpl {
  ffmpeg_path: String,
  gpu_info_cache: Arc<RwLock<Option<Vec<GpuInfo>>>>,
  capabilities_cache: Arc<RwLock<Option<GpuCapabilities>>>,
}

impl GpuServiceImpl {
  pub fn new(ffmpeg_path: String) -> Self {
    Self {
      ffmpeg_path,
      gpu_info_cache: Arc::new(RwLock::new(None)),
      capabilities_cache: Arc::new(RwLock::new(None)),
    }
  }

  /// Провести тестовое кодирование для бенчмарка
  async fn run_encoding_benchmark(&self, encoder: GpuEncoder) -> Result<(f64, f64)> {
    // Создаем временный тестовый файл
    let temp_dir = std::env::temp_dir();
    let test_output = temp_dir.join(format!("gpu_benchmark_{}.mp4", uuid::Uuid::new_v4()));

    // Параметры тестового видео
    let duration = 5.0;
    let resolution = "1920x1080";
    let fps = 30;

    // Формируем команду FFmpeg для генерации тестового видео
    let encoder_args = match encoder {
      GpuEncoder::None => vec!["-c:v", "libx264"],
      GpuEncoder::Nvenc => vec!["-c:v", "h264_nvenc"],
      GpuEncoder::QuickSync => vec!["-c:v", "h264_qsv"],
      GpuEncoder::Amf => vec!["-c:v", "h264_amf"],
      GpuEncoder::VideoToolbox => vec!["-c:v", "h264_videotoolbox"],
      GpuEncoder::Vaapi => vec!["-c:v", "h264_vaapi"],
      GpuEncoder::V4l2 => vec!["-c:v", "h264_v4l2m2m"],
      GpuEncoder::Software => vec!["-c:v", "libx264"],
    };

    let start_time = std::time::Instant::now();

    let output = tokio::process::Command::new(&self.ffmpeg_path)
      .args([
        "-f",
        "lavfi",
        "-i",
        &format!(
          "testsrc2=duration={}:size={}:rate={}",
          duration, resolution, fps
        ),
        "-pix_fmt",
        "yuv420p",
      ])
      .args(&encoder_args)
      .args(["-preset", "fast", "-y", test_output.to_str().unwrap()])
      .output()
      .await
      .map_err(|e| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: e.to_string(),
        command: "ffmpeg benchmark".to_string(),
      })?;

    let encoding_time = start_time.elapsed().as_secs_f64();

    // Удаляем временный файл
    let _ = tokio::fs::remove_file(&test_output).await;

    if !output.status.success() {
      return Err(VideoCompilerError::FFmpegError {
        exit_code: output.status.code(),
        stderr: String::from_utf8_lossy(&output.stderr).to_string(),
        command: "ffmpeg benchmark".to_string(),
      });
    }

    // Рассчитываем скорость кодирования
    let total_frames = duration * fps as f64;
    let encoding_speed = total_frames / encoding_time;

    // Простая оценка качества на основе типа кодировщика
    let quality_score = match encoder {
      GpuEncoder::None | GpuEncoder::Software => 100.0,
      GpuEncoder::Nvenc | GpuEncoder::QuickSync => 95.0,
      GpuEncoder::Amf | GpuEncoder::VideoToolbox => 93.0,
      GpuEncoder::Vaapi | GpuEncoder::V4l2 => 90.0,
    };

    Ok((encoding_speed, quality_score))
  }
}

#[async_trait]
impl Service for GpuServiceImpl {
  async fn initialize(&self) -> Result<()> {
    log::info!("Инициализация сервиса GPU");

    // Сразу пытаемся обнаружить GPU
    self.refresh_gpu_info().await?;

    Ok(())
  }

  async fn health_check(&self) -> Result<()> {
    // Проверяем доступность FFmpeg
    let output = tokio::process::Command::new(&self.ffmpeg_path)
      .arg("-version")
      .output()
      .await
      .map_err(|e| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: e.to_string(),
        command: "ffmpeg -version".to_string(),
      })?;

    if !output.status.success() {
      return Err(VideoCompilerError::FFmpegError {
        exit_code: output.status.code(),
        stderr: "FFmpeg недоступен".to_string(),
        command: "ffmpeg -version".to_string(),
      });
    }

    Ok(())
  }

  async fn shutdown(&self) -> Result<()> {
    log::info!("Остановка сервиса GPU");
    Ok(())
  }
}

#[async_trait]
impl GpuService for GpuServiceImpl {
  async fn detect_gpus(&self) -> Result<Vec<GpuInfo>> {
    // Проверяем кэш
    {
      let cache = self.gpu_info_cache.read().await;
      if let Some(info) = cache.as_ref() {
        return Ok(info.clone());
      }
    }

    // Если кэш пуст, обнаруживаем GPU
    let detector = GpuDetector::new(self.ffmpeg_path.clone());
    let gpu_info = detector.detect_gpus().await?;

    // Сохраняем в кэш
    {
      let mut cache = self.gpu_info_cache.write().await;
      *cache = Some(gpu_info.clone());
    }

    Ok(gpu_info)
  }

  async fn get_capabilities(&self) -> Result<GpuCapabilities> {
    // Проверяем кэш
    {
      let cache = self.capabilities_cache.read().await;
      if let Some(caps) = cache.as_ref() {
        return Ok(caps.clone());
      }
    }

    // Обнаруживаем возможности
    let detector = GpuDetector::new(self.ffmpeg_path.clone());
    let available_encoders = detector.detect_available_encoders().await?;
    let gpu_info = self.detect_gpus().await?;

    let hardware_acceleration_available = !available_encoders.is_empty()
      && available_encoders
        .iter()
        .any(|e| !matches!(e, GpuEncoder::Software));

    // Определяем рекомендуемый кодировщик
    let recommended_encoder = if available_encoders.contains(&GpuEncoder::Nvenc) {
      Some(GpuEncoder::Nvenc)
    } else if available_encoders.contains(&GpuEncoder::QuickSync) {
      Some(GpuEncoder::QuickSync)
    } else if available_encoders.contains(&GpuEncoder::VideoToolbox) {
      Some(GpuEncoder::VideoToolbox)
    } else if available_encoders.contains(&GpuEncoder::Amf) {
      Some(GpuEncoder::Amf)
    } else if available_encoders.contains(&GpuEncoder::Vaapi) {
      Some(GpuEncoder::Vaapi)
    } else {
      None
    };

    let capabilities = GpuCapabilities {
      available_encoders,
      gpu_info,
      hardware_acceleration_available,
      recommended_encoder,
    };

    // Сохраняем в кэш
    {
      let mut cache = self.capabilities_cache.write().await;
      *cache = Some(capabilities.clone());
    }

    Ok(capabilities)
  }

  async fn check_hardware_acceleration(&self) -> Result<bool> {
    let caps = self.get_capabilities().await?;
    Ok(caps.hardware_acceleration_available)
  }

  async fn benchmark_gpu(&self, encoder: GpuEncoder) -> Result<GpuBenchmarkResult> {
    log::info!("Запуск бенчмарка GPU для {:?}", encoder);

    let (encoding_speed, quality_score) = self.run_encoding_benchmark(encoder.clone()).await?;

    // Оценка энергоэффективности (упрощенная)
    let power_efficiency = match encoder {
      GpuEncoder::None | GpuEncoder::Software => 20.0,
      GpuEncoder::Nvenc | GpuEncoder::QuickSync => 90.0,
      GpuEncoder::Amf | GpuEncoder::VideoToolbox => 85.0,
      GpuEncoder::Vaapi | GpuEncoder::V4l2 => 80.0,
    };

    Ok(GpuBenchmarkResult {
      encoder,
      encoding_speed,
      quality_score,
      power_efficiency,
    })
  }

  async fn get_recommended_encoder(&self) -> Result<Option<GpuEncoder>> {
    let caps = self.get_capabilities().await?;
    Ok(caps.recommended_encoder)
  }

  async fn refresh_gpu_info(&self) -> Result<()> {
    log::info!("Обновление информации о GPU");

    // Очищаем кэши
    {
      let mut gpu_cache = self.gpu_info_cache.write().await;
      *gpu_cache = None;

      let mut caps_cache = self.capabilities_cache.write().await;
      *caps_cache = None;
    }

    // Заново обнаруживаем GPU
    self.detect_gpus().await?;
    self.get_capabilities().await?;

    Ok(())
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_gpu_service_creation() {
    let service = GpuServiceImpl::new("ffmpeg".to_string());
    assert!(service.initialize().await.is_ok());
  }

  #[tokio::test]
  async fn test_encoder_detection() {
    let service = GpuServiceImpl::new("ffmpeg".to_string());

    // Тест может провалиться если FFmpeg не установлен
    match service.get_capabilities().await {
      Ok(caps) => {
        // Должен быть хотя бы software encoder
        assert!(!caps.available_encoders.is_empty());
      }
      Err(_) => {
        // FFmpeg не установлен, пропускаем тест
      }
    }
  }
}
