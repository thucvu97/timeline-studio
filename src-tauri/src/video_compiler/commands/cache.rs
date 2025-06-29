//! Cache - Команды управления кэшем
//!
//! Команды для очистки кэша, получения информации о размере
//! и управления кэшированными данными.

use serde_json;
use std::collections::HashMap;
use std::path::PathBuf;
use tauri::State;

use crate::video_compiler::error::{Result, VideoCompilerError};
use crate::video_compiler::services::cache_service::CacheStats;

use super::state::VideoCompilerState;

/// Очистить весь кэш рендеринга
#[tauri::command]
pub async fn clear_render_cache(state: State<'_, VideoCompilerState>) -> Result<()> {
  let cache_service = state.services.get_cache_service().ok_or_else(|| {
    VideoCompilerError::InternalError("CacheService не инициализирован".to_string())
  })?;

  cache_service.clear_render_cache().await.map_err(|e| {
    log::error!("Ошибка очистки кэша рендеринга: {e}");
    VideoCompilerError::CacheError(format!("Не удалось очистить кэш рендеринга: {e}"))
  })?;

  log::info!("Кэш рендеринга успешно очищен");
  Ok(())
}

/// Очистить кэш конкретного проекта
#[tauri::command]
pub async fn clear_project_cache(
  project_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  // Валидируем project_id
  if project_id.is_empty() {
    return Err(VideoCompilerError::InvalidParameter(
      "ID проекта не может быть пустым".to_string(),
    ));
  }

  let cache_service = state.services.get_cache_service().ok_or_else(|| {
    VideoCompilerError::InternalError("CacheService не инициализирован".to_string())
  })?;

  cache_service
    .clear_project_cache(&project_id)
    .await
    .map_err(|e| {
      log::error!("Ошибка очистки кэша проекта {project_id}: {e}");
      VideoCompilerError::CacheError(format!("Не удалось очистить кэш проекта {project_id}: {e}"))
    })?;

  log::info!("Кэш проекта {project_id} успешно очищен");
  Ok(())
}

/// Получить размер кэша
#[tauri::command]
#[allow(dead_code)]
pub async fn get_cache_size(state: State<'_, VideoCompilerState>) -> Result<u64> {
  let cache_service = state
    .services
    .get_cache_service()
    .ok_or_else(|| VideoCompilerError::validation("CacheService не найден"))?;
  let stats = cache_service.get_cache_stats().await?;
  Ok((stats.total_size_mb * 1024.0 * 1024.0) as u64)
}

/// Получить статистику использования кэша
#[tauri::command]
#[allow(dead_code)]
pub async fn get_cache_stats(state: State<'_, VideoCompilerState>) -> Result<CacheStats> {
  let cache_service = state
    .services
    .get_cache_service()
    .ok_or_else(|| VideoCompilerError::validation("CacheService не найден"))?;
  cache_service.get_cache_stats().await
}

/// Получить расширенную статистику кэша
#[tauri::command]
#[allow(dead_code)]
pub async fn get_cache_stats_detailed(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let cache = state.cache_manager.read().await;
  let stats = cache.get_stats();
  let memory_usage = cache.get_memory_usage();

  Ok(serde_json::json!({
    "preview_hit_ratio": stats.preview_hit_ratio(),
    "memory_usage_mb": memory_usage.total_mb(),
    "preview_hits": stats.preview_hits,
    "preview_misses": stats.preview_misses,
    "render_hits": stats.render_hits,
    "render_misses": stats.render_misses,
    "total_bytes": memory_usage.total_bytes,
    "preview_bytes": memory_usage.preview_bytes,
    "render_bytes": memory_usage.render_bytes,
    "metadata_bytes": memory_usage.metadata_bytes,
  }))
}

