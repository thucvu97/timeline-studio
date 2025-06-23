//! Settings - Команды управления настройками компилятора
//!
//! Команды для получения и изменения настроек компилятора,
//! включая пути к FFmpeg, настройки производительности и т.д.

use tauri::State;

use crate::video_compiler::error::Result;
use crate::video_compiler::CompilerSettings;

use super::state::VideoCompilerState;

/// Получить текущие настройки компилятора
#[tauri::command]
pub async fn get_compiler_settings_original(
  state: State<'_, VideoCompilerState>,
) -> Result<CompilerSettings> {
  let settings = state.settings.read().await;
  Ok(settings.clone())
}

/// Обновить настройки компилятора
#[tauri::command]
pub async fn update_compiler_settings_original(
  new_settings: CompilerSettings,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let mut settings = state.settings.write().await;
  *settings = new_settings;
  Ok(())
}

/// Установить путь к FFmpeg
#[tauri::command]
pub async fn set_ffmpeg_path_original(
  path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  // Проверяем, что FFmpeg доступен по указанному пути
  let output = std::process::Command::new(&path)
    .arg("-version")
    .output()
    .map_err(|e| {
      crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
        "Invalid FFmpeg path: {}",
        e
      ))
    })?;

  if !output.status.success() {
    return Err(
      crate::video_compiler::error::VideoCompilerError::InvalidParameter(
        "Invalid FFmpeg executable".to_string(),
      ),
    );
  }

  // Обновляем путь в состоянии
  let mut ffmpeg_path = state.ffmpeg_path.write().await;
  *ffmpeg_path = path;

  Ok(())
}

/// Установить максимальное количество параллельных задач
#[tauri::command]
pub async fn set_parallel_jobs_original(
  jobs: u32,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  if jobs == 0 {
    return Err(
      crate::video_compiler::error::VideoCompilerError::InvalidParameter(
        "Parallel jobs must be greater than 0".to_string(),
      ),
    );
  }

  let mut settings = state.settings.write().await;
  settings.max_concurrent_jobs = jobs as usize;
  Ok(())
}

/// Установить лимит памяти
#[tauri::command]
pub async fn set_memory_limit_original(
  limit_mb: u64,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let mut settings = state.settings.write().await;
  // Поле memory_limit_mb не существует в CompilerSettings
  // Это поле можно добавить позже или использовать cache_size_mb
  settings.cache_size_mb = (limit_mb as usize).max(settings.cache_size_mb);
  Ok(())
}

/// Установить временную директорию
#[tauri::command]
pub async fn set_temp_directory_original(
  path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  // Проверяем, что директория существует
  if !std::path::Path::new(&path).is_dir() {
    return Err(
      crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
        "Directory does not exist: {}",
        path
      )),
    );
  }

  let mut settings = state.settings.write().await;
  settings.temp_directory = std::path::PathBuf::from(path);
  Ok(())
}

/// Установить уровень логирования
#[tauri::command]
pub async fn set_log_level_original(
  level: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let _log_level = match level.to_lowercase().as_str() {
    "error" | "quiet" => "error",
    "warning" | "warn" => "warning",
    "info" => "info",
    "verbose" | "debug" => "verbose",
    _ => {
      return Err(
        crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
          "Invalid log level: {}",
          level
        )),
      )
    }
  };

  let _settings = state.settings.write().await;
  // Поле log_level не существует в текущей CompilerSettings
  // Можно добавить позже или использовать другой способ настройки логирования
  Ok(())
}

/// Сбросить настройки на значения по умолчанию
#[tauri::command]
pub async fn reset_compiler_settings_original(state: State<'_, VideoCompilerState>) -> Result<()> {
  let mut settings = state.settings.write().await;
  *settings = CompilerSettings::default();
  Ok(())
}

/// Получить рекомендуемые настройки для системы
#[tauri::command]
pub async fn get_recommended_settings_original() -> Result<CompilerSettings> {
  let mut settings = CompilerSettings::default();

  // Настраиваем количество параллельных задач на основе количества ядер
  let cpu_count = num_cpus::get() as u32;
  settings.max_concurrent_jobs = ((cpu_count / 2).max(1)) as usize; // Используем половину ядер

  // Настраиваем лимит памяти на основе доступной памяти
  // Используем sysinfo вместо sys_info
  let sys = sysinfo::System::new_all();
  let total_mb = sys.total_memory() / (1024 * 1024); // Bytes to MB
  settings.cache_size_mb = ((total_mb * 20 / 100).max(1024)) as usize; // 20% от общей памяти для кэша

  // Включаем аппаратное ускорение если доступно
  let detector = crate::video_compiler::gpu::GpuDetector::new("ffmpeg".to_string());
  let encoders = detector
    .detect_available_encoders()
    .await
    .unwrap_or_default();
  if !encoders.is_empty() {
    settings.hardware_acceleration = true;
  }

  Ok(settings)
}

/// Экспортировать настройки в JSON
#[tauri::command]
pub async fn export_settings_original(
  path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let settings = state.settings.read().await;
  let json = serde_json::to_string_pretty(&*settings).map_err(|e| {
    crate::video_compiler::error::VideoCompilerError::SerializationError(e.to_string())
  })?;

  std::fs::write(&path, json)
    .map_err(|e| crate::video_compiler::error::VideoCompilerError::IoError(e.to_string()))?;

  Ok(())
}

/// Импортировать настройки из JSON
#[tauri::command]
pub async fn import_settings_original(
  path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let json = std::fs::read_to_string(&path)
    .map_err(|e| crate::video_compiler::error::VideoCompilerError::IoError(e.to_string()))?;

  let new_settings: CompilerSettings = serde_json::from_str(&json).map_err(|e| {
    crate::video_compiler::error::VideoCompilerError::SerializationError(e.to_string())
  })?;

  let mut settings = state.settings.write().await;
  *settings = new_settings;

  Ok(())
}

/// Получить предустановленные настройки качества
#[tauri::command]
pub async fn get_quality_presets_original() -> Result<serde_json::Value> {
  Ok(serde_json::json!({
    "low": {
      "name": "Low Quality",
      "description": "Fast encoding, smaller file size",
      "video_bitrate": 2000,
      "audio_bitrate": 128,
      "quality": 70,
      "preset": "ultrafast"
    },
    "medium": {
      "name": "Medium Quality",
      "description": "Balanced quality and speed",
      "video_bitrate": 5000,
      "audio_bitrate": 192,
      "quality": 80,
      "preset": "medium"
    },
    "high": {
      "name": "High Quality",
      "description": "High quality, slower encoding",
      "video_bitrate": 10000,
      "audio_bitrate": 256,
      "quality": 90,
      "preset": "slow"
    },
    "ultra": {
      "name": "Ultra Quality",
      "description": "Maximum quality, very slow",
      "video_bitrate": 20000,
      "audio_bitrate": 320,
      "quality": 95,
      "preset": "veryslow"
    }
  }))
}

/// Применить предустановленные настройки качества
#[tauri::command]
pub async fn apply_quality_preset(
  preset: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<()> {
  // Текущая версия CompilerSettings не поддерживает эти поля
  // Функция оставлена для совместимости API, но ничего не делает
  match preset.as_str() {
    "low" | "medium" | "high" | "ultra" => Ok(()),
    _ => Err(
      crate::video_compiler::error::VideoCompilerError::InvalidParameter(format!(
        "Unknown quality preset: {}",
        preset
      )),
    ),
  }
}
