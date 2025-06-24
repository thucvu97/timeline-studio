//! Менеджер плагинов

use super::{
  context::PluginContext,
  loader::PluginLoader,
  permissions::PluginPermissions,
  plugin::{AppEventType, Plugin, PluginCommand, PluginResponse, PluginState},
  sandbox::SandboxManager,
};
use crate::core::telemetry::metrics::Metrics;
use crate::core::{AppEvent, EventBus, MetricsCollector, Service, ServiceContainer, Tracer};
use crate::video_compiler::error::{Result, VideoCompilerError};
use async_trait::async_trait;
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::RwLock;
use uuid::Uuid;

/// Handle для управления загруженным плагином
pub struct PluginHandle {
  pub id: String,
  pub instance_id: String,
  pub plugin: Box<dyn Plugin>,
  pub context: PluginContext,
  pub state: PluginState,
}

/// Менеджер плагинов
pub struct PluginManager {
  plugins: Arc<RwLock<HashMap<String, PluginHandle>>>,
  loader: Arc<PluginLoader>,
  event_bus: Arc<EventBus>,
  service_container: Arc<ServiceContainer>,
  app_version: super::plugin::Version,
  tracer: Option<Arc<Tracer>>,
  metrics: Option<Arc<Metrics>>,
  sandbox_manager: Arc<SandboxManager>,
}

impl PluginManager {
  /// Создать новый менеджер плагинов
  pub fn new(
    app_version: super::plugin::Version,
    event_bus: Arc<EventBus>,
    service_container: Arc<ServiceContainer>,
  ) -> Self {
    let loader = Arc::new(PluginLoader::new(app_version.clone()));
    let sandbox_manager = Arc::new(SandboxManager::new());

    Self {
      plugins: Arc::new(RwLock::new(HashMap::new())),
      loader,
      event_bus,
      service_container,
      app_version,
      tracer: None,
      metrics: None,
      sandbox_manager,
    }
  }

  /// Добавить телеметрию
  pub fn with_telemetry(
    mut self,
    tracer: Arc<Tracer>,
    collector: Arc<MetricsCollector>,
  ) -> Result<Self> {
    self.tracer = Some(tracer);
    self.metrics = Some(Arc::new(Metrics::new(&collector)?));
    Ok(self)
  }

  /// Получить загрузчик плагинов
  pub fn loader(&self) -> Arc<PluginLoader> {
    self.loader.clone()
  }

  /// Загрузить и инициализировать плагин
  pub async fn load_plugin(
    &self,
    plugin_id: &str,
    permissions: PluginPermissions,
  ) -> Result<String> {
    // Трассируем операцию
    let tracer = self.tracer.clone();
    let span = tracer.as_ref().map(|t| {
      t.span("plugin.load")
        .with_attribute("plugin.id", plugin_id.to_string())
        .with_attribute("permissions.ui_access", permissions.ui_access)
        .with_attribute("permissions.process_spawn", permissions.process_spawn)
        .start()
    });

    let _guard = span.as_ref().map(|s| s.enter());

    // Проверяем не загружен ли уже
    {
      let plugins = self.plugins.read().await;
      if plugins.contains_key(plugin_id) {
        return Err(VideoCompilerError::InvalidParameter(format!(
          "Plugin '{}' is already loaded",
          plugin_id
        )));
      }
    }

    // Загружаем плагин
    let mut plugin = self.loader.load_plugin(plugin_id).await?;

    // Получаем версию до перемещения plugin
    let version_string = plugin.metadata().version.to_string();
    let plugin_type = format!("{:?}", plugin.metadata().plugin_type);

    // Создаем контекст
    let context = PluginContext::new(
      plugin_id,
      self.app_version.clone(),
      self.event_bus.clone(),
      self.service_container.clone(),
      permissions.clone(),
    );

    // Создаем sandbox для плагина
    let _sandbox = self
      .sandbox_manager
      .create_sandbox(plugin_id.to_string(), &permissions)
      .await;

    // Создаем директории
    context
      .ensure_directories()
      .await
      .map_err(|e| VideoCompilerError::IoError(e.to_string()))?;

    // Инициализируем плагин
    plugin.initialize(context.clone()).await?;

    let instance_id = context.instance_id.clone();

    // Сохраняем handle
    let handle = PluginHandle {
      id: plugin_id.to_string(),
      instance_id: instance_id.clone(),
      plugin,
      context,
      state: PluginState::Active,
    };

    {
      let mut plugins = self.plugins.write().await;
      plugins.insert(plugin_id.to_string(), handle);
    }

    // Обновляем метрики
    if let Some(metrics) = &self.metrics {
      let plugin_id_str = plugin_id.to_string();
      let plugin_type_str = plugin_type.as_str().to_string();
      metrics.plugin_loads_total.inc();

      metrics.plugin_active_count.add(1);
    }

    // Публикуем событие
    self
      .event_bus
      .publish_app_event(AppEvent::PluginLoaded {
        plugin_id: plugin_id.to_string(),
        version: version_string,
      })
      .await?;

    log::info!("Plugin '{}' loaded and initialized", plugin_id);

    Ok(instance_id)
  }

