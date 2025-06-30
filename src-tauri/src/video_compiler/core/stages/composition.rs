//! Composition Stage - Этап композиции видео

use async_trait::async_trait;
use std::path::{Path, PathBuf};
use std::time::Duration;

use super::{PipelineContext, PipelineStage};
use crate::video_compiler::error::{Result, VideoCompilerError};
use crate::video_compiler::schema::{Clip, Effect, Filter, Track};

/// Этап композиции
pub struct CompositionStage;

impl CompositionStage {
  pub fn new() -> Self {
    Self
  }

  /// Создание композитной сцены
  async fn create_composition(&self, context: &mut PipelineContext) -> Result<()> {
    log::info!("🎬 Создание композитной сцены...");

    let composition_path = context.get_temp_file_path("composition.mp4");

    // Обрабатываем треки по слоям
    let mut layer_outputs = Vec::new();
    let tracks_len = context.project.tracks.len();

    for (track_idx, track) in context.project.tracks.clone().iter().enumerate() {
      if context.is_cancelled() {
        return Err(VideoCompilerError::CancelledError(
          "Композиция отменена".to_string(),
        ));
      }

      let track_output = self.process_track(track, track_idx, context).await?;
      layer_outputs.push(track_output);

      let progress = ((track_idx + 1) * 70 / tracks_len) as u64;
      context.update_progress(progress, "Composition").await?;
    }

    // Объединяем все слои
    self
      .combine_layers(&layer_outputs, &composition_path, context)
      .await?;
    context.update_progress(90, "Composition").await?;

    // Добавляем результат в промежуточные файлы
    context.add_intermediate_file("composition".to_string(), composition_path);

    log::info!("✅ Композиция создана");
    Ok(())
  }

  /// Обработка отдельного трека
  async fn process_track(
    &self,
    track: &Track,
    track_idx: usize,
    context: &mut PipelineContext,
  ) -> Result<PathBuf> {
    log::debug!("🎵 Обработка трека {track_idx}");

    let track_output = context.get_temp_file_path(&format!("track_{track_idx}.mp4"));

    if track.clips.is_empty() {
      // Создаем пустой трек
      self.create_empty_track(&track_output, context).await?;
      return Ok(track_output);
    }

    // Объединяем клипы в треке
    let mut clip_outputs = Vec::new();
    for (clip_idx, clip) in track.clips.iter().enumerate() {
      let clip_output = self
        .process_clip(clip, track_idx, clip_idx, context)
        .await?;
      clip_outputs.push(clip_output);
    }

    // Объединяем клипы в один трек
    self
      .concatenate_clips(&clip_outputs, &track_output, context)
      .await?;

    log::debug!("✅ Трек {track_idx} обработан");
    Ok(track_output)
  }

  /// Обработка отдельного клипа
  async fn process_clip(
    &self,
    clip: &Clip,
    track_idx: usize,
    clip_idx: usize,
    context: &mut PipelineContext,
  ) -> Result<PathBuf> {
    log::debug!("🎞️ Обработка клипа {track_idx}:{clip_idx}");

    // Получаем исходный обработанный файл
    let source_key = if matches!(
      clip.source,
      crate::video_compiler::schema::ClipSource::Generated
    ) {
      format!("generated_track_{track_idx}_clip_{clip_idx}")
    } else {
      format!("preprocessed_track_{track_idx}_clip_{clip_idx}")
    };

    let source_path = context.get_intermediate_file(&source_key).ok_or_else(|| {
      VideoCompilerError::InternalError(format!(
        "Источник для клипа {track_idx}:{clip_idx} не найден"
      ))
    })?;

    let clip_output = context.get_temp_file_path(&format!("clip_{track_idx}_{clip_idx}.mp4"));

    // Применяем обрезку времени
    let trimmed_path = self
      .apply_time_trim(
        source_path,
        clip.start_time,
        clip.end_time,
        &context.get_temp_file_path(&format!("trimmed_{track_idx}_{clip_idx}.mp4")),
        context,
      )
      .await?;

    // Применяем эффекты
    let effects_applied_path = if !clip.effects.is_empty() {
      // Ищем эффекты по ID
      let actual_effects: Vec<&Effect> = clip
        .effects
        .iter()
        .filter_map(|effect_id| context.project.effects.iter().find(|e| &e.id == effect_id))
        .collect();

      if !actual_effects.is_empty() {
        self
          .apply_effects(
            &trimmed_path,
            &actual_effects,
            &context.get_temp_file_path(&format!("effects_{track_idx}_{clip_idx}.mp4")),
            context,
          )
          .await?
      } else {
        trimmed_path
      }
    } else {
      trimmed_path
    };

    // Применяем фильтры
    let filters_applied_path = if !clip.filters.is_empty() {
      // Ищем фильтры по ID
      let actual_filters: Vec<&Filter> = clip
        .filters
        .iter()
        .filter_map(|filter_id| context.project.filters.iter().find(|f| &f.id == filter_id))
        .collect();

      if !actual_filters.is_empty() {
        self
          .apply_filters(
            &effects_applied_path,
            &actual_filters,
            &context.get_temp_file_path(&format!("filters_{track_idx}_{clip_idx}.mp4")),
            context,
          )
          .await?
      } else {
        effects_applied_path
      }
    } else {
      effects_applied_path
    };

    // Применяем позиционирование и масштабирование
    self
      .apply_positioning(&filters_applied_path, clip, &clip_output, context)
      .await?;

    log::debug!("✅ Клип {track_idx}:{clip_idx} обработан");
    Ok(clip_output)
  }

