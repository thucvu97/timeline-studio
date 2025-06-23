use crate::video_compiler::ffmpeg_executor::FFmpegExecutor;
use base64::{engine::general_purpose::STANDARD, Engine as _};
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};
use tokio::fs;

/// Кадр для мультимодального анализа
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractedFrame {
  pub image_path: String,
  pub timestamp: f64,
  pub width: u32,
  pub height: u32,
  pub format: String,
}

/// Параметры извлечения кадров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameExtractionParams {
  pub clip_id: String,
  pub sampling_rate: f64, // кадров в секунду
  pub max_frames: u32,
  pub output_format: String,      // jpg, png
  pub quality: u32,               // 1-31 для JPEG
  pub resolution: Option<String>, // "1920x1080" или "auto"
}

/// Результат извлечения кадров
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrameExtractionResult {
  pub frames: Vec<ExtractedFrame>,
  pub total_extracted: u32,
  pub video_duration: f64,
  pub extraction_time_ms: u64,
}

/// Извлекает кадры из видео для мультимодального анализа
#[tauri::command]
pub async fn extract_frames_for_multimodal_analysis(
  clip_id: String,
  sampling_rate: f64,
  max_frames: u32,
) -> Result<Vec<ExtractedFrame>, String> {
  let video_path = get_video_path_by_clip_id(&clip_id)?;

  if !Path::new(&video_path).exists() {
    return Err(format!("Видео файл не найден: {}", video_path));
  }

  // Получаем информацию о видео
  let video_info = get_video_info(&video_path).await?;
  let duration = video_info.duration;

  // Вычисляем интервал между кадрами
  let interval = if sampling_rate > 0.0 {
    1.0 / sampling_rate
  } else {
    duration / max_frames as f64
  };

  // Создаем временную директорию для кадров
  let temp_dir = create_temp_frames_dir(&clip_id).await?;

  let mut frames = Vec::new();
  let mut current_time = 0.0;
  let mut frame_count = 0;

  // Извлекаем кадры
  while current_time < duration && frame_count < max_frames {
    let frame_filename = format!("frame_{:06}.jpg", frame_count);
    let frame_path = temp_dir.join(&frame_filename);

    // Извлекаем кадр в указанное время
    let success = extract_single_frame(&video_path, current_time, &frame_path).await?;

    if success {
      let frame_info = get_image_info(&frame_path).await?;

      frames.push(ExtractedFrame {
        image_path: frame_path.to_string_lossy().to_string(),
        timestamp: current_time,
        width: frame_info.width,
        height: frame_info.height,
        format: "jpg".to_string(),
      });

      frame_count += 1;
    }

    current_time += interval;
  }

  log::info!(
    "Извлечено {} кадров для мультимодального анализа клипа {}",
    frames.len(),
    clip_id
  );

  Ok(frames)
}

/// Конвертирует изображение в base64 для отправки в GPT-4V
#[tauri::command]
pub async fn convert_image_to_base64(image_path: String) -> Result<String, String> {
  let path = Path::new(&image_path);

  if !path.exists() {
    return Err(format!("Изображение не найдено: {}", image_path));
  }

  // Читаем файл
  let image_data = fs::read(&path)
    .await
    .map_err(|e| format!("Ошибка чтения изображения: {}", e))?;

  // Конвертируем в base64
  let base64_data = STANDARD.encode(&image_data);

  Ok(base64_data)
}

/// Извлекает кадры с оптимизацией для анализа превью
#[tauri::command]
pub async fn extract_thumbnail_candidates(
  clip_id: String,
  count: u32,
  aspect_ratio: Option<String>,
) -> Result<Vec<ExtractedFrame>, String> {
  let video_path = get_video_path_by_clip_id(&clip_id)?;
  let video_info = get_video_info(&video_path).await?;

  // Избегаем первых и последних 10% видео для лучших превью
  let start_offset = video_info.duration * 0.1;
  let end_offset = video_info.duration * 0.9;
  let useful_duration = end_offset - start_offset;

  // Равномерно распределяем кадры по полезной части видео
  let interval = useful_duration / count as f64;

  let temp_dir = create_temp_frames_dir(&clip_id).await?;
  let mut frames = Vec::new();

  for i in 0..count {
    let timestamp = start_offset + (i as f64 * interval);
    let frame_filename = format!("thumbnail_candidate_{:03}.jpg", i);
    let frame_path = temp_dir.join(&frame_filename);

    // Извлекаем кадр с высоким качеством для превью
    let success =
      extract_high_quality_frame(&video_path, timestamp, &frame_path, aspect_ratio.as_deref())
        .await?;

    if success {
      let frame_info = get_image_info(&frame_path).await?;

      frames.push(ExtractedFrame {
        image_path: frame_path.to_string_lossy().to_string(),
        timestamp,
        width: frame_info.width,
        height: frame_info.height,
        format: "jpg".to_string(),
      });
    }
  }

  Ok(frames)
}

