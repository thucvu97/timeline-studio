//! API доступное плагинам

use crate::{
  core::{
    di::ServiceContainer,
    events::{AppEvent, EventBus},
    plugins::permissions::{PluginPermissions, SecurityLevel},
  },
  video_compiler::error::{Result, VideoCompilerError},
};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use std::{
  collections::HashMap,
  path::{Path, PathBuf},
  sync::Arc,
};
use tokio::sync::RwLock;

/// Информация о медиа файле
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MediaInfo {
  pub id: String,
  pub path: PathBuf,
  pub duration: f64,
  pub width: u32,
  pub height: u32,
  pub fps: f32,
  pub codec: String,
  pub bitrate: u64,
}

/// Эффект для применения к медиа
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Effect {
  pub effect_type: String,
  pub parameters: serde_json::Value,
}

/// Состояние timeline
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimelineState {
  pub duration: f64,
  pub current_time: f64,
  pub tracks: Vec<TrackInfo>,
}

/// Информация о треке
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrackInfo {
  pub id: String,
  pub track_type: String,
  pub name: String,
  pub clips: Vec<ClipInfo>,
  pub muted: bool,
  pub locked: bool,
  pub height: u32,
}

/// Информация о клипе
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClipInfo {
  pub id: String,
  pub media_id: String,
  pub start_time: f64,
  pub duration: f64,
  pub in_point: f64,
  pub out_point: f64,
}

/// Клип для добавления
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Clip {
  pub media_id: String,
  pub track_id: String,
  pub start_time: f64,
  pub duration: f64,
}

/// Диалог плагина
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PluginDialog {
  pub title: String,
  pub message: String,
  pub dialog_type: DialogType,
  pub buttons: Vec<String>,
}

/// Тип диалога
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum DialogType {
  Info,
  Warning,
  Error,
  Question,
  Input,
}

/// Результат диалога
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DialogResult {
  pub button_index: Option<usize>,
  pub input_text: Option<String>,
  pub cancelled: bool,
}

/// Пункт меню
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MenuItem {
  pub id: String,
  pub label: String,
  pub parent_menu: Option<String>,
  pub shortcut: Option<String>,
  pub enabled: bool,
}

/// Хранилище данных плагина
#[async_trait]
pub trait PluginStorage: Send + Sync {
  /// Сохранить данные
  async fn set(&self, key: &str, value: serde_json::Value) -> Result<()>;

  /// Получить данные
  async fn get(&self, key: &str) -> Result<Option<serde_json::Value>>;

  /// Удалить данные
  async fn remove(&self, key: &str) -> Result<()>;

  /// Получить все ключи
  async fn keys(&self) -> Result<Vec<String>>;

  /// Очистить все данные
  async fn clear(&self) -> Result<()>;
}

/// API доступное плагинам
#[async_trait]
pub trait PluginApi: Send + Sync {
  // Работа с медиа

  /// Получить информацию о медиа файле
  async fn get_media_info(&self, media_id: &str) -> Result<MediaInfo>;

  /// Применить эффект к медиа
  async fn apply_effect(&self, media_id: &str, effect: Effect) -> Result<()>;

  /// Создать превью для медиа
  async fn generate_thumbnail(&self, media_id: &str, time: f64) -> Result<PathBuf>;

  // Работа с timeline

  /// Получить текущее состояние timeline
  async fn get_timeline_state(&self) -> Result<TimelineState>;

  /// Добавить клип на timeline
  async fn add_clip(&self, clip: Clip) -> Result<String>;

  /// Удалить клип с timeline
  async fn remove_clip(&self, clip_id: &str) -> Result<()>;

  /// Обновить клип
  async fn update_clip(&self, clip_id: &str, clip: ClipInfo) -> Result<()>;

  // UI интеграция

  /// Показать диалог
  async fn show_dialog(&self, dialog: PluginDialog) -> Result<DialogResult>;

  /// Добавить пункт меню
  async fn add_menu_item(&self, menu: MenuItem) -> Result<()>;

  /// Удалить пункт меню
  async fn remove_menu_item(&self, menu_id: &str) -> Result<()>;

  /// Показать уведомление
  async fn show_notification(&self, title: &str, message: &str) -> Result<()>;

  // Хранилище данных