  /// Выгрузить плагин
  pub async fn unload_plugin(&self, plugin_id: &str) -> Result<()> {
    let mut handle = {
      let mut plugins = self.plugins.write().await;
      plugins.remove(plugin_id).ok_or_else(|| {
        VideoCompilerError::InvalidParameter(format!("Plugin '{}' is not loaded", plugin_id))
      })?
    };

    // Останавливаем плагин
    handle.state = PluginState::Stopping;
    handle.plugin.shutdown().await?;
    handle.state = PluginState::Stopped;

    // Очищаем временные файлы
    handle
      .context
      .cleanup_temp_files()
      .await
      .map_err(|e| VideoCompilerError::IoError(e.to_string()))?;

    // Удаляем sandbox плагина
    self.sandbox_manager.remove_sandbox(plugin_id).await;

    // Обновляем метрики
    if let Some(metrics) = &self.metrics {
      metrics.plugin_active_count.add(-1);
    }

    // Публикуем событие
    self
      .event_bus
      .publish_app_event(AppEvent::PluginUnloaded {
        plugin_id: plugin_id.to_string(),
      })
      .await?;

    log::info!("Plugin '{}' unloaded", plugin_id);

    Ok(())
  }

  /// Отправить команду плагину
  pub async fn send_command(
    &self,
    plugin_id: &str,
    command: PluginCommand,
  ) -> Result<PluginResponse> {
    // Измеряем время выполнения команды
    let start = std::time::Instant::now();
    let command_name = command.command.clone();

    let plugins = self.plugins.read().await;

    let handle = plugins.get(plugin_id).ok_or_else(|| {
      VideoCompilerError::InvalidParameter(format!("Plugin '{}' is not loaded", plugin_id))
    })?;

    // Проверяем состояние
    match handle.state {
      PluginState::Active => {}
      PluginState::Suspended => {
        return Err(VideoCompilerError::InvalidParameter(format!(
          "Plugin '{}' is suspended",
          plugin_id
        )));
      }
      _ => {
        return Err(VideoCompilerError::InvalidParameter(format!(
          "Plugin '{}' is not active",
          plugin_id
        )));
      }
    }

    // Отправляем команду
    let result = handle.plugin.handle_command(command).await;

    // Обновляем метрики
    if let Some(metrics) = &self.metrics {
      let duration = start.elapsed();
      let plugin_id_str = plugin_id.to_string();
      let command_name_str = command_name.as_str().to_string();
      metrics
        .plugin_command_duration
        .observe(duration.as_secs_f64());

      if result.is_err() {
        metrics.plugin_errors_total.inc();
      }
    }

    result
  }

  /// Передать событие всем заинтересованным плагинам
  pub async fn dispatch_event(&self, event: &AppEvent) -> Result<()> {
    let event_type = match event {
      AppEvent::ProjectCreated { .. } => AppEventType::ProjectCreated,
      AppEvent::ProjectOpened { .. } => AppEventType::ProjectOpened,
      AppEvent::ProjectSaved { .. } => AppEventType::ProjectSaved,
      AppEvent::ProjectClosed { .. } => AppEventType::ProjectClosed,
      AppEvent::MediaImported { .. } => AppEventType::MediaImported,
      AppEvent::MediaProcessed { .. } => AppEventType::MediaProcessed,
      AppEvent::RenderStarted { .. } => AppEventType::RenderStarted,
      AppEvent::RenderProgress { .. } => AppEventType::RenderProgress,
      AppEvent::RenderCompleted { .. } => AppEventType::RenderCompleted,
      AppEvent::RenderFailed { .. } => AppEventType::RenderFailed,
      _ => return Ok(()), // Игнорируем неизвестные события
    };

    let plugins = self.plugins.read().await;

    for (plugin_id, handle) in plugins.iter() {
      // Проверяем активен ли плагин
      if handle.state != PluginState::Active {
        continue;
      }

      // Проверяем подписан ли плагин на событие
      let subscribed = handle.plugin.subscribed_events();
      if !subscribed.contains(&event_type) && !subscribed.contains(&AppEventType::All) {
        continue;
      }

      // Отправляем событие
      match handle.plugin.handle_event(event).await {
        Ok(_) => {}
        Err(e) => {
          log::error!("Plugin '{}' failed to handle event: {}", plugin_id, e);
        }
      }
    }

    Ok(())
  }

