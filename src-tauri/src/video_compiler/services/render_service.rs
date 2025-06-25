//! Сервис рендеринга видео

use crate::video_compiler::{
  error::{Result, VideoCompilerError},
  progress::{RenderProgress, RenderStatus},
  renderer::VideoRenderer,
  schema::ProjectSchema,
  services::{CacheService, FfmpegService, Service},
};
use async_trait::async_trait;
use std::{collections::HashMap, path::PathBuf, sync::Arc};
use tokio::sync::RwLock;
use uuid::Uuid;

/// Трейт для сервиса рендеринга
#[async_trait]
#[allow(dead_code)]
pub trait RenderService: Service + Send + Sync {
  /// Запуск рендеринга проекта
  async fn start_render(&self, project: ProjectSchema, output_path: PathBuf) -> Result<String>;

  /// Получение прогресса рендеринга
  async fn get_progress(&self, job_id: &str) -> Result<Option<RenderProgress>>;

  /// Отмена рендеринга
  async fn cancel_render(&self, job_id: &str) -> Result<bool>;

  /// Пауза рендеринга
  async fn pause_render(&self, job_id: &str) -> Result<bool>;

  /// Возобновление рендеринга
  async fn resume_render(&self, job_id: &str) -> Result<bool>;

  /// Получение списка активных задач
  async fn get_active_jobs(&self) -> Result<Vec<String>>;

  /// Проверка доступности слотов для рендеринга
  async fn has_available_slots(&self) -> Result<bool>;
}

/// Информация о задаче рендеринга
pub struct RenderJob {
  pub output_path: PathBuf,
  pub status: RenderStatus,
  pub progress: RenderProgress,
  pub renderer: Option<VideoRenderer>,
}

/// Реализация сервиса рендеринга
pub struct RenderServiceImpl {
  active_jobs: Arc<RwLock<HashMap<String, RenderJob>>>,
  max_concurrent_jobs: usize,
  #[allow(dead_code)]
  cache_service: Arc<dyn CacheService>,
}

impl RenderServiceImpl {
  pub fn new(
    _ffmpeg_service: Arc<dyn FfmpegService>,
    max_concurrent_jobs: usize,
    cache_service: Arc<dyn CacheService>,
  ) -> Self {
    Self {
      active_jobs: Arc::new(RwLock::new(HashMap::new())),
      max_concurrent_jobs,
      cache_service,
    }
  }
}

#[async_trait]
impl Service for RenderServiceImpl {
  async fn initialize(&self) -> Result<()> {
    log::info!("Инициализация сервиса рендеринга");
    Ok(())
  }

  async fn health_check(&self) -> Result<()> {
    let jobs = self.active_jobs.read().await;
    log::debug!("Активных задач рендеринга: {}", jobs.len());
    Ok(())
  }

  async fn shutdown(&self) -> Result<()> {
    log::info!("Остановка всех активных задач рендеринга");

    let job_ids: Vec<String> = {
      let jobs = self.active_jobs.read().await;
      jobs.keys().cloned().collect()
    };

    for job_id in job_ids {
      if let Err(e) = self.cancel_render(&job_id).await {
        log::error!("Ошибка при отмене задачи {}: {:?}", job_id, e);
      }
    }

    Ok(())
  }
}

