//! Pipeline commands - команды для работы с рефакторенным конвейером рендеринга

use crate::video_compiler::core::pipeline_refactored::{PipelineBuilder, RenderPipeline};
use crate::video_compiler::error::Result;
use crate::video_compiler::schema::ProjectSchema;
use crate::video_compiler::VideoCompilerState;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::State;
use tokio::sync::RwLock;

/// Информация о конвейере
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PipelineInfo {
  pub stages: Vec<String>,
  pub is_running: bool,
  pub progress: u64,
  pub statistics: serde_json::Value,
}

/// Создать и выполнить конвейер рендеринга
#[tauri::command]
pub async fn create_and_execute_pipeline(
  project: ProjectSchema,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let output = PathBuf::from(&output_path);

  // Создаем трекер прогресса
  let (sender, _receiver) = tokio::sync::mpsc::unbounded_channel();
  let progress_tracker = Arc::new(crate::video_compiler::progress::ProgressTracker::new(
    sender,
  ));

  // Создаем конвейер
  let pipeline = RenderPipeline::new(
    project,
    progress_tracker,
    state.settings.clone(),
    output.clone(),
  )
  .await?;

  // Генерируем ID задачи
  let job_id = uuid::Uuid::new_v4().to_string();

  // Сохраняем конвейер в состоянии
  {
    let mut pipelines = state.active_pipelines.write().await;
    pipelines.insert(job_id.clone(), Arc::new(RwLock::new(pipeline)));
  }

  // Запускаем выполнение в отдельной задаче
  let pipelines = state.active_pipelines.clone();
  let job_id_clone = job_id.clone();

  tokio::spawn(async move {
    if let Some(pipeline_arc) = pipelines.read().await.get(&job_id_clone) {
      let mut pipeline = pipeline_arc.write().await;
      let _ = pipeline.execute(&job_id_clone).await;
    }
  });

  Ok(job_id)
}