  /// Получить хранилище плагина
  async fn get_storage(&self) -> Result<Box<dyn PluginStorage>>;

  // Файловая система

  /// Выбрать файл через диалог
  async fn pick_file(&self, filters: Vec<(&str, Vec<&str>)>) -> Result<Option<PathBuf>>;

  /// Выбрать директорию через диалог
  async fn pick_directory(&self) -> Result<Option<PathBuf>>;

  /// Прочитать файл (с проверкой разрешений)
  async fn read_file(&self, path: &Path) -> Result<Vec<u8>>;

  /// Записать файл (с проверкой разрешений)
  async fn write_file(&self, path: &Path, data: &[u8]) -> Result<()>;

  // Системная информация

  /// Получить информацию о системе
  async fn get_system_info(&self) -> Result<SystemInfo>;
}

/// Информация о системе
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SystemInfo {
  pub os: String,
  pub arch: String,
  pub cpu_count: usize,
  pub memory_total: u64,
  pub memory_available: u64,
}

/// Реализация хранилища плагина
#[derive(Clone)]
struct PluginStorageImpl {
  #[allow(dead_code)]
  plugin_id: String,
  storage_path: PathBuf,
  data: Arc<RwLock<HashMap<String, serde_json::Value>>>,
}

impl PluginStorageImpl {
  async fn new(plugin_id: String, storage_path: PathBuf) -> Result<Self> {
    // Создать директорию если не существует
    tokio::fs::create_dir_all(&storage_path)
      .await
      .map_err(|e| VideoCompilerError::IoError(e.to_string()))?;

    // Загрузить существующие данные
    let data_file = storage_path.join("data.json");
    let data = if data_file.exists() {
      let contents = tokio::fs::read_to_string(&data_file)
        .await
        .map_err(|e| VideoCompilerError::IoError(e.to_string()))?;
      serde_json::from_str(&contents).unwrap_or_default()
    } else {
      HashMap::new()
    };

    Ok(Self {
      plugin_id,
      storage_path,
      data: Arc::new(RwLock::new(data)),
    })
  }

  async fn save(&self) -> Result<()> {
    let data = self.data.read().await;
    let json = serde_json::to_string_pretty(&*data)
      .map_err(|e| VideoCompilerError::SerializationError(e.to_string()))?;

    let data_file = self.storage_path.join("data.json");
    tokio::fs::write(&data_file, json)
      .await
      .map_err(|e| VideoCompilerError::IoError(e.to_string()))?;

    Ok(())
  }
}

#[async_trait]
impl PluginStorage for PluginStorageImpl {
  async fn set(&self, key: &str, value: serde_json::Value) -> Result<()> {
    {
      let mut data = self.data.write().await;
      data.insert(key.to_string(), value);
    }
    self.save().await
  }

  async fn get(&self, key: &str) -> Result<Option<serde_json::Value>> {
    let data = self.data.read().await;
    Ok(data.get(key).cloned())
  }

  async fn remove(&self, key: &str) -> Result<()> {
    {
      let mut data = self.data.write().await;
      data.remove(key);
    }
    self.save().await
  }

  async fn keys(&self) -> Result<Vec<String>> {
    let data = self.data.read().await;
    Ok(data.keys().cloned().collect())
  }

  async fn clear(&self) -> Result<()> {
    {
      let mut data = self.data.write().await;
      data.clear();
    }
    self.save().await
  }
}

/// Реализация PluginApi
#[derive(Clone)]
pub struct PluginApiImpl {
  plugin_id: String,
  permissions: Arc<PluginPermissions>,
  #[allow(dead_code)]
  service_container: Arc<ServiceContainer>,
  #[allow(dead_code)]
  app_handle: Option<tauri::AppHandle>,
  storage_path: PathBuf,
  event_bus: Arc<EventBus>,
  // Мосты для интеграции с сервисами
  media_bridge: super::services::MediaBridge,
  timeline_bridge: super::services::TimelineBridge,
  ui_bridge: super::services::UIBridge,
}

