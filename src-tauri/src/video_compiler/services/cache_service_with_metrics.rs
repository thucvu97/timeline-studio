//! Расширенная версия CacheService с интегрированными метриками
//!
//! Этот файл демонстрирует как интегрировать мониторинг в сервисы

use crate::video_compiler::{
  error::Result,
  services::{CacheService, Service, ServiceMetrics},
};
use async_trait::async_trait;
use std::{path::PathBuf, sync::Arc};

use super::cache_service::{CacheAlert, CacheAlertThresholds, CachePerformanceMetrics, CacheStats};

/// Реализация сервиса кэша с метриками
pub struct CacheServiceWithMetrics {
  inner: Box<dyn CacheService>,
  metrics: Arc<ServiceMetrics>,
}

impl CacheServiceWithMetrics {
  #[allow(dead_code)]
  pub fn new(inner: Box<dyn CacheService>, metrics: Arc<ServiceMetrics>) -> Self {
    Self { inner, metrics }
  }
}

#[async_trait]
impl Service for CacheServiceWithMetrics {
  async fn initialize(&self) -> Result<()> {
    let tracker = self.metrics.start_operation("initialize");
    match self.inner.initialize().await {
      Ok(result) => {
        tracker.complete().await;
        Ok(result)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        Err(e)
      }
    }
  }

  async fn health_check(&self) -> Result<()> {
    let tracker = self.metrics.start_operation("health_check");
    match self.inner.health_check().await {
      Ok(result) => {
        tracker.complete().await;
        Ok(result)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        Err(e)
      }
    }
  }

  async fn shutdown(&self) -> Result<()> {
    let tracker = self.metrics.start_operation("shutdown");
    match self.inner.shutdown().await {
      Ok(result) => {
        tracker.complete().await;
        Ok(result)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        Err(e)
      }
    }
  }
}

#[async_trait]
impl CacheService for CacheServiceWithMetrics {
  async fn clear_all(&self) -> Result<()> {
    let tracker = self.metrics.start_operation("clear_all");
    match self.inner.clear_all().await {
      Ok(result) => {
        tracker.complete().await;
        log::info!("[CacheService] Весь кэш успешно очищен");
        Ok(result)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        log::error!("[CacheService] Ошибка очистки кэша: {}", e);
        Err(e)
      }
    }
  }

  async fn clear_render_cache(&self) -> Result<()> {
    let tracker = self.metrics.start_operation("clear_render_cache");
    match self.inner.clear_render_cache().await {
      Ok(result) => {
        tracker.complete().await;
        log::info!("[CacheService] Кэш рендеринга успешно очищен");
        Ok(result)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        log::error!("[CacheService] Ошибка очистки кэша рендеринга: {}", e);
        Err(e)
      }
    }
  }

  async fn clear_preview_cache(&self) -> Result<()> {
    let tracker = self.metrics.start_operation("clear_preview_cache");
    match self.inner.clear_preview_cache().await {
      Ok(result) => {
        tracker.complete().await;
        log::info!("[CacheService] Кэш превью успешно очищен");
        Ok(result)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        log::error!("[CacheService] Ошибка очистки кэша превью: {}", e);
        Err(e)
      }
    }
  }

  async fn clear_project_cache(&self, project_id: &str) -> Result<()> {
    let tracker = self.metrics.start_operation("clear_project_cache");
    match self.inner.clear_project_cache(project_id).await {
      Ok(result) => {
        tracker.complete().await;
        log::info!("[CacheService] Кэш проекта {} успешно очищен", project_id);
        Ok(result)
      }
      Err(e) => {
        tracker.fail(format!("Проект {}: {}", project_id, e)).await;
        log::error!(
          "[CacheService] Ошибка очистки кэша проекта {}: {}",
          project_id,
          e
        );
        Err(e)
      }
    }
  }

  async fn get_cache_size(&self) -> Result<f64> {
    let tracker = self.metrics.start_operation("get_cache_size");
    match self.inner.get_cache_size().await {
      Ok(size) => {
        tracker.complete().await;
        log::debug!("[CacheService] Размер кэша: {:.2} MB", size);
        Ok(size)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        log::error!("[CacheService] Ошибка получения размера кэша: {}", e);
        Err(e)
      }
    }
  }

  async fn get_cache_stats(&self) -> Result<CacheStats> {
    let tracker = self.metrics.start_operation("get_cache_stats");
    match self.inner.get_cache_stats().await {
      Ok(stats) => {
        tracker.complete().await;
        log::debug!(
          "[CacheService] Статистика кэша: всего {:.2} MB, {} файлов",
          stats.total_size_mb,
          stats.total_files
        );
        Ok(stats)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        log::error!("[CacheService] Ошибка получения статистики кэша: {}", e);
        Err(e)
      }
    }
  }

  async fn optimize_cache(&self, max_age_days: u32) -> Result<usize> {
    let tracker = self.metrics.start_operation("optimize_cache");
    match self.inner.optimize_cache(max_age_days).await {
      Ok(removed_count) => {
        tracker.complete().await;
        log::info!(
          "[CacheService] Оптимизация кэша завершена: удалено {} файлов старше {} дней",
          removed_count,
          max_age_days
        );
        Ok(removed_count)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        log::error!("[CacheService] Ошибка оптимизации кэша: {}", e);
        Err(e)
      }
    }
  }

  async fn get_cache_path(&self) -> Result<PathBuf> {
    let tracker = self.metrics.start_operation("get_cache_path");
    match self.inner.get_cache_path().await {
      Ok(path) => {
        tracker.complete().await;
        Ok(path)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        Err(e)
      }
    }
  }

