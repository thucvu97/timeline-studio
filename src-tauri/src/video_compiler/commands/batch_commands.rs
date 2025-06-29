use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use tauri::command;
use uuid::Uuid;

/// Статус пакетного задания
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum BatchJobStatus {
  Pending,
  Running,
  Completed,
  Failed,
  Cancelled,
}

/// Тип пакетной операции
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum BatchOperationType {
  VideoAnalysis,
  WhisperTranscription,
  SubtitleGeneration,
  QualityAnalysis,
  SceneDetection,
  MotionAnalysis,
  AudioAnalysis,
  LanguageDetection,
  ComprehensiveAnalysis,
}

/// Информация о пакетном задании
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchJobInfo {
  pub job_id: String,
  pub operation: BatchOperationType,
  pub clip_ids: Vec<String>,
  pub status: BatchJobStatus,
  pub total_clips: usize,
  pub completed_clips: usize,
  pub failed_clips: usize,
  pub start_time: String,
  pub end_time: Option<String>,
  pub errors: Vec<String>,
  pub results: HashMap<String, serde_json::Value>,
}

/// Результат пакетной операции для одного клипа
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchClipResult {
  pub clip_id: String,
  pub success: bool,
  pub data: Option<serde_json::Value>,
  pub error: Option<String>,
  pub execution_time_ms: u64,
}

/// Статистика пакетных операций
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BatchProcessingStats {
  pub total_jobs: usize,
  pub running_jobs: usize,
  pub completed_jobs: usize,
  pub failed_jobs: usize,
  pub average_execution_time_ms: u64,
  pub total_clips_processed: usize,
  pub success_rate: f64,
}

/// Параметры для создания пакетного задания
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateBatchJobParams {
  pub operation: BatchOperationType,
  pub clip_ids: Vec<String>,
  pub options: HashMap<String, serde_json::Value>,
  pub max_concurrent: Option<usize>,
  pub priority: Option<String>,
}

// Глобальное хранилище пакетных заданий (в реальной реализации использовать базу данных)
use once_cell::sync::Lazy;
use std::sync::Mutex;

// Note: This global static mutex can cause issues during test execution
// TODO: Replace with Tauri state management for better test isolation
static BATCH_JOBS: Lazy<Mutex<HashMap<String, BatchJobInfo>>> =
  Lazy::new(|| Mutex::new(HashMap::new()));

/// Создает новое пакетное задание
#[command]
pub async fn create_batch_job(params: CreateBatchJobParams) -> Result<String, String> {
  let job_id = Uuid::new_v4().to_string();

  let job_info = BatchJobInfo {
    job_id: job_id.clone(),
    operation: params.operation,
    clip_ids: params.clip_ids.clone(),
    status: BatchJobStatus::Pending,
    total_clips: params.clip_ids.len(),
    completed_clips: 0,
    failed_clips: 0,
    start_time: chrono::Utc::now().to_rfc3339(),
    end_time: None,
    errors: Vec::new(),
    results: HashMap::new(),
  };

  // Сохраняем задание
  {
    let mut jobs = BATCH_JOBS
      .lock()
      .or_else(|poisoned| {
        log::warn!("BATCH_JOBS mutex was poisoned, recovering data");
        Ok(poisoned.into_inner())
      })
      .map_err(|e| format!("Ошибка доступа к заданиям: {e}"))?;
    jobs.insert(job_id.clone(), job_info);
  }

  // В реальной реализации здесь запускался бы асинхронный процессор заданий
  log::info!(
    "Создано пакетное задание {} для {} клипов",
    job_id,
    params.clip_ids.len()
  );

  Ok(job_id)
}

/// Получает информацию о пакетном задании
#[command]
pub async fn get_batch_job_info(job_id: String) -> Result<BatchJobInfo, String> {
  let jobs = BATCH_JOBS
    .lock()
    .or_else(|poisoned| {
      log::warn!("BATCH_JOBS mutex was poisoned, recovering data");
      Ok(poisoned.into_inner())
    })
    .map_err(|e| format!("Ошибка доступа к заданиям: {e}"))?;

  jobs
    .get(&job_id)
    .cloned()
    .ok_or_else(|| format!("Задание с ID {job_id} не найдено"))
}

