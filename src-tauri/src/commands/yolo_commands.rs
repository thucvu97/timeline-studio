use crate::recognition::{
    yolo_processor::{Detection, YoloConfig, YoloModel, YoloProcessor},
    frame_processor::FrameProcessor,
    recognition_service::RecognitionService,
};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::State;
use tokio::sync::Mutex;

#[derive(Debug, Serialize, Deserialize)]
pub struct YoloDetectionResult {
    pub detections: Vec<Detection>,
    pub frame_number: i32,
    pub timestamp: f64,
    pub processing_time: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct YoloAnalysisRequest {
    pub video_path: String,
    pub model_type: Option<String>,
    pub confidence_threshold: Option<f32>,
    pub target_classes: Option<Vec<String>>,
    pub skip_frames: Option<i32>,
    pub start_time: Option<f64>,
    pub end_time: Option<f64>,
}

/// Инициализация YOLO процессора с указанной моделью
#[tauri::command]
pub async fn init_yolo_processor(
    model_type: String,
    confidence_threshold: f32,
    yolo_state: State<'_, Mutex<Option<YoloProcessor>>>,
) -> Result<String, String> {
    let model = match model_type.as_str() {
        "yolo11-detection" => YoloModel::YoloV11Detection,
        "yolo11-face" => YoloModel::YoloV11Face,
        "yolo8-detection" => YoloModel::YoloV8Detection,
        "yolo8-face" => YoloModel::YoloV8Face,
        _ => return Err(format!("Unknown model type: {}", model_type)),
    };

    match YoloProcessor::new(model.clone(), confidence_threshold) {
        Ok(mut processor) => {
            // Загружаем модель
            match processor.load_model().await {
                Ok(_) => {
                    let mut state = yolo_state.lock().await;
                    *state = Some(processor);
                    Ok(format!("YOLO processor initialized with model: {:?}", model))
                }
                Err(e) => Err(format!("Failed to load YOLO model: {}", e)),
            }
        }
        Err(e) => Err(format!("Failed to create YOLO processor: {}", e)),
    }
}

/// Детекция объектов на одном изображении
#[tauri::command]
pub async fn detect_objects_in_image(
    image_path: String,
    yolo_state: State<'_, Mutex<Option<YoloProcessor>>>,
) -> Result<Vec<Detection>, String> {
    let mut state = yolo_state.lock().await;
    
    match state.as_mut() {
        Some(processor) => {
            let path = PathBuf::from(image_path);
            match processor.process_image(&path).await {
                Ok(detections) => Ok(detections),
                Err(e) => Err(format!("Failed to process image: {}", e)),
            }
        }
        None => Err("YOLO processor not initialized".to_string()),
    }
}

/// Анализ видео с использованием YOLO
#[tauri::command]
pub async fn analyze_video_with_yolo(
    request: YoloAnalysisRequest,
    yolo_state: State<'_, Mutex<Option<YoloProcessor>>>,
) -> Result<Vec<YoloDetectionResult>, String> {
    let mut state = yolo_state.lock().await;
    
    let processor = match state.as_mut() {
        Some(p) => p,
        None => return Err("YOLO processor not initialized".to_string()),
    };

    // Обновляем целевые классы если указаны
    if let Some(classes) = request.target_classes {
        processor.set_target_classes(classes);
    }

    // Создаем frame processor для извлечения кадров
    let mut frame_processor = FrameProcessor::new();
    frame_processor.configure(
        request.skip_frames.unwrap_or(5) as u32,
        request.start_time,
        request.end_time,
    );

    let frames = match frame_processor.extract_frames(&request.video_path).await {
        Ok(frames) => frames,
        Err(e) => return Err(format!("Failed to extract frames: {}", e)),
    };

    let mut results = Vec::new();

    for frame in frames {
        let start_time = std::time::Instant::now();
        
        // Сохраняем кадр во временный файл
        let temp_path = match frame.save_to_temp().await {
            Ok(path) => path,
            Err(e) => {
                eprintln!("Failed to save frame: {}", e);
                continue;
            }
        };

        // Обрабатываем кадр
        match processor.process_image(&temp_path).await {
            Ok(detections) => {
                let processing_time = start_time.elapsed().as_secs_f64();
                
                results.push(YoloDetectionResult {
                    detections,
                    frame_number: frame.number as i32,
                    timestamp: frame.timestamp,
                    processing_time,
                });
            }
            Err(e) => eprintln!("Failed to process frame {}: {}", frame.number, e),
        }

        // Удаляем временный файл
        let _ = std::fs::remove_file(temp_path);
    }

    Ok(results)
}

/// Получить список поддерживаемых классов для текущей модели
#[tauri::command]
pub async fn get_yolo_class_names(
    yolo_state: State<'_, Mutex<Option<YoloProcessor>>>,
) -> Result<Vec<String>, String> {
    let state = yolo_state.lock().await;
    
    match state.as_ref() {
        Some(processor) => Ok(processor.get_class_names()),
        None => Err("YOLO processor not initialized".to_string()),
    }
}

/// Обновить порог уверенности
#[tauri::command]
pub async fn update_yolo_confidence_threshold(
    threshold: f32,
    model_type: String,
    yolo_state: State<'_, Mutex<Option<YoloProcessor>>>,
) -> Result<(), String> {
    // Пересоздаем процессор с новым порогом
    let model = match model_type.as_str() {
        "yolo11-detection" => YoloModel::YoloV11Detection,
        "yolo11-face" => YoloModel::YoloV11Face,
        "yolo8-detection" => YoloModel::YoloV8Detection,
        "yolo8-face" => YoloModel::YoloV8Face,
        _ => return Err(format!("Unknown model type: {}", model_type)),
    };

    match YoloProcessor::new(model, threshold) {
        Ok(mut processor) => {
            match processor.load_model().await {
                Ok(_) => {
                    let mut state = yolo_state.lock().await;
                    *state = Some(processor);
                    Ok(())
                }
                Err(e) => Err(format!("Failed to load YOLO model: {}", e)),
            }
        }
        Err(e) => Err(format!("Failed to create YOLO processor: {}", e)),
    }
}

/// Сохранить данные YOLO для видео
#[tauri::command]
pub async fn save_yolo_data(
    video_id: String,
    data: serde_json::Value,
) -> Result<(), String> {
    // В реальной реализации здесь будет сохранение в базу данных или файл
    println!("Saving YOLO data for video {}: {:?}", video_id, data);
    Ok(())
}

/// Загрузить данные YOLO для видео
#[tauri::command]
pub async fn load_yolo_data(
    video_id: String,
) -> Result<Option<serde_json::Value>, String> {
    // В реальной реализации здесь будет загрузка из базы данных или файла
    println!("Loading YOLO data for video {}", video_id);
    Ok(None)
}

/// Проверить доступность GPU
#[tauri::command]
pub async fn check_gpu_availability() -> Result<bool, String> {
    // Проверяем доступность CUDA или других GPU фреймворков
    #[cfg(feature = "cuda")]
    {
        // Проверка CUDA
        Ok(true)
    }
    
    #[cfg(not(feature = "cuda"))]
    {
        Ok(false)
    }
}