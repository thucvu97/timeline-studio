/*!
 * GPU ускорение для Video Compiler
 *
 * Этот модуль отвечает за:
 * - Автоматическое определение доступных GPU кодировщиков
 * - Выбор оптимального кодировщика для каждой платформы
 * - Мониторинг использования GPU во время рендеринга
 * - Fallback на CPU кодирование при недоступности GPU
 */

use crate::video_compiler::error::{Result, VideoCompilerError};
use serde::{Deserialize, Serialize};

/// Типы GPU кодировщиков
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum GpuEncoder {
  /// Нет GPU ускорения (CPU only)
  None,
  /// NVIDIA NVENC
  Nvenc,
  /// Intel QuickSync Video
  QuickSync,
  /// Video Acceleration API (Linux)
  Vaapi,
  /// Apple VideoToolbox (macOS)
  VideoToolbox,
  /// AMD Advanced Media Framework
  AMF,
}

impl GpuEncoder {
  /// Получить название FFmpeg кодека для H.264
  pub fn h264_codec_name(&self) -> &'static str {
    match self {
      GpuEncoder::None => "libx264",
      GpuEncoder::Nvenc => "h264_nvenc",
      GpuEncoder::QuickSync => "h264_qsv",
      GpuEncoder::Vaapi => "h264_vaapi",
      GpuEncoder::VideoToolbox => "h264_videotoolbox",
      GpuEncoder::AMF => "h264_amf",
    }
  }

  /// Получить название FFmpeg кодека для H.265/HEVC
  pub fn hevc_codec_name(&self) -> &'static str {
    match self {
      GpuEncoder::None => "libx265",
      GpuEncoder::Nvenc => "hevc_nvenc",
      GpuEncoder::QuickSync => "hevc_qsv",
      GpuEncoder::Vaapi => "hevc_vaapi",
      GpuEncoder::VideoToolbox => "hevc_videotoolbox",
      GpuEncoder::AMF => "hevc_amf",
    }
  }

  /// Проверить, является ли кодировщик аппаратным
  pub fn is_hardware(&self) -> bool {
    !matches!(self, GpuEncoder::None)
  }
}

/// Информация о GPU
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuInfo {
  pub name: String,
  pub driver_version: Option<String>,
  pub memory_total: Option<u64>,
  pub memory_used: Option<u64>,
  pub utilization: Option<f32>,
  pub encoder_type: GpuEncoder,
  pub supported_codecs: Vec<String>,
}

/// Возможности GPU системы
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GpuCapabilities {
  pub available_encoders: Vec<GpuEncoder>,
  pub recommended_encoder: Option<GpuEncoder>,
  pub current_gpu: Option<GpuInfo>,
  pub hardware_acceleration_supported: bool,
}

/// Детектор GPU возможностей
pub struct GpuDetector {
  ffmpeg_path: String,
}

impl GpuDetector {
  pub fn new(ffmpeg_path: String) -> Self {
    Self { ffmpeg_path }
  }

  /// Определить все доступные GPU кодировщики
  pub async fn detect_available_encoders(&self) -> Result<Vec<GpuEncoder>> {
    let mut available = Vec::new();

    // Проверяем каждый тип кодировщика
    let encoders_to_check = [
      (GpuEncoder::Nvenc, "h264_nvenc"),
      (GpuEncoder::QuickSync, "h264_qsv"),
      (GpuEncoder::Vaapi, "h264_vaapi"),
      (GpuEncoder::VideoToolbox, "h264_videotoolbox"),
      (GpuEncoder::AMF, "h264_amf"),
    ];

    for (encoder_type, codec_name) in encoders_to_check {
      if self.check_encoder_available(codec_name).await? {
        available.push(encoder_type);
      }
    }

    Ok(available)
  }

  /// Проверить доступность конкретного кодировщика
  async fn check_encoder_available(&self, codec: &str) -> Result<bool> {
    let output = tokio::process::Command::new(&self.ffmpeg_path)
      .args(["-encoders"])
      .output()
      .await
      .map_err(|e| VideoCompilerError::Io(format!("Failed to run ffmpeg: {}", e)))?;

    if output.status.success() {
      let stdout = String::from_utf8_lossy(&output.stdout);
      Ok(stdout.contains(codec))
    } else {
      Ok(false)
    }
  }

