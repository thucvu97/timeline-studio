//! Пример использования Event System в Timeline Studio
//!
//! Демонстрирует как использовать EventBus для обмена сообщениями между компонентами

use async_trait::async_trait;
use std::sync::Arc;
use timeline_studio_lib::core::{AppEvent, EventBus, EventHandler};
use timeline_studio_lib::video_compiler::error::Result;
use tokio::sync::RwLock;

/// Пример пользовательского события
#[derive(Debug, Clone)]
struct CustomMediaEvent {
  media_id: String,
  event_type: MediaEventType,
}

#[derive(Debug, Clone)]
enum MediaEventType {
  Imported,
  _Analyzed,
  _ThumbnailReady,
}

/// Handler для обработки событий проекта
struct ProjectEventHandler {
  project_count: Arc<RwLock<u32>>,
}

#[async_trait]
impl EventHandler for ProjectEventHandler {
  type Event = AppEvent;

  async fn handle(&self, event: Self::Event) -> Result<()> {
    match event {
      AppEvent::ProjectCreated { project_id } => {
        let mut count = self.project_count.write().await;
        *count += 1;
        println!(
          "Project created: {}. Total projects: {}",
          project_id, *count
        );
      }
      AppEvent::ProjectOpened { project_id, path } => {
        println!("Project opened: {} from {}", project_id, path);
      }
      AppEvent::ProjectClosed { project_id } => {
        println!("Project closed: {}", project_id);
      }
      _ => {} // Игнорируем другие события
    }
    Ok(())
  }

  fn name(&self) -> &'static str {
    "ProjectEventHandler"
  }
}

/// Handler для обработки событий рендеринга
struct RenderProgressHandler;

#[async_trait]
impl EventHandler for RenderProgressHandler {
  type Event = AppEvent;

  async fn handle(&self, event: Self::Event) -> Result<()> {
    match event {
      AppEvent::RenderStarted { job_id, project_id } => {
        println!("🎬 Render started: {} for project {}", job_id, project_id);
      }
      AppEvent::RenderProgress { job_id, progress } => {
        let progress_bar = "█".repeat((progress * 20.0) as usize);
        let empty_bar = "░".repeat(20 - (progress * 20.0) as usize);
        println!(
          "📊 Render {}: [{}{}] {:.1}%",
          job_id,
          progress_bar,
          empty_bar,
          progress * 100.0
        );
      }
      AppEvent::RenderCompleted {
        job_id,
        output_path,
      } => {
        println!("✅ Render completed: {} -> {}", job_id, output_path);
      }
      AppEvent::RenderFailed { job_id, error } => {
        println!("❌ Render failed: {} - {}", job_id, error);
      }
      _ => {}
    }
    Ok(())
  }

  fn name(&self) -> &'static str {
    "RenderProgressHandler"
  }
}

/// Handler для кастомных медиа событий
struct MediaEventHandler;

#[async_trait]
impl EventHandler for MediaEventHandler {
  type Event = CustomMediaEvent;

  async fn handle(&self, event: Self::Event) -> Result<()> {
    match event.event_type {
      MediaEventType::Imported => {
        println!("📥 Media imported: {}", event.media_id);
      }
      MediaEventType::_Analyzed => {
        println!("🔍 Media analyzed: {}", event.media_id);
      }
      MediaEventType::_ThumbnailReady => {
        println!("🖼️ Thumbnail ready: {}", event.media_id);
      }
    }
    Ok(())
  }

  fn name(&self) -> &'static str {
    "MediaEventHandler"
  }
}

