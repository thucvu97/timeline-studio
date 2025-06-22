//! Project - Команды управления проектами
//!
//! Команды для валидации, анализа и управления проектами,
//! включая обработку субтитров и оптимизацию.

use std::collections::HashMap;
use std::path::Path;
use tauri::State;

use crate::video_compiler::error::{Result, VideoCompilerError};
use crate::video_compiler::schema::{Clip, ClipSource, ProjectSchema, Subtitle, Track};

use super::state::VideoCompilerState;

/// Валидировать схему проекта
#[tauri::command]
pub async fn validate_project_schema(
  project_schema: ProjectSchema,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  // Базовая валидация схемы
  match project_schema.validate() {
    Ok(_) => Ok(serde_json::json!({
      "is_valid": true,
      "errors": [],
      "warnings": [],
      "info": ["Project schema is valid"],
    })),
    Err(e) => Ok(serde_json::json!({
      "is_valid": false,
      "errors": [e.to_string()],
      "warnings": [],
      "info": [],
    })),
  }
}

/// Оптимизировать схему проекта
#[tauri::command]
pub async fn optimize_project_schema(
  mut project_schema: ProjectSchema,
  _state: State<'_, VideoCompilerState>,
) -> Result<ProjectSchema> {
  // Удаляем пустые треки
  project_schema
    .tracks
    .retain(|track| !track.clips.is_empty());

  // Сортируем клипы по времени начала
  for track in &mut project_schema.tracks {
    track
      .clips
      .sort_by(|a, b| a.start_time.partial_cmp(&b.start_time).unwrap());
  }

  // Оптимизируем настройки экспорта
  if project_schema.settings.export.video_bitrate == 0 {
    project_schema.settings.export.video_bitrate = 8000; // По умолчанию 8 Mbps
  }

  Ok(project_schema)
}

/// Анализировать проект и получить статистику
#[tauri::command]
pub async fn analyze_project(
  project_schema: ProjectSchema,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let total_duration = project_schema.timeline.duration;
  let track_count = project_schema.tracks.len();
  let total_clips = project_schema
    .tracks
    .iter()
    .map(|t| t.clips.len())
    .sum::<usize>();

  let unique_media_files: std::collections::HashSet<_> = project_schema
    .tracks
    .iter()
    .flat_map(|t| &t.clips)
    .filter_map(|c| match &c.source {
      ClipSource::File(path) => Some(path.clone()),
      _ => None,
    })
    .collect();

  let effects_count = project_schema
    .tracks
    .iter()
    .flat_map(|t| &t.clips)
    .map(|c| c.effects.len())
    .sum::<usize>();

  // Переходы теперь хранятся отдельно в project_schema.transitions
  let transitions_count = project_schema.transitions.len();

  Ok(serde_json::json!({
    "duration": total_duration,
    "tracks": track_count,
    "clips": total_clips,
    "unique_media_files": unique_media_files.len(),
    "effects": effects_count,
    "transitions": transitions_count,
    "subtitles": project_schema.subtitles.len(),
    "resolution": {
      "width": project_schema.settings.resolution.width,
      "height": project_schema.settings.resolution.height,
    },
    "frame_rate": project_schema.settings.frame_rate,
    "export_format": project_schema.settings.export.format,
  }))
}

/// Получить список медиафайлов в проекте
#[tauri::command]
pub async fn get_project_media_files(project_schema: ProjectSchema) -> Result<Vec<String>> {
  let media_files: std::collections::HashSet<_> = project_schema
    .tracks
    .iter()
    .flat_map(|t| &t.clips)
    .filter_map(|c| match &c.source {
      ClipSource::File(path) => Some(path.clone()),
      _ => None,
    })
    .collect();

  Ok(media_files.into_iter().collect())
}

/// Проверить доступность медиафайлов проекта
#[tauri::command]
pub async fn check_project_media_availability(
  project_schema: ProjectSchema,
) -> Result<HashMap<String, bool>> {
  let media_files = get_project_media_files(project_schema).await?;
  let mut availability = HashMap::new();

  for file_path in media_files {
    let exists = Path::new(&file_path).exists();
    availability.insert(file_path, exists);
  }

  Ok(availability)
}

