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
use uuid::Uuid;

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
  pub clips: Vec<ClipInfo>,
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
pub struct PluginApiImpl {
  plugin_id: String,
  permissions: Arc<PluginPermissions>,
  #[allow(dead_code)]
  service_container: Arc<ServiceContainer>,
  #[allow(dead_code)]
  app_handle: tauri::AppHandle,
  storage_path: PathBuf,
  event_bus: Arc<EventBus>,
}

impl PluginApiImpl {
  pub fn new(
    plugin_id: String,
    permissions: Arc<PluginPermissions>,
    service_container: Arc<ServiceContainer>,
    app_handle: tauri::AppHandle,
    storage_path: PathBuf,
    event_bus: Arc<EventBus>,
  ) -> Self {
    Self {
      plugin_id,
      permissions,
      service_container,
      app_handle,
      storage_path,
      event_bus,
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
    // Проверка разрешений
    self.check_permission("media_read")?;

    // TODO: Интеграция с реальными сервисами будет добавлена в следующих итерациях
    // Пока используем улучшенную заглушку с проверкой файла
    log::info!(
      "[Plugin {}] Processing media info request for: {}",
      self.plugin_id,
      media_id
    );

    let media_path = PathBuf::from(media_id);

    // Проверяем существование файла если это путь
    if media_path.exists() {
      // Пытаемся определить базовую информацию из метаданных файла
      if let Ok(metadata) = tokio::fs::metadata(&media_path).await {
        log::info!(
          "[Plugin {}] Found media file: {} (size: {} bytes)",
          self.plugin_id,
          media_id,
          metadata.len()
        );

        Ok(MediaInfo {
          id: media_id.to_string(),
          path: media_path,
          duration: 0.0, // TODO: Определить через FFmpeg
          width: 1920,
          height: 1080,
          fps: 30.0,
          codec: "unknown".to_string(),
          bitrate: 0,
        })
      } else {
        Err(VideoCompilerError::InvalidParameter(format!(
          "Cannot access media file: {}",
          media_id
        )))
      }
    } else {
      // Возможно media_id это не путь к файлу, а ID в базе данных
      log::warn!(
        "[Plugin {}] Media ID '{}' is not a valid file path, treating as media ID",
        self.plugin_id,
        media_id
      );

      Ok(MediaInfo {
        id: media_id.to_string(),
        path: PathBuf::from(media_id),
        duration: 0.0,
        width: 1920,
        height: 1080,
        fps: 30.0,
        codec: "h264".to_string(),
        bitrate: 5000000,
      })
    }
  }

  async fn apply_effect(&self, _media_id: &str, _effect: Effect) -> Result<()> {
    // TODO: Реализовать через EffectProcessor
    todo!("Implement apply_effect")
  }

  async fn generate_thumbnail(&self, media_id: &str, time: f64) -> Result<PathBuf> {
    // Проверка разрешений
    self.check_permission("media_read")?;

    // Создаем директорию для thumbnails
    let thumbnail_dir = self.storage_path.join("thumbnails");
    tokio::fs::create_dir_all(&thumbnail_dir)
      .await
      .map_err(|e| VideoCompilerError::IoError(e.to_string()))?;

    let thumbnail_path = thumbnail_dir.join(format!(
      "{}_{}.jpg",
      media_id.replace(['/', '\\'], "_"),
      (time * 1000.0) as u64
    ));

    // TODO: Интеграция с PreviewService будет добавлена в следующих итерациях
    // Пока создаем заглушку thumbnail
    log::info!(
      "[Plugin {}] Generating thumbnail placeholder for: {} at time {}",
      self.plugin_id,
      media_id,
      time
    );

    let media_path = PathBuf::from(media_id);

    // Проверяем существование медиа файла
    if media_path.exists() {
      log::info!(
        "[Plugin {}] Media file exists, creating thumbnail placeholder",
        self.plugin_id
      );

      // Создаем простую заглушку (1x1 пиксель в формате JPEG)
      let placeholder_jpeg = vec![
        0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00,
        0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43, 0x00, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
        0xC0, 0x00, 0x11, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0x02, 0x11, 0x01,
        0x03, 0x11, 0x01, 0xFF, 0xC4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x08, 0xFF, 0xC4, 0x00, 0x14, 0x10,
        0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
        0x00, 0x00, 0xFF, 0xDA, 0x00, 0x0C, 0x03, 0x01, 0x00, 0x02, 0x11, 0x03, 0x11, 0x00, 0x3F,
        0x00, 0x00, 0xFF, 0xD9,
      ];

      tokio::fs::write(&thumbnail_path, placeholder_jpeg)
        .await
        .map_err(|e| VideoCompilerError::IoError(e.to_string()))?;

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
    } else {
      log::warn!(
        "[Plugin {}] Media file not found: {}, creating empty placeholder",
        self.plugin_id,
        media_id
      );

      // Создаем пустой файл для несуществующего медиа
      tokio::fs::write(&thumbnail_path, b"")
        .await
        .map_err(|e| VideoCompilerError::IoError(e.to_string()))?;
    }

    Ok(thumbnail_path)
  }

  async fn get_timeline_state(&self) -> Result<TimelineState> {
    // Проверка разрешений
    self.check_permission("timeline_read")?;

    // В реальной реализации здесь нужно получить текущий проект из состояния приложения
    // Пока возвращаем заглушку
    log::warn!(
      "[Plugin {}] get_timeline_state is not fully implemented yet",
      self.plugin_id
    );

    Ok(TimelineState {
      duration: 0.0,
      current_time: 0.0,
      tracks: vec![],
    })
  }

  async fn add_clip(&self, clip: Clip) -> Result<String> {
    // Проверка разрешений
    self.check_permission("timeline_write")?;

    // Генерируем ID для нового клипа
    let clip_id = Uuid::new_v4().to_string();

    // В реальной реализации здесь нужно:
    // 1. Получить текущий проект из состояния
    // 2. Найти нужный трек
    // 3. Добавить клип
    // 4. Обновить состояние проекта
    // 5. Отправить событие об изменении

    log::info!(
      "[Plugin {}] Added clip {} to track {} at time {}",
      self.plugin_id,
      clip_id,
      clip.track_id,
      clip.start_time
    );

    // Публикуем событие о добавлении клипа через EventBus
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
    // Проверка разрешений
    self.check_permission("timeline_write")?;

    log::info!("[Plugin {}] Removing clip {}", self.plugin_id, clip_id);

    // Публикуем событие об удалении клипа через EventBus
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

  async fn update_clip(&self, clip_id: &str, _clip: ClipInfo) -> Result<()> {
    // Проверка разрешений
    self.check_permission("timeline_write")?;

    log::info!("[Plugin {}] Updating clip {}", self.plugin_id, clip_id);

    // Публикуем событие об обновлении клипа через EventBus
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
    // Проверка разрешений
    self.check_permission("ui_access")?;

    // В Tauri v2 диалоги работают через команды
    // Пока возвращаем заглушку
    log::info!(
      "[Plugin {}] Showing dialog: {} - {}",
      self.plugin_id,
      dialog.title,
      dialog.message
    );

    // TODO: Реализовать через Tauri команды когда UI будет готов
    // Для этого нужно отправить событие на фронтенд и получить ответ

    Ok(DialogResult {
      button_index: Some(0), // OK button
      input_text: None,
      cancelled: false,
    })
  }

  async fn add_menu_item(&self, menu: MenuItem) -> Result<()> {
    // Проверка разрешений
    self.check_permission("ui_access")?;

    log::info!(
      "[Plugin {}] Adding menu item: {} ({})",
      self.plugin_id,
      menu.label,
      menu.id
    );

    // В реальной реализации здесь нужно:
    // 1. Использовать Tauri Menu API
    // 2. Зарегистрировать обработчик событий для пункта меню
    // 3. Связать с плагином

    // TODO: Отправлять событие через EventBus когда будет реализована интеграция
    log::debug!("[Plugin {}] Event: ui.menu.added", self.plugin_id);

    Ok(())
  }

  async fn remove_menu_item(&self, menu_id: &str) -> Result<()> {
    // Проверка разрешений
    self.check_permission("ui_access")?;

    log::info!(
      "[Plugin {}] Removing menu item: {}",
      self.plugin_id,
      menu_id
    );

    // TODO: Отправлять событие через EventBus когда будет реализована интеграция
    log::debug!("[Plugin {}] Event: ui.menu.removed", self.plugin_id);

    Ok(())
  }

  async fn show_notification(&self, title: &str, message: &str) -> Result<()> {
    // TODO: Реализовать через NotificationService
    log::info!(
      "[Plugin {}] Notification: {} - {}",
      self.plugin_id,
      title,
      message
    );
    Ok(())
  }

  async fn get_storage(&self) -> Result<Box<dyn PluginStorage>> {
    // Проверка разрешений не требуется - storage доступен всем плагинам

    let storage =
      PluginStorageImpl::new(self.plugin_id.clone(), self.storage_path.join("storage")).await?;

    Ok(Box::new(storage))
  }

  async fn pick_file(&self, filters: Vec<(&str, Vec<&str>)>) -> Result<Option<PathBuf>> {
    // Проверка разрешений
    self.check_permission("ui_access")?;

    // В Tauri v2 файловые диалоги работают через команды на фронтенде
    // Пока возвращаем заглушку
    log::info!(
      "[Plugin {}] File picker requested with {} filters",
      self.plugin_id,
      filters.len()
    );

    // TODO: Реализовать через Tauri команды когда UI будет готов
    Ok(None)
  }

  async fn pick_directory(&self) -> Result<Option<PathBuf>> {
    // Проверка разрешений
    self.check_permission("ui_access")?;

    log::info!("[Plugin {}] Directory picker requested", self.plugin_id);

    // TODO: Реализовать через Tauri команды когда UI будет готов
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
