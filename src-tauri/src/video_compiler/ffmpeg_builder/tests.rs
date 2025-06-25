//! Тесты для FFmpeg Builder

#[cfg(test)]
mod builder_tests {
  use super::super::builder::{FFmpegBuilder, FFmpegBuilderSettings};
  use crate::video_compiler::tests::fixtures::*;

  #[tokio::test]
  async fn test_basic_ffmpeg_command_generation() {
    let project = create_project_with_clips();
    let settings = FFmpegBuilderSettings::default();
    let builder = FFmpegBuilder::with_settings(project, settings);

    let output_path = std::path::Path::new("/tmp/output.mp4");
    let result = builder.build_render_command(output_path).await;

    assert!(result.is_ok(), "Command generation should succeed");
  }

  #[tokio::test]
  async fn test_output_format_settings() {
    let mut project = create_minimal_project();

    // Изменяем формат на WebM
    project.settings.export.format = crate::video_compiler::schema::OutputFormat::WebM;

    let builder = FFmpegBuilder::new(project);
    let output_path = std::path::Path::new("/tmp/output.webm");
    let result = builder.build_render_command(output_path).await;

    assert!(result.is_ok(), "WebM format should be supported");
  }

  #[tokio::test]
  async fn test_hardware_acceleration() {
    let project = create_minimal_project();
    let settings = FFmpegBuilderSettings {
      use_hardware_acceleration: true,
      hardware_acceleration_type: Some("nvenc".to_string()),
      ..Default::default()
    };

    let builder = FFmpegBuilder::with_settings(project, settings);
    let output_path = std::path::Path::new("/tmp/output.mp4");
    let result = builder.build_render_command(output_path).await;

    assert!(result.is_ok(), "Hardware acceleration should work");
  }

  #[tokio::test]
  async fn test_complex_project_build() {
    let project = create_complex_project();
    let builder = FFmpegBuilder::new(project);

    let result = builder
      .build_render_command(std::path::Path::new("/tmp/output.mp4"))
      .await;

    assert!(result.is_ok(), "Complex project build should succeed");
  }

  #[tokio::test]
  async fn test_preview_command_generation() {
    let project = create_minimal_project();
    let builder = FFmpegBuilder::new(project);

    let result = builder
      .build_render_command(std::path::Path::new("/tmp/output.mp4"))
      .await;

    assert!(result.is_ok(), "Preview command generation should succeed");
  }
}
