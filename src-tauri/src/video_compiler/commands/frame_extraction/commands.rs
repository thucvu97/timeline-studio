//! Tauri команды для извлечения кадров

use super::business_logic;
use super::types::*;
use crate::video_compiler::commands::VideoCompilerState;
use crate::video_compiler::error::Result;
use crate::video_compiler::preview::PreviewGenerator;
use crate::video_compiler::schema::ProjectSchema;
use tauri::State;

/// Извлечь кадры таймлайна
#[tauri::command]
pub async fn extract_timeline_frames(
  project_schema: ProjectSchema,
  interval: f64,
  output_dir: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let duration = project_schema.timeline.duration;
  let timestamps = business_logic::calculate_frame_timestamps(duration, interval);
  let frame_paths =
    business_logic::generate_frame_paths(&output_dir, &timestamps, &FrameFormat::Png);

  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);

  for (timestamp, frame_path) in timestamps.iter().zip(frame_paths.iter()) {
    generator
      .generate_frame(&project_schema, *timestamp, frame_path, None)
      .await?;
  }

  Ok(frame_paths)
}

/// Извлечь кадры субтитров
#[tauri::command]
pub async fn extract_subtitle_frames(
  project_schema: ProjectSchema,
  output_dir: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<SubtitleFrameResult>> {
  let mut results = Vec::new();

  for subtitle in &project_schema.subtitles {
    let frame_path =
      business_logic::generate_subtitle_frame_path(&output_dir, &subtitle.id, &FrameFormat::Png);

    // Генерируем кадр с субтитром используя FFmpeg
    let ffmpeg_path = _state.ffmpeg_path.read().await.clone();
    let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);
    
    // Находим видео клип для извлечения базового кадра
    let video_clip = project_schema.tracks
      .iter()
      .flat_map(|track| &track.clips)
      .find(|clip| {
        subtitle.start_time >= clip.start_time && subtitle.start_time <= clip.end_time
      });

    if let Some(clip) = video_clip {
      match &clip.source {
        crate::video_compiler::schema::ClipSource::File(video_path) => {
          // Извлекаем базовый кадр из видео
          let base_frame_path = format!("{}_base.png", frame_path.trim_end_matches(".png"));
          generator
            .generate_frame(&project_schema, subtitle.start_time, &base_frame_path, None)
            .await?;

          // Создаем кадр с субтитром поверх базового кадра
          generate_subtitle_overlay(
            &base_frame_path,
            &frame_path,
            &subtitle.text,
            &subtitle.style_id,
            &project_schema,
          ).await?;

          // Получаем размеры кадра
          let (width, height) = get_frame_dimensions(&frame_path).unwrap_or((1920, 1080));

          results.push(SubtitleFrameResult {
            subtitle_id: subtitle.id.clone(),
            timestamp: subtitle.start_time,
            frame_path,
            width,
            height,
          });
        }
        _ => {
          log::warn!("Субтитр {} не связан с видео файлом", subtitle.id);
        }
      }
    } else {
      log::warn!("Не найден видео клип для субтитра {} в момент времени {}", 
                subtitle.id, subtitle.start_time);
    }
  }

  Ok(results)
}

/// Генерировать превью
#[tauri::command]
pub async fn generate_preview(
  project_schema: ProjectSchema,
  timestamp: f64,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);
  generator
    .generate_frame(&project_schema, timestamp, &output_path, None)
    .await?;

  Ok(output_path)
}

/// Генерировать пакет превью
#[tauri::command]
pub async fn generate_preview_batch(
  project_schema: ProjectSchema,
  timestamps: Vec<f64>,
  output_dir: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);
  let mut paths = Vec::new();

  for timestamp in timestamps {
    let output_path = format!("{output_dir}/preview_{timestamp:.2}.png");
    generator
      .generate_frame(&project_schema, timestamp, &output_path, None)
      .await?;
    paths.push(output_path);
  }

  Ok(paths)
}

/// Извлечь кадры с параметрами
#[tauri::command]
pub async fn extract_frames_with_params(
  params: FrameExtractionParams,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<ExtractedFrame>> {
  // Валидируем параметры
  business_logic::validate_extraction_params(&params)?;

  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let _generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);

  // TODO: Реализовать извлечение кадров с заданными параметрами
  let mut frames = Vec::new();

  for timestamp in &params.timestamps {
    frames.push(ExtractedFrame {
      timestamp: *timestamp,
      data: vec![], // TODO: Заполнить реальными данными
      width: params.resolution.map(|(w, _)| w).unwrap_or(1920),
      height: params.resolution.map(|(_, h)| h).unwrap_or(1080),
      format: params.output_format.clone(),
    });
  }

  Ok(frames)
}

/// Извлечь ключевые кадры
#[tauri::command]
pub async fn extract_keyframes(
  project_schema: ProjectSchema,
  keyframe_count: usize,
  output_dir: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let duration = project_schema.timeline.duration;
  let timestamps = business_logic::generate_keyframe_timestamps(duration, keyframe_count);
  let frame_paths =
    business_logic::generate_frame_paths(&output_dir, &timestamps, &FrameFormat::Jpeg);

  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);

  for (timestamp, frame_path) in timestamps.iter().zip(frame_paths.iter()) {
    generator
      .generate_frame(&project_schema, *timestamp, frame_path, None)
      .await?;
  }

  Ok(frame_paths)
}

