//! Продвинутые команды FFmpeg
//!
//! Команды для использования продвинутых функций FFmpeg,
//! включая создание превью, GIF, объединение видео и др.

use crate::video_compiler::ffmpeg_builder::FFmpegBuilder;
use crate::video_compiler::ffmpeg_executor::{
  check_ffmpeg_available, get_available_codecs, get_available_formats, FFmpegExecutor,
};
use crate::video_compiler::schema::ProjectSchema;
use std::path::{Path, PathBuf};
use tauri::Emitter;

#[tauri::command]
pub async fn generate_video_preview(
  input_path: String,
  output_path: String,
  duration: f64,
  resolution: Option<(u32, u32)>,
  bitrate: Option<u32>,
) -> Result<(), String> {
  log::debug!("Генерация превью видео: {} -> {}", input_path, output_path);

  let project = ProjectSchema::new("video_preview".to_string());
  let builder = FFmpegBuilder::new(project);

  let cmd = builder
    .build_video_preview_command(
      Path::new(&input_path),
      Path::new(&output_path),
      duration,
      resolution,
      bitrate,
    )
    .await
    .map_err(|e| format!("Ошибка создания команды превью: {}", e))?;

  let executor = FFmpegExecutor::new();
  executor
    .execute(cmd)
    .await
    .map_err(|e| format!("Ошибка выполнения команды превью: {}", e))?;

  Ok(())
}

#[tauri::command]
pub async fn generate_gif_preview(
  input_path: String,
  output_path: String,
  start_time: f64,
  duration: f64,
  fps: u32,
  resolution: Option<(u32, u32)>,
) -> Result<(), String> {
  log::debug!("Генерация GIF превью: {} -> {}", input_path, output_path);

  let project = ProjectSchema::new("gif_preview".to_string());
  let builder = FFmpegBuilder::new(project);

  let cmd = builder
    .build_gif_preview_command(
      Path::new(&input_path),
      Path::new(&output_path),
      start_time,
      duration,
      fps,
      resolution,
    )
    .await
    .map_err(|e| format!("Ошибка создания команды GIF: {}", e))?;

  let executor = FFmpegExecutor::new();
  executor
    .execute(cmd)
    .await
    .map_err(|e| format!("Ошибка выполнения команды GIF: {}", e))?;

  Ok(())
}

#[tauri::command]
pub async fn concat_videos(input_paths: Vec<String>, output_path: String) -> Result<(), String> {
  log::debug!("Объединение видео: {:?} -> {}", input_paths, output_path);

  let project = ProjectSchema::new("concat_videos".to_string());
  let builder = FFmpegBuilder::new(project);

  let paths: Vec<PathBuf> = input_paths.iter().map(PathBuf::from).collect();
  let cmd = builder
    .build_concat_command(&paths, Path::new(&output_path))
    .await
    .map_err(|e| format!("Ошибка создания команды объединения: {}", e))?;

  let executor = FFmpegExecutor::new();
  executor
    .execute(cmd)
    .await
    .map_err(|e| format!("Ошибка выполнения команды объединения: {}", e))?;

  Ok(())
}

#[tauri::command]
pub async fn apply_video_filter(
  input_path: String,
  output_path: String,
  filter_name: String,
  duration: Option<f64>,
) -> Result<(), String> {
  log::debug!(
    "Применение фильтра {} к видео: {} -> {}",
    filter_name,
    input_path,
    output_path
  );

  let project = ProjectSchema::new("filter_preview".to_string());
  let builder = FFmpegBuilder::new(project);

  let cmd = builder
    .build_filter_preview_command(
      Path::new(&input_path),
      Path::new(&output_path),
      &filter_name,
      duration,
    )
    .await
    .map_err(|e| format!("Ошибка создания команды фильтра: {}", e))?;

  let executor = FFmpegExecutor::new();
  executor
    .execute(cmd)
    .await
    .map_err(|e| format!("Ошибка выполнения команды фильтра: {}", e))?;

  Ok(())
}