  /// Получить список загруженных плагинов
  pub async fn list_loaded_plugins(&self) -> Vec<(String, PluginState)> {
    let plugins = self.plugins.read().await;
    plugins
      .iter()
      .map(|(id, handle)| (id.clone(), handle.state.clone()))
      .collect()
  }

  /// Приостановить плагин
  pub async fn suspend_plugin(&self, plugin_id: &str) -> Result<()> {
    let mut plugins = self.plugins.write().await;

    let handle = plugins.get_mut(plugin_id).ok_or_else(|| {
      VideoCompilerError::InvalidParameter(format!("Plugin '{}' is not loaded", plugin_id))
    })?;

    if handle.state != PluginState::Active {
      return Err(VideoCompilerError::InvalidParameter(format!(
        "Plugin '{}' is not active",
        plugin_id
      )));
    }

    handle.plugin.suspend().await?;
    handle.state = PluginState::Suspended;

    log::info!("Plugin '{}' suspended", plugin_id);

    Ok(())
  }

  /// Возобновить работу плагина
  pub async fn resume_plugin(&self, plugin_id: &str) -> Result<()> {
    let mut plugins = self.plugins.write().await;

    let handle = plugins.get_mut(plugin_id).ok_or_else(|| {
      VideoCompilerError::InvalidParameter(format!("Plugin '{}' is not loaded", plugin_id))
    })?;

    if handle.state != PluginState::Suspended {
      return Err(VideoCompilerError::InvalidParameter(format!(
        "Plugin '{}' is not suspended",
        plugin_id
      )));
    }

    handle.plugin.resume().await?;
    handle.state = PluginState::Active;

    log::info!("Plugin '{}' resumed", plugin_id);

    Ok(())
  }

  /// Получить информацию о плагине
  pub async fn get_plugin_info(&self, plugin_id: &str) -> Result<serde_json::Value> {
    let plugins = self.plugins.read().await;

    let handle = plugins.get(plugin_id).ok_or_else(|| {
      VideoCompilerError::InvalidParameter(format!("Plugin '{}' is not loaded", plugin_id))
    })?;

    let metadata = handle.plugin.metadata();

    Ok(serde_json::json!({
        "id": metadata.id,
        "name": metadata.name,
        "version": metadata.version.to_string(),
        "author": metadata.author,
        "description": metadata.description,
        "type": format!("{:?}", metadata.plugin_type),
        "state": format!("{:?}", handle.state),
        "instance_id": handle.instance_id,
        "permissions": handle.context.permissions,
    }))
  }

  /// Получить статистику sandbox для всех плагинов
  pub async fn get_sandbox_stats(&self) -> Vec<super::sandbox::SandboxStats> {
    self.sandbox_manager.get_all_stats().await
  }

  /// Получить статистику sandbox для конкретного плагина
  pub async fn get_plugin_sandbox_stats(
    &self,
    plugin_id: &str,
  ) -> Option<super::sandbox::SandboxStats> {
    if let Some(sandbox) = self.sandbox_manager.get_sandbox(plugin_id).await {
      Some(sandbox.get_usage_stats().await)
    } else {
      None
    }
  }

  /// Найти плагины, нарушившие лимиты ресурсов
  pub async fn get_violating_plugins(&self) -> Vec<String> {
    self.sandbox_manager.get_violating_plugins().await
  }

  /// Сбросить нарушения лимитов для плагина
  pub async fn reset_plugin_violations(&self, plugin_id: &str) -> bool {
    if let Some(sandbox) = self.sandbox_manager.get_sandbox(plugin_id).await {
      sandbox.reset_violation_flag();
      true
    } else {
      false
    }
  }

