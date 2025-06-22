//! FFmpeg Builder - Модуль конфигурации выходных параметров

use std::path::Path;
use tokio::process::Command;

use crate::video_compiler::error::Result;
use crate::video_compiler::schema::{OutputFormat, ProjectSchema};

use super::builder::{quality_to_crf, FFmpegBuilderSettings};

/// Построитель выходных параметров
pub struct OutputBuilder<'a> {
  project: &'a ProjectSchema,
  settings: &'a FFmpegBuilderSettings,
}

impl<'a> OutputBuilder<'a> {
  /// Создать новый построитель выходных параметров
  pub fn new(project: &'a ProjectSchema, settings: &'a FFmpegBuilderSettings) -> Self {
    Self { project, settings }
  }

  /// Добавить настройки вывода
  pub async fn add_output_settings(&self, cmd: &mut Command, output_path: &Path) -> Result<()> {
    // Добавляем аппаратное ускорение если включено
    if self.settings.use_hardware_acceleration {
      self.add_hardware_acceleration(cmd).await?;
    } else {
      self.add_cpu_encoding(cmd)?;
    }

    // Добавляем настройки формата
    self.add_format_settings(cmd)?;

    // Добавляем настройки битрейта
    self.add_bitrate_settings(cmd)?;

    // Добавляем настройки аудио
    self.add_audio_settings(cmd)?;

    // Добавляем расширенные настройки кодирования
    self.add_advanced_encoding_settings(cmd)?;

    // Длительность вывода
    if self.project.settings.output.duration > 0.0 {
      cmd.args(["-t", &self.project.settings.output.duration.to_string()]);
    }

    // Метаданные
    self.add_metadata(cmd)?;

    // Выходной файл
    cmd.arg(output_path);

    Ok(())
  }

  /// Добавить настройки для пререндера
  pub async fn add_prerender_settings(&self, cmd: &mut Command, output_path: &Path) -> Result<()> {
    // Для пререндера используем промежуточный кодек с высоким качеством
    cmd.args(["-c:v", "prores_ks"]);
    cmd.args(["-profile:v", "3"]); // ProRes 422 HQ
    cmd.args(["-c:a", "pcm_s16le"]); // Несжатое аудио

    // Сохраняем разрешение и частоту кадров
    cmd.args([
      "-s",
      &format!(
        "{}x{}",
        self.project.settings.resolution.width, self.project.settings.resolution.height
      ),
    ]);
    cmd.args(["-r", &self.project.settings.frame_rate.to_string()]);

    // Выходной файл
    cmd.arg(output_path);

    Ok(())
  }

  /// Добавить аппаратное ускорение
  async fn add_hardware_acceleration(&self, cmd: &mut Command) -> Result<()> {
    use crate::video_compiler::core::gpu::{GpuEncoder, GpuHelper};

    let hw_type = self
      .settings
      .hardware_acceleration_type
      .as_deref()
      .unwrap_or("auto");

    let encoder = match hw_type {
      "nvidia" | "nvenc" => GpuEncoder::Nvenc,
      "amd" | "amf" => GpuEncoder::Amf,
      "intel" | "qsv" => GpuEncoder::QuickSync,
      "apple" | "videotoolbox" => GpuEncoder::VideoToolbox,
      "vaapi" => GpuEncoder::Vaapi,
      _ => GpuEncoder::Software,
    };

    let quality = self.project.settings.export.quality;
    let params = GpuHelper::get_ffmpeg_params(&encoder, quality);

    for param in params {
      cmd.arg(param);
    }

    if encoder == GpuEncoder::Software {
      // Fallback к CPU кодированию
      self.add_cpu_encoding(cmd)?;
    }

    Ok(())
  }

