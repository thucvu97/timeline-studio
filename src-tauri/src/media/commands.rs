use anyhow::Result;
use std::path::PathBuf;
use tauri::State;

use super::preview_data::MediaPreviewData;
use super::preview_manager::PreviewDataManager;

/// State для менеджера превью
pub struct PreviewManagerState {
  pub manager: PreviewDataManager,
}

/// Получить данные превью для файла
#[tauri::command]
pub async fn get_media_preview_data(
  state: State<'_, PreviewManagerState>,
  file_id: String,
) -> Result<Option<MediaPreviewData>, String> {
  Ok(state.manager.get_preview_data(&file_id).await)
}

/// Сгенерировать миниатюру для браузера
#[tauri::command]
pub async fn generate_media_thumbnail(
  state: State<'_, PreviewManagerState>,
  file_id: String,
  file_path: String,
  width: u32,
  height: u32,
  timestamp: f64,
) -> Result<String, String> {
  let path = PathBuf::from(file_path);
  state
    .manager
    .generate_browser_thumbnail(file_id, path, width, height, timestamp)
    .await
    .map(|thumbnail| thumbnail.base64_data.unwrap_or_default())
    .map_err(|e| e.to_string())
}

/// Очистить данные превью для файла
#[tauri::command]
pub async fn clear_media_preview_data(
  state: State<'_, PreviewManagerState>,
  file_id: String,
) -> Result<(), String> {
  state
    .manager
    .clear_file_data(&file_id)
    .await
    .map_err(|e| e.to_string())
}

/// Получить список всех файлов с превью
#[tauri::command]
pub async fn get_files_with_previews(
  state: State<'_, PreviewManagerState>,
) -> Result<Vec<String>, String> {
  Ok(state.manager.get_all_files_with_previews().await)
}

/// Сохранить данные превью в файл
#[tauri::command]
pub async fn save_preview_data(
  state: State<'_, PreviewManagerState>,
  path: String,
) -> Result<(), String> {
  let file_path = PathBuf::from(path);
  state
    .manager
    .save_to_file(&file_path)
    .await
    .map_err(|e| e.to_string())
}

/// Загрузить данные превью из файла
#[tauri::command]
pub async fn load_preview_data(
  state: State<'_, PreviewManagerState>,
  path: String,
) -> Result<(), String> {
  let file_path = PathBuf::from(path);
  state
    .manager
    .load_from_file(&file_path)
    .await
    .map_err(|e| e.to_string())
}