/// Отменяет пакетное задание
#[command]
pub async fn cancel_batch_job(job_id: String) -> Result<bool, String> {
  let mut jobs = BATCH_JOBS
    .lock()
    .or_else(|poisoned| {
      log::warn!("BATCH_JOBS mutex was poisoned, recovering data");
      Ok(poisoned.into_inner())
    })
    .map_err(|e| format!("Ошибка доступа к заданиям: {e}"))?;

  if let Some(job_info) = jobs.get_mut(&job_id) {
    if matches!(
      job_info.status,
      BatchJobStatus::Running | BatchJobStatus::Pending
    ) {
      job_info.status = BatchJobStatus::Cancelled;
      job_info.end_time = Some(chrono::Utc::now().to_rfc3339());
      log::info!("Отменено пакетное задание {job_id}");
      Ok(true)
    } else {
      Ok(false)
    }
  } else {
    Err(format!("Задание с ID {job_id} не найдено"))
  }
}

/// Получает список всех пакетных заданий
#[command]
pub async fn list_batch_jobs(limit: Option<usize>) -> Result<Vec<BatchJobInfo>, String> {
  let jobs = BATCH_JOBS
    .lock()
    .or_else(|poisoned| {
      log::warn!("BATCH_JOBS mutex was poisoned, recovering data");
      Ok(poisoned.into_inner())
    })
    .map_err(|e| format!("Ошибка доступа к заданиям: {e}"))?;

  let mut job_list: Vec<BatchJobInfo> = jobs.values().cloned().collect();
  job_list.sort_by(|a, b| b.start_time.cmp(&a.start_time)); // Сортировка по времени создания (новые первые)

  if let Some(limit) = limit {
    job_list.truncate(limit);
  }

  Ok(job_list)
}

/// Получает статистику пакетных операций
#[command]
pub async fn get_batch_processing_stats() -> Result<BatchProcessingStats, String> {
  let jobs = BATCH_JOBS
    .lock()
    .or_else(|poisoned| {
      log::warn!("BATCH_JOBS mutex was poisoned, recovering data");
      Ok(poisoned.into_inner())
    })
    .map_err(|e| format!("Ошибка доступа к заданиям: {e}"))?;

  let total_jobs = jobs.len();
  let running_jobs = jobs
    .values()
    .filter(|j| matches!(j.status, BatchJobStatus::Running))
    .count();
  let completed_jobs = jobs
    .values()
    .filter(|j| matches!(j.status, BatchJobStatus::Completed))
    .count();
  let failed_jobs = jobs
    .values()
    .filter(|j| matches!(j.status, BatchJobStatus::Failed))
    .count();

  let total_clips_processed: usize = jobs
    .values()
    .filter(|j| matches!(j.status, BatchJobStatus::Completed))
    .map(|j| j.total_clips)
    .sum();

  // Упрощенный расчет среднего времени выполнения
  let average_execution_time_ms = if completed_jobs > 0 {
    // В реальной реализации здесь должен быть точный расчет времени выполнения
    5000 // Заглушка: 5 секунд
  } else {
    0
  };

  let success_rate = if total_jobs > 0 {
    (completed_jobs as f64 / total_jobs as f64) * 100.0
  } else {
    0.0
  };

  Ok(BatchProcessingStats {
    total_jobs,
    running_jobs,
    completed_jobs,
    failed_jobs,
    average_execution_time_ms,
    total_clips_processed,
    success_rate,
  })
}

