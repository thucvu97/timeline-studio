//! Project - Основная схема проекта и метаданные

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use super::effects::{Effect, Filter, Transition};
use super::export::ProjectSettings;
use super::subtitles::Subtitle;
use super::templates::{StyleTemplate, Template};
use super::timeline::{Timeline, Track};

/// Основная схема проекта Timeline Studio
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProjectSchema {
  /// Версия схемы проекта для совместимости
  pub version: String,
  /// Метаданные проекта
  pub metadata: ProjectMetadata,
  /// Настройки timeline (fps, разрешение, длительность)
  pub timeline: Timeline,
  /// Список треков (видео, аудио, субтитры)
  pub tracks: Vec<Track>,
  /// Глобальные эффекты проекта
  pub effects: Vec<Effect>,
  /// Переходы между клипами
  pub transitions: Vec<Transition>,
  /// Фильтры для визуальных эффектов
  pub filters: Vec<Filter>,
  /// Шаблоны многокамерных раскладок
  pub templates: Vec<Template>,
  /// Стилестические шаблоны (интро, аутро, титры)
  pub style_templates: Vec<StyleTemplate>,
  /// Субтитры проекта
  pub subtitles: Vec<Subtitle>,
  /// Настройки проекта и экспорта
  pub settings: ProjectSettings,
}

impl ProjectSchema {
  /// Создать новый пустой проект
  pub fn new(name: String) -> Self {
    Self {
      version: "1.0.0".to_string(),
      metadata: ProjectMetadata {
        name,
        description: None,
        created_at: Utc::now(),
        modified_at: Utc::now(),
        author: None,
      },
      timeline: Timeline::default(),
      tracks: Vec::new(),
      effects: Vec::new(),
      transitions: Vec::new(),
      filters: Vec::new(),
      templates: Vec::new(),
      style_templates: Vec::new(),
      subtitles: Vec::new(),
      settings: ProjectSettings::default(),
    }
  }

  /// Валидация схемы проекта
  pub fn validate(&self) -> Result<(), String> {
    // Проверка версии
    if self.version.is_empty() {
      return Err("Версия проекта не может быть пустой".to_string());
    }

    // Проверка timeline
    if self.timeline.fps == 0 {
      return Err("FPS должен быть больше 0".to_string());
    }

    if self.timeline.resolution.0 == 0 || self.timeline.resolution.1 == 0 {
      return Err("Разрешение должно быть больше 0x0".to_string());
    }

    // Проверка треков
    for track in &self.tracks {
      track.validate()?;
    }

    // Проверка клипов на пересечения по времени в одном треке
    for track in &self.tracks {
      let mut clips = track.clips.clone();
      clips.sort_by(|a, b| a.start_time.partial_cmp(&b.start_time).unwrap());

      for i in 0..clips.len().saturating_sub(1) {
        if clips[i].end_time > clips[i + 1].start_time {
          return Err(format!(
            "Клипы пересекаются по времени в треке '{}': {} и {}",
            track.name,
            clips[i].id,
            clips[i + 1].id
          ));
        }
      }
    }

    Ok(())
  }

  /// Получить общую длительность проекта
  pub fn get_duration(&self) -> f64 {
    self
      .tracks
      .iter()
      .flat_map(|track| &track.clips)
      .map(|clip| clip.end_time)
      .fold(0.0, f64::max)
  }

  /// Обновить время модификации
  pub fn touch(&mut self) {
    self.metadata.modified_at = Utc::now();
  }

  /// Найти клип по ID во всех треках
  pub fn find_clip_by_id(&self, clip_id: &str) -> Option<&super::timeline::Clip> {
    for track in &self.tracks {
      for clip in &track.clips {
        if clip.id == clip_id {
          return Some(clip);
        }
      }
    }
    None
  }

  /// Получить путь к файлу по ID клипа
  pub fn get_clip_file_path(&self, clip_id: &str) -> Option<String> {
    if let Some(clip) = self.find_clip_by_id(clip_id) {
      match &clip.source {
        super::timeline::ClipSource::File(path) => Some(path.clone()),
        _ => None,
      }
    } else {
      None
    }
  }
}

/// Метаданные проекта
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProjectMetadata {
  /// Название проекта
  pub name: String,
  /// Описание проекта
  pub description: Option<String>,
  /// Время создания
  pub created_at: DateTime<Utc>,
  /// Время последней модификации
  pub modified_at: DateTime<Utc>,
  /// Автор проекта
  pub author: Option<String>,
}
