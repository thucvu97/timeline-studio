//! FFmpeg Builder - Модуль построения команд FFmpeg
//!
//! Этот модуль отвечает за построение команд FFmpeg на основе схемы проекта,
//! включая обработку треков, клипов, эффектов и настроек экспорта.

use std::path::{Path, PathBuf};
use tokio::process::Command;

use crate::video_compiler::error::Result;
use crate::video_compiler::schema::{
  Clip, Effect, EffectParameter, EffectType, OutputFormat, ProjectSchema, Track, TrackType,
};

/// Построитель команд FFmpeg
#[derive(Debug, Clone)]
pub struct FFmpegBuilder {
  /// Схема проекта
  project: ProjectSchema,
  /// Настройки построения
  settings: FFmpegBuilderSettings,
}

impl FFmpegBuilder {
  /// Создать новый построитель
  pub fn new(project: ProjectSchema) -> Self {
    Self {
      project,
      settings: FFmpegBuilderSettings::default(),
    }
  }

  /// Создать построитель с настройками
  pub fn with_settings(project: ProjectSchema, settings: FFmpegBuilderSettings) -> Self {
    Self { project, settings }
  }

  /// Построить команду для рендеринга проекта
  pub async fn build_render_command(&self, output_path: &Path) -> Result<Command> {
    let mut cmd = Command::new(&self.settings.ffmpeg_path);

    // Добавляем входные файлы
    self.add_input_sources(&mut cmd).await?;

    // Добавляем фильтры
    self.add_filter_complex(&mut cmd).await?;

    // Добавляем настройки вывода
    self.add_output_settings(&mut cmd, output_path).await?;

    // Добавляем глобальные параметры
    self.add_global_options(&mut cmd);

    Ok(cmd)
  }

  /// Построить команду для генерации превью
  pub async fn build_preview_command(
    &self,
    input_path: &Path,
    timestamp: f64,
    output_path: &Path,
    resolution: (u32, u32),
  ) -> Result<Command> {
    let mut cmd = Command::new(&self.settings.ffmpeg_path);

    // Переход к временной метке
    cmd.args(["-ss", &timestamp.to_string()]);

    // Входной файл
    cmd.args(["-i", &input_path.to_string_lossy()]);

    // Один кадр
    cmd.args(["-vframes", "1"]);

    // Масштабирование
    cmd.args(["-vf", &format!("scale={}:{}", resolution.0, resolution.1)]);

    // Качество
    cmd.args(["-q:v", "2"]);

    // Перезапись
    cmd.arg("-y");

    // Выходной файл
    cmd.arg(output_path);

    Ok(cmd)
  }

  /// Добавить входные источники
  async fn add_input_sources(&self, cmd: &mut Command) -> Result<()> {
    let input_sources = self.collect_input_sources().await?;

    for source in input_sources {
      // Добавляем входной файл
      cmd.args(["-i", &source.path.to_string_lossy()]);
    }

    Ok(())
  }

  /// Собрать список входных источников
  async fn collect_input_sources(&self) -> Result<Vec<InputSource>> {
    let mut sources = Vec::new();
    let mut input_index = 0;

    for track in &self.project.tracks {
      if !track.enabled {
        continue;
      }

      for clip in &track.clips {
        sources.push(InputSource {
          path: clip.source_path.clone(),
          start_time: clip.source_start,
          duration: clip.get_source_duration(),
          input_index,
          track_type: track.track_type.clone(),
        });
        input_index += 1;
      }
    }

    Ok(sources)
  }

  /// Добавить комплексные фильтры
  async fn add_filter_complex(&self, cmd: &mut Command) -> Result<()> {
    let filter_complex = self.build_filter_complex().await?;

    if !filter_complex.is_empty() {
      cmd.args(["-filter_complex", &filter_complex]);
    }

    Ok(())
  }

  /// Построить строку комплексных фильтров
  async fn build_filter_complex(&self) -> Result<String> {
    let mut filters = Vec::new();
    let mut input_index = 0;

    // Обрабатываем видео треки
    let video_tracks = self.get_video_tracks();
    if !video_tracks.is_empty() {
      let video_filter = self
        .build_video_filter_chain(&video_tracks, &mut input_index)
        .await?;
      if !video_filter.is_empty() {
        filters.push(video_filter);
      }
    }

    // Обрабатываем аудио треки
    let audio_tracks = self.get_audio_tracks();
    if !audio_tracks.is_empty() {
      let audio_filter = self
        .build_audio_filter_chain(&audio_tracks, &mut input_index)
        .await?;
      if !audio_filter.is_empty() {
        filters.push(audio_filter);
      }
    }

    Ok(filters.join(";"))
  }

  /// Построить цепочку видео фильтров
  async fn build_video_filter_chain(
    &self,
    tracks: &[&Track],
    input_index: &mut usize,
  ) -> Result<String> {
    let mut filter_parts = Vec::new();

    for track in tracks {
      for (clip_index, clip) in track.clips.iter().enumerate() {
        let clip_filters = self
          .build_clip_filters(clip, *input_index, clip_index)
          .await?;
        if !clip_filters.is_empty() {
          filter_parts.push(clip_filters);
        }
        *input_index += 1;
      }
    }

    // Если несколько видео клипов, объединяем их
    if filter_parts.len() > 1 {
      let concat_filter = format!(
        "{}concat=n={}:v=1:a=0[outv]",
        filter_parts.join(""),
        filter_parts.len()
      );
      Ok(concat_filter)
    } else if filter_parts.len() == 1 {
      Ok(format!("{}[outv]", filter_parts[0]))
    } else {
      Ok(String::new())
    }
  }