/// Обновляет результат для конкретного клипа в пакетном задании
#[command]
pub async fn update_batch_clip_result(
  job_id: String,
  clip_id: String,
  result: BatchClipResult,
) -> Result<(), String> {
  let mut jobs = BATCH_JOBS
    .lock()
    .or_else(|poisoned| {
      log::warn!("BATCH_JOBS mutex was poisoned, recovering data");
      Ok(poisoned.into_inner())
    })
    .map_err(|e| format!("Ошибка доступа к заданиям: {e}"))?;

  if let Some(job_info) = jobs.get_mut(&job_id) {
    // Обновляем результат для клипа
    if result.success {
      job_info.completed_clips += 1;
      if let Some(data) = result.data {
        job_info.results.insert(clip_id, data);
      }
    } else {
      job_info.failed_clips += 1;
      if let Some(error) = result.error {
        job_info.errors.push(format!("{clip_id}: {error}"));
      }
    }

    // Проверяем, завершена ли обработка всех клипов
    if job_info.completed_clips + job_info.failed_clips >= job_info.total_clips {
      job_info.status = if job_info.failed_clips == 0 {
        BatchJobStatus::Completed
      } else {
        BatchJobStatus::Failed
      };
      job_info.end_time = Some(chrono::Utc::now().to_rfc3339());
    }

    Ok(())
  } else {
    Err(format!("Задание с ID {job_id} не найдено"))
  }
}

/// Удаляет завершенные пакетные задания
#[command]
pub async fn cleanup_batch_jobs(older_than_hours: Option<u64>) -> Result<usize, String> {
  let mut jobs = BATCH_JOBS
    .lock()
    .or_else(|poisoned| {
      log::warn!("BATCH_JOBS mutex was poisoned, recovering data");
      Ok(poisoned.into_inner())
    })
    .map_err(|e| format!("Ошибка доступа к заданиям: {e}"))?;

  let threshold_hours = older_than_hours.unwrap_or(24); // По умолчанию удаляем задания старше 24 часов
  let threshold_time = chrono::Utc::now() - chrono::Duration::hours(threshold_hours as i64);

  let initial_count = jobs.len();

  // Удаляем завершенные задания старше порогового времени
  jobs.retain(|_, job_info| {
    if matches!(
      job_info.status,
      BatchJobStatus::Completed | BatchJobStatus::Failed | BatchJobStatus::Cancelled
    ) {
      if let Ok(start_time) = chrono::DateTime::parse_from_rfc3339(&job_info.start_time) {
        start_time.with_timezone(&chrono::Utc) > threshold_time
      } else {
        true // Сохраняем задания с неопределенным временем
      }
    } else {
      true // Сохраняем активные задания
    }
  });

  let removed_count = initial_count - jobs.len();
  log::info!("Удалено {removed_count} завершенных пакетных заданий");

  Ok(removed_count)
}