impl PluginApiImpl {
  pub fn new(
    plugin_id: String,
    permissions: Arc<PluginPermissions>,
    service_container: Arc<ServiceContainer>,
    app_handle: Option<tauri::AppHandle>,
    storage_path: PathBuf,
    event_bus: Arc<EventBus>,
  ) -> Self {
    // Создаем мосты для интеграции
    let media_bridge = super::services::MediaBridge::new(
      service_container.clone(),
      permissions.clone(),
      plugin_id.clone(),
    );

    let timeline_bridge = super::services::TimelineBridge::new(
      service_container.clone(),
      permissions.clone(),
      plugin_id.clone(),
    );

    let ui_bridge = super::services::UIBridge::new(
      service_container.clone(),
      permissions.clone(),
      plugin_id.clone(),
      app_handle.clone(),
    );

    Self {
      plugin_id,
      permissions,
      service_container,
      app_handle,
      storage_path,
      event_bus,
      media_bridge,
      timeline_bridge,
      ui_bridge,
    }
  }

  /// Проверить разрешение
  fn check_permission(&self, required: &str) -> Result<()> {
    let security_level = self.permissions.get_security_level();

    match required {
      "media_read" => {
        if security_level >= SecurityLevel::Minimal {
          Ok(())
        } else {
          Err(VideoCompilerError::SecurityError(format!(
            "Permission denied: {}",
            required
          )))
        }
      }
      "media_write" => {
        if security_level >= SecurityLevel::Standard {
          Ok(())
        } else {
          Err(VideoCompilerError::SecurityError(format!(
            "Permission denied: {}",
            required
          )))
        }
      }
      "timeline_read" => {
        if security_level >= SecurityLevel::Minimal {
          Ok(())
        } else {
          Err(VideoCompilerError::SecurityError(format!(
            "Permission denied: {}",
            required
          )))
        }
      }
      "timeline_write" => {
        if security_level >= SecurityLevel::Standard {
          Ok(())
        } else {
          Err(VideoCompilerError::SecurityError(format!(
            "Permission denied: {}",
            required
          )))
        }
      }
      "ui_access" => {
        if self.permissions.ui_access {
          Ok(())
        } else {
          Err(VideoCompilerError::SecurityError(format!(
            "Permission denied: {}",
            required
          )))
        }
      }
      "file_read" => {
        if security_level >= SecurityLevel::Standard {
          Ok(())
        } else {
          Err(VideoCompilerError::SecurityError(format!(
            "Permission denied: {}",
            required
          )))
        }
      }
      "file_write" => {
        if security_level >= SecurityLevel::Extended {
          Ok(())
        } else {
          Err(VideoCompilerError::SecurityError(format!(
            "Permission denied: {}",
            required
          )))
        }
      }
      "system_info" => {
        if self.permissions.system_info {
          Ok(())
        } else {
          Err(VideoCompilerError::SecurityError(format!(
            "Permission denied: {}",
            required
          )))
        }
      }
      _ => Err(VideoCompilerError::SecurityError(format!(
        "Unknown permission: {}",
        required
      ))),
    }
  }

  /// Проверить путь для чтения
  fn check_read_path(&self, path: &Path) -> Result<()> {
    if self.permissions.file_system.can_read(path) {
      Ok(())
    } else {
      Err(VideoCompilerError::SecurityError(format!(
        "Read access denied for path: {:?}",
        path
      )))
    }
  }

  /// Проверить путь для записи
  fn check_write_path(&self, path: &Path) -> Result<()> {
    if self.permissions.file_system.can_write(path) {
      Ok(())
    } else {
      Err(VideoCompilerError::SecurityError(format!(
        "Write access denied for path: {:?}",
        path
      )))
    }
  }
}

#[async_trait]
impl PluginApi for PluginApiImpl {
  async fn get_media_info(&self, media_id: &str) -> Result<MediaInfo> {
    // Используем MediaBridge для получения информации о медиа
    self.media_bridge.get_media_info(media_id).await
  }

  async fn apply_effect(&self, media_id: &str, effect: Effect) -> Result<()> {
    // Используем MediaBridge для применения эффекта
    self.media_bridge.apply_effect(media_id, &effect).await?;

    // Публикуем событие о применении эффекта
    self
      .event_bus
      .publish_app_event(AppEvent::EffectApplied {
        media_id: media_id.to_string(),
        effect_type: effect.effect_type.clone(),
        parameters: effect.parameters.to_string(),
      })
      .await?;

    Ok(())
  }