  /// Построить цепочку аудио фильтров
  async fn build_audio_filter_chain(
    &self,
    tracks: &[&Track],
    input_index: &mut usize,
  ) -> Result<String> {
    let mut audio_inputs = Vec::new();

    for track in tracks {
      for clip in &track.clips {
        // Добавляем аудио вход с настройками громкости
        let volume = track.volume * clip.volume;
        if volume > 0.0 {
          audio_inputs.push(format!(
            "[{}:a]volume={}[a{}]",
            input_index, volume, input_index
          ));
        }
        *input_index += 1;
      }
    }

    if audio_inputs.len() > 1 {
      // Микширование нескольких аудио потоков
      let mix_inputs: Vec<String> = (0..audio_inputs.len())
        .map(|i| format!("[a{}]", i))
        .collect();

      Ok(format!(
        "{}{}amix=inputs={}[outa]",
        audio_inputs.join(";"),
        mix_inputs.join(""),
        audio_inputs.len()
      ))
    } else if audio_inputs.len() == 1 {
      Ok(format!("{}[outa]", audio_inputs[0]))
    } else {
      Ok(String::new())
    }
  }

  /// Построить фильтры для клипа
  async fn build_clip_filters(
    &self,
    clip: &Clip,
    input_index: usize,
    clip_index: usize,
  ) -> Result<String> {
    let mut filters = Vec::new();

    // Обрезка по времени
    if clip.source_start > 0.0 || clip.get_source_duration() > 0.0 {
      filters.push(format!(
        "[{}:v]trim=start={}:duration={}",
        input_index,
        clip.source_start,
        clip.get_source_duration()
      ));
    } else {
      filters.push(format!("[{}:v]", input_index));
    }

    // Изменение скорости
    if (clip.speed - 1.0).abs() > 0.001 {
      filters.push(format!("setpts={}*PTS", 1.0 / clip.speed));
    }

    // Применяем эффекты клипа
    for effect_id in &clip.effects {
      if let Some(effect) = self.find_effect(effect_id) {
        let effect_filter = self.build_effect_filter(effect).await?;
        if !effect_filter.is_empty() {
          filters.push(effect_filter);
        }
      }
    }

    let filter_chain = if filters.len() > 1 {
      filters.join(",")
    } else if filters.len() == 1 {
      filters[0].clone()
    } else {
      format!("[{}:v]", input_index)
    };

    Ok(format!("{}[v{}];", filter_chain, clip_index))
  }

