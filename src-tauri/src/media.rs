use serde::{Deserialize, Serialize};
use std::path::Path;
use std::process::Command;
use std::str;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::command;

/// Структура для хранения метаданных видео
#[derive(Debug, Serialize, Deserialize)]
pub struct VideoMetadata {
  pub duration: Option<f64>,
  pub width: Option<u32>,
  pub height: Option<u32>,
  pub fps: Option<f64>,
  pub codec: Option<String>,
  pub bitrate: Option<u64>,
  pub size: Option<u64>,
  pub creation_time: Option<String>,
}

/// Структура для хранения метаданных аудио
#[derive(Debug, Serialize, Deserialize)]
pub struct AudioMetadata {
  pub duration: Option<f64>,
  pub codec: Option<String>,
  pub bitrate: Option<u64>,
  pub sample_rate: Option<u32>,
  pub channels: Option<u8>,
  pub size: Option<u64>,
  pub creation_time: Option<String>,
}

/// Структура для хранения метаданных изображения
#[derive(Debug, Serialize, Deserialize)]
pub struct ImageMetadata {
  pub width: Option<u32>,
  pub height: Option<u32>,
  pub format: Option<String>,
  pub size: Option<u64>,
  pub creation_time: Option<String>,
}

/// Перечисление для типов медиафайлов
#[derive(Debug, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum MediaMetadata {
  Video(VideoMetadata),
  Audio(AudioMetadata),
  Image(ImageMetadata),
  Unknown,
}

/// Структура для потока в формате FFprobe
#[derive(Debug, Serialize, Deserialize)]
pub struct FfprobeStream {
  pub codec_type: String,
  pub codec_name: Option<String>,
  pub width: Option<u32>,
  pub height: Option<u32>,
  pub bit_rate: Option<String>,
  pub r_frame_rate: Option<String>,
  pub sample_rate: Option<String>,
  pub channels: Option<u8>,
}

/// Структура для формата в формате FFprobe
#[derive(Debug, Serialize, Deserialize)]
pub struct FfprobeFormat {
  pub duration: Option<f64>,
  pub size: Option<u64>,
  pub bit_rate: Option<String>,
  pub format_name: Option<String>,
}

/// Структура для хранения данных FFprobe
#[derive(Debug, Serialize, Deserialize)]
pub struct ProbeData {
  pub streams: Vec<FfprobeStream>,
  pub format: FfprobeFormat,
}

/// Структура для медиафайла
#[derive(Debug, Serialize, Deserialize)]
pub struct MediaFile {
  pub id: String,
  pub name: String,
  pub path: String,
  pub is_video: bool,
  pub is_audio: bool,
  pub is_image: bool,
  pub size: u64,
  pub duration: Option<f64>,
  pub start_time: u64,
  pub creation_time: String,
  pub probe_data: ProbeData,
}

/// Проверка наличия FFmpeg в системе
fn check_ffmpeg() -> Result<(), String> {
  let output = Command::new("ffprobe").arg("-version").output();

  match output {
    Ok(_) => Ok(()),
    Err(_) => Err("FFmpeg не установлен или не найден в системном пути".to_string()),
  }
}

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

    // Обрабатываем потоки
    for stream in streams_array {
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

      // Определяем тип файла
      if codec_type == "video"
        && stream
          .get("disposition")
          .and_then(|d| d.get("attached_pic"))
          .and_then(|v| v.as_i64())
          != Some(1)
      {
        is_video = true;
      } else if codec_type == "audio" {
        is_audio = true;
      }

      // Добавляем поток в список
      ffprobe_streams.push(FfprobeStream {
        codec_type,
        codec_name,
        width,
        height,
        bit_rate,
        r_frame_rate,
        sample_rate,
        channels,
      });
    }

    // Если нет видео и аудио, но есть размеры, считаем изображением
    if !is_video && !is_audio && !ffprobe_streams.is_empty() {
      if let (Some(_width), Some(_height)) = (ffprobe_streams[0].width, ffprobe_streams[0].height) {
        is_image = true;
      }
    }
  }

  // Определяем время создания
  let creation_time = if let Some(format_obj) = format {
    format_obj
      .get("tags")
      .and_then(|tags| tags.get("creation_time"))
      .and_then(|v| v.as_str())
      .map(String::from)
  } else {
    None
  };

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
    creation_time: creation_time.unwrap_or_else(|| {
      // Если нет времени создания, используем текущее время
      let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();

      // Преобразуем в формат ISO 8601
      let secs = now.as_secs();
      let nanos = now.subsec_nanos();

      // Создаем строку в формате ISO 8601
      format!("{}.{:09}Z", secs, nanos)
    }),
    probe_data: ProbeData {
      streams: ffprobe_streams,
      format: ffprobe_format,
    },
  };

  Ok(media_file)
}

/// Получение списка медиафайлов в директории
#[command]
pub fn get_media_files(directory: String) -> Result<Vec<String>, String> {
  let path = Path::new(&directory);

  if !path.exists() || !path.is_dir() {
    return Err(format!("Директория не найдена: {}", directory));
  }

  let entries = std::fs::read_dir(path).map_err(|e| format!("Ошибка чтения директории: {}", e))?;

  let mut media_files = Vec::new();

  for entry in entries.flatten() {
    let path = entry.path();

    // Проверяем только файлы
    if path.is_file() {
      if let Some(extension) = path.extension().and_then(|e| e.to_str()) {
        // Проверяем расширение файла
        let ext = extension.to_lowercase();
        if [
          "mp4", "avi", "mkv", "mov", "webm", "mp3", "wav", "ogg", "flac", "jpg", "jpeg", "png",
          "gif", "webp",
        ]
        .contains(&ext.as_str())
        {
          if let Some(path_str) = path.to_str() {
            media_files.push(path_str.to_string());
          }
        }
      }
    }
  }

  Ok(media_files)
}