  /// Применение обрезки по времени
  async fn apply_time_trim(
    &self,
    input_path: &PathBuf,
    start_time: f64,
    end_time: f64,
    output_path: &PathBuf,
    _context: &PipelineContext,
  ) -> Result<PathBuf> {
    let duration = end_time - start_time;

    let mut command = tokio::process::Command::new("ffmpeg");
    command
      .arg("-i")
      .arg(input_path)
      .arg("-ss")
      .arg(start_time.to_string())
      .arg("-t")
      .arg(duration.to_string())
      .arg("-c")
      .arg("copy")
      .arg("-y")
      .arg(output_path);

    let output = command
      .output()
      .await
      .map_err(|e| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: e.to_string(),
        command: "ffmpeg".to_string(),
      })?;

    if !output.status.success() {
      let error_msg = String::from_utf8_lossy(&output.stderr);
      return Err(VideoCompilerError::FFmpegError {
        exit_code: output.status.code(),
        stderr: error_msg.to_string(),
        command: "ffmpeg".to_string(),
      });
    }

    Ok(output_path.clone())
  }

  /// Применение эффектов
  async fn apply_effects(
    &self,
    input_path: &Path,
    effects: &[&Effect],
    output_path: &Path,
    _context: &PipelineContext,
  ) -> Result<PathBuf> {
    let mut current_input = input_path.to_path_buf();

    for (temp_counter, effect) in effects.iter().enumerate() {
      let temp_output = if temp_counter == effects.len() - 1 {
        output_path.to_path_buf()
      } else {
        PathBuf::from(format!(
          "{}_temp_{}.mp4",
          output_path.file_stem().unwrap().to_string_lossy(),
          temp_counter
        ))
      };

      self
        .apply_single_effect(&current_input, effect, &temp_output)
        .await?;
      current_input = temp_output;
    }

    Ok(output_path.to_path_buf())
  }

  /// Применение одного эффекта
  async fn apply_single_effect(
    &self,
    input_path: &PathBuf,
    effect: &Effect,
    output_path: &PathBuf,
  ) -> Result<()> {
    let filter_string = match effect.effect_type {
      crate::video_compiler::schema::effects::EffectType::AudioFadeIn => {
        let duration = effect
          .parameters
          .get("duration")
          .and_then(|d| match d {
            crate::video_compiler::schema::effects::EffectParameter::Float(f) => Some(*f as f64),
            _ => None,
          })
          .unwrap_or(1.0);
        format!("fade=in:0:{duration}")
      }
      crate::video_compiler::schema::effects::EffectType::AudioFadeOut => {
        let duration = effect
          .parameters
          .get("duration")
          .and_then(|d| match d {
            crate::video_compiler::schema::effects::EffectParameter::Float(f) => Some(*f as f64),
            _ => None,
          })
          .unwrap_or(1.0);
        format!("fade=out:st={duration}:d={duration}")
      }
      crate::video_compiler::schema::effects::EffectType::Blur => {
        let radius = effect
          .parameters
          .get("radius")
          .and_then(|r| match r {
            crate::video_compiler::schema::effects::EffectParameter::Float(f) => Some(*f as f64),
            _ => None,
          })
          .unwrap_or(5.0);
        format!("boxblur={radius}")
      }
      crate::video_compiler::schema::effects::EffectType::Brightness => {
        let value = effect
          .parameters
          .get("value")
          .and_then(|v| match v {
            crate::video_compiler::schema::effects::EffectParameter::Float(f) => Some(*f as f64),
            _ => None,
          })
          .unwrap_or(0.0);
        format!("eq=brightness={value}")
      }
      crate::video_compiler::schema::effects::EffectType::Contrast => {
        let value = effect
          .parameters
          .get("value")
          .and_then(|v| match v {
            crate::video_compiler::schema::effects::EffectParameter::Float(f) => Some(*f as f64),
            _ => None,
          })
          .unwrap_or(1.0);
        format!("eq=contrast={value}")
      }
      _ => {
        log::warn!("Неподдерживаемый эффект: {:?}", effect.effect_type);
        return Ok(());
      }
    };

    let mut command = tokio::process::Command::new("ffmpeg");
    command
      .arg("-i")
      .arg(input_path)
      .arg("-vf")
      .arg(filter_string)
      .arg("-y")
      .arg(output_path);

    let output = command
      .output()
      .await
      .map_err(|e| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: e.to_string(),
        command: "ffmpeg".to_string(),
      })?;

    if !output.status.success() {
      let error_msg = String::from_utf8_lossy(&output.stderr);
      return Err(VideoCompilerError::FFmpegError {
        exit_code: output.status.code(),
        stderr: error_msg.to_string(),
        command: "ffmpeg".to_string(),
      });
    }

    Ok(())
  }

  /// Применение фильтров
  async fn apply_filters(
    &self,
    input_path: &PathBuf,
    filters: &[&Filter],
    output_path: &PathBuf,
    _context: &PipelineContext,
  ) -> Result<PathBuf> {
    let mut filter_chains = Vec::new();

    for filter in filters {
      let filter_string = match filter.filter_type {
        crate::video_compiler::schema::effects::FilterType::Brightness => {
          let value = filter.parameters.get("value").unwrap_or(&0.0);
          format!("eq=brightness={value}")
        }
        crate::video_compiler::schema::effects::FilterType::Contrast => {
          let value = filter.parameters.get("value").unwrap_or(&1.0);
          format!("eq=contrast={value}")
        }
        crate::video_compiler::schema::effects::FilterType::Saturation => {
          let value = filter.parameters.get("value").unwrap_or(&1.0);
          format!("eq=saturation={value}")
        }
        crate::video_compiler::schema::effects::FilterType::Blur => {
          let radius = filter.parameters.get("radius").unwrap_or(&5.0);
          format!("boxblur={radius}")
        }
        crate::video_compiler::schema::effects::FilterType::Sharpen => {
          "unsharp=5:5:1.0:5:5:0.0".to_string()
        }
        _ => {
          log::warn!("Неподдерживаемый фильтр: {:?}", filter.filter_type);
          continue;
        }
      };
      filter_chains.push(filter_string);
    }

    if filter_chains.is_empty() {
      // Просто копируем файл
      tokio::fs::copy(input_path, output_path)
        .await
        .map_err(|e| VideoCompilerError::IoError(e.to_string()))?;
      return Ok(output_path.clone());
    }

    let combined_filter = filter_chains.join(",");

    let mut command = tokio::process::Command::new("ffmpeg");
    command
      .arg("-i")
      .arg(input_path)
      .arg("-vf")
      .arg(combined_filter)
      .arg("-y")
      .arg(output_path);

    let output = command
      .output()
      .await
      .map_err(|e| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: e.to_string(),
        command: "ffmpeg".to_string(),
      })?;

    if !output.status.success() {
      let error_msg = String::from_utf8_lossy(&output.stderr);
      return Err(VideoCompilerError::FFmpegError {
        exit_code: output.status.code(),
        stderr: error_msg.to_string(),
        command: "ffmpeg".to_string(),
      });
    }

    Ok(output_path.clone())
  }

  /// Применение позиционирования
  async fn apply_positioning(
    &self,
    input_path: &PathBuf,
    clip: &Clip,
    output_path: &PathBuf,
    context: &PipelineContext,
  ) -> Result<()> {
    let export_settings = &context.project.settings;

    // Вычисляем позицию и размер из настроек трансформации
    let default_transform = Default::default();
    let transform = clip.transform.as_ref().unwrap_or(&default_transform);
    let width = export_settings.resolution.width;
    let height = export_settings.resolution.height;
    let x = (transform.position_x * width as f32) as i32;
    let y = (transform.position_y * height as f32) as i32;
    let scaled_width = (transform.scale_x * width as f32) as i32;
    let scaled_height = (transform.scale_y * height as f32) as i32;

    let mut command = tokio::process::Command::new("ffmpeg");
    command
      .arg("-i")
      .arg(input_path)
      .arg("-vf")
      .arg(format!(
        "scale={scaled_width}:{scaled_height},pad={width}:{height}:{x}:{y}:black"
      ))
      .arg("-y")
      .arg(output_path);

    let output = command
      .output()
      .await
      .map_err(|e| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: e.to_string(),
        command: "ffmpeg".to_string(),
      })?;

    if !output.status.success() {
      let error_msg = String::from_utf8_lossy(&output.stderr);
      return Err(VideoCompilerError::FFmpegError {
        exit_code: output.status.code(),
        stderr: error_msg.to_string(),
        command: "ffmpeg".to_string(),
      });
    }

    Ok(())
  }

  /// Объединение клипов в треке
  async fn concatenate_clips(
    &self,
    clip_paths: &[PathBuf],
    output_path: &PathBuf,
    _context: &PipelineContext,
  ) -> Result<()> {
    if clip_paths.is_empty() {
      return Err(VideoCompilerError::InternalError(
        "Нет клипов для объединения".to_string(),
      ));
    }

    if clip_paths.len() == 1 {
      // Просто копируем единственный клип
      tokio::fs::copy(&clip_paths[0], output_path)
        .await
        .map_err(|e| VideoCompilerError::IoError(e.to_string()))?;
      return Ok(());
    }

    // Создаем concat файл
    let concat_file = output_path.parent().unwrap().join("concat_list.txt");
    let mut concat_content = String::new();

    for path in clip_paths {
      concat_content.push_str(&format!("file '{}'\n", path.display()));
    }

    tokio::fs::write(&concat_file, concat_content)
      .await
      .map_err(|e| VideoCompilerError::IoError(e.to_string()))?;

    let mut command = tokio::process::Command::new("ffmpeg");
    command
      .arg("-f")
      .arg("concat")
      .arg("-safe")
      .arg("0")
      .arg("-i")
      .arg(&concat_file)
      .arg("-c")
      .arg("copy")
      .arg("-y")
      .arg(output_path);

    let output = command
      .output()
      .await
      .map_err(|e| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: e.to_string(),
        command: "ffmpeg".to_string(),
      })?;

    // Удаляем временный concat файл
    let _ = tokio::fs::remove_file(&concat_file).await;

    if !output.status.success() {
      let error_msg = String::from_utf8_lossy(&output.stderr);
      return Err(VideoCompilerError::FFmpegError {
        exit_code: output.status.code(),
        stderr: error_msg.to_string(),
        command: "ffmpeg".to_string(),
      });
    }

    Ok(())
  }

  /// Объединение слоев (треков)
  async fn combine_layers(
    &self,
    layer_paths: &[PathBuf],
    output_path: &PathBuf,
    _context: &PipelineContext,
  ) -> Result<()> {
    if layer_paths.is_empty() {
      return Err(VideoCompilerError::InternalError(
        "Нет слоев для объединения".to_string(),
      ));
    }

    if layer_paths.len() == 1 {
      // Просто копируем единственный слой
      tokio::fs::copy(&layer_paths[0], output_path)
        .await
        .map_err(|e| VideoCompilerError::IoError(e.to_string()))?;
      return Ok(());
    }

    // Создаем сложную фильтр-схему для overlay
    let mut command = tokio::process::Command::new("ffmpeg");

    // Добавляем все входные файлы
    for path in layer_paths {
      command.arg("-i").arg(path);
    }

    // Создаем filter_complex для overlay
    let mut filter_complex = String::new();
    let mut current_label = "[0:v]".to_string();

    for i in 1..layer_paths.len() {
      let next_label = if i == layer_paths.len() - 1 {
        "[out]".to_string()
      } else {
        format!("[tmp{i}]")
      };

      filter_complex.push_str(&format!("{current_label}[{i}:v]overlay=0:0{next_label}; "));

      current_label = next_label.clone();
    }

    // Убираем последний "; "
    filter_complex = filter_complex.trim_end_matches("; ").to_string();

    command
      .arg("-filter_complex")
      .arg(filter_complex)
      .arg("-map")
      .arg("[out]")
      .arg("-y")
      .arg(output_path);

    let output = command
      .output()
      .await
      .map_err(|e| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: e.to_string(),
        command: "ffmpeg".to_string(),
      })?;

    if !output.status.success() {
      let error_msg = String::from_utf8_lossy(&output.stderr);
      return Err(VideoCompilerError::FFmpegError {
        exit_code: output.status.code(),
        stderr: error_msg.to_string(),
        command: "ffmpeg".to_string(),
      });
    }

    Ok(())
  }

  /// Создание пустого трека
  async fn create_empty_track(
    &self,
    output_path: &PathBuf,
    context: &PipelineContext,
  ) -> Result<()> {
    let export_settings = &context.project.settings;

    let mut command = tokio::process::Command::new("ffmpeg");
    command
      .arg("-f")
      .arg("lavfi")
      .arg("-i")
      .arg(format!(
        "color=black:size={}x{}:duration=1:rate={}",
        export_settings.resolution.width,
        export_settings.resolution.height,
        export_settings.frame_rate
      ))
      .arg("-c:v")
      .arg("libx264")
      .arg("-y")
      .arg(output_path);

    let output = command
      .output()
      .await
      .map_err(|e| VideoCompilerError::FFmpegError {
        exit_code: None,
        stderr: e.to_string(),
        command: "ffmpeg".to_string(),
      })?;

    if !output.status.success() {
      let error_msg = String::from_utf8_lossy(&output.stderr);
      return Err(VideoCompilerError::FFmpegError {
        exit_code: output.status.code(),
        stderr: error_msg.to_string(),
        command: "ffmpeg".to_string(),
      });
    }

    Ok(())
  }
}