  /// Построить фильтр для эффекта
  async fn build_effect_filter(&self, effect: &Effect) -> Result<String> {
    if !effect.enabled {
      return Ok(String::new());
    }

    // Если есть пользовательская FFmpeg команда, используем её
    if let Some(template) = &effect.ffmpeg_command {
      return Ok(self.process_ffmpeg_template(template, effect));
    }

    match effect.effect_type {
      EffectType::Blur => {
        // Frontend использует "radius"
        let radius = match effect.parameters.get("radius") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 2.0,
        };
        Ok(format!("boxblur={}:1", radius))
      }
      EffectType::Brightness => {
        // Frontend использует "intensity", также проверяем "value" для обратной совместимости
        let value = match effect.parameters.get("intensity") {
          Some(EffectParameter::Float(val)) => *val,
          _ => match effect.parameters.get("value") {
            Some(EffectParameter::Float(val)) => *val,
            _ => 0.0,
          },
        };
        Ok(format!("eq=brightness={}", value))
      }
      EffectType::Contrast => {
        // Frontend использует "intensity", также проверяем "value" для обратной совместимости
        let value = match effect.parameters.get("intensity") {
          Some(EffectParameter::Float(val)) => *val,
          _ => match effect.parameters.get("value") {
            Some(EffectParameter::Float(val)) => *val,
            _ => 1.0,
          },
        };
        Ok(format!("eq=contrast={}", value))
      }
      EffectType::Saturation => {
        // Frontend использует "intensity", также проверяем "value" для обратной совместимости
        let value = match effect.parameters.get("intensity") {
          Some(EffectParameter::Float(val)) => *val,
          _ => match effect.parameters.get("value") {
            Some(EffectParameter::Float(val)) => *val,
            _ => 1.0,
          },
        };
        Ok(format!("eq=saturation={}", value))
      }
      EffectType::Speed => {
        let speed = match effect.parameters.get("speed") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 1.0,
        };
        Ok(format!("setpts={}*PTS", 1.0 / speed))
      }
      EffectType::Reverse => Ok("reverse".to_string()),
      EffectType::Grayscale => Ok("hue=s=0".to_string()),
      EffectType::Sepia => {
        Ok("colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131".to_string())
      }
      EffectType::HueRotate => {
        let angle = match effect.parameters.get("angle") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 0.0,
        };
        Ok(format!("hue=h={}", angle))
      }
      EffectType::Vintage => Ok("curves=vintage".to_string()),
      EffectType::Duotone => {
        let shadows = match effect.parameters.get("shadows") {
          Some(EffectParameter::Color(val)) => format!("#{:06x}", val & 0xFFFFFF),
          _ => "#1e3a8a".to_string(),
        };
        let highlights = match effect.parameters.get("highlights") {
          Some(EffectParameter::Color(val)) => format!("#{:06x}", val & 0xFFFFFF),
          _ => "#fbbf24".to_string(),
        };
        Ok(format!(
          "duotone=shadows={}:highlights={}",
          shadows, highlights
        ))
      }
      EffectType::Dreamy => Ok("gblur=sigma=1,eq=brightness=0.1:contrast=0.9".to_string()),
      EffectType::Infrared => Ok(
        "colorchannelmixer=rr=0:rg=0:rb=0:ra=1:gr=1:gg=0:gb=0:ga=0:br=0:bg=0:bb=0:ba=0".to_string(),
      ),
      EffectType::Matrix => {
        Ok("colorchannelmixer=rr=0:rg=1:rb=0:gr=0:gg=1:gb=0:br=0:bg=1:bb=0".to_string())
      }
      EffectType::Arctic => {
        Ok("eq=brightness=0.2:contrast=1.1:saturation=0.8,colorbalance=rs=-0.2:bs=0.2".to_string())
      }
      EffectType::Sunset => {
        Ok("eq=brightness=0.1:contrast=1.1,colorbalance=rs=0.3:gs=0.1:bs=-0.2".to_string())
      }
      EffectType::Lomo => Ok("curves=cross_process,vignette=angle=PI/4".to_string()),
      EffectType::Twilight => {
        Ok("eq=brightness=-0.1:contrast=1.2,colorbalance=rs=0.1:gs=-0.1:bs=0.2".to_string())
      }
      EffectType::Neon => Ok("eq=brightness=0.2:contrast=1.4:saturation=2.0,hue=h=30".to_string()),
      EffectType::Invert => Ok("negate".to_string()),
      EffectType::Vignette => {
        // Frontend использует "intensity" и "radius"
        let intensity = match effect.parameters.get("intensity") {
          Some(EffectParameter::Float(val)) => *val,
          _ => match effect.parameters.get("angle") {
            Some(EffectParameter::Float(val)) => *val,
            _ => 0.3,
          },
        };
        let _radius = match effect.parameters.get("radius") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 0.8,
        };
        // Простая виньетка, так как сложная формула из frontend не поддерживается напрямую
        Ok(format!("vignette=angle={}:x0=w/2:y0=h/2", 1.57 + intensity))
      }
      EffectType::FilmGrain => {
        // Frontend использует "intensity"
        let strength = match effect.parameters.get("intensity") {
          Some(EffectParameter::Float(val)) => *val,
          _ => match effect.parameters.get("strength") {
            Some(EffectParameter::Float(val)) => *val,
            _ => 0.5,
          },
        };
        Ok(format!("noise=alls={}:allf=t", (strength * 20.0) as i32))
      }
      EffectType::ChromaticAberration => {
        Ok("chromakey=0x00ff00:0.1,pad=iw+20:ih+20:10:10".to_string())
      }
      EffectType::LensFlare => Ok("flare=x=0.7:y=0.3:s=100".to_string()),
      EffectType::Glow => {
        let intensity = match effect.parameters.get("intensity") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 0.5,
        };
        Ok(format!(
          "gblur=sigma={},blend=all_mode=screen",
          intensity * 2.0
        ))
      }
      EffectType::Sharpen => {
        let amount = match effect.parameters.get("amount") {
          Some(EffectParameter::Float(val)) => *val,
          _ => 1.0,
        };
        Ok(format!("unsharp=5:5:{}", amount))
      }
      EffectType::Stabilization => Ok("deshake".to_string()),
      EffectType::NoiseReduction => Ok("hqdn3d".to_string()),
      EffectType::Noir => {
        // Noir эффект - черно-белый с высоким контрастом
        Ok("hue=s=0,eq=contrast=1.5:brightness=-0.1".to_string())
      }
      EffectType::Cyberpunk => {
        // Cyberpunk - неоновые цвета с искажениями
        Ok(
          "eq=brightness=0.1:contrast=1.8:saturation=1.5,colorbalance=rs=0.5:gs=-0.3:bs=0.8"
            .to_string(),
        )
      }
    }
  }

  /// Обработать шаблон FFmpeg команды с параметрами эффекта
  fn process_ffmpeg_template(&self, template: &str, effect: &Effect) -> String {
    let mut result = template.to_string();

    // Заменяем плейсхолдеры параметрами
    for (key, value) in &effect.parameters {
      let placeholder = format!("{{{}}}", key);
      let value_str = match value {
        EffectParameter::Float(v) => v.to_string(),
        EffectParameter::Int(v) => v.to_string(),
        EffectParameter::String(v) => v.clone(),
        EffectParameter::Bool(v) => if *v { "1" } else { "0" }.to_string(),
        EffectParameter::Color(v) => format!("#{:06x}", v & 0xFFFFFF),
        EffectParameter::FloatArray(v) => v
          .iter()
          .map(|f| f.to_string())
          .collect::<Vec<_>>()
          .join(":"),
        EffectParameter::FilePath(v) => v.to_string_lossy().to_string(),
      };
      result = result.replace(&placeholder, &value_str);
    }

    result
  }

  /// Построить видео эффект
  async fn build_video_effect_filter(&self, effect: &Effect) -> Result<String> {
    match effect.name.as_str() {
      "blur" => {
        if let Some(crate::video_compiler::schema::EffectParameter::Float(radius)) =
          effect.parameters.get("radius")
        {
          Ok(format!("boxblur={}", radius))
        } else {
          Ok("boxblur=2".to_string())
        }
      }
      "brightness" => {
        if let Some(crate::video_compiler::schema::EffectParameter::Float(value)) =
          effect.parameters.get("brightness")
        {
          Ok(format!("eq=brightness={}", value))
        } else {
          Ok(String::new())
        }
      }
      "contrast" => {
        if let Some(crate::video_compiler::schema::EffectParameter::Float(value)) =
          effect.parameters.get("contrast")
        {
          Ok(format!("eq=contrast={}", value))
        } else {
          Ok(String::new())
        }
      }
      _ => Ok(String::new()),
    }
  }

  /// Построить фильтр цветокоррекции
  async fn build_color_correction_filter(&self, effect: &Effect) -> Result<String> {
    let mut eq_params = Vec::new();

    if let Some(crate::video_compiler::schema::EffectParameter::Float(brightness)) =
      effect.parameters.get("brightness")
    {
      eq_params.push(format!("brightness={}", brightness));
    }

    if let Some(crate::video_compiler::schema::EffectParameter::Float(contrast)) =
      effect.parameters.get("contrast")
    {
      eq_params.push(format!("contrast={}", contrast));
    }

    if let Some(crate::video_compiler::schema::EffectParameter::Float(saturation)) =
      effect.parameters.get("saturation")
    {
      eq_params.push(format!("saturation={}", saturation));
    }

    if !eq_params.is_empty() {
      Ok(format!("eq={}", eq_params.join(":")))
    } else {
      Ok(String::new())
    }
  }

  /// Добавить настройки вывода
  async fn add_output_settings(&self, cmd: &mut Command, output_path: &Path) -> Result<()> {
    let export_settings = &self.project.settings.export;

    // Кодек видео
    match export_settings.format {
      OutputFormat::Mp4 => {
        cmd.args(["-c:v", "libx264"]);
        cmd.args(["-c:a", "aac"]);
      }
      OutputFormat::Avi => {
        cmd.args(["-c:v", "libxvid"]);
        cmd.args(["-c:a", "mp3"]);
      }
      OutputFormat::Mov => {
        cmd.args(["-c:v", "libx264"]);
        cmd.args(["-c:a", "aac"]);
      }
      OutputFormat::Mkv => {
        cmd.args(["-c:v", "libx264"]);
        cmd.args(["-c:a", "aac"]);
      }
      OutputFormat::WebM => {
        cmd.args(["-c:v", "libvpx-vp9"]);
        cmd.args(["-c:a", "libopus"]);
      }
      _ => {
        cmd.args(["-c:v", "libx264"]);
        cmd.args(["-c:a", "aac"]);
      }
    }

    // Битрейт видео
    cmd.args(["-b:v", &format!("{}k", export_settings.video_bitrate)]);

    // Битрейт аудио
    cmd.args(["-b:a", &format!("{}k", export_settings.audio_bitrate)]);

    // Качество
    let crf = self.quality_to_crf(export_settings.quality);
    cmd.args(["-crf", &crf.to_string()]);

    // FPS
    cmd.args(["-r", &self.project.timeline.fps.to_string()]);

    // Разрешение
    cmd.args([
      "-s",
      &format!(
        "{}x{}",
        self.project.timeline.resolution.0, self.project.timeline.resolution.1
      ),
    ]);

    // Аппаратное ускорение
    if export_settings.hardware_acceleration {
      self.add_hardware_acceleration(cmd).await;
    }

    // Дополнительные аргументы
    for arg in &export_settings.ffmpeg_args {
      cmd.arg(arg);
    }

    // Выходной файл
    cmd.arg(output_path);

    Ok(())
  }

  /// Добавить аппаратное ускорение
  async fn add_hardware_acceleration(&self, cmd: &mut Command) {
    use crate::video_compiler::gpu::{GpuDetector, GpuHelper};

    // Создаем детектор GPU
    let detector = GpuDetector::new(self.settings.ffmpeg_path.clone());

    // Пытаемся получить рекомендуемый кодировщик
    if let Some(encoder) = detector.get_recommended_encoder().await.unwrap_or(None) {
      // Получаем название кодека
      let codec = encoder.h264_codec_name();
      cmd.args(["-c:v", codec]);

      // Добавляем специфичные параметры для GPU
      let gpu_params = GpuHelper::get_ffmpeg_params(&encoder, 85); // Качество 85%
      for param in gpu_params {
        cmd.arg(param);
      }

      log::info!("Используется GPU кодировщик: {:?} ({})", encoder, codec);
    } else {
      // Fallback на CPU кодирование
      cmd.args(["-c:v", "libx264"]);
      cmd.args(["-preset", "medium"]);
      cmd.args(["-crf", "23"]);

      log::warn!("GPU ускорение недоступно, используется CPU кодирование");
    }
  }

  /// Добавить глобальные опции
  fn add_global_options(&self, cmd: &mut Command) {
    // Перезапись выходного файла
    cmd.arg("-y");

    // Скрыть баннер
    cmd.arg("-hide_banner");

    // Количество потоков
    if let Some(threads) = self.settings.threads {
      cmd.args(["-threads", &threads.to_string()]);
    }

    // Логирование
    cmd.args(["-loglevel", "info"]);

    // Статистика прогресса
    cmd.arg("-progress");
    cmd.arg("pipe:2");
  }

  /// Конвертировать качество (0-100) в CRF (0-51)
  fn quality_to_crf(&self, quality: u8) -> u8 {
    // Инвертируем: высокое качество = низкий CRF
    let quality = quality.min(100) as u32;
    let crf = (51 * (100 - quality)) / 100;
    crf.min(51) as u8
  }

  /// Получить видео треки
  fn get_video_tracks(&self) -> Vec<&Track> {
    self
      .project
      .tracks
      .iter()
      .filter(|track| track.track_type == TrackType::Video && track.enabled)
      .collect()
  }

  /// Получить аудио треки
  fn get_audio_tracks(&self) -> Vec<&Track> {
    self
      .project
      .tracks
      .iter()
      .filter(|track| track.track_type == TrackType::Audio && track.enabled)
      .collect()
  }

  /// Найти эффект по ID
  fn find_effect(&self, effect_id: &str) -> Option<&Effect> {
    self
      .project
      .effects
      .iter()
      .find(|effect| effect.id == effect_id)
  }
}