  async fn save_to_cache(&self, key: &str, data: &[u8]) -> Result<PathBuf> {
    let tracker = self.metrics.start_operation("save_to_cache");
    match self.inner.save_to_cache(key, data).await {
      Ok(path) => {
        tracker.complete().await;
        log::trace!(
          "[CacheService] Сохранено в кэш: {} ({} байт)",
          key,
          data.len()
        );
        Ok(path)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        log::error!("[CacheService] Ошибка сохранения в кэш {}: {}", key, e);
        Err(e)
      }
    }
  }

  async fn get_from_cache(&self, key: &str) -> Result<Option<Vec<u8>>> {
    let tracker = self.metrics.start_operation("get_from_cache");
    match self.inner.get_from_cache(key).await {
      Ok(Some(data)) => {
        tracker.complete().await;
        log::trace!(
          "[CacheService] Получено из кэша: {} ({} байт)",
          key,
          data.len()
        );
        Ok(Some(data))
      }
      Ok(None) => {
        tracker.complete().await;
        log::trace!("[CacheService] Не найдено в кэше: {}", key);
        Ok(None)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        log::error!("[CacheService] Ошибка чтения из кэша {}: {}", key, e);
        Err(e)
      }
    }
  }

  async fn exists_in_cache(&self, key: &str) -> Result<bool> {
    let tracker = self.metrics.start_operation("exists_in_cache");
    match self.inner.exists_in_cache(key).await {
      Ok(exists) => {
        tracker.complete().await;
        Ok(exists)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        Err(e)
      }
    }
  }

  async fn get_performance_metrics(&self) -> Result<CachePerformanceMetrics> {
    let tracker = self.metrics.start_operation("get_performance_metrics");
    match self.inner.get_performance_metrics().await {
      Ok(result) => {
        tracker.complete().await;
        Ok(result)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        Err(e)
      }
    }
  }

  async fn reset_metrics(&self) -> Result<()> {
    let tracker = self.metrics.start_operation("reset_metrics");
    match self.inner.reset_metrics().await {
      Ok(result) => {
        tracker.complete().await;
        Ok(result)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        Err(e)
      }
    }
  }

  async fn set_alert_thresholds(&self, thresholds: CacheAlertThresholds) -> Result<()> {
    let tracker = self.metrics.start_operation("set_alert_thresholds");
    match self.inner.set_alert_thresholds(thresholds).await {
      Ok(result) => {
        tracker.complete().await;
        Ok(result)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        Err(e)
      }
    }
  }

  async fn get_active_alerts(&self) -> Result<Vec<CacheAlert>> {
    let tracker = self.metrics.start_operation("get_active_alerts");
    match self.inner.get_active_alerts().await {
      Ok(result) => {
        tracker.complete().await;
        Ok(result)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        Err(e)
      }
    }
  }

  async fn list_cached_items(&self) -> Result<Vec<String>> {
    let tracker = self.metrics.start_operation("list_cached_items");
    match self.inner.list_cached_items().await {
      Ok(result) => {
        tracker.complete().await;
        log::debug!(
          "[CacheService] Получен список из {} элементов кэша",
          result.len()
        );
        Ok(result)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        log::error!(
          "[CacheService] Ошибка получения списка элементов кэша: {}",
          e
        );
        Err(e)
      }
    }
  }

  async fn get_item_info(&self, key: &str) -> Result<Option<super::cache_service::CacheItemInfo>> {
    let tracker = self.metrics.start_operation("get_item_info");
    match self.inner.get_item_info(key).await {
      Ok(Some(info)) => {
        tracker.complete().await;
        log::debug!(
          "[CacheService] Получена информация об элементе кэша: {} ({} байт)",
          key,
          info.size_bytes
        );
        Ok(Some(info))
      }
      Ok(None) => {
        tracker.complete().await;
        log::debug!("[CacheService] Элемент кэша не найден: {}", key);
        Ok(None)
      }
      Err(e) => {
        tracker.fail(e.to_string()).await;
        log::error!(
          "[CacheService] Ошибка получения информации об элементе кэша {}: {}",
          key,
          e
        );
        Err(e)
      }
    }
  }
}

/// Хелпер для создания CacheService с метриками
#[allow(dead_code)]
pub fn wrap_with_metrics(
  service: Box<dyn CacheService>,
  metrics: Arc<ServiceMetrics>,
) -> Box<dyn CacheService> {
  Box::new(CacheServiceWithMetrics::new(service, metrics))
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::services::{CacheServiceImpl, ServiceMetrics};
  use tempfile::TempDir;

  #[tokio::test]
  async fn test_cache_service_with_metrics() {
    let temp_dir = TempDir::new().unwrap();
    let inner = Box::new(CacheServiceImpl::new(temp_dir.path().to_path_buf()));
    let metrics = Arc::new(ServiceMetrics::new("test-cache".to_string()));
    let service = CacheServiceWithMetrics::new(inner, metrics.clone());

    // Инициализация
    assert!(service.initialize().await.is_ok());

    // Сохранение в кэш
    let key = "test_key";
    let data = b"test data";
    assert!(service.save_to_cache(key, data).await.is_ok());

    // Чтение из кэша
    let cached = service.get_from_cache(key).await.unwrap();
    assert_eq!(cached, Some(data.to_vec()));

    // Проверка метрик
    let summary = metrics.get_summary().await;
    assert!(summary.total_operations >= 3); // initialize, save, get
    assert_eq!(summary.total_errors, 0);
  }
}
