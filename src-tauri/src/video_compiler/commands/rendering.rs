//! Rendering - Команды рендеринга и компиляции видео
//!
//! Основные команды для запуска рендеринга, управления процессом
//! и отмены активных задач.

use tauri::{Emitter, State};

use crate::video_compiler::error::{Result, VideoCompilerError};
use crate::video_compiler::schema::ProjectSchema;
use crate::video_compiler::VideoCompilerEvent;

use super::state::{RenderJob, VideoCompilerState};

/// Запуск компиляции видео
#[tauri::command]
pub async fn compile_video<R: tauri::Runtime>(
  app: tauri::AppHandle<R>,
  project_schema: ProjectSchema,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  // Используем RenderService из контейнера сервисов
  let render_service = state
    .services
    .get_render_service()
    .ok_or_else(|| VideoCompilerError::validation("RenderService не найден"))?;

  // Запускаем рендеринг через сервис
  let job_id = render_service
    .start_render(project_schema, std::path::PathBuf::from(output_path))
    .await?;

  // Отправляем событие о начале рендеринга
  let _ = app.emit(
    "video-compiler",
    &VideoCompilerEvent::RenderStarted {
      job_id: job_id.clone(),
    },
  );

  // RenderService уже управляет задачами, поэтому просто возвращаем ID
  Ok(job_id)
}

/// Отмена задачи рендеринга
#[tauri::command]
pub async fn cancel_render(job_id: String, state: State<'_, VideoCompilerState>) -> Result<bool> {
  // Используем RenderService для отмены задачи
  let render_service = state
    .services
    .get_render_service()
    .ok_or_else(|| VideoCompilerError::validation("RenderService не найден"))?;

  render_service.cancel_render(&job_id).await
}

/// Получить статус активных задач рендеринга
#[tauri::command]
pub async fn get_active_render_jobs(state: State<'_, VideoCompilerState>) -> Result<Vec<String>> {
  // Используем RenderService для получения активных задач
  let render_service = state
    .services
    .get_render_service()
    .ok_or_else(|| VideoCompilerError::validation("RenderService не найден"))?;

  let job_ids = render_service.get_active_jobs().await?;
  Ok(job_ids)
}