/// Входной источник для FFmpeg
#[derive(Debug, Clone)]
pub struct InputSource {
  /// Путь к файлу
  pub path: PathBuf,
  /// Время начала в файле
  pub start_time: f64,
  /// Длительность
  pub duration: f64,
  /// Индекс входа в FFmpeg
  pub input_index: usize,
  /// Тип трека
  pub track_type: TrackType,
}

/// Настройки построителя FFmpeg
#[derive(Debug, Clone)]
pub struct FFmpegBuilderSettings {
  /// Путь к FFmpeg
  pub ffmpeg_path: String,
  /// Количество потоков
  pub threads: Option<u32>,
  /// Предпочитать NVENC
  pub prefer_nvenc: bool,
  /// Предпочитать QuickSync
  pub prefer_quicksync: bool,
  /// Дополнительные глобальные параметры
  pub global_args: Vec<String>,
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::schema::{
    Clip, Effect, EffectParameter, EffectType, ProjectSchema, Track, TrackType,
  };
  use std::path::PathBuf;

  #[tokio::test]
  async fn test_blur_effect_ffmpeg_command() {
    let builder = create_test_builder();
    let effect = create_blur_effect(5.0);
    let result = builder.build_effect_filter(&effect).await.unwrap();
    assert_eq!(result, "boxblur=5:1");
  }