/// Обновить пути медиафайлов в проекте
#[tauri::command]
pub async fn update_project_media_paths(
  mut project_schema: ProjectSchema,
  path_mapping: HashMap<String, String>,
) -> Result<ProjectSchema> {
  for track in &mut project_schema.tracks {
    for clip in &mut track.clips {
      if let ClipSource::File(path) = &mut clip.source {
        if let Some(new_path) = path_mapping.get(path) {
          *path = new_path.clone();
        }
      }
    }
  }

  Ok(project_schema)
}

/// Добавить субтитры в проект
#[tauri::command]
pub async fn add_subtitles_to_project(
  mut project_schema: ProjectSchema,
  subtitles: Vec<Subtitle>,
) -> Result<ProjectSchema> {
  project_schema.subtitles.extend(subtitles);

  // Сортируем субтитры по времени начала
  project_schema
    .subtitles
    .sort_by(|a, b| a.start_time.partial_cmp(&b.start_time).unwrap());

  Ok(project_schema)
}

/// Извлечь субтитры из проекта
#[tauri::command]
pub async fn extract_project_subtitles(
  project_schema: ProjectSchema,
  format: String,
) -> Result<String> {
  let subtitles = &project_schema.subtitles;

  match format.as_str() {
    "srt" => {
      let mut srt_content = String::new();
      for (i, subtitle) in subtitles.iter().enumerate() {
        srt_content.push_str(&format!(
          "{}\n{} --> {}\n{}\n\n",
          i + 1,
          format_time_srt(subtitle.start_time),
          format_time_srt(subtitle.end_time),
          subtitle.text
        ));
      }
      Ok(srt_content)
    }
    "vtt" => {
      let mut vtt_content = String::from("WEBVTT\n\n");
      for subtitle in subtitles {
        vtt_content.push_str(&format!(
          "{} --> {}\n{}\n\n",
          format_time_vtt(subtitle.start_time),
          format_time_vtt(subtitle.end_time),
          subtitle.text
        ));
      }
      Ok(vtt_content)
    }
    _ => Err(VideoCompilerError::InvalidParameter(format!(
      "Unsupported subtitle format: {}",
      format
    ))),
  }
}

/// Создать резервную копию проекта
#[tauri::command]
pub async fn backup_project(project_schema: ProjectSchema, backup_path: String) -> Result<String> {
  let json = serde_json::to_string_pretty(&project_schema)
    .map_err(|e| VideoCompilerError::SerializationError(e.to_string()))?;

  std::fs::write(&backup_path, json).map_err(|e| VideoCompilerError::IoError(e.to_string()))?;

  Ok(backup_path)
}

/// Объединить два проекта
#[tauri::command]
pub async fn merge_projects(
  mut base_project: ProjectSchema,
  append_project: ProjectSchema,
  time_offset: f64,
) -> Result<ProjectSchema> {
  // Добавляем треки из второго проекта
  for mut track in append_project.tracks {
    // Смещаем все клипы на time_offset
    for clip in &mut track.clips {
      clip.start_time += time_offset;
    }
    base_project.tracks.push(track);
  }

  // Добавляем субтитры
  for mut subtitle in append_project.subtitles {
    subtitle.start_time += time_offset;
    subtitle.end_time += time_offset;
    base_project.subtitles.push(subtitle);
  }

  // Обновляем общую длительность
  base_project.timeline.duration = base_project
    .timeline
    .duration
    .max(append_project.timeline.duration + time_offset);

  Ok(base_project)
}