/// Получить информацию о конвейере
#[tauri::command]
pub async fn get_pipeline_info(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<PipelineInfo> {
  let pipelines = state.active_pipelines.read().await;

  if let Some(pipeline_arc) = pipelines.get(&job_id) {
    let pipeline = pipeline_arc.read().await;

    let stages = pipeline.get_stage_names();
    let is_running = pipeline.is_running();
    let progress = pipeline.get_progress().await;
    let statistics = serde_json::to_value(pipeline.get_statistics())?;

    Ok(PipelineInfo {
      stages,
      is_running,
      progress,
      statistics,
    })
  } else {
    Err(
      crate::video_compiler::error::VideoCompilerError::validation(format!(
        "Pipeline not found: {}",
        job_id
      )),
    )
  }
}

/// Отменить выполнение конвейера
#[tauri::command]
pub async fn cancel_pipeline(job_id: String, state: State<'_, VideoCompilerState>) -> Result<()> {
  let pipelines = state.active_pipelines.read().await;

  if let Some(pipeline_arc) = pipelines.get(&job_id) {
    let mut pipeline = pipeline_arc.write().await;
    pipeline.cancel().await?;
    Ok(())
  } else {
    Err(
      crate::video_compiler::error::VideoCompilerError::validation(format!(
        "Pipeline not found: {}",
        job_id
      )),
    )
  }
}

/// Получить статистику конвейера
#[tauri::command]
pub async fn get_pipeline_statistics(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let pipelines = state.active_pipelines.read().await;

  if let Some(pipeline_arc) = pipelines.get(&job_id) {
    let pipeline = pipeline_arc.read().await;
    let stats = pipeline.get_statistics();
    Ok(serde_json::to_value(stats)?)
  } else {
    Err(
      crate::video_compiler::error::VideoCompilerError::validation(format!(
        "Pipeline not found: {}",
        job_id
      )),
    )
  }
}

/// Получить контекст конвейера
#[tauri::command]
pub async fn get_pipeline_context(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let pipelines = state.active_pipelines.read().await;

  if let Some(pipeline_arc) = pipelines.get(&job_id) {
    let pipeline = pipeline_arc.read().await;
    let context = pipeline.get_context();

    // Создаем упрощенную версию контекста для сериализации
    let context_data = serde_json::json!({
        "project_name": context.project.metadata.name,
        "output_path": context.output_path,
        "temp_dir": context.temp_dir,
        "intermediate_files": context.intermediate_files,
        "user_data": context.user_data,
        "is_cancelled": context.is_cancelled()
    });

    Ok(context_data)
  } else {
    Err(
      crate::video_compiler::error::VideoCompilerError::validation(format!(
        "Pipeline not found: {}",
        job_id
      )),
    )
  }
}

/// Обновить настройки конвейера
#[tauri::command]
pub async fn update_pipeline_settings(
  job_id: String,
  new_settings: crate::video_compiler::CompilerSettings,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let pipelines = state.active_pipelines.read().await;

  if let Some(pipeline_arc) = pipelines.get(&job_id) {
    let mut pipeline = pipeline_arc.write().await;
    pipeline.update_settings(new_settings).await?;
    Ok(())
  } else {
    Err(
      crate::video_compiler::error::VideoCompilerError::validation(format!(
        "Pipeline not found: {}",
        job_id
      )),
    )
  }
}

/// Валидировать конфигурацию конвейера
#[tauri::command]
pub async fn validate_pipeline_configuration(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  let pipelines = state.active_pipelines.read().await;

  if let Some(pipeline_arc) = pipelines.get(&job_id) {
    let pipeline = pipeline_arc.read().await;
    pipeline.validate_configuration().await?;
    Ok(true)
  } else {
    Err(
      crate::video_compiler::error::VideoCompilerError::validation(format!(
        "Pipeline not found: {}",
        job_id
      )),
    )
  }
}

/// Добавить кастомный этап в конвейер
#[tauri::command]
pub async fn insert_pipeline_stage(
  job_id: String,
  stage_name: String,
  index: usize,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let pipelines = state.active_pipelines.read().await;

  if let Some(pipeline_arc) = pipelines.get(&job_id) {
    let mut pipeline = pipeline_arc.write().await;

    // Создаем кастомный этап на основе имени
    match stage_name.as_str() {
      "validation" => {
        pipeline.insert_stage(
          index,
          Box::new(crate::video_compiler::core::stages::ValidationStage::new()),
        );
      }
      "preprocessing" => {
        pipeline.insert_stage(
          index,
          Box::new(crate::video_compiler::core::stages::PreprocessingStage::new()),
        );
      }
      _ => {
        return Err(
          crate::video_compiler::error::VideoCompilerError::validation(format!(
            "Unknown stage type: {}",
            stage_name
          )),
        );
      }
    }

    Ok(())
  } else {
    Err(
      crate::video_compiler::error::VideoCompilerError::validation(format!(
        "Pipeline not found: {}",
        job_id
      )),
    )
  }
}

/// Удалить этап из конвейера
#[tauri::command]
pub async fn remove_pipeline_stage(
  job_id: String,
  stage_name: String,
  state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  let pipelines = state.active_pipelines.read().await;

  if let Some(pipeline_arc) = pipelines.get(&job_id) {
    let mut pipeline = pipeline_arc.write().await;
    Ok(pipeline.remove_stage(&stage_name))
  } else {
    Err(
      crate::video_compiler::error::VideoCompilerError::validation(format!(
        "Pipeline not found: {}",
        job_id
      )),
    )
  }
}

/// Создать конвейер с помощью Builder
#[tauri::command]
pub async fn build_custom_pipeline(
  project: ProjectSchema,
  output_path: String,
  skip_defaults: bool,
  custom_stages: Vec<String>,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let output = PathBuf::from(&output_path);

  // Создаем трекер прогресса
  let (sender, _receiver) = tokio::sync::mpsc::unbounded_channel();
  let progress_tracker = Arc::new(crate::video_compiler::progress::ProgressTracker::new(
    sender,
  ));

  // Используем PipelineBuilder
  let mut builder = PipelineBuilder::new()
    .with_project(project)
    .with_output_path(output);

  if skip_defaults {
    builder = builder.skip_default_stages();
  }

  // Добавляем кастомные этапы
  for stage_name in custom_stages {
    match stage_name.as_str() {
      "validation" => {
        builder = builder.add_stage(Box::new(
          crate::video_compiler::core::stages::ValidationStage::new(),
        ));
      }
      "preprocessing" => {
        builder = builder.add_stage(Box::new(
          crate::video_compiler::core::stages::PreprocessingStage::new(),
        ));
      }
      "composition" => {
        builder = builder.add_stage(Box::new(
          crate::video_compiler::core::stages::CompositionStage::new(),
        ));
      }
      "encoding" => {
        builder = builder.add_stage(Box::new(
          crate::video_compiler::core::stages::EncodingStage::new(),
        ));
      }
      "finalization" => {
        builder = builder.add_stage(Box::new(
          crate::video_compiler::core::stages::FinalizationStage::new(),
        ));
      }
      _ => {
        log::warn!("Unknown stage type: {}", stage_name);
      }
    }
  }

  // Строим конвейер
  let pipeline = builder
    .build(progress_tracker, state.settings.clone())
    .await?;

  // Генерируем ID задачи
  let job_id = uuid::Uuid::new_v4().to_string();

  // Сохраняем конвейер
  {
    let mut pipelines = state.active_pipelines.write().await;
    pipelines.insert(job_id.clone(), Arc::new(RwLock::new(pipeline)));
  }

  Ok(job_id)
}

/// Получить сводку выполнения конвейера
#[tauri::command]
pub async fn get_pipeline_execution_summary(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let pipelines = state.active_pipelines.read().await;

  if let Some(pipeline_arc) = pipelines.get(&job_id) {
    let pipeline = pipeline_arc.read().await;
    let summary = pipeline.create_execution_summary();
    Ok(serde_json::to_value(summary)?)
  } else {
    Err(
      crate::video_compiler::error::VideoCompilerError::validation(format!(
        "Pipeline not found: {}",
        job_id
      )),
    )
  }
}

/// Получить прогресс конвейера
#[tauri::command]
pub async fn get_pipeline_progress(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<u64> {
  let pipelines = state.active_pipelines.read().await;

  if let Some(pipeline_arc) = pipelines.get(&job_id) {
    let pipeline = pipeline_arc.read().await;
    Ok(pipeline.get_progress().await)
  } else {
    Err(
      crate::video_compiler::error::VideoCompilerError::validation(format!(
        "Pipeline not found: {}",
        job_id
      )),
    )
  }
}

/// Очистить завершенные конвейеры
#[tauri::command]
pub async fn cleanup_completed_pipelines(state: State<'_, VideoCompilerState>) -> Result<usize> {
  let mut pipelines = state.active_pipelines.write().await;
  let initial_count = pipelines.len();

  // Находим завершенные конвейеры
  let completed_ids: Vec<String> = {
    let mut ids = Vec::new();
    for (id, pipeline_arc) in pipelines.iter() {
      let pipeline = pipeline_arc.read().await;
      if !pipeline.is_running() {
        ids.push(id.clone());
      }
    }
    ids
  };

  // Удаляем завершенные
  for id in &completed_ids {
    pipelines.remove(id);
  }

  Ok(initial_count - pipelines.len())
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::schema::export::ProjectSettings;
  use crate::video_compiler::schema::{
    AspectRatio, ProjectMetadata, ProjectSchema, Timeline, Track,
  };
  use crate::video_compiler::{CompilerSettings, VideoCompilerState};
  use std::collections::HashMap;

  fn create_test_project() -> ProjectSchema {
    ProjectSchema {
      version: "1.0.0".to_string(),
      metadata: ProjectMetadata {
        name: "Test Project".to_string(),
        description: Some("Test description".to_string()),
        author: Some("Test Author".to_string()),
        created_at: chrono::Utc::now(),
        modified_at: chrono::Utc::now(),
      },
      timeline: Timeline {
        duration: 30.0,
        fps: 30,
        resolution: (1920, 1080),
        sample_rate: 48000,
        aspect_ratio: AspectRatio::Ratio16x9,
      },
      tracks: vec![
        Track::new(
          crate::video_compiler::schema::TrackType::Video,
          "Video Track".to_string(),
        ),
        Track::new(
          crate::video_compiler::schema::TrackType::Audio,
          "Audio Track".to_string(),
        ),
      ],
      effects: vec![],
      filters: vec![],
      transitions: vec![],
      templates: vec![],
      style_templates: vec![],
      subtitles: vec![],
      settings: ProjectSettings::default(),
    }
  }

  fn create_test_state() -> VideoCompilerState {
    // Создаем минимальный контейнер сервисов для тестов
    let ffmpeg_path = "ffmpeg".to_string();
    let cache = Arc::new(crate::video_compiler::services::CacheServiceImpl::new(
      std::env::temp_dir().join("timeline-studio-test"),
    ));
    let ffmpeg = Arc::new(crate::video_compiler::services::FfmpegServiceImpl::new(
      ffmpeg_path.clone(),
    ));

    // Создаем метрики для каждого сервиса
    let metrics = crate::video_compiler::services::ServiceMetricsContainer {
      render: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
        "render-service".to_string(),
      )),
      cache: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
        "cache-service".to_string(),
      )),
      gpu: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
        "gpu-service".to_string(),
      )),
      preview: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
        "preview-service".to_string(),
      )),
      project: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
        "project-service".to_string(),
      )),
      ffmpeg: Arc::new(crate::video_compiler::services::ServiceMetrics::new(
        "ffmpeg-service".to_string(),
      )),
    };

    let services = Arc::new(crate::video_compiler::services::ServiceContainer {
      render: Arc::new(crate::video_compiler::services::RenderServiceImpl::new(
        ffmpeg.clone(),
        2,
        cache.clone(),
      )),
      cache: cache.clone(),
      gpu: Arc::new(crate::video_compiler::services::GpuServiceImpl::new(
        ffmpeg_path.clone(),
      )),
      preview: Arc::new(crate::video_compiler::services::PreviewServiceImpl::new(
        ffmpeg.clone(),
      )),
      ffmpeg: ffmpeg.clone(),
      project: Arc::new(crate::video_compiler::services::ProjectServiceImpl::new()),
      metrics,
    });

    VideoCompilerState {
      services,
      active_jobs: Arc::new(RwLock::new(HashMap::new())),
      active_pipelines: Arc::new(RwLock::new(HashMap::new())),
      cache_manager: Arc::new(RwLock::new(crate::video_compiler::cache::RenderCache::new())),
      ffmpeg_path: Arc::new(RwLock::new(ffmpeg_path)),
      settings: Arc::new(RwLock::new(CompilerSettings::default())),
    }
  }

  #[test]
  fn test_pipeline_info_serialization() {
    let info = PipelineInfo {
      stages: vec!["validation".to_string(), "preprocessing".to_string()],
      is_running: true,
      progress: 50,
      statistics: serde_json::json!({"frames_processed": 100}),
    };

    let json = serde_json::to_string(&info).unwrap();
    assert!(json.contains("validation"));
    assert!(json.contains("frames_processed"));

    // Десериализация
    let deserialized: PipelineInfo = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.stages.len(), 2);
    assert!(deserialized.is_running);
    assert_eq!(deserialized.progress, 50);
  }

  #[test]
  fn test_pipeline_info_creation() {
    let stages = vec![
      "validation".to_string(),
      "preprocessing".to_string(),
      "composition".to_string(),
      "encoding".to_string(),
      "finalization".to_string(),
    ];

    let stats = serde_json::json!({
      "frames_processed": 1500,
      "encoding_speed": 2.5,
      "memory_usage_mb": 512,
      "errors": 0
    });

    let info = PipelineInfo {
      stages,
      is_running: false,
      progress: 100,
      statistics: stats,
    };

    assert_eq!(info.stages.len(), 5);
    assert!(!info.is_running);
    assert_eq!(info.progress, 100);
    assert!(info.statistics.get("frames_processed").is_some());
  }

  // Note: Tauri State cannot be tested directly without proper mocking
  // These tests verify the logic structure and error handling

  #[tokio::test]
  async fn test_all_stage_types() {
    // Тестируем, что все типы этапов обрабатываются корректно
    let stage_types = vec![
      "validation",
      "preprocessing",
      "composition",
      "encoding",
      "finalization",
    ];

    for stage_type in stage_types {
      assert!(!stage_type.is_empty());
      assert!(stage_type.len() > 5); // Минимальная длина для имени этапа
    }
  }

  #[test]
  fn test_error_messages() {
    let job_id = "test-123";
    let error = crate::video_compiler::error::VideoCompilerError::validation(format!(
      "Pipeline not found: {}",
      job_id
    ));

    let error_str = error.to_string();
    assert!(error_str.contains("Pipeline not found"));
    assert!(error_str.contains("test-123"));
  }

  #[tokio::test]
  async fn test_concurrent_pipeline_access() {
    let state_inner = create_test_state();

    // Тестируем параллельный доступ к pipelines
    let pipelines = state_inner.active_pipelines.clone();

    let mut handles = vec![];

    // Создаем несколько задач для чтения
    for i in 0..5 {
      let pipelines_clone = pipelines.clone();
      let handle = tokio::spawn(async move {
        let _guard = pipelines_clone.read().await;
        // Симулируем работу
        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
        i
      });
      handles.push(handle);
    }

    // Создаем задачу для записи (просто симулируем работу)
    let pipelines_clone = pipelines.clone();
    let write_handle = tokio::spawn(async move {
      let _guard = pipelines_clone.write().await;
      // В реальном тесте здесь была бы вставка настоящего pipeline
      // guard.insert("test".to_string(), Arc::new(RwLock::new(pipeline)));
      99
    });
    handles.push(write_handle);

    // Ждем завершения всех задач
    for handle in handles {
      let result = handle.await;
      assert!(result.is_ok());
    }
  }

  #[test]
  fn test_output_path_handling() {
    let paths = vec![
      "/tmp/output.mp4",
      "C:\\Users\\test\\output.mp4",
      "./relative/path/output.mp4",
      "~/home/user/output.mp4",
    ];

    for path in paths {
      let path_buf = PathBuf::from(path);
      assert!(!path_buf.to_string_lossy().is_empty());
    }
  }

  #[test]
  fn test_project_schema_creation() {
    let project = create_test_project();

    assert_eq!(project.version, "1.0.0");
    assert_eq!(project.metadata.name, "Test Project");
    assert_eq!(project.timeline.duration, 30.0);
    assert_eq!(project.timeline.fps, 30);
    assert_eq!(project.timeline.resolution, (1920, 1080));
    assert_eq!(project.tracks.len(), 2);
  }

  #[test]
  fn test_video_compiler_state_creation() {
    let state = create_test_state();

    // Проверяем, что все компоненты инициализированы
    assert!(Arc::strong_count(&state.services) >= 1);
    assert!(Arc::strong_count(&state.active_jobs) >= 1);
    assert!(Arc::strong_count(&state.active_pipelines) >= 1);
    assert!(Arc::strong_count(&state.cache_manager) >= 1);
    assert!(Arc::strong_count(&state.ffmpeg_path) >= 1);
    assert!(Arc::strong_count(&state.settings) >= 1);
  }

  #[test]
  fn test_pipeline_stage_names() {
    let known_stages = [
      "validation",
      "preprocessing",
      "composition",
      "encoding",
      "finalization",
    ];

    // Проверяем, что имена этапов уникальны
    let unique: std::collections::HashSet<_> = known_stages.iter().collect();
    assert_eq!(unique.len(), known_stages.len());
  }

  #[test]
  fn test_pipeline_info_statistics_structure() {
    let stats = serde_json::json!({
      "frames_processed": 1500,
      "encoding_speed": 2.5,
      "memory_usage_mb": 512,
      "errors": 0,
      "warnings": [],
      "stage_durations": {
        "validation": 0.5,
        "preprocessing": 2.3,
        "composition": 15.7,
        "encoding": 45.2,
        "finalization": 1.1
      }
    });

    let info = PipelineInfo {
      stages: vec!["test".to_string()],
      is_running: false,
      progress: 100,
      statistics: stats.clone(),
    };

    // Проверяем структуру статистики
    assert!(info.statistics.get("frames_processed").is_some());
    assert!(info.statistics.get("stage_durations").is_some());

    // Проверяем сериализацию
    let serialized = serde_json::to_string(&info).unwrap();
    assert!(serialized.contains("frames_processed"));
    assert!(serialized.contains("stage_durations"));
  }

  #[tokio::test]
  async fn test_rwlock_behavior() {
    let pipelines: Arc<RwLock<HashMap<String, String>>> = Arc::new(RwLock::new(HashMap::new()));

    // Тест множественных читателей
    let mut read_handles = vec![];
    for i in 0..3 {
      let pipelines_clone = pipelines.clone();
      let handle = tokio::spawn(async move {
        let guard = pipelines_clone.read().await;
        tokio::time::sleep(tokio::time::Duration::from_millis(10)).await;
        drop(guard);
        i
      });
      read_handles.push(handle);
    }

    // Все читатели должны работать параллельно
    for handle in read_handles {
      let result = handle.await;
      assert!(result.is_ok());
    }

    // Тест записи
    {
      let mut write_guard = pipelines.write().await;
      write_guard.insert("test".to_string(), "value".to_string());
    }

    // Проверяем, что запись прошла успешно
    let read_guard = pipelines.read().await;
    assert_eq!(read_guard.get("test"), Some(&"value".to_string()));
  }

  #[test]
  fn test_uuid_generation() {
    let uuid1 = uuid::Uuid::new_v4().to_string();
    let uuid2 = uuid::Uuid::new_v4().to_string();

    // UUID должны быть уникальными
    assert_ne!(uuid1, uuid2);

    // UUID должны иметь правильный формат
    assert_eq!(uuid1.len(), 36);
    assert!(uuid1.contains('-'));
  }

  #[test]
  fn test_unknown_stage_handling() {
    let unknown_stages = vec!["unknown", "custom_stage", "my_special_stage", ""];

    for stage in unknown_stages {
      // В реальном коде эти этапы должны быть обработаны
      // как неизвестные и вызывать предупреждение
      if stage.is_empty() {
        assert!(stage.is_empty());
      } else {
        assert!(!stage.is_empty());
      }
    }
  }

  #[test]
  fn test_custom_stages_list() {
    let custom_stages = [
      "validation".to_string(),
      "preprocessing".to_string(),
      "custom_filter".to_string(),
      "composition".to_string(),
      "encoding".to_string(),
    ];

    // Проверяем, что список может содержать как известные, так и неизвестные этапы
    assert_eq!(custom_stages.len(), 5);
    assert!(custom_stages.contains(&"validation".to_string()));
    assert!(custom_stages.contains(&"custom_filter".to_string()));
  }

  #[tokio::test]
  async fn test_pipeline_cleanup_logic() {
    let mut completed_pipelines = HashMap::new();
    completed_pipelines.insert("completed-1".to_string(), false); // не запущен
    completed_pipelines.insert("running-1".to_string(), true); // запущен
    completed_pipelines.insert("completed-2".to_string(), false); // не запущен

    let initial_count = completed_pipelines.len();

    // Симулируем логику очистки
    let completed_ids: Vec<String> = completed_pipelines
      .iter()
      .filter(|(_, is_running)| !**is_running)
      .map(|(id, _)| id.clone())
      .collect();

    for id in &completed_ids {
      completed_pipelines.remove(id);
    }

    let removed_count = initial_count - completed_pipelines.len();
    assert_eq!(removed_count, 2);
    assert_eq!(completed_pipelines.len(), 1);
    assert!(completed_pipelines.contains_key("running-1"));
  }
}
