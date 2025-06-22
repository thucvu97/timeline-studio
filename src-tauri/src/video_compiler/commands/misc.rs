//! Misc - Дополнительные команды
//!
//! Команды, которые не вошли в основные категории

use std::collections::HashMap;
use tauri::State;

use crate::video_compiler::error::{Result, VideoCompilerError};
use crate::video_compiler::preview::PreviewGenerator;
use crate::video_compiler::schema::{
  timeline::{Clip, ClipSource},
  Effect, Filter, StyleTemplate, Subtitle, Template, Track, TrackType,
};

use super::state::VideoCompilerState;

/// Результат предрендеринга
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PrerenderResult {
  pub segment_id: String,
  pub output_path: String,
  pub duration: f64,
  pub size_bytes: u64,
  pub compression_ratio: f64,
}

/// Информация о кэше предрендеринга
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PrerenderCacheInfo {
  pub segments: usize,
  pub total_size: u64,
  pub total_duration: f64,
}

/// Файл кэша предрендеринга
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PrerenderCacheFile {
  pub path: String,
  pub segment_id: String,
  pub duration: f64,
  pub size_bytes: u64,
  pub created_at: String,
}

/// Кадр таймлайна
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TimelineFrame {
  pub timestamp: f64,
  pub frame_data: Vec<u8>,
  pub width: u32,
  pub height: u32,
}

/// Результат кадра субтитров
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct SubtitleFrameResult {
  pub subtitle_id: String,
  pub timestamp: f64,
  pub frame_path: String,
  pub width: u32,
  pub height: u32,
}

/// Запрос на превью
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct PreviewRequest {
  pub video_path: String,
  pub timestamp: f64,
  pub resolution: Option<(u32, u32)>,
  pub quality: Option<u8>,
}

/// Возможности FFmpeg
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct FfmpegCapabilities {
  pub version: String,
  pub hardware_acceleration: HardwareAcceleration,
}

/// Поддержка аппаратного ускорения
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct HardwareAcceleration {
  pub cuda: bool,
  pub nvenc: bool,
  pub qsv: bool,
  pub amf: bool,
  pub videotoolbox: bool,
}

/// Добавить клип в трек
#[tauri::command]
pub async fn add_clip_to_track(
  track_id: String,
  clip: Clip,
  mut project_schema: crate::video_compiler::schema::ProjectSchema,
) -> Result<crate::video_compiler::schema::ProjectSchema> {
  let track = project_schema
    .tracks
    .iter_mut()
    .find(|t| t.id == track_id)
    .ok_or_else(|| {
      VideoCompilerError::InvalidParameter(format!("Track not found: {}", track_id))
    })?;

  track.clips.push(clip);
  track
    .clips
    .sort_by(|a, b| a.start_time.partial_cmp(&b.start_time).unwrap());

  Ok(project_schema)
}

/// Кэшировать метаданные медиафайла
#[tauri::command]
pub async fn cache_media_metadata(
  file_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  // Получаем информацию о файле через FFmpeg
  let ffmpeg_path = state.ffmpeg_path.read().await;
  let output = std::process::Command::new(&*ffmpeg_path)
    .args([
      "-i",
      &file_path,
      "-f",
      "json",
      "-show_format",
      "-show_streams",
    ])
    .output()
    .map_err(|e| VideoCompilerError::MediaFileError {
      path: file_path.clone(),
      reason: e.to_string(),
    })?;

  let metadata = String::from_utf8_lossy(&output.stdout);
  let metadata_json: serde_json::Value =
    serde_json::from_str(&metadata).unwrap_or_else(|_| serde_json::json!({}));

  // Добавляем в кэш
  let mut cache = state.cache_manager.write().await;
  let metadata = crate::video_compiler::cache::MediaMetadata {
    file_path: file_path.clone(),
    file_size: 0,
    modified_time: std::time::SystemTime::now(),
    duration: 0.0,
    resolution: None,
    fps: None,
    bitrate: None,
    video_codec: None,
    audio_codec: None,
    cached_at: std::time::SystemTime::now(),
  };
  cache.store_metadata(file_path, metadata).await?;

  Ok(metadata_json)
}