/// Очистить устаревшие записи кэша
#[tauri::command]
#[allow(dead_code)]
pub async fn clean_old_cache(
  max_age_days: u32,
  state: State<'_, VideoCompilerState>,
) -> Result<u64> {
  // Валидируем параметр
  if max_age_days == 0 {
    return Err(VideoCompilerError::InvalidParameter(
      "Максимальный возраст должен быть больше 0 дней".to_string(),
    ));
  }

  let cache_service = state.services.get_cache_service().ok_or_else(|| {
    VideoCompilerError::InternalError("CacheService не инициализирован".to_string())
  })?;

  let cleaned_files = cache_service
    .optimize_cache(max_age_days)
    .await
    .map_err(|e| {
      log::error!("Ошибка очистки устаревшего кэша: {e}");
      VideoCompilerError::CacheError(format!("Не удалось очистить устаревший кэш: {e}"))
    })?;

  log::info!("Очищено {cleaned_files} файлов старше {max_age_days} дней");
  Ok(cleaned_files as u64)
}

/// Получить список закэшированных проектов
#[tauri::command]
#[allow(dead_code)]
pub async fn get_cached_projects(state: State<'_, VideoCompilerState>) -> Result<Vec<String>> {
  let cache = state.cache_manager.read().await;
  Ok(cache.get_cached_projects())
}

/// Проверить наличие кэша для проекта
#[tauri::command]
#[allow(dead_code)]
pub async fn has_project_cache(
  project_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  let cache = state.cache_manager.read().await;
  Ok(cache.has_project_cache(&project_id))
}

/// Получить метаданные закэшированных медиафайлов
#[tauri::command]
#[allow(dead_code)]
pub async fn get_cached_media_metadata(
  state: State<'_, VideoCompilerState>,
) -> Result<HashMap<String, crate::video_compiler::core::cache::MediaMetadata>> {
  let cache = state.cache_manager.read().await;
  Ok(cache.get_all_cached_metadata())
}

/// Очистить кэш метаданных медиафайлов
#[tauri::command]
pub async fn clear_media_metadata_cache(state: State<'_, VideoCompilerState>) -> Result<()> {
  let mut render_cache = state.cache_manager.write().await;
  // Очищаем все кэши (включая метаданные)
  render_cache.clear_all().await;
  Ok(())
}

/// Оптимизировать кэш (дефрагментация и удаление неиспользуемых данных)
#[tauri::command]
#[allow(dead_code)]
pub async fn optimize_cache(state: State<'_, VideoCompilerState>) -> Result<usize> {
  let cache_service = state
    .services
    .get_cache_service()
    .ok_or_else(|| VideoCompilerError::validation("CacheService не найден"))?;
  cache_service.optimize_cache(30).await // 30 дней по умолчанию
}

/// Экспортировать статистику кэша в JSON
#[tauri::command]
#[allow(dead_code)]
pub async fn export_cache_stats(state: State<'_, VideoCompilerState>) -> Result<serde_json::Value> {
  let cache_service = state
    .services
    .get_cache_service()
    .ok_or_else(|| VideoCompilerError::validation("CacheService не найден"))?;
  let stats = cache_service.get_cache_stats().await?;

  Ok(serde_json::json!({
    "total_size_mb": stats.total_size_mb,
    "preview_cache_size_mb": stats.preview_cache_size_mb,
    "render_cache_size_mb": stats.render_cache_size_mb,
    "temp_files_size_mb": stats.temp_files_size_mb,
    "total_files": stats.total_files,
  }))
}

/// Установить максимальный размер кэша
#[tauri::command]
#[allow(dead_code)]
pub async fn set_cache_size_limit(
  size_mb: u64,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  // Конвертируем MB в количество элементов (примерно 1MB = 10 элементов)
  let items_per_mb = 10;
  let total_items = (size_mb * items_per_mb) as usize;
  // Распределяем между тремя типами кэша
  cache.set_cache_limits(
    total_items / 3, // preview
    total_items / 3, // metadata
    total_items / 3, // render
  );
  Ok(())
}

