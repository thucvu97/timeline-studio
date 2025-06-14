use anyhow::Result;
use serde_json::Value;
use tauri::{AppHandle, Emitter, State};

use super::recognition_service::{RecognitionEvent, RecognitionService};
use crate::media::preview_data::RecognitionResults;

/// State для сервиса распознавания
pub struct RecognitionState {
  pub service: RecognitionService,
}

/// Обработать видео и распознать объекты/лица
#[tauri::command]
pub async fn process_video_recognition(
  app: AppHandle,
  state: State<'_, RecognitionState>,
  file_id: String,
  frame_paths: Vec<String>,
) -> Result<RecognitionResults, String> {
  // Отправляем событие о начале
  app
    .emit(
      "recognition",
      RecognitionEvent::ProcessingStarted {
        file_id: file_id.clone(),
      },
    )
    .map_err(|e| e.to_string())?;

  // Преобразуем пути из String в PathBuf
  let paths: Vec<std::path::PathBuf> = frame_paths
    .into_iter()
    .map(std::path::PathBuf::from)
    .collect();

  // Обрабатываем видео
  match state.service.process_video(&file_id, paths).await {
    Ok(results) => {
      // Отправляем событие о завершении
      app
        .emit(
          "recognition",
          RecognitionEvent::ProcessingCompleted {
            file_id: file_id.clone(),
            results: results.clone(),
          },
        )
        .map_err(|e| e.to_string())?;

      Ok(results)
    }
    Err(e) => {
      // Отправляем событие об ошибке
      app
        .emit(
          "recognition",
          RecognitionEvent::ProcessingError {
            file_id,
            error: e.to_string(),
          },
        )
        .map_err(|e| e.to_string())?;

      Err(e.to_string())
    }
  }
}

// Временно отключено - требует frame_paths для каждого файла
/*
/// Обработать несколько видео пакетом
#[tauri::command]
pub async fn process_batch_recognition(
    app: AppHandle,
    state: State<'_, RecognitionState>,
    file_ids: Vec<String>,
) -> Result<Vec<(String, RecognitionResults)>, String> {
    let total = file_ids.len();
    let mut results = Vec::new();

    for (idx, file_id) in file_ids.iter().enumerate() {
        // Отправляем прогресс
        app.emit("recognition", RecognitionEvent::ProcessingProgress {
            file_id: file_id.clone(),
            current: idx + 1,
            total,
        }).map_err(|e| e.to_string())?;

        match state.service.process_video(file_id).await {
            Ok(recognition_results) => {
                results.push((file_id.clone(), recognition_results));
            },
            Err(e) => {
                eprintln!("Failed to process {}: {}", file_id, e);
            }
        }
    }

    Ok(results)
}
*/

/// Получить результаты распознавания для файла
#[tauri::command]
pub async fn get_recognition_results(
  state: State<'_, RecognitionState>,
  file_id: String,
) -> Result<Option<RecognitionResults>, String> {
  state
    .service
    .load_results(&file_id)
    .await
    .map_err(|e| e.to_string())
}

/// Получить данные превью с результатами распознавания
#[tauri::command]
pub async fn get_preview_data_with_recognition(
  _state: State<'_, RecognitionState>,
  file_id: String,
) -> Result<Value, String> {
  // Эта команда возвращает полные данные превью включая результаты распознавания
  // В реальной реализации нужно добавить доступ к PreviewDataManager

  Ok(serde_json::json!({
      "file_id": file_id,
      "message": "This command needs PreviewDataManager integration"
  }))
}

/// Очистить результаты распознавания
#[tauri::command]
pub async fn clear_recognition_results(
  _state: State<'_, RecognitionState>,
  _file_id: String,
) -> Result<(), String> {
  // В реальной реализации здесь бы очищались результаты
  Ok(())
}

/// Экспортировать результаты распознавания
#[tauri::command]
pub async fn export_recognition_results(
  state: State<'_, RecognitionState>,
  file_id: String,
  format: String,
) -> Result<String, String> {
  let results = state
    .service
    .load_results(&file_id)
    .await
    .map_err(|e| e.to_string())?;

  if let Some(results) = results {
    match format.as_str() {
      "json" => serde_json::to_string_pretty(&results).map_err(|e| e.to_string()),
      "csv" => {
        // Простой CSV экспорт
        let mut csv = String::from("Type,Class,Confidence,Timestamp\n");

        for obj in &results.objects {
          for timestamp in &obj.timestamps {
            csv.push_str(&format!(
              "Object,{},{:.2},{:.2}\n",
              obj.class, obj.confidence, timestamp
            ));
          }
        }

        for face in &results.faces {
          for timestamp in &face.timestamps {
            csv.push_str(&format!(
              "Face,{},{:.2},{:.2}\n",
              face.face_id.as_ref().unwrap_or(&"unknown".to_string()),
              face.confidence,
              timestamp
            ));
          }
        }

        Ok(csv)
      }
      _ => Err("Unsupported format".to_string()),
    }
  } else {
    Err("No results found".to_string())
  }
}