  async fn generate_thumbnail(&self, media_id: &str, time: f64) -> Result<PathBuf> {
    // Создаем путь для thumbnail
    let thumbnail_dir = self.storage_path.join("thumbnails");
    let thumbnail_path = thumbnail_dir.join(format!(
      "{}_{}.jpg",
      media_id.replace(['/', '\\'], "_"),
      (time * 1000.0) as u64
    ));

    // Используем MediaBridge для генерации thumbnail
    self
      .media_bridge
      .generate_thumbnail(media_id, time, &thumbnail_path)
      .await?;

    // Публикуем событие о создании thumbnail
    if let Err(e) = self
      .event_bus
      .publish_app_event(AppEvent::ThumbnailGenerated {
        media_id: media_id.to_string(),
        thumbnail_path: thumbnail_path.to_string_lossy().to_string(),
      })
      .await
    {
      log::warn!(
        "[Plugin {}] Failed to publish ThumbnailGenerated event: {}",
        self.plugin_id,
        e
      );
    }

    Ok(thumbnail_path)
  }

  async fn get_timeline_state(&self) -> Result<TimelineState> {
    // Используем TimelineBridge для получения состояния timeline
    self.timeline_bridge.get_timeline_state().await
  }

  async fn add_clip(&self, clip: Clip) -> Result<String> {
    // Конвертируем клип в JSON для передачи в TimelineBridge
    let clip_data = serde_json::json!({
      "media_id": clip.media_id,
      "start_time": clip.start_time,
      "duration": clip.duration
    });

    // Используем TimelineBridge для добавления клипа
    let clip_id = self
      .timeline_bridge
      .add_clip(&clip.track_id, clip_data)
      .await?;

    // Публикуем событие о добавлении клипа
    if let Err(e) = self
      .event_bus
      .publish_app_event(AppEvent::PluginEvent {
        plugin_id: self.plugin_id.clone(),
        event: serde_json::json!({
          "type": "timeline.clip.added",
          "clip_id": clip_id,
          "track_id": clip.track_id,
          "start_time": clip.start_time,
          "duration": clip.duration,
          "media_id": clip.media_id
        }),
      })
      .await
    {
      log::warn!(
        "[Plugin {}] Failed to publish clip added event: {}",
        self.plugin_id,
        e
      );
    }

    Ok(clip_id)
  }

  async fn remove_clip(&self, clip_id: &str) -> Result<()> {
    // Используем TimelineBridge для удаления клипа
    self.timeline_bridge.remove_clip(clip_id).await?;

    // Публикуем событие об удалении клипа
    if let Err(e) = self
      .event_bus
      .publish_app_event(AppEvent::PluginEvent {
        plugin_id: self.plugin_id.clone(),
        event: serde_json::json!({
          "type": "timeline.clip.removed",
          "clip_id": clip_id
        }),
      })
      .await
    {
      log::warn!(
        "[Plugin {}] Failed to publish clip removed event: {}",
        self.plugin_id,
        e
      );
    }

    Ok(())
  }

  async fn update_clip(&self, clip_id: &str, clip: ClipInfo) -> Result<()> {
    // Конвертируем изменения в JSON
    let updates = serde_json::json!({
      "media_id": clip.media_id,
      "start_time": clip.start_time,
      "duration": clip.duration,
      "in_point": clip.in_point,
      "out_point": clip.out_point
    });

    // Используем TimelineBridge для обновления клипа
    self.timeline_bridge.update_clip(clip_id, updates).await?;

    // Публикуем событие об обновлении клипа
    if let Err(e) = self
      .event_bus
      .publish_app_event(AppEvent::PluginEvent {
        plugin_id: self.plugin_id.clone(),
        event: serde_json::json!({
          "type": "timeline.clip.updated",
          "clip_id": clip_id
        }),
      })
      .await
    {
      log::warn!(
        "[Plugin {}] Failed to publish clip updated event: {}",
        self.plugin_id,
        e
      );
    }

    Ok(())
  }

