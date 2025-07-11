//! Бизнес-логика для команд работы со схемой

use super::types::*;
use crate::video_compiler::{
  error::{Result, VideoCompilerError},
  schema::{
    timeline::{Clip, ClipProperties, ClipSource},
    Effect, Filter, ProjectSchema, StyleTemplate, Subtitle, Template, Track, TrackType,
  },
};
use std::collections::HashMap;

/// Создать новый клип с параметрами
pub fn create_clip_with_params(params: &ClipCreationParams) -> Clip {
  Clip {
    id: uuid::Uuid::new_v4().to_string(),
    source: ClipSource::File(params.source_path.clone()),
    start_time: params.start_time,
    end_time: params.end_time,
    source_start: 0.0,
    source_end: params.end_time - params.start_time,
    speed: params.speed.unwrap_or(1.0),
    opacity: params.opacity.unwrap_or(1.0) as f32,
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
      custom_metadata: HashMap::new(),
    },
  }
}

/// Создать эффект с параметрами
pub fn create_effect_with_params(params: &EffectCreationParams) -> Effect {
  use crate::video_compiler::schema::effects::EffectType;

  let effect_type_enum = match params.effect_type.as_str() {
    "blur" => EffectType::Blur,
    "brightness" => EffectType::Brightness,
    "contrast" => EffectType::Contrast,
    "speed" => EffectType::Speed,
    "reverse" => EffectType::Reverse,
    "grayscale" => EffectType::Grayscale,
    "sepia" => EffectType::Sepia,
    "saturation" => EffectType::Saturation,
    "hue_rotate" => EffectType::HueRotate,
    "vintage" => EffectType::Vintage,
    _ => EffectType::Blur, // По умолчанию
  };

  Effect {
    id: uuid::Uuid::new_v4().to_string(),
    effect_type: effect_type_enum,
    name: params
      .name
      .clone()
      .unwrap_or_else(|| params.effect_type.clone()),
    category: None,
    complexity: None,
    tags: vec![],
    description: None,
    labels: None,
    enabled: params.enabled.unwrap_or(true),
    parameters: HashMap::new(), // TODO: Convert from serde_json::Value to EffectParameter
    start_time: None,
    end_time: None,
    ffmpeg_command: None,
    css_filter: None,
    preview_path: None,
    presets: None,
  }
}

/// Создать фильтр с параметрами
pub fn create_filter_with_params(params: &FilterCreationParams) -> Filter {
  use crate::video_compiler::schema::effects::FilterType;

  let filter_type_enum = match params.filter_type.as_str() {
    "brightness" => FilterType::Brightness,
    "contrast" => FilterType::Contrast,
    "saturation" => FilterType::Saturation,
    "hue" => FilterType::Hue,
    "blur" => FilterType::Blur,
    "sharpen" => FilterType::Sharpen,
    "vignette" => FilterType::Vignette,
    "grain" => FilterType::Grain,
    "glow" => FilterType::Glow,
    "shadows_highlights" => FilterType::ShadowsHighlights,
    _ => FilterType::Custom,
  };

  Filter {
    id: uuid::Uuid::new_v4().to_string(),
    filter_type: filter_type_enum,
    name: params
      .name
      .clone()
      .unwrap_or_else(|| params.filter_type.clone()),
    enabled: params.enabled.unwrap_or(true),
    parameters: HashMap::new(), // TODO: Convert from serde_json::Value to f64
    ffmpeg_command: None,
    intensity: params.intensity.unwrap_or(1.0) as f32,
    custom_filter: None,
  }
}

/// Создать стилевой шаблон с параметрами
pub fn create_style_template_with_params(params: &StyleTemplateCreationParams) -> StyleTemplate {
  use crate::video_compiler::schema::templates::{StyleTemplateCategory, StyleTemplateStyle};

  let template_category = match params.category.as_str() {
    "intro" => StyleTemplateCategory::Intro,
    "outro" => StyleTemplateCategory::Outro,
    "title" => StyleTemplateCategory::Title,
    "lower_third" => StyleTemplateCategory::LowerThird,
    "transition" => StyleTemplateCategory::Transition,
    "overlay" => StyleTemplateCategory::Overlay,
    _ => StyleTemplateCategory::Overlay,
  };

  let template_style = match params.style.as_deref() {
    Some("modern") => StyleTemplateStyle::Modern,
    Some("minimal") => StyleTemplateStyle::Minimal,
    Some("vintage") => StyleTemplateStyle::Vintage,
    Some("corporate") => StyleTemplateStyle::Corporate,
    Some("creative") => StyleTemplateStyle::Creative,
    Some("cinematic") => StyleTemplateStyle::Cinematic,
    _ => StyleTemplateStyle::Modern,
  };

  StyleTemplate {
    id: uuid::Uuid::new_v4().to_string(),
    name: params.name.clone(),
    category: template_category,
    style: template_style,
    duration: params.duration.unwrap_or(5.0),
    elements: vec![],
    background_color: params
      .background_color
      .clone()
      .unwrap_or_else(|| "#000000".to_string()),
    transitions: vec![],
  }
}