/// Создает коллаж из нескольких кадров для анализа
#[tauri::command]
pub async fn create_frame_collage(
  frame_paths: Vec<String>,
  output_path: String,
  grid_size: Option<String>, // "2x2", "3x3", etc.
) -> Result<String, String> {
  if frame_paths.is_empty() {
    return Err("Список кадров не может быть пустым".to_string());
  }

  // Определяем размер сетки
  let (cols, rows) = parse_grid_size(grid_size.as_deref().unwrap_or("2x2"))?;

  // Проверяем, что все файлы существуют
  for path in &frame_paths {
    if !Path::new(path).exists() {
      return Err(format!("Кадр не найден: {}", path));
    }
  }

  // Создаем коллаж с помощью FFmpeg
  let success = create_ffmpeg_collage(&frame_paths, &output_path, cols, rows).await?;

  if success {
    Ok(output_path)
  } else {
    Err("Не удалось создать коллаж".to_string())
  }
}

/// Оптимизирует изображение для анализа GPT-4V
#[tauri::command]
pub async fn optimize_image_for_analysis(
  input_path: String,
  output_path: String,
  max_dimension: Option<u32>,
  quality: Option<u32>,
) -> Result<String, String> {
  let input = Path::new(&input_path);
  let _output = Path::new(&output_path);

  if !input.exists() {
    return Err(format!("Входное изображение не найдено: {}", input_path));
  }

  let max_dim = max_dimension.unwrap_or(2048); // GPT-4V оптимально работает с изображениями до 2K
  let jpeg_quality = quality.unwrap_or(85);

  // Используем FFmpeg для оптимизации
  let executor = FFmpegExecutor::new();
  let mut cmd = tokio::process::Command::new("ffmpeg");

  cmd.args([
    "-i",
    &input_path,
    "-vf",
    &format!(
      "scale='min({},iw)':'min({},ih)':force_original_aspect_ratio=decrease",
      max_dim, max_dim
    ),
    "-q:v",
    &jpeg_quality.to_string(),
    "-y", // перезаписать файл
    &output_path,
  ]);

  let result = executor
    .execute(cmd)
    .await
    .map_err(|e| format!("Ошибка оптимизации изображения: {}", e))?;

  if result.exit_code == 0 {
    Ok(output_path)
  } else {
    Err(format!("FFmpeg завершился с ошибкой: {}", result.stderr))
  }
}

/// Удаляет временные файлы кадров
#[tauri::command]
pub async fn cleanup_extracted_frames(clip_id: String) -> Result<u32, String> {
  let temp_dir = get_temp_frames_dir(&clip_id);

  if !temp_dir.exists() {
    return Ok(0);
  }

  let mut removed_count = 0;
  let mut entries = fs::read_dir(&temp_dir)
    .await
    .map_err(|e| format!("Ошибка чтения директории: {}", e))?;

  while let Some(entry) = entries
    .next_entry()
    .await
    .map_err(|e| format!("Ошибка перечисления файлов: {}", e))?
  {
    let path = entry.path();
    if path.is_file() {
      if let Ok(_) = fs::remove_file(&path).await {
        removed_count += 1;
      }
    }
  }

  // Удаляем саму директорию если она пустая
  let _ = fs::remove_dir(&temp_dir).await;

  log::info!(
    "Удалено {} временных кадров для клипа {}",
    removed_count,
    clip_id
  );
  Ok(removed_count)
}

// Вспомогательные функции

async fn extract_single_frame(
  video_path: &str,
  timestamp: f64,
  output_path: &Path,
) -> Result<bool, String> {
  let executor = FFmpegExecutor::new();
  let mut cmd = tokio::process::Command::new("ffmpeg");

  cmd.args([
    "-ss",
    &timestamp.to_string(),
    "-i",
    video_path,
    "-vframes",
    "1",
    "-q:v",
    "2", // высокое качество
    "-y",
    &output_path.to_string_lossy(),
  ]);

  let result = executor
    .execute(cmd)
    .await
    .map_err(|e| format!("Ошибка извлечения кадра: {}", e))?;

  Ok(result.exit_code == 0 && output_path.exists())
}