  async fn show_dialog(&self, dialog: PluginDialog) -> Result<DialogResult> {
    // Конвертируем PluginDialog в опции для UIBridge
    let options = serde_json::json!({
      "title": dialog.title,
      "message": dialog.message,
      "buttons": dialog.buttons
    });

    // Конвертируем DialogType в строку
    let dialog_type_str = match dialog.dialog_type {
      DialogType::Info => "info",
      DialogType::Warning => "warning",
      DialogType::Error => "error",
      DialogType::Question => "confirm",
      DialogType::Input => "input",
    };

    // Используем UIBridge для показа диалога
    let result = self.ui_bridge.show_dialog(dialog_type_str, options).await?;

    // Конвертируем результат из JSON в DialogResult
    let button_index = result
      .get("button_index")
      .and_then(|v| v.as_u64())
      .map(|v| v as usize);
    let input_text = result
      .get("input_text")
      .and_then(|v| v.as_str())
      .map(|s| s.to_string());
    let cancelled = result
      .get("cancelled")
      .and_then(|v| v.as_bool())
      .unwrap_or(false);

    Ok(DialogResult {
      button_index,
      input_text,
      cancelled,
    })
  }

  async fn add_menu_item(&self, menu: MenuItem) -> Result<()> {
    // Конвертируем MenuItem в конфигурацию для UIBridge
    let item_config = serde_json::json!({
      "label": menu.label,
      "action": format!("plugin_{}_{}", self.plugin_id, menu.id),
      "shortcut": menu.shortcut,
      "enabled": menu.enabled
    });

    // Определяем путь меню
    let menu_path = menu.parent_menu.unwrap_or_else(|| "plugins".to_string());

    // Используем UIBridge для добавления пункта меню
    self
      .ui_bridge
      .add_menu_item(&menu_path, item_config)
      .await?;

    // Публикуем событие о добавлении пункта меню
    if let Err(e) = self
      .event_bus
      .publish_app_event(AppEvent::PluginEvent {
        plugin_id: self.plugin_id.clone(),
        event: serde_json::json!({
          "type": "ui.menu.added",
          "menu_id": menu.id,
          "menu_path": menu_path,
          "label": menu.label
        }),
      })
      .await
    {
      log::warn!(
        "[Plugin {}] Failed to publish menu added event: {}",
        self.plugin_id,
        e
      );
    }

    Ok(())
  }

  async fn remove_menu_item(&self, menu_id: &str) -> Result<()> {
    // Создаем полный ID меню для плагина
    let full_menu_id = format!("plugin_{}_{}", self.plugin_id, menu_id);

    // Используем UIBridge для удаления пункта меню
    self.ui_bridge.remove_menu_item(&full_menu_id).await?;

    // Публикуем событие об удалении пункта меню
    if let Err(e) = self
      .event_bus
      .publish_app_event(AppEvent::PluginEvent {
        plugin_id: self.plugin_id.clone(),
        event: serde_json::json!({
          "type": "ui.menu.removed",
          "menu_id": menu_id,
          "full_menu_id": full_menu_id
        }),
      })
      .await
    {
      log::warn!(
        "[Plugin {}] Failed to publish menu removed event: {}",
        self.plugin_id,
        e
      );
    }

    Ok(())
  }

  async fn show_notification(&self, title: &str, message: &str) -> Result<()> {
    // Используем UIBridge для показа уведомления
    self
      .ui_bridge
      .show_notification(title, message, "info")
      .await?;

    // Публикуем событие о показе уведомления
    if let Err(e) = self
      .event_bus
      .publish_app_event(AppEvent::PluginEvent {
        plugin_id: self.plugin_id.clone(),
        event: serde_json::json!({
          "type": "ui.notification.shown",
          "title": title,
          "message": message
        }),
      })
      .await
    {
      log::warn!(
        "[Plugin {}] Failed to publish notification event: {}",
        self.plugin_id,
        e
      );
    }

    Ok(())
  }

  async fn get_storage(&self) -> Result<Box<dyn PluginStorage>> {
    // Проверка разрешений не требуется - storage доступен всем плагинам

    let storage =
      PluginStorageImpl::new(self.plugin_id.clone(), self.storage_path.join("storage")).await?;

    Ok(Box::new(storage))
  }

