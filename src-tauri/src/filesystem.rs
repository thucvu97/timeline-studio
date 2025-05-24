use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;

/**
 * Структура для статистики файла
 */
#[derive(Debug, Serialize, Deserialize)]
pub struct FileStats {
  pub size: u64,
  #[serde(rename = "lastModified")]
  pub last_modified: u64,
}

/**
 * Проверяет существование файла
 */
#[tauri::command]
pub fn file_exists(path: String) -> Result<bool, String> {
  let file_path = Path::new(&path);
  Ok(file_path.exists() && file_path.is_file())
}

/**
 * Получает статистику файла (размер и время модификации)
 */
#[tauri::command]
pub fn get_file_stats(path: String) -> Result<FileStats, String> {
  let file_path = Path::new(&path);

  if !file_path.exists() {
    return Err(format!("File does not exist: {}", path));
  }

  match fs::metadata(file_path) {
    Ok(metadata) => {
      let size = metadata.len();

      // Получаем время модификации в миллисекундах
      let last_modified = metadata
        .modified()
        .map_err(|e| format!("Failed to get modification time: {}", e))?
        .duration_since(std::time::UNIX_EPOCH)
        .map_err(|e| format!("Failed to convert time: {}", e))?
        .as_millis() as u64;

      Ok(FileStats {
        size,
        last_modified,
      })
    }
    Err(e) => Err(format!("Failed to get file metadata: {}", e)),
  }
}

/**
 * Получает платформу операционной системы
 */
#[tauri::command]
pub fn get_platform() -> Result<String, String> {
  Ok(std::env::consts::OS.to_string())
}

/**
 * Рекурсивно ищет файлы в директории с заданным именем
 */
#[tauri::command]
pub fn search_files_by_name(
  directory: String,
  filename: String,
  max_depth: Option<u32>,
) -> Result<Vec<String>, String> {
  let dir_path = Path::new(&directory);

  if !dir_path.exists() {
    return Err(format!("Directory does not exist: {}", directory));
  }

  let mut found_files = Vec::new();
  let max_depth = max_depth.unwrap_or(5); // По умолчанию максимум 5 уровней

  search_files_recursive(dir_path, &filename, &mut found_files, 0, max_depth)?;

  Ok(found_files)
}

/**
 * Рекурсивная функция для поиска файлов
 */
fn search_files_recursive(
  dir: &Path,
  target_filename: &str,
  found_files: &mut Vec<String>,
  current_depth: u32,
  max_depth: u32,
) -> Result<(), String> {
  if current_depth >= max_depth {
    return Ok(());
  }

  match fs::read_dir(dir) {
    Ok(entries) => {
      for entry in entries {
        match entry {
          Ok(entry) => {
            let entry_path = entry.path();

            if entry_path.is_file() {
              if let Some(filename) = entry_path.file_name() {
                if filename == target_filename {
                  if let Some(path_str) = entry_path.to_str() {
                    found_files.push(path_str.to_string());
                  }
                }
              }
            } else if entry_path.is_dir() {
              // Рекурсивно ищем в поддиректории
              search_files_recursive(
                &entry_path,
                target_filename,
                found_files,
                current_depth + 1,
                max_depth,
              )?;
            }
          }
          Err(e) => {
            eprintln!("Error reading directory entry: {}", e);
          }
        }
      }
    }
    Err(e) => return Err(format!("Failed to read directory: {}", e)),
  }

  Ok(())
}

/**
 * Получает абсолютный путь к файлу
 */
#[tauri::command]
pub fn get_absolute_path(path: String) -> Result<String, String> {
  let file_path = Path::new(&path);

  match file_path.canonicalize() {
    Ok(absolute_path) => {
      if let Some(path_str) = absolute_path.to_str() {
        Ok(path_str.to_string())
      } else {
        Err("Failed to convert path to string".to_string())
      }
    }
    Err(e) => Err(format!("Failed to get absolute path: {}", e)),
  }
}