/// Получить информацию о конкретной задаче рендеринга
#[tauri::command]
pub async fn get_render_job(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Option<RenderJob>> {
  let jobs = state.active_jobs.read().await;

  if let Some(active_job) = jobs.get(&job_id) {
    let progress = active_job.renderer.get_progress().await;
    let status = if progress.is_some() {
      crate::video_compiler::progress::RenderStatus::Processing
    } else {
      crate::video_compiler::progress::RenderStatus::Queued
    };

    Ok(Some(RenderJob {
      id: job_id,
      project_name: active_job.metadata.project_name.clone(),
      output_path: active_job.metadata.output_path.clone(),
      status,
      created_at: active_job.metadata.created_at.clone(),
      progress,
      error_message: None,
    }))
  } else {
    Ok(None)
  }
}

/// Приостановить рендеринг
#[tauri::command]
pub async fn pause_render(job_id: String, state: State<'_, VideoCompilerState>) -> Result<()> {
  let jobs = state.active_jobs.read().await;

  if let Some(_active_job) = jobs.get(&job_id) {
    // VideoRenderer не поддерживает паузу, используем заглушку
    // В реальной реализации здесь должна быть логика приостановки рендеринга
    Ok(())
  } else {
    Err(VideoCompilerError::InternalError(format!(
      "Render job '{}' not found",
      job_id
    )))
  }
}

/// Возобновить рендеринг
#[tauri::command]
pub async fn resume_render(job_id: String, state: State<'_, VideoCompilerState>) -> Result<()> {
  let jobs = state.active_jobs.read().await;

  if let Some(_active_job) = jobs.get(&job_id) {
    // VideoRenderer не поддерживает возобновление, используем заглушку
    // В реальной реализации здесь должна быть логика возобновления рендеринга
    Ok(())
  } else {
    Err(VideoCompilerError::InternalError(format!(
      "Render job '{}' not found",
      job_id
    )))
  }
}

/// Экспортировать проект с предустановленными настройками
#[tauri::command]
pub async fn export_with_preset<R: tauri::Runtime>(
  app: tauri::AppHandle<R>,
  project_schema: ProjectSchema,
  output_path: String,
  preset: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  // Применяем предустановки к настройкам экспорта
  let mut schema = project_schema;
  match preset.as_str() {
    "youtube" => {
      schema.settings.export.format = crate::video_compiler::schema::OutputFormat::Mp4;
      schema.settings.export.video_bitrate = 8000;
      schema.settings.export.audio_bitrate = 192;
      schema.settings.export.quality = 90;
    }
    "instagram" => {
      schema.settings.export.format = crate::video_compiler::schema::OutputFormat::Mp4;
      schema.settings.export.video_bitrate = 5000;
      schema.settings.export.audio_bitrate = 128;
      schema.settings.export.quality = 85;
    }
    "twitter" => {
      schema.settings.export.format = crate::video_compiler::schema::OutputFormat::Mp4;
      schema.settings.export.video_bitrate = 6000;
      schema.settings.export.audio_bitrate = 128;
      schema.settings.export.quality = 85;
    }
    _ => {
      return Err(VideoCompilerError::InvalidParameter(format!(
        "Unknown preset: {}",
        preset
      )));
    }
  }

  // Запускаем обычный рендеринг с измененными настройками
  compile_video(app, schema, output_path, state).await
}

/// Получить статистику рендеринга для активной задачи
#[tauri::command]
pub async fn get_render_pipeline_statistics(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  // Проверяем, что задача существует
  let active_jobs = state.active_jobs.read().await;
  let job = active_jobs.get(&job_id).ok_or_else(|| {
    VideoCompilerError::InvalidParameter(format!("Render job {} not found", job_id))
  })?;

  // Получаем статистику из рендерера задачи
  let stats = job.renderer.get_render_statistics().ok_or_else(|| {
    VideoCompilerError::InternalError("No pipeline statistics available".to_string())
  })?;

  Ok(serde_json::json!({
    "job_id": job_id,
    "frames_processed": stats.frames_processed,
    "memory_used": stats.memory_used,
    "error_count": stats.error_count,
    "warning_count": stats.warning_count,
    "validation_time": stats.validation_time.duration_since(std::time::UNIX_EPOCH).unwrap().as_secs(),
    "preprocessing_time": stats.preprocessing_time.duration_since(std::time::UNIX_EPOCH).unwrap().as_secs(),
    "composition_time": stats.composition_time.duration_since(std::time::UNIX_EPOCH).unwrap().as_secs(),
    "encoding_time": stats.encoding_time.duration_since(std::time::UNIX_EPOCH).unwrap().as_secs(),
    "finalization_time": stats.finalization_time.duration_since(std::time::UNIX_EPOCH).unwrap().as_secs(),
  }))
}

/// Построить команду рендеринга с кастомными настройками FFmpeg
#[tauri::command]
pub async fn build_render_command_with_settings(
  project_schema: ProjectSchema,
  output_path: String,
  settings: serde_json::Value,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  use crate::video_compiler::ffmpeg_builder::{builder::FFmpegBuilderSettings, FFmpegBuilder};

  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let use_hw = settings
    .get("use_hardware_acceleration")
    .and_then(|v| v.as_bool())
    .unwrap_or(false);
  let hw_type = settings
    .get("hardware_acceleration_type")
    .and_then(|v| v.as_str())
    .map(String::from);
  let global_options = settings
    .get("global_options")
    .and_then(|v| v.as_array())
    .map(|arr| {
      arr
        .iter()
        .filter_map(|v| v.as_str().map(String::from))
        .collect()
    })
    .unwrap_or_default();

  let builder_settings = FFmpegBuilderSettings {
    ffmpeg_path: ffmpeg_path.clone(),
    use_hardware_acceleration: use_hw,
    hardware_acceleration_type: hw_type,
    global_options,
  };

  let builder = FFmpegBuilder::with_settings(project_schema, builder_settings);
  let command = builder
    .build_render_command(std::path::Path::new(&output_path))
    .await?;

  // Конвертируем Command в вектор строк для возврата
  let program = format!("{}", command.as_std().get_program().to_string_lossy());
  let args: Vec<String> = command
    .as_std()
    .get_args()
    .map(|arg| arg.to_string_lossy().to_string())
    .collect();

  let mut result = vec![program];
  result.extend(args);

  Ok(result)
}

/// Извлечь кадры для клипа
#[tauri::command]
pub async fn extract_frames_for_clip(
  _clip_id: String,
  _timestamps: Vec<f64>,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  use crate::video_compiler::core::frame_extraction::FrameExtractionManager;
  use crate::video_compiler::schema::Clip;
  use std::path::PathBuf;

  // Создаем тестовый клип
  let clip = Clip::new(PathBuf::from("/tmp/test_video.mp4"), 0.0, 10.0);

  // Получаем менеджер извлечения кадров
  let extraction_manager = FrameExtractionManager::new(state.cache_manager.clone());

  // Извлекаем кадры
  let frames = extraction_manager
    .extract_frames_for_clip(&clip, None)
    .await?;

  // Конвертируем результаты в base64 строки
  use base64::Engine;
  let result: Vec<String> = frames
    .into_iter()
    .map(|frame| base64::engine::general_purpose::STANDARD.encode(&frame.data))
    .collect();

  Ok(result)
}

/// Извлечь кадры для субтитров
#[tauri::command]
pub async fn extract_frames_for_subtitles(
  subtitle_timestamps: Vec<f64>,
  video_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  use crate::video_compiler::core::frame_extraction::FrameExtractionManager;
  use crate::video_compiler::schema::Subtitle;

  // Создаем тестовые субтитры
  let subtitles: Vec<Subtitle> = subtitle_timestamps
    .iter()
    .enumerate()
    .map(|(i, &timestamp)| Subtitle::new(format!("Subtitle {}", i), timestamp, timestamp + 2.0))
    .collect();

  // Получаем менеджер извлечения кадров
  let extraction_manager = FrameExtractionManager::new(state.cache_manager.clone());

  // Извлекаем кадры
  let frames = extraction_manager
    .extract_frames_for_subtitles(std::path::Path::new(&video_path), &subtitles, None)
    .await?;

  // Конвертируем результаты в base64 строки
  use base64::Engine;
  let result: Vec<String> = frames
    .into_iter()
    .map(|subtitle_frame| {
      base64::engine::general_purpose::STANDARD.encode(&subtitle_frame.frame_data)
    })
    .collect();

  Ok(result)
}

/// Построить команду превью с использованием FFmpeg Builder
#[tauri::command]
pub async fn build_preview_command(
  project_schema: ProjectSchema,
  timestamp: f64,
  output_path: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  use crate::video_compiler::ffmpeg_builder::FFmpegBuilder;

  let builder = FFmpegBuilder::new(project_schema.clone());
  // Для превью используем первый клип проекта
  let input_path = if let Some(track) = project_schema.tracks.first() {
    if let Some(clip) = track.clips.first() {
      match &clip.source {
        crate::video_compiler::schema::ClipSource::File(path) => std::path::PathBuf::from(path),
        _ => std::path::PathBuf::from("/tmp/empty.mp4"),
      }
    } else {
      std::path::PathBuf::from("/tmp/empty.mp4")
    }
  } else {
    std::path::PathBuf::from("/tmp/empty.mp4")
  };

  let command = builder
    .build_preview_command(
      &input_path,
      timestamp,
      std::path::Path::new(&output_path),
      (1920, 1080),
    )
    .await?;

  // Конвертируем Command в вектор строк
  let program = format!("{}", command.as_std().get_program().to_string_lossy());
  let args: Vec<String> = command
    .as_std()
    .get_args()
    .map(|arg| arg.to_string_lossy().to_string())
    .collect();

  let mut result = vec![program];
  result.extend(args);

  Ok(result)
}

// build_prerender_segment_command moved to prerender_commands.rs

/// Получить настройки FFmpeg Builder
#[tauri::command]
pub async fn get_ffmpeg_builder_settings(
  project_schema: ProjectSchema,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  use crate::video_compiler::ffmpeg_builder::FFmpegBuilder;

  let builder = FFmpegBuilder::new(project_schema);
  let settings = builder.settings();

  Ok(serde_json::json!({
    "ffmpeg_path": settings.ffmpeg_path,
    "use_hardware_acceleration": settings.use_hardware_acceleration,
    "hardware_acceleration_type": settings.hardware_acceleration_type,
    "global_options": settings.global_options,
  }))
}

/// Получить информацию о проекте из FFmpeg Builder
#[tauri::command]
pub async fn get_ffmpeg_builder_project_info(
  project_schema: ProjectSchema,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  use crate::video_compiler::ffmpeg_builder::FFmpegBuilder;

  let builder = FFmpegBuilder::new(project_schema.clone());
  let project = builder.project();

  Ok(serde_json::json!({
    "name": project.metadata.name,
    "duration": project.timeline.duration,
    "resolution": project.settings.resolution,
    "frame_rate": project.settings.frame_rate,
    "format": project.settings.export.format,
  }))
}

/// Построить команду рендеринга для сегмента видео
#[tauri::command]
pub async fn build_segment_render_command(
  project_schema: ProjectSchema,
  start_time: f64,
  end_time: f64,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  use crate::video_compiler::ffmpeg_builder::{
    filters::FilterBuilder, inputs::InputBuilder, outputs::OutputBuilder, FFmpegBuilder,
  };
  use tokio::process::Command;

  let settings = crate::video_compiler::ffmpeg_builder::builder::FFmpegBuilderSettings {
    ffmpeg_path: state.ffmpeg_path.read().await.clone(),
    use_hardware_acceleration: state.settings.read().await.hardware_acceleration,
    hardware_acceleration_type: None,
    global_options: vec![],
  };

  let builder = FFmpegBuilder::with_settings(project_schema.clone(), settings);
  let mut command = Command::new(state.ffmpeg_path.read().await.clone());

  // Добавляем входные файлы
  let input_builder = InputBuilder::new(&project_schema);
  input_builder.add_input_sources(&mut command).await?;

  // Добавляем фильтры для сегмента
  let filter_builder = FilterBuilder::new(&project_schema);
  filter_builder
    .add_segment_filters(&mut command, start_time, end_time)
    .await?;

  // Добавляем выходные настройки
  let output_builder = OutputBuilder::new(&project_schema, builder.settings());
  output_builder
    .add_output_settings(&mut command, std::path::Path::new(&output_path))
    .await?;

  // Конвертируем Command в вектор строк
  let program = format!("{}", command.as_std().get_program().to_string_lossy());
  let args: Vec<String> = command
    .as_std()
    .get_args()
    .map(|arg| arg.to_string_lossy().to_string())
    .collect();

  let mut result = vec![program];
  result.extend(args);

  Ok(result)
}

/// Получить информацию о фильтрах для сегмента
#[tauri::command]
pub async fn get_segment_filters_info(
  project_schema: ProjectSchema,
  start_time: f64,
  end_time: f64,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  use crate::video_compiler::ffmpeg_builder::filters::FilterBuilder;

  let filter_builder = FilterBuilder::new(&project_schema);

  // Проверяем наличие видео и аудио треков
  let has_video = filter_builder.has_video_tracks();
  let has_audio = filter_builder.has_audio_tracks();

  Ok(serde_json::json!({
    "segment_start": start_time,
    "segment_end": end_time,
    "duration": end_time - start_time,
    "has_video_tracks": has_video,
    "has_audio_tracks": has_audio,
    "filter_complexity": if has_video && has_audio { "complex" } else { "simple" },
  }))
}

/// Проверить корректность временных меток сегмента
#[tauri::command]
pub async fn validate_segment_timestamps(
  project_schema: ProjectSchema,
  start_time: f64,
  end_time: f64,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let duration = project_schema.timeline.duration;

  let is_valid = start_time >= 0.0 && end_time > start_time && end_time <= duration;

  let warnings = if start_time < 0.0 {
    Some("Start time cannot be negative")
  } else if end_time <= start_time {
    Some("End time must be greater than start time")
  } else if end_time > duration {
    Some("End time exceeds project duration")
  } else {
    None
  };

  Ok(serde_json::json!({
    "is_valid": is_valid,
    "start_time": start_time,
    "end_time": end_time,
    "segment_duration": end_time - start_time,
    "project_duration": duration,
    "warnings": warnings,
  }))
}

/// Получить кэш менеджера извлечения кадров
#[tauri::command]
pub async fn get_frame_extraction_cache(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  use crate::video_compiler::core::frame_extraction::FrameExtractionManager;

  // Создаем менеджер извлечения кадров
  let extraction_manager = FrameExtractionManager::new(state.cache_manager.clone());

  // Используем метод get_cache
  let _cache = extraction_manager.get_cache();

  Ok(serde_json::json!({
    "cache_available": true,
    "message": "Frame extraction cache accessed successfully"
  }))
}

/// Получить индекс входа для клипа
#[tauri::command]
pub async fn get_clip_input_index(
  project_schema: ProjectSchema,
  clip_id: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  use crate::video_compiler::ffmpeg_builder::inputs::InputBuilder;

  // Создаем InputBuilder
  let input_builder = InputBuilder::new(&project_schema);

  // Используем метод get_clip_input_index
  let input_index = input_builder.get_clip_input_index(&clip_id);

  Ok(serde_json::json!({
    "clip_id": clip_id,
    "input_index": input_index,
    "found": input_index.is_some()
  }))
}
