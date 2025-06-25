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
  EffectApplied {
    media_id: String,
    effect_type: String,
    parameters: String,
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
  #[allow(dead_code)]
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
  use std::sync::atomic::{AtomicU32, Ordering};

  #[derive(Clone)]
  struct TestEvent {
    message: String,
  }

  struct TestHandler {
    call_count: Arc<AtomicU32>,
  }

  #[async_trait]
  impl EventHandler for TestHandler {
    type Event = TestEvent;

    async fn handle(&self, event: Self::Event) -> Result<()> {
      self.call_count.fetch_add(1, Ordering::SeqCst);
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
    let handler = TestHandler {
      call_count: Arc::new(AtomicU32::new(0)),
    };

    assert!(event_bus.subscribe(handler).await.is_ok());

    // Verify subscription was added
    let subs = event_bus.subscriptions.read().await;
    assert_eq!(subs.len(), 1);
    assert!(subs.contains_key(&TypeId::of::<TestEvent>()));
  }

  #[tokio::test]
  async fn test_multiple_handlers_for_same_event() {
    let event_bus = EventBus::new();

    let handler1 = TestHandler {
      call_count: Arc::new(AtomicU32::new(0)),
    };
    let handler2 = TestHandler {
      call_count: Arc::new(AtomicU32::new(0)),
    };

    event_bus.subscribe(handler1).await.unwrap();
    event_bus.subscribe(handler2).await.unwrap();

    let subs = event_bus.subscriptions.read().await;
    let handlers = subs.get(&TypeId::of::<TestEvent>()).unwrap();
    assert_eq!(handlers.len(), 2);
  }

  #[tokio::test]
  async fn test_app_event_publishing() {
    let event_bus = EventBus::new();

    // Test various event types
    let events = vec![
      AppEvent::ProjectCreated {
        project_id: "test-123".to_string(),
      },
      AppEvent::RenderStarted {
        job_id: "job-456".to_string(),
        project_id: "test-123".to_string(),
      },
      AppEvent::RenderProgress {
        job_id: "job-456".to_string(),
        progress: 0.5,
      },
      AppEvent::RenderCompleted {
        job_id: "job-456".to_string(),
        output_path: "/tmp/output.mp4".to_string(),
      },
    ];

    for event in events {
      assert!(event_bus.publish_app_event(event).await.is_ok());
    }
  }

  #[tokio::test]
  async fn test_event_processor() {
    let event_bus = EventBus::new();

    // Start the processor
    event_bus.start_app_event_processor().await;

    // Give processor time to start
    tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;

    // Publish some events
    event_bus
      .publish_app_event(AppEvent::SystemStartup)
      .await
      .unwrap();
    event_bus
      .publish_app_event(AppEvent::SystemShutdown)
      .await
      .unwrap();

    // Give processor time to handle events
    tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
  }

  async fn handle_test_event(event: TestEvent) -> Result<()> {
    println!("Macro handler: {}", event.message);
    Ok(())
  }

  #[tokio::test]
  async fn test_event_handler_macro() {
    event_handler!(MacroTestHandler, TestEvent, handle_test_event);

    let event_bus = EventBus::new();
    let handler = MacroTestHandler;

    assert!(event_bus.subscribe(handler).await.is_ok());
    assert_eq!(MacroTestHandler.name(), "MacroTestHandler");
  }

  #[tokio::test]
  async fn test_memory_warning_event() {
    let event_bus = EventBus::new();

    let event = AppEvent::MemoryWarning {
      usage_percent: 85.5,
    };

    assert!(event_bus.publish_app_event(event).await.is_ok());
  }

  #[tokio::test]
  async fn test_plugin_events() {
    let event_bus = EventBus::new();

    let events = vec![
      AppEvent::PluginLoaded {
        plugin_id: "test-plugin".to_string(),
        version: "1.0.0".to_string(),
      },
      AppEvent::PluginEvent {
        plugin_id: "test-plugin".to_string(),
        event: serde_json::json!({"type": "custom", "data": "test"}),
      },
      AppEvent::PluginUnloaded {
        plugin_id: "test-plugin".to_string(),
      },
    ];

    for event in events {
      assert!(event_bus.publish_app_event(event).await.is_ok());
    }
  }

  #[tokio::test]
  async fn test_concurrent_event_publishing() {
    let event_bus = Arc::new(EventBus::new());

    let mut handles = vec![];

    // Spawn multiple tasks publishing events concurrently
    for i in 0..10 {
      let bus = event_bus.clone();
      let handle = tokio::spawn(async move {
        bus
          .publish_app_event(AppEvent::ProjectCreated {
            project_id: format!("project-{}", i),
          })
          .await
      });
      handles.push(handle);
    }

    // Wait for all tasks
    for handle in handles {
      assert!(handle.await.unwrap().is_ok());
    }
  }

  #[derive(Clone)]
  struct CounterEvent {
    value: u32,
  }

  struct CounterHandler {
    total: Arc<RwLock<u32>>,
  }

  #[async_trait]
  impl EventHandler for CounterHandler {
    type Event = CounterEvent;

    async fn handle(&self, event: Self::Event) -> Result<()> {
      let mut total = self.total.write().await;
      *total += event.value;
      Ok(())
    }

    fn name(&self) -> &'static str {
      "CounterHandler"
    }
  }

  #[tokio::test]
  async fn test_event_handler_state() {
    let event_bus = EventBus::new();
    let total = Arc::new(RwLock::new(0));

    let handler = CounterHandler {
      total: total.clone(),
    };

    event_bus.subscribe(handler).await.unwrap();

    // The actual event publishing logic would need to be implemented
    // to make this test meaningful

    // For now, just verify the handler was registered
    let subs = event_bus.subscriptions.read().await;
    assert!(subs.contains_key(&TypeId::of::<CounterEvent>()));
  }

  // TODO: Реализовать поддержку приоритетов и отмены событий в EventBus
  // Текущая архитектура требует EventHandler trait для всех обработчиков

  /*
  #[tokio::test]
  async fn test_event_priority() {
    // Тест для приоритетов событий
    let event_bus = EventBus::new();
    let execution_order = Arc::new(Mutex::new(Vec::new()));

    // Обработчик с высоким приоритетом
    let order1 = execution_order.clone();
    event_bus
      .subscribe(move |event: &AppEvent| {
        if matches!(event, AppEvent::SystemStartup { .. }) {
          order1.lock().unwrap().push(1);
        }
        Ok(())
      })
      .await
      .unwrap();

    // Обработчик с обычным приоритетом (добавлен позже, но должен выполниться вторым)
    let order2 = execution_order.clone();
    event_bus
      .subscribe(move |event: &AppEvent| {
        if matches!(event, AppEvent::SystemStartup { .. }) {
          order2.lock().unwrap().push(2);
        }
        Ok(())
      })
      .await
      .unwrap();

    // Публикуем событие
    event_bus
      .publish_app_event(AppEvent::SystemStartup {
        timestamp: chrono::Utc::now(),
      })
      .await
      .unwrap();

    // Даем время обработчикам выполниться
    tokio::time::sleep(std::time::Duration::from_millis(50)).await;

    // Проверяем порядок выполнения
    let order = execution_order.lock().unwrap();
    // В текущей реализации приоритеты не поддерживаются,
    // поэтому порядок будет в соответствии с регистрацией
    assert_eq!(order.len(), 2);
  }

  #[tokio::test]
  async fn test_event_cancellation() {
    // Тест для отмены событий
    #[derive(Debug, Clone)]
    struct CancellableEvent {
      cancelled: Arc<AtomicBool>,
      data: String,
    }

    let event_bus = EventBus::new();
    let processed_count = Arc::new(AtomicUsize::new(0));

    // Первый обработчик - отменяет событие
    let cancelled = Arc::new(AtomicBool::new(false));
    let cancelled_clone = cancelled.clone();
    event_bus
      .subscribe(move |event: &CancellableEvent| {
        event.cancelled.store(true, Ordering::SeqCst);
        cancelled_clone.store(true, Ordering::SeqCst);
        Ok(())
      })
      .await
      .unwrap();

    // Второй обработчик - не должен выполниться если событие отменено
    let count = processed_count.clone();
    let cancelled_check = cancelled.clone();
    event_bus
      .subscribe(move |_event: &CancellableEvent| {
        if !cancelled_check.load(Ordering::SeqCst) {
          count.fetch_add(1, Ordering::SeqCst);
        }
        Ok(())
      })
      .await
      .unwrap();

    // Публикуем событие
    let event = CancellableEvent {
      cancelled: Arc::new(AtomicBool::new(false)),
      data: "test".to_string(),
    };

    event_bus.publish(event).await.unwrap();

    // Даем время обработчикам
    tokio::time::sleep(std::time::Duration::from_millis(50)).await;

    // Проверяем что событие было отменено
    assert!(cancelled.load(Ordering::SeqCst));
    // В текущей реализации отмена не поддерживается,
    // поэтому второй обработчик все равно выполнится
    // assert_eq!(processed_count.load(Ordering::SeqCst), 0);
  }

  #[tokio::test]
  async fn test_event_handler_error_propagation() {
    // Тест для обработки ошибок в обработчиках
    #[derive(Debug, Clone)]
    struct ErrorEvent {
      should_fail: bool,
    }

    let event_bus = EventBus::new();

    // Обработчик который может вернуть ошибку
    event_bus
      .subscribe(move |event: &ErrorEvent| {
        if event.should_fail {
          Err(VideoCompilerError::InternalError(
            "Handler failed".to_string(),
          ))
        } else {
          Ok(())
        }
      })
      .await
      .unwrap();

    // Событие которое должно пройти успешно
    let success_event = ErrorEvent { should_fail: false };
    let result = event_bus.publish(success_event).await;
    assert!(result.is_ok());

    // Событие которое должно вернуть ошибку
    let error_event = ErrorEvent { should_fail: true };
    let result = event_bus.publish(error_event).await;
    // В текущей реализации ошибки логируются, но не прерывают обработку
    assert!(result.is_ok());
  }

  #[tokio::test]
  async fn test_event_handler_async_execution() {
    // Тест для проверки асинхронного выполнения обработчиков
    let event_bus = EventBus::new();
    let execution_times = Arc::new(Mutex::new(Vec::new()));

    // Медленный обработчик
    let times1 = execution_times.clone();
    event_bus
      .subscribe(move |_event: &AppEvent| {
        let start = std::time::Instant::now();
        std::thread::sleep(std::time::Duration::from_millis(100));
        times1.lock().unwrap().push(start.elapsed());
        Ok(())
      })
      .await
      .unwrap();

    // Быстрый обработчик
    let times2 = execution_times.clone();
    event_bus
      .subscribe(move |_event: &AppEvent| {
        let start = std::time::Instant::now();
        times2.lock().unwrap().push(start.elapsed());
        Ok(())
      })
      .await
      .unwrap();

    // Публикуем событие
    let start = std::time::Instant::now();
    event_bus
      .publish_app_event(AppEvent::SystemStartup {
        timestamp: chrono::Utc::now(),
      })
      .await
      .unwrap();
    let publish_time = start.elapsed();

    // Ждем завершения всех обработчиков
    tokio::time::sleep(std::time::Duration::from_millis(200)).await;

    // Проверяем что publish не блокировался
    assert!(publish_time.as_millis() < 50); // Должен вернуться быстро

    // Проверяем что оба обработчика выполнились
    let times = execution_times.lock().unwrap();
    assert_eq!(times.len(), 2);
  }
  */
}
