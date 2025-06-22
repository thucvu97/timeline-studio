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
  async fn test_filter_generation() {
    let project = create_complex_project();
    let _builder = FFmpegBuilder::new(project);

    // Тест успешно создал построитель
    // TODO: Добавить реальные проверки
  }

  #[tokio::test]
  async fn test_effect_application() {
    let mut project = create_project_with_clips();

    // Добавляем эффект
    let effect = create_test_effect(crate::video_compiler::schema::EffectType::Brightness);
    project.effects.push(effect);

    let _builder = FFmpegBuilder::new(project);
    // Тест успешно создал построитель
    // TODO: Добавить реальные проверки
  }

  #[tokio::test]
  async fn test_subtitle_integration() {
    let project = create_project_with_clips();
    let _builder = FFmpegBuilder::new(project);

    // Тест успешно создал построитель
    // TODO: Добавить реальные проверки
  }

  #[tokio::test]
  async fn test_fade_effect_with_gpu() {
    let project = create_project_with_clips();

    let _builder = FFmpegBuilder::new(project);
    // Тест успешно создал построитель
    // TODO: Добавить реальные проверки
  }

  #[tokio::test]
  async fn test_output_configuration() {
    let project = create_minimal_project();
    let _builder = FFmpegBuilder::new(project);

    let _output_path = std::path::Path::new("/tmp/output.mp4");
    // Тест успешно создал построитель
    // TODO: Добавить реальные проверки
  }

  #[tokio::test]
  async fn test_input_preparation() {
    let project = create_project_with_clips();
    let _builder = FFmpegBuilder::new(project);

    // Тест успешно создал построитель
    // TODO: Добавить реальные проверки
  }

  #[tokio::test]
  async fn test_template_application() {
    let project = create_project_with_clips();
    let _builder = FFmpegBuilder::new(project);

    // Тест успешно создал построитель
    // TODO: Добавить реальные проверки
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
