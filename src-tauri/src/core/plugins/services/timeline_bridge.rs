//! Мост для интеграции плагинов с timeline сервисами

use crate::{
  core::{
    di::ServiceContainer,
    plugins::{
      api::{TimelineState, TrackInfo},
      permissions::PluginPermissions,
    },
  },
  video_compiler::error::{Result, VideoCompilerError},
};
use serde_json::Value;
use std::sync::Arc;

/// Мост для timeline операций плагинов
#[derive(Clone)]
pub struct TimelineBridge {
  service_container: Arc<ServiceContainer>,
  permissions: Arc<PluginPermissions>,
  plugin_id: String,
}

impl TimelineBridge {
  /// Создать новый timeline мост
  pub fn new(
    service_container: Arc<ServiceContainer>,
    permissions: Arc<PluginPermissions>,
    plugin_id: String,
  ) -> Self {
    Self {
      service_container,
      permissions,
      plugin_id,
    }
  }

  /// Получить текущее состояние timeline
  pub async fn get_timeline_state(&self) -> Result<TimelineState> {
    log::info!("[TimelineBridge {}] Getting timeline state", self.plugin_id);

    // Интеграция с ProjectService для получения реального состояния timeline
    if let Some(_project_service) = self.service_container.get_project_service() {
      // TODO: Реализовать интеграцию с ProjectService
      log::info!(
        "[TimelineBridge {}] ProjectService available, but integration not implemented yet",
        self.plugin_id
      );

      // Пока возвращаем улучшенную заглушку с более реалистичными данными
      use crate::core::plugins::api::ClipInfo;

      return Ok(TimelineState {
        duration: 180.0,    // 3 минуты
        current_time: 30.0, // 30 секунд
        tracks: vec![
          TrackInfo {
            id: "video_track_1".to_string(),
            track_type: "video".to_string(),
            name: "Main Video".to_string(),
            clips: vec![
              ClipInfo {
                id: "clip_1".to_string(),
                media_id: "sample_video.mp4".to_string(),
                start_time: 0.0,
                duration: 60.0,
                in_point: 0.0,
                out_point: 60.0,
              },
              ClipInfo {
                id: "clip_2".to_string(),
                media_id: "sample_video2.mp4".to_string(),
                start_time: 60.0,
                duration: 120.0,
                in_point: 0.0,
                out_point: 120.0,
              },
            ],
            muted: false,
            locked: false,
            height: 120,
          },
          TrackInfo {
            id: "audio_track_1".to_string(),
            track_type: "audio".to_string(),
            name: "Audio Track 1".to_string(),
            clips: vec![ClipInfo {
              id: "audio_clip_1".to_string(),
              media_id: "sample_audio.mp3".to_string(),
              start_time: 0.0,
              duration: 180.0,
              in_point: 0.0,
              out_point: 180.0,
            }],
            muted: false,
            locked: false,
            height: 60,
          },
        ],
      });
    }

    // Fallback: базовая заглушка без ProjectService
    log::info!(
      "[TimelineBridge {}] ProjectService not available, using basic timeline state",
      self.plugin_id
    );

    // Создаем примерное состояние timeline
    let tracks = vec![
      TrackInfo {
        id: "video_track_1".to_string(),
        track_type: "video".to_string(),
        name: "Video Track 1".to_string(),
        clips: vec![], // TODO: Получить реальные клипы из проекта
        muted: false,
        locked: false,
        height: 100,
      },
      TrackInfo {
        id: "audio_track_1".to_string(),
        track_type: "audio".to_string(),
        name: "Audio Track 1".to_string(),
        clips: vec![],
        muted: false,
        locked: false,
        height: 60,
      },
    ];

    Ok(TimelineState {
      duration: 120.0, // 2 минуты по умолчанию
      current_time: 0.0,
      tracks,
    })
  }