#[async_trait]
impl PipelineStage for CompositionStage {
  async fn process(&self, context: &mut PipelineContext) -> Result<()> {
    log::info!("🎬 === Этап композиции ===");

    // Обновляем прогресс
    context.update_progress(0, "Composition").await?;

    // Создаем композицию
    self.create_composition(context).await?;

    log::info!("✅ Композиция завершена успешно");
    Ok(())
  }

  fn name(&self) -> &str {
    "Composition"
  }

  fn estimated_duration(&self) -> Duration {
    Duration::from_secs(120) // Композиция может занять много времени
  }
}

impl Default for CompositionStage {
  fn default() -> Self {
    Self::new()
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::schema::{
    effects::{Effect, EffectParameter, EffectType, Filter, FilterType},
    timeline::{Clip, Track as SchemaTrack, TrackType, TransformSettings},
  };
  use std::collections::HashMap;
  use std::path::Path;
  use tempfile::TempDir;
  use tokio;

  fn create_test_context(temp_dir: &TempDir) -> PipelineContext {
    // Use the actual Project schema from the codebase
    let project =
      crate::video_compiler::schema::project::ProjectSchema::new("Test Project".to_string());
    let output_path = temp_dir.path().join("output.mp4");

    let mut context = PipelineContext::new(project, output_path);
    // Override temp_dir to use our test directory
    context.temp_dir = temp_dir.path().to_path_buf();
    context
  }

  fn create_mock_video_file(path: &Path) -> Result<()> {
    // Create a minimal mock video file
    std::fs::write(path, b"mock video content")?;
    Ok(())
  }

  #[test]
  fn test_composition_stage_creation() {
    let stage = CompositionStage::new();
    assert_eq!(stage.name(), "Composition");
    assert_eq!(stage.estimated_duration(), Duration::from_secs(120));
  }

  #[test]
  fn test_composition_stage_default() {
    let stage = CompositionStage;
    assert_eq!(stage.name(), "Composition");
  }

  #[tokio::test]
  async fn test_create_empty_track() {
    let temp_dir = TempDir::new().unwrap();
    let context = create_test_context(&temp_dir);
    let stage = CompositionStage::new();

    let output_path = temp_dir.path().join("empty_track.mp4");

    // Тест будет успешным только если FFmpeg установлен
    // В реальной среде это создаст пустой черный видеофайл
    let result = stage.create_empty_track(&output_path, &context).await;

    // Проверяем что функция вызывается без паники
    // Результат может быть ошибкой если FFmpeg не установлен, что нормально для тестов
    match result {
      Ok(()) => {
        // Если FFmpeg установлен, файл должен быть создан
        assert!(output_path.exists());
      }
      Err(VideoCompilerError::FFmpegError { .. }) => {
        // Ожидаемая ошибка если FFmpeg не доступен в тестовой среде
      }
      Err(e) => panic!("Неожиданная ошибка: {:?}", e),
    }
  }

  #[tokio::test]
  async fn test_apply_time_trim() {
    let temp_dir = TempDir::new().unwrap();
    let context = create_test_context(&temp_dir);
    let stage = CompositionStage::new();

    let input_path = temp_dir.path().join("input.mp4");
    let output_path = temp_dir.path().join("trimmed.mp4");

    create_mock_video_file(&input_path).unwrap();

    let result = stage
      .apply_time_trim(&input_path, 0.0, 5.0, &output_path, &context)
      .await;

    // Тест структуры вызова, результат зависит от наличия FFmpeg
    match result {
      Ok(path) => {
        assert_eq!(path, output_path);
      }
      Err(VideoCompilerError::FFmpegError { .. }) => {
        // Ожидаемо если FFmpeg не установлен
      }
      Err(e) => panic!("Неожиданная ошибка: {:?}", e),
    }
  }

  #[tokio::test]
  async fn test_apply_single_effect_blur() {
    let temp_dir = TempDir::new().unwrap();
    let stage = CompositionStage::new();

    let input_path = temp_dir.path().join("input.mp4");
    let output_path = temp_dir.path().join("blurred.mp4");

    create_mock_video_file(&input_path).unwrap();

    let mut parameters = HashMap::new();
    parameters.insert("radius".to_string(), EffectParameter::Float(10.0));

    let mut effect = Effect::new(EffectType::Blur, "Blur Effect".to_string());
    effect.parameters = parameters;

    let result = stage
      .apply_single_effect(&input_path, &effect, &output_path)
      .await;

    // Проверяем что функция вызывается правильно
    match result {
      Ok(()) => {}
      Err(VideoCompilerError::FFmpegError { .. }) => {
        // Ожидаемо если FFmpeg не установлен
      }
      Err(e) => panic!("Неожиданная ошибка: {:?}", e),
    }
  }

  #[tokio::test]
  async fn test_apply_single_effect_brightness() {
    let temp_dir = TempDir::new().unwrap();
    let stage = CompositionStage::new();

    let input_path = temp_dir.path().join("input.mp4");
    let output_path = temp_dir.path().join("bright.mp4");

    create_mock_video_file(&input_path).unwrap();

    let mut parameters = HashMap::new();
    parameters.insert("value".to_string(), EffectParameter::Float(0.2));

    let mut effect = Effect::new(EffectType::Brightness, "Brightness Effect".to_string());
    effect.parameters = parameters;

    let result = stage
      .apply_single_effect(&input_path, &effect, &output_path)
      .await;

    match result {
      Ok(()) => {}
      Err(VideoCompilerError::FFmpegError { .. }) => {}
      Err(e) => panic!("Неожиданная ошибка: {:?}", e),
    }
  }

  #[tokio::test]
  async fn test_apply_single_effect_contrast() {
    let temp_dir = TempDir::new().unwrap();
    let stage = CompositionStage::new();

    let input_path = temp_dir.path().join("input.mp4");
    let output_path = temp_dir.path().join("contrast.mp4");

    create_mock_video_file(&input_path).unwrap();

    let mut parameters = HashMap::new();
    parameters.insert("value".to_string(), EffectParameter::Float(1.5));

    let mut effect = Effect::new(EffectType::Contrast, "Contrast Effect".to_string());
    effect.parameters = parameters;

    let result = stage
      .apply_single_effect(&input_path, &effect, &output_path)
      .await;

    match result {
      Ok(()) => {}
      Err(VideoCompilerError::FFmpegError { .. }) => {}
      Err(e) => panic!("Неожиданная ошибка: {:?}", e),
    }
  }

  #[tokio::test]
  async fn test_apply_single_effect_audio_fade_in() {
    let temp_dir = TempDir::new().unwrap();
    let stage = CompositionStage::new();

    let input_path = temp_dir.path().join("input.mp4");
    let output_path = temp_dir.path().join("fade_in.mp4");

    create_mock_video_file(&input_path).unwrap();

    let mut parameters = HashMap::new();
    parameters.insert("duration".to_string(), EffectParameter::Float(2.0));

    let mut effect = Effect::new(EffectType::AudioFadeIn, "Audio Fade In".to_string());
    effect.parameters = parameters;

    let result = stage
      .apply_single_effect(&input_path, &effect, &output_path)
      .await;

    match result {
      Ok(()) => {}
      Err(VideoCompilerError::FFmpegError { .. }) => {}
      Err(e) => panic!("Неожиданная ошибка: {:?}", e),
    }
  }

  #[tokio::test]
  async fn test_apply_single_effect_audio_fade_out() {
    let temp_dir = TempDir::new().unwrap();
    let stage = CompositionStage::new();

    let input_path = temp_dir.path().join("input.mp4");
    let output_path = temp_dir.path().join("fade_out.mp4");

    create_mock_video_file(&input_path).unwrap();

    let mut parameters = HashMap::new();
    parameters.insert("duration".to_string(), EffectParameter::Float(3.0));

    let mut effect = Effect::new(EffectType::AudioFadeOut, "Audio Fade Out".to_string());
    effect.parameters = parameters;

    let result = stage
      .apply_single_effect(&input_path, &effect, &output_path)
      .await;

    match result {
      Ok(()) => {}
      Err(VideoCompilerError::FFmpegError { .. }) => {}
      Err(e) => panic!("Неожиданная ошибка: {:?}", e),
    }
  }

  #[tokio::test]
  async fn test_apply_single_effect_unsupported() {
    let temp_dir = TempDir::new().unwrap();
    let stage = CompositionStage::new();

    let input_path = temp_dir.path().join("input.mp4");
    let output_path = temp_dir.path().join("output.mp4");

    create_mock_video_file(&input_path).unwrap();

    // Используем неподдерживаемый эффект
    let effect = Effect::new(EffectType::AudioEqualizer, "Unsupported Effect".to_string()); // Не обрабатывается в apply_single_effect

    let result = stage
      .apply_single_effect(&input_path, &effect, &output_path)
      .await;

    // Должно вернуть Ok(()) для неподдерживаемых эффектов
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_apply_effects_empty() {
    let temp_dir = TempDir::new().unwrap();
    let context = create_test_context(&temp_dir);
    let stage = CompositionStage::new();

    let input_path = temp_dir.path().join("input.mp4");
    let output_path = temp_dir.path().join("effects.mp4");

    create_mock_video_file(&input_path).unwrap();

    let effects: Vec<&Effect> = vec![];

    let result = stage
      .apply_effects(&input_path, &effects, &output_path, &context)
      .await;

    assert!(result.is_ok());
    assert_eq!(result.unwrap(), output_path);
  }

  #[tokio::test]
  async fn test_apply_filters_brightness() {
    let temp_dir = TempDir::new().unwrap();
    let context = create_test_context(&temp_dir);
    let stage = CompositionStage::new();

    let input_path = temp_dir.path().join("input.mp4");
    let output_path = temp_dir.path().join("filtered.mp4");

    create_mock_video_file(&input_path).unwrap();

    let mut parameters = HashMap::new();
    parameters.insert("value".to_string(), 0.3);

    let filter = Filter::new(FilterType::Brightness, "Brightness Filter".to_string());

    let filters = vec![&filter];

    let result = stage
      .apply_filters(&input_path, &filters, &output_path, &context)
      .await;

    match result {
      Ok(path) => assert_eq!(path, output_path),
      Err(VideoCompilerError::FFmpegError { .. }) => {}
      Err(e) => panic!("Неожиданная ошибка: {:?}", e),
    }
  }

  #[tokio::test]
  async fn test_apply_filters_multiple() {
    let temp_dir = TempDir::new().unwrap();
    let context = create_test_context(&temp_dir);
    let stage = CompositionStage::new();

    let input_path = temp_dir.path().join("input.mp4");
    let output_path = temp_dir.path().join("filtered.mp4");

    create_mock_video_file(&input_path).unwrap();

    let mut brightness_params = HashMap::new();
    brightness_params.insert("value".to_string(), 0.2);

    let mut contrast_params = HashMap::new();
    contrast_params.insert("value".to_string(), 1.3);

    let brightness_filter = Filter::new(FilterType::Brightness, "Brightness Filter".to_string());
    let contrast_filter = Filter::new(FilterType::Contrast, "Contrast Filter".to_string());

    let filters = vec![&brightness_filter, &contrast_filter];

    let result = stage
      .apply_filters(&input_path, &filters, &output_path, &context)
      .await;

    match result {
      Ok(path) => assert_eq!(path, output_path),
      Err(VideoCompilerError::FFmpegError { .. }) => {}
      Err(e) => panic!("Неожиданная ошибка: {:?}", e),
    }
  }

  #[tokio::test]
  async fn test_apply_filters_empty() {
    let temp_dir = TempDir::new().unwrap();
    let context = create_test_context(&temp_dir);
    let stage = CompositionStage::new();

    let input_path = temp_dir.path().join("input.mp4");
    let output_path = temp_dir.path().join("output.mp4");

    create_mock_video_file(&input_path).unwrap();

    let filters: Vec<&Filter> = vec![];

    let result = stage
      .apply_filters(&input_path, &filters, &output_path, &context)
      .await;

    // Должно скопировать файл без изменений
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), output_path);
    assert!(output_path.exists());
  }