  async fn pick_file(&self, filters: Vec<(&str, Vec<&str>)>) -> Result<Option<PathBuf>> {
    // Конвертируем фильтры в формат для UIBridge
    let filters_json: Vec<serde_json::Value> = filters
      .into_iter()
      .map(|(name, extensions)| {
        serde_json::json!({
          "name": name,
          "extensions": extensions
        })
      })
      .collect();

    let dialog_options = serde_json::json!({
      "title": "Select File",
      "filters": filters_json,
      "multiple": false
    });

    // Используем UIBridge для показа диалога выбора файла
    let result = self
      .ui_bridge
      .show_dialog("file_picker", dialog_options)
      .await?;

    // Парсим результат
    if let Some(files) = result.get("files").and_then(|f| f.as_array()) {
      if let Some(first_file) = files.first().and_then(|f| f.as_str()) {
        return Ok(Some(PathBuf::from(first_file)));
      }
    }

    Ok(None)
  }

  async fn pick_directory(&self) -> Result<Option<PathBuf>> {
    let dialog_options = serde_json::json!({
      "title": "Select Directory",
      "directory": true
    });

    // Используем UIBridge для показа диалога выбора директории
    let result = self
      .ui_bridge
      .show_dialog("file_picker", dialog_options)
      .await?;

    // Парсим результат
    if let Some(files) = result.get("files").and_then(|f| f.as_array()) {
      if let Some(directory) = files.first().and_then(|f| f.as_str()) {
        return Ok(Some(PathBuf::from(directory)));
      }
    }

    Ok(None)
  }

  async fn read_file(&self, path: &Path) -> Result<Vec<u8>> {
    // Проверка разрешений
    self.check_permission("file_read")?;
    self.check_read_path(path)?;

    // Читаем файл
    tokio::fs::read(path)
      .await
      .map_err(|e| VideoCompilerError::IoError(format!("Failed to read file: {}", e)))
  }

  async fn write_file(&self, path: &Path, data: &[u8]) -> Result<()> {
    // Проверка разрешений
    self.check_permission("file_write")?;
    self.check_write_path(path)?;

    // Создаем директорию если нужно
    if let Some(parent) = path.parent() {
      tokio::fs::create_dir_all(parent)
        .await
        .map_err(|e| VideoCompilerError::IoError(format!("Failed to create directory: {}", e)))?;
    }

    // Записываем файл
    tokio::fs::write(path, data)
      .await
      .map_err(|e| VideoCompilerError::IoError(format!("Failed to write file: {}", e)))
  }

  async fn get_system_info(&self) -> Result<SystemInfo> {
    // TODO: Реализовать через SystemInfoService
    Ok(SystemInfo {
      os: std::env::consts::OS.to_string(),
      arch: std::env::consts::ARCH.to_string(),
      cpu_count: num_cpus::get(),
      memory_total: 0,     // TODO: Get from system
      memory_available: 0, // TODO: Get from system
    })
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[tokio::test]
  async fn test_storage_impl() {
    use tempfile::TempDir;

    let temp_dir = TempDir::new().unwrap();
    let storage_path = temp_dir.path().join("storage");

    // Create storage
    let storage = PluginStorageImpl::new("test-plugin".to_string(), storage_path)
      .await
      .unwrap();

    // Test set/get
    let value = serde_json::json!({
        "setting": "value",
        "number": 42
    });
    storage.set("test_key", value.clone()).await.unwrap();

    let retrieved = storage.get("test_key").await.unwrap();
    assert_eq!(retrieved, Some(value));

    // Test keys
    let keys = storage.keys().await.unwrap();
    assert!(keys.contains(&"test_key".to_string()));

    // Test remove
    storage.remove("test_key").await.unwrap();
    let removed = storage.get("test_key").await.unwrap();
    assert!(removed.is_none());

    // Test clear
    storage.set("key1", serde_json::json!(1)).await.unwrap();
    storage.set("key2", serde_json::json!(2)).await.unwrap();
    storage.clear().await.unwrap();
    let keys_after_clear = storage.keys().await.unwrap();
    assert!(keys_after_clear.is_empty());
  }

  #[tokio::test]
  async fn test_security_levels() {
    // Minimal
    let minimal = SecurityLevel::Minimal.permissions();
    assert_eq!(minimal.get_security_level(), SecurityLevel::Minimal);

    // Full
    let full = SecurityLevel::Full.permissions();
    assert_eq!(full.get_security_level(), SecurityLevel::Full);
  }
}