/// Разделить проект на части
#[tauri::command]
pub async fn split_project(
  project_schema: ProjectSchema,
  split_points: Vec<f64>,
) -> Result<Vec<ProjectSchema>> {
  let mut projects = Vec::new();
  let mut current_start = 0.0;

  for split_point in split_points
    .iter()
    .chain(&[project_schema.timeline.duration])
  {
    let mut new_project = project_schema.clone();
    new_project.tracks.clear();
    new_project.subtitles.clear();

    // Копируем только клипы в диапазоне
    for track in &project_schema.tracks {
      let mut new_track = track.clone();
      new_track.clips.clear();

      for clip in &track.clips {
        let clip_end = clip.end_time;
        if clip.start_time < *split_point && clip_end > current_start {
          let mut new_clip = clip.clone();

          // Обрезаем клип если нужно
          if clip.start_time < current_start {
            let offset = current_start - clip.start_time;
            new_clip.source_start = clip.source_start + offset;
            new_clip.start_time = 0.0;
            new_clip.end_time = clip.end_time - clip.start_time - offset;
          } else {
            new_clip.start_time -= current_start;
            new_clip.end_time -= current_start;
          }

          if clip_end > *split_point {
            new_clip.end_time = *split_point - current_start;
          }

          new_track.clips.push(new_clip);
        }
      }

      if !new_track.clips.is_empty() {
        new_project.tracks.push(new_track);
      }
    }

    // Копируем субтитры в диапазоне
    for subtitle in &project_schema.subtitles {
      if subtitle.start_time < *split_point && subtitle.end_time > current_start {
        let mut new_subtitle = subtitle.clone();
        new_subtitle.start_time = (subtitle.start_time - current_start).max(0.0);
        new_subtitle.end_time =
          (subtitle.end_time - current_start).min(*split_point - current_start);
        new_project.subtitles.push(new_subtitle);
      }
    }

    new_project.timeline.duration = *split_point - current_start;
    projects.push(new_project);
    current_start = *split_point;
  }

  Ok(projects)
}

// Вспомогательные функции для форматирования времени
fn format_time_srt(seconds: f64) -> String {
  let hours = (seconds / 3600.0) as u32;
  let minutes = ((seconds % 3600.0) / 60.0) as u32;
  let secs = seconds % 60.0;
  format!("{:02}:{:02}:{:06.3}", hours, minutes, secs).replace('.', ",")
}

fn format_time_vtt(seconds: f64) -> String {
  let hours = (seconds / 3600.0) as u32;
  let minutes = ((seconds % 3600.0) / 60.0) as u32;
  let secs = seconds % 60.0;
  format!("{:02}:{:02}:{:06.3}", hours, minutes, secs)
}