/// Устанавливает статус пакетного задания
#[command]
pub async fn set_batch_job_status(job_id: String, status: BatchJobStatus) -> Result<(), String> {
  let mut jobs = BATCH_JOBS
    .lock()
    .or_else(|poisoned| {
      log::warn!("BATCH_JOBS mutex was poisoned, recovering data");
      Ok(poisoned.into_inner())
    })
    .map_err(|e| format!("Ошибка доступа к заданиям: {e}"))?;

  if let Some(job_info) = jobs.get_mut(&job_id) {
    job_info.status = status;

    // Устанавливаем время завершения для финальных статусов
    if matches!(
      job_info.status,
      BatchJobStatus::Completed | BatchJobStatus::Failed | BatchJobStatus::Cancelled
    ) {
      job_info.end_time = Some(chrono::Utc::now().to_rfc3339());
    }

    Ok(())
  } else {
    Err(format!("Задание с ID {job_id} не найдено"))
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  /// Помощник для очистки состояния между тестами
  fn cleanup_jobs() {
    // Use timeout to avoid blocking indefinitely if mutex is in bad state
    let timeout = std::time::Duration::from_millis(100);
    
    // Try to clean up, but don't panic if mutex is poisoned or inaccessible
    if let Ok(result) = std::panic::catch_unwind(|| {
      if let Ok(mut jobs) = BATCH_JOBS.try_lock() {
        jobs.clear();
        true
      } else {
        // Mutex is locked or poisoned, skip cleanup
        eprintln!("Warning: Could not acquire BATCH_JOBS lock for cleanup");
        false
      }
    }) {
      if !result {
        // If we couldn't clean up, wait a bit and continue
        std::thread::sleep(std::time::Duration::from_millis(10));
      }
    } else {
      // Panic occurred during cleanup, continue anyway
      eprintln!("Warning: Panic occurred during batch jobs cleanup");
    }
  }

  #[tokio::test]
  async fn test_batch_job_status_variants() {
    assert!(matches!(BatchJobStatus::Pending, BatchJobStatus::Pending));
    assert!(matches!(BatchJobStatus::Running, BatchJobStatus::Running));
    assert!(matches!(
      BatchJobStatus::Completed,
      BatchJobStatus::Completed
    ));
    assert!(matches!(BatchJobStatus::Failed, BatchJobStatus::Failed));
    assert!(matches!(
      BatchJobStatus::Cancelled,
      BatchJobStatus::Cancelled
    ));
  }

  #[tokio::test]
  async fn test_batch_operation_types() {
    let ops = [
      BatchOperationType::VideoAnalysis,
      BatchOperationType::WhisperTranscription,
      BatchOperationType::SubtitleGeneration,
      BatchOperationType::QualityAnalysis,
      BatchOperationType::SceneDetection,
      BatchOperationType::MotionAnalysis,
      BatchOperationType::AudioAnalysis,
      BatchOperationType::LanguageDetection,
      BatchOperationType::ComprehensiveAnalysis,
    ];

    assert_eq!(ops.len(), 9);
  }

  #[tokio::test]
  async fn test_create_batch_job() {
    cleanup_jobs();

    let params = CreateBatchJobParams {
      operation: BatchOperationType::VideoAnalysis,
      clip_ids: vec![
        "clip1".to_string(),
        "clip2".to_string(),
        "clip3".to_string(),
      ],
      options: HashMap::new(),
      max_concurrent: Some(2),
      priority: Some("high".to_string()),
    };

    let result = create_batch_job(params).await;
    assert!(result.is_ok());

    let job_id = result.unwrap();
    assert!(!job_id.is_empty());

    // Проверяем, что задание создано
    let job_info = get_batch_job_info(job_id.clone()).await;
    assert!(job_info.is_ok());

    let info = job_info.unwrap();
    assert_eq!(info.job_id, job_id);
    assert_eq!(info.total_clips, 3);
    assert_eq!(info.completed_clips, 0);
    assert_eq!(info.failed_clips, 0);
    assert!(matches!(info.status, BatchJobStatus::Pending));
  }

  #[tokio::test]
  async fn test_get_batch_job_info_not_found() {
    cleanup_jobs();

    let result = get_batch_job_info("non-existent-id".to_string()).await;
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("не найдено"));
  }

  #[tokio::test]
  async fn test_cancel_batch_job() {
    cleanup_jobs();

    // Создаем задание
    let params = CreateBatchJobParams {
      operation: BatchOperationType::SceneDetection,
      clip_ids: vec!["clip1".to_string()],
      options: HashMap::new(),
      max_concurrent: None,
      priority: None,
    };

    let job_id = create_batch_job(params).await.unwrap();

    // Устанавливаем статус Running
    set_batch_job_status(job_id.clone(), BatchJobStatus::Running)
      .await
      .unwrap();

    // Отменяем задание
    let cancelled = cancel_batch_job(job_id.clone()).await.unwrap();
    assert!(cancelled);

    // Проверяем статус
    let info = get_batch_job_info(job_id).await.unwrap();
    assert!(matches!(info.status, BatchJobStatus::Cancelled));
    assert!(info.end_time.is_some());
  }

  #[tokio::test]
  async fn test_cancel_completed_job() {
    cleanup_jobs();

    // Создаем задание
    let params = CreateBatchJobParams {
      operation: BatchOperationType::AudioAnalysis,
      clip_ids: vec!["clip1".to_string()],
      options: HashMap::new(),
      max_concurrent: None,
      priority: None,
    };

    let job_id = create_batch_job(params).await.unwrap();

    // Устанавливаем статус Completed
    set_batch_job_status(job_id.clone(), BatchJobStatus::Completed)
      .await
      .unwrap();

    // Пытаемся отменить завершенное задание
    let cancelled = cancel_batch_job(job_id).await.unwrap();
    assert!(!cancelled); // Нельзя отменить завершенное задание
  }

  #[tokio::test]
  async fn test_list_batch_jobs() {
    cleanup_jobs();

    // Создаем несколько заданий
    for i in 0..3 {
      let params = CreateBatchJobParams {
        operation: BatchOperationType::VideoAnalysis,
        clip_ids: vec![format!("clip{}", i)],
        options: HashMap::new(),
        max_concurrent: None,
        priority: None,
      };
      create_batch_job(params).await.unwrap();
    }

    // Получаем список без лимита
    let jobs = list_batch_jobs(None).await.unwrap();
    assert_eq!(jobs.len(), 3);

    // Получаем список с лимитом
    let limited_jobs = list_batch_jobs(Some(2)).await.unwrap();
    assert_eq!(limited_jobs.len(), 2);
  }

  #[tokio::test]
  async fn test_get_batch_processing_stats() {
    cleanup_jobs();

    // Создаем задания с разными статусами
    let params1 = CreateBatchJobParams {
      operation: BatchOperationType::VideoAnalysis,
      clip_ids: vec!["clip1".to_string(), "clip2".to_string()],
      options: HashMap::new(),
      max_concurrent: None,
      priority: None,
    };
    let job1 = create_batch_job(params1).await.unwrap();
    set_batch_job_status(job1, BatchJobStatus::Completed)
      .await
      .unwrap();

    let params2 = CreateBatchJobParams {
      operation: BatchOperationType::SceneDetection,
      clip_ids: vec!["clip3".to_string()],
      options: HashMap::new(),
      max_concurrent: None,
      priority: None,
    };
    let job2 = create_batch_job(params2).await.unwrap();
    set_batch_job_status(job2, BatchJobStatus::Running)
      .await
      .unwrap();

    let params3 = CreateBatchJobParams {
      operation: BatchOperationType::AudioAnalysis,
      clip_ids: vec!["clip4".to_string()],
      options: HashMap::new(),
      max_concurrent: None,
      priority: None,
    };
    let job3 = create_batch_job(params3).await.unwrap();
    set_batch_job_status(job3, BatchJobStatus::Failed)
      .await
      .unwrap();

    let stats = get_batch_processing_stats().await.unwrap();
    assert_eq!(stats.total_jobs, 3);
    assert_eq!(stats.running_jobs, 1);
    assert_eq!(stats.completed_jobs, 1);
    assert_eq!(stats.failed_jobs, 1);
    assert_eq!(stats.total_clips_processed, 2); // Только завершенные задания
    assert!(stats.success_rate > 30.0 && stats.success_rate < 40.0); // ~33.3%
  }

  #[tokio::test]
  async fn test_update_batch_clip_result_success() {
    cleanup_jobs();

    // Создаем задание
    let params = CreateBatchJobParams {
      operation: BatchOperationType::WhisperTranscription,
      clip_ids: vec!["clip1".to_string(), "clip2".to_string()],
      options: HashMap::new(),
      max_concurrent: None,
      priority: None,
    };

    let job_id = create_batch_job(params).await.unwrap();
    set_batch_job_status(job_id.clone(), BatchJobStatus::Running)
      .await
      .unwrap();

    // Обновляем результат для первого клипа
    let result1 = BatchClipResult {
      clip_id: "clip1".to_string(),
      success: true,
      data: Some(serde_json::json!({"transcript": "Hello world"})),
      error: None,
      execution_time_ms: 1234,
    };

    update_batch_clip_result(job_id.clone(), "clip1".to_string(), result1)
      .await
      .unwrap();

    let info = get_batch_job_info(job_id.clone()).await.unwrap();
    assert_eq!(info.completed_clips, 1);
    assert_eq!(info.failed_clips, 0);
    assert!(matches!(info.status, BatchJobStatus::Running)); // Еще не все клипы обработаны

    // Обновляем результат для второго клипа
    let result2 = BatchClipResult {
      clip_id: "clip2".to_string(),
      success: true,
      data: Some(serde_json::json!({"transcript": "Goodbye world"})),
      error: None,
      execution_time_ms: 2345,
    };

    update_batch_clip_result(job_id.clone(), "clip2".to_string(), result2)
      .await
      .unwrap();

    let final_info = get_batch_job_info(job_id).await.unwrap();
    assert_eq!(final_info.completed_clips, 2);
    assert_eq!(final_info.failed_clips, 0);
    assert!(matches!(final_info.status, BatchJobStatus::Completed));
    assert!(final_info.end_time.is_some());
  }

  #[tokio::test]
  async fn test_update_batch_clip_result_failure() {
    cleanup_jobs();

    // Создаем задание
    let params = CreateBatchJobParams {
      operation: BatchOperationType::QualityAnalysis,
      clip_ids: vec!["clip1".to_string(), "clip2".to_string()],
      options: HashMap::new(),
      max_concurrent: None,
      priority: None,
    };

    let job_id = create_batch_job(params).await.unwrap();

    // Обновляем результат с ошибкой для первого клипа
    let result1 = BatchClipResult {
      clip_id: "clip1".to_string(),
      success: false,
      data: None,
      error: Some("Failed to analyze quality".to_string()),
      execution_time_ms: 500,
    };

    update_batch_clip_result(job_id.clone(), "clip1".to_string(), result1)
      .await
      .unwrap();

    // Обновляем результат с успехом для второго клипа
    let result2 = BatchClipResult {
      clip_id: "clip2".to_string(),
      success: true,
      data: Some(serde_json::json!({"quality": "1080p"})),
      error: None,
      execution_time_ms: 1500,
    };

    update_batch_clip_result(job_id.clone(), "clip2".to_string(), result2)
      .await
      .unwrap();

    let info = get_batch_job_info(job_id).await.unwrap();
    assert_eq!(info.completed_clips, 1);
    assert_eq!(info.failed_clips, 1);
    assert!(matches!(info.status, BatchJobStatus::Failed)); // Есть ошибки
    assert_eq!(info.errors.len(), 1);
    assert!(info.errors[0].contains("Failed to analyze quality"));
  }

  #[tokio::test]
  async fn test_cleanup_batch_jobs() {
    cleanup_jobs();

    // Создаем несколько заданий
    let mut job_ids = vec![];

    for i in 0..4 {
      let params = CreateBatchJobParams {
        operation: BatchOperationType::VideoAnalysis,
        clip_ids: vec![format!("clip{}", i)],
        options: HashMap::new(),
        max_concurrent: None,
        priority: None,
      };
      let job_id = create_batch_job(params).await.unwrap();
      job_ids.push(job_id);
    }

    // Устанавливаем разные статусы
    set_batch_job_status(job_ids[0].clone(), BatchJobStatus::Completed)
      .await
      .unwrap();
    set_batch_job_status(job_ids[1].clone(), BatchJobStatus::Failed)
      .await
      .unwrap();
    set_batch_job_status(job_ids[2].clone(), BatchJobStatus::Running)
      .await
      .unwrap();
    set_batch_job_status(job_ids[3].clone(), BatchJobStatus::Cancelled)
      .await
      .unwrap();

    // Очистка с очень маленьким порогом (удалит все завершенные)
    let removed = cleanup_batch_jobs(Some(0)).await.unwrap();
    assert_eq!(removed, 3); // Completed, Failed, Cancelled

    // Проверяем, что остался только Running
    let remaining = list_batch_jobs(None).await.unwrap();
    assert_eq!(remaining.len(), 1);
    assert!(matches!(remaining[0].status, BatchJobStatus::Running));
  }

  #[tokio::test]
  async fn test_batch_job_info_serialization() {
    let job_info = BatchJobInfo {
      job_id: "test-123".to_string(),
      operation: BatchOperationType::ComprehensiveAnalysis,
      clip_ids: vec!["clip1".to_string(), "clip2".to_string()],
      status: BatchJobStatus::Completed,
      total_clips: 2,
      completed_clips: 2,
      failed_clips: 0,
      start_time: chrono::Utc::now().to_rfc3339(),
      end_time: Some(chrono::Utc::now().to_rfc3339()),
      errors: vec![],
      results: {
        let mut results = HashMap::new();
        results.insert("clip1".to_string(), serde_json::json!({"data": "test1"}));
        results.insert("clip2".to_string(), serde_json::json!({"data": "test2"}));
        results
      },
    };

    // Сериализация
    let json = serde_json::to_string(&job_info).unwrap();

    // Десериализация
    let deserialized: BatchJobInfo = serde_json::from_str(&json).unwrap();

    assert_eq!(deserialized.job_id, job_info.job_id);
    assert_eq!(deserialized.total_clips, job_info.total_clips);
    assert_eq!(deserialized.results.len(), 2);
  }

  #[tokio::test]
  async fn test_concurrent_job_creation() {
    cleanup_jobs();

    // Создаем несколько заданий параллельно
    let mut handles = vec![];

    for i in 0..5 {
      let handle = tokio::spawn(async move {
        let params = CreateBatchJobParams {
          operation: BatchOperationType::VideoAnalysis,
          clip_ids: vec![format!("clip{}", i)],
          options: HashMap::new(),
          max_concurrent: None,
          priority: None,
        };
        create_batch_job(params).await
      });
      handles.push(handle);
    }

    // Ждем завершения всех
    let mut results = vec![];
    for handle in handles {
      let result = handle.await.unwrap();
      assert!(result.is_ok());
      results.push(result.unwrap());
    }

    // Проверяем, что все ID уникальные
    let unique_ids: std::collections::HashSet<_> = results.iter().collect();
    assert_eq!(unique_ids.len(), 5);

    // Проверяем, что все задания созданы
    let jobs = list_batch_jobs(None).await.unwrap();
    assert_eq!(jobs.len(), 5);
  }

  #[tokio::test]
  async fn test_edge_cases() {
    cleanup_jobs();

    // Создание задания без клипов
    let params = CreateBatchJobParams {
      operation: BatchOperationType::MotionAnalysis,
      clip_ids: vec![],
      options: HashMap::new(),
      max_concurrent: None,
      priority: None,
    };

    let job_id = create_batch_job(params).await.unwrap();
    let info = get_batch_job_info(job_id).await.unwrap();
    assert_eq!(info.total_clips, 0);

    // Статистика с пустым хранилищем
    cleanup_jobs();
    let stats = get_batch_processing_stats().await.unwrap();
    assert_eq!(stats.total_jobs, 0);
    assert_eq!(stats.success_rate, 0.0);

    // Очистка пустого хранилища
    let removed = cleanup_batch_jobs(None).await.unwrap();
    assert_eq!(removed, 0);
  }

  #[tokio::test]
  async fn test_create_job_with_options() {
    cleanup_jobs();

    let mut options = HashMap::new();
    options.insert("language".to_string(), serde_json::json!("en"));
    options.insert("model".to_string(), serde_json::json!("base"));
    options.insert("threads".to_string(), serde_json::json!(4));

    let params = CreateBatchJobParams {
      operation: BatchOperationType::LanguageDetection,
      clip_ids: vec!["clip1".to_string(), "clip2".to_string()],
      options,
      max_concurrent: Some(2),
      priority: Some("high".to_string()),
    };

    let job_id = create_batch_job(params).await.unwrap();
    assert!(!job_id.is_empty());

    let info = get_batch_job_info(job_id).await.unwrap();
    assert_eq!(info.clip_ids.len(), 2);
  }
}