  /// Получить рекомендуемый кодировщик для текущей платформы
  pub async fn get_recommended_encoder(&self) -> Result<Option<GpuEncoder>> {
    let available = self.detect_available_encoders().await?;

    if available.is_empty() {
      return Ok(None);
    }

    // Приоритет кодировщиков по платформам
    #[cfg(target_os = "windows")]
    let priority = [GpuEncoder::Nvenc, GpuEncoder::QuickSync, GpuEncoder::AMF];

    #[cfg(target_os = "linux")]
    let priority = [GpuEncoder::Nvenc, GpuEncoder::Vaapi, GpuEncoder::QuickSync];

    #[cfg(target_os = "macos")]
    let priority = [GpuEncoder::VideoToolbox, GpuEncoder::Nvenc];

    #[cfg(not(any(target_os = "windows", target_os = "linux", target_os = "macos")))]
    let priority = [GpuEncoder::Nvenc];

    // Находим первый доступный из приоритетного списка
    for preferred in &priority {
      if available.contains(preferred) {
        return Ok(Some(preferred.clone()));
      }
    }

    // Если ни один приоритетный не найден, берем первый доступный
    Ok(available.first().cloned())
  }

  /// Получить полную информацию о возможностях GPU
  pub async fn get_gpu_capabilities(&self) -> Result<GpuCapabilities> {
    let available_encoders = self.detect_available_encoders().await?;
    let recommended_encoder = self.get_recommended_encoder().await?;
    let current_gpu = self.get_current_gpu_info().await.ok();

    Ok(GpuCapabilities {
      available_encoders: available_encoders.clone(),
      recommended_encoder,
      current_gpu,
      hardware_acceleration_supported: !available_encoders.is_empty(),
    })
  }

  /// Получить информацию о текущем GPU
  async fn get_current_gpu_info(&self) -> Result<GpuInfo> {
    // Пытаемся определить тип GPU и получить информацию

    #[cfg(target_os = "windows")]
    {
      if let Ok(info) = self.get_nvidia_info_windows().await {
        return Ok(info);
      }
      if let Ok(info) = self.get_intel_info_windows().await {
        return Ok(info);
      }
      if let Ok(info) = self.get_amd_info_windows().await {
        return Ok(info);
      }
    }

    #[cfg(target_os = "linux")]
    {
      if let Ok(info) = self.get_nvidia_info_linux().await {
        return Ok(info);
      }
      if let Ok(info) = self.get_gpu_info_linux().await {
        return Ok(info);
      }
    }

    #[cfg(target_os = "macos")]
    {
      if let Ok(info) = self.get_gpu_info_macos().await {
        return Ok(info);
      }
    }

    // Fallback: создаем базовую информацию
    Ok(GpuInfo {
      name: "Unknown GPU".to_string(),
      driver_version: None,
      memory_total: None,
      memory_used: None,
      utilization: None,
      encoder_type: GpuEncoder::None,
      supported_codecs: vec!["libx264".to_string()],
    })
  }

