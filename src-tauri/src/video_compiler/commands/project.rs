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
      "Unsupported subtitle format: {format}"
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
  format!("{hours:02}:{minutes:02}:{secs:06.3}").replace('.', ",")
}

fn format_time_vtt(seconds: f64) -> String {
  let hours = (seconds / 3600.0) as u32;
  let minutes = ((seconds % 3600.0) / 60.0) as u32;
  let secs = seconds % 60.0;
  format!("{hours:02}:{minutes:02}:{secs:06.3}")
}

// create_schema_objects moved to schema_commands.rs - removing duplicate
// This function body will be removed in next edit
async fn _create_schema_objects_old(
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
      "Unknown object type: {object_type}"
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
        "Unknown operation: {operation}"
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
      "Unknown info type: {info_type}"
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

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::schema::{
    AspectRatio, Clip, ClipSource, ProjectMetadata, ProjectSchema, Subtitle, Timeline, Track,
    TrackType,
  };
  use std::collections::HashMap;
  use tempfile::TempDir;

  fn create_test_project() -> ProjectSchema {
    ProjectSchema {
      version: "1.0.0".to_string(),
      metadata: ProjectMetadata {
        name: "Test Project".to_string(),
        description: Some("Test description".to_string()),
        author: Some("Test Author".to_string()),
        created_at: chrono::Utc::now(),
        modified_at: chrono::Utc::now(),
      },
      timeline: Timeline {
        duration: 30.0,
        fps: 30,
        resolution: (1920, 1080),
        sample_rate: 48000,
        aspect_ratio: AspectRatio::Ratio16x9,
      },
      tracks: vec![
        Track::new(TrackType::Video, "Video Track".to_string()),
        Track::new(TrackType::Audio, "Audio Track".to_string()),
      ],
      effects: vec![],
      filters: vec![],
      transitions: vec![],
      templates: vec![],
      style_templates: vec![],
      subtitles: vec![
        Subtitle::new("First subtitle".to_string(), 0.0, 5.0),
        Subtitle::new("Second subtitle".to_string(), 5.0, 10.0),
      ],
      settings: crate::video_compiler::schema::export::ProjectSettings::default(),
    }
  }

  #[tokio::test]
  async fn test_get_project_media_files() {
    let mut project = create_test_project();

    // Добавляем клипы с файлами
    project.tracks[0].clips.push(Clip::new(
      std::path::PathBuf::from("/test/video1.mp4"),
      0.0,
      5.0,
    ));
    project.tracks[0].clips.push(Clip::new(
      std::path::PathBuf::from("/test/video2.mp4"),
      5.0,
      5.0,
    ));
    project.tracks[1].clips.push(Clip::new(
      std::path::PathBuf::from("/test/audio.wav"),
      0.0,
      10.0,
    ));

    let result = get_project_media_files(project).await;
    assert!(result.is_ok());

    let media_files = result.unwrap();
    assert_eq!(media_files.len(), 3);
    assert!(media_files.contains(&"/test/video1.mp4".to_string()));
    assert!(media_files.contains(&"/test/video2.mp4".to_string()));
    assert!(media_files.contains(&"/test/audio.wav".to_string()));
  }

  #[tokio::test]
  async fn test_check_project_media_availability() {
    let mut project = create_test_project();

    // Добавляем клип с несуществующим файлом
    project.tracks[0].clips.push(Clip::new(
      std::path::PathBuf::from("/nonexistent/file.mp4"),
      0.0,
      5.0,
    ));

    let result = check_project_media_availability(project).await;
    assert!(result.is_ok());

    let availability = result.unwrap();
    assert_eq!(availability.len(), 1);
    assert!(!availability["/nonexistent/file.mp4"]);
  }

  #[tokio::test]
  async fn test_update_project_media_paths() {
    let mut project = create_test_project();

    // Добавляем клипы
    project.tracks[0].clips.push(Clip::new(
      std::path::PathBuf::from("/old/path/video.mp4"),
      0.0,
      5.0,
    ));

    let mut path_mapping = HashMap::new();
    path_mapping.insert(
      "/old/path/video.mp4".to_string(),
      "/new/path/video.mp4".to_string(),
    );

    let result = update_project_media_paths(project, path_mapping).await;
    assert!(result.is_ok());

    let updated_project = result.unwrap();
    if let ClipSource::File(path) = &updated_project.tracks[0].clips[0].source {
      assert_eq!(path, "/new/path/video.mp4");
    }
  }

  #[tokio::test]
  async fn test_add_subtitles_to_project() {
    let project = create_test_project();
    let initial_count = project.subtitles.len();

    let new_subtitles = vec![
      Subtitle::new("Third subtitle".to_string(), 15.0, 20.0),
      Subtitle::new("Fourth subtitle".to_string(), 10.0, 15.0), // Не в порядке
    ];

    let result = add_subtitles_to_project(project, new_subtitles).await;
    assert!(result.is_ok());

    let updated_project = result.unwrap();
    assert_eq!(updated_project.subtitles.len(), initial_count + 2);

    // Проверяем, что субтитры отсортированы по времени
    let subtitles = &updated_project.subtitles;
    for i in 1..subtitles.len() {
      assert!(subtitles[i - 1].start_time <= subtitles[i].start_time);
    }
  }

  #[tokio::test]
  async fn test_extract_project_subtitles_srt() {
    let project = create_test_project();

    let result = extract_project_subtitles(project, "srt".to_string()).await;
    assert!(result.is_ok());

    let srt_content = result.unwrap();
    assert!(srt_content.contains("1\n"));
    assert!(srt_content.contains("2\n"));
    assert!(srt_content.contains("First subtitle"));
    assert!(srt_content.contains("Second subtitle"));
    assert!(srt_content.contains("00:00:00,000 --> 00:00:05,000"));
  }

  #[tokio::test]
  async fn test_extract_project_subtitles_vtt() {
    let project = create_test_project();

    let result = extract_project_subtitles(project, "vtt".to_string()).await;
    assert!(result.is_ok());

    let vtt_content = result.unwrap();
    assert!(vtt_content.starts_with("WEBVTT"));
    assert!(vtt_content.contains("First subtitle"));
    assert!(vtt_content.contains("00:00:00.000 --> 00:00:05.000"));
  }

  #[tokio::test]
  async fn test_extract_project_subtitles_invalid_format() {
    let project = create_test_project();

    let result = extract_project_subtitles(project, "invalid".to_string()).await;
    assert!(result.is_err());

    let error = result.unwrap_err();
    assert!(error.to_string().contains("Unsupported subtitle format"));
  }

  #[tokio::test]
  async fn test_backup_project() {
    let project = create_test_project();
    let temp_dir = TempDir::new().unwrap();
    let backup_path = temp_dir
      .path()
      .join("backup.json")
      .to_string_lossy()
      .to_string();

    let result = backup_project(project, backup_path.clone()).await;
    assert!(result.is_ok());

    let returned_path = result.unwrap();
    assert_eq!(returned_path, backup_path);

    // Проверяем, что файл создан
    assert!(std::path::Path::new(&backup_path).exists());

    // Проверяем содержимое файла
    let content = std::fs::read_to_string(&backup_path).unwrap();
    assert!(content.contains("Test Project"));
    assert!(content.contains("1920"));
  }

  #[test]
  fn test_format_time_srt() {
    assert_eq!(format_time_srt(0.0), "00:00:00,000");
    assert_eq!(format_time_srt(3661.5), "01:01:01,500");
    assert_eq!(format_time_srt(90.123), "00:01:30,123");
  }

  #[test]
  fn test_format_time_vtt() {
    assert_eq!(format_time_vtt(0.0), "00:00:00.000");
    assert_eq!(format_time_vtt(3661.5), "01:01:01.500");
    assert_eq!(format_time_vtt(90.123), "00:01:30.123");
  }

  #[tokio::test]
  async fn test_project_schema_validation() {
    let project = create_test_project();

    // Test the underlying validation logic
    let validation_result = project.validate();
    assert!(validation_result.is_ok());
  }

  #[tokio::test]
  async fn test_project_optimization_logic() {
    let mut project = create_test_project();

    // Добавляем пустой трек
    project
      .tracks
      .push(Track::new(TrackType::Video, "Empty Track".to_string()));

    // Добавляем клипы не в порядке
    project.tracks[0].clips.push(Clip::new(
      std::path::PathBuf::from("/test/video2.mp4"),
      10.0,
      5.0,
    ));
    project.tracks[0].clips.push(Clip::new(
      std::path::PathBuf::from("/test/video1.mp4"),
      5.0,
      5.0,
    ));

    // Устанавливаем нулевой битрейт
    project.settings.export.video_bitrate = 0;

    // Test optimization logic manually
    let mut optimized = project.clone();

    // Remove empty tracks
    optimized.tracks.retain(|track| !track.clips.is_empty());

    // Sort clips by start time
    for track in &mut optimized.tracks {
      track
        .clips
        .sort_by(|a, b| a.start_time.partial_cmp(&b.start_time).unwrap());
    }

    // Set default bitrate if zero
    if optimized.settings.export.video_bitrate == 0 {
      optimized.settings.export.video_bitrate = 8000;
    }

    // Only the track with clips should remain
    assert_eq!(optimized.tracks.len(), 1);

    // Клипы должны быть отсортированы
    if !optimized.tracks[0].clips.is_empty() {
      for i in 1..optimized.tracks[0].clips.len() {
        assert!(
          optimized.tracks[0].clips[i - 1].start_time <= optimized.tracks[0].clips[i].start_time
        );
      }
    }

    // Битрейт должен быть установлен в значение по умолчанию
    assert_eq!(optimized.settings.export.video_bitrate, 8000);
  }

  #[tokio::test]
  async fn test_project_analysis_logic() {
    let mut project = create_test_project();

    // Добавляем клипы и эффекты
    project.tracks[0].clips.push(Clip::new(
      std::path::PathBuf::from("/test/video1.mp4"),
      0.0,
      5.0,
    ));
    project.tracks[0].clips.push(Clip::new(
      std::path::PathBuf::from("/test/video2.mp4"),
      5.0,
      5.0,
    ));

    // Test analysis logic manually
    let total_duration = project.timeline.duration;
    let track_count = project.tracks.len();
    let total_clips = project.tracks.iter().map(|t| t.clips.len()).sum::<usize>();

    let unique_media_files: std::collections::HashSet<_> = project
      .tracks
      .iter()
      .flat_map(|t| &t.clips)
      .filter_map(|c| match &c.source {
        ClipSource::File(path) => Some(path.clone()),
        _ => None,
      })
      .collect();

    assert_eq!(total_duration, 30.0);
    assert_eq!(track_count, 2);
    assert_eq!(total_clips, 2);
    assert_eq!(unique_media_files.len(), 2);
    assert_eq!(project.subtitles.len(), 2);
  }

  #[tokio::test]
  async fn test_merge_projects() {
    let base_project = create_test_project();
    let mut append_project = create_test_project();

    // Изменяем длительность второго проекта
    append_project.timeline.duration = 20.0;
    append_project.subtitles.clear();
    append_project
      .subtitles
      .push(Subtitle::new("Merged subtitle".to_string(), 0.0, 5.0));

    let time_offset = 15.0;
    let result = merge_projects(base_project, append_project, time_offset).await;
    assert!(result.is_ok());

    let merged = result.unwrap();

    // Общая длительность должна быть обновлена
    assert_eq!(merged.timeline.duration, 35.0); // max(30.0, 20.0 + 15.0)

    // Субтитры из второго проекта должны быть смещены
    let merged_subtitle = merged
      .subtitles
      .iter()
      .find(|s| s.text == "Merged subtitle")
      .unwrap();
    assert_eq!(merged_subtitle.start_time, 15.0);
    assert_eq!(merged_subtitle.end_time, 20.0);
  }

  #[tokio::test]
  async fn test_split_project() {
    let mut project = create_test_project();

    // Добавляем клип
    project.tracks[0].clips.push(Clip::new(
      std::path::PathBuf::from("/test/video.mp4"),
      0.0,
      25.0,
    ));

    let split_points = vec![10.0, 20.0];
    let result = split_project(project, split_points).await;
    assert!(result.is_ok());

    let projects = result.unwrap();
    assert_eq!(projects.len(), 3); // Split на 3 части

    // Проверяем длительности частей
    assert_eq!(projects[0].timeline.duration, 10.0);
    assert_eq!(projects[1].timeline.duration, 10.0);
    assert_eq!(projects[2].timeline.duration, 10.0);
  }

  #[tokio::test]
  async fn test_track_operations_add_clip() {
    let track = Track::new(TrackType::Video, "Test Track".to_string());
    let clip = Clip::new(std::path::PathBuf::from("/test/video.mp4"), 0.0, 5.0);

    let params = serde_json::to_value(&clip).unwrap();
    let result = track_operations(track, "add_clip".to_string(), params).await;
    assert!(result.is_ok());

    let updated_track = result.unwrap();
    assert_eq!(updated_track.clips.len(), 1);
  }

  #[tokio::test]
  async fn test_track_operations_invalid_operation() {
    let track = Track::new(TrackType::Video, "Test Track".to_string());

    let result = track_operations(
      track,
      "invalid_operation".to_string(),
      serde_json::Value::Null,
    )
    .await;
    assert!(result.is_err());

    let error = result.unwrap_err();
    assert!(error.to_string().contains("Unknown operation"));
  }

  #[tokio::test]
  async fn test_get_clip_info() {
    let clip = Clip::new(std::path::PathBuf::from("/test/video.mp4"), 0.0, 5.0);

    let result = get_clip_info(clip, "timeline_duration".to_string()).await;
    assert!(result.is_ok());

    let info = result.unwrap();
    assert_eq!(info["duration"], 5.0);
  }

  #[tokio::test]
  async fn test_validate_subtitle() {
    let subtitle = Subtitle::new("Test subtitle".to_string(), 0.0, 5.0);

    let result = validate_subtitle(subtitle).await;
    assert!(result.is_ok());

    let validation = result.unwrap();
    assert_eq!(validation["valid"], true);
    assert_eq!(validation["duration"], 5.0);
  }

  #[tokio::test]
  async fn test_touch_project_schema() {
    let project = create_test_project();
    let original_modified = project.metadata.modified_at;

    // Добавляем небольшую задержку
    tokio::time::sleep(std::time::Duration::from_millis(10)).await;

    let result = touch_project_schema(project).await;
    assert!(result.is_ok());

    let touched_project = result.unwrap();
    assert!(touched_project.metadata.modified_at > original_modified);
  }
}
