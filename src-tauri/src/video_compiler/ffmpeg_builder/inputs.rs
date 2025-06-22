//! FFmpeg Builder - Модуль обработки входных источников

use std::path::PathBuf;
use tokio::process::Command;

use crate::video_compiler::error::Result;
use crate::video_compiler::schema::{ClipSource, ProjectSchema, TrackType};

/// Информация о входном источнике
#[derive(Debug, Clone)]
pub struct InputSource {
  /// Путь к файлу
  pub path: PathBuf,
  /// Время начала в источнике
  pub start_time: f64,
  /// Длительность
  pub duration: f64,
  /// Тип трека
  pub track_type: TrackType,
}

/// Построитель входных источников
pub struct InputBuilder<'a> {
  project: &'a ProjectSchema,
}

impl<'a> InputBuilder<'a> {
  /// Создать новый построитель входных источников
  pub fn new(project: &'a ProjectSchema) -> Self {
    Self { project }
  }

  /// Добавить входные источники
  pub async fn add_input_sources(&self, cmd: &mut Command) -> Result<()> {
    let sources = self.collect_input_sources().await?;

    for source in sources {
      self.add_input_source(cmd, &source)?;
    }

    Ok(())
  }

  /// Добавить входные источники для сегмента
  pub async fn add_segment_inputs(
    &self,
    cmd: &mut Command,
    start_time: f64,
    end_time: f64,
  ) -> Result<()> {
    let sources = self.collect_segment_sources(start_time, end_time).await?;

    for source in sources {
      self.add_input_source(cmd, &source)?;
    }

    Ok(())
  }

  /// Добавить один входной источник
  fn add_input_source(&self, cmd: &mut Command, source: &InputSource) -> Result<()> {
    // Время начала
    if source.start_time > 0.0 {
      cmd.args(["-ss", &source.start_time.to_string()]);
    }

    // Входной файл
    cmd.args(["-i", &source.path.to_string_lossy()]);

    // Специфичные настройки для типа трека
    match source.track_type {
      TrackType::Video => {
        // Для видео можем добавить дополнительные параметры декодирования
        if self.should_use_hardware_decoding() {
          cmd.args(["-hwaccel", "auto"]);
        }
      }
      TrackType::Audio => {
        // Для аудио можем настроить параметры декодирования
      }
      TrackType::Subtitle => {
        // Для субтитров используем специальные декодеры
      }
    }

    // Используем duration для ограничения длительности чтения
    if source.duration > 0.0 {
      cmd.args(["-t", &source.duration.to_string()]);
    }

    Ok(())
  }

  /// Собрать список входных источников
  pub async fn collect_input_sources(&self) -> Result<Vec<InputSource>> {
    let mut sources = Vec::new();

    for track in &self.project.tracks {
      if !track.enabled {
        continue;
      }

      for clip in &track.clips {
        if let ClipSource::File(path) = &clip.source {
          sources.push(InputSource {
            path: PathBuf::from(path),
            start_time: clip.source_start,
            duration: clip.get_source_duration(),
            track_type: track.track_type.clone(),
          });
        }
      }
    }

    Ok(sources)
  }

  /// Собрать источники для сегмента
  async fn collect_segment_sources(
    &self,
    start_time: f64,
    end_time: f64,
  ) -> Result<Vec<InputSource>> {
    let mut sources = Vec::new();

    for track in &self.project.tracks {
      if !track.enabled {
        continue;
      }

      for clip in &track.clips {
        let clip_duration = clip.end_time - clip.start_time;
        let clip_end = clip.start_time + clip_duration;

        // Проверяем пересечение с сегментом
        if clip.start_time < end_time && clip_end > start_time {
          // Вычисляем время начала в источнике с учетом сегмента
          let segment_start_in_clip = (start_time - clip.start_time).max(0.0);
          let source_start = clip.source_start + segment_start_in_clip;

          // Вычисляем длительность с учетом границ сегмента
          let segment_end_in_clip = (end_time - clip.start_time).min(clip_duration);
          let duration = segment_end_in_clip - segment_start_in_clip;

          if let ClipSource::File(path) = &clip.source {
            sources.push(InputSource {
              path: PathBuf::from(path),
              start_time: source_start,
              duration,
              track_type: track.track_type.clone(),
            });
          }
        }
      }
    }

    Ok(sources)
  }

  /// Получить индекс входа для клипа
  pub fn get_clip_input_index(&self, clip_id: &str) -> Option<usize> {
    let mut input_index = 0;

    for track in &self.project.tracks {
      if !track.enabled {
        continue;
      }

      for clip in &track.clips {
        if clip.id == clip_id {
          return Some(input_index);
        }
        input_index += 1;
      }
    }

    None
  }

  /// Проверить, нужно ли использовать аппаратное декодирование
  fn should_use_hardware_decoding(&self) -> bool {
    // Здесь можно добавить логику определения необходимости HW декодирования
    false
  }
}