/// Создать субтитры с параметрами
pub fn create_subtitle_with_params(params: &SubtitleCreationParams) -> Subtitle {
  let duration = params.end_time - params.start_time;

  Subtitle {
    id: uuid::Uuid::new_v4().to_string(),
    text: params.text.clone(),
    start_time: params.start_time,
    end_time: params.end_time,
    position: crate::video_compiler::schema::subtitles::SubtitlePosition::default(),
    style: crate::video_compiler::schema::subtitles::SubtitleStyle::default(),
    enabled: true,
    animations: vec![],
    font_family: params
      .font_family
      .clone()
      .unwrap_or_else(|| "Arial".to_string()),
    font_size: params.font_size.unwrap_or(24.0) as f32,
    color: params
      .color
      .clone()
      .unwrap_or_else(|| "#FFFFFF".to_string()),
    opacity: 1.0,
    font_weight: crate::video_compiler::schema::subtitles::SubtitleFontWeight::Normal,
    shadow: true,
    outline: true,
    duration,
  }
}

/// Создать анимацию субтитров с параметрами
pub fn create_subtitle_animation_with_params(
  params: &SubtitleAnimationParams,
) -> crate::video_compiler::schema::subtitles::SubtitleAnimation {
  use crate::video_compiler::schema::subtitles::{
    SubtitleAnimation, SubtitleAnimationType, SubtitleEasing,
  };

  let anim_type = match params.animation_type.as_str() {
    "fade_in" => SubtitleAnimationType::FadeIn,
    "fade_out" => SubtitleAnimationType::FadeOut,
    "slide_in" => SubtitleAnimationType::SlideIn,
    "slide_out" => SubtitleAnimationType::SlideOut,
    "scale_in" => SubtitleAnimationType::ScaleIn,
    "scale_out" => SubtitleAnimationType::ScaleOut,
    "typewriter" => SubtitleAnimationType::Typewriter,
    "wave" => SubtitleAnimationType::Wave,
    "bounce" => SubtitleAnimationType::Bounce,
    "shake" => SubtitleAnimationType::Shake,
    "blink" => SubtitleAnimationType::Blink,
    "dissolve" => SubtitleAnimationType::Dissolve,
    "scale" => SubtitleAnimationType::Scale,
    _ => SubtitleAnimationType::FadeIn,
  };

  let easing_type = match params.easing.as_deref() {
    Some("linear") => SubtitleEasing::Linear,
    Some("ease_in") => SubtitleEasing::EaseIn,
    Some("ease_out") => SubtitleEasing::EaseOut,
    Some("ease_in_out") => SubtitleEasing::EaseInOut,
    _ => SubtitleEasing::EaseInOut,
  };

  let mut animation = SubtitleAnimation::new(anim_type, params.duration);
  animation.delay = params.delay.unwrap_or(0.0);
  animation.easing = easing_type;

  if let Some(ref properties) = params.properties {
    animation.properties = properties.clone();
  }

  animation
}

/// Создать трек с параметрами
pub fn create_track_with_params(params: &TrackCreationParams) -> Track {
  let track_type_enum = match params.track_type.as_str() {
    "video" => TrackType::Video,
    "audio" => TrackType::Audio,
    "subtitle" => TrackType::Subtitle,
    _ => TrackType::Video,
  };

  Track {
    id: uuid::Uuid::new_v4().to_string(),
    name: params.name.clone(),
    track_type: track_type_enum,
    enabled: params.enabled.unwrap_or(true),
    volume: params.volume.unwrap_or(1.0) as f32,
    locked: false,
    clips: vec![],
    effects: vec![],
    filters: vec![],
  }
}

/// Создать шаблон с параметрами
pub fn create_template_with_params(params: &TemplateCreationParams) -> Template {
  use crate::video_compiler::schema::templates::TemplateType;

  let template_type = match params.template_type.as_str() {
    "vertical" => TemplateType::Vertical,
    "horizontal" => TemplateType::Horizontal,
    "diagonal" => TemplateType::Diagonal,
    "grid" => TemplateType::Grid,
    _ => TemplateType::Custom,
  };

  Template {
    id: uuid::Uuid::new_v4().to_string(),
    template_type,
    name: params.name.clone(),
    screens: params.screens,
    cells: vec![],
    regions: vec![],
  }
}