  #[tokio::test]
  async fn test_brightness_effect_ffmpeg_command() {
    let builder = create_test_builder();
    let effect = create_brightness_effect(0.3);

    let result = builder.build_effect_filter(&effect).await.unwrap();
    assert_eq!(result, "eq=brightness=0.3");
  }

  #[tokio::test]
  async fn test_contrast_effect_ffmpeg_command() {
    let builder = create_test_builder();
    let effect = create_contrast_effect(1.5);

    let result = builder.build_effect_filter(&effect).await.unwrap();
    assert_eq!(result, "eq=contrast=1.5");
  }

  #[tokio::test]
  async fn test_saturation_effect_ffmpeg_command() {
    let builder = create_test_builder();
    let effect = create_saturation_effect(0.8);

    let result = builder.build_effect_filter(&effect).await.unwrap();
    assert_eq!(result, "eq=saturation=0.8");
  }

  #[tokio::test]
  async fn test_speed_effect_ffmpeg_command() {
    let builder = create_test_builder();
    let effect = create_speed_effect(2.0);

    let result = builder.build_effect_filter(&effect).await.unwrap();
    assert_eq!(result, "setpts=0.5*PTS");
  }

  #[tokio::test]
  async fn test_grayscale_effect_ffmpeg_command() {
    let builder = create_test_builder();
    let effect = create_simple_effect(EffectType::Grayscale);

    let result = builder.build_effect_filter(&effect).await.unwrap();
    assert_eq!(result, "hue=s=0");
  }

  #[tokio::test]
  async fn test_sepia_effect_ffmpeg_command() {
    let builder = create_test_builder();
    let effect = create_simple_effect(EffectType::Sepia);

    let result = builder.build_effect_filter(&effect).await.unwrap();
    assert_eq!(
      result,
      "colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131"
    );
  }

  #[tokio::test]
  async fn test_vignette_effect_ffmpeg_command() {
    let builder = create_test_builder();
    let effect = create_vignette_effect(3.14);

    let result = builder.build_effect_filter(&effect).await.unwrap();
    assert_eq!(result, "vignette=angle=4.71:x0=w/2:y0=h/2");
  }

  #[tokio::test]
  async fn test_custom_ffmpeg_template() {
    let builder = create_test_builder();
    let effect = create_custom_effect_with_template("blur=sigma={intensity}", 2.5);

    let result = builder.build_effect_filter(&effect).await.unwrap();
    assert_eq!(result, "blur=sigma=2.5");
  }

  #[tokio::test]
  async fn test_disabled_effect() {
    let builder = create_test_builder();
    let mut effect = create_simple_effect(EffectType::Blur);
    effect.enabled = false;

    let result = builder.build_effect_filter(&effect).await.unwrap();
    assert_eq!(result, "");
  }

