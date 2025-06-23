//! Event-driven architecture для Timeline Studio
//!
//! Система событий для слабосвязанной коммуникации между компонентами.

use crate::video_compiler::error::{Result, VideoCompilerError};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::any::{Any, TypeId};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};

/// Базовое событие приложения
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum AppEvent {
  // Project events
  ProjectCreated {
    project_id: String,
  },
  ProjectOpened {
    project_id: String,
    path: String,
  },
  ProjectSaved {
    project_id: String,
  },
  ProjectClosed {
    project_id: String,
  },

  // Rendering events
  RenderStarted {
    job_id: String,
    project_id: String,
  },
  RenderProgress {
    job_id: String,
    progress: f32,
  },
  RenderCompleted {
    job_id: String,
    output_path: String,
  },
  RenderFailed {
    job_id: String,
    error: String,
  },

  // Media events
  MediaImported {
    media_id: String,
    path: String,
  },
  MediaProcessed {
    media_id: String,
  },
  ThumbnailGenerated {
    media_id: String,
    thumbnail_path: String,
  },

  // Recognition events
  RecognitionStarted {
    media_id: String,
    model: String,
  },
  RecognitionCompleted {
    media_id: String,
    results: serde_json::Value,
  },

  // Plugin events
  PluginLoaded {
    plugin_id: String,
    version: String,
  },
  PluginUnloaded {
    plugin_id: String,
  },
  PluginEvent {
    plugin_id: String,
    event: serde_json::Value,
  },

  // System events
  SystemStartup,
  SystemShutdown,
  SystemHealthCheck {
    timestamp: chrono::DateTime<chrono::Utc>,
  },
  ConfigChanged {
    key: String,
    value: serde_json::Value,
  },
  MemoryWarning {
    usage_percent: f32,
  },
}

/// Trait для обработчиков событий
#[async_trait]
pub trait EventHandler: Send + Sync + 'static {
  /// Тип события, которое обрабатывает handler
  type Event: Any + Send + Sync + Clone;

  /// Обработка события
  async fn handle(&self, event: Self::Event) -> Result<()>;

  /// Имя обработчика для логирования
  fn name(&self) -> &'static str;
}

/// Подписка на события
struct Subscription {
  handler: Box<dyn Any + Send + Sync>,
  name: &'static str,
}

/// Event Bus для публикации и подписки на события
pub struct EventBus {
  subscriptions: Arc<RwLock<HashMap<TypeId, Vec<Subscription>>>>,
  app_event_sender: mpsc::UnboundedSender<AppEvent>,
  app_event_receiver: Arc<RwLock<mpsc::UnboundedReceiver<AppEvent>>>,
}

impl EventBus {
  /// Создать новый EventBus
  pub fn new() -> Self {
    let (tx, rx) = mpsc::unbounded_channel();

    Self {
      subscriptions: Arc::new(RwLock::new(HashMap::new())),
      app_event_sender: tx,
      app_event_receiver: Arc::new(RwLock::new(rx)),
    }
  }

  /// Подписаться на событие определенного типа
  pub async fn subscribe<E, H>(&self, handler: H) -> Result<()>
  where
    E: Any + Send + Sync + Clone + 'static,
    H: EventHandler<Event = E>,
  {
    let mut subs = self.subscriptions.write().await;
    let type_id = TypeId::of::<E>();

    let handler_name = handler.name();
    let subscription = Subscription {
      handler: Box::new(handler),
      name: handler_name,
    };

    subs
      .entry(type_id)
      .or_insert_with(Vec::new)
      .push(subscription);

    log::info!("Subscribed handler '{}' to event type", handler_name);
    Ok(())
  }

  /// Опубликовать событие
  pub async fn publish<E>(&self, _event: E) -> Result<()>
  where
    E: Any + Send + Sync + Clone + 'static,
  {
    let subs = self.subscriptions.read().await;
    let type_id = TypeId::of::<E>();

    if let Some(handlers) = subs.get(&type_id) {
      for subscription in handlers {
        // Здесь нужна более сложная логика для downcast и вызова handler
        // Пока просто логируем
        log::debug!("Publishing event to handler: {}", subscription.name);
      }
    }

    Ok(())
  }

  /// Опубликовать AppEvent
  pub async fn publish_app_event(&self, event: AppEvent) -> Result<()> {
    self
      .app_event_sender
      .send(event)
      .map_err(|e| VideoCompilerError::InternalError(e.to_string()))?;
    Ok(())
  }

  /// Запустить обработку AppEvent
  pub async fn start_app_event_processor(&self) {
    let receiver = self.app_event_receiver.clone();
    let _subscriptions = self.subscriptions.clone();

    tokio::spawn(async move {
      let mut rx = receiver.write().await;

      while let Some(event) = rx.recv().await {
        log::debug!("Processing app event: {:?}", event);

        // Здесь можно добавить логику маршрутизации событий
        match &event {
          AppEvent::ProjectCreated { project_id } => {
            log::info!("Project created: {}", project_id);
          }
          AppEvent::RenderStarted { job_id, .. } => {
            log::info!("Render started: {}", job_id);
          }
          _ => {}
        }
      }
    });
  }
}

impl Default for EventBus {
  fn default() -> Self {
    Self::new()
  }
}

/// Макрос для упрощения создания обработчиков событий
#[macro_export]
macro_rules! event_handler {
  ($name:ident, $event_type:ty, $handler_fn:expr) => {
    struct $name;

    #[async_trait::async_trait]
    impl $crate::core::EventHandler for $name {
      type Event = $event_type;

      async fn handle(&self, event: Self::Event) -> $crate::video_compiler::error::Result<()> {
        $handler_fn(event).await
      }

      fn name(&self) -> &'static str {
        stringify!($name)
      }
    }
  };
}

#[cfg(test)]
mod tests {
  use super::*;

  #[derive(Clone)]
  struct TestEvent {
    message: String,
  }

  struct TestHandler;

  #[async_trait]
  impl EventHandler for TestHandler {
    type Event = TestEvent;

    async fn handle(&self, event: Self::Event) -> Result<()> {
      println!("Handled: {}", event.message);
      Ok(())
    }

    fn name(&self) -> &'static str {
      "TestHandler"
    }
  }

  #[tokio::test]
  async fn test_event_subscription() {
    let event_bus = EventBus::new();
    let handler = TestHandler;

    assert!(event_bus.subscribe(handler).await.is_ok());
  }

  #[tokio::test]
  async fn test_app_event_publishing() {
    let event_bus = EventBus::new();

    let event = AppEvent::ProjectCreated {
      project_id: "test-123".to_string(),
    };

    assert!(event_bus.publish_app_event(event).await.is_ok());
  }
}