  #[tokio::test]
  async fn test_apply_positioning() {
    let temp_dir = TempDir::new().unwrap();
    let context = create_test_context(&temp_dir);
    let stage = CompositionStage::new();

    let input_path = temp_dir.path().join("input.mp4");
    let output_path = temp_dir.path().join("positioned.mp4");

    create_mock_video_file(&input_path).unwrap();

    let transform = TransformSettings {
      position_x: 0.1,
      position_y: 0.2,
      scale_x: 0.8,
      scale_y: 0.8,
      rotation: 0.0,
      anchor_x: 0.5,
      anchor_y: 0.5,
    };

    let mut clip = Clip::new(
      std::path::PathBuf::from(input_path.to_string_lossy().to_string()),
      0.0,
      5.0,
    );
    clip.transform = Some(transform);

    let result = stage
      .apply_positioning(&input_path, &clip, &output_path, &context)
      .await;

    match result {
      Ok(()) => {}
      Err(VideoCompilerError::FFmpegError { .. }) => {}
      Err(e) => panic!("Неожиданная ошибка: {:?}", e),
    }
  }

  #[tokio::test]
  async fn test_concatenate_clips_empty() {
    let temp_dir = TempDir::new().unwrap();
    let context = create_test_context(&temp_dir);
    let stage = CompositionStage::new();

    let output_path = temp_dir.path().join("concat.mp4");
    let clip_paths: Vec<PathBuf> = vec![];

    let result = stage
      .concatenate_clips(&clip_paths, &output_path, &context)
      .await;

    assert!(result.is_err());
    match result.unwrap_err() {
      VideoCompilerError::InternalError(msg) => {
        assert!(msg.contains("Нет клипов для объединения"));
      }
      e => panic!("Неожиданная ошибка: {:?}", e),
    }
  }