async fn extract_high_quality_frame(
  video_path: &str,
  timestamp: f64,
  output_path: &Path,
  aspect_ratio: Option<&str>,
) -> Result<bool, String> {
  let executor = FFmpegExecutor::new();
  let mut cmd = tokio::process::Command::new("ffmpeg");

  let mut args = vec![
    "-ss".to_string(),
    timestamp.to_string(),
    "-i".to_string(),
    video_path.to_string(),
    "-vframes".to_string(),
    "1".to_string(),
    "-q:v".to_string(),
    "1".to_string(), // максимальное качество для превью
  ];

  // Добавляем фильтр для изменения соотношения сторон если указано
  if let Some(ratio) = aspect_ratio {
    let filter = match ratio {
      "16:9" => {
        "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2"
      }
      "4:3" => {
        "scale=1440:1080:force_original_aspect_ratio=decrease,pad=1440:1080:(ow-iw)/2:(oh-ih)/2"
      }
      "1:1" => {
        "scale=1080:1080:force_original_aspect_ratio=decrease,pad=1080:1080:(ow-iw)/2:(oh-ih)/2"
      }
      _ => "scale=1920:1080:force_original_aspect_ratio=decrease",
    };
    args.extend_from_slice(&["-vf".to_string(), filter.to_string()]);
  }

  args.extend_from_slice(&["-y".to_string(), output_path.to_string_lossy().to_string()]);

  cmd.args(&args);

  let result = executor
    .execute(cmd)
    .await
    .map_err(|e| format!("Ошибка извлечения превью кадра: {}", e))?;

  Ok(result.exit_code == 0 && output_path.exists())
}

async fn create_ffmpeg_collage(
  frame_paths: &[String],
  output_path: &str,
  cols: u32,
  rows: u32,
) -> Result<bool, String> {
  if frame_paths.is_empty() || cols == 0 || rows == 0 {
    return Err("Неверные параметры коллажа".to_string());
  }

  let executor = FFmpegExecutor::new();
  let mut cmd = tokio::process::Command::new("ffmpeg");

  // Добавляем входные файлы
  for path in frame_paths.iter().take((cols * rows) as usize) {
    cmd.args(["-i", path]);
  }

  // Создаем фильтр для коллажа
  let mut filter_inputs = Vec::new();
  let _filter_chain: Vec<String> = Vec::new();

  for i in 0..(cols * rows).min(frame_paths.len() as u32) {
    filter_inputs.push(format!("[{}:v]", i));
  }

  // Фильтр для создания сетки
  let grid_filter = format!(
    "{}xstack=inputs={}:layout=",
    filter_inputs.join(""),
    frame_paths.len().min((cols * rows) as usize)
  );

  // Создаем layout (расположение)
  let mut layout_parts = Vec::new();
  for row in 0..rows {
    for col in 0..cols {
      let index = row * cols + col;
      if index < frame_paths.len() as u32 {
        layout_parts.push(format!("{}_{}", col * 640, row * 360)); // Предполагаем размер 640x360 для каждого кадра
      }
    }
  }

  let full_filter = format!("{}{}[out]", grid_filter, layout_parts.join("|"));

  cmd.args([
    "-filter_complex",
    &full_filter,
    "-map",
    "[out]",
    "-y",
    output_path,
  ]);

  let result = executor
    .execute(cmd)
    .await
    .map_err(|e| format!("Ошибка создания коллажа: {}", e))?;

  Ok(result.exit_code == 0)
}

async fn create_temp_frames_dir(clip_id: &str) -> Result<PathBuf, String> {
  let temp_base = std::env::temp_dir().join("timeline_studio_multimodal");
  let clip_dir = temp_base.join(clip_id);

  fs::create_dir_all(&clip_dir)
    .await
    .map_err(|e| format!("Ошибка создания временной директории: {}", e))?;

  Ok(clip_dir)
}

fn get_temp_frames_dir(clip_id: &str) -> PathBuf {
  std::env::temp_dir()
    .join("timeline_studio_multimodal")
    .join(clip_id)
}

fn get_video_path_by_clip_id(clip_id: &str) -> Result<String, String> {
  // TODO: Реализовать получение реального пути к видео по clip_id
  // Пока возвращаем заглушку
  Ok(format!("/path/to/video/{}.mp4", clip_id))
}

#[derive(Debug, Serialize, Deserialize)]
struct VideoInfo {
  duration: f64,
  width: u32,
  height: u32,
  fps: f64,
}

