//! Project Schema Commands - команды для работы со схемой проекта

use crate::video_compiler::error::Result;
use crate::video_compiler::schema::{ProjectSchema, Subtitle};
use crate::video_compiler::VideoCompilerState;
use serde::{Deserialize, Serialize};
use tauri::State;

/// Обновить время модификации проекта
#[tauri::command]
pub async fn touch_project(
    mut project: ProjectSchema,
    _state: State<'_, VideoCompilerState>,
) -> Result<ProjectSchema> {
    project.touch();
    Ok(project)
}

/// Параметры для создания субтитра
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSubtitleParams {
    pub text: String,
    pub start_time: f64,
    pub end_time: f64,
}

/// Создать новый субтитр
#[tauri::command]
pub async fn create_subtitle(
    params: CreateSubtitleParams,
    _state: State<'_, VideoCompilerState>,
) -> Result<Subtitle> {
    let subtitle = Subtitle::new(params.text, params.start_time, params.end_time);
    Ok(subtitle)
}

/// Валидировать субтитр
#[tauri::command]
pub async fn validate_subtitle(
    subtitle: Subtitle,
    _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
    match subtitle.validate() {
        Ok(()) => Ok(true),
        Err(_) => Ok(false),
    }
}

/// Получить длительность субтитра
#[tauri::command]
pub async fn get_subtitle_duration(
    subtitle: Subtitle,
    _state: State<'_, VideoCompilerState>,
) -> Result<f64> {
    Ok(subtitle.get_duration())
}

/// Результат валидации с подробностями
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub errors: Vec<String>,
}

/// Валидировать субтитр с подробными ошибками
#[tauri::command]
pub async fn validate_subtitle_detailed(
    subtitle: Subtitle,
    _state: State<'_, VideoCompilerState>,
) -> Result<ValidationResult> {
    match subtitle.validate() {
        Ok(()) => Ok(ValidationResult {
            is_valid: true,
            errors: vec![],
        }),
        Err(e) => Ok(ValidationResult {
            is_valid: false,
            errors: vec![e],
        }),
    }
}

/// Информация о субтитре
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubtitleInfo {
    pub duration: f64,
    pub is_valid: bool,
    pub text_length: usize,
    pub start_time: f64,
    pub end_time: f64,
}

/// Получить полную информацию о субтитре
#[tauri::command]
pub async fn get_subtitle_info(
    subtitle: Subtitle,
    _state: State<'_, VideoCompilerState>,
) -> Result<SubtitleInfo> {
    let duration = subtitle.get_duration();
    let is_valid = subtitle.validate().is_ok();
    
    Ok(SubtitleInfo {
        duration,
        is_valid,
        text_length: subtitle.text.len(),
        start_time: subtitle.start_time,
        end_time: subtitle.end_time,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_create_subtitle_params_serialization() {
        let params = CreateSubtitleParams {
            text: "Test subtitle".to_string(),
            start_time: 0.0,
            end_time: 5.0,
        };

        let json = serde_json::to_string(&params).unwrap();
        assert!(json.contains("Test subtitle"));
        assert!(json.contains("5.0"));
    }

    #[test]
    fn test_subtitle_info_serialization() {
        let info = SubtitleInfo {
            duration: 5.0,
            is_valid: true,
            text_length: 13,
            start_time: 0.0,
            end_time: 5.0,
        };

        let json = serde_json::to_string(&info).unwrap();
        assert!(json.contains("duration"));
        assert!(json.contains("text_length"));
    }
}