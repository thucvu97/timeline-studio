//! FFmpeg Builder Commands - команды для работы с FFmpeg builder

use crate::video_compiler::error::Result;
use crate::video_compiler::ffmpeg_builder::inputs::InputBuilder;
use crate::video_compiler::ffmpeg_builder::outputs::OutputBuilder;
use crate::video_compiler::ffmpeg_builder::FFmpegBuilder;
use crate::video_compiler::schema::ProjectSchema;
use crate::video_compiler::VideoCompilerState;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use tauri::State;

/// Временный сегмент для работы с FFmpeg builder
#[derive(Debug, Clone)]
struct TimelineSegment {
  pub id: String,
  pub start_time: f64,
  pub end_time: f64,
  pub clip_id: String,
  pub track_id: String,
}

/// Параметры для добавления сегментных входов
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SegmentInputParams {
  pub project: ProjectSchema,
  pub temp_dir: String,
}

/// Результат добавления сегментных входов
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SegmentInputResult {
  pub success: bool,
  pub input_count: usize,
  pub clip_indices: HashMap<String, usize>,
  pub error: Option<String>,
}

/// Добавить сегментные входы в FFmpeg builder
#[tauri::command]
pub async fn add_segment_inputs_to_builder(
  params: SegmentInputParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<SegmentInputResult> {
  use tokio::process::Command;

  // Создаем builder с проектом
  let _builder = FFmpegBuilder::new(params.project.clone());
  let input_builder = InputBuilder::new(&params.project);

  // Создаем команду
  let mut cmd = Command::new("ffmpeg");

  // Добавляем входы для всей временной линии проекта
  let duration = params.project.timeline.duration;
  input_builder
    .add_segment_inputs(&mut cmd, 0.0, duration)
    .await?;

  // Извлекаем клипы для индексов
  let clips: HashMap<String, usize> = params
    .project
    .tracks
    .iter()
    .flat_map(|track| track.clips.iter())
    .enumerate()
    .map(|(index, clip)| (clip.id.clone(), index))
    .collect();

  Ok(SegmentInputResult {
    success: true,
    input_count: clips.len(),
    clip_indices: clips,
    error: None,
  })
}

/// Параметры для настроек пререндеринга
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PrerenderSettingsParams {
  pub project: ProjectSchema,
  pub output_path: String,
  pub width: u32,
  pub height: u32,
  pub fps: f64,
  pub video_codec: String,
  pub audio_codec: String,
}

/// Создать команду FFmpeg с настройками пререндеринга
#[tauri::command]
pub async fn create_ffmpeg_with_prerender_settings(
  params: PrerenderSettingsParams,
  _state: State<'_, VideoCompilerState>,
) -> Result<String> {
  use crate::video_compiler::ffmpeg_builder::builder::FFmpegBuilderSettings;
  use tokio::process::Command;

  // Создаем builder с проектом
  let _builder = FFmpegBuilder::new(params.project.clone());
  let settings = FFmpegBuilderSettings::default();
  let output_builder = OutputBuilder::new(&params.project, &settings);

  // Создаем команду
  let mut cmd = Command::new("ffmpeg");

  // Добавляем настройки пререндеринга
  let output_path_str = params.output_path.clone();
  let output_path = PathBuf::from(&params.output_path);

  // Так как метод ожидает настройки из project.settings, а у нас они в параметрах,
  // нужно сначала обновить настройки проекта
  let mut updated_project = params.project.clone();
  updated_project.settings.resolution.width = params.width;
  updated_project.settings.resolution.height = params.height;
  updated_project.settings.frame_rate = params.fps;

  let output_builder_updated = OutputBuilder::new(&updated_project, &settings);
  output_builder_updated
    .add_prerender_settings(&mut cmd, &output_path)
    .await?;

  // Формируем строку команды для отображения
  // Так как tokio::process::Command не имеет get_args(), просто возвращаем примерную команду
  Ok(format!(
    "ffmpeg -c:v prores_ks -profile:v 3 -c:a pcm_s16le -s {}x{} -r {} {}",
    params.width, params.height, params.fps, output_path_str
  ))
}

/// Получить индекс входа для клипа
#[tauri::command]
pub async fn get_clip_input_index_from_builder(
  clip_id: String,
  project: ProjectSchema,
  _state: State<'_, VideoCompilerState>,
) -> Result<Option<usize>> {
  // Проверяем, есть ли клип с таким ID
  let clip_exists = project
    .tracks
    .iter()
    .flat_map(|track| track.clips.iter())
    .any(|clip| clip.id == clip_id);

  if !clip_exists {
    return Ok(None);
  }

  // Создаем builder с проектом
  let _builder = FFmpegBuilder::new(project.clone());
  let _input_builder = InputBuilder::new(&project);

  // Находим индекс клипа
  let index = project
    .tracks
    .iter()
    .flat_map(|track| track.clips.iter())
    .position(|clip| clip.id == clip_id);

  Ok(index)
}

/// Информация о FFmpeg builder
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BuilderInfo {
  pub supports_segment_inputs: bool,
  pub supports_prerender_settings: bool,
  pub max_concurrent_inputs: usize,
  pub supported_codecs: Vec<String>,
}

/// Получить информацию о возможностях FFmpeg builder
#[tauri::command]
pub async fn get_ffmpeg_builder_info(_state: State<'_, VideoCompilerState>) -> Result<BuilderInfo> {
  Ok(BuilderInfo {
    supports_segment_inputs: true,
    supports_prerender_settings: true,
    max_concurrent_inputs: 100,
    supported_codecs: vec![
      "h264".to_string(),
      "h265".to_string(),
      "vp9".to_string(),
      "av1".to_string(),
      "prores".to_string(),
    ],
  })
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_segment_input_params_serialization() {
    use crate::video_compiler::schema::{ProjectMetadata, ProjectSettings, Timeline};
    use chrono::Utc;

    let params = SegmentInputParams {
      project: ProjectSchema {
        version: "1.0.0".to_string(),
        metadata: ProjectMetadata {
          name: "Test".to_string(),
          description: None,
          created_at: Utc::now(),
          modified_at: Utc::now(),
          author: None,
        },
        timeline: Timeline::default(),
        tracks: vec![],
        effects: vec![],
        transitions: vec![],
        filters: vec![],
        templates: vec![],
        style_templates: vec![],
        subtitles: vec![],
        settings: ProjectSettings::default(),
      },
      temp_dir: "/tmp".to_string(),
    };

    let json = serde_json::to_string(&params).unwrap();
    assert!(json.contains("project"));
    assert!(json.contains("temp_dir"));
  }

  #[test]
  fn test_prerender_settings_params_serialization() {
    use crate::video_compiler::schema::{ProjectMetadata, ProjectSettings, Timeline};
    use chrono::Utc;

    let params = PrerenderSettingsParams {
      project: ProjectSchema {
        version: "1.0.0".to_string(),
        metadata: ProjectMetadata {
          name: "Test".to_string(),
          description: None,
          created_at: Utc::now(),
          modified_at: Utc::now(),
          author: None,
        },
        timeline: Timeline::default(),
        tracks: vec![],
        effects: vec![],
        transitions: vec![],
        filters: vec![],
        templates: vec![],
        style_templates: vec![],
        subtitles: vec![],
        settings: ProjectSettings::default(),
      },
      output_path: "/tmp/output.mp4".to_string(),
      width: 1920,
      height: 1080,
      fps: 30.0,
      video_codec: "h264".to_string(),
      audio_codec: "aac".to_string(),
    };

    let json = serde_json::to_string(&params).unwrap();
    assert!(json.contains("1920"));
    assert!(json.contains("h264"));
  }
}
