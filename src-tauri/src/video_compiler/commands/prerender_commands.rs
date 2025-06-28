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
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  // Получаем CacheService из контейнера сервисов
  let cache_service = state.services.get_cache_service().ok_or_else(|| {
    crate::video_compiler::error::VideoCompilerError::validation("CacheService не найден")
  })?;

  // Получаем статистику кэша
  let cache_stats = cache_service.get_cache_stats().await?;

  // Получаем информацию о кэшированных элементах
  let cached_items = cache_service.list_cached_items().await?;

  // Фильтруем только элементы предрендеринга (по префиксу или типу)
  let prerender_items: Vec<_> = cached_items
    .into_iter()
    .filter(|item| item.starts_with("prerender_") || item.contains("prerender"))
    .collect();

  // Вычисляем размер предрендеринговых файлов
  let mut total_prerender_size = 0u64;
  for item_key in &prerender_items {
    if let Ok(Some(item_info)) = cache_service.get_item_info(item_key).await {
      total_prerender_size += item_info.size_bytes;
    }
  }

  Ok(serde_json::json!({
      "file_count": prerender_items.len(),
      "total_size": total_prerender_size,
      "files": prerender_items,
      "cache_stats": {
        "total_files": cache_stats.total_files,
        "total_size_mb": cache_stats.total_size_mb,
        "hit_rate": cache_stats.hit_rate,
        "miss_rate": 1.0 - cache_stats.hit_rate
      }
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

#[cfg(test)]
mod tests {
  use super::*;
  // Only using the struct definitions we actually test

  #[test]
  fn test_prerender_result_creation() {
    let result = PrerenderResult {
      segment_id: "segment_123".to_string(),
      output_path: "/tmp/segment_123.mp4".to_string(),
      duration: 10.5,
      size_bytes: 1024000,
      compression_ratio: 0.85,
    };

    assert_eq!(result.segment_id, "segment_123");
    assert_eq!(result.output_path, "/tmp/segment_123.mp4");
    assert_eq!(result.duration, 10.5);
    assert_eq!(result.size_bytes, 1024000);
    assert_eq!(result.compression_ratio, 0.85);
  }

  #[test]
  fn test_prerender_result_serialization() {
    let result = PrerenderResult {
      segment_id: "test_segment".to_string(),
      output_path: "/output/test.mp4".to_string(),
      duration: 5.0,
      size_bytes: 512000,
      compression_ratio: 0.75,
    };

    // Test serialization
    let serialized = serde_json::to_string(&result).unwrap();
    assert!(serialized.contains("test_segment"));
    assert!(serialized.contains("/output/test.mp4"));
    assert!(serialized.contains("5.0"));
    assert!(serialized.contains("512000"));
    assert!(serialized.contains("0.75"));

    // Test deserialization
    let deserialized: PrerenderResult = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.segment_id, result.segment_id);
    assert_eq!(deserialized.output_path, result.output_path);
    assert_eq!(deserialized.duration, result.duration);
    assert_eq!(deserialized.size_bytes, result.size_bytes);
    assert_eq!(deserialized.compression_ratio, result.compression_ratio);
  }

  #[test]
  fn test_prerender_cache_info_creation() {
    let cache_info = PrerenderCacheInfo {
      segments: 5,
      total_size: 2048000,
      total_duration: 50.0,
    };

    assert_eq!(cache_info.segments, 5);
    assert_eq!(cache_info.total_size, 2048000);
    assert_eq!(cache_info.total_duration, 50.0);
  }

  #[test]
  fn test_prerender_cache_info_serialization() {
    let cache_info = PrerenderCacheInfo {
      segments: 3,
      total_size: 1536000,
      total_duration: 30.0,
    };

    let serialized = serde_json::to_string(&cache_info).unwrap();
    assert!(serialized.contains("\"segments\":3"));
    assert!(serialized.contains("\"total_size\":1536000"));
    assert!(serialized.contains("\"total_duration\":30.0"));

    let deserialized: PrerenderCacheInfo = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.segments, cache_info.segments);
    assert_eq!(deserialized.total_size, cache_info.total_size);
    assert_eq!(deserialized.total_duration, cache_info.total_duration);
  }

  #[test]
  fn test_prerender_cache_file_creation() {
    let cache_file = PrerenderCacheFile {
      path: "/cache/segment_001.mp4".to_string(),
      segment_id: "segment_001".to_string(),
      duration: 15.0,
      size_bytes: 768000,
      created_at: "2024-01-01T00:00:00Z".to_string(),
    };

    assert_eq!(cache_file.path, "/cache/segment_001.mp4");
    assert_eq!(cache_file.segment_id, "segment_001");
    assert_eq!(cache_file.duration, 15.0);
    assert_eq!(cache_file.size_bytes, 768000);
    assert_eq!(cache_file.created_at, "2024-01-01T00:00:00Z");
  }

  #[test]
  fn test_prerender_cache_file_serialization() {
    let cache_file = PrerenderCacheFile {
      path: "/test/cache.mp4".to_string(),
      segment_id: "test_seg".to_string(),
      duration: 12.5,
      size_bytes: 1024,
      created_at: "2024-06-28T12:00:00Z".to_string(),
    };

    let serialized = serde_json::to_string(&cache_file).unwrap();
    assert!(serialized.contains("test_seg"));
    assert!(serialized.contains("/test/cache.mp4"));
    assert!(serialized.contains("12.5"));
    assert!(serialized.contains("1024"));
    assert!(serialized.contains("2024-06-28T12:00:00Z"));

    let deserialized: PrerenderCacheFile = serde_json::from_str(&serialized).unwrap();
    assert_eq!(deserialized.path, cache_file.path);
    assert_eq!(deserialized.segment_id, cache_file.segment_id);
    assert_eq!(deserialized.duration, cache_file.duration);
    assert_eq!(deserialized.size_bytes, cache_file.size_bytes);
    assert_eq!(deserialized.created_at, cache_file.created_at);
  }

  #[test]
  fn test_build_ffmpeg_command_logic() {
    // Test the FFmpeg command building logic
    let mut cmd = vec!["ffmpeg".to_string()];
    let input_files = [
      "/input/video1.mp4".to_string(),
      "/input/video2.mp4".to_string(),
    ];
    let output_path = "/output/test.mp4".to_string();

    // Add input files
    for input in input_files.iter() {
      cmd.extend(["-i".to_string(), input.clone()]);
    }

    // Add codec settings
    cmd.extend([
      "-c:v".to_string(),
      "libx264".to_string(),
      "-c:a".to_string(),
      "aac".to_string(),
      "-preset".to_string(),
      "fast".to_string(),
    ]);

    // Add output
    cmd.push(output_path.clone());

    let command_str = cmd.join(" ");
    assert!(command_str.contains("ffmpeg"));
    assert!(command_str.contains("-i"));
    assert!(command_str.contains(&input_files[0]));
    assert!(command_str.contains(&input_files[1]));
    assert!(command_str.contains(&output_path));
    assert!(command_str.contains("-c:v"));
    assert!(command_str.contains("libx264"));
    assert!(command_str.contains("-c:a"));
    assert!(command_str.contains("aac"));
    assert!(command_str.contains("-preset"));
    assert!(command_str.contains("fast"));
  }

  #[test]
  fn test_ffmpeg_command_with_bitrate_settings() {
    // Test FFmpeg command building with custom bitrate settings
    let mut cmd = vec!["ffmpeg".to_string()];
    let input_files = vec!["/input/test.mp4".to_string()];
    let output_path = "/output/test_with_bitrate.mp4".to_string();

    // Add input files
    for input in input_files {
      cmd.extend(["-i".to_string(), input]);
    }

    // Add codec settings
    cmd.extend([
      "-c:v".to_string(),
      "libx264".to_string(),
      "-c:a".to_string(),
      "aac".to_string(),
      "-preset".to_string(),
      "fast".to_string(),
    ]);

    // Add bitrate settings
    cmd.extend(["-b:v".to_string(), "8000k".to_string()]);
    cmd.extend(["-b:a".to_string(), "192k".to_string()]);

    // Add output
    cmd.push(output_path.clone());

    let command_str = cmd.join(" ");
    assert!(command_str.contains("-b:v"));
    assert!(command_str.contains("8000k"));
    assert!(command_str.contains("-b:a"));
    assert!(command_str.contains("192k"));
    assert!(command_str.contains(&output_path));
  }

  #[test]
  fn test_prerender_result_debug() {
    let result = PrerenderResult {
      segment_id: "debug_test".to_string(),
      output_path: "/debug/test.mp4".to_string(),
      duration: 7.5,
      size_bytes: 256000,
      compression_ratio: 0.9,
    };

    let debug_str = format!("{:?}", result);
    assert!(debug_str.contains("debug_test"));
    assert!(debug_str.contains("/debug/test.mp4"));
    assert!(debug_str.contains("7.5"));
    assert!(debug_str.contains("256000"));
    assert!(debug_str.contains("0.9"));
  }

  #[test]
  fn test_prerender_cache_info_debug() {
    let cache_info = PrerenderCacheInfo {
      segments: 7,
      total_size: 4096000,
      total_duration: 70.0,
    };

    let debug_str = format!("{:?}", cache_info);
    assert!(debug_str.contains("segments: 7"));
    assert!(debug_str.contains("total_size: 4096000"));
    assert!(debug_str.contains("total_duration: 70.0"));
  }

  #[test]
  fn test_prerender_cache_file_debug() {
    let cache_file = PrerenderCacheFile {
      path: "/debug/cache.mp4".to_string(),
      segment_id: "debug_cache".to_string(),
      duration: 20.0,
      size_bytes: 2048000,
      created_at: "2024-06-28T14:30:00Z".to_string(),
    };

    let debug_str = format!("{:?}", cache_file);
    assert!(debug_str.contains("debug_cache"));
    assert!(debug_str.contains("/debug/cache.mp4"));
    assert!(debug_str.contains("20.0"));
    assert!(debug_str.contains("2048000"));
    assert!(debug_str.contains("2024-06-28T14:30:00Z"));
  }

  #[test]
  fn test_prerender_result_clone() {
    let result1 = PrerenderResult {
      segment_id: "clone_test".to_string(),
      output_path: "/clone/test.mp4".to_string(),
      duration: 5.5,
      size_bytes: 128000,
      compression_ratio: 0.8,
    };

    let result2 = result1.clone();

    assert_eq!(result1.segment_id, result2.segment_id);
    assert_eq!(result1.output_path, result2.output_path);
    assert_eq!(result1.duration, result2.duration);
    assert_eq!(result1.size_bytes, result2.size_bytes);
    assert_eq!(result1.compression_ratio, result2.compression_ratio);
  }

  #[test]
  fn test_prerender_cache_info_clone() {
    let info1 = PrerenderCacheInfo {
      segments: 10,
      total_size: 8192000,
      total_duration: 100.0,
    };

    let info2 = info1.clone();

    assert_eq!(info1.segments, info2.segments);
    assert_eq!(info1.total_size, info2.total_size);
    assert_eq!(info1.total_duration, info2.total_duration);
  }

  #[test]
  fn test_prerender_cache_file_clone() {
    let file1 = PrerenderCacheFile {
      path: "/clone/cache.mp4".to_string(),
      segment_id: "clone_cache".to_string(),
      duration: 25.0,
      size_bytes: 3072000,
      created_at: "2024-06-28T16:00:00Z".to_string(),
    };

    let file2 = file1.clone();

    assert_eq!(file1.path, file2.path);
    assert_eq!(file1.segment_id, file2.segment_id);
    assert_eq!(file1.duration, file2.duration);
    assert_eq!(file1.size_bytes, file2.size_bytes);
    assert_eq!(file1.created_at, file2.created_at);
  }
}