/// Проверить возможности FFmpeg
#[tauri::command]
pub async fn check_ffmpeg_capabilities(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let ffmpeg_path = state.ffmpeg_path.read().await;
  let output = std::process::Command::new(&*ffmpeg_path)
    .args(["-version"])
    .output()
    .map_err(|e| VideoCompilerError::DependencyMissing(format!("FFmpeg not found: {}", e)))?;

  let version = String::from_utf8_lossy(&output.stdout);
  let has_cuda = version.contains("--enable-cuda");
  let has_nvenc = version.contains("--enable-nvenc");
  let has_qsv = version.contains("--enable-libmfx");
  let has_amf = version.contains("--enable-amf");
  let has_videotoolbox = version.contains("--enable-videotoolbox");

  Ok(serde_json::json!({
    "version": version.lines().next().unwrap_or("Unknown"),
    "hardware_acceleration": {
      "cuda": has_cuda,
      "nvenc": has_nvenc,
      "qsv": has_qsv,
      "amf": has_amf,
      "videotoolbox": has_videotoolbox,
    }
  }))
}

/// Проверить доступность GPU кодировщика
#[tauri::command]
pub async fn check_gpu_encoder_availability(
  encoder: String,
  state: State<'_, VideoCompilerState>,
) -> Result<bool> {
  let ffmpeg_path = state.ffmpeg_path.read().await;
  let output = std::process::Command::new(&*ffmpeg_path)
    .args(["-encoders"])
    .output()
    .map_err(|e| VideoCompilerError::DependencyMissing(format!("FFmpeg not found: {}", e)))?;

  let encoders = String::from_utf8_lossy(&output.stdout);
  Ok(encoders.contains(&encoder))
}

/// Проверить поддержку аппаратного ускорения (альтернативная версия)
#[tauri::command]
pub async fn check_hardware_acceleration(state: State<'_, VideoCompilerState>) -> Result<bool> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let detector = crate::video_compiler::gpu::GpuDetector::new(ffmpeg_path);
  let encoders = detector.detect_available_encoders().await?;
  Ok(!encoders.is_empty())
}

/// Проверить таймауты задач рендеринга
#[tauri::command]
pub async fn check_render_job_timeouts(
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let mut timed_out_jobs = Vec::new();
  let active_jobs = state.active_jobs.read().await;

  for (job_id, job) in active_jobs.iter() {
    // Проверяем метаданные задачи
    let elapsed = job
      .metadata
      .created_at
      .parse::<chrono::DateTime<chrono::Utc>>()
      .map(|created| {
        chrono::Utc::now()
          .signed_duration_since(created)
          .num_seconds()
      })
      .unwrap_or(0);
    // Считаем, что задача зависла, если она выполняется более 6 часов
    if elapsed > 21600 {
      timed_out_jobs.push(job_id.clone());
    }
  }

  Ok(timed_out_jobs)
}

/// Очистить кэш (общая функция)
#[tauri::command]
pub async fn cleanup_cache(
  _max_age_days: u32,
  state: State<'_, VideoCompilerState>,
) -> Result<u64> {
  let mut cache = state.cache_manager.write().await;
  cache.cleanup_old_entries().await?;
  let bytes_freed = 0u64;
  Ok(bytes_freed)
}

/// Очистить кэш (упрощенная версия)
#[tauri::command]
pub async fn clear_cache(state: State<'_, VideoCompilerState>) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.clear_all().await;
  Ok(())
}

/// Очистить кэш превью файлов
#[tauri::command]
pub async fn clear_file_preview_cache(
  _file_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.clear_previews().await;
  Ok(())
}

/// Очистить кэш кадров
#[tauri::command]
pub async fn clear_frame_cache(
  _project_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.clear_previews().await;
  Ok(())
}

/// Очистить кэш предрендеринга
#[tauri::command]
pub async fn clear_prerender_cache(
  _project_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let mut cache = state.cache_manager.write().await;
  cache.clear_all().await;
  Ok(())
}

