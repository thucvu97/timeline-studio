/*!
 * Tauri команды для Video Compiler
 *
 * Этот модуль определяет все Tauri команды для работы с video compiler
 * из фронтенда, включая компиляцию видео, управление GPU и мониторинг.
 */

use std::collections::HashMap;
use std::path::Path;
use std::sync::Arc;
use tauri::State;
use tokio::sync::{mpsc, RwLock};

use crate::video_compiler::cache::{CacheStats, RenderCache};
use crate::video_compiler::error::{Result, VideoCompilerError};
use crate::video_compiler::gpu::{GpuCapabilities, GpuDetector, GpuInfo};
use crate::video_compiler::progress::{RenderProgress, RenderStatus};
use crate::video_compiler::renderer::VideoRenderer;
use crate::video_compiler::schema::ProjectSchema;
use crate::video_compiler::CompilerSettings;

/// Состояние Video Compiler для Tauri
#[derive(Debug)]
pub struct VideoCompilerState {
  /// Активные задачи рендеринга
  pub active_jobs: Arc<RwLock<HashMap<String, VideoRenderer>>>,

  /// Менеджер кэша
  pub cache_manager: Arc<RwLock<RenderCache>>,

  /// Путь к FFmpeg
  pub ffmpeg_path: String,

  /// Настройки компилятора
  pub settings: Arc<RwLock<CompilerSettings>>,
}

impl VideoCompilerState {
  pub fn new() -> Self {
    let settings = Arc::new(RwLock::new(CompilerSettings::default()));
    let cache_manager = Arc::new(RwLock::new(RenderCache::new()));

    Self {
      active_jobs: Arc::new(RwLock::new(HashMap::new())),
      cache_manager,
      ffmpeg_path: "ffmpeg".to_string(), // Предполагаем, что ffmpeg в PATH
      settings,
    }
  }
}

impl Default for VideoCompilerState {
  fn default() -> Self {
    Self::new()
  }
}

/// Информация о задаче рендеринга для фронтенда
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct RenderJob {
  pub id: String,
  pub project_name: String,
  pub output_path: String,
  pub status: RenderStatus,
  pub created_at: String,
  pub progress: Option<RenderProgress>,
  pub error_message: Option<String>,
}

// ==================== ОСНОВНЫЕ КОМАНДЫ ====================

/// Запуск компиляции видео
#[tauri::command]
pub async fn compile_video(
  project_schema: ProjectSchema,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let job_id = uuid::Uuid::new_v4().to_string();

  // Создаем канал для прогресса
  let (progress_sender, _progress_receiver) = mpsc::unbounded_channel();

  // Создаем рендерер
  let renderer = VideoRenderer::new(
    project_schema,
    state.settings.clone(),
    state.cache_manager.clone(),
    progress_sender,
  )
  .await
  .map_err(|e| VideoCompilerError::InternalError(format!("Failed to create renderer: {}", e)))?;

  // Сохраняем в активных задачах
  {
    let mut jobs = state.active_jobs.write().await;
    jobs.insert(job_id.clone(), renderer);
  }

  // Запускаем рендеринг в фоне
  let active_jobs = state.active_jobs.clone();
  let job_id_clone = job_id.clone();
  let output_path_clone = output_path.clone();

  tokio::spawn(async move {
    let result = {
      let mut jobs = active_jobs.write().await;
      if let Some(renderer) = jobs.get_mut(&job_id_clone) {
        renderer.render(Path::new(&output_path_clone)).await
      } else {
        Err(VideoCompilerError::InternalError(
          "Job not found".to_string(),
        ))
      }
    };

    // Логируем результат
    match result {
      Ok(_) => log::info!("Рендеринг завершен успешно: {}", job_id_clone),
      Err(e) => log::error!("Ошибка рендеринга {}: {}", job_id_clone, e),
    }

    // Удаляем из активных задач
    {
      let mut jobs = active_jobs.write().await;
      jobs.remove(&job_id_clone);
    }
  });

  Ok(job_id)
}

