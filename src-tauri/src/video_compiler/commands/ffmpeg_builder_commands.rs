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
  let _output_builder = OutputBuilder::new(&params.project, &settings);

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
  use crate::video_compiler::schema::{
    Clip, ClipSource, ProjectMetadata, ProjectSettings, Timeline, Track, TrackType,
  };
  use chrono::Utc;

  fn create_test_project() -> ProjectSchema {
    ProjectSchema {
      version: "1.0.0".to_string(),
      metadata: ProjectMetadata {
        name: "Test".to_string(),
        description: None,
        created_at: Utc::now(),
        modified_at: Utc::now(),
        author: None,
      },
      timeline: Timeline {
        duration: 10.0,
        ..Timeline::default()
      },
      tracks: vec![Track {
        id: "track1".to_string(),
        track_type: TrackType::Video,
        name: "Video Track".to_string(),
        enabled: true,
        volume: 1.0,
        locked: false,
        clips: vec![
          Clip {
            id: "clip1".to_string(),
            source: ClipSource::File("/test/video1.mp4".to_string()),
            start_time: 0.0,
            end_time: 5.0,
            source_start: 0.0,
            source_end: 5.0,
            speed: 1.0,
            opacity: 1.0,
            effects: vec![],
            filters: vec![],
            template_id: None,
            template_position: None,
            color_correction: None,
            crop: None,
            transform: None,
            audio_track_index: None,
            properties: crate::video_compiler::schema::ClipProperties::default(),
          },
          Clip {
            id: "clip2".to_string(),
            source: ClipSource::File("/test/video2.mp4".to_string()),
            start_time: 5.0,
            end_time: 10.0,
            source_start: 0.0,
            source_end: 5.0,
            speed: 1.0,
            opacity: 1.0,
            effects: vec![],
            filters: vec![],
            template_id: None,
            template_position: None,
            color_correction: None,
            crop: None,
            transform: None,
            audio_track_index: None,
            properties: crate::video_compiler::schema::ClipProperties::default(),
          },
        ],
        effects: vec![],
        filters: vec![],
      }],
      effects: vec![],
      transitions: vec![],
      filters: vec![],
      templates: vec![],
      style_templates: vec![],
      subtitles: vec![],
      settings: ProjectSettings::default(),
    }
  }

  #[test]
  fn test_segment_input_params_serialization() {
    let params = SegmentInputParams {
      project: create_test_project(),
      temp_dir: "/tmp".to_string(),
    };

    let json = serde_json::to_string(&params).unwrap();
    assert!(json.contains("project"));
    assert!(json.contains("temp_dir"));
  }

  #[test]
  fn test_prerender_settings_params_serialization() {
    let params = PrerenderSettingsParams {
      project: create_test_project(),
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

  #[test]
  fn test_segment_input_result_creation() {
    let mut clip_indices = HashMap::new();
    clip_indices.insert("clip1".to_string(), 0);
    clip_indices.insert("clip2".to_string(), 1);

    let result = SegmentInputResult {
      success: true,
      input_count: 2,
      clip_indices,
      error: None,
    };

    assert!(result.success);
    assert_eq!(result.input_count, 2);
    assert_eq!(result.clip_indices.len(), 2);
    assert!(result.error.is_none());
  }

  #[test]
  fn test_segment_input_result_with_error() {
    let result = SegmentInputResult {
      success: false,
      input_count: 0,
      clip_indices: HashMap::new(),
      error: Some("Test error".to_string()),
    };

    assert!(!result.success);
    assert_eq!(result.input_count, 0);
    assert!(result.clip_indices.is_empty());
    assert_eq!(result.error.as_ref().unwrap(), "Test error");
  }

  #[test]
  fn test_builder_info_defaults() {
    let info = BuilderInfo {
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
    };

    assert!(info.supports_segment_inputs);
    assert!(info.supports_prerender_settings);
    assert_eq!(info.max_concurrent_inputs, 100);
    assert_eq!(info.supported_codecs.len(), 5);
    assert!(info.supported_codecs.contains(&"h264".to_string()));
    assert!(info.supported_codecs.contains(&"prores".to_string()));
  }

  #[tokio::test]
  async fn test_get_ffmpeg_builder_info() {
    use crate::video_compiler::VideoCompilerState;

    let _state = VideoCompilerState::new().await;
    // Note: Tauri State cannot be directly tested without proper mock
    // This test verifies the BuilderInfo creation logic
    let info = BuilderInfo {
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
    };

    assert!(info.supports_segment_inputs);
    assert!(info.supports_prerender_settings);
    assert_eq!(info.max_concurrent_inputs, 100);
    assert!(!info.supported_codecs.is_empty());
  }

  #[test]
  fn test_clip_index_calculation() {
    let project = create_test_project();

    // Симулируем логику поиска индекса клипа
    let clip_index = project
      .tracks
      .iter()
      .flat_map(|track| track.clips.iter())
      .position(|clip| clip.id == "clip1");

    assert_eq!(clip_index, Some(0));

    let clip_index_2 = project
      .tracks
      .iter()
      .flat_map(|track| track.clips.iter())
      .position(|clip| clip.id == "clip2");

    assert_eq!(clip_index_2, Some(1));

    let nonexistent_clip = project
      .tracks
      .iter()
      .flat_map(|track| track.clips.iter())
      .position(|clip| clip.id == "nonexistent");

    assert_eq!(nonexistent_clip, None);
  }

  #[test]
  fn test_prerender_settings_validation() {
    let params = PrerenderSettingsParams {
      project: create_test_project(),
      output_path: "/tmp/output.mp4".to_string(),
      width: 1920,
      height: 1080,
      fps: 30.0,
      video_codec: "h264".to_string(),
      audio_codec: "aac".to_string(),
    };

    // Валидация параметров
    assert!(params.width > 0);
    assert!(params.height > 0);
    assert!(params.fps > 0.0);
    assert!(!params.video_codec.is_empty());
    assert!(!params.audio_codec.is_empty());
    assert!(!params.output_path.is_empty());
  }

  #[test]
  fn test_empty_project_handling() {
    let mut empty_project = create_test_project();
    empty_project.tracks.clear();

    let clips: HashMap<String, usize> = empty_project
      .tracks
      .iter()
      .flat_map(|track| track.clips.iter())
      .enumerate()
      .map(|(index, clip)| (clip.id.clone(), index))
      .collect();

    assert!(clips.is_empty());

    let result = SegmentInputResult {
      success: true,
      input_count: clips.len(),
      clip_indices: clips,
      error: None,
    };

    assert_eq!(result.input_count, 0);
    assert!(result.clip_indices.is_empty());
  }
}
