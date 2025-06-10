//! Renderer - Основной модуль рендеринга видео
//!
//! Этот модуль реализует основную логику рендеринга видео проектов,
//! включая управление задачами, интеграцию с FFmpeg и обработку ошибок.

use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};

use crate::video_compiler::cache::RenderCache;
use crate::video_compiler::error::{Result, VideoCompilerError};
use crate::video_compiler::ffmpeg_builder::FFmpegBuilder;
use crate::video_compiler::pipeline::RenderPipeline;
use crate::video_compiler::progress::ProgressTracker;
use crate::video_compiler::schema::ProjectSchema;
use crate::video_compiler::CompilerSettings;

/// Основной рендерер видео
#[derive(Debug)]
pub struct VideoRenderer {
  /// Схема проекта для рендеринга
  project: ProjectSchema,
  /// Настройки компилятора
  settings: Arc<RwLock<CompilerSettings>>,
  /// Кэш рендеринга
  cache: Arc<RwLock<RenderCache>>,
  /// Трекер прогресса
  progress_tracker: Arc<ProgressTracker>,
  /// Построитель команд FFmpeg
  ffmpeg_builder: FFmpegBuilder,
}

impl VideoRenderer {
  /// Создать новый рендерер
  pub async fn new(
    project: ProjectSchema,
    settings: Arc<RwLock<CompilerSettings>>,
    cache: Arc<RwLock<RenderCache>>,
    progress_sender: mpsc::UnboundedSender<crate::video_compiler::progress::ProgressUpdate>,
  ) -> Result<Self> {
    // Валидация проекта
    project.validate().map_err(VideoCompilerError::validation)?;

    let progress_tracker = Arc::new(ProgressTracker::new(progress_sender));
    let ffmpeg_builder = FFmpegBuilder::new(project.clone());

    Ok(Self {
      project,
      settings,
      cache,
      progress_tracker,
      ffmpeg_builder,
    })
  }

  /// Запустить рендеринг видео
  pub async fn render(&mut self, output_path: &Path) -> Result<String> {
    let job_id = self.create_render_job(output_path).await?;

    // Запускаем рендеринг в отдельной задаче
    let job_id_clone = job_id.clone();
    let project = self.project.clone();
    let output_path = output_path.to_owned();
    let progress_tracker = self.progress_tracker.clone();
    let ffmpeg_builder = self.ffmpeg_builder.clone();
    let settings = self.settings.clone();

    let progress_tracker_clone = progress_tracker.clone();
    tokio::spawn(async move {
      let result = Self::render_internal(
        project,
        output_path,
        progress_tracker,
        ffmpeg_builder,
        settings,
        job_id_clone.clone(), // Передаем job_id
      )
      .await;

      match result {
        Ok(final_path) => {
          let _ = progress_tracker_clone
            .complete_job(&job_id_clone, final_path)
            .await;
        }
        Err(e) => {
          log::error!("Ошибка рендеринга: {}", e);
          log::error!("  Код ошибки: {}", e.error_code());
          log::error!(
            "  Критическая: {}",
            if e.is_critical() { "да" } else { "нет" }
          );
          log::error!(
            "  Можно повторить: {}",
            if e.is_retryable() { "да" } else { "нет" }
          );

          let _ = progress_tracker_clone
            .fail_job(&job_id_clone, e.to_string())
            .await;
        }
      }
    });

    Ok(job_id)
  }

  /// Создать задачу рендеринга
  async fn create_render_job(&self, output_path: &Path) -> Result<String> {
    let total_frames = self.estimate_total_frames();

    self
      .progress_tracker
      .create_job(
        self.project.metadata.name.clone(),
        output_path.to_string_lossy().to_string(),
        total_frames,
      )
      .await
  }

  /// Оценить общее количество кадров
  fn estimate_total_frames(&self) -> u64 {
    let duration = self.project.get_duration();
    let fps = self.project.timeline.fps as f64;
    (duration * fps) as u64
  }