  /// Добавить CPU кодирование
  fn add_cpu_encoding(&self, cmd: &mut Command) -> Result<()> {
    match self.project.settings.output.format {
      OutputFormat::Mp4 => {
        cmd.args(["-c:v", "libx264"]);
        cmd.args(["-preset", &self.get_preset()]);
        cmd.args(["-tune", "film"]);
      }
      OutputFormat::WebM => {
        cmd.args(["-c:v", "libvpx-vp9"]);
        cmd.args(["-cpu-used", "2"]);
        cmd.args(["-row-mt", "1"]);
      }
      OutputFormat::Mov => {
        cmd.args(["-c:v", "libx264"]);
        cmd.args(["-preset", &self.get_preset()]);
      }
      OutputFormat::Avi => {
        cmd.args(["-c:v", "libx264"]);
      }
      OutputFormat::Mkv => {
        cmd.args(["-c:v", "libx265"]);
        cmd.args(["-preset", &self.get_preset()]);
      }
      OutputFormat::Gif => {
        cmd.args(["-c:v", "gif"]);
        cmd.args(["-filter:v", "fps=10,scale=320:-1:flags=lanczos"]);
      }
      OutputFormat::Custom(ref format) => {
        // Для пользовательского формата используем libx264 по умолчанию
        cmd.args(["-c:v", "libx264"]);
        cmd.args(["-f", format]);
      }
    }

    Ok(())
  }

  /// Добавить настройки формата
  fn add_format_settings(&self, cmd: &mut Command) -> Result<()> {
    match self.project.settings.output.format {
      OutputFormat::Mp4 => {
        cmd.args(["-f", "mp4"]);
        cmd.args(["-movflags", "+faststart"]); // Оптимизация для веб
      }
      OutputFormat::WebM => {
        cmd.args(["-f", "webm"]);
      }
      OutputFormat::Mov => {
        cmd.args(["-f", "mov"]);
      }
      OutputFormat::Avi => {
        cmd.args(["-f", "avi"]);
      }
      OutputFormat::Mkv => {
        cmd.args(["-f", "matroska"]);
      }
      OutputFormat::Gif => {
        cmd.args(["-f", "gif"]);
      }
      OutputFormat::Custom(ref format) => {
        cmd.args(["-f", format]);
      }
    }

    // Разрешение
    cmd.args([
      "-s",
      &format!(
        "{}x{}",
        self.project.settings.resolution.width, self.project.settings.resolution.height
      ),
    ]);

    // Частота кадров
    cmd.args(["-r", &self.project.settings.frame_rate.to_string()]);

    // Соотношение сторон
    let aspect_ratio = self.project.settings.aspect_ratio.to_ffmpeg_string();
    cmd.args(["-aspect", &aspect_ratio]);

    Ok(())
  }

  /// Добавить настройки битрейта
  fn add_bitrate_settings(&self, cmd: &mut Command) -> Result<()> {
    let quality = self.project.settings.output.quality;

    // Видео битрейт
    if let Some(video_bitrate) = self.project.settings.output.video_bitrate {
      // Использовать заданный битрейт
      cmd.args(["-b:v", &format!("{}k", video_bitrate)]);

      // Добавляем буфер для VBR
      let bufsize = video_bitrate * 2;
      cmd.args(["-bufsize", &format!("{}k", bufsize)]);

      // Максимальный битрейт
      let maxrate = (video_bitrate as f64 * 1.5) as u32;
      cmd.args(["-maxrate", &format!("{}k", maxrate)]);
    } else {
      // Использовать CRF для качества
      let crf = quality_to_crf(quality);

      match self.project.settings.output.format {
        OutputFormat::Mp4 | OutputFormat::Mov => {
          cmd.args(["-crf", &crf.to_string()]);
        }
        OutputFormat::WebM => {
          cmd.args(["-b:v", "0"]); // VBR mode
          cmd.args(["-crf", &crf.to_string()]);
        }
        OutputFormat::Mkv => {
          // Для MKV используем CRF независимо от кодека
          cmd.args(["-crf", &crf.to_string()]);
        }
        OutputFormat::Gif => {
          // Для GIF используем битрейт
          let default_bitrate = self.calculate_default_bitrate();
          cmd.args(["-b:v", &format!("{}k", default_bitrate)]);
        }
        OutputFormat::Avi | OutputFormat::Custom(_) => {
          // Для других форматов используем битрейт по умолчанию
          let default_bitrate = self.calculate_default_bitrate();
          cmd.args(["-b:v", &format!("{}k", default_bitrate)]);
        }
      }
    }

    Ok(())
  }