  /// Получить SandboxManager для прямого доступа
  pub fn sandbox_manager(&self) -> Arc<SandboxManager> {
    self.sandbox_manager.clone()
  }
}

/// PluginManager как сервис для DI
#[async_trait]
impl Service for PluginManager {
  async fn initialize(&mut self) -> Result<()> {
    log::info!("Initializing Plugin Manager");

    // Здесь можно загрузить плагины из конфигурации
    // или выполнить другую инициализацию

    Ok(())
  }

  async fn shutdown(&mut self) -> Result<()> {
    log::info!("Shutting down Plugin Manager");

    // Выгружаем все плагины
    let plugin_ids: Vec<String> = {
      let plugins = self.plugins.read().await;
      plugins.keys().cloned().collect()
    };

    for plugin_id in plugin_ids {
      if let Err(e) = self.unload_plugin(&plugin_id).await {
        log::error!("Failed to unload plugin '{}': {}", plugin_id, e);
      }
    }

    Ok(())
  }

  fn name(&self) -> &'static str {
    "PluginManager"
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::core::plugins::context::PluginContext;
  use crate::core::plugins::plugin::{PluginMetadata, PluginType, Version};

  struct TestPlugin {
    metadata: PluginMetadata,
    initialized: bool,
  }

  impl TestPlugin {
    fn new() -> Self {
      Self {
        metadata: PluginMetadata {
          id: "test-plugin".to_string(),
          name: "Test Plugin".to_string(),
          version: Version::new(1, 0, 0),
          author: "Test".to_string(),
          description: "Test plugin".to_string(),
          plugin_type: PluginType::Universal,
          homepage: None,
          license: None,
          dependencies: vec![],
          min_app_version: None,
        },
        initialized: false,
      }
    }
  }

  #[async_trait]
  impl Plugin for TestPlugin {
    fn metadata(&self) -> &PluginMetadata {
      &self.metadata
    }

    async fn initialize(&mut self, _context: PluginContext) -> Result<()> {
      self.initialized = true;
      Ok(())
    }

    async fn shutdown(&mut self) -> Result<()> {
      self.initialized = false;
      Ok(())
    }

    async fn handle_command(&self, command: PluginCommand) -> Result<PluginResponse> {
      Ok(PluginResponse {
        command_id: command.id,
        success: true,
        data: Some(serde_json::json!({"echo": command.command})),
        error: None,
      })
    }

    fn subscribed_events(&self) -> Vec<AppEventType> {
      vec![AppEventType::ProjectCreated, AppEventType::ProjectClosed]
    }
  }

  #[tokio::test]
  async fn test_plugin_manager_lifecycle() {
    let event_bus = Arc::new(EventBus::new());
    let service_container = Arc::new(ServiceContainer::new());
    let app_version = Version::new(1, 0, 0);

    let manager = PluginManager::new(app_version, event_bus, service_container);

    // Регистрируем тестовый плагин
    let registry = manager.loader().registry();
    let plugin = TestPlugin::new();
    let metadata = plugin.metadata().clone();
    let factory = Box::new(|| Box::new(TestPlugin::new()) as Box<dyn Plugin>);

    registry
      .register(crate::core::plugins::loader::PluginRegistration { metadata, factory })
      .await
      .unwrap();

    // Загружаем плагин
    let permissions = PluginPermissions::default();
    let instance_id = manager
      .load_plugin("test-plugin", permissions)
      .await
      .unwrap();
    assert!(!instance_id.is_empty());

    // Проверяем список загруженных плагинов
    let loaded = manager.list_loaded_plugins().await;
    assert_eq!(loaded.len(), 1);
    assert_eq!(loaded[0].0, "test-plugin");
    assert_eq!(loaded[0].1, PluginState::Active);

    // Отправляем команду
    let command = PluginCommand {
      id: Uuid::new_v4(),
      command: "test".to_string(),
      params: serde_json::json!({}),
    };

    let response = manager.send_command("test-plugin", command).await.unwrap();
    assert!(response.success);

    // Выгружаем плагин
    manager.unload_plugin("test-plugin").await.unwrap();

    // Проверяем что плагин выгружен
    let loaded = manager.list_loaded_plugins().await;
    assert_eq!(loaded.len(), 0);
  }
}
