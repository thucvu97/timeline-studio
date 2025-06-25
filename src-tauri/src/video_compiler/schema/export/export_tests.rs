//! Тесты для модуля export

#[cfg(test)]
use super::*;

#[test]
fn test_output_settings_default() {
  let settings = OutputSettings::default();
  assert!(matches!(settings.format, OutputFormat::Mp4));
  assert_eq!(settings.quality, 85);
  assert!(settings.video_bitrate.is_none());
  assert_eq!(settings.audio_bitrate, Some(192));
  assert_eq!(settings.duration, 0.0);
}

#[test]
fn test_project_settings_default() {
  let settings = ProjectSettings::default();
  assert_eq!(settings.frame_rate, 30.0);
  assert!(settings.custom.is_empty());
  assert_eq!(settings.resolution.width, 1920);
  assert_eq!(settings.resolution.height, 1080);
}

#[test]
fn test_export_settings_default() {
  let settings = ExportSettings::default();
  assert!(matches!(settings.format, OutputFormat::Mp4));
  assert_eq!(settings.quality, 85);
  assert_eq!(settings.video_bitrate, 8000);
  assert_eq!(settings.audio_bitrate, 192);
  assert!(settings.hardware_acceleration);
  assert!(settings.preferred_gpu_encoder.is_none());
  assert!(settings.ffmpeg_args.is_empty());
}

#[test]
fn test_export_settings_serialization() {
  let settings = ExportSettings {
    format: OutputFormat::Mov,
    quality: 95,
    video_bitrate: 10000,
    hardware_acceleration: true,
    preferred_gpu_encoder: Some("h264_nvenc".to_string()),
    ffmpeg_args: vec!["-preset".to_string(), "fast".to_string()],
    encoding_profile: Some("high".to_string()),
    keyframe_interval: Some(60),
    multi_pass: Some(2),
    ..Default::default()
  };

  let json = serde_json::to_string(&settings).unwrap();
  let deserialized: ExportSettings = serde_json::from_str(&json).unwrap();

  assert!(matches!(deserialized.format, OutputFormat::Mov));
  assert_eq!(deserialized.quality, 95);
  assert_eq!(deserialized.video_bitrate, 10000);
  assert!(deserialized.hardware_acceleration);
  assert_eq!(
    deserialized.preferred_gpu_encoder,
    Some("h264_nvenc".to_string())
  );
  assert_eq!(deserialized.ffmpeg_args.len(), 2);
  assert_eq!(deserialized.encoding_profile, Some("high".to_string()));
  assert_eq!(deserialized.keyframe_interval, Some(60));
  assert_eq!(deserialized.multi_pass, Some(2));
}

#[test]
fn test_preview_settings_default() {
  let settings = PreviewSettings::default();
  assert_eq!(settings.resolution, (640, 360));
  assert_eq!(settings.quality, 75);
  assert_eq!(settings.fps, 15);
  assert!(matches!(settings.format, PreviewFormat::Jpeg));
}

#[test]
fn test_output_format_serialization() {
  let formats = vec![
    OutputFormat::Mp4,
    OutputFormat::Mov,
    OutputFormat::WebM,
    OutputFormat::Avi,
    OutputFormat::Mkv,
    OutputFormat::Gif,
    OutputFormat::Custom("h264".to_string()),
  ];

  for format in formats {
    let json = serde_json::to_string(&format).unwrap();
    let deserialized: OutputFormat = serde_json::from_str(&json).unwrap();
    match (&format, &deserialized) {
      (OutputFormat::Mp4, OutputFormat::Mp4) => {}
      (OutputFormat::Mov, OutputFormat::Mov) => {}
      (OutputFormat::WebM, OutputFormat::WebM) => {}
      (OutputFormat::Avi, OutputFormat::Avi) => {}
      (OutputFormat::Mkv, OutputFormat::Mkv) => {}
      (OutputFormat::Gif, OutputFormat::Gif) => {}
      (OutputFormat::Custom(a), OutputFormat::Custom(b)) => assert_eq!(a, b),
      _ => panic!("Format mismatch"),
    }
  }
}

#[test]
fn test_preview_format_serialization() {
  let formats = vec![PreviewFormat::Jpeg, PreviewFormat::Png, PreviewFormat::WebP];

  for format in formats {
    let json = serde_json::to_string(&format).unwrap();
    let deserialized: PreviewFormat = serde_json::from_str(&json).unwrap();
    match (&format, &deserialized) {
      (PreviewFormat::Jpeg, PreviewFormat::Jpeg) => {}
      (PreviewFormat::Png, PreviewFormat::Png) => {}
      (PreviewFormat::WebP, PreviewFormat::WebP) => {}
      _ => panic!("Preview format mismatch"),
    }
  }
}

#[test]
fn test_export_settings_quality_validation() {
  // Test quality boundaries
  let settings = ExportSettings {
    quality: 1,
    ..Default::default()
  };
  let json = serde_json::to_string(&settings).unwrap();
  let deserialized: ExportSettings = serde_json::from_str(&json).unwrap();
  assert_eq!(deserialized.quality, 1);

  let settings_100 = ExportSettings {
    quality: 100,
    ..Default::default()
  };
  let json = serde_json::to_string(&settings_100).unwrap();
  let deserialized: ExportSettings = serde_json::from_str(&json).unwrap();
  assert_eq!(deserialized.quality, 100);
}

