// Модуль для получения метаданных медиафайлов

use std::path::Path;
use std::process::Command;
use std::str;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::command;

use super::ffmpeg::check_ffmpeg;
use super::types::{FfprobeFormat, FfprobeStream, MediaFile, ProbeData};

/// Получение метаданных медиафайла с помощью FFmpeg
#[command]
pub fn get_media_metadata(file_path: String) -> Result<MediaFile, String> {
  // Проверяем наличие FFmpeg
  check_ffmpeg()?;

  // Проверяем существование файла
  if !Path::new(&file_path).exists() {
    return Err(format!("Файл не найден: {}", file_path));
  }

  // Получаем информацию о файле в формате JSON
  let output = Command::new("ffprobe")
    .args([
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
      &file_path,
    ])
    .output()
    .map_err(|e| format!("Ошибка выполнения ffprobe: {}", e))?;

  let output_str =
    str::from_utf8(&output.stdout).map_err(|e| format!("Ошибка декодирования вывода: {}", e))?;

  // Парсим JSON
  let probe_data: serde_json::Value =
    serde_json::from_str(output_str).map_err(|e| format!("Ошибка парсинга JSON: {}", e))?;

  // Получаем имя файла из пути
  let file_name = Path::new(&file_path)
    .file_name()
    .and_then(|name| name.to_str())
    .unwrap_or("unknown")
    .to_string();

  // Определяем тип медиафайла
  let streams = probe_data["streams"].as_array();
  let format = probe_data["format"].as_object();

  // Флаги для типа файла
  let mut is_video = false;
  let mut is_audio = false;
  let mut is_image = false;

  // Создаем структуры для потоков и формата
  let mut ffprobe_streams: Vec<FfprobeStream> = Vec::new();
  let mut ffprobe_format = FfprobeFormat {
    duration: None,
    size: None,
    bit_rate: None,
    format_name: None,
  };

  if let (Some(streams_array), Some(format_obj)) = (streams, format) {
    // Заполняем информацию о формате
    parse_format_data(format_obj, &mut ffprobe_format);

    // Обрабатываем потоки
    for (i, stream) in streams_array.iter().enumerate() {
      let parsed_stream = parse_stream_data(stream, i);

      // Определяем тип файла
      if parsed_stream.codec_type == "video"
        && stream
          .get("disposition")
          .and_then(|d| d.get("attached_pic"))
          .and_then(|v| v.as_i64())
          != Some(1)
      {
        is_video = true;
      } else if parsed_stream.codec_type == "audio" {
        is_audio = true;
      }

      ffprobe_streams.push(parsed_stream);
    }

    // Если нет видео и аудио, но есть размеры, считаем изображением
    if !is_video && !is_audio && !ffprobe_streams.is_empty() {
      if let (Some(_width), Some(_height)) = (ffprobe_streams[0].width, ffprobe_streams[0].height) {
        is_image = true;
      }
    }
  }

  // Определяем время создания
  let creation_time = extract_creation_time(format);

  // Получаем текущее время в формате ISO 8601
  let now = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap_or_default()
    .as_secs();

  // Создаем структуру MediaFile
  let media_file = MediaFile {
    id: file_path.clone(),
    name: file_name,
    path: file_path,
    is_video,
    is_audio,
    is_image,
    size: ffprobe_format.size.unwrap_or(0),
    duration: ffprobe_format.duration,
    start_time: now,
    creation_time: creation_time.unwrap_or_else(generate_iso8601_timestamp),
    probe_data: ProbeData {
      streams: ffprobe_streams,
      format: ffprobe_format,
    },
  };

  Ok(media_file)
}

/// Парсит данные формата из JSON
fn parse_format_data(
  format_obj: &serde_json::Map<String, serde_json::Value>,
  ffprobe_format: &mut FfprobeFormat,
) {
  ffprobe_format.duration = format_obj
    .get("duration")
    .and_then(|v| v.as_str())
    .and_then(|s| s.parse::<f64>().ok());

  ffprobe_format.size = format_obj
    .get("size")
    .and_then(|v| v.as_str())
    .and_then(|s| s.parse::<u64>().ok());

  ffprobe_format.bit_rate = format_obj
    .get("bit_rate")
    .and_then(|v| v.as_str())
    .map(String::from);

  ffprobe_format.format_name = format_obj
    .get("format_name")
    .and_then(|v| v.as_str())
    .map(String::from);
}

