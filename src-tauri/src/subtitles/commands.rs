use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

#[derive(Debug, Serialize, Deserialize)]
pub struct SubtitleExportOptions {
  pub format: String, // "srt", "vtt", "ass"
  pub content: String,
  pub output_path: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SubtitleImportResult {
  pub content: String,
  pub format: String,
  pub file_name: String,
}

/// Читает файл субтитров и возвращает его содержимое
#[tauri::command]
pub async fn read_subtitle_file(file_path: String) -> Result<SubtitleImportResult, String> {
  let path = Path::new(&file_path);

  // Проверяем существование файла
  if !path.exists() {
    return Err(format!("File not found: {file_path}"));
  }

  // Определяем формат по расширению
  let extension = path
    .extension()
    .and_then(|ext| ext.to_str())
    .unwrap_or("")
    .to_lowercase();

  let format = match extension.as_str() {
    "srt" => "srt",
    "vtt" => "vtt",
    "ass" | "ssa" => "ass",
    _ => return Err(format!("Unsupported subtitle format: {extension}")),
  };

  // Читаем содержимое файла
  let content = fs::read_to_string(&file_path).map_err(|e| format!("Failed to read file: {e}"))?;

  // Получаем имя файла
  let file_name = path
    .file_name()
    .and_then(|name| name.to_str())
    .unwrap_or("unknown")
    .to_string();

  Ok(SubtitleImportResult {
    content,
    format: format.to_string(),
    file_name,
  })
}

/// Сохраняет субтитры в файл
#[tauri::command]
pub async fn save_subtitle_file(options: SubtitleExportOptions) -> Result<(), String> {
  let path = Path::new(&options.output_path);

  // Создаем директорию если не существует
  if let Some(parent) = path.parent() {
    fs::create_dir_all(parent).map_err(|e| format!("Failed to create directory: {e}"))?;
  }

  // Записываем файл
  fs::write(&options.output_path, &options.content)
    .map_err(|e| format!("Failed to write file: {e}"))?;

  Ok(())
}

/// Валидирует формат субтитров
#[tauri::command]
pub async fn validate_subtitle_format(content: String, format: String) -> Result<bool, String> {
  match format.as_str() {
    "srt" => {
      // Проверяем базовый формат SRT
      let has_timing = content.contains(" --> ");
      let has_numbers = content
        .lines()
        .any(|line| line.trim().parse::<u32>().is_ok());
      Ok(has_timing && has_numbers)
    }
    "vtt" => {
      // Проверяем формат VTT
      let has_header = content.trim().starts_with("WEBVTT");
      let has_timing = content.contains(" --> ");
      Ok(has_header && has_timing)
    }
    "ass" | "ssa" => {
      // Проверяем формат ASS/SSA
      let has_script_info = content.contains("[Script Info]");
      let has_events = content.contains("[Events]");
      Ok(has_script_info || has_events)
    }
    _ => Err(format!("Unknown format: {format}")),
  }
}

/// Конвертирует субтитры между форматами (базовая версия)
#[tauri::command]
pub async fn convert_subtitle_format(
  content: String,
  from_format: String,
  to_format: String,
) -> Result<String, String> {
  // Это упрощенная версия - в реальности нужен полноценный парсер
  if from_format == to_format {
    return Ok(content);
  }

  // Для демонстрации - просто возвращаем контент
  // В реальной реализации здесь должна быть конвертация
  log::warn!("Subtitle format conversion from {from_format} to {to_format} is not yet implemented");

  Ok(content)
}

/// Получает информацию о субтитрах
#[derive(Debug, Serialize, Deserialize)]
pub struct SubtitleInfo {
  pub format: String,
  pub subtitle_count: usize,
  pub duration: Option<f64>,
  pub has_styling: bool,
}

#[tauri::command]
pub async fn get_subtitle_info(content: String, format: String) -> Result<SubtitleInfo, String> {
  let subtitle_count = match format.as_str() {
    "srt" => content.matches(" --> ").count(),
    "vtt" => content.matches(" --> ").count(),
    "ass" | "ssa" => content
      .lines()
      .filter(|line| line.starts_with("Dialogue:"))
      .count(),
    _ => 0,
  };

  let has_styling = match format.as_str() {
    "ass" | "ssa" => true,
    "vtt" => content.contains("NOTE") || content.contains("STYLE"),
    _ => false,
  };

  Ok(SubtitleInfo {
    format,
    subtitle_count,
    duration: None, // Требует парсинга таймингов
    has_styling,
  })
}