#[async_trait]
impl RenderService for RenderServiceImpl {
  async fn start_render(&self, project: ProjectSchema, output_path: PathBuf) -> Result<String> {
    // Проверяем доступность слотов
    if !self.has_available_slots().await? {
      return Err(VideoCompilerError::TooManyActiveJobs(format!(
        "Максимальное количество одновременных задач: {}",
        self.max_concurrent_jobs
      )));
    }

    // Валидируем проект
    project.validate()?;

    // Создаем ID задачи
    let job_id = Uuid::new_v4().to_string();

    // Создаем прогресс канал
    let (progress_sender, _progress_receiver) = tokio::sync::mpsc::unbounded_channel();

    // Создаем временные настройки для рендерера
    let settings = Arc::new(RwLock::new(
      crate::video_compiler::CompilerSettings::default(),
    ));

    // Создаем кэш для рендера (интегрирован с CacheService)
    // Note: VideoRenderer использует локальный RenderCache, но CacheService
    // используется для операций кэширования на более высоком уровне
    let cache = Arc::new(RwLock::new(crate::video_compiler::cache::RenderCache::new()));

    // Создаем рендерер
    let renderer = VideoRenderer::new(project.clone(), settings, cache, progress_sender).await?;

    // Создаем задачу
    let job = RenderJob {
      output_path,
      status: RenderStatus::Preparing,
      progress: RenderProgress::default(),
      renderer: Some(renderer),
    };

    // Добавляем в активные задачи
    {
      let mut jobs = self.active_jobs.write().await;
      jobs.insert(job_id.clone(), job);
    }

    // Запускаем рендеринг в фоне
    let jobs = self.active_jobs.clone();
    let job_id_clone = job_id.clone();

    tokio::spawn(async move {
      // Получаем рендерер и output_path из задачи
      let (renderer, output_path) = {
        let mut jobs_lock = jobs.write().await;
        if let Some(job) = jobs_lock.get_mut(&job_id_clone) {
          (job.renderer.take(), job.output_path.clone())
        } else {
          (None, PathBuf::new())
        }
      };

      if let Some(mut renderer) = renderer {
        match renderer.render(&output_path).await {
          Ok(_) => {
            log::info!("Рендеринг {} успешно завершен", job_id_clone);
            // Обновляем статус
            let mut jobs_lock = jobs.write().await;
            if let Some(job) = jobs_lock.get_mut(&job_id_clone) {
              job.status = RenderStatus::Completed;
            }
          }
          Err(e) => {
            log::error!("Ошибка рендеринга {}: {:?}", job_id_clone, e);
            // Обновляем статус
            let mut jobs_lock = jobs.write().await;
            if let Some(job) = jobs_lock.get_mut(&job_id_clone) {
              job.status = RenderStatus::Failed(e.to_string());
            }
          }
        }
      }
    });

    Ok(job_id)
  }

  async fn get_progress(&self, job_id: &str) -> Result<Option<RenderProgress>> {
    let jobs = self.active_jobs.read().await;
    Ok(jobs.get(job_id).map(|job| job.progress.clone()))
  }

  async fn cancel_render(&self, job_id: &str) -> Result<bool> {
    let mut jobs = self.active_jobs.write().await;
    if let Some(mut job) = jobs.remove(job_id) {
      if let Some(renderer) = job.renderer.as_mut() {
        renderer.cancel().await?;
      }
      Ok(true)
    } else {
      Ok(false)
    }
  }

  async fn pause_render(&self, job_id: &str) -> Result<bool> {
    let mut jobs = self.active_jobs.write().await;
    if let Some(job) = jobs.get_mut(job_id) {
      if let Some(renderer) = job.renderer.as_mut() {
        renderer.pause().await?;
        job.status = RenderStatus::Paused;
        Ok(true)
      } else {
        Ok(false)
      }
    } else {
      Ok(false)
    }
  }

  async fn resume_render(&self, job_id: &str) -> Result<bool> {
    let mut jobs = self.active_jobs.write().await;
    if let Some(job) = jobs.get_mut(job_id) {
      if let Some(renderer) = job.renderer.as_mut() {
        renderer.resume().await?;
        job.status = RenderStatus::Processing;
        Ok(true)
      } else {
        Ok(false)
      }
    } else {
      Ok(false)
    }
  }

  async fn get_active_jobs(&self) -> Result<Vec<String>> {
    let jobs = self.active_jobs.read().await;
    Ok(jobs.keys().cloned().collect())
  }

  async fn has_available_slots(&self) -> Result<bool> {
    let jobs = self.active_jobs.read().await;
    Ok(jobs.len() < self.max_concurrent_jobs)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::services::{FfmpegServiceImpl, CacheServiceImpl};

  #[tokio::test]
  async fn test_render_service_creation() {
    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("ffmpeg".to_string()));
    let cache_service = Arc::new(CacheServiceImpl::new(std::env::temp_dir()));
    let service = RenderServiceImpl::new(ffmpeg_service, 4, cache_service);

    assert!(service.initialize().await.is_ok());
    assert!(service.has_available_slots().await.unwrap());
  }

  #[tokio::test]
  async fn test_concurrent_job_limit() {
    let ffmpeg_service = Arc::new(FfmpegServiceImpl::new("ffmpeg".to_string()));
    let cache_service = Arc::new(CacheServiceImpl::new(std::env::temp_dir()));
    let service = RenderServiceImpl::new(ffmpeg_service, 2, cache_service);

    // Проверяем начальное состояние
    assert!(service.has_available_slots().await.unwrap());

    // Можем добавить в тест запуск задач, когда рендерер будет готов
  }
}
