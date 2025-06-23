//! FFmpeg Builder Advanced Commands - продвинутые команды для FFmpeg Builder

use crate::video_compiler::error::Result;
use crate::video_compiler::VideoCompilerState;
use serde::{Deserialize, Serialize};
use tauri::State;

/// Настройки FFmpeg Builder
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FFmpegBuilderSettings {
    pub hardware_acceleration: bool,
    pub gpu_device_index: i32,
    pub thread_count: usize,
    pub preset: String,
    pub crf: u8,
    pub pixel_format: String,
}

/// Информация о проекте FFmpeg Builder
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FFmpegBuilderProjectInfo {
    pub total_segments: usize,
    pub estimated_duration: f64,
    pub output_format: String,
    pub resolution: String,
    pub fps: f32,
    pub audio_channels: u8,
}

/// Информация о фильтрах сегмента
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SegmentFiltersInfo {
    pub segment_id: String,
    pub filters: Vec<FilterInfo>,
    pub total_filters: usize,
    pub estimated_processing_time: f64,
}

/// Информация о фильтре
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FilterInfo {
    pub name: String,
    pub parameters: serde_json::Value,
    pub input_format: String,
    pub output_format: String,
}

/// Параметры для валидации временных меток
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidateTimestampsParams {
    pub segment_id: String,
    pub start_time: f64,
    pub end_time: f64,
    pub check_overlaps: bool,
}

/// Результат валидации временных меток
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub valid: bool,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
    pub corrected_start: Option<f64>,
    pub corrected_end: Option<f64>,
}

/// Получить настройки FFmpeg Builder
#[tauri::command]
pub async fn get_ffmpeg_builder_settings_advanced(
    _state: State<'_, VideoCompilerState>,
) -> Result<FFmpegBuilderSettings> {
    Ok(FFmpegBuilderSettings {
        hardware_acceleration: true,
        gpu_device_index: 0,
        thread_count: num_cpus::get(),
        preset: "medium".to_string(),
        crf: 23,
        pixel_format: "yuv420p".to_string(),
    })
}

/// Получить информацию о проекте FFmpeg Builder
#[tauri::command]
pub async fn get_ffmpeg_builder_project_info_advanced(
    _state: State<'_, VideoCompilerState>,
) -> Result<FFmpegBuilderProjectInfo> {
    Ok(FFmpegBuilderProjectInfo {
        total_segments: 10,
        estimated_duration: 300.0, // 5 минут
        output_format: "mp4".to_string(),
        resolution: "1920x1080".to_string(),
        fps: 30.0,
        audio_channels: 2,
    })
}

/// Получить информацию о фильтрах сегмента
#[tauri::command]
pub async fn get_segment_filters_info_advanced(
    segment_id: String,
    _state: State<'_, VideoCompilerState>,
) -> Result<SegmentFiltersInfo> {
    let demo_filters = vec![
        FilterInfo {
            name: "scale".to_string(),
            parameters: serde_json::json!({"width": 1920, "height": 1080}),
            input_format: "yuv420p".to_string(),
            output_format: "yuv420p".to_string(),
        },
        FilterInfo {
            name: "fade".to_string(),
            parameters: serde_json::json!({"type": "in", "duration": 1.0}),
            input_format: "yuv420p".to_string(),
            output_format: "yuv420p".to_string(),
        },
        FilterInfo {
            name: "volume".to_string(),
            parameters: serde_json::json!({"volume": 0.8}),
            input_format: "pcm_s16le".to_string(),
            output_format: "pcm_s16le".to_string(),
        },
    ];

    Ok(SegmentFiltersInfo {
        segment_id: segment_id.clone(),
        filters: demo_filters.clone(),
        total_filters: demo_filters.len(),
        estimated_processing_time: demo_filters.len() as f64 * 0.5, // 0.5 сек на фильтр
    })
}

/// Валидировать временные метки сегмента
#[tauri::command]
pub async fn validate_segment_timestamps_advanced(
    params: ValidateTimestampsParams,
    _state: State<'_, VideoCompilerState>,
) -> Result<ValidationResult> {
    let mut errors = Vec::new();
    let mut warnings = Vec::new();
    let mut corrected_start = None;
    let mut corrected_end = None;

    // Валидация временных меток
    if params.start_time < 0.0 {
        errors.push("Start time cannot be negative".to_string());
        corrected_start = Some(0.0);
    }

    if params.end_time <= params.start_time {
        errors.push("End time must be greater than start time".to_string());
        corrected_end = Some(params.start_time + 1.0);
    }

    if params.end_time - params.start_time > 3600.0 {
        warnings.push("Segment duration is longer than 1 hour, this may cause performance issues".to_string());
    }

    if params.check_overlaps {
        // Демо проверка пересечений
        if params.start_time % 10.0 == 0.0 {
            warnings.push(format!("Segment {} may overlap with adjacent segments", params.segment_id));
        }
    }

    Ok(ValidationResult {
        valid: errors.is_empty(),
        errors,
        warnings,
        corrected_start,
        corrected_end,
    })
}

/// Получить кэш извлечения кадров
#[tauri::command]
pub async fn get_frame_extraction_cache_advanced(
    _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
    Ok(serde_json::json!({
        "cache_size_mb": 256.0,
        "cached_frames": 1500,
        "cache_hit_ratio": 0.87,
        "most_accessed": [
            {"file": "video1.mp4", "access_count": 45},
            {"file": "video2.mp4", "access_count": 38},
            {"file": "video3.mp4", "access_count": 29}
        ],
        "cache_status": "active",
        "last_cleanup": "2024-01-15T10:30:00Z"
    }))
}

/// Получить индекс входа клипа
#[tauri::command]
pub async fn get_clip_input_index_advanced(
    clip_id: String,
    _state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
    // Демо данные на основе clip_id
    let index = clip_id.len() % 10; // Простой способ генерации индекса
    
    Ok(serde_json::json!({
        "clip_id": clip_id,
        "input_index": index,
        "input_file": format!("input_{}.mp4", index),
        "stream_index": 0,
        "codec": "h264",
        "duration": 120.5,
        "status": "ready"
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ffmpeg_builder_settings_serialization() {
        let settings = FFmpegBuilderSettings {
            hardware_acceleration: true,
            gpu_device_index: 1,
            thread_count: 8,
            preset: "fast".to_string(),
            crf: 20,
            pixel_format: "yuv420p".to_string(),
        };

        let json = serde_json::to_string(&settings).unwrap();
        assert!(json.contains("fast"));
        assert!(json.contains("yuv420p"));
    }

    #[test]
    fn test_validation_result_serialization() {
        let result = ValidationResult {
            valid: false,
            errors: vec!["Invalid start time".to_string()],
            warnings: vec!["Long duration".to_string()],
            corrected_start: Some(0.0),
            corrected_end: None,
        };

        let json = serde_json::to_string(&result).unwrap();
        assert!(json.contains("Invalid start time"));
        assert!(json.contains("Long duration"));
    }

    #[test]
    fn test_validate_timestamps_params_serialization() {
        let params = ValidateTimestampsParams {
            segment_id: "seg_001".to_string(),
            start_time: 10.5,
            end_time: 25.3,
            check_overlaps: true,
        };

        let json = serde_json::to_string(&params).unwrap();
        assert!(json.contains("seg_001"));
        assert!(json.contains("10.5"));
    }
}