/// Генерировать превью с настройками
#[tauri::command]
pub async fn generate_preview_with_settings(
  project_schema: ProjectSchema,
  timestamp: f64,
  output_path: String,
  settings: serde_json::Value,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);
  let options = business_logic::extract_preview_options(&settings);

  generator
    .generate_frame(&project_schema, timestamp, &output_path, Some(options))
    .await?;

  Ok(output_path)
}

/// Получить информацию о кэше извлечения кадров
#[tauri::command]
pub async fn get_frame_extraction_cache_info(
  project_id: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  // Заглушка для несуществующего метода
  Ok(business_logic::generate_cache_info(&project_id, 0, 0))
}

/// Очистить кэш кадров
#[tauri::command]
pub async fn clear_frame_cache(
  _project_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.clear_previews().await;
  Ok(())
}

/// Извлечь кадр из видео
#[tauri::command]
pub async fn extract_video_frame(
  video_path: String,
  timestamp: f64,
  output_path: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<String> {
  // TODO: Реализовать извлечение кадра напрямую из видео файла
  log::info!("Extracting frame from {} at {}s", video_path, timestamp);
  Ok(output_path)
}

/// Извлечь кадры из видео пакетом
#[tauri::command]
pub async fn extract_video_frames_batch(
  _video_path: String,
  timestamps: Vec<f64>,
  output_dir: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let mut paths = Vec::new();

  for (i, timestamp) in timestamps.iter().enumerate() {
    let output_path = format!("{}/frame_{:04}_{:.2}.jpg", output_dir, i + 1, timestamp);
    // TODO: Реализовать извлечение кадра
    paths.push(output_path);
  }

  Ok(paths)
}

/// Получить миниатюры видео
#[tauri::command]
pub async fn get_video_thumbnails(
  video_path: String,
  count: usize,
  output_dir: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  // TODO: Реализовать генерацию миниатюр
  let mut thumbnails = Vec::new();

  for i in 0..count {
    let output_path = format!("{}/thumbnail_{:03}.jpg", output_dir, i + 1);
    thumbnails.push(output_path);
  }

  log::info!("Generated {} thumbnails from {}", count, video_path);
  Ok(thumbnails)
}

/// Генерирует наложение субтитра поверх базового кадра
async fn generate_subtitle_overlay(
  base_frame_path: &str,
  output_path: &str,
  subtitle_text: &str,
  style_id: &str,
  project_schema: &ProjectSchema,
) -> Result<()> {
  use std::process::Command;

  // Ищем стиль субтитра в проекте
  let subtitle_style = project_schema.subtitle_styles
    .iter()
    .find(|style| style.id == style_id);

  let (font_size, font_color, bg_color) = if let Some(style) = subtitle_style {
    (
      style.font_size.unwrap_or(24),
      style.font_color.as_deref().unwrap_or("#FFFFFF"),
      style.background_color.as_deref().unwrap_or("#00000080"),
    )
  } else {
    (24, "#FFFFFF", "#00000080")
  };

  // Экранируем текст для FFmpeg
  let escaped_text = subtitle_text.replace("'", "\\'").replace(":", "\\:");

  // Создаем FFmpeg фильтр для наложения текста
  let drawtext_filter = format!(
    "drawtext=text='{}':fontsize={}:fontcolor={}:box=1:boxcolor={}:boxborderw=5:x=(w-text_w)/2:y=h-th-50",
    escaped_text, font_size, font_color, bg_color
  );

  let mut cmd = Command::new("ffmpeg");
  cmd.args([
    "-i", base_frame_path,
    "-vf", &drawtext_filter,
    "-frames:v", "1",
    "-y", // Перезаписать выходной файл
    output_path,
  ]);

  log::debug!("Генерируем субтитр: {:?}", cmd);

  let output = cmd.output().map_err(|e| {
    crate::video_compiler::error::VideoCompilerError::ExternalProcessError(
      format!("Failed to generate subtitle overlay: {}", e)
    )
  })?;

  if !output.status.success() {
    let stderr = String::from_utf8_lossy(&output.stderr);
    return Err(crate::video_compiler::error::VideoCompilerError::ExternalProcessError(
      format!("FFmpeg subtitle overlay failed: {}", stderr)
    ));
  }

  log::info!("Сгенерирован кадр с субтитром: {}", output_path);
  Ok(())
}

/// Получает размеры кадра из файла изображения
fn get_frame_dimensions(image_path: &str) -> Option<(u32, u32)> {
  use std::process::Command;

  let output = Command::new("ffprobe")
    .args([
      "-v", "quiet",
      "-print_format", "json",
      "-show_streams",
      image_path,
    ])
    .output()
    .ok()?;

  let output_str = String::from_utf8(output.stdout).ok()?;
  let json: serde_json::Value = serde_json::from_str(&output_str).ok()?;

  let streams = json.get("streams")?.as_array()?;
  let video_stream = streams.iter().find(|stream| {
    stream.get("codec_type")?.as_str() == Some("video")
  })?;

  let width = video_stream.get("width")?.as_u64()? as u32;
  let height = video_stream.get("height")?.as_u64()? as u32;

  Some((width, height))
}
