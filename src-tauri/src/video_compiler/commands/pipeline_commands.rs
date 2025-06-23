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
  }
}