/// Настроить кэш
#[tauri::command]
pub async fn configure_cache(
  config: serde_json::Value,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  let mut settings = state.settings.write().await;

  if let Some(size_mb) = config.get("size_mb").and_then(|v| v.as_u64()) {
    settings.cache_size_mb = size_mb as usize;
  }

  if let Some(preview_quality) = config.get("preview_quality").and_then(|v| v.as_u64()) {
    settings.preview_quality = preview_quality as u8;
  }

  Ok(())
}

/// Создать клип
#[tauri::command]
pub async fn create_clip(source_path: String, start_time: f64, end_time: f64) -> Result<Clip> {
  use crate::video_compiler::schema::timeline::ClipProperties;

  Ok(Clip {
    id: uuid::Uuid::new_v4().to_string(),
    source: ClipSource::File(source_path),
    start_time,
    end_time,
    source_start: 0.0,
    source_end: end_time - start_time,
    speed: 1.0,
    opacity: 1.0,
    effects: vec![],
    filters: vec![],
    template_id: None,
    template_position: None,
    color_correction: None,
    crop: None,
    transform: None,
    audio_track_index: None,
    properties: ClipProperties {
      notes: None,
      tags: vec![],
      custom_metadata: std::collections::HashMap::new(),
    },
  })
}

/// Создать эффект
#[tauri::command]
pub async fn create_effect(
  effect_type: String,
  _parameters: HashMap<String, serde_json::Value>,
) -> Result<Effect> {
  use crate::video_compiler::schema::effects::EffectType;

  // Упрощенная реализация - создаем эффект размытия
  let effect_type_enum = match effect_type.as_str() {
    "blur" => EffectType::Blur,
    "brightness" => EffectType::Brightness,
    "contrast" => EffectType::Contrast,
    _ => EffectType::Blur, // По умолчанию
  };

  Ok(Effect {
    id: uuid::Uuid::new_v4().to_string(),
    effect_type: effect_type_enum,
    name: effect_type.clone(),
    category: None,
    complexity: None,
    tags: vec![],
    description: None,
    labels: None,
    enabled: true,
    parameters: HashMap::new(),
    start_time: None,
    end_time: None,
    ffmpeg_command: None,
    css_filter: None,
    preview_path: None,
    presets: None,
  })
}

/// Создать фильтр
#[tauri::command]
pub async fn create_filter(
  filter_type: String,
  _parameters: HashMap<String, serde_json::Value>,
) -> Result<Filter> {
  use crate::video_compiler::schema::effects::FilterType;

  let filter_type_enum = match filter_type.as_str() {
    "brightness" => FilterType::Brightness,
    "contrast" => FilterType::Contrast,
    "saturation" => FilterType::Saturation,
    "hue" => FilterType::Hue,
    "blur" => FilterType::Blur,
    _ => FilterType::Brightness, // По умолчанию
  };

  Ok(Filter {
    id: uuid::Uuid::new_v4().to_string(),
    filter_type: filter_type_enum,
    name: filter_type.clone(),
    enabled: true,
    parameters: HashMap::new(),
    ffmpeg_command: None,
    intensity: 1.0,
    custom_filter: None,
  })
}

/// Создать новый проект
#[tauri::command]
pub async fn create_new_project(
  name: String,
  resolution: (u32, u32),
  fps: u32,
) -> Result<crate::video_compiler::schema::ProjectSchema> {
  use crate::video_compiler::schema::*;

  Ok(ProjectSchema {
    version: "1.0".to_string(),
    metadata: ProjectMetadata {
      name,
      description: Some(String::new()),
      author: Some(String::new()),
      created_at: chrono::Utc::now(),
      modified_at: chrono::Utc::now(),
    },
    timeline: Timeline {
      duration: 0.0,
      fps,
      resolution,
      sample_rate: 48000,
      aspect_ratio: AspectRatio::default(),
    },
    tracks: vec![],
    effects: vec![],
    transitions: vec![],
    filters: vec![],
    templates: vec![],
    style_templates: vec![],
    subtitles: vec![],
    settings: ProjectSettings::default(),
  })
}