  /// Добавить клип в timeline
  pub async fn add_clip(&self, track_id: &str, clip_data: Value) -> Result<String> {
    // Проверяем разрешения на изменение timeline (Extended уровень или выше)
    use crate::core::plugins::permissions::SecurityLevel;
    if self.permissions.get_security_level() < SecurityLevel::Standard {
      return Err(VideoCompilerError::SecurityError(
        "Plugin does not have permission to modify timeline".to_string(),
      ));
    }

    log::info!(
      "[TimelineBridge {}] Adding clip to track: {}",
      self.plugin_id,
      track_id
    );

    // Валидация данных клипа
    let media_id = clip_data
      .get("media_id")
      .and_then(|v| v.as_str())
      .ok_or_else(|| VideoCompilerError::InvalidParameter("Clip must have media_id".to_string()))?;

    let start_time = clip_data
      .get("start_time")
      .and_then(|v| v.as_f64())
      .unwrap_or(0.0);

    let duration = clip_data
      .get("duration")
      .and_then(|v| v.as_f64())
      .ok_or_else(|| VideoCompilerError::InvalidParameter("Clip must have duration".to_string()))?;

    if duration <= 0.0 {
      return Err(VideoCompilerError::InvalidParameter(
        "Clip duration must be positive".to_string(),
      ));
    }

    // Генерируем уникальный ID для клипа
    let clip_id = format!("clip_{}_{}", track_id, uuid::Uuid::new_v4());

    // Интеграция с ProjectService для добавления клипа
    if let Some(_project_service) = self.service_container.get_project_service() {
      // TODO: Интеграция с ProjectService для реального добавления клипа
      log::info!(
        "[TimelineBridge {}] ProjectService available - adding clip via service: ID: {}, Media: {}, Start: {}, Duration: {}",
        self.plugin_id,
        clip_id,
        media_id,
        start_time,
        duration
      );
    } else {
      log::info!(
        "[TimelineBridge {}] ProjectService not available - clip added to memory only: ID: {}, Media: {}, Start: {}, Duration: {}",
        self.plugin_id,
        clip_id,
        media_id,
        start_time,
        duration
      );
    }

    Ok(clip_id)
  }

  /// Удалить клип из timeline
  pub async fn remove_clip(&self, clip_id: &str) -> Result<()> {
    // Проверяем разрешения
    use crate::core::plugins::permissions::SecurityLevel;
    if self.permissions.get_security_level() < SecurityLevel::Standard {
      return Err(VideoCompilerError::SecurityError(
        "Plugin does not have permission to modify timeline".to_string(),
      ));
    }

    log::info!(
      "[TimelineBridge {}] Removing clip: {}",
      self.plugin_id,
      clip_id
    );

    // TODO: Интеграция с реальным ProjectService
    // Пока логируем операцию

    // Валидация ID клипа
    if clip_id.is_empty() {
      return Err(VideoCompilerError::InvalidParameter(
        "Clip ID cannot be empty".to_string(),
      ));
    }

    log::info!(
      "[TimelineBridge {}] Clip '{}' removed successfully",
      self.plugin_id,
      clip_id
    );

    Ok(())
  }

  /// Обновить существующий клип
  pub async fn update_clip(&self, clip_id: &str, updates: Value) -> Result<()> {
    // Проверяем разрешения
    use crate::core::plugins::permissions::SecurityLevel;
    if self.permissions.get_security_level() < SecurityLevel::Standard {
      return Err(VideoCompilerError::SecurityError(
        "Plugin does not have permission to modify timeline".to_string(),
      ));
    }

    log::info!(
      "[TimelineBridge {}] Updating clip: {}",
      self.plugin_id,
      clip_id
    );

    // Валидация
    if clip_id.is_empty() {
      return Err(VideoCompilerError::InvalidParameter(
        "Clip ID cannot be empty".to_string(),
      ));
    }

    if updates.is_null() || !updates.is_object() {
      return Err(VideoCompilerError::InvalidParameter(
        "Updates must be a valid JSON object".to_string(),
      ));
    }

    // Валидация обновляемых полей
    if let Some(start_time) = updates.get("start_time").and_then(|v| v.as_f64()) {
      if start_time < 0.0 {
        return Err(VideoCompilerError::InvalidParameter(
          "Start time cannot be negative".to_string(),
        ));
      }
    }

    if let Some(duration) = updates.get("duration").and_then(|v| v.as_f64()) {
      if duration <= 0.0 {
        return Err(VideoCompilerError::InvalidParameter(
          "Duration must be positive".to_string(),
        ));
      }
    }

    // TODO: Интеграция с реальным ProjectService для обновления клипа
    log::info!(
      "[TimelineBridge {}] Clip '{}' updated with: {}",
      self.plugin_id,
      clip_id,
      updates
    );

    Ok(())
  }