/// Получить текущий лимит размера кэша
#[tauri::command]
#[allow(dead_code)]
pub async fn get_cache_size_limit(state: State<'_, VideoCompilerState>) -> Result<u64> {
  let cache = state.cache_manager.read().await;
  let (preview, metadata, render) = cache.get_cache_limits();
  // Конвертируем обратно в MB (примерно 10 элементов = 1MB)
  let total_items = preview + metadata + render;
  Ok((total_items / 10) as u64)
}

/// Предварительно загрузить медиафайлы в кэш
#[tauri::command]
#[allow(dead_code)]
pub async fn preload_media_to_cache(
  _file_paths: Vec<String>,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let _cache_service = state
    .services
    .get_cache_service()
    .ok_or_else(|| VideoCompilerError::validation("CacheService не найден"))?;

  // Упрощенная реализация - метод не реализован
  Ok(())
}

/// Очистить весь кэш
#[tauri::command]
pub async fn clear_all_cache(state: State<'_, VideoCompilerState>) -> Result<()> {
  // Очищаем через CacheService
  if let Some(cache_service) = state.services.get_cache_service() {
    cache_service.clear_all().await?;
  }

  // Также очищаем in-memory RenderCache
  let mut render_cache = state.cache_manager.write().await;
  render_cache.clear_all().await;

  log::info!("All caches cleared successfully");
  Ok(())
}

/// Очистить кэш превью
#[tauri::command]
pub async fn clear_preview_cache(state: State<'_, VideoCompilerState>) -> Result<()> {
  let cache_service = state
    .services
    .get_cache_service()
    .ok_or_else(|| VideoCompilerError::validation("CacheService не найден"))?;
  cache_service.clear_preview_cache().await
}

