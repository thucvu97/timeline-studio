//! Schema Commands - Команды для работы со схемой проекта
//!
//! Команды создания и управления элементами схемы проекта:
//! - Клипы, треки, эффекты, фильтры, субтитры
//! - Шаблоны и стили

use crate::video_compiler::error::{Result, VideoCompilerError};
use crate::video_compiler::schema::{
  timeline::{Clip, ClipProperties, ClipSource},
  Effect, Filter, StyleTemplate, Subtitle, Template, Track, TrackType,
};
use std::collections::HashMap;

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

/// Создать клип
#[tauri::command]
pub async fn create_clip(source_path: String, start_time: f64, end_time: f64) -> Result<Clip> {
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
      custom_metadata: HashMap::new(),
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
    "blur" => FilterType::Blur,
    _ => FilterType::Custom, // По умолчанию
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

/// Создать стилевой шаблон
#[tauri::command]
pub async fn create_style_template(
  name: String,
  category: String,
  _properties: HashMap<String, serde_json::Value>,
) -> Result<StyleTemplate> {
  use crate::video_compiler::schema::templates::StyleTemplateCategory;

  let template_category = match category.as_str() {
    "intro" => StyleTemplateCategory::Intro,
    "outro" => StyleTemplateCategory::Outro,
    "title" => StyleTemplateCategory::Title,
    _ => StyleTemplateCategory::Overlay,
  };

  Ok(StyleTemplate {
    id: uuid::Uuid::new_v4().to_string(),
    name,
    category: template_category,
    style: crate::video_compiler::schema::templates::StyleTemplateStyle::Modern,
    duration: 5.0,
    elements: vec![],
    background_color: "#000000".to_string(),
    transitions: vec![],
  })
}

/// Создать субтитр
#[tauri::command]
pub async fn create_subtitle(
  text: String,
  start_time: f64,
  end_time: f64,
  _style: Option<HashMap<String, serde_json::Value>>,
) -> Result<Subtitle> {
  let duration = end_time - start_time;
  Ok(Subtitle {
    id: uuid::Uuid::new_v4().to_string(),
    text,
    start_time,
    end_time,
    position: crate::video_compiler::schema::subtitles::SubtitlePosition::default(),
    style: crate::video_compiler::schema::subtitles::SubtitleStyle::default(),
    enabled: true,
    animations: vec![],
    font_family: "Arial".to_string(),
    font_size: 24.0,
    color: "#FFFFFF".to_string(),
    opacity: 1.0,
    font_weight: crate::video_compiler::schema::subtitles::SubtitleFontWeight::Normal,
    shadow: true,
    outline: true,
    duration,
  })
}

/// Создать анимацию субтитров
#[tauri::command]
pub async fn create_subtitle_animation(
  subtitle_id: String,
  animation_type: String,
  duration: f64,
  mut project: crate::video_compiler::schema::ProjectSchema,
) -> Result<crate::video_compiler::schema::ProjectSchema> {
  use crate::video_compiler::schema::subtitles::SubtitleAnimation;

  // Находим субтитр
  for subtitle in &mut project.subtitles {
    if subtitle.id == subtitle_id {
      let anim_type = match animation_type.as_str() {
        "fade_in" => crate::video_compiler::schema::subtitles::SubtitleAnimationType::FadeIn,
        "slide_in" => crate::video_compiler::schema::subtitles::SubtitleAnimationType::SlideIn,
        "scale_in" => crate::video_compiler::schema::subtitles::SubtitleAnimationType::ScaleIn,
        _ => crate::video_compiler::schema::subtitles::SubtitleAnimationType::FadeIn,
      };

      let animation = SubtitleAnimation {
        id: uuid::Uuid::new_v4().to_string(),
        animation_type: anim_type,
        duration,
        delay: 0.0,
        easing: crate::video_compiler::schema::subtitles::SubtitleEasing::EaseInOut,
        direction: None,
        properties: HashMap::new(),
        start_time: 0.0,
      };

      subtitle.animations.push(animation);
      break;
    }
  }

  Ok(project)
}

/// Создать новую анимацию субтитров (использование SubtitleAnimation::new)
#[tauri::command]
pub async fn create_subtitle_animation_new(
  animation_type: String,
  duration: f64,
  delay: Option<f64>,
  easing: Option<String>,
) -> Result<crate::video_compiler::schema::subtitles::SubtitleAnimation> {
  use crate::video_compiler::schema::subtitles::{
    SubtitleAnimation, SubtitleAnimationType, SubtitleEasing,
  };

  let anim_type = match animation_type.as_str() {
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

  let easing_type = match easing.as_deref() {
    Some("linear") => SubtitleEasing::Linear,
    Some("ease_in") => SubtitleEasing::EaseIn,
    Some("ease_out") => SubtitleEasing::EaseOut,
    Some("ease_in_out") => SubtitleEasing::EaseInOut,
    _ => SubtitleEasing::EaseInOut,
  };

  // Используем метод SubtitleAnimation::new и устанавливаем дополнительные параметры
  let mut animation = SubtitleAnimation::new(anim_type, duration);
  animation.delay = delay.unwrap_or(0.0);
  animation.easing = easing_type;
  Ok(animation)
}

/// Создать новый стилевой шаблон (использование StyleTemplate::new)  
#[tauri::command]
pub async fn create_style_template_new(
  name: String,
  category: String,
  style: Option<String>,
  duration: Option<f64>,
) -> Result<crate::video_compiler::schema::templates::StyleTemplate> {
  use crate::video_compiler::schema::templates::{
    StyleTemplate, StyleTemplateCategory, StyleTemplateStyle,
  };

  let template_category = match category.as_str() {
    "intro" => StyleTemplateCategory::Intro,
    "outro" => StyleTemplateCategory::Outro,
    "title" => StyleTemplateCategory::Title,
    "lower_third" => StyleTemplateCategory::LowerThird,
    "transition" => StyleTemplateCategory::Transition,
    "overlay" => StyleTemplateCategory::Overlay,
    _ => StyleTemplateCategory::Overlay,
  };

  let template_style = match style.as_deref() {
    Some("modern") => StyleTemplateStyle::Modern,
    Some("minimal") => StyleTemplateStyle::Minimal,
    Some("vintage") => StyleTemplateStyle::Vintage,
    Some("corporate") => StyleTemplateStyle::Corporate,
    Some("creative") => StyleTemplateStyle::Creative,
    Some("cinematic") => StyleTemplateStyle::Cinematic,
    _ => StyleTemplateStyle::Modern,
  };

  // Используем метод StyleTemplate::new
  Ok(StyleTemplate::new(
    name,
    template_category,
    template_style,
    duration.unwrap_or(5.0),
  ))
}

/// Создать шаблон
#[tauri::command]
pub async fn create_template(
  name: String,
  layout_type: String,
  _properties: HashMap<String, serde_json::Value>,
) -> Result<Template> {
  use crate::video_compiler::schema::templates::TemplateType;

  let template_type = match layout_type.as_str() {
    "vertical" => TemplateType::Vertical,
    "horizontal" => TemplateType::Horizontal,
    "diagonal" => TemplateType::Diagonal,
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
pub async fn create_track(
  name: String,
  track_type: String,
  mut project: crate::video_compiler::schema::ProjectSchema,
) -> Result<crate::video_compiler::schema::ProjectSchema> {
  let track_type_enum = match track_type.as_str() {
    "video" => TrackType::Video,
    "audio" => TrackType::Audio,
    "subtitle" => TrackType::Subtitle,
    _ => TrackType::Video,
  };

  let track = Track {
    id: uuid::Uuid::new_v4().to_string(),
    name,
    track_type: track_type_enum,
    enabled: true,
    volume: 1.0,
    locked: false,
    clips: vec![],
    effects: vec![],
    filters: vec![],
  };

  project.tracks.push(track);
  Ok(project)
}

/// Создать объекты схемы (множественное создание)
#[tauri::command]
pub async fn create_schema_objects(
  object_type: String,
  count: usize,
  base_properties: HashMap<String, serde_json::Value>,
) -> Result<Vec<serde_json::Value>> {
  let mut objects = Vec::new();

  for i in 0..count {
    let mut props = base_properties.clone();
    props.insert("index".to_string(), serde_json::json!(i));

    let obj = match object_type.as_str() {
      "clip" => {
        let clip = create_clip(
          props
            .get("source_path")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
          props
            .get("start_time")
            .and_then(|v| v.as_f64())
            .unwrap_or(0.0),
          props
            .get("end_time")
            .and_then(|v| v.as_f64())
            .unwrap_or(10.0),
        )
        .await?;
        serde_json::to_value(clip).unwrap()
      }
      "effect" => {
        let effect = create_effect(
          props
            .get("effect_type")
            .and_then(|v| v.as_str())
            .unwrap_or("blur")
            .to_string(),
          HashMap::new(),
        )
        .await?;
        serde_json::to_value(effect).unwrap()
      }
      "filter" => {
        let filter = create_filter(
          props
            .get("filter_type")
            .and_then(|v| v.as_str())
            .unwrap_or("brightness")
            .to_string(),
          HashMap::new(),
        )
        .await?;
        serde_json::to_value(filter).unwrap()
      }
      "resolution" => {
        serde_json::json!({
          "width": props.get("width").and_then(|v| v.as_u64()).unwrap_or(1920),
          "height": props.get("height").and_then(|v| v.as_u64()).unwrap_or(1080),
          "index": i
        })
      }
      _ => serde_json::json!({}),
    };

    objects.push(obj);
  }

  Ok(objects)
}

/// Создать разрешение с заданными параметрами (использование Resolution::new)
#[tauri::command]
pub async fn create_resolution(
  width: u32,
  height: u32,
) -> Result<crate::video_compiler::schema::common::Resolution> {
  use crate::video_compiler::schema::common::Resolution;

  // Используем метод Resolution::new
  Ok(Resolution::new(width, height))
}

/// Получить стандартное HD разрешение (использование Resolution::hd)
#[tauri::command]
pub async fn get_hd_resolution() -> Result<crate::video_compiler::schema::common::Resolution> {
  use crate::video_compiler::schema::common::Resolution;

  // Используем метод Resolution::hd
  Ok(Resolution::hd())
}

/// Получить стандартное 4K разрешение (использование Resolution::uhd_4k)
#[tauri::command]
pub async fn get_uhd_4k_resolution() -> Result<crate::video_compiler::schema::common::Resolution> {
  use crate::video_compiler::schema::common::Resolution;

  // Используем метод Resolution::uhd_4k
  Ok(Resolution::uhd_4k())
}

/// Получить список предустановленных разрешений
#[tauri::command]
pub async fn get_preset_resolutions() -> Result<Vec<serde_json::Value>> {
  use crate::video_compiler::schema::common::Resolution;

  // Создаем список предустановленных разрешений используя методы Resolution
  let resolutions = vec![
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
  ];

  Ok(resolutions)
}

/// Создать разрешение для определенного формата
#[tauri::command]
pub async fn create_resolution_for_format(
  format: String,
) -> Result<crate::video_compiler::schema::common::Resolution> {
  use crate::video_compiler::schema::common::Resolution;

  // Создаем разрешение в зависимости от формата
  let resolution = match format.as_str() {
    "hd" | "720p" => Resolution::hd(),
    "fullhd" | "1080p" => Resolution::full_hd(),
    "4k" | "uhd" | "2160p" => Resolution::uhd_4k(),
    "square" => Resolution::new(1080, 1080),
    "portrait" | "vertical" => Resolution::new(1080, 1920),
    "ultrawide" => Resolution::new(2560, 1080),
    _ => Resolution::new(1920, 1080), // По умолчанию Full HD
  };

  Ok(resolution)
}

#[cfg(test)]
mod tests {
  use super::*;
  use crate::video_compiler::schema::{
    common::AspectRatio,
    effects::{EffectType, FilterType},
    subtitles::{SubtitleAnimationType, SubtitleEasing},
    templates::{StyleTemplateCategory, StyleTemplateStyle, TemplateType},
    ProjectSchema, Timeline, Track, TrackType,
  };
  use std::collections::HashMap;

  fn create_test_project() -> ProjectSchema {
    ProjectSchema {
      version: "1.0.0".to_string(),
      metadata: crate::video_compiler::schema::ProjectMetadata {
        name: "Test Project".to_string(),
        description: Some("Test Description".to_string()),
        created_at: chrono::Utc::now(),
        modified_at: chrono::Utc::now(),
        author: Some("Test Author".to_string()),
      },
      timeline: Timeline {
        duration: 30.0,
        fps: 30,
        resolution: (1920, 1080),
        sample_rate: 48000,
        aspect_ratio: AspectRatio::Ratio16x9,
      },
      tracks: vec![Track {
        id: "track1".to_string(),
        track_type: TrackType::Video,
        name: "Video Track".to_string(),
        enabled: true,
        volume: 1.0,
        locked: false,
        clips: vec![],
        effects: vec![],
        filters: vec![],
      }],
      effects: vec![],
      transitions: vec![],
      filters: vec![],
      templates: vec![],
      style_templates: vec![],
      subtitles: vec![],
      settings: crate::video_compiler::schema::ProjectSettings::default(),
    }
  }

  #[tokio::test]
  async fn test_create_clip() {
    let source_path = "/tmp/test_video.mp4".to_string();
    let start_time = 5.0;
    let end_time = 15.0;

    let result = create_clip(source_path.clone(), start_time, end_time).await;
    assert!(result.is_ok());

    let clip = result.unwrap();
    assert!(!clip.id.is_empty());
    assert_eq!(clip.start_time, start_time);
    assert_eq!(clip.end_time, end_time);
    assert_eq!(clip.source_start, 0.0);
    assert_eq!(clip.source_end, end_time - start_time);
    assert_eq!(clip.speed, 1.0);
    assert_eq!(clip.opacity, 1.0);
    assert!(clip.effects.is_empty());
    assert!(clip.filters.is_empty());

    match clip.source {
      ClipSource::File(path) => assert_eq!(path, source_path),
      _ => panic!("Expected File source"),
    }
  }

  #[tokio::test]
  async fn test_create_effect() {
    let effect_type = "blur".to_string();
    let parameters = HashMap::new();

    let result = create_effect(effect_type.clone(), parameters).await;
    assert!(result.is_ok());

    let effect = result.unwrap();
    assert!(!effect.id.is_empty());
    assert_eq!(effect.name, effect_type);
    assert_eq!(effect.effect_type, EffectType::Blur);
    assert!(effect.enabled);
    assert!(effect.parameters.is_empty());
  }

  #[tokio::test]
  async fn test_create_effect_brightness() {
    let effect_type = "brightness".to_string();
    let parameters = HashMap::new();

    let result = create_effect(effect_type, parameters).await;
    assert!(result.is_ok());

    let effect = result.unwrap();
    assert_eq!(effect.effect_type, EffectType::Brightness);
    assert_eq!(effect.name, "brightness");
  }

  #[tokio::test]
  async fn test_create_effect_contrast() {
    let effect_type = "contrast".to_string();
    let parameters = HashMap::new();

    let result = create_effect(effect_type, parameters).await;
    assert!(result.is_ok());

    let effect = result.unwrap();
    assert_eq!(effect.effect_type, EffectType::Contrast);
    assert_eq!(effect.name, "contrast");
  }

  #[tokio::test]
  async fn test_create_effect_unknown() {
    let effect_type = "unknown_effect".to_string();
    let parameters = HashMap::new();

    let result = create_effect(effect_type, parameters).await;
    assert!(result.is_ok());

    let effect = result.unwrap();
    assert_eq!(effect.effect_type, EffectType::Blur); // Default fallback
    assert_eq!(effect.name, "unknown_effect");
  }

  #[tokio::test]
  async fn test_create_filter() {
    let filter_type = "brightness".to_string();
    let parameters = HashMap::new();

    let result = create_filter(filter_type.clone(), parameters).await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert!(!filter.id.is_empty());
    assert_eq!(filter.name, filter_type);
    assert_eq!(filter.filter_type, FilterType::Brightness);
    assert!(filter.enabled);
    assert_eq!(filter.intensity, 1.0);
    assert!(filter.parameters.is_empty());
  }

  #[tokio::test]
  async fn test_create_filter_saturation() {
    let filter_type = "saturation".to_string();
    let parameters = HashMap::new();

    let result = create_filter(filter_type, parameters).await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert_eq!(filter.filter_type, FilterType::Saturation);
    assert_eq!(filter.name, "saturation");
  }

  #[tokio::test]
  async fn test_create_filter_blur() {
    let filter_type = "blur".to_string();
    let parameters = HashMap::new();

    let result = create_filter(filter_type, parameters).await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert_eq!(filter.filter_type, FilterType::Blur);
    assert_eq!(filter.name, "blur");
  }

  #[tokio::test]
  async fn test_create_filter_unknown() {
    let filter_type = "unknown_filter".to_string();
    let parameters = HashMap::new();

    let result = create_filter(filter_type, parameters).await;
    assert!(result.is_ok());

    let filter = result.unwrap();
    assert_eq!(filter.filter_type, FilterType::Custom); // Default fallback
    assert_eq!(filter.name, "unknown_filter");
  }

  #[tokio::test]
  async fn test_create_style_template() {
    let name = "Test Template".to_string();
    let category = "intro".to_string();
    let properties = HashMap::new();

    let result = create_style_template(name.clone(), category, properties).await;
    assert!(result.is_ok());

    let template = result.unwrap();
    assert!(!template.id.is_empty());
    assert_eq!(template.name, name);
    assert_eq!(template.category, StyleTemplateCategory::Intro);
    assert_eq!(template.style, StyleTemplateStyle::Modern);
    assert_eq!(template.duration, 5.0);
    assert_eq!(template.background_color, "#000000");
    assert!(template.elements.is_empty());
    assert!(template.transitions.is_empty());
  }

  #[tokio::test]
  async fn test_create_style_template_outro() {
    let name = "Outro Template".to_string();
    let category = "outro".to_string();
    let properties = HashMap::new();

    let result = create_style_template(name, category, properties).await;
    assert!(result.is_ok());

    let template = result.unwrap();
    assert_eq!(template.category, StyleTemplateCategory::Outro);
  }

  #[tokio::test]
  async fn test_create_subtitle() {
    let text = "Test subtitle".to_string();
    let start_time = 10.0;
    let end_time = 15.0;

    let result = create_subtitle(text.clone(), start_time, end_time, None).await;
    assert!(result.is_ok());

    let subtitle = result.unwrap();
    assert!(!subtitle.id.is_empty());
    assert_eq!(subtitle.text, text);
    assert_eq!(subtitle.start_time, start_time);
    assert_eq!(subtitle.end_time, end_time);
    assert_eq!(subtitle.duration, end_time - start_time);
    assert!(subtitle.enabled);
    assert_eq!(subtitle.font_family, "Arial");
    assert_eq!(subtitle.font_size, 24.0);
    assert_eq!(subtitle.color, "#FFFFFF");
    assert_eq!(subtitle.opacity, 1.0);
    assert!(subtitle.shadow);
    assert!(subtitle.outline);
    assert!(subtitle.animations.is_empty());
  }

  #[tokio::test]
  async fn test_create_subtitle_animation() {
    let mut project = create_test_project();
    let subtitle_id = uuid::Uuid::new_v4().to_string();

    // Add a subtitle to the project
    let subtitle = crate::video_compiler::schema::Subtitle {
      id: subtitle_id.clone(),
      text: "Test subtitle".to_string(),
      start_time: 0.0,
      end_time: 5.0,
      position: crate::video_compiler::schema::subtitles::SubtitlePosition::default(),
      style: crate::video_compiler::schema::subtitles::SubtitleStyle::default(),
      enabled: true,
      animations: vec![],
      font_family: "Arial".to_string(),
      font_size: 24.0,
      color: "#FFFFFF".to_string(),
      opacity: 1.0,
      font_weight: crate::video_compiler::schema::subtitles::SubtitleFontWeight::Normal,
      shadow: true,
      outline: true,
      duration: 5.0,
    };
    project.subtitles.push(subtitle);

    let animation_type = "fade_in".to_string();
    let duration = 2.0;

    let result =
      create_subtitle_animation(subtitle_id.clone(), animation_type, duration, project).await;
    assert!(result.is_ok());

    let updated_project = result.unwrap();
    let subtitle = updated_project
      .subtitles
      .iter()
      .find(|s| s.id == subtitle_id)
      .unwrap();
    assert_eq!(subtitle.animations.len(), 1);

    let animation = &subtitle.animations[0];
    assert!(!animation.id.is_empty());
    assert_eq!(animation.animation_type, SubtitleAnimationType::FadeIn);
    assert_eq!(animation.duration, duration);
    assert_eq!(animation.delay, 0.0);
    assert_eq!(animation.easing, SubtitleEasing::EaseInOut);
  }

  #[tokio::test]
  async fn test_create_subtitle_animation_new() {
    let animation_type = "slide_in".to_string();
    let duration = 3.0;
    let delay = Some(1.0);
    let easing = Some("ease_in".to_string());

    let result = create_subtitle_animation_new(animation_type, duration, delay, easing).await;
    assert!(result.is_ok());

    let animation = result.unwrap();
    assert!(!animation.id.is_empty());
    assert_eq!(animation.animation_type, SubtitleAnimationType::SlideIn);
    assert_eq!(animation.duration, duration);
    assert_eq!(animation.delay, 1.0);
    assert_eq!(animation.easing, SubtitleEasing::EaseIn);
  }

  #[tokio::test]
  async fn test_create_subtitle_animation_new_defaults() {
    let animation_type = "typewriter".to_string();
    let duration = 4.0;

    let result = create_subtitle_animation_new(animation_type, duration, None, None).await;
    assert!(result.is_ok());

    let animation = result.unwrap();
    assert_eq!(animation.animation_type, SubtitleAnimationType::Typewriter);
    assert_eq!(animation.duration, duration);
    assert_eq!(animation.delay, 0.0);
    assert_eq!(animation.easing, SubtitleEasing::EaseInOut); // Default
  }

  #[tokio::test]
  async fn test_create_style_template_new() {
    let name = "Modern Intro".to_string();
    let category = "intro".to_string();
    let style = Some("minimal".to_string());
    let duration = Some(8.0);

    let result = create_style_template_new(name.clone(), category, style, duration).await;
    assert!(result.is_ok());

    let template = result.unwrap();
    assert_eq!(template.name, name);
    assert_eq!(template.category, StyleTemplateCategory::Intro);
    assert_eq!(template.style, StyleTemplateStyle::Minimal);
    assert_eq!(template.duration, 8.0);
  }

  #[tokio::test]
  async fn test_create_style_template_new_defaults() {
    let name = "Default Template".to_string();
    let category = "unknown".to_string();

    let result = create_style_template_new(name.clone(), category, None, None).await;
    assert!(result.is_ok());

    let template = result.unwrap();
    assert_eq!(template.name, name);
    assert_eq!(template.category, StyleTemplateCategory::Overlay); // Default
    assert_eq!(template.style, StyleTemplateStyle::Modern); // Default
    assert_eq!(template.duration, 5.0); // Default
  }

  #[tokio::test]
  async fn test_create_template() {
    let name = "Grid Layout".to_string();
    let layout_type = "grid".to_string();
    let properties = HashMap::new();

    let result = create_template(name.clone(), layout_type, properties).await;
    assert!(result.is_ok());

    let template = result.unwrap();
    assert!(!template.id.is_empty());
    assert_eq!(template.name, name);
    assert_eq!(template.template_type, TemplateType::Grid);
    assert_eq!(template.screens, 2);
    assert!(template.cells.is_empty());
    assert!(template.regions.is_empty());
  }

  #[tokio::test]
  async fn test_create_template_vertical() {
    let name = "Vertical Layout".to_string();
    let layout_type = "vertical".to_string();
    let properties = HashMap::new();

    let result = create_template(name, layout_type, properties).await;
    assert!(result.is_ok());

    let template = result.unwrap();
    assert_eq!(template.template_type, TemplateType::Vertical);
  }

  #[tokio::test]
  async fn test_create_track() {
    let name = "Audio Track".to_string();
    let track_type = "audio".to_string();
    let project = create_test_project();
    let initial_track_count = project.tracks.len();

    let result = create_track(name.clone(), track_type, project).await;
    assert!(result.is_ok());

    let updated_project = result.unwrap();
    assert_eq!(updated_project.tracks.len(), initial_track_count + 1);

    let new_track = &updated_project.tracks[initial_track_count];
    assert!(!new_track.id.is_empty());
    assert_eq!(new_track.name, name);
    assert_eq!(new_track.track_type, TrackType::Audio);
    assert!(new_track.enabled);
    assert_eq!(new_track.volume, 1.0);
    assert!(!new_track.locked);
    assert!(new_track.clips.is_empty());
    assert!(new_track.effects.is_empty());
    assert!(new_track.filters.is_empty());
  }

  #[tokio::test]
  async fn test_add_clip_to_track() {
    let project = create_test_project();
    let track_id = project.tracks[0].id.clone();

    let clip = create_clip("/tmp/video.mp4".to_string(), 0.0, 10.0)
      .await
      .unwrap();

    let result = add_clip_to_track(track_id.clone(), clip.clone(), project).await;
    assert!(result.is_ok());

    let updated_project = result.unwrap();
    let track = updated_project
      .tracks
      .iter()
      .find(|t| t.id == track_id)
      .unwrap();
    assert_eq!(track.clips.len(), 1);
    assert_eq!(track.clips[0].id, clip.id);
  }

  #[tokio::test]
  async fn test_add_clip_to_track_invalid_track() {
    let project = create_test_project();
    let invalid_track_id = "invalid_track_id".to_string();
    let clip = create_clip("/tmp/video.mp4".to_string(), 0.0, 10.0)
      .await
      .unwrap();

    let result = add_clip_to_track(invalid_track_id, clip, project).await;
    assert!(result.is_err());

    match result.unwrap_err() {
      VideoCompilerError::InvalidParameter(msg) => {
        assert!(msg.contains("Track not found"));
      }
      _ => panic!("Expected InvalidParameter error"),
    }
  }

  #[tokio::test]
  async fn test_create_schema_objects_clips() {
    let object_type = "clip".to_string();
    let count = 3;
    let mut base_properties = HashMap::new();
    base_properties.insert(
      "source_path".to_string(),
      serde_json::json!("/tmp/test.mp4"),
    );
    base_properties.insert("start_time".to_string(), serde_json::json!(0.0));
    base_properties.insert("end_time".to_string(), serde_json::json!(10.0));

    let result = create_schema_objects(object_type, count, base_properties).await;
    assert!(result.is_ok());

    let objects = result.unwrap();
    assert_eq!(objects.len(), count);

    for obj in objects.iter() {
      assert!(obj.is_object());
      assert!(obj["id"].is_string());
      assert!(obj["source"].is_object() || obj["source"].is_string());
      assert!(obj["start_time"].is_number());
      assert!(obj["end_time"].is_number());
    }
  }

  #[tokio::test]
  async fn test_create_schema_objects_effects() {
    let object_type = "effect".to_string();
    let count = 2;
    let mut base_properties = HashMap::new();
    base_properties.insert("effect_type".to_string(), serde_json::json!("brightness"));

    let result = create_schema_objects(object_type, count, base_properties).await;
    assert!(result.is_ok());

    let objects = result.unwrap();
    assert_eq!(objects.len(), count);

    for obj in objects.iter() {
      assert!(obj.is_object());
      assert!(obj["id"].is_string());
      assert_eq!(obj["effect_type"], "Brightness");
      assert!(obj["enabled"].is_boolean());
    }
  }

  #[tokio::test]
  async fn test_create_schema_objects_filters() {
    let object_type = "filter".to_string();
    let count = 2;
    let mut base_properties = HashMap::new();
    base_properties.insert("filter_type".to_string(), serde_json::json!("contrast"));

    let result = create_schema_objects(object_type, count, base_properties).await;
    assert!(result.is_ok());

    let objects = result.unwrap();
    assert_eq!(objects.len(), count);

    for obj in objects.iter() {
      assert!(obj.is_object());
      assert!(obj["id"].is_string());
      assert_eq!(obj["filter_type"], "Contrast");
      assert!(obj["enabled"].is_boolean());
    }
  }

  #[tokio::test]
  async fn test_create_schema_objects_resolutions() {
    let object_type = "resolution".to_string();
    let count = 2;
    let mut base_properties = HashMap::new();
    base_properties.insert("width".to_string(), serde_json::json!(1280));
    base_properties.insert("height".to_string(), serde_json::json!(720));

    let result = create_schema_objects(object_type, count, base_properties).await;
    assert!(result.is_ok());

    let objects = result.unwrap();
    assert_eq!(objects.len(), count);

    for (i, obj) in objects.iter().enumerate() {
      assert!(obj.is_object());
      assert_eq!(obj["index"], i);
      assert_eq!(obj["width"], 1280);
      assert_eq!(obj["height"], 720);
    }
  }

  #[tokio::test]
  async fn test_create_schema_objects_unknown() {
    let object_type = "unknown".to_string();
    let count = 1;
    let base_properties = HashMap::new();

    let result = create_schema_objects(object_type, count, base_properties).await;
    assert!(result.is_ok());

    let objects = result.unwrap();
    assert_eq!(objects.len(), count);
    assert_eq!(objects[0], serde_json::json!({}));
  }

  #[tokio::test]
  async fn test_create_resolution() {
    let width = 2560;
    let height = 1440;

    let result = create_resolution(width, height).await;
    assert!(result.is_ok());

    let resolution = result.unwrap();
    assert_eq!(resolution.width, width);
    assert_eq!(resolution.height, height);
  }

  #[tokio::test]
  async fn test_get_hd_resolution() {
    let result = get_hd_resolution().await;
    assert!(result.is_ok());

    let resolution = result.unwrap();
    assert_eq!(resolution.width, 1280);
    assert_eq!(resolution.height, 720);
  }

  #[tokio::test]
  async fn test_get_uhd_4k_resolution() {
    let result = get_uhd_4k_resolution().await;
    assert!(result.is_ok());

    let resolution = result.unwrap();
    assert_eq!(resolution.width, 3840);
    assert_eq!(resolution.height, 2160);
  }

  #[tokio::test]
  async fn test_get_preset_resolutions() {
    let result = get_preset_resolutions().await;
    assert!(result.is_ok());

    let resolutions = result.unwrap();
    assert_eq!(resolutions.len(), 5);

    // Check that all entries have name and resolution
    for res_obj in &resolutions {
      assert!(res_obj["name"].is_string());
      assert!(res_obj["resolution"].is_object());
      assert!(res_obj["resolution"]["width"].is_number());
      assert!(res_obj["resolution"]["height"].is_number());
    }

    // Check specific resolutions
    assert_eq!(resolutions[0]["name"], "HD (720p)");
    assert_eq!(resolutions[1]["name"], "Full HD (1080p)");
    assert_eq!(resolutions[2]["name"], "4K UHD (2160p)");
    assert_eq!(resolutions[3]["name"], "Custom Square");
    assert_eq!(resolutions[4]["name"], "Custom Portrait");
  }

  #[tokio::test]
  async fn test_create_resolution_for_format() {
    let formats = vec![
      ("hd", 1280, 720),
      ("720p", 1280, 720),
      ("fullhd", 1920, 1080),
      ("1080p", 1920, 1080),
      ("4k", 3840, 2160),
      ("uhd", 3840, 2160),
      ("2160p", 3840, 2160),
      ("square", 1080, 1080),
      ("portrait", 1080, 1920),
      ("vertical", 1080, 1920),
      ("ultrawide", 2560, 1080),
      ("unknown", 1920, 1080), // Default fallback
    ];

    for (format, expected_width, expected_height) in formats {
      let result = create_resolution_for_format(format.to_string()).await;
      assert!(result.is_ok(), "Failed for format: {}", format);

      let resolution = result.unwrap();
      assert_eq!(
        resolution.width, expected_width,
        "Width mismatch for format: {}",
        format
      );
      assert_eq!(
        resolution.height, expected_height,
        "Height mismatch for format: {}",
        format
      );
    }
  }
}