#[tauri::command]
pub async fn probe_media_file(input_path: String) -> Result<serde_json::Value, String> {
  log::debug!("Анализ медиа файла: {}", input_path);

  let project = ProjectSchema::new("probe".to_string());
  let builder = FFmpegBuilder::new(project);

  let cmd = builder
    .build_probe_command(Path::new(&input_path))
    .await
    .map_err(|e| format!("Ошибка создания команды анализа: {}", e))?;

  let executor = FFmpegExecutor::new();
  let result = executor
    .execute(cmd)
    .await
    .map_err(|e| format!("Ошибка выполнения команды анализа: {}", e))?;

  // Парсим JSON вывод от ffprobe
  serde_json::from_str(&result.stdout)
    .map_err(|e| format!("Ошибка парсинга результата анализа: {}", e))
}

#[tauri::command]
pub async fn test_hardware_acceleration() -> Result<Vec<String>, String> {
  log::debug!("Тестирование аппаратного ускорения");

  let project = ProjectSchema::new("hwaccel_test".to_string());
  let builder = FFmpegBuilder::new(project);

  let cmd = builder
    .build_hwaccel_test_command()
    .await
    .map_err(|e| format!("Ошибка создания команды теста: {}", e))?;

  let executor = FFmpegExecutor::new();
  let result = executor
    .execute(cmd)
    .await
    .map_err(|e| format!("Ошибка выполнения команды теста: {}", e))?;

  // Парсим доступные кодеры из вывода
  let encoders: Vec<String> = result
    .stdout
    .lines()
    .filter(|line| {
      line.contains("_nvenc") || line.contains("_videotoolbox") || line.contains("_vaapi")
    })
    .map(|line| line.trim().to_string())
    .collect();

  Ok(encoders)
}

#[tauri::command]
pub async fn generate_subtitle_preview(
  video_path: String,
  subtitle_path: String,
  output_path: String,
  start_time: Option<f64>,
) -> Result<(), String> {
  log::debug!(
    "Генерация превью с субтитрами: {} + {} -> {}",
    video_path,
    subtitle_path,
    output_path
  );

  let project = ProjectSchema::new("subtitle_preview".to_string());
  let builder = FFmpegBuilder::new(project);

  let cmd = builder
    .build_subtitle_preview_command(
      Path::new(&video_path),
      Path::new(&subtitle_path),
      Path::new(&output_path),
      start_time.unwrap_or(0.0),
    )
    .await
    .map_err(|e| format!("Ошибка создания команды субтитров: {}", e))?;

  let executor = FFmpegExecutor::new();
  executor
    .execute(cmd)
    .await
    .map_err(|e| format!("Ошибка выполнения команды субтитров: {}", e))?;

  Ok(())
}

#[tauri::command]
pub async fn check_ffmpeg_installation() -> Result<String, String> {
  log::debug!("Проверка установки FFmpeg");

  check_ffmpeg_available("ffmpeg")
    .await
    .map_err(|e| format!("FFmpeg не найден: {}", e))
}

#[tauri::command]
pub async fn get_ffmpeg_codecs() -> Result<Vec<String>, String> {
  log::debug!("Получение списка поддерживаемых кодеков");

  get_available_codecs("ffmpeg")
    .await
    .map_err(|e| format!("Ошибка получения кодеков: {}", e))
}

#[tauri::command]
pub async fn get_ffmpeg_formats() -> Result<Vec<String>, String> {
  log::debug!("Получение списка поддерживаемых форматов");

  get_available_formats("ffmpeg")
    .await
    .map_err(|e| format!("Ошибка получения форматов: {}", e))
}

// Команды для использования FFmpegExecutor с прогрессом

use crate::video_compiler::progress::ProgressUpdate;
use tokio::sync::mpsc;