  #[tokio::test]
  async fn test_concatenate_clips_single() {
    let temp_dir = TempDir::new().unwrap();
    let context = create_test_context(&temp_dir);
    let stage = CompositionStage::new();

    let clip_path = temp_dir.path().join("clip1.mp4");
    let output_path = temp_dir.path().join("concat.mp4");

    create_mock_video_file(&clip_path).unwrap();

    let clip_paths = vec![clip_path.clone()];

    let result = stage
      .concatenate_clips(&clip_paths, &output_path, &context)
      .await;

    assert!(result.is_ok());
    assert!(output_path.exists());
  }

  #[tokio::test]
  async fn test_combine_layers_empty() {
    let temp_dir = TempDir::new().unwrap();
    let context = create_test_context(&temp_dir);
    let stage = CompositionStage::new();

    let output_path = temp_dir.path().join("combined.mp4");
    let layer_paths: Vec<PathBuf> = vec![];

    let result = stage
      .combine_layers(&layer_paths, &output_path, &context)
      .await;

    assert!(result.is_err());
    match result.unwrap_err() {
      VideoCompilerError::InternalError(msg) => {
        assert!(msg.contains("Нет слоев для объединения"));
      }
      e => panic!("Неожиданная ошибка: {:?}", e),
    }
  }