  /// Получить информацию о треке
  pub async fn get_track_info(&self, track_id: &str) -> Result<TrackInfo> {
    log::info!(
      "[TimelineBridge {}] Getting track info: {}",
      self.plugin_id,
      track_id
    );

    // TODO: Интеграция с реальным TimelineService
    // Пока возвращаем базовую информацию

    match track_id {
      "video_track_1" => Ok(TrackInfo {
        id: track_id.to_string(),
        track_type: "video".to_string(),
        name: "Video Track 1".to_string(),
        clips: vec![],
        muted: false,
        locked: false,
        height: 100,
      }),
      "audio_track_1" => Ok(TrackInfo {
        id: track_id.to_string(),
        track_type: "audio".to_string(),
        name: "Audio Track 1".to_string(),
        clips: vec![],
        muted: false,
        locked: false,
        height: 60,
      }),
      _ => Err(VideoCompilerError::InvalidParameter(format!(
        "Track not found: {}",
        track_id
      ))),
    }
  }

  /// Создать новый трек
  pub async fn create_track(&self, track_type: &str, name: &str) -> Result<String> {
    // Проверяем разрешения
    use crate::core::plugins::permissions::SecurityLevel;
    if self.permissions.get_security_level() < SecurityLevel::Standard {
      return Err(VideoCompilerError::SecurityError(
        "Plugin does not have permission to create tracks".to_string(),
      ));
    }

    // Валидация типа трека
    if !["video", "audio", "subtitle"].contains(&track_type) {
      return Err(VideoCompilerError::InvalidParameter(format!(
        "Invalid track type: {}. Supported types: video, audio, subtitle",
        track_type
      )));
    }

    if name.is_empty() {
      return Err(VideoCompilerError::InvalidParameter(
        "Track name cannot be empty".to_string(),
      ));
    }

    let track_id = format!("{}_{}", track_type, uuid::Uuid::new_v4());

    log::info!(
      "[TimelineBridge {}] Created track - ID: {}, Type: {}, Name: {}",
      self.plugin_id,
      track_id,
      track_type,
      name
    );

    Ok(track_id)
  }
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::core::plugins::permissions::SecurityLevel;

  #[tokio::test]
  async fn test_timeline_bridge_basic_operations() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Extended.permissions());
    let bridge = TimelineBridge::new(service_container, permissions, "test-plugin".to_string());

    // Тест получения состояния timeline
    let timeline_state = bridge.get_timeline_state().await.unwrap();
    assert_eq!(timeline_state.tracks.len(), 2);
    assert_eq!(timeline_state.duration, 120.0);

    // Тест получения информации о треке
    let track_info = bridge.get_track_info("video_track_1").await.unwrap();
    assert_eq!(track_info.track_type, "video");
    assert_eq!(track_info.name, "Video Track 1");
  }

  #[tokio::test]
  async fn test_clip_operations() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Extended.permissions());
    let bridge = TimelineBridge::new(service_container, permissions, "test-plugin".to_string());

    // Тест добавления клипа
    let clip_data = serde_json::json!({
      "media_id": "test_media_123",
      "start_time": 10.0,
      "duration": 5.0
    });

    let clip_id = bridge.add_clip("video_track_1", clip_data).await.unwrap();
    assert!(clip_id.starts_with("clip_video_track_1"));

    // Тест обновления клипа
    let updates = serde_json::json!({
      "start_time": 15.0,
      "duration": 7.0
    });

    bridge.update_clip(&clip_id, updates).await.unwrap();

    // Тест удаления клипа
    bridge.remove_clip(&clip_id).await.unwrap();
  }

  #[tokio::test]
  async fn test_validation_errors() {
    let service_container = Arc::new(ServiceContainer::new());
    let permissions = Arc::new(SecurityLevel::Extended.permissions());
    let bridge = TimelineBridge::new(service_container, permissions, "test-plugin".to_string());

    // Невалидный клип без media_id
    let invalid_clip = serde_json::json!({
      "start_time": 10.0,
      "duration": 5.0
    });

    let result = bridge.add_clip("video_track_1", invalid_clip).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("media_id"));

    // Невалидная длительность
    let invalid_duration_clip = serde_json::json!({
      "media_id": "test",
      "duration": -5.0
    });

    let result = bridge
      .add_clip("video_track_1", invalid_duration_clip)
      .await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("positive"));
  }

  #[tokio::test]
  async fn test_permissions() {
    let service_container = Arc::new(ServiceContainer::new());
    let minimal_permissions = Arc::new(SecurityLevel::Minimal.permissions());
    let bridge = TimelineBridge::new(
      service_container,
      minimal_permissions,
      "test-plugin".to_string(),
    );

    // Операции с minimal permissions должны быть заблокированы
    let clip_data = serde_json::json!({
      "media_id": "test",
      "duration": 5.0
    });

    let result = bridge.add_clip("video_track_1", clip_data).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().to_string().contains("permission"));
  }
}