  /// Получить информацию о NVIDIA GPU (Windows)
  #[cfg(target_os = "windows")]
  async fn get_nvidia_info_windows(&self) -> Result<GpuInfo> {
    let output = tokio::process::Command::new("nvidia-smi")
      .args([
        "--query-gpu=name,driver_version,memory.total,memory.used,utilization.gpu",
        "--format=csv,noheader,nounits",
      ])
      .output()
      .await
      .map_err(|e| VideoCompilerError::Io(format!("Failed to run nvidia-smi: {}", e)))?;

    if !output.status.success() {
      return Err(VideoCompilerError::gpu("nvidia-smi failed"));
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let line = stdout
      .lines()
      .next()
      .ok_or_else(|| VideoCompilerError::gpu("No GPU data from nvidia-smi"))?;

    let parts: Vec<&str> = line.split(", ").collect();
    if parts.len() >= 5 {
      Ok(GpuInfo {
        name: parts[0].trim().to_string(),
        driver_version: Some(parts[1].trim().to_string()),
        memory_total: parts[2].trim().parse::<u64>().ok().map(|m| m * 1024 * 1024),
        memory_used: parts[3].trim().parse::<u64>().ok().map(|m| m * 1024 * 1024),
        utilization: parts[4].trim().parse().ok(),
        encoder_type: GpuEncoder::Nvenc,
        supported_codecs: vec!["h264_nvenc".to_string(), "hevc_nvenc".to_string()],
      })
    } else {
      Err(VideoCompilerError::gpu("Invalid nvidia-smi output format"))
    }
  }

  /// Получить информацию о NVIDIA GPU (Linux)
  #[cfg(target_os = "linux")]
  async fn get_nvidia_info_linux(&self) -> Result<GpuInfo> {
    // Аналогично Windows версии
    self.get_nvidia_info_windows().await
  }

  /// Получить информацию о Intel GPU (Windows)
  #[cfg(target_os = "windows")]
  async fn get_intel_info_windows(&self) -> Result<GpuInfo> {
    // Для Intel можно использовать WMI или другие системные API
    // Пока простая заглушка
    Ok(GpuInfo {
      name: "Intel Graphics".to_string(),
      driver_version: None,
      memory_total: None,
      memory_used: None,
      utilization: None,
      encoder_type: GpuEncoder::QuickSync,
      supported_codecs: vec!["h264_qsv".to_string(), "hevc_qsv".to_string()],
    })
  }

  /// Получить информацию о AMD GPU (Windows)
  #[cfg(target_os = "windows")]
  async fn get_amd_info_windows(&self) -> Result<GpuInfo> {
    Ok(GpuInfo {
      name: "AMD Graphics".to_string(),
      driver_version: None,
      memory_total: None,
      memory_used: None,
      utilization: None,
      encoder_type: GpuEncoder::AMF,
      supported_codecs: vec!["h264_amf".to_string(), "hevc_amf".to_string()],
    })
  }

  /// Получить информацию о GPU (Linux через /sys)
  #[cfg(target_os = "linux")]
  async fn get_gpu_info_linux(&self) -> Result<GpuInfo> {
    // Читаем информацию из /sys/class/drm
    use tokio::fs;

    let drm_cards = fs::read_dir("/sys/class/drm")
      .await
      .map_err(|e| VideoCompilerError::Io(format!("Failed to read /sys/class/drm: {}", e)))?;

    // Ищем первую видеокарту
    // Это упрощенная реализация, можно расширить
    Ok(GpuInfo {
      name: "Linux GPU".to_string(),
      driver_version: None,
      memory_total: None,
      memory_used: None,
      utilization: None,
      encoder_type: GpuEncoder::Vaapi,
      supported_codecs: vec!["h264_vaapi".to_string()],
    })
  }

  /// Получить информацию о GPU (macOS)
  #[cfg(target_os = "macos")]
  async fn get_gpu_info_macos(&self) -> Result<GpuInfo> {
    // Используем system_profiler для получения информации
    let output = tokio::process::Command::new("system_profiler")
      .args(["SPDisplaysDataType", "-json"])
      .output()
      .await
      .map_err(|e| VideoCompilerError::Io(format!("Failed to run system_profiler: {}", e)))?;

    if output.status.success() {
      // Парсим JSON вывод system_profiler
      // Упрощенная реализация
      Ok(GpuInfo {
        name: "macOS GPU".to_string(),
        driver_version: None,
        memory_total: None,
        memory_used: None,
        utilization: None,
        encoder_type: GpuEncoder::VideoToolbox,
        supported_codecs: vec![
          "h264_videotoolbox".to_string(),
          "hevc_videotoolbox".to_string(),
        ],
      })
    } else {
      Err(VideoCompilerError::gpu("system_profiler failed"))
    }
  }
}

/// Помощник для выбора GPU параметров
pub struct GpuHelper;

impl GpuHelper {
  /// Получить параметры FFmpeg для конкретного GPU кодировщика
  pub fn get_ffmpeg_params(encoder: &GpuEncoder, quality: u8) -> Vec<String> {
    match encoder {
      GpuEncoder::None => Self::get_cpu_params(quality),
      GpuEncoder::Nvenc => Self::get_nvenc_params(quality),
      GpuEncoder::QuickSync => Self::get_quicksync_params(quality),
      GpuEncoder::Vaapi => Self::get_vaapi_params(quality),
      GpuEncoder::VideoToolbox => Self::get_videotoolbox_params(quality),
      GpuEncoder::AMF => Self::get_amf_params(quality),
    }
  }

  /// Параметры для CPU кодирования
  fn get_cpu_params(quality: u8) -> Vec<String> {
    let preset = match quality {
      0..=30 => "ultrafast",
      31..=50 => "superfast",
      51..=70 => "fast",
      71..=85 => "medium",
      86..=95 => "slow",
      _ => "slower",
    };

    vec![
      "-preset".to_string(),
      preset.to_string(),
      "-crf".to_string(),
      Self::quality_to_crf(quality).to_string(),
    ]
  }

  /// Параметры для NVIDIA NVENC
  fn get_nvenc_params(quality: u8) -> Vec<String> {
    let preset = match quality {
      0..=40 => "p1", // Fastest
      41..=60 => "p2",
      61..=75 => "p3",
      76..=85 => "p4", // Balanced
      86..=90 => "p5",
      91..=95 => "p6",
      _ => "p7", // Slowest/Best quality
    };

    vec![
      "-preset".to_string(),
      preset.to_string(),
      "-tune".to_string(),
      "hq".to_string(),
      "-rc".to_string(),
      "vbr".to_string(),
      "-cq".to_string(),
      Self::quality_to_nvenc_cq(quality).to_string(),
      "-rc-lookahead".to_string(),
      "20".to_string(),
      "-spatial_aq".to_string(),
      "1".to_string(),
      "-temporal_aq".to_string(),
      "1".to_string(),
    ]
  }