/// Создать новые объекты схемы
#[tauri::command]
pub async fn create_schema_objects(
  object_type: String,
  params: serde_json::Value,
) -> Result<serde_json::Value> {
  use crate::video_compiler::schema::{
    templates::{StyleTemplate, Template},
    timeline::{Clip, Track, TrackType},
    Effect, Filter, Resolution, Subtitle, SubtitleAnimation,
  };

  match object_type.as_str() {
    "resolution" => {
      let width = params.get("width").and_then(|v| v.as_u64()).unwrap_or(1920) as u32;
      let height = params
        .get("height")
        .and_then(|v| v.as_u64())
        .unwrap_or(1080) as u32;
      let resolution = Resolution::new(width, height);
      Ok(serde_json::to_value(resolution)?)
    }
    "hd_resolution" => {
      let resolution = Resolution::hd();
      Ok(serde_json::to_value(resolution)?)
    }
    "uhd_resolution" => {
      let resolution = Resolution::uhd_4k();
      Ok(serde_json::to_value(resolution)?)
    }
    "effect" => {
      use crate::video_compiler::schema::effects::EffectType;
      let name = params
        .get("name")
        .and_then(|v| v.as_str())
        .unwrap_or("Custom Effect")
        .to_string();
      let effect_type = params
        .get("effect_type")
        .and_then(|v| v.as_str())
        .map(|t| match t {
          "blur" => EffectType::Blur,
          "brightness" => EffectType::Brightness,
          "contrast" => EffectType::Contrast,
          "speed" => EffectType::Speed,
          "reverse" => EffectType::Reverse,
          "grayscale" => EffectType::Grayscale,
          "sepia" => EffectType::Sepia,
          "saturation" => EffectType::Saturation,
          "hue_rotate" => EffectType::HueRotate,
          "vintage" => EffectType::Vintage,
          _ => EffectType::Blur,
        })
        .unwrap_or(EffectType::Blur);
      let effect = Effect::new(effect_type, name);
      Ok(serde_json::to_value(effect)?)
    }
    "filter" => {
      use crate::video_compiler::schema::effects::FilterType;
      let name = params
        .get("name")
        .and_then(|v| v.as_str())
        .unwrap_or("Custom Filter")
        .to_string();
      let filter_type = params
        .get("filter_type")
        .and_then(|v| v.as_str())
        .map(|t| match t {
          "brightness" => FilterType::Brightness,
          "contrast" => FilterType::Contrast,
          "saturation" => FilterType::Saturation,
          "hue" => FilterType::Hue,
          "blur" => FilterType::Blur,
          "sharpen" => FilterType::Sharpen,
          "vignette" => FilterType::Vignette,
          "grain" => FilterType::Grain,
          "glow" => FilterType::Glow,
          "shadows_highlights" => FilterType::ShadowsHighlights,
          _ => FilterType::Brightness,
        })
        .unwrap_or(FilterType::Brightness);
      let filter = Filter::new(filter_type, name);
      Ok(serde_json::to_value(filter)?)
    }
    "subtitle" => {
      let text = params
        .get("text")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
      let start = params
        .get("start_time")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);
      let end = params
        .get("end_time")
        .and_then(|v| v.as_f64())
        .unwrap_or(1.0);
      let subtitle = Subtitle::new(text, start, end);
      Ok(serde_json::to_value(subtitle)?)
    }
    "subtitle_animation" => {
      use crate::video_compiler::schema::subtitles::SubtitleAnimationType;
      let animation_type = params
        .get("animation_type")
        .and_then(|v| v.as_str())
        .map(|t| match t {
          "fade_in" => SubtitleAnimationType::FadeIn,
          "fade_out" => SubtitleAnimationType::FadeOut,
          "slide_in" => SubtitleAnimationType::SlideIn,
          "slide_out" => SubtitleAnimationType::SlideOut,
          "scale_in" => SubtitleAnimationType::ScaleIn,
          "scale_out" => SubtitleAnimationType::ScaleOut,
          "typewriter" => SubtitleAnimationType::Typewriter,
          _ => SubtitleAnimationType::FadeIn,
        })
        .unwrap_or(SubtitleAnimationType::FadeIn);
      let duration = params
        .get("duration")
        .and_then(|v| v.as_f64())
        .unwrap_or(1.0);
      let animation = SubtitleAnimation::new(animation_type, duration);
      Ok(serde_json::to_value(animation)?)
    }
    "template" => {
      use crate::video_compiler::schema::templates::TemplateType;
      let name = params
        .get("name")
        .and_then(|v| v.as_str())
        .unwrap_or("New Template")
        .to_string();
      let screens = params.get("screens").and_then(|v| v.as_u64()).unwrap_or(2) as usize;
      let template_type = params
        .get("template_type")
        .and_then(|v| v.as_str())
        .map(|t| match t {
          "vertical" => TemplateType::Vertical,
          "horizontal" => TemplateType::Horizontal,
          "diagonal" => TemplateType::Diagonal,
          "grid" => TemplateType::Grid,
          _ => TemplateType::Custom,
        })
        .unwrap_or(TemplateType::Vertical);
      let template = Template::new(template_type, name, screens);
      Ok(serde_json::to_value(template)?)
    }
    "style_template" => {
      use crate::video_compiler::schema::templates::{StyleTemplateCategory, StyleTemplateStyle};
      let name = params
        .get("name")
        .and_then(|v| v.as_str())
        .unwrap_or("New Style")
        .to_string();
      let category = params
        .get("category")
        .and_then(|v| v.as_str())
        .map(|c| match c {
          "intro" => StyleTemplateCategory::Intro,
          "outro" => StyleTemplateCategory::Outro,
          "lower_third" => StyleTemplateCategory::LowerThird,
          "title" => StyleTemplateCategory::Title,
          "transition" => StyleTemplateCategory::Transition,
          _ => StyleTemplateCategory::Overlay,
        })
        .unwrap_or(StyleTemplateCategory::Intro);
      let style = params
        .get("style")
        .and_then(|v| v.as_str())
        .map(|s| match s {
          "vintage" => StyleTemplateStyle::Vintage,
          "minimal" => StyleTemplateStyle::Minimal,
          "corporate" => StyleTemplateStyle::Corporate,
          "creative" => StyleTemplateStyle::Creative,
          "cinematic" => StyleTemplateStyle::Cinematic,
          _ => StyleTemplateStyle::Modern,
        })
        .unwrap_or(StyleTemplateStyle::Modern);
      let duration = params
        .get("duration")
        .and_then(|v| v.as_f64())
        .unwrap_or(5.0);
      let style_template = StyleTemplate::new(name, category, style, duration);
      Ok(serde_json::to_value(style_template)?)
    }
    "track" => {
      let track_type_str = params
        .get("track_type")
        .and_then(|v| v.as_str())
        .unwrap_or("video");
      let track_type = match track_type_str {
        "audio" => TrackType::Audio,
        "subtitle" => TrackType::Subtitle,
        _ => TrackType::Video,
      };
      let name = params
        .get("name")
        .and_then(|v| v.as_str())
        .unwrap_or("New Track")
        .to_string();
      let track = Track::new(track_type, name);
      Ok(serde_json::to_value(track)?)
    }
    "clip" => {
      let source_path = params
        .get("source_path")
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();
      let start_time = params
        .get("start_time")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);
      let duration = params
        .get("duration")
        .and_then(|v| v.as_f64())
        .unwrap_or(1.0);
      let clip = Clip::new(std::path::PathBuf::from(source_path), start_time, duration);
      Ok(serde_json::to_value(clip)?)
    }
    _ => Err(VideoCompilerError::InvalidParameter(format!(
      "Unknown object type: {}",
      object_type
    ))),
  }
}