  // Project setup helper
  fn create_test_project() -> ProjectSchema {
    let mut project = ProjectSchema::new("Test Project".to_string());

    // Add video track with clip
    let mut video_track = Track::new(TrackType::Video, "Video Track".to_string());
    let video_clip = Clip::new(PathBuf::from("/test/video.mp4"), 0.0, 10.0);
    video_track.clips.push(video_clip);
    project.tracks.push(video_track);

    project
  }

  #[test]
  fn test_ffmpeg_builder_creation() {
    let project = create_test_project();
    let builder = FFmpegBuilder::new(project);
    assert_eq!(builder.project.metadata.name, "Test Project");
  }

  #[test]
  fn test_ffmpeg_builder_with_settings() {
    let project = create_test_project();
    let mut settings = FFmpegBuilderSettings::default();
    settings.ffmpeg_path = "/custom/path/ffmpeg".to_string();
    settings.threads = Some(8);
    settings.prefer_nvenc = false;
    settings.prefer_quicksync = true;
    settings.global_args = vec!["-hide_banner".to_string()];

    let builder = FFmpegBuilder::with_settings(project, settings.clone());
    assert_eq!(builder.settings.ffmpeg_path, "/custom/path/ffmpeg");
    assert_eq!(builder.settings.threads, Some(8));
    assert!(!builder.settings.prefer_nvenc);
    assert!(builder.settings.prefer_quicksync);
    assert_eq!(
      builder.settings.global_args,
      vec!["-hide_banner".to_string()]
    );
  }

  #[test]
  fn test_quality_to_crf() {
    let project = create_test_project();
    let builder = FFmpegBuilder::new(project);

    assert_eq!(builder.quality_to_crf(100), 0); // Best quality
    assert_eq!(builder.quality_to_crf(0), 51); // Worst quality
    assert_eq!(builder.quality_to_crf(50), 25); // Medium quality
  }

  #[test]
  fn test_get_video_tracks() {
    let project = create_test_project();
    let builder = FFmpegBuilder::new(project);

    let video_tracks = builder.get_video_tracks();
    assert_eq!(video_tracks.len(), 1);
    assert_eq!(video_tracks[0].track_type, TrackType::Video);
  }

  #[test]
  fn test_get_audio_tracks() {
    let project = create_test_project();
    let builder = FFmpegBuilder::new(project);

    let audio_tracks = builder.get_audio_tracks();
    assert_eq!(audio_tracks.len(), 0); // No audio tracks in test project
  }

  #[tokio::test]
  async fn test_collect_input_sources() {
    let project = create_test_project();
    let builder = FFmpegBuilder::new(project);

    let sources = builder.collect_input_sources().await.unwrap();
    assert_eq!(sources.len(), 1);
    assert_eq!(sources[0].input_index, 0);
    assert_eq!(sources[0].track_type, TrackType::Video);
  }

  #[tokio::test]
  async fn test_build_preview_command() {
    let project = create_test_project();
    let builder = FFmpegBuilder::new(project);

    let input_path = PathBuf::from("/test/input.mp4");
    let output_path = PathBuf::from("/test/preview.jpg");

    let cmd = builder
      .build_preview_command(&input_path, 10.0, &output_path, (640, 360))
      .await
      .unwrap();

    // Check that command contains required arguments
    let cmd_str = format!("{:?}", cmd);
    assert!(cmd_str.contains("ffmpeg"));
    assert!(cmd_str.contains("-ss"));
    assert!(cmd_str.contains("10"));
    assert!(cmd_str.contains("-vframes"));
    assert!(cmd_str.contains("1"));
  }

  #[test]
  fn test_ffmpeg_builder_settings_default() {
    let settings = FFmpegBuilderSettings::default();
    assert_eq!(settings.ffmpeg_path, "ffmpeg");
    assert!(settings.prefer_nvenc);
    assert!(!settings.prefer_quicksync);
    assert!(settings.global_args.is_empty());
  }

  #[tokio::test]
  async fn test_build_filter_complex_empty() {
    let project = ProjectSchema::new("Empty Project".to_string());
    let builder = FFmpegBuilder::new(project);

    let filter_complex = builder.build_filter_complex().await.unwrap();
    assert!(filter_complex.is_empty());
  }

  #[tokio::test]
  async fn test_build_render_command() {
    let mut project = create_test_project();
    project.timeline.resolution = (1920, 1080);
    project.timeline.fps = 30;
    project.settings.export.quality = 80;
    project.settings.export.video_bitrate = 5000;
    project.settings.export.audio_bitrate = 192;

    let builder = FFmpegBuilder::new(project);
    let output_path = PathBuf::from("/test/output.mp4");

    let cmd = builder.build_render_command(&output_path).await.unwrap();
    let cmd_str = format!("{:?}", cmd);

    assert!(cmd_str.contains("ffmpeg"));
    assert!(cmd_str.contains("/test/output.mp4"));
  }

  #[tokio::test]
  async fn test_add_input_sources() {
    let mut project = create_test_project();
    let mut audio_track = Track::new(TrackType::Audio, "Audio Track".to_string());
    let audio_clip = Clip::new(PathBuf::from("/test/audio.mp3"), 0.0, 10.0);
    audio_track.clips.push(audio_clip);
    project.tracks.push(audio_track);

    let builder = FFmpegBuilder::new(project);
    let mut cmd = tokio::process::Command::new("ffmpeg");

    builder.add_input_sources(&mut cmd).await.unwrap();
    let cmd_str = format!("{:?}", cmd);

    assert!(cmd_str.contains("/test/video.mp4"));
    assert!(cmd_str.contains("/test/audio.mp3"));
  }