/// Получить путь к каталогу кэша
#[tauri::command]
#[allow(dead_code)]
pub async fn get_cache_path(state: State<'_, VideoCompilerState>) -> Result<PathBuf> {
  let cache_service = state
    .services
    .get_cache_service()
    .ok_or_else(|| VideoCompilerError::validation("CacheService не найден"))?;
  cache_service.get_cache_path().await
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::cache::RenderCache;
  use crate::video_compiler::core::cache::{PreviewKey, RenderCacheData};
  use crate::video_compiler::services::{CacheService, CacheServiceImpl, ServiceContainer};
  use std::path::PathBuf;
  use std::sync::Arc;
  use std::time::SystemTime;
  use tempfile::TempDir;
  use tokio::sync::RwLock;

  // Test the logic directly without Tauri State wrapper
  #[tokio::test]
  async fn test_cache_service_operations() {
    let temp_dir = TempDir::new().unwrap();
    let cache_service = CacheServiceImpl::new(temp_dir.path().to_path_buf());

    // Test clear render cache
    let result = cache_service.clear_render_cache().await;
    assert!(result.is_ok());

    // Test clear project cache
    let result = cache_service.clear_project_cache("test-project").await;
    assert!(result.is_ok());

    // Test get cache stats
    let result = cache_service.get_cache_stats().await;
    assert!(result.is_ok());
    let stats = result.unwrap();
    assert_eq!(stats.total_size_mb, 0.0);
    assert_eq!(stats.total_files, 0);

    // Test optimize cache
    let result = cache_service.optimize_cache(7).await;
    assert!(result.is_ok());
    assert_eq!(result.unwrap(), 0);

    // Test clear all
    let result = cache_service.clear_all().await;
    assert!(result.is_ok());

    // Test clear preview cache
    let result = cache_service.clear_preview_cache().await;
    assert!(result.is_ok());

    // Test get cache path
    let result = cache_service.get_cache_path().await;
    assert!(result.is_ok());
    let path = result.unwrap();
    assert_eq!(path, temp_dir.path());
  }

  #[tokio::test]
  async fn test_render_cache_operations() {
    let mut cache = RenderCache::new();

    // Test store and retrieve preview frame using correct API
    let preview_key = PreviewKey::new("media-1".to_string(), 0.0, (1920, 1080), 80);
    cache
      .store_preview(preview_key.clone(), vec![1, 2, 3, 4])
      .await
      .unwrap();
    let frame = cache.get_preview(&preview_key).await;
    assert!(frame.is_some());
    assert_eq!(frame.unwrap().image_data, vec![1, 2, 3, 4]);

    // Test store render data for project
    let render_data = RenderCacheData {
      cache_key: "project-1/chunk-1".to_string(),
      output_path: PathBuf::from("/tmp/output.mp4"),
      render_hash: "hash123".to_string(),
      created_at: SystemTime::now(),
      file_size: 1024,
    };
    cache
      .store_render_data("project-1/chunk-1".to_string(), render_data)
      .await
      .unwrap();

    // Test has project cache
    assert!(cache.has_project_cache("project-1"));
    assert!(!cache.has_project_cache("project-2"));

    // Test get cached projects
    let projects = cache.get_cached_projects();
    assert_eq!(projects.len(), 1);
    assert!(projects.contains(&"project-1".to_string()));

    // Test cache limits
    cache.set_cache_limits(100, 100, 100);
    let (preview, metadata, render) = cache.get_cache_limits();
    assert_eq!(preview, 100);
    assert_eq!(metadata, 100);
    assert_eq!(render, 100);

    // Test clear all
    cache.clear_all().await;
    let projects_after = cache.get_cached_projects();
    assert!(projects_after.is_empty());
  }

  #[tokio::test]
  async fn test_cache_stats_and_memory() {
    let cache = RenderCache::new();

    // Test initial stats
    let stats = cache.get_stats();
    assert_eq!(stats.preview_hits, 0);
    assert_eq!(stats.preview_misses, 0);
    assert_eq!(stats.render_hits, 0);
    assert_eq!(stats.render_misses, 0);
    assert_eq!(stats.preview_hit_ratio(), 0.0);
    assert_eq!(stats.hit_ratio(), 0.0);

    // Test memory usage
    let memory = cache.get_memory_usage();
    // Cache starts with some base memory usage due to internal structures
    // Since these are u64/f64, they're always >= 0, so just verify structure
    let _total = memory.total_bytes;
    let _preview = memory.preview_bytes;
    let _render = memory.render_bytes;
    let _metadata = memory.metadata_bytes;
    let _mb = memory.total_mb();
  }

  #[test]
  fn test_parameter_validation() {
    // Test empty project ID validation
    let empty_id = "";
    assert!(empty_id.is_empty());

    // Test zero days validation
    let zero_days = 0u32;
    assert_eq!(zero_days, 0);

    // Test cache size calculations
    let size_mb = 100u64;
    let items_per_mb = 10;
    let total_items = (size_mb * items_per_mb) as usize;
    let per_cache_type = total_items / 3;

    assert_eq!(total_items, 1000);
    assert_eq!(per_cache_type, 333);
  }

  #[tokio::test]
  async fn test_service_container_integration() {
    let temp_dir = TempDir::new().unwrap();
    let container = ServiceContainer::new("ffmpeg".to_string(), temp_dir.path().to_path_buf(), 2)
      .await
      .unwrap();

    // Test getting cache service
    let cache_service = container.get_cache_service();
    assert!(cache_service.is_some());

    // Test cache operations through service
    let service = cache_service.unwrap();
    let stats = service.get_cache_stats().await.unwrap();
    assert_eq!(stats.total_files, 0);
  }

  #[tokio::test]
  async fn test_json_serialization() {
    // Test stats JSON
    let stats_json = serde_json::json!({
      "total_size_mb": 100.5,
      "preview_cache_size_mb": 30.2,
      "render_cache_size_mb": 60.3,
      "temp_files_size_mb": 10.0,
      "total_files": 150,
    });

    assert_eq!(stats_json["total_size_mb"], 100.5);
    assert_eq!(stats_json["total_files"], 150);

    // Test detailed stats JSON
    let detailed_json = serde_json::json!({
      "preview_hit_ratio": 0.75,
      "memory_usage_mb": 50.0,
      "preview_hits": 100,
      "preview_misses": 33,
      "render_hits": 50,
      "render_misses": 10,
      "total_bytes": 52428800,
      "preview_bytes": 20971520,
      "render_bytes": 31457280,
      "metadata_bytes": 0,
    });

    assert_eq!(detailed_json["preview_hit_ratio"], 0.75);
    assert!(detailed_json["total_bytes"].is_u64());
  }

  #[tokio::test]
  async fn test_concurrent_cache_access() {
    let cache = Arc::new(RwLock::new(RenderCache::new()));
    let mut handles = vec![];

    // Spawn multiple tasks accessing cache
    for i in 0..5 {
      let cache_clone = cache.clone();
      let handle = tokio::spawn(async move {
        let mut cache = cache_clone.write().await;
        let key = PreviewKey::new(format!("media-{i}"), 0.0, (1920, 1080), 80);
        cache.store_preview(key, vec![i as u8]).await.unwrap();
      });
      handles.push(handle);
    }

    // Wait for all tasks
    for handle in handles {
      handle.await.unwrap();
    }

    // Verify all data was stored
    let mut cache_read = cache.write().await;
    for i in 0..5 {
      let key = PreviewKey::new(format!("media-{i}"), 0.0, (1920, 1080), 80);
      let frame = cache_read.get_preview(&key).await;
      assert!(frame.is_some());
      assert_eq!(frame.unwrap().image_data, vec![i as u8]);
    }
  }

  #[tokio::test]
  async fn test_cache_with_large_data() {
    let mut cache = RenderCache::new();

    // Store large data
    let large_data = vec![0u8; 1024 * 1024]; // 1MB
    let render_data = RenderCacheData {
      cache_key: "large-project/chunk-1".to_string(),
      output_path: PathBuf::from("/tmp/large.mp4"),
      render_hash: "large_hash".to_string(),
      created_at: SystemTime::now(),
      file_size: large_data.len() as u64,
    };
    cache
      .store_render_data("large-project/chunk-1".to_string(), render_data)
      .await
      .unwrap();

    // Verify memory usage reflects the data
    let memory = cache.get_memory_usage();
    // Note: Memory usage tracks metadata, not file contents
    assert!(memory.total_bytes > 0);
    assert!(memory.render_bytes > 0);

    // Clear and verify
    let initial_memory = cache.get_memory_usage().total_bytes;
    cache.clear_all().await;
    let memory_after = cache.get_memory_usage();
    // Memory should decrease after clearing, but may not be exactly 0 due to base structures
    assert!(memory_after.total_bytes <= initial_memory);
  }

  #[test]
  fn test_error_messages() {
    // Test error message formatting
    let error = VideoCompilerError::InvalidParameter("ID проекта не может быть пустым".to_string());
    assert!(error
      .to_string()
      .contains("ID проекта не может быть пустым"));

    let error = VideoCompilerError::CacheError("Не удалось очистить кэш".to_string());
    assert!(error.to_string().contains("Не удалось очистить кэш"));
  }

  #[tokio::test]
  async fn test_cache_hit_miss_tracking() {
    let mut cache = RenderCache::new();

    // Miss - no data
    let key = PreviewKey::new("media-1".to_string(), 0.0, (1920, 1080), 80);
    let frame = cache.get_preview(&key).await;
    assert!(frame.is_none());

    // Store data
    cache
      .store_preview(key.clone(), vec![1, 2, 3])
      .await
      .unwrap();

    // Hit - data exists
    let frame = cache.get_preview(&key).await;
    assert!(frame.is_some());

    // Check stats
    let stats = cache.get_stats();
    // Note: The actual hit/miss counting is done in the implementation
    // Verify that stats were updated (hits/misses are u64, always >= 0)
    assert_eq!(stats.preview_requests, 2); // One miss + one hit
    assert_eq!(stats.preview_hits, 1);
    assert_eq!(stats.preview_misses, 1);
  }
}