/// Операции с треками
#[tauri::command]
pub async fn track_operations(
  mut track: Track,
  operation: String,
  params: serde_json::Value,
) -> Result<Track> {
  match operation.as_str() {
    "add_clip" => {
      if let Ok(clip) = serde_json::from_value::<Clip>(params) {
        track.add_clip(clip);
      }
    }
    "remove_clip" => {
      if let Some(clip_id) = params.get("clip_id").and_then(|v| v.as_str()) {
        track.remove_clip(clip_id);
      }
    }
    _ => {
      return Err(VideoCompilerError::InvalidParameter(format!(
        "Unknown operation: {}",
        operation
      )))
    }
  }

  Ok(track)
}

/// Информация о клипе
#[tauri::command]
pub async fn get_clip_info(clip: Clip, info_type: String) -> Result<serde_json::Value> {
  match info_type.as_str() {
    "timeline_duration" => Ok(serde_json::json!({
      "duration": clip.get_timeline_duration()
    })),
    "contains_time" => {
      // Получаем время из параметров (не очень элегантно, но для примера)
      let time = 0.0; // Нужно передать время как параметр
      Ok(serde_json::json!({
        "contains": clip.contains_time(time)
      }))
    }
    _ => Err(VideoCompilerError::InvalidParameter(format!(
      "Unknown info type: {}",
      info_type
    ))),
  }
}

/// Валидация субтитров
#[tauri::command]
pub async fn validate_subtitle(subtitle: Subtitle) -> Result<serde_json::Value> {
  match subtitle.validate() {
    Ok(_) => Ok(serde_json::json!({
      "valid": true,
      "duration": subtitle.get_duration(),
    })),
    Err(e) => Ok(serde_json::json!({
      "valid": false,
      "error": e,
      "duration": subtitle.get_duration(),
    })),
  }
}

/// Обновить время доступа к проекту в схеме
#[tauri::command]
pub async fn touch_project_schema(mut project: ProjectSchema) -> Result<ProjectSchema> {
  project.touch();
  Ok(project)
}