/// Создать стилевой шаблон
#[tauri::command]
pub async fn create_style_template(name: String, template_type: String) -> Result<StyleTemplate> {
  use crate::video_compiler::schema::templates::{StyleTemplateCategory, StyleTemplateStyle};

  let category = match template_type.as_str() {
    "intro" => StyleTemplateCategory::Intro,
    "outro" => StyleTemplateCategory::Outro,
    "title" => StyleTemplateCategory::Title,
    _ => StyleTemplateCategory::LowerThird,
  };

  Ok(StyleTemplate {
    id: uuid::Uuid::new_v4().to_string(),
    name,
    category,
    style: StyleTemplateStyle::Modern,
    duration: 3.0,
    elements: vec![],
    background_color: "#000000".to_string(),
    transitions: vec![],
  })
}

/// Создать субтитр
#[tauri::command]
pub async fn create_subtitle(text: String, start_time: f64, end_time: f64) -> Result<Subtitle> {
  use crate::video_compiler::schema::subtitles::{
    SubtitleFontWeight, SubtitlePosition, SubtitleStyle,
  };

  Ok(Subtitle {
    id: uuid::Uuid::new_v4().to_string(),
    text,
    start_time,
    end_time,
    position: SubtitlePosition::default(),
    style: SubtitleStyle::default(),
    enabled: true,
    animations: vec![],
    font_family: "Arial".to_string(),
    font_size: 24.0,
    color: "#FFFFFF".to_string(),
    opacity: 1.0,
    font_weight: SubtitleFontWeight::Normal,
    shadow: false,
    outline: false,
    duration: end_time - start_time,
  })
}

/// Создать анимацию субтитров
#[tauri::command]
pub async fn create_subtitle_animation(
  subtitle_id: String,
  animation_type: String,
  parameters: HashMap<String, serde_json::Value>,
) -> Result<serde_json::Value> {
  Ok(serde_json::json!({
    "subtitle_id": subtitle_id,
    "animation": {
      "type": animation_type,
      "parameters": parameters,
      "duration": 0.5,
    }
  }))
}

/// Создать шаблон
#[tauri::command]
pub async fn create_template(
  name: String,
  layout_type: String,
  _positions: Vec<serde_json::Value>,
) -> Result<Template> {
  use crate::video_compiler::schema::templates::TemplateType;

  let template_type = match layout_type.as_str() {
    "vertical" => TemplateType::Vertical,
    "horizontal" => TemplateType::Horizontal,
    "grid" => TemplateType::Grid,
    _ => TemplateType::Custom,
  };

  Ok(Template {
    id: uuid::Uuid::new_v4().to_string(),
    template_type,
    name,
    screens: 2,
    cells: vec![],
    regions: vec![],
  })
}

/// Создать трек
#[tauri::command]
pub async fn create_track(name: String, track_type: TrackType) -> Result<Track> {
  Ok(Track {
    id: uuid::Uuid::new_v4().to_string(),
    track_type,
    name,
    clips: vec![],
    enabled: true,
    locked: false,
    volume: 1.0,
    effects: vec![],
    filters: vec![],
  })
}

/// Извлечь кадры субтитров
#[tauri::command]
pub async fn extract_subtitle_frames(
  project_schema: crate::video_compiler::schema::ProjectSchema,
  output_dir: String,
  _state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let mut frame_paths = Vec::new();

  for subtitle in &project_schema.subtitles {
    let frame_path = format!("{}/subtitle_{}.png", output_dir, subtitle.id);
    // Здесь должна быть логика генерации кадра с субтитром
    frame_paths.push(frame_path);
  }

  Ok(frame_paths)
}

/// Извлечь кадры таймлайна
#[tauri::command]
pub async fn extract_timeline_frames(
  project_schema: crate::video_compiler::schema::ProjectSchema,
  interval: f64,
  output_dir: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let mut frame_paths = Vec::new();
  let duration = project_schema.timeline.duration;
  let mut timestamp = 0.0;

  while timestamp <= duration {
    let frame_path = format!("{}/frame_{:.2}.png", output_dir, timestamp);

    // Генерируем кадр
    let ffmpeg_path = state.ffmpeg_path.read().await.clone();
    let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);
    generator
      .generate_frame(&project_schema, timestamp, &frame_path, None)
      .await?;

    frame_paths.push(frame_path);
    timestamp += interval;
  }

  Ok(frame_paths)
}