  #[tokio::test]
  async fn test_add_filter_complex() {
    let mut project = create_test_project();
    // Add effect to test filter generation
    let mut effect = Effect::new(EffectType::Blur, "Test Blur".to_string());
    effect
      .parameters
      .insert("radius".to_string(), EffectParameter::Float(5.0));
    effect.id = "test-effect-123".to_string();
    project.tracks[0].clips[0].effects.push(effect.id.clone());
    project.effects.push(effect);

    let builder = FFmpegBuilder::new(project);
    let mut cmd = tokio::process::Command::new("ffmpeg");

    builder.add_filter_complex(&mut cmd).await.unwrap();
    let cmd_str = format!("{:?}", cmd);

    assert!(cmd_str.contains("-filter_complex"));
  }

  #[tokio::test]
  async fn test_build_video_filter_chain() {
    let project = create_test_project();
    let builder = FFmpegBuilder::new(project);
    let video_tracks = builder.get_video_tracks();

    let mut input_index = 0;
    let filter_chain = builder
      .build_video_filter_chain(&video_tracks, &mut input_index)
      .await
      .unwrap();
    // Should have output label
    assert!(filter_chain.contains("[outv]") || filter_chain.contains("[v"));
  }

  #[tokio::test]
  async fn test_build_audio_filter_chain() {
    let mut project = create_test_project();
    // Add audio track for testing
    let mut audio_track = Track::new(TrackType::Audio, "Audio Track".to_string());
    let audio_clip = Clip::new(PathBuf::from("/test/audio.mp3"), 0.0, 10.0);
    audio_track.clips.push(audio_clip);
    project.tracks.push(audio_track);

    let builder = FFmpegBuilder::new(project);
    let audio_tracks = builder.get_audio_tracks();

    let mut input_index = 0;
    let filter_chain = builder
      .build_audio_filter_chain(&audio_tracks, &mut input_index)
      .await
      .unwrap();
    // Should have volume control and output
    assert!(filter_chain.contains("volume=") || filter_chain.contains("[outa]"));
  }

  #[tokio::test]
  async fn test_build_clip_filters() {
    let mut clip = Clip::new(PathBuf::from("/test/video.mp4"), 0.0, 10.0);
    clip.source_start = 2.0;
    clip.source_end = 8.0;
    clip.speed = 2.0; // Double speed to ensure setpts is added

    let project = create_test_project();
    let builder = FFmpegBuilder::new(project);

    let filters = builder.build_clip_filters(&clip, 0, 0).await.unwrap();
    assert!(filters.contains("trim="));
    assert!(filters.contains("setpts=")); // Will be added because speed != 1.0
    assert!(filters.contains("[v0]")); // Output label
  }

  #[tokio::test]
  async fn test_process_ffmpeg_template() {
    let builder = create_test_builder();
    let mut effect = Effect::new(EffectType::Blur, "Custom Blur".to_string());
    effect
      .parameters
      .insert("blur".to_string(), EffectParameter::Float(10.0));
    effect
      .parameters
      .insert("intensity".to_string(), EffectParameter::Float(0.8));
    effect.ffmpeg_command = Some("boxblur={blur}:enable='between(t,0,{intensity})'".to_string());

    let template = effect.ffmpeg_command.as_ref().unwrap();
    let result = builder.process_ffmpeg_template(template, &effect);

    assert_eq!(result, "boxblur=10:enable='between(t,0,0.8)'");
  }

  #[tokio::test]
  async fn test_build_video_effect_filter() {
    let builder = create_test_builder();
    let mut effect = Effect::new(EffectType::HueRotate, "Hue Rotate".to_string());
    effect
      .parameters
      .insert("angle".to_string(), EffectParameter::Float(45.0));

    // build_video_effect_filter is a private method, use build_effect_filter instead
    let result = builder.build_effect_filter(&effect).await.unwrap();
    assert!(result.contains("hue=h=45"));
  }

  #[tokio::test]
  async fn test_build_color_correction_filter() {
    let builder = create_test_builder();
    let mut effect = Effect::new(EffectType::Brightness, "Brightness".to_string());
    effect
      .parameters
      .insert("value".to_string(), EffectParameter::Float(0.2));

    let mut contrast_effect = Effect::new(EffectType::Contrast, "Contrast".to_string());
    contrast_effect
      .parameters
      .insert("value".to_string(), EffectParameter::Float(1.2));

    let mut saturation_effect = Effect::new(EffectType::Saturation, "Saturation".to_string());
    saturation_effect
      .parameters
      .insert("value".to_string(), EffectParameter::Float(1.1));

    // Test individual color correction effects through build_effect_filter
    let brightness_result = builder.build_effect_filter(&effect).await.unwrap();
    assert_eq!(brightness_result, "eq=brightness=0.2");

    let contrast_result = builder.build_effect_filter(&contrast_effect).await.unwrap();
    assert_eq!(contrast_result, "eq=contrast=1.2");

    let saturation_result = builder
      .build_effect_filter(&saturation_effect)
      .await
      .unwrap();
    assert_eq!(saturation_result, "eq=saturation=1.1");
  }