/// Получить прогресс рендеринга
#[tauri::command]
pub async fn get_render_progress(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Option<RenderProgress>> {
  let jobs = state.active_jobs.read().await;

  if let Some(renderer) = jobs.get(&job_id) {
    Ok(renderer.get_progress().await)
  } else {
    Ok(None)
  }
}

/// Отменить рендеринг
#[tauri::command]
pub async fn cancel_render(job_id: String, state: State<'_, VideoCompilerState>) -> Result<bool> {
  let mut jobs = state.active_jobs.write().await;

  if let Some(renderer) = jobs.get_mut(&job_id) {
    renderer.cancel().await?;
    jobs.remove(&job_id);
    Ok(true)
  } else {
    Ok(false)
  }
}

/// Получить список активных задач
#[tauri::command]
pub async fn get_active_jobs(state: State<'_, VideoCompilerState>) -> Result<Vec<RenderJob>> {
  let jobs = state.active_jobs.read().await;
  let mut result = Vec::new();

  for (job_id, renderer) in jobs.iter() {
    let progress = renderer.get_progress().await;
    let status = match &progress {
      Some(p) => p.status.clone(),
      None => RenderStatus::Processing,
    };

    result.push(RenderJob {
      id: job_id.clone(),
      project_name: "Unknown Project".to_string(), // TODO: получать из ProjectSchema
      output_path: "Unknown Path".to_string(),     // TODO: сохранять путь
      status,
      created_at: chrono::Utc::now().to_rfc3339(),
      progress,
      error_message: None,
    });
  }

  Ok(result)
}

/// Генерация превью кадра
#[tauri::command]
pub async fn generate_preview(
  video_path: String,
  timestamp: f64,
  resolution: Option<(u32, u32)>,
  quality: Option<u8>,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<u8>> {
  use crate::video_compiler::preview::PreviewGenerator;

  let preview_gen = PreviewGenerator::new(state.cache_manager.clone());

  // Генерируем превью
  preview_gen
    .generate_preview(Path::new(&video_path), timestamp, resolution, quality)
    .await
    .map_err(|e| VideoCompilerError::PreviewError {
      timestamp,
      reason: e.to_string(),
    })
}

// ==================== GPU КОМАНДЫ ====================

/// Получить возможности GPU
#[tauri::command]
pub async fn get_gpu_capabilities(state: State<'_, VideoCompilerState>) -> Result<GpuCapabilities> {
  let detector = GpuDetector::new(state.ffmpeg_path.clone());

  detector
    .get_gpu_capabilities()
    .await
    .map_err(|e| VideoCompilerError::gpu(format!("Failed to get GPU capabilities: {}", e)))
}

/// Получить информацию о текущем GPU
#[tauri::command]
pub async fn get_current_gpu_info(state: State<'_, VideoCompilerState>) -> Result<Option<GpuInfo>> {
  let detector = GpuDetector::new(state.ffmpeg_path.clone());

  match detector.get_gpu_capabilities().await {
    Ok(capabilities) => Ok(capabilities.current_gpu),
    Err(_) => Ok(None),
  }
}

/// Проверить доступность аппаратного ускорения
#[tauri::command]
pub async fn check_hardware_acceleration(state: State<'_, VideoCompilerState>) -> Result<bool> {
  let detector = GpuDetector::new(state.ffmpeg_path.clone());

  match detector.detect_available_encoders().await {
    Ok(encoders) => Ok(!encoders.is_empty()),
    Err(_) => Ok(false),
  }
}

// ==================== КЭШИРОВАНИЕ ====================

/// Получить статистику кэша
#[tauri::command]
pub async fn get_cache_stats(state: State<'_, VideoCompilerState>) -> Result<CacheStats> {
  let cache = state.cache_manager.read().await;
  Ok(cache.get_stats().clone())
}

/// Очистить кэш
#[tauri::command]
pub async fn clear_cache(state: State<'_, VideoCompilerState>) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.clear_all().await;
  Ok(())
}

/// Очистить кэш превью
#[tauri::command]
pub async fn clear_preview_cache(state: State<'_, VideoCompilerState>) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.clear_previews().await;
  Ok(())
}

// ==================== НАСТРОЙКИ ====================

/// Получить настройки компилятора
#[tauri::command]
pub async fn get_compiler_settings(
  state: State<'_, VideoCompilerState>,
) -> Result<CompilerSettings> {
  let settings = state.settings.read().await;
  Ok(settings.clone())
}

/// Обновить настройки компилятора
#[tauri::command]
pub async fn update_compiler_settings(
  new_settings: CompilerSettings,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let mut settings = state.settings.write().await;
  *settings = new_settings;
  Ok(())
}

/// Установить путь к FFmpeg
#[tauri::command]
pub async fn set_ffmpeg_path(path: String, _state: State<'_, VideoCompilerState>) -> Result<bool> {
  // Проверяем, что FFmpeg доступен по указанному пути
  let output = tokio::process::Command::new(&path)
    .arg("-version")
    .output()
    .await;

  match output {
    Ok(output) if output.status.success() => {
      // TODO: Обновить путь в состоянии
      Ok(true)
    }
    _ => Err(VideoCompilerError::DependencyMissing(format!(
      "FFmpeg not found at path: {}",
      path
    ))),
  }
}

// ==================== ДИАГНОСТИКА ====================

/// Получить информацию о системе для диагностики
#[tauri::command]
pub async fn get_system_info(state: State<'_, VideoCompilerState>) -> Result<SystemInfo> {
  let detector = GpuDetector::new(state.ffmpeg_path.clone());
  let gpu_capabilities = detector.get_gpu_capabilities().await.ok();

  Ok(SystemInfo {
    os: std::env::consts::OS.to_string(),
    arch: std::env::consts::ARCH.to_string(),
    ffmpeg_path: state.ffmpeg_path.clone(),
    temp_directory: std::env::temp_dir().to_string_lossy().to_string(),
    gpu_capabilities,
    available_memory: get_available_memory(),
    cpu_cores: std::thread::available_parallelism()
      .map(|n| n.get())
      .unwrap_or(1),
  })
}

/// Информация о системе
#[derive(Debug, serde::Serialize)]
pub struct SystemInfo {
  pub os: String,
  pub arch: String,
  pub ffmpeg_path: String,
  pub temp_directory: String,
  pub gpu_capabilities: Option<GpuCapabilities>,
  pub available_memory: Option<u64>,
  pub cpu_cores: usize,
}

/// Получить доступную память системы
fn get_available_memory() -> Option<u64> {
  #[cfg(target_os = "linux")]
  {
    // Читаем /proc/meminfo
    use std::fs;
    if let Ok(content) = fs::read_to_string("/proc/meminfo") {
      for line in content.lines() {
        if line.starts_with("MemAvailable:") {
          if let Some(kb) = line.split_whitespace().nth(1) {
            if let Ok(kb_val) = kb.parse::<u64>() {
              return Some(kb_val * 1024); // Конвертируем в байты
            }
          }
        }
      }
    }
  }

  #[cfg(target_os = "macos")]
  {
    // Используем sysctl
    use std::process::Command;
    if let Ok(output) = Command::new("sysctl").args(["-n", "hw.memsize"]).output() {
      if let Ok(mem_str) = String::from_utf8(output.stdout) {
        if let Ok(mem_bytes) = mem_str.trim().parse::<u64>() {
          return Some(mem_bytes);
        }
      }
    }
  }

  #[cfg(target_os = "windows")]
  {
    // Для Windows можно использовать WMI или другие системные API
    // Пока возвращаем None
  }

  None
}

/// Проверить доступность FFmpeg и его возможности
#[tauri::command]
pub async fn check_ffmpeg_capabilities(
  state: State<'_, VideoCompilerState>,
) -> Result<FfmpegCapabilities> {
  let ffmpeg_path = &state.ffmpeg_path;

  // Проверяем версию FFmpeg
  let version_output = tokio::process::Command::new(ffmpeg_path)
    .arg("-version")
    .output()
    .await
    .map_err(|e| VideoCompilerError::DependencyMissing(format!("FFmpeg not found: {}", e)))?;

  let version_str = String::from_utf8_lossy(&version_output.stdout);
  let version = extract_ffmpeg_version(&version_str);

  // Проверяем доступные кодеки
  let codecs_output = tokio::process::Command::new(ffmpeg_path)
    .arg("-codecs")
    .output()
    .await
    .map_err(|e| VideoCompilerError::io(format!("Failed to get codecs: {}", e)))?;

  let codecs_str = String::from_utf8_lossy(&codecs_output.stdout);
  let available_codecs = extract_available_codecs(&codecs_str);

  // Проверяем доступные энкодеры
  let encoders_output = tokio::process::Command::new(ffmpeg_path)
    .arg("-encoders")
    .output()
    .await
    .map_err(|e| VideoCompilerError::io(format!("Failed to get encoders: {}", e)))?;

  let encoders_str = String::from_utf8_lossy(&encoders_output.stdout);
  let hardware_encoders = extract_hardware_encoders(&encoders_str);

  Ok(FfmpegCapabilities {
    version,
    available_codecs,
    hardware_encoders,
    path: ffmpeg_path.clone(),
  })
}

/// Возможности FFmpeg
#[derive(Debug, serde::Serialize)]
pub struct FfmpegCapabilities {
  pub version: String,
  pub available_codecs: Vec<String>,
  pub hardware_encoders: Vec<String>,
  pub path: String,
}

/// Извлечь версию FFmpeg из вывода
fn extract_ffmpeg_version(output: &str) -> String {
  for line in output.lines() {
    if line.starts_with("ffmpeg version") {
      return line.to_string();
    }
  }
  "Unknown".to_string()
}

/// Извлечь доступные кодеки
fn extract_available_codecs(output: &str) -> Vec<String> {
  let mut codecs = Vec::new();
  let important_codecs = ["h264", "h265", "vp8", "vp9", "av1", "aac", "mp3", "opus"];

  for line in output.lines() {
    for codec in &important_codecs {
      if line.contains(codec) && !codecs.contains(&codec.to_string()) {
        codecs.push(codec.to_string());
      }
    }
  }

  codecs
}

/// Извлечь аппаратные энкодеры
fn extract_hardware_encoders(output: &str) -> Vec<String> {
  let mut encoders = Vec::new();
  let hw_encoders = [
    "h264_nvenc",
    "hevc_nvenc",
    "h264_qsv",
    "hevc_qsv",
    "h264_vaapi",
    "hevc_vaapi",
    "h264_videotoolbox",
    "hevc_videotoolbox",
    "h264_amf",
    "hevc_amf",
  ];

  for line in output.lines() {
    for encoder in &hw_encoders {
      if line.contains(encoder) && !encoders.contains(&encoder.to_string()) {
        encoders.push(encoder.to_string());
      }
    }
  }

  encoders
}
