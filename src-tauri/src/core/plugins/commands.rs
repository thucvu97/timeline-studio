//! Tauri команды для управления плагинами

use crate::core::plugins::{
  manager::PluginManager,
  permissions::PluginPermissions,
  plugin::{PluginCommand, PluginMetadata, PluginResponse},
};
use serde_json::Value;
use tauri::State;
use uuid::Uuid;

/// Загрузить плагин
#[tauri::command]
pub async fn load_plugin(
  plugin_id: String,
  permissions: Option<PluginPermissions>,
  plugin_manager: State<'_, PluginManager>,
) -> Result<String, String> {
  let permissions = permissions.unwrap_or_default();

  plugin_manager
    .load_plugin(&plugin_id, permissions)
    .await
    .map_err(|e| e.to_string())
}

/// Выгрузить плагин
#[tauri::command]
pub async fn unload_plugin(
  plugin_id: String,
  plugin_manager: State<'_, PluginManager>,
) -> Result<(), String> {
  plugin_manager
    .unload_plugin(&plugin_id)
    .await
    .map_err(|e| e.to_string())
}

/// Получить список загруженных плагинов
#[tauri::command]
pub async fn list_loaded_plugins(
  plugin_manager: State<'_, PluginManager>,
) -> Result<Vec<(String, String)>, String> {
  let plugins = plugin_manager.list_loaded_plugins().await;
  Ok(
    plugins
      .into_iter()
      .map(|(id, state)| (id, format!("{:?}", state)))
      .collect(),
  )
}

/// Получить список всех доступных плагинов
#[tauri::command]
pub async fn list_available_plugins(
  plugin_manager: State<'_, PluginManager>,
) -> Result<Vec<PluginMetadata>, String> {
  let registry = plugin_manager.loader().registry();
  Ok(registry.list_plugins().await)
}

/// Отправить команду плагину
#[tauri::command]
pub async fn send_plugin_command(
  plugin_id: String,
  command: String,
  params: Value,
  plugin_manager: State<'_, PluginManager>,
) -> Result<PluginResponse, String> {
  let params_map = match params {
    Value::Object(map) => map,
    _ => Default::default(),
  };

  let plugin_command = PluginCommand {
    id: Uuid::new_v4(),
    command,
    params: serde_json::Value::Object(params_map),
  };

  plugin_manager
    .send_command(&plugin_id, plugin_command)
    .await
    .map_err(|e| e.to_string())
}

/// Получить информацию о плагине
#[tauri::command]
pub async fn get_plugin_info(
  plugin_id: String,
  plugin_manager: State<'_, PluginManager>,
) -> Result<Value, String> {
  plugin_manager
    .get_plugin_info(&plugin_id)
    .await
    .map_err(|e| e.to_string())
}

/// Приостановить плагин
#[tauri::command]
pub async fn suspend_plugin(
  plugin_id: String,
  plugin_manager: State<'_, PluginManager>,
) -> Result<(), String> {
  plugin_manager
    .suspend_plugin(&plugin_id)
    .await
    .map_err(|e| e.to_string())
}

/// Возобновить работу плагина
#[tauri::command]
pub async fn resume_plugin(
  plugin_id: String,
  plugin_manager: State<'_, PluginManager>,
) -> Result<(), String> {
  plugin_manager
    .resume_plugin(&plugin_id)
    .await
    .map_err(|e| e.to_string())
}

/// Получить статистику sandbox всех плагинов
#[tauri::command]
pub async fn get_plugins_sandbox_stats(
  plugin_manager: State<'_, PluginManager>,
) -> Result<Vec<Value>, String> {
  let stats = plugin_manager.get_sandbox_stats().await;
  stats
    .into_iter()
    .map(|stat| serde_json::to_value(stat).map_err(|e| e.to_string()))
    .collect()
}

/// Получить плагины, нарушившие лимиты ресурсов
#[tauri::command]
pub async fn get_violating_plugins(
  plugin_manager: State<'_, PluginManager>,
) -> Result<Vec<String>, String> {
  Ok(plugin_manager.get_violating_plugins().await)
}

/// Сбросить нарушения лимитов для плагина
#[tauri::command]
pub async fn reset_plugin_violations(
  plugin_id: String,
  plugin_manager: State<'_, PluginManager>,
) -> Result<bool, String> {
  Ok(plugin_manager.reset_plugin_violations(&plugin_id).await)
}

/// Зарегистрировать примеры плагинов
#[tauri::command]
pub async fn register_example_plugins(
  plugin_manager: State<'_, PluginManager>,
) -> Result<(), String> {
  let registry = plugin_manager.loader().registry();
  crate::plugins::register_example_plugins(&registry)
    .await
    .map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::core::plugins::plugin::Version;
  use crate::core::{EventBus, ServiceContainer};
  use std::sync::Arc;

  async fn create_test_plugin_manager() -> PluginManager {
    let app_version = Version::new(1, 0, 0);
    let event_bus = Arc::new(EventBus::new());
    let service_container = Arc::new(ServiceContainer::new());

    PluginManager::new(app_version, event_bus, service_container)
  }

  #[tokio::test]
  async fn test_register_example_plugins() {
    let manager = create_test_plugin_manager().await;

    // Регистрируем примеры плагинов
    let registry = manager.loader().registry();
    assert!(crate::plugins::register_example_plugins(&registry)
      .await
      .is_ok());

    // Проверяем что плагины зарегистрированы
    let plugins = registry.list_plugins().await;
    assert!(plugins.len() >= 2);

    // Проверяем конкретные плагины
    assert!(registry.find_plugin("blur-effect").await.is_some());
    assert!(registry.find_plugin("youtube-uploader").await.is_some());
  }
}
