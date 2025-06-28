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