/// Генерировать превью (альтернативная версия)
#[tauri::command]
pub async fn generate_preview(
  project_schema: crate::video_compiler::schema::ProjectSchema,
  timestamp: f64,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);
  generator
    .generate_frame(&project_schema, timestamp, &output_path, None)
    .await?;

  Ok(output_path)
}

/// Генерировать пакет превью
#[tauri::command]
pub async fn generate_preview_batch(
  project_schema: crate::video_compiler::schema::ProjectSchema,
  timestamps: Vec<f64>,
  output_dir: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<String>> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);
  let mut paths = Vec::new();

  for timestamp in timestamps {
    let output_path = format!("{}/preview_{:.2}.png", output_dir, timestamp);
    generator
      .generate_frame(&project_schema, timestamp, &output_path, None)
      .await?;
    paths.push(output_path);
  }

  Ok(paths)
}

/// Генерировать превью с настройками
#[tauri::command]
pub async fn generate_preview_with_settings(
  project_schema: crate::video_compiler::schema::ProjectSchema,
  timestamp: f64,
  output_path: String,
  settings: serde_json::Value,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let generator = PreviewGenerator::new_with_ffmpeg(ffmpeg_path);

  // Извлекаем настройки
  let width = settings
    .get("width")
    .and_then(|v| v.as_u64())
    .unwrap_or(1920) as u32;
  let height = settings
    .get("height")
    .and_then(|v| v.as_u64())
    .unwrap_or(1080) as u32;
  let quality = settings
    .get("quality")
    .and_then(|v| v.as_u64())
    .unwrap_or(80) as u8;

  let options = crate::video_compiler::preview::PreviewOptions {
    width: Some(width),
    height: Some(height),
    quality,
    format: "png".to_string(),
  };

  generator
    .generate_frame(&project_schema, timestamp, &output_path, Some(options))
    .await?;

  Ok(output_path)
}

/// Получить активные задачи
#[tauri::command]
pub async fn get_active_jobs(state: State<'_, VideoCompilerState>) -> Result<Vec<String>> {
  let active_jobs = state.active_jobs.read().await;
  Ok(active_jobs.keys().cloned().collect())
}

/// Получить использование памяти кэшем
#[tauri::command]
pub async fn get_cache_memory_usage(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let cache = state.cache_manager.read().await;
  let usage = cache.get_memory_usage();

  Ok(serde_json::json!({
    "total_bytes": usage.total_bytes,
    "preview_bytes": usage.preview_bytes,
    "metadata_bytes": usage.metadata_bytes,
    "render_bytes": usage.render_bytes,
  }))
}

