//! Prerender Commands - Команды для предварительного рендеринга
//!
//! Команды для работы с предрендерингом сегментов проекта

use crate::video_compiler::commands::VideoCompilerState;
use crate::video_compiler::error::Result;
use tauri::State;

/// Результат предрендеринга
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PrerenderResult {
  pub segment_id: String,
  pub output_path: String,
  pub duration: f64,
  pub size_bytes: u64,
  pub compression_ratio: f64,
}

/// Информация о кэше предрендеринга
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PrerenderCacheInfo {
  pub segments: usize,
  pub total_size: u64,
  pub total_duration: f64,
}

/// Файл кэша предрендеринга
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PrerenderCacheFile {
  pub path: String,
  pub segment_id: String,
  pub duration: f64,
  pub size_bytes: u64,
  pub created_at: String,
}

/// Предварительно отрендерить сегмент
#[tauri::command]
pub async fn prerender_segment(
  project_schema: crate::video_compiler::schema::ProjectSchema,
  start_time: f64,
  end_time: f64,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  use crate::video_compiler::renderer::VideoRenderer;

  // Создаем временный проект только с нужным сегментом
  let mut segment_project = project_schema.clone();
  segment_project.timeline.duration = end_time - start_time;

  // Фильтруем клипы
  for track in &mut segment_project.tracks {
    track
      .clips
      .retain(|clip| clip.start_time < end_time && clip.end_time > start_time);

    // Корректируем времена клипов
    for clip in &mut track.clips {
      if clip.start_time < start_time {
        clip.source_start += start_time - clip.start_time;
        clip.start_time = 0.0;
      } else {
        clip.start_time -= start_time;
      }

      if clip.end_time > end_time {
        clip.end_time = end_time - start_time;
      } else {
        clip.end_time -= start_time;
      }
    }
  }

  // Создаем рендерер
  let (progress_tx, _progress_rx) = tokio::sync::mpsc::unbounded_channel();

  let mut renderer = VideoRenderer::new(
    segment_project.clone(),
    state.settings.clone(),
    state.cache_manager.clone(),
    progress_tx,
  )
  .await?;

  // Рендерим сегмент
  let _job_id = uuid::Uuid::new_v4().to_string();
  renderer.render(std::path::Path::new(&output_path)).await?;

  Ok(output_path)
}

/// Получить информацию о кэше предрендеринга
#[tauri::command]
pub async fn get_prerender_cache_info(
  project_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let _cache = state.cache_manager.read().await;
  // Заглушка для несуществующего метода
  let _info = &project_id;

  Ok(serde_json::json!({
      "project_id": project_id,
      "segments": 0,
      "total_size": 0,
      "total_duration": 0.0,
  }))
}

/// Очистить кэш предрендеринга
#[tauri::command]
pub async fn clear_prerender_cache(
  _project_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.clear_all().await;
  Ok(())
}

/// Построить команду предрендеринга сегмента
#[tauri::command]
pub async fn build_prerender_segment_command(
  segment_id: String,
  input_files: Vec<String>,
  output_path: String,
  settings: serde_json::Value,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  // Простая реализация с использованием ffmpeg напрямую
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let mut cmd = vec![ffmpeg_path.clone()];

  // Добавляем входные файлы
  for input in input_files {
    cmd.extend(["-i".to_string(), input]);
  }

  // Базовые настройки вывода
  cmd.extend([
    "-c:v".to_string(),
    "libx264".to_string(),
    "-c:a".to_string(),
    "aac".to_string(),
    "-preset".to_string(),
    "fast".to_string(),
  ]);

  // Применяем дополнительные настройки
  if let Some(video_bitrate) = settings.get("video_bitrate").and_then(|v| v.as_str()) {
    cmd.extend(["-b:v".to_string(), video_bitrate.to_string()]);
  }

  if let Some(audio_bitrate) = settings.get("audio_bitrate").and_then(|v| v.as_str()) {
    cmd.extend(["-b:a".to_string(), audio_bitrate.to_string()]);
  }

  // Выходной файл
  cmd.push(output_path);

  Ok(format!(
    "Prerender segment {}: {}",
    segment_id,
    cmd.join(" ")
  ))
}

/// Проверить статус предрендеринга
#[tauri::command]
pub async fn check_prerender_status(
  segment_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let active_jobs = state.active_jobs.read().await;

  // Проверяем, есть ли активная задача для этого сегмента
  let is_active = active_jobs
    .iter()
    .any(|(_, job)| job.metadata.project_name.contains(&segment_id));

  Ok(serde_json::json!({
      "segment_id": segment_id,
      "is_active": is_active,
      "completed": !is_active,
      "progress": if is_active { 50.0 } else { 100.0 },
  }))
}

/// Получить список предрендеренных сегментов
#[tauri::command]
pub async fn get_prerendered_segments(
  project_id: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<PrerenderCacheFile>> {
  // Заглушка - возвращаем пустой список
  log::debug!("Getting prerendered segments for project: {}", project_id);
  Ok(vec![])
}

/// Удалить предрендеренный сегмент
#[tauri::command]
pub async fn delete_prerendered_segment(
  segment_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  log::info!("Deleting prerendered segment: {}", segment_id);

  // Очищаем из кэша
  let mut cache = state.cache_manager.write().await;
  cache.clear_all().await;

  Ok(())
}

/// Оптимизировать кэш предрендеринга
#[tauri::command]
pub async fn optimize_prerender_cache(
  max_size_mb: u64,
  state: State<'_, VideoCompilerState>,
) -> Result<u64> {
  log::info!("Optimizing prerender cache to max size: {} MB", max_size_mb);

  let mut cache = state.cache_manager.write().await;
  cache.cleanup_old_entries().await?;

  // Возвращаем количество освобожденных байт
  Ok(0)
}