#[tokio::main]
async fn main() -> Result<()> {
  // Инициализация логирования
  env_logger::init();

  // Создаем EventBus
  let event_bus = Arc::new(EventBus::new());

  // Запускаем обработчик AppEvent
  event_bus.start_app_event_processor().await;

  // Регистрируем handlers
  let project_handler = ProjectEventHandler {
    project_count: Arc::new(RwLock::new(0)),
  };
  let render_handler = RenderProgressHandler;
  let media_handler = MediaEventHandler;

  // Подписываемся на события
  event_bus.subscribe(project_handler).await?;
  event_bus.subscribe(render_handler).await?;
  event_bus.subscribe(media_handler).await?;

  println!("🚀 Event System Example Started\n");

  // Симуляция работы приложения

  // 1. Создание проекта
  event_bus
    .publish_app_event(AppEvent::ProjectCreated {
      project_id: "project-001".to_string(),
    })
    .await?;

  tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

  // 2. Открытие проекта
  event_bus
    .publish_app_event(AppEvent::ProjectOpened {
      project_id: "project-001".to_string(),
      path: "/Users/test/projects/my-video.tlp".to_string(),
    })
    .await?;

  tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

  // 3. Импорт медиа
  event_bus
    .publish_app_event(AppEvent::MediaImported {
      media_id: "media-001".to_string(),
      path: "/Users/test/videos/clip1.mp4".to_string(),
    })
    .await?;

  // Кастомное событие медиа
  event_bus
    .publish(CustomMediaEvent {
      media_id: "media-001".to_string(),
      event_type: MediaEventType::Imported,
    })
    .await?;

  tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

  // 4. Начало рендеринга
  event_bus
    .publish_app_event(AppEvent::RenderStarted {
      job_id: "render-001".to_string(),
      project_id: "project-001".to_string(),
    })
    .await?;

  // Симуляция прогресса рендеринга
  for i in 0..=10 {
    let progress = i as f32 / 10.0;
    event_bus
      .publish_app_event(AppEvent::RenderProgress {
        job_id: "render-001".to_string(),
        progress,
      })
      .await?;
    tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
  }

  // 5. Завершение рендеринга
  event_bus
    .publish_app_event(AppEvent::RenderCompleted {
      job_id: "render-001".to_string(),
      output_path: "/Users/test/exports/final-video.mp4".to_string(),
    })
    .await?;

  tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

  // 6. Предупреждение о памяти
  event_bus
    .publish_app_event(AppEvent::MemoryWarning {
      usage_percent: 85.5,
    })
    .await?;

  // 7. Создание еще одного проекта
  event_bus
    .publish_app_event(AppEvent::ProjectCreated {
      project_id: "project-002".to_string(),
    })
    .await?;

  tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

  // 8. Закрытие проекта
  event_bus
    .publish_app_event(AppEvent::ProjectClosed {
      project_id: "project-001".to_string(),
    })
    .await?;

  // Даем время на обработку последних событий
  tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;

  println!("\n✨ Event System Example Completed");

  Ok(())
}

/// Расширенный пример с цепочкой событий
async fn _advanced_example(event_bus: Arc<EventBus>) -> Result<()> {
  // Handler который генерирует новые события в ответ на полученные
  struct ChainedEventHandler {
    event_bus: Arc<EventBus>,
  }

  #[async_trait]
  impl EventHandler for ChainedEventHandler {
    type Event = AppEvent;

    async fn handle(&self, event: Self::Event) -> Result<()> {
      if let AppEvent::MediaImported { media_id, .. } = event {
        // После импорта автоматически начинаем анализ
        println!("🔗 Chained: Starting recognition for {}", media_id);

        self
          .event_bus
          .publish_app_event(AppEvent::RecognitionStarted {
            media_id: media_id.clone(),
            model: "yolov8".to_string(),
          })
          .await?;

        // Симуляция завершения распознавания
        tokio::spawn({
          let event_bus = self.event_bus.clone();
          let media_id = media_id.clone();
          async move {
            tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
            let _ = event_bus
              .publish_app_event(AppEvent::RecognitionCompleted {
                media_id,
                results: serde_json::json!({
                    "objects": ["person", "car", "dog"],
                    "confidence": [0.95, 0.87, 0.92]
                }),
              })
              .await;
          }
        });
      }
      Ok(())
    }

    fn name(&self) -> &'static str {
      "ChainedEventHandler"
    }
  }

  // Регистрируем handler с цепочкой
  let chained_handler = ChainedEventHandler {
    event_bus: event_bus.clone(),
  };
  event_bus.subscribe(chained_handler).await?;

  Ok(())
}