/// Парсит данные потока из JSON
fn parse_stream_data(stream: &serde_json::Value, index: usize) -> FfprobeStream {
  let stream_index = stream
    .get("index")
    .and_then(|v| v.as_u64())
    .map(|v| v as u32)
    .unwrap_or(index as u32);

  let codec_type = stream
    .get("codec_type")
    .and_then(|v| v.as_str())
    .unwrap_or("unknown")
    .to_string();

  let codec_name = stream
    .get("codec_name")
    .and_then(|v| v.as_str())
    .map(String::from);

  let width = stream
    .get("width")
    .and_then(|v| v.as_u64())
    .map(|v| v as u32);

  let height = stream
    .get("height")
    .and_then(|v| v.as_u64())
    .map(|v| v as u32);

  let bit_rate = stream
    .get("bit_rate")
    .and_then(|v| v.as_str())
    .map(String::from);

  let r_frame_rate = stream
    .get("r_frame_rate")
    .and_then(|v| v.as_str())
    .map(String::from);

  let sample_rate = stream
    .get("sample_rate")
    .and_then(|v| v.as_str())
    .map(String::from);

  let channels = stream
    .get("channels")
    .and_then(|v| v.as_u64())
    .map(|v| v as u8);

  let display_aspect_ratio = stream
    .get("display_aspect_ratio")
    .and_then(|v| v.as_str())
    .map(String::from);

  FfprobeStream {
    index: stream_index,
    codec_type,
    codec_name,
    width,
    height,
    bit_rate,
    r_frame_rate,
    sample_rate,
    channels,
    display_aspect_ratio,
  }
}

/// Извлекает время создания из метаданных формата
fn extract_creation_time(
  format: Option<&serde_json::Map<String, serde_json::Value>>,
) -> Option<String> {
  format?
    .get("tags")
    .and_then(|tags| tags.get("creation_time"))
    .and_then(|v| v.as_str())
    .map(String::from)
}

/// Генерирует текущее время в формате ISO 8601
fn generate_iso8601_timestamp() -> String {
  let now = SystemTime::now()
    .duration_since(UNIX_EPOCH)
    .unwrap_or_default();

  let secs = now.as_secs();
  let nanos = now.subsec_nanos();

  format!("{}.{:09}Z", secs, nanos)
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_get_media_metadata_with_nonexistent_file() {
    let result = get_media_metadata("/nonexistent/file.mp4".to_string());
    assert!(result.is_err());
    assert!(result.unwrap_err().contains("Файл не найден"));
  }

  #[test]
  fn test_generate_iso8601_timestamp() {
    let timestamp = generate_iso8601_timestamp();

    // Проверяем, что timestamp имеет правильный формат
    assert!(timestamp.ends_with('Z'));
    assert!(timestamp.contains('.'));

    // Проверяем, что можно распарсить как число (секунды)
    let parts: Vec<&str> = timestamp.split('.').collect();
    assert_eq!(parts.len(), 2);

    let secs_part = parts[0];
    assert!(secs_part.parse::<u64>().is_ok());
  }

  #[test]
  fn test_parse_stream_data() {
    // Создаем тестовые данные JSON для потока
    let stream_json = serde_json::json!({
      "index": 0,
      "codec_type": "video",
      "codec_name": "h264",
      "width": 1920,
      "height": 1080,
      "bit_rate": "5000000",
      "r_frame_rate": "30/1",
      "display_aspect_ratio": "16:9"
    });

    let parsed_stream = parse_stream_data(&stream_json, 0);

    assert_eq!(parsed_stream.index, 0);
    assert_eq!(parsed_stream.codec_type, "video");
    assert_eq!(parsed_stream.codec_name, Some("h264".to_string()));
    assert_eq!(parsed_stream.width, Some(1920));
    assert_eq!(parsed_stream.height, Some(1080));
    assert_eq!(parsed_stream.bit_rate, Some("5000000".to_string()));
    assert_eq!(parsed_stream.r_frame_rate, Some("30/1".to_string()));
    assert_eq!(parsed_stream.display_aspect_ratio, Some("16:9".to_string()));
  }

  #[test]
  fn test_extract_creation_time() {
    // Тест с временем создания
    let format_with_time = serde_json::json!({
      "tags": {
        "creation_time": "2023-01-01T00:00:00Z"
      }
    });

    let format_map = format_with_time.as_object();
    let creation_time = extract_creation_time(format_map);
    assert_eq!(creation_time, Some("2023-01-01T00:00:00Z".to_string()));

    // Тест без времени создания
    let format_without_time = serde_json::json!({
      "duration": "120.5"
    });

    let format_map = format_without_time.as_object();
    let creation_time = extract_creation_time(format_map);
    assert_eq!(creation_time, None);
  }
}