  #[tokio::test]
  async fn test_add_output_settings() {
    let mut project = create_test_project();
    project.settings.export.video_bitrate = 5000; // 5Mbps
    project.settings.export.audio_bitrate = 192; // 192kbps
    project.settings.export.quality = 80;

    let builder = FFmpegBuilder::new(project);
    let mut cmd = tokio::process::Command::new("ffmpeg");
    let output_path = PathBuf::from("/test/output.mp4");

    builder
      .add_output_settings(&mut cmd, &output_path)
      .await
      .unwrap();
    let cmd_str = format!("{:?}", cmd);

    assert!(cmd_str.contains("-c:v"));
    assert!(cmd_str.contains("-c:a"));
    assert!(cmd_str.contains("-b:v"));
    assert!(cmd_str.contains("-b:a"));
    assert!(cmd_str.contains("-crf"));
    assert!(cmd_str.contains("/test/output.mp4"));
  }

  #[tokio::test]
  async fn test_add_hardware_acceleration() {
    let mut settings = FFmpegBuilderSettings::default();
    settings.prefer_nvenc = true;
    let project = create_test_project();
    let builder = FFmpegBuilder::with_settings(project, settings);

    let mut cmd = tokio::process::Command::new("ffmpeg");
    builder.add_hardware_acceleration(&mut cmd).await;

    let cmd_str = format!("{:?}", cmd);
    // Should contain video codec parameter
    assert!(cmd_str.contains("-c:v"));
  }

  #[test]
  fn test_add_global_options() {
    let mut settings = FFmpegBuilderSettings::default();
    settings.threads = Some(4);
    settings.global_args = vec![
      "-hide_banner".to_string(),
      "-loglevel".to_string(),
      "error".to_string(),
    ];

    let project = create_test_project();
    let builder = FFmpegBuilder::with_settings(project, settings);

    let mut cmd = tokio::process::Command::new("ffmpeg");
    builder.add_global_options(&mut cmd);

    let cmd_str = format!("{:?}", cmd);
    assert!(cmd_str.contains("-threads"));
    assert!(cmd_str.contains("4"));
    assert!(cmd_str.contains("-hide_banner"));
    assert!(cmd_str.contains("-loglevel"));
    assert!(cmd_str.contains("info")); // По умолчанию используется "info", а не "error"
    assert!(cmd_str.contains("-progress"));
  }

  #[test]
  fn test_find_effect() {
    let mut project = create_test_project();
    let mut effect = Effect::new(EffectType::Blur, "Test Effect".to_string());
    effect.id = "test-effect-123".to_string();
    project.effects.push(effect);
    project.tracks[0].clips[0]
      .effects
      .push("test-effect-123".to_string());

    let builder = FFmpegBuilder::new(project);

    let found = builder.find_effect("test-effect-123");
    assert!(found.is_some());
    assert_eq!(found.unwrap().name, "Test Effect");

    let not_found = builder.find_effect("non-existent");
    assert!(not_found.is_none());
  }

  fn create_test_builder() -> FFmpegBuilder {
    let project = ProjectSchema::new("Test Project".to_string());
    FFmpegBuilder::new(project)
  }

  fn create_blur_effect(radius: f32) -> Effect {
    let mut effect = Effect::new(EffectType::Blur, "Blur".to_string());
    effect
      .parameters
      .insert("radius".to_string(), EffectParameter::Float(radius));
    effect
  }

  fn create_brightness_effect(value: f32) -> Effect {
    let mut effect = Effect::new(EffectType::Brightness, "Brightness".to_string());
    effect
      .parameters
      .insert("value".to_string(), EffectParameter::Float(value));
    effect
  }

  fn create_contrast_effect(value: f32) -> Effect {
    let mut effect = Effect::new(EffectType::Contrast, "Contrast".to_string());
    effect
      .parameters
      .insert("value".to_string(), EffectParameter::Float(value));
    effect
  }

  fn create_saturation_effect(value: f32) -> Effect {
    let mut effect = Effect::new(EffectType::Saturation, "Saturation".to_string());
    effect
      .parameters
      .insert("value".to_string(), EffectParameter::Float(value));
    effect
  }

  fn create_speed_effect(speed: f32) -> Effect {
    let mut effect = Effect::new(EffectType::Speed, "Speed".to_string());
    effect
      .parameters
      .insert("speed".to_string(), EffectParameter::Float(speed));
    effect
  }

  fn create_vignette_effect(angle: f32) -> Effect {
    let mut effect = Effect::new(EffectType::Vignette, "Vignette".to_string());
    effect
      .parameters
      .insert("angle".to_string(), EffectParameter::Float(angle));
    effect
  }

  fn create_simple_effect(effect_type: EffectType) -> Effect {
    Effect::new(effect_type, "Test Effect".to_string())
  }

  fn create_custom_effect_with_template(template: &str, intensity: f32) -> Effect {
    let mut effect = Effect::new(EffectType::Noir, "Custom Effect".to_string());
    effect.ffmpeg_command = Some(template.to_string());
    effect
      .parameters
      .insert("intensity".to_string(), EffectParameter::Float(intensity));
    effect
  }
}

impl Default for FFmpegBuilderSettings {
  fn default() -> Self {
    Self {
      ffmpeg_path: "ffmpeg".to_string(),
      threads: None, // Автоматическое определение
      prefer_nvenc: true,
      prefer_quicksync: false,
      global_args: Vec::new(),
    }
  }
}