  /// Параметры для Intel QuickSync
  fn get_quicksync_params(quality: u8) -> Vec<String> {
    let preset = match quality {
      0..=50 => "veryfast",
      51..=75 => "fast",
      76..=85 => "medium",
      _ => "slow",
    };

    vec![
      "-preset".to_string(),
      preset.to_string(),
      "-global_quality".to_string(),
      Self::quality_to_qsv_quality(quality).to_string(),
      "-look_ahead".to_string(),
      "1".to_string(),
      "-look_ahead_depth".to_string(),
      "20".to_string(),
    ]
  }

  /// Параметры для VAAPI
  fn get_vaapi_params(quality: u8) -> Vec<String> {
    vec![
      "-vaapi_device".to_string(),
      "/dev/dri/renderD128".to_string(),
      "-vf".to_string(),
      "format=nv12,hwupload".to_string(),
      "-rc_mode".to_string(),
      "VBR".to_string(),
      "-quality".to_string(),
      Self::quality_to_vaapi_quality(quality).to_string(),
    ]
  }

  /// Параметры для VideoToolbox
  fn get_videotoolbox_params(quality: u8) -> Vec<String> {
    vec![
      "-profile:v".to_string(),
      "high".to_string(),
      "-level".to_string(),
      "4.1".to_string(),
      "-q:v".to_string(),
      Self::quality_to_videotoolbox_quality(quality).to_string(),
      "-allow_sw".to_string(),
      "1".to_string(),
    ]
  }

  /// Параметры для AMD AMF
  fn get_amf_params(quality: u8) -> Vec<String> {
    vec![
      "-usage".to_string(),
      "transcoding".to_string(),
      "-quality".to_string(),
      "balanced".to_string(),
      "-rc".to_string(),
      "vbr_peak".to_string(),
      "-qp_i".to_string(),
      Self::quality_to_amf_qp(quality).to_string(),
    ]
  }

  /// Конвертация качества (0-100) в CRF (0-51)
  fn quality_to_crf(quality: u8) -> u8 {
    // Инвертируем: высокое качество = низкий CRF
    51 - (quality as f32 * 0.51) as u8
  }

  /// Конвертация качества в NVENC CQ параметр
  fn quality_to_nvenc_cq(quality: u8) -> u8 {
    // NVENC CQ: 0-51, где 0 = лучшее качество
    51 - (quality as f32 * 0.51) as u8
  }

  /// Конвертация качества в QuickSync quality
  fn quality_to_qsv_quality(quality: u8) -> u8 {
    // QSV качество обычно 1-51
    51 - (quality as f32 * 0.5) as u8
  }

  /// Конвертация качества в VAAPI quality
  fn quality_to_vaapi_quality(quality: u8) -> u8 {
    // VAAPI качество 1-8, где 1 = лучшее
    8 - (quality as f32 * 0.07) as u8
  }

  /// Конвертация качества в VideoToolbox quality
  fn quality_to_videotoolbox_quality(quality: u8) -> u8 {
    // VideoToolbox q:v 1-100
    quality.max(1)
  }

  /// Конвертация качества в AMF QP
  fn quality_to_amf_qp(quality: u8) -> u8 {
    // AMF QP 0-51
    51 - (quality as f32 * 0.51) as u8
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_gpu_encoder_codec_names() {
    assert_eq!(GpuEncoder::Nvenc.h264_codec_name(), "h264_nvenc");
    assert_eq!(GpuEncoder::QuickSync.h264_codec_name(), "h264_qsv");
    assert_eq!(GpuEncoder::None.h264_codec_name(), "libx264");
  }

  #[tokio::test]
  async fn test_quality_conversion() {
    // Тест конвертации качества в CRF
    assert_eq!(GpuHelper::quality_to_crf(100), 0); // Лучшее качество
    assert_eq!(GpuHelper::quality_to_crf(0), 51); // Худшее качество
    assert_eq!(GpuHelper::quality_to_crf(50), 26); // Среднее качество
  }

  #[tokio::test]
  async fn test_gpu_params_generation() {
    let params = GpuHelper::get_ffmpeg_params(&GpuEncoder::Nvenc, 85);
    assert!(params.contains(&"-preset".to_string()));
    assert!(params.contains(&"p4".to_string()));
  }
}