#[tauri::command]
pub async fn execute_ffmpeg_with_progress(
  command_args: Vec<String>,
  app_handle: tauri::AppHandle,
) -> Result<String, String> {
  log::debug!(
    "Выполнение FFmpeg с отслеживанием прогресса: {:?}",
    command_args
  );

  let (tx, mut rx) = mpsc::channel(100);
  let executor = FFmpegExecutor::with_progress(tx);

  // Создаем команду из аргументов
  let mut cmd = tokio::process::Command::new("ffmpeg");
  cmd.args(&command_args);

  // Запускаем выполнение в отдельной задаче
  let handle = tokio::spawn(async move { executor.execute(cmd).await });

  // Отправляем обновления прогресса в frontend
  tokio::spawn(async move {
    while let Some(update) = rx.recv().await {
      match update {
        ProgressUpdate::JobStarted { job_id } => {
          let _ = app_handle.emit(
            "ffmpeg-progress",
            serde_json::json!({
              "type": "started",
              "jobId": job_id
            }),
          );
        }
        ProgressUpdate::ProgressChanged { job_id, progress } => {
          let _ = app_handle.emit(
            "ffmpeg-progress",
            serde_json::json!({
              "type": "progress",
              "jobId": job_id,
              "progress": {
                "percentage": progress.percentage,
                "currentFrame": progress.current_frame,
                "totalFrames": progress.total_frames,
                "elapsedTime": progress.elapsed_time.as_secs(),
                "message": progress.message
              }
            }),
          );
        }
        ProgressUpdate::JobCompleted {
          job_id,
          output_path,
          duration,
        } => {
          let _ = app_handle.emit(
            "ffmpeg-progress",
            serde_json::json!({
              "type": "completed",
              "jobId": job_id,
              "outputPath": output_path,
              "duration": duration.as_secs_f64()
            }),
          );
        }
        ProgressUpdate::JobFailed {
          job_id,
          error,
          duration,
        } => {
          let _ = app_handle.emit(
            "ffmpeg-progress",
            serde_json::json!({
              "type": "failed",
              "jobId": job_id,
              "error": error,
              "duration": duration.as_secs_f64()
            }),
          );
        }
        ProgressUpdate::JobCancelled { job_id } => {
          let _ = app_handle.emit(
            "ffmpeg-progress",
            serde_json::json!({
              "type": "cancelled",
              "jobId": job_id
            }),
          );
        }
      }
    }
  });

  // Ждем завершения
  let result = handle
    .await
    .map_err(|e| format!("Ошибка выполнения задачи: {}", e))?;

  match result {
    Ok(execution_result) => {
      if execution_result.exit_code == 0 {
        Ok(execution_result.stdout)
      } else {
        Err(format!(
          "FFmpeg завершился с кодом {}: {}",
          execution_result.exit_code, execution_result.stderr
        ))
      }
    }
    Err(e) => Err(format!("Ошибка выполнения FFmpeg: {}", e)),
  }
}

#[tauri::command]
pub async fn execute_ffmpeg_simple(command_args: Vec<String>) -> Result<Vec<u8>, String> {
  log::debug!("Простое выполнение FFmpeg: {:?}", command_args);

  let executor = FFmpegExecutor::new();

  // Создаем команду из аргументов
  let mut cmd = tokio::process::Command::new("ffmpeg");
  cmd.args(&command_args);

  executor
    .execute_simple(cmd)
    .await
    .map_err(|e| format!("Ошибка выполнения FFmpeg: {}", e))
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_command_signatures() {
    // Проверяем что команды корректно определены
    let _ = generate_video_preview;
    let _ = generate_gif_preview;
    let _ = concat_videos;
    let _ = apply_video_filter;
    let _ = probe_media_file;
    let _ = test_hardware_acceleration;
    let _ = generate_subtitle_preview;
    let _ = check_ffmpeg_installation;
    let _ = get_ffmpeg_codecs;
    let _ = get_ffmpeg_formats;
    let _ = execute_ffmpeg_with_progress;
    let _ = execute_ffmpeg_simple;
  }
}
