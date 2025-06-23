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
      .map_err(|e| format!("Ошибка доступа к заданиям: {}", e))?;
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
    .map_err(|e| format!("Ошибка доступа к заданиям: {}", e))?;

  jobs
    .get(&job_id)
    .cloned()
    .ok_or_else(|| format!("Задание с ID {} не найдено", job_id))
}

/// Отменяет пакетное задание
#[command]
pub async fn cancel_batch_job(job_id: String) -> Result<bool, String> {
  let mut jobs = BATCH_JOBS
    .lock()
    .map_err(|e| format!("Ошибка доступа к заданиям: {}", e))?;

  if let Some(job_info) = jobs.get_mut(&job_id) {
    if matches!(
      job_info.status,
      BatchJobStatus::Running | BatchJobStatus::Pending
    ) {
      job_info.status = BatchJobStatus::Cancelled;
      job_info.end_time = Some(chrono::Utc::now().to_rfc3339());
      log::info!("Отменено пакетное задание {}", job_id);
      Ok(true)
    } else {
      Ok(false)
    }
  } else {
    Err(format!("Задание с ID {} не найдено", job_id))
  }
}

/// Получает список всех пакетных заданий
#[command]
pub async fn list_batch_jobs(limit: Option<usize>) -> Result<Vec<BatchJobInfo>, String> {
  let jobs = BATCH_JOBS
    .lock()
    .map_err(|e| format!("Ошибка доступа к заданиям: {}", e))?;

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
    .map_err(|e| format!("Ошибка доступа к заданиям: {}", e))?;

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
    .map_err(|e| format!("Ошибка доступа к заданиям: {}", e))?;

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
        job_info.errors.push(format!("{}: {}", clip_id, error));
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
    Err(format!("Задание с ID {} не найдено", job_id))
  }
}

/// Удаляет завершенные пакетные задания
#[command]
pub async fn cleanup_batch_jobs(older_than_hours: Option<u64>) -> Result<usize, String> {
  let mut jobs = BATCH_JOBS
    .lock()
    .map_err(|e| format!("Ошибка доступа к заданиям: {}", e))?;

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
  log::info!("Удалено {} завершенных пакетных заданий", removed_count);

  Ok(removed_count)
}

/// Устанавливает статус пакетного задания
#[command]
pub async fn set_batch_job_status(job_id: String, status: BatchJobStatus) -> Result<(), String> {
  let mut jobs = BATCH_JOBS
    .lock()
    .map_err(|e| format!("Ошибка доступа к заданиям: {}", e))?;

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
    Err(format!("Задание с ID {} не найдено", job_id))
  }
}