  /// Добавить настройки аудио
  fn add_audio_settings(&self, cmd: &mut Command) -> Result<()> {
    // Аудио кодек
    match self.project.settings.output.format {
      OutputFormat::Mp4 | OutputFormat::Mov => {
        cmd.args(["-c:a", "aac"]);
        cmd.args(["-profile:a", "aac_low"]);
      }
      OutputFormat::WebM => {
        cmd.args(["-c:a", "libopus"]);
      }
      OutputFormat::Avi => {
        cmd.args(["-c:a", "mp3"]);
      }
      OutputFormat::Mkv => {
        cmd.args(["-c:a", "aac"]);
      }
      OutputFormat::Gif => {
        // GIF не поддерживает аудио
        cmd.args(["-an"]);
        return Ok(());
      }
      OutputFormat::Custom(_) => {
        // Для пользовательского формата используем AAC по умолчанию
        cmd.args(["-c:a", "aac"]);
      }
    }

    // Аудио битрейт
    let audio_bitrate = self.project.settings.output.audio_bitrate.unwrap_or(192);
    cmd.args(["-b:a", &format!("{}k", audio_bitrate)]);

    // Частота дискретизации
    cmd.args(["-ar", "48000"]);

    // Количество каналов
    cmd.args(["-ac", "2"]);

    Ok(())
  }

  /// Добавить расширенные настройки кодирования
  fn add_advanced_encoding_settings(&self, cmd: &mut Command) -> Result<()> {
    // Пиксельный формат
    cmd.args(["-pix_fmt", "yuv420p"]);

    // Настройки для H.264
    // Проверяем используемый кодек по формату (упрощенная логика)
    let using_h264 = matches!(
      self.project.settings.output.format,
      OutputFormat::Mp4 | OutputFormat::Mov | OutputFormat::Avi
    );

    if using_h264 {
      // Профиль
      cmd.args(["-profile:v", "high"]);

      // Уровень
      cmd.args(["-level", "4.2"]);

      // Настройки GOP
      let gop_size = (self.project.settings.frame_rate * 2.0) as i32;
      cmd.args(["-g", &gop_size.to_string()]);

      // B-кадры
      cmd.args(["-bf", "2"]);

      // Адаптивные B-кадры
      cmd.args(["-b_strategy", "1"]);

      // Деблокинг
      cmd.args(["-flags", "+loop"]);
      cmd.args(["-deblock", "0:0"]);
    }

    // Настройки для H.265
    // Проверяем используемый кодек по формату (упрощенная логика)
    let using_h265 = matches!(self.project.settings.output.format, OutputFormat::Mkv);

    if using_h265 {
      cmd.args(["-profile:v", "main"]);
      cmd.args(["-level", "4.1"]);
      cmd.args([
        "-x265-params",
        "keyint=48:min-keyint=24:bframes=3:b-adapt=2",
      ]);
    }

    // Многопоточность
    cmd.args(["-threads", "0"]); // Автоматический выбор

    Ok(())
  }

  /// Добавить метаданные
  fn add_metadata(&self, cmd: &mut Command) -> Result<()> {
    // Название проекта
    if !self.project.metadata.name.is_empty() {
      cmd.args([
        "-metadata",
        &format!("title={}", self.project.metadata.name),
      ]);
    }

    // Автор
    if let Some(ref author) = self.project.metadata.author {
      if !author.is_empty() {
        cmd.args(["-metadata", &format!("artist={}", author)]);
      }
    }

    // Дата создания
    cmd.args([
      "-metadata",
      &format!("creation_time={}", self.project.metadata.created_at),
    ]);

    // Кодировщик
    cmd.args(["-metadata", "encoder=Timeline Studio"]);

    Ok(())
  }

  /// Получить пресет для кодирования
  fn get_preset(&self) -> String {
    match self.project.settings.output.quality {
      q if q >= 80 => "slow",
      q if q >= 60 => "medium",
      q if q >= 40 => "fast",
      _ => "faster",
    }
    .to_string()
  }

  /// Рассчитать битрейт по умолчанию
  fn calculate_default_bitrate(&self) -> u32 {
    let pixels = self.project.settings.resolution.width * self.project.settings.resolution.height;
    let fps = self.project.settings.frame_rate;
    let quality = self.project.settings.output.quality as f64 / 100.0;

    // Базовая формула: битрейт = пиксели * FPS * множитель качества / 1000
    let base_bitrate = (pixels as f64 * fps * 0.07 * quality) as u32;

    // Ограничиваем диапазон
    base_bitrate.clamp(1000, 50000)
  }
}