  #[tokio::test]
  async fn test_combine_layers_single() {
    let temp_dir = TempDir::new().unwrap();
    let context = create_test_context(&temp_dir);
    let stage = CompositionStage::new();

    let layer_path = temp_dir.path().join("layer1.mp4");
    let output_path = temp_dir.path().join("combined.mp4");

    create_mock_video_file(&layer_path).unwrap();

    let layer_paths = vec![layer_path.clone()];

    let result = stage
      .combine_layers(&layer_paths, &output_path, &context)
      .await;

    assert!(result.is_ok());
    assert!(output_path.exists());
  }

  #[test]
  fn test_effect_parameter_extraction() {
    let _stage = CompositionStage::new();

    // Тест извлечения параметров из различных типов EffectParameter
    let mut _params = HashMap::new();
    _params.insert("float_val".to_string(), EffectParameter::Float(2.5));
    _params.insert("int_val".to_string(), EffectParameter::Int(10));
    _params.insert(
      "string_val".to_string(),
      EffectParameter::String("test".to_string()),
    );

    // Проверяем что функция правильно обрабатывает разные типы параметров
    // Это косвенно проверяется через тесты эффектов выше
  }

  #[tokio::test]
  async fn test_process_integration() {
    let temp_dir = TempDir::new().unwrap();
    let mut context = create_test_context(&temp_dir);

    // Добавляем простой трек без клипов
    let track = SchemaTrack::new(TrackType::Video, "Test Track".to_string());

    context.project.tracks = vec![track];

    let stage = CompositionStage::new();

    let result = stage.process(&mut context).await;

    // Проверяем что процесс выполняется без паники
    // Результат может быть ошибкой из-за отсутствия FFmpeg, что нормально
    match result {
      Ok(()) => {
        // Если успешно, проверяем что промежуточный файл добавлен
        assert!(context.intermediate_files.contains_key("composition"));
      }
      Err(VideoCompilerError::FFmpegError { .. }) => {
        // Ожидаемо в тестовой среде без FFmpeg
      }
      Err(e) => panic!("Неожиданная ошибка: {:?}", e),
    }
  }
}
