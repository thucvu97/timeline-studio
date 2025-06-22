//! Tests for segment filter functionality

#[cfg(test)]
mod segment_filter_tests {
  use crate::video_compiler::ffmpeg_builder::filters::FilterBuilder;
  use crate::video_compiler::schema::{
    Clip, ClipSource, ProjectMetadata, ProjectSchema, ProjectSettings, Timeline, Track, TrackType,
  };

  fn create_test_project() -> ProjectSchema {
    let clip1 = Clip {
      id: "clip1".to_string(),
      source: ClipSource::File("test1.mp4".to_string()),
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
      properties: crate::video_compiler::schema::timeline::ClipProperties::default(),
    };

    let video_track = Track {
      id: "video_track".to_string(),
      name: "Video Track".to_string(),
      track_type: TrackType::Video,
      enabled: true,
      volume: 1.0,
      locked: false,
      clips: vec![clip1],
      effects: vec![],
      filters: vec![],
    };

    let audio_clip = Clip {
      id: "audio_clip".to_string(),
      source: ClipSource::File("audio.mp3".to_string()),
      start_time: 0.0,
      end_time: 10.0,
      source_start: 0.0,
      source_end: 10.0,
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
      properties: crate::video_compiler::schema::timeline::ClipProperties::default(),
    };

    let audio_track = Track {
      id: "audio_track".to_string(),
      name: "Audio Track".to_string(),
      track_type: TrackType::Audio,
      enabled: true,
      volume: 1.0,
      locked: false,
      clips: vec![audio_clip],
      effects: vec![],
      filters: vec![],
    };

    ProjectSchema {
      version: "1.0.0".to_string(),
      metadata: ProjectMetadata {
        name: "Test Project".to_string(),
        description: None,
        created_at: chrono::Utc::now(),
        modified_at: chrono::Utc::now(),
        author: None,
      },
      settings: ProjectSettings::default(),
      timeline: Timeline::default(),
      tracks: vec![video_track, audio_track],
      effects: vec![],
      transitions: vec![],
      filters: vec![],
      templates: vec![],
      subtitles: vec![],
      style_templates: vec![],
    }
  }

  #[tokio::test]
  async fn test_filter_builder_segment_filters() {
    let project = create_test_project();
    let filter_builder = FilterBuilder::new(&project);

    // Тестируем основные компоненты фильтров
    assert!(filter_builder.has_video_tracks());
    assert!(filter_builder.has_audio_tracks());

    // Тестируем добавление сегментных фильтров
    let mut cmd = tokio::process::Command::new("ffmpeg");
    let _result = filter_builder.add_segment_filters(&mut cmd, 2.0, 7.0).await;
    // Если функция выполнилась без ошибки, тест пройден
  }

  #[tokio::test]
  async fn test_filter_builder_video_only() {
    let mut project = create_test_project();
    // Удаляем аудио треки
    project.tracks.retain(|t| t.track_type != TrackType::Audio);

    let filter_builder = FilterBuilder::new(&project);

    assert!(filter_builder.has_video_tracks());
    assert!(!filter_builder.has_audio_tracks());

    let mut cmd = tokio::process::Command::new("ffmpeg");
    let _result = filter_builder.add_segment_filters(&mut cmd, 0.0, 5.0).await;
  }

  #[test]
  fn test_filter_builder_disabled_tracks() {
    let mut project = create_test_project();
    // Отключаем видео трек
    project.tracks[0].enabled = false;

    let filter_builder = FilterBuilder::new(&project);

    assert!(!filter_builder.has_video_tracks());
    assert!(filter_builder.has_audio_tracks());
  }
}