/// Получить кэшированные метаданные
#[tauri::command]
pub async fn get_cached_metadata(
  file_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<Option<serde_json::Value>> {
  let mut cache = state.cache_manager.write().await;
  Ok(cache.get_metadata(&file_path).await.map(|m| {
    serde_json::json!({
      "duration": m.duration,
      "resolution": m.resolution,
      "fps": m.fps,
      "bitrate": m.bitrate,
      "video_codec": m.video_codec,
      "audio_codec": m.audio_codec,
    })
  }))
}

/// Получить информацию о текущем GPU
#[tauri::command]
pub async fn get_current_gpu_info(
  state: State<'_, VideoCompilerState>,
) -> Result<Option<crate::video_compiler::gpu::GpuInfo>> {
  let settings = state.settings.read().await;
  if settings.hardware_acceleration {
    let ffmpeg_path = state.ffmpeg_path.read().await.clone();
    let detector = crate::video_compiler::gpu::GpuDetector::new(ffmpeg_path);
    let encoder = detector.get_recommended_encoder().await?;

    Ok(encoder.map(|enc| crate::video_compiler::gpu::GpuInfo {
      name: format!("{:?} Encoder", enc),
      driver_version: None,
      memory_total: None,
      memory_used: None,
      utilization: None,
      encoder_type: enc,
      supported_codecs: vec!["h264".to_string(), "hevc".to_string()],
    }))
  } else {
    Ok(None)
  }
}

/// Получить информацию о кэше извлечения кадров
#[tauri::command]
pub async fn get_frame_extraction_cache_info(
  project_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let _cache = state.cache_manager.read().await;
  // Заглушка для несуществующего метода
  let _info = &project_id;

  Ok(serde_json::json!({
    "project_id": project_id,
    "frame_count": 0,
    "total_size": 0,
    "last_accessed": chrono::Utc::now().to_rfc3339(),
  }))
}

/// Получить информацию о GPU (альтернативная версия)
#[tauri::command]
pub async fn get_gpu_info(
  state: State<'_, VideoCompilerState>,
) -> Result<Vec<crate::video_compiler::gpu::GpuInfo>> {
  super::gpu::detect_gpus(state).await
}

/// Получить информацию об источниках входных данных
#[tauri::command]
pub async fn get_input_sources_info(
  project_schema: crate::video_compiler::schema::ProjectSchema,
) -> Result<serde_json::Value> {
  let mut sources = HashMap::new();

  for track in &project_schema.tracks {
    for clip in &track.clips {
      let path = match &clip.source {
        ClipSource::File(path) => path.clone(),
        _ => continue,
      };
      sources.entry(path.clone()).or_insert_with(|| {
        serde_json::json!({
          "track_id": track.id,
          "clip_count": 0,
          "total_duration": 0.0,
        })
      });

      if let Some(source_info) = sources.get_mut(&path) {
        if let Some(count) = source_info.get("clip_count").and_then(|v| v.as_u64()) {
          source_info["clip_count"] = serde_json::json!(count + 1);
        }
        if let Some(duration) = source_info.get("total_duration").and_then(|v| v.as_f64()) {
          source_info["total_duration"] =
            serde_json::json!(duration + (clip.end_time - clip.start_time));
        }
      }
    }
  }

  Ok(serde_json::json!({
    "sources": sources,
    "total_sources": sources.len(),
  }))
}

/// Получить информацию о кэше предрендеринга
#[tauri::command]
pub async fn get_prerender_cache_info(
  project_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let _cache = state.cache_manager.read().await;
  // Заглушка для несуществующего метода
  let _info = &project_id;

  Ok(serde_json::json!({
    "project_id": project_id,
    "segments": 0,
    "total_size": 0,
    "total_duration": 0.0,
  }))
}

/// Получить рекомендуемый GPU кодировщик
#[tauri::command]
pub async fn get_recommended_gpu_encoder(
  state: State<'_, VideoCompilerState>,
) -> Result<Option<String>> {
  let ffmpeg_path = state.ffmpeg_path.read().await.clone();
  let detector = crate::video_compiler::gpu::GpuDetector::new(ffmpeg_path);
  let encoder = detector.get_recommended_encoder().await?;
  Ok(encoder.map(|e| format!("{:?}", e)))
}

/// Получить информацию о кэше рендеринга
#[tauri::command]
pub async fn get_render_cache_info(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let cache = state.cache_manager.read().await;
  let usage = cache.get_memory_usage();

  Ok(serde_json::json!({
    "render_cache_size": usage.render_bytes,
    "total_cache_size": usage.total_bytes,
    "cache_hit_rate": cache.get_stats().hit_ratio(),
  }))
}

/// Получить прогресс рендеринга
#[tauri::command]
pub async fn get_render_progress(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<f64> {
  let active_jobs = state.active_jobs.read().await;

  if let Some(_job) = active_jobs.get(&job_id) {
    // Заглушка для отсутствующего поля progress
    Ok(0.0)
  } else {
    Err(VideoCompilerError::RenderError {
      job_id,
      stage: "progress".to_string(),
      message: "Job not found".to_string(),
    })
  }
}

/// Получить статистику рендеринга
#[tauri::command]
pub async fn get_render_statistics(
  job_id: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let active_jobs = state.active_jobs.read().await;

  if let Some(job) = active_jobs.get(&job_id) {
    Ok(serde_json::json!({
      "job_id": job_id,
      "progress": 0.0,
      "status": "running",
      "start_time": job.metadata.created_at,
      "frames_processed": 0,
      "frames_total": 100,
      "current_fps": 0.0,
      "eta_seconds": 0,
    }))
  } else {
    Err(VideoCompilerError::RenderError {
      job_id,
      stage: "statistics".to_string(),
      message: "Job not found".to_string(),
    })
  }
}

/// Получить информацию о видео
#[tauri::command]
pub async fn get_video_info(
  file_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  let ffmpeg_path = state.ffmpeg_path.read().await;
  let output = std::process::Command::new(&*ffmpeg_path)
    .args([
      "-i",
      &file_path,
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_format",
      "-show_streams",
    ])
    .output()
    .map_err(|e| VideoCompilerError::MediaFileError {
      path: file_path.clone(),
      reason: e.to_string(),
    })?;

  let info = String::from_utf8_lossy(&output.stdout);
  let info_json: serde_json::Value = serde_json::from_str(&info)
    .map_err(|e| VideoCompilerError::SerializationError(e.to_string()))?;

  Ok(info_json)
}

/// Предварительно отрендерить сегмент
#[tauri::command]
pub async fn prerender_segment(
  project_schema: crate::video_compiler::schema::ProjectSchema,
  start_time: f64,
  end_time: f64,
  output_path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<String> {
  use crate::video_compiler::renderer::VideoRenderer;

  // Создаем временный проект только с нужным сегментом
  let mut segment_project = project_schema.clone();
  segment_project.timeline.duration = end_time - start_time;

  // Фильтруем клипы
  for track in &mut segment_project.tracks {
    track
      .clips
      .retain(|clip| clip.start_time < end_time && clip.end_time > start_time);

    // Корректируем времена клипов
    for clip in &mut track.clips {
      if clip.start_time < start_time {
        clip.source_start += start_time - clip.start_time;
        clip.start_time = 0.0;
      } else {
        clip.start_time -= start_time;
      }

      if clip.end_time > end_time {
        clip.end_time = end_time - start_time;
      } else {
        clip.end_time -= start_time;
      }
    }
  }

  // Создаем рендерер
  let (progress_tx, _progress_rx) = tokio::sync::mpsc::unbounded_channel();

  let mut renderer = VideoRenderer::new(
    segment_project.clone(),
    state.settings.clone(),
    state.cache_manager.clone(),
    progress_tx,
  )
  .await?;

  // Рендерим сегмент
  let _job_id = uuid::Uuid::new_v4().to_string();
  renderer.render(std::path::Path::new(&output_path)).await?;

  Ok(output_path)
}

/// Установить путь к FFmpeg для превью
#[tauri::command]
pub async fn set_preview_ffmpeg_path(
  path: String,
  state: State<'_, VideoCompilerState>,
) -> Result<()> {
  // Проверяем путь
  let output = std::process::Command::new(&path)
    .arg("-version")
    .output()
    .map_err(|e| VideoCompilerError::InvalidParameter(format!("Invalid FFmpeg path: {}", e)))?;

  if !output.status.success() {
    return Err(VideoCompilerError::InvalidParameter(
      "Invalid FFmpeg executable".to_string(),
    ));
  }

  // Обновляем путь
  let mut ffmpeg_path = state.ffmpeg_path.write().await;
  *ffmpeg_path = path;

  Ok(())
}

/// Обновить время доступа к проекту
#[tauri::command]
pub async fn touch_project(project_id: String, state: State<'_, VideoCompilerState>) -> Result<()> {
  let _cache = state.cache_manager.write().await;
  // Заглушка для несуществующего метода
  let _project_id = &project_id;
  Ok(())
}

/// Тестовая команда для проверки различных типов ошибок
#[tauri::command]
pub async fn test_error_types(error_type: String) -> Result<String> {
  match error_type.as_str() {
    "io" => Err(VideoCompilerError::io("Test IO error")),
    "gpu_unavailable" => Err(VideoCompilerError::gpu_unavailable("Test GPU unavailable")),
    "validation" => Err(VideoCompilerError::ValidationError(
      "Test validation error".to_string(),
    )),
    _ => Ok(format!("No error handler for type: {}", error_type)),
  }
}

/// Эмитировать события Video Compiler для тестирования
#[tauri::command]
pub async fn emit_video_compiler_event(
  app: tauri::AppHandle,
  event_type: String,
  params: serde_json::Value,
) -> Result<()> {
  use crate::video_compiler::{progress::RenderProgress, VideoCompilerEvent};
  use tauri::Emitter;

  let event = match event_type.as_str() {
    "render_progress" => {
      let job_id = params
        .get("job_id")
        .and_then(|v| v.as_str())
        .unwrap_or("test-job")
        .to_string();
      let progress = RenderProgress {
        job_id: job_id.clone(),
        stage: params
          .get("stage")
          .and_then(|v| v.as_str())
          .unwrap_or("processing")
          .to_string(),
        percentage: params
          .get("percentage")
          .and_then(|v| v.as_f64())
          .unwrap_or(50.0) as f32,
        current_frame: params
          .get("current_frame")
          .and_then(|v| v.as_u64())
          .unwrap_or(100),
        total_frames: params
          .get("total_frames")
          .and_then(|v| v.as_u64())
          .unwrap_or(200),
        elapsed_time: std::time::Duration::from_secs(
          params
            .get("elapsed_seconds")
            .and_then(|v| v.as_u64())
            .unwrap_or(0),
        ),
        estimated_remaining: params
          .get("eta_seconds")
          .and_then(|v| v.as_u64())
          .map(std::time::Duration::from_secs),
        status: crate::video_compiler::progress::RenderStatus::Processing,
        message: params
          .get("message")
          .and_then(|v| v.as_str())
          .map(String::from),
      };
      VideoCompilerEvent::RenderProgress { job_id, progress }
    }
    "render_completed" => {
      let job_id = params
        .get("job_id")
        .and_then(|v| v.as_str())
        .unwrap_or("test-job")
        .to_string();
      let output_path = params
        .get("output_path")
        .and_then(|v| v.as_str())
        .unwrap_or("/tmp/output.mp4")
        .to_string();
      VideoCompilerEvent::RenderCompleted {
        job_id,
        output_path,
      }
    }
    "render_failed" => {
      let job_id = params
        .get("job_id")
        .and_then(|v| v.as_str())
        .unwrap_or("test-job")
        .to_string();
      let error = params
        .get("error")
        .and_then(|v| v.as_str())
        .unwrap_or("Test error")
        .to_string();
      VideoCompilerEvent::RenderFailed { job_id, error }
    }
    "preview_generated" => {
      let timestamp = params
        .get("timestamp")
        .and_then(|v| v.as_f64())
        .unwrap_or(0.0);
      let image_data = vec![0u8; 1024]; // Test data
      VideoCompilerEvent::PreviewGenerated {
        timestamp,
        image_data,
      }
    }
    "cache_updated" => {
      let cache_size_mb = params
        .get("cache_size_mb")
        .and_then(|v| v.as_f64())
        .unwrap_or(100.0);
      VideoCompilerEvent::CacheUpdated { cache_size_mb }
    }
    _ => {
      return Err(VideoCompilerError::InvalidParameter(format!(
        "Unknown event type: {}",
        event_type
      )));
    }
  };

  app
    .emit("video-compiler", &event)
    .map_err(|e| VideoCompilerError::InternalError(format!("Failed to emit event: {}", e)))?;

  Ok(())
}

/// Проверить здоровье всех сервисов
#[tauri::command]
pub async fn health_check_all_services(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  state.services.health_check_all().await?;

  Ok(serde_json::json!({
    "status": "healthy",
    "services": {
      "render": "ok",
      "cache": "ok",
      "gpu": "ok",
      "preview": "ok",
      "ffmpeg": "ok",
    }
  }))
}

/// Выключить все сервисы
#[tauri::command]
pub async fn shutdown_all_services(state: State<'_, VideoCompilerState>) -> Result<()> {
  state.services.shutdown_all().await
}

/// Получить информацию о проектном сервисе
#[tauri::command]
pub async fn get_project_service_info(
  state: State<'_, VideoCompilerState>,
) -> Result<serde_json::Value> {
  if let Some(_project_service) = state.services.get_project_service() {
    // Сервис существует
    Ok(serde_json::json!({
      "available": true,
      "service_name": "ProjectService",
    }))
  } else {
    Ok(serde_json::json!({
      "available": false,
      "service_name": "ProjectService",
    }))
  }
}
