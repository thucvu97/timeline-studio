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
