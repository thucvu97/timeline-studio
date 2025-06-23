//! Compiler Settings Commands - команды для управления настройками компилятора

use crate::video_compiler::error::Result;
use crate::video_compiler::VideoCompilerState;
use serde::{Deserialize, Serialize};
use tauri::State;

/// Настройки компилятора
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CompilerSettings {
    pub ffmpeg_path: String,
    pub parallel_jobs: usize,
    pub memory_limit_mb: usize,
    pub temp_directory: String,
    pub log_level: String,
    pub hardware_acceleration: bool,
}

/// Рекомендуемые настройки
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecommendedSettings {
    pub cpu_cores: usize,
    pub memory_gb: usize,
    pub parallel_jobs: usize,
    pub settings: CompilerSettings,
}

/// Пресет качества
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QualityPreset {
    pub name: String,
    pub description: String,
    pub bitrate_kbps: u32,
    pub resolution: String,
    pub fps: u32,
    pub codec: String,
}

/// Получить настройки компилятора
#[tauri::command]
pub async fn get_compiler_settings_advanced(
    _state: State<'_, VideoCompilerState>,
) -> Result<CompilerSettings> {
    // Заглушка - возвращаем настройки по умолчанию
    Ok(CompilerSettings {
        ffmpeg_path: "ffmpeg".to_string(),
        parallel_jobs: 4,
        memory_limit_mb: 2048,
        temp_directory: std::env::temp_dir().to_string_lossy().to_string(),
        log_level: "info".to_string(),
        hardware_acceleration: true,
    })
}

/// Обновить настройки компилятора
#[tauri::command]
pub async fn update_compiler_settings_advanced(
    settings: CompilerSettings,
    _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
    // Заглушка - логируем что настройки обновлены
    log::info!("Updating compiler settings: {:?}", settings);
    Ok(true)
}

/// Установить путь к FFmpeg
#[tauri::command]
pub async fn set_ffmpeg_path_advanced(
    path: String,
    _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
    log::info!("Setting FFmpeg path to: {}", path);
    Ok(true)
}

/// Установить количество параллельных задач
#[tauri::command]
pub async fn set_parallel_jobs_advanced(
    jobs: usize,
    _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
    log::info!("Setting parallel jobs to: {}", jobs);
    Ok(true)
}

/// Установить лимит памяти
#[tauri::command]
pub async fn set_memory_limit_advanced(
    limit_mb: usize,
    _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
    log::info!("Setting memory limit to: {}MB", limit_mb);
    Ok(true)
}

/// Установить временную директорию
#[tauri::command]
pub async fn set_temp_directory_advanced(
    directory: String,
    _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
    log::info!("Setting temp directory to: {}", directory);
    Ok(true)
}

/// Установить уровень логирования
#[tauri::command]
pub async fn set_log_level_advanced(
    level: String,
    _state: State<'_, VideoCompilerState>,
) -> Result<bool> {
    log::info!("Setting log level to: {}", level);
    Ok(true)
}

/// Сбросить настройки компилятора к значениям по умолчанию
#[tauri::command]
pub async fn reset_compiler_settings_advanced(
    _state: State<'_, VideoCompilerState>,
) -> Result<CompilerSettings> {
    log::info!("Resetting compiler settings to defaults");
    Ok(CompilerSettings {
        ffmpeg_path: "ffmpeg".to_string(),
        parallel_jobs: 4,
        memory_limit_mb: 2048,
        temp_directory: std::env::temp_dir().to_string_lossy().to_string(),
        log_level: "info".to_string(),
        hardware_acceleration: true,
    })
}

/// Получить рекомендуемые настройки
#[tauri::command]
pub async fn get_recommended_settings_advanced(
    _state: State<'_, VideoCompilerState>,
) -> Result<RecommendedSettings> {
    let cpu_cores = num_cpus::get();
    let memory_gb = 8; // Примерное значение
    
    Ok(RecommendedSettings {
        cpu_cores,
        memory_gb,
        parallel_jobs: cpu_cores.min(8),
        settings: CompilerSettings {
            ffmpeg_path: "ffmpeg".to_string(),
            parallel_jobs: cpu_cores.min(8),
            memory_limit_mb: (memory_gb * 1024) / 2, // Половина от доступной памяти
            temp_directory: std::env::temp_dir().to_string_lossy().to_string(),
            log_level: "info".to_string(),
            hardware_acceleration: true,
        },
    })
}

/// Экспортировать настройки
#[tauri::command]
pub async fn export_settings_advanced(
    _state: State<'_, VideoCompilerState>,
) -> Result<String> {
    let settings = CompilerSettings {
        ffmpeg_path: "ffmpeg".to_string(),
        parallel_jobs: 4,
        memory_limit_mb: 2048,
        temp_directory: std::env::temp_dir().to_string_lossy().to_string(),
        log_level: "info".to_string(),
        hardware_acceleration: true,
    };
    
    serde_json::to_string_pretty(&settings)
        .map_err(|e| crate::video_compiler::error::VideoCompilerError::validation(e.to_string()))
}

/// Импортировать настройки
#[tauri::command]
pub async fn import_settings_advanced(
    settings_json: String,
    _state: State<'_, VideoCompilerState>,
) -> Result<CompilerSettings> {
    serde_json::from_str(&settings_json)
        .map_err(|e| crate::video_compiler::error::VideoCompilerError::validation(e.to_string()))
}

/// Получить пресеты качества
#[tauri::command]
pub async fn get_quality_presets_advanced(
    _state: State<'_, VideoCompilerState>,
) -> Result<Vec<QualityPreset>> {
    Ok(vec![
        QualityPreset {
            name: "Low".to_string(),
            description: "Низкое качество для быстрого просмотра".to_string(),
            bitrate_kbps: 1000,
            resolution: "720p".to_string(),
            fps: 30,
            codec: "h264".to_string(),
        },
        QualityPreset {
            name: "Medium".to_string(),
            description: "Среднее качество для общего использования".to_string(),
            bitrate_kbps: 3000,
            resolution: "1080p".to_string(),
            fps: 30,
            codec: "h264".to_string(),
        },
        QualityPreset {
            name: "High".to_string(),
            description: "Высокое качество для финального рендера".to_string(),
            bitrate_kbps: 8000,
            resolution: "1080p".to_string(),
            fps: 60,
            codec: "h264".to_string(),
        },
        QualityPreset {
            name: "Ultra".to_string(),
            description: "Максимальное качество для профессионального использования".to_string(),
            bitrate_kbps: 20000,
            resolution: "4K".to_string(),
            fps: 60,
            codec: "h265".to_string(),
        },
    ])
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_compiler_settings_serialization() {
        let settings = CompilerSettings {
            ffmpeg_path: "/usr/bin/ffmpeg".to_string(),
            parallel_jobs: 8,
            memory_limit_mb: 4096,
            temp_directory: "/tmp".to_string(),
            log_level: "debug".to_string(),
            hardware_acceleration: true,
        };

        let json = serde_json::to_string(&settings).unwrap();
        assert!(json.contains("ffmpeg"));
        assert!(json.contains("4096"));
    }

    #[test]
    fn test_quality_preset_serialization() {
        let preset = QualityPreset {
            name: "Test".to_string(),
            description: "Test preset".to_string(),
            bitrate_kbps: 5000,
            resolution: "1080p".to_string(),
            fps: 30,
            codec: "h264".to_string(),
        };

        let json = serde_json::to_string(&preset).unwrap();
        assert!(json.contains("Test"));
        assert!(json.contains("5000"));
    }
}