/// Добавить клип в трек
pub fn add_clip_to_track_by_id(
  project: &mut ProjectSchema,
  track_id: &str,
  clip: Clip,
) -> Result<()> {
  let track = project
    .tracks
    .iter_mut()
    .find(|t| t.id == track_id)
    .ok_or_else(|| VideoCompilerError::InvalidParameter(format!("Track not found: {track_id}")))?;

  track.clips.push(clip);
  track
    .clips
    .sort_by(|a, b| a.start_time.partial_cmp(&b.start_time).unwrap());

  Ok(())
}

/// Добавить анимацию к субтитрам
pub fn add_animation_to_subtitle(
  project: &mut ProjectSchema,
  subtitle_id: &str,
  animation: crate::video_compiler::schema::subtitles::SubtitleAnimation,
) -> Result<()> {
  for subtitle in &mut project.subtitles {
    if subtitle.id == subtitle_id {
      subtitle.animations.push(animation);
      return Ok(());
    }
  }

  Err(VideoCompilerError::InvalidParameter(format!(
    "Subtitle not found: {subtitle_id}"
  )))
}

/// Получить статистику элементов схемы
pub fn get_schema_element_stats(project: &ProjectSchema) -> SchemaElementStats {
  let clips = project.tracks.iter().map(|t| t.clips.len()).sum();

  SchemaElementStats {
    clips,
    effects: project.effects.len(),
    filters: project.filters.len(),
    subtitles: project.subtitles.len(),
    tracks: project.tracks.len(),
    templates: project.templates.len(),
    style_templates: project.style_templates.len(),
  }
}

/// Валидировать схему проекта
pub fn validate_project_schema(project: &ProjectSchema) -> SchemaValidationInfo {
  let mut errors = Vec::new();
  let mut warnings = Vec::new();

  // Проверяем наличие треков
  if project.tracks.is_empty() {
    warnings.push("Project has no tracks".to_string());
  }

  // Проверяем наличие клипов в треках
  let has_clips = project.tracks.iter().any(|track| !track.clips.is_empty());
  if !project.tracks.is_empty() && !has_clips {
    warnings.push("Project tracks have no clips".to_string());
  }

  // Проверяем длительность
  if project.timeline.duration <= 0.0 {
    errors.push("Project duration must be greater than 0".to_string());
  }

  // Проверяем субтитры
  for subtitle in &project.subtitles {
    if subtitle.end_time <= subtitle.start_time {
      errors.push(format!("Invalid subtitle timing: {}", subtitle.id));
    }
  }

  let element_count = get_schema_element_stats(project);
  let total_elements = element_count.clips
    + element_count.effects
    + element_count.filters
    + element_count.subtitles
    + element_count.tracks
    + element_count.templates
    + element_count.style_templates;

  SchemaValidationInfo {
    is_valid: errors.is_empty(),
    errors,
    warnings,
    element_count: total_elements,
  }
}

/// Создать разрешение для формата
pub fn create_resolution_for_format(
  format: &str,
) -> crate::video_compiler::schema::common::Resolution {
  use crate::video_compiler::schema::common::Resolution;

  match format {
    "hd" | "720p" => Resolution::hd(),
    "fullhd" | "1080p" => Resolution::full_hd(),
    "4k" | "uhd" | "2160p" => Resolution::uhd_4k(),
    "square" => Resolution::new(1080, 1080),
    "portrait" | "vertical" => Resolution::new(1080, 1920),
    "ultrawide" => Resolution::new(2560, 1080),
    _ => Resolution::new(1920, 1080), // По умолчанию Full HD
  }
}

/// Получить предустановленные разрешения
pub fn get_preset_resolutions() -> Vec<serde_json::Value> {
  use crate::video_compiler::schema::common::Resolution;

  vec![
    serde_json::json!({
        "name": "HD (720p)",
        "resolution": Resolution::hd()
    }),
    serde_json::json!({
        "name": "Full HD (1080p)",
        "resolution": Resolution::full_hd()
    }),
    serde_json::json!({
        "name": "4K UHD (2160p)",
        "resolution": Resolution::uhd_4k()
    }),
    serde_json::json!({
        "name": "Custom Square",
        "resolution": Resolution::new(1080, 1080)
    }),
    serde_json::json!({
        "name": "Custom Portrait",
        "resolution": Resolution::new(1080, 1920)
    }),
  ]
}