  /// Внутренняя логика рендеринга
  async fn render_internal(
    project: ProjectSchema,
    output_path: PathBuf,
    progress_tracker: Arc<ProgressTracker>,
    _ffmpeg_builder: FFmpegBuilder,
    settings: Arc<RwLock<CompilerSettings>>,
    job_id: String, // Добавляем job_id как параметр
  ) -> Result<String> {
    log::info!(
      "Начало рендеринга проекта: {} (job_id: {})",
      project.metadata.name,
      job_id
    );

    // Создаем RenderPipeline
    let mut pipeline = RenderPipeline::new(
      project.clone(),
      progress_tracker.clone(),
      settings,
      output_path.clone(),
    )
    .await?;

    // Используем переданный job_id вместо поиска
    // Это исправляет проблему с двойной системой отслеживания задач

    // Запускаем pipeline
    let final_output = pipeline.execute(&job_id).await?;

    log::info!("Рендеринг завершен: {:?}", final_output);

    Ok(final_output.to_string_lossy().to_string())
  }

  /// Отменить рендеринг
  pub async fn cancel(&mut self) -> Result<()> {
    // Получаем активные задачи и отменяем их
    let jobs = self.progress_tracker.get_active_jobs().await;
    for job in jobs {
      self.progress_tracker.cancel_job(&job.id).await?;
    }
    Ok(())
  }

  /// Получить текущий прогресс
  pub async fn get_progress(&self) -> Option<crate::video_compiler::progress::RenderProgress> {
    let jobs = self.progress_tracker.get_active_jobs().await;
    jobs.first().map(|job| job.get_progress())
  }
}

/// Настройки рендеринга
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RenderSettings {
  /// Использовать аппаратное ускорение
  pub hardware_acceleration: bool,
  /// Количество потоков FFmpeg
  pub threads: Option<u32>,
  /// Дополнительные параметры FFmpeg
  pub extra_args: Vec<String>,
  /// Таймаут рендеринга (секунды)
  pub timeout_seconds: u64,
}

impl Default for RenderSettings {
  fn default() -> Self {
    Self {
      hardware_acceleration: true,
      threads: None, // Автоматическое определение
      extra_args: Vec::new(),
      timeout_seconds: 3600, // 1 час
    }
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::cache::RenderCache;
  use crate::video_compiler::progress::ProgressUpdate;
  use std::sync::Arc;
  use tokio::sync::{mpsc, RwLock};

  async fn create_test_renderer() -> VideoRenderer {
    let project = ProjectSchema::new("Test Project".to_string());
    let settings = Arc::new(RwLock::new(CompilerSettings::default()));
    let cache = Arc::new(RwLock::new(RenderCache::new()));
    let (tx, _rx) = mpsc::unbounded_channel::<ProgressUpdate>();

    VideoRenderer::new(project, settings, cache, tx)
      .await
      .unwrap()
  }

  #[tokio::test]
  async fn test_renderer_creation() {
    let renderer = create_test_renderer().await;
    assert_eq!(renderer.project.metadata.name, "Test Project");
  }

  #[tokio::test]
  async fn test_estimate_total_frames() {
    let renderer = create_test_renderer().await;
    let frames = renderer.estimate_total_frames();
    // Пустой проект должен иметь 0 кадров
    assert_eq!(frames, 0);
  }

  #[tokio::test]
  async fn test_render_settings_default() {
    let settings = RenderSettings::default();
    assert!(settings.hardware_acceleration);
    assert_eq!(settings.timeout_seconds, 3600);
    assert!(settings.extra_args.is_empty());
  }

  #[tokio::test]
  async fn test_cancel_render() {
    let mut renderer = create_test_renderer().await;

    // Отмена рендеринга не должна вызывать ошибку, даже если нет активных задач
    let result = renderer.cancel().await;
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_get_progress_empty() {
    let renderer = create_test_renderer().await;

    // Без активных задач прогресс должен быть None
    let progress = renderer.get_progress().await;
    assert!(progress.is_none());
  }
}
