//! State - Управление состоянием Video Compiler
//!
//! Модуль содержит основные типы и структуры для управления
//! состоянием компилятора, включая активные задачи рендеринга.

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

use crate::video_compiler::cache::RenderCache;
use crate::video_compiler::progress::RenderProgress;
use crate::video_compiler::progress::RenderStatus;
use crate::video_compiler::renderer::VideoRenderer;
use crate::video_compiler::services::ServiceContainer;
use crate::video_compiler::CompilerSettings;

/// Метаданные активной задачи рендеринга
#[derive(Debug, Clone)]
pub struct RenderJobMetadata {
  pub project_name: String,
  pub output_path: String,
  pub created_at: String,
}

/// Активная задача рендеринга с метаданными
#[derive(Debug)]
pub struct ActiveRenderJob {
  pub renderer: VideoRenderer,
  pub metadata: RenderJobMetadata,
}

/// Состояние Video Compiler для Tauri
pub struct VideoCompilerState {
  /// Контейнер сервисов
  pub services: Arc<ServiceContainer>,

  /// Активные задачи рендеринга (для обратной совместимости)
  pub active_jobs: Arc<RwLock<HashMap<String, ActiveRenderJob>>>,

  /// Менеджер кэша (для обратной совместимости)
  pub cache_manager: Arc<RwLock<RenderCache>>,

  /// Путь к FFmpeg (для обратной совместимости)
  pub ffmpeg_path: Arc<RwLock<String>>,

  /// Настройки компилятора (для обратной совместимости)
  pub settings: Arc<RwLock<CompilerSettings>>,
}

impl VideoCompilerState {
  pub async fn new() -> Self {
    let settings = Arc::new(RwLock::new(CompilerSettings::default()));
    let cache_manager = Arc::new(RwLock::new(RenderCache::new()));

    // Создаем контейнер сервисов
    let services = match ServiceContainer::new(
      "ffmpeg".to_string(),
      std::env::temp_dir().join("timeline-studio"),
      2,
    )
    .await
    {
      Ok(container) => container,
      Err(e) => {
        log::error!("Ошибка создания контейнера сервисов: {:?}", e);
        // Создаем минимальный контейнер для fallback
        return Self {
          services: Arc::new(ServiceContainer {
            render: Arc::new(crate::video_compiler::services::RenderServiceImpl::new(
              Arc::new(crate::video_compiler::services::FfmpegServiceImpl::new(
                "ffmpeg".to_string(),
              )),
              2,
            )),
            cache: Arc::new(crate::video_compiler::services::CacheServiceImpl::new(
              std::env::temp_dir().join("timeline-studio"),
            )),
            gpu: Arc::new(crate::video_compiler::services::GpuServiceImpl::new(
              "ffmpeg".to_string(),
            )),
            preview: Arc::new(crate::video_compiler::services::PreviewServiceImpl::new(
              Arc::new(crate::video_compiler::services::FfmpegServiceImpl::new(
                "ffmpeg".to_string(),
              )),
            )),
            project: Arc::new(crate::video_compiler::services::ProjectServiceImpl::new()),
            ffmpeg: Arc::new(crate::video_compiler::services::FfmpegServiceImpl::new(
              "ffmpeg".to_string(),
            )),
            metrics: crate::video_compiler::services::ServiceMetricsContainer {
              render: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
                "render-service".to_string(),
              )),
              cache: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
                "cache-service".to_string(),
              )),
              gpu: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
                "gpu-service".to_string(),
              )),
              preview: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
                "preview-service".to_string(),
              )),
              project: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
                "project-service".to_string(),
              )),
              ffmpeg: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
                "ffmpeg-service".to_string(),
              )),
            },
          }),
          active_jobs: Arc::new(RwLock::new(HashMap::new())),
          cache_manager,
          ffmpeg_path: Arc::new(RwLock::new("ffmpeg".to_string())),
          settings,
        };
      }
    };

    // Инициализируем сервисы
    if let Err(e) = services.initialize_all().await {
      log::error!("Ошибка инициализации сервисов: {:?}", e);
    }

    let services = Arc::new(services);

    Self {
      services,
      active_jobs: Arc::new(RwLock::new(HashMap::new())),
      cache_manager,
      ffmpeg_path: Arc::new(RwLock::new("ffmpeg".to_string())),
      settings,
    }
  }
}

impl Default for VideoCompilerState {
  fn default() -> Self {
    // Создаем минимальное состояние для синхронного Default
    let settings = Arc::new(RwLock::new(CompilerSettings::default()));
    let cache_manager = Arc::new(RwLock::new(RenderCache::new()));

    // Создаем сервисы напрямую для синхронного Default
    let ffmpeg = Arc::new(crate::video_compiler::services::FfmpegServiceImpl::new(
      "ffmpeg".to_string(),
    ));
    let cache_service = Arc::new(crate::video_compiler::services::CacheServiceImpl::new(
      std::env::temp_dir().join("timeline-studio"),
    ));
    let gpu = Arc::new(crate::video_compiler::services::GpuServiceImpl::new(
      "ffmpeg".to_string(),
    ));
    let preview = Arc::new(crate::video_compiler::services::PreviewServiceImpl::new(
      ffmpeg.clone(),
    ));
    let project = Arc::new(crate::video_compiler::services::ProjectServiceImpl::new());
    let render = Arc::new(crate::video_compiler::services::RenderServiceImpl::new(
      ffmpeg.clone(),
      2,
    ));

    // Создаем метрики
    let metrics = crate::video_compiler::services::ServiceMetricsContainer {
      render: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
        "render-service".to_string(),
      )),
      cache: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
        "cache-service".to_string(),
      )),
      gpu: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
        "gpu-service".to_string(),
      )),
      preview: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
        "preview-service".to_string(),
      )),
      project: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
        "project-service".to_string(),
      )),
      ffmpeg: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
        "ffmpeg-service".to_string(),
      )),
    };

    let services = ServiceContainer {
      render,
      cache: cache_service,
      gpu,
      preview,
      project,
      ffmpeg,
      metrics,
    };

    Self {
      services: Arc::new(services),
      active_jobs: Arc::new(RwLock::new(HashMap::new())),
      cache_manager,
      ffmpeg_path: Arc::new(RwLock::new("ffmpeg".to_string())),
      settings,
    }
  }
}

/// Информация о задаче рендеринга для фронтенда
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct RenderJob {
  pub id: String,
  pub project_name: String,
  pub output_path: String,
  pub status: RenderStatus,
  pub created_at: String,
  pub progress: Option<RenderProgress>,
  pub error_message: Option<String>,
}