async fn get_video_info(video_path: &str) -> Result<VideoInfo, String> {
  let executor = FFmpegExecutor::new();
  let mut cmd = tokio::process::Command::new("ffprobe");

  cmd.args([
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    video_path,
  ]);

  let result = executor
    .execute(cmd)
    .await
    .map_err(|e| format!("Ошибка получения информации о видео: {}", e))?;

  if result.exit_code != 0 {
    return Err(format!("FFprobe завершился с ошибкой: {}", result.stderr));
  }

  // Парсим JSON ответ от ffprobe
  let probe_data: serde_json::Value = serde_json::from_str(&result.stdout)
    .map_err(|e| format!("Ошибка парсинга ffprobe JSON: {}", e))?;

  let format = probe_data
    .get("format")
    .ok_or("Отсутствует информация о формате")?;

  let duration: f64 = format
    .get("duration")
    .and_then(|d| d.as_str())
    .and_then(|s| s.parse().ok())
    .unwrap_or(0.0);

  // Находим видео поток
  let streams = probe_data
    .get("streams")
    .and_then(|s| s.as_array())
    .ok_or("Отсутствует информация о потоках")?;

  let video_stream = streams
    .iter()
    .find(|stream| stream.get("codec_type").and_then(|t| t.as_str()) == Some("video"))
    .ok_or("Видео поток не найден")?;

  let width = video_stream
    .get("width")
    .and_then(|w| w.as_u64())
    .unwrap_or(1920) as u32;

  let height = video_stream
    .get("height")
    .and_then(|h| h.as_u64())
    .unwrap_or(1080) as u32;

  let fps = video_stream
    .get("r_frame_rate")
    .and_then(|fps| fps.as_str())
    .and_then(|s| {
      let parts: Vec<&str> = s.split('/').collect();
      if parts.len() == 2 {
        let num: f64 = parts[0].parse().ok()?;
        let den: f64 = parts[1].parse().ok()?;
        Some(num / den)
      } else {
        s.parse().ok()
      }
    })
    .unwrap_or(30.0);

  Ok(VideoInfo {
    duration,
    width,
    height,
    fps,
  })
}

#[derive(Debug, Serialize, Deserialize)]
struct ImageInfo {
  width: u32,
  height: u32,
  format: String,
}

async fn get_image_info(image_path: &Path) -> Result<ImageInfo, String> {
  let executor = FFmpegExecutor::new();
  let mut cmd = tokio::process::Command::new("ffprobe");

  cmd.args([
    "-v",
    "quiet",
    "-print_format",
    "json",
    "-show_streams",
    &image_path.to_string_lossy(),
  ]);

  let result = executor
    .execute(cmd)
    .await
    .map_err(|e| format!("Ошибка получения информации об изображении: {}", e))?;

  if result.exit_code != 0 {
    return Ok(ImageInfo {
      width: 1920,
      height: 1080,
      format: "jpg".to_string(),
    });
  }

  let probe_data: serde_json::Value =
    serde_json::from_str(&result.stdout).map_err(|_| "Ошибка парсинга ffprobe JSON")?;

  let empty_vec = vec![];
  let streams = probe_data
    .get("streams")
    .and_then(|s| s.as_array())
    .unwrap_or(&empty_vec);

  if let Some(stream) = streams.first() {
    let width = stream.get("width").and_then(|w| w.as_u64()).unwrap_or(1920) as u32;

    let height = stream
      .get("height")
      .and_then(|h| h.as_u64())
      .unwrap_or(1080) as u32;

    let format = image_path
      .extension()
      .and_then(|ext| ext.to_str())
      .unwrap_or("jpg")
      .to_string();

    Ok(ImageInfo {
      width,
      height,
      format,
    })
  } else {
    Ok(ImageInfo {
      width: 1920,
      height: 1080,
      format: "jpg".to_string(),
    })
  }
}

fn parse_grid_size(grid_str: &str) -> Result<(u32, u32), String> {
  let parts: Vec<&str> = grid_str.split('x').collect();
  if parts.len() != 2 {
    return Err(format!(
      "Неверный формат сетки: {}. Ожидается 'WxH'",
      grid_str
    ));
  }

  let cols: u32 = parts[0]
    .parse()
    .map_err(|_| format!("Неверное количество колонок: {}", parts[0]))?;
  let rows: u32 = parts[1]
    .parse()
    .map_err(|_| format!("Неверное количество строк: {}", parts[1]))?;

  if cols == 0 || rows == 0 || cols > 10 || rows > 10 {
    return Err("Размер сетки должен быть от 1x1 до 10x10".to_string());
  }

  Ok((cols, rows))
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_parse_grid_size() {
    assert_eq!(parse_grid_size("2x2").unwrap(), (2, 2));
    assert_eq!(parse_grid_size("3x4").unwrap(), (3, 4));
    assert!(parse_grid_size("invalid").is_err());
    assert!(parse_grid_size("0x2").is_err());
    assert!(parse_grid_size("15x15").is_err());
  }
}