#[test]
fn test_export_settings_with_advanced_options() {
  let settings = ExportSettings {
    encoding_profile: Some("main".to_string()),
    rate_control_mode: Some("crf".to_string()),
    keyframe_interval: Some(120),
    b_frames: Some(3),
    preset: Some("medium".to_string()),
    max_bitrate: Some(20000),
    ..Default::default()
  };
  // settings.buffer_size = Some(10000); // Field doesn't exist in current schema

  let json = serde_json::to_string(&settings).unwrap();
  let deserialized: ExportSettings = serde_json::from_str(&json).unwrap();

  assert_eq!(deserialized.encoding_profile, Some("main".to_string()));
  assert_eq!(deserialized.rate_control_mode, Some("crf".to_string()));
  assert_eq!(deserialized.keyframe_interval, Some(120));
  assert_eq!(deserialized.b_frames, Some(3));
  assert_eq!(deserialized.preset, Some("medium".to_string()));
  assert_eq!(deserialized.max_bitrate, Some(20000));
  // assert_eq!(deserialized.buffer_size, Some(10000)); // Field doesn't exist in current schema
}

#[test]
fn test_project_settings_with_custom_values() {
  let mut settings = ProjectSettings::default();
  settings
    .custom
    .insert("theme".to_string(), serde_json::json!("dark"));
  settings
    .custom
    .insert("watermark".to_string(), serde_json::json!(true));
  settings
    .custom
    .insert("credits_duration".to_string(), serde_json::json!(5.0));

  assert_eq!(
    settings.custom.get("theme"),
    Some(&serde_json::json!("dark"))
  );
  assert_eq!(
    settings.custom.get("watermark"),
    Some(&serde_json::json!(true))
  );
  assert_eq!(
    settings.custom.get("credits_duration"),
    Some(&serde_json::json!(5.0))
  );

  // Test serialization
  let json = serde_json::to_string(&settings).unwrap();
  let deserialized: ProjectSettings = serde_json::from_str(&json).unwrap();
  assert_eq!(deserialized.custom.len(), 3);
}

#[test]
fn test_export_settings_ffmpeg_args() {
  let settings = ExportSettings {
    ffmpeg_args: vec![
      "-vf".to_string(),
      "scale=1920:1080".to_string(),
      "-preset".to_string(),
      "slow".to_string(),
      "-crf".to_string(),
      "23".to_string(),
    ],
    ..Default::default()
  };

  assert_eq!(settings.ffmpeg_args.len(), 6);
  assert_eq!(settings.ffmpeg_args[0], "-vf");
  assert_eq!(settings.ffmpeg_args[1], "scale=1920:1080");

  // Test serialization
  let json = serde_json::to_string(&settings).unwrap();
  let deserialized: ExportSettings = serde_json::from_str(&json).unwrap();
  assert_eq!(deserialized.ffmpeg_args, settings.ffmpeg_args);
}

#[test]
fn test_output_settings_with_bitrates() {
  let settings = OutputSettings {
    video_bitrate: Some(8000),
    audio_bitrate: Some(320),
    duration: 120.5,
    ..Default::default()
  };

  assert_eq!(settings.video_bitrate, Some(8000));
  assert_eq!(settings.audio_bitrate, Some(320));
  assert_eq!(settings.duration, 120.5);

  // Test serialization
  let json = serde_json::to_string(&settings).unwrap();
  let deserialized: OutputSettings = serde_json::from_str(&json).unwrap();
  assert_eq!(deserialized.video_bitrate, settings.video_bitrate);
  assert_eq!(deserialized.audio_bitrate, settings.audio_bitrate);
  assert_eq!(deserialized.duration, settings.duration);
}

#[test]
fn test_export_settings_gpu_acceleration() {
  let mut settings = ExportSettings::default();

  // Test with GPU acceleration enabled by default
  assert!(settings.hardware_acceleration);
  assert!(settings.preferred_gpu_encoder.is_none());

  // Enable GPU acceleration
  settings.hardware_acceleration = true;
  settings.preferred_gpu_encoder = Some("hevc_nvenc".to_string());

  assert!(settings.hardware_acceleration);
  assert_eq!(
    settings.preferred_gpu_encoder,
    Some("hevc_nvenc".to_string())
  );

  // Test various GPU encoders
  let gpu_encoders = vec![
    "h264_nvenc",
    "hevc_nvenc",
    "h264_amf",
    "hevc_amf",
    "h264_qsv",
    "hevc_qsv",
    "h264_videotoolbox",
    "hevc_videotoolbox",
  ];

  for encoder in gpu_encoders {
    settings.preferred_gpu_encoder = Some(encoder.to_string());
    let json = serde_json::to_string(&settings).unwrap();
    let deserialized: ExportSettings = serde_json::from_str(&json).unwrap();
    assert_eq!(
      deserialized.preferred_gpu_encoder,
      Some(encoder.to_string())
    );
  }
}
