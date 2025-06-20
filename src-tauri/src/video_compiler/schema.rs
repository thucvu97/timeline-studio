//! Schema - Схема данных проекта Timeline Studio
//!
//! Этот модуль определяет структуры данных для описания проектов видеомонтажа,
//! включая timeline, треки, клипы, эффекты и настройки.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

/// Основная схема проекта Timeline Studio
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProjectSchema {
  /// Версия схемы проекта для совместимости
  pub version: String,
  /// Метаданные проекта
  pub metadata: ProjectMetadata,
  /// Настройки timeline (fps, разрешение, длительность)
  pub timeline: Timeline,
  /// Список треков (видео, аудио, субтитры)
  pub tracks: Vec<Track>,
  /// Глобальные эффекты проекта
  pub effects: Vec<Effect>,
  /// Переходы между клипами
  pub transitions: Vec<Transition>,
  /// Фильтры для визуальных эффектов
  pub filters: Vec<Filter>,
  /// Шаблоны многокамерных раскладок
  pub templates: Vec<Template>,
  /// Стилестические шаблоны (интро, аутро, титры)
  pub style_templates: Vec<StyleTemplate>,
  /// Субтитры проекта
  pub subtitles: Vec<Subtitle>,
  /// Настройки проекта и экспорта
  pub settings: ProjectSettings,
}

impl ProjectSchema {
  /// Создать новый пустой проект
  pub fn new(name: String) -> Self {
    Self {
      version: "1.0.0".to_string(),
      metadata: ProjectMetadata {
        name,
        description: None,
        created_at: Utc::now(),
        modified_at: Utc::now(),
        author: None,
      },
      timeline: Timeline::default(),
      tracks: Vec::new(),
      effects: Vec::new(),
      transitions: Vec::new(),
      filters: Vec::new(),
      templates: Vec::new(),
      style_templates: Vec::new(),
      subtitles: Vec::new(),
      settings: ProjectSettings::default(),
    }
  }

  /// Валидация схемы проекта
  pub fn validate(&self) -> Result<(), String> {
    // Проверка версии
    if self.version.is_empty() {
      return Err("Версия проекта не может быть пустой".to_string());
    }

    // Проверка timeline
    if self.timeline.fps == 0 {
      return Err("FPS должен быть больше 0".to_string());
    }

    if self.timeline.resolution.0 == 0 || self.timeline.resolution.1 == 0 {
      return Err("Разрешение должно быть больше 0x0".to_string());
    }

    // Проверка треков
    for track in &self.tracks {
      track.validate()?;
    }

    // Проверка клипов на пересечения по времени в одном треке
    for track in &self.tracks {
      let mut clips = track.clips.clone();
      clips.sort_by(|a, b| a.start_time.partial_cmp(&b.start_time).unwrap());

      for i in 0..clips.len().saturating_sub(1) {
        if clips[i].end_time > clips[i + 1].start_time {
          return Err(format!(
            "Клипы пересекаются по времени в треке '{}': {} и {}",
            track.name,
            clips[i].id,
            clips[i + 1].id
          ));
        }
      }
    }

    Ok(())
  }

  /// Получить общую длительность проекта
  pub fn get_duration(&self) -> f64 {
    self
      .tracks
      .iter()
      .flat_map(|track| &track.clips)
      .map(|clip| clip.end_time)
      .fold(0.0, f64::max)
  }

  /// Обновить время модификации
  pub fn touch(&mut self) {
    self.metadata.modified_at = Utc::now();
  }
}

/// Метаданные проекта
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ProjectMetadata {
  /// Название проекта
  pub name: String,
  /// Описание проекта
  pub description: Option<String>,
  /// Время создания
  pub created_at: DateTime<Utc>,
  /// Время последней модификации
  pub modified_at: DateTime<Utc>,
  /// Автор проекта
  pub author: Option<String>,
}

/// Настройки timeline
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Timeline {
  /// Общая продолжительность в секундах
  pub duration: f64,
  /// Кадры в секунду
  pub fps: u32,
  /// Разрешение видео (ширина, высота)
  pub resolution: (u32, u32),
  /// Частота дискретизации аудио
  pub sample_rate: u32,
  /// Соотношение сторон
  pub aspect_ratio: AspectRatio,
}

impl Default for Timeline {
  fn default() -> Self {
    Self {
      duration: 0.0,
      fps: 30,
      resolution: (1920, 1080),
      sample_rate: 48000,
      aspect_ratio: AspectRatio::Ratio16x9,
    }
  }
}

/// Соотношение сторон видео
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum AspectRatio {
  Ratio16x9,   // 16:9 (широкоформатное)
  Ratio4x3,    // 4:3 (стандартное)
  Ratio21x9,   // 21:9 (ультраширокое)
  Ratio1x1,    // 1:1 (квадратное)
  Ratio9x16,   // 9:16 (вертикальное для мобильных)
  Custom(f32), // Произвольное соотношение
}

/// Дорожка timeline (видео, аудио, субтитры)
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Track {
  /// Уникальный идентификатор трека
  pub id: String,
  /// Тип трека
  pub track_type: TrackType,
  /// Название трека
  pub name: String,
  /// Включен ли трек
  pub enabled: bool,
  /// Громкость трека (0.0 - 1.0)
  pub volume: f32,
  /// Заблокирован ли трек для редактирования
  pub locked: bool,
  /// Список клипов в треке
  pub clips: Vec<Clip>,
  /// ID эффектов, применяемых ко всему треку
  pub effects: Vec<String>,
  /// ID фильтров, применяемых ко всему треку
  pub filters: Vec<String>,
}

impl Track {
  /// Создать новый трек
  pub fn new(track_type: TrackType, name: String) -> Self {
    Self {
      id: uuid::Uuid::new_v4().to_string(),
      track_type,
      name,
      enabled: true,
      volume: 1.0,
      locked: false,
      clips: Vec::new(),
      effects: Vec::new(),
      filters: Vec::new(),
    }
  }

  /// Валидация трека
  pub fn validate(&self) -> Result<(), String> {
    if self.name.is_empty() {
      return Err("Название трека не может быть пустым".to_string());
    }

    if !(0.0..=1.0).contains(&self.volume) {
      return Err("Громкость должна быть в диапазоне 0.0-1.0".to_string());
    }

    for clip in &self.clips {
      clip.validate()?;
    }

    Ok(())
  }

  /// Добавить клип в трек
  pub fn add_clip(&mut self, clip: Clip) -> Result<(), String> {
    // Проверяем, что клип не пересекается с существующими
    for existing_clip in &self.clips {
      if !(clip.end_time <= existing_clip.start_time || clip.start_time >= existing_clip.end_time) {
        return Err(format!(
          "Клип пересекается с существующим клипом {}",
          existing_clip.id
        ));
      }
    }

    self.clips.push(clip);
    Ok(())
  }
}

/// Тип дорожки
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum TrackType {
  /// Видео дорожка
  Video,
  /// Аудио дорожка
  Audio,
  /// Дорожка субтитров
  Subtitle,
}

/// Клип медиа на дорожке
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Clip {
  /// Уникальный идентификатор клипа
  pub id: String,
  /// Путь к исходному медиа файлу
  pub source_path: PathBuf,
  /// Время начала клипа на timeline (секунды)
  pub start_time: f64,
  /// Время окончания клипа на timeline (секунды)
  pub end_time: f64,
  /// Время начала в исходном файле (секунды)
  pub source_start: f64,
  /// Время окончания в исходном файле (секунды)
  pub source_end: f64,
  /// Скорость воспроизведения (1.0 = нормальная)
  pub speed: f32,
  /// Громкость клипа (0.0 - 1.0)
  pub volume: f32,
  /// Заблокирован ли клип
  pub locked: bool,
  /// ID эффектов, применяемых к клипу
  pub effects: Vec<String>,
  /// ID фильтров, применяемых к клипу
  pub filters: Vec<String>,
  /// ID шаблона для многокамерной раскладки
  pub template_id: Option<String>,
  /// Индекс ячейки в шаблоне (0-based)
  pub template_cell: Option<usize>,
  /// ID стильного шаблона (интро, аутро, титры)
  pub style_template_id: Option<String>,
  /// Дополнительные свойства клипа
  pub properties: HashMap<String, serde_json::Value>,
}

impl Clip {
  /// Создать новый клип
  pub fn new(source_path: PathBuf, start_time: f64, duration: f64) -> Self {
    Self {
      id: uuid::Uuid::new_v4().to_string(),
      source_path,
      start_time,
      end_time: start_time + duration,
      source_start: 0.0,
      source_end: duration,
      speed: 1.0,
      volume: 1.0,
      locked: false,
      effects: Vec::new(),
      filters: Vec::new(),
      template_id: None,
      template_cell: None,
      style_template_id: None,
      properties: HashMap::new(),
    }
  }

  /// Валидация клипа
  pub fn validate(&self) -> Result<(), String> {
    if self.start_time < 0.0 {
      return Err("Время начала не может быть отрицательным".to_string());
    }

    if self.end_time <= self.start_time {
      return Err("Время окончания должно быть больше времени начала".to_string());
    }

    if self.source_start < 0.0 {
      return Err("Время начала в источнике не может быть отрицательным".to_string());
    }

    if self.source_end <= self.source_start {
      return Err("Время окончания в источнике должно быть больше времени начала".to_string());
    }

    if self.speed <= 0.0 {
      return Err("Скорость должна быть больше 0".to_string());
    }

    if !(0.0..=1.0).contains(&self.volume) {
      return Err("Громкость должна быть в диапазоне 0.0-1.0".to_string());
    }

    if !self.source_path.exists() {
      return Err(format!("Исходный файл не найден: {:?}", self.source_path));
    }

    Ok(())
  }

  /// Получить длительность клипа на timeline
  pub fn get_timeline_duration(&self) -> f64 {
    self.end_time - self.start_time
  }

  /// Получить длительность исходного материала
  pub fn get_source_duration(&self) -> f64 {
    self.source_end - self.source_start
  }
}

/// Эффект, применяемый к клипу или треку
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Effect {
  /// Уникальный идентификатор эффекта
  pub id: String,
  /// Тип эффекта (строка для расширяемости)
  pub effect_type: EffectType,
  /// Название эффекта
  pub name: String,
  /// Категория эффекта
  pub category: Option<EffectCategory>,
  /// Сложность эффекта
  pub complexity: Option<EffectComplexity>,
  /// Теги эффекта
  pub tags: Vec<EffectTag>,
  /// Описание эффекта (локализованное)
  pub description: Option<HashMap<String, String>>,
  /// Метки эффекта (локализованные)
  pub labels: Option<HashMap<String, String>>,
  /// Включен ли эффект
  pub enabled: bool,
  /// Параметры эффекта
  pub parameters: HashMap<String, EffectParameter>,
  /// Время начала эффекта (для анимации)
  pub start_time: Option<f64>,
  /// Время окончания эффекта (для анимации)
  pub end_time: Option<f64>,
  /// FFmpeg команда (в виде шаблона)
  pub ffmpeg_command: Option<String>,
  /// CSS фильтр (в виде шаблона)
  pub css_filter: Option<String>,
  /// Путь к превью
  pub preview_path: Option<String>,
  /// Пресеты эффекта
  pub presets: Option<HashMap<String, EffectPreset>>,
}

/// Пресет эффекта
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct EffectPreset {
  /// Название пресета (локализованное)
  pub name: HashMap<String, String>,
  /// Параметры пресета
  pub params: HashMap<String, EffectParameter>,
  /// Описание пресета (локализованное)
  pub description: HashMap<String, String>,
}

impl Effect {
  /// Создать новый эффект
  pub fn new(effect_type: EffectType, name: String) -> Self {
    Self {
      id: uuid::Uuid::new_v4().to_string(),
      effect_type,
      name,
      category: None,
      complexity: None,
      tags: Vec::new(),
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
    }
  }
}

/// Тип эффекта
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum EffectType {
  /// Размытие
  Blur,
  /// Яркость
  Brightness,
  /// Контрастность
  Contrast,
  /// Скорость
  Speed,
  /// Реверс
  Reverse,
  /// Черно-белый
  Grayscale,
  /// Сепия
  Sepia,
  /// Насыщенность
  Saturation,
  /// Поворот оттенка
  HueRotate,
  /// Винтаж
  Vintage,
  /// Дуотон
  Duotone,
  /// Нуар
  Noir,
  /// Киберпанк
  Cyberpunk,
  /// Мечтательный
  Dreamy,
  /// Инфракрасный
  Infrared,
  /// Матрица
  Matrix,
  /// Арктический
  Arctic,
  /// Закат
  Sunset,
  /// Ломо
  Lomo,
  /// Сумерки
  Twilight,
  /// Неон
  Neon,
  /// Инверсия
  Invert,
  /// Виньетка
  Vignette,
  /// Зерно пленки
  FilmGrain,
  /// Хроматическая аберрация
  ChromaticAberration,
  /// Блик объектива
  LensFlare,
  /// Свечение
  Glow,
  /// Резкость
  Sharpen,
  /// Шумоподавление
  NoiseReduction,
  /// Стабилизация
  Stabilization,
  // Аудио эффекты
  /// Плавное появление звука
  AudioFadeIn,
  /// Плавное затухание звука
  AudioFadeOut,
  /// Кроссфейд между аудио
  AudioCrossfade,
  /// Эквалайзер
  AudioEqualizer,
  /// Компрессор
  AudioCompressor,
  /// Реверберация
  AudioReverb,
  /// Задержка (эхо)
  AudioDelay,
  /// Хорус
  AudioChorus,
  /// Искажение
  AudioDistortion,
  /// Нормализация
  AudioNormalize,
  /// Шумоподавление
  AudioDenoise,
  /// Изменение высоты тона
  AudioPitch,
  /// Изменение темпа
  AudioTempo,
  /// Приглушение (дакинг)
  AudioDucking,
  /// Гейт
  AudioGate,
  /// Лимитер
  AudioLimiter,
  /// Экспандер
  AudioExpander,
  /// Панорамирование
  AudioPan,
  /// Ширина стерео
  AudioStereoWidth,
  /// Фильтр высоких частот
  AudioHighpass,
  /// Фильтр низких частот
  AudioLowpass,
  /// Полосовой фильтр
  AudioBandpass,
}

/// Категория эффекта
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum EffectCategory {
  /// Цветокоррекция
  ColorCorrection,
  /// Художественные
  Artistic,
  /// Винтажные
  Vintage,
  /// Кинематографические
  Cinematic,
  /// Креативные
  Creative,
  /// Технические
  Technical,
  /// Движение и скорость
  Motion,
  /// Искажения
  Distortion,
}

/// Сложность эффекта
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum EffectComplexity {
  /// Базовый
  Basic,
  /// Средний
  Intermediate,
  /// Продвинутый
  Advanced,
}

/// Теги эффектов
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum EffectTag {
  /// Популярный
  Popular,
  /// Профессиональный
  Professional,
  /// Для начинающих
  BeginnerFriendly,
  /// Экспериментальный
  Experimental,
  /// Ретро
  Retro,
  /// Современный
  Modern,
  /// Драматический
  Dramatic,
  /// Тонкий
  Subtle,
  /// Интенсивный
  Intense,
}

/// Параметр эффекта
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum EffectParameter {
  /// Число с плавающей точкой
  Float(f32),
  /// Целое число
  Int(i32),
  /// Строка
  String(String),
  /// Булево значение
  Bool(bool),
  /// Цвет в формате RGBA
  Color(u32),
  /// Массив чисел
  FloatArray(Vec<f32>),
  /// Путь к файлу
  FilePath(PathBuf),
}

/// Фильтр для визуальных эффектов
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Filter {
  /// Уникальный идентификатор фильтра
  pub id: String,
  /// Тип фильтра
  pub filter_type: FilterType,
  /// Название фильтра
  pub name: String,
  /// Включен ли фильтр
  pub enabled: bool,
  /// Параметры фильтра (числовые значения)
  pub parameters: HashMap<String, f64>,
  /// FFmpeg команда для применения фильтра
  pub ffmpeg_command: Option<String>,
}

impl Filter {
  /// Создать новый фильтр
  pub fn new(filter_type: FilterType, name: String) -> Self {
    Self {
      id: uuid::Uuid::new_v4().to_string(),
      filter_type,
      name,
      enabled: true,
      parameters: HashMap::new(),
      ffmpeg_command: None,
    }
  }
}

/// Тип фильтра
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum FilterType {
  /// Яркость
  Brightness,
  /// Контрастность
  Contrast,
  /// Насыщенность
  Saturation,
  /// Гамма
  Gamma,
  /// Температура цвета
  Temperature,
  /// Оттенок
  Tint,
  /// Поворот цвета
  Hue,
  /// Живость цветов
  Vibrance,
  /// Тени
  Shadows,
  /// Светлые тона
  Highlights,
  /// Черные тона
  Blacks,
  /// Белые тона
  Whites,
  /// Четкость
  Clarity,
  /// Удаление дымки
  Dehaze,
  /// Виньетка
  Vignette,
  /// Зернистость
  Grain,
  /// Размытие
  Blur,
  /// Резкость
  Sharpen,
  /// Пользовательский фильтр
  Custom,
}

/// Шаблон многокамерной раскладки
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Template {
  /// Уникальный идентификатор шаблона
  pub id: String,
  /// Тип шаблона
  pub template_type: TemplateType,
  /// Название шаблона
  pub name: String,
  /// Количество видео в шаблоне
  pub screens: usize,
  /// Ячейки шаблона с позициями
  pub cells: Vec<TemplateCell>,
}

impl Template {
  /// Создать новый шаблон
  pub fn new(template_type: TemplateType, name: String, screens: usize) -> Self {
    Self {
      id: uuid::Uuid::new_v4().to_string(),
      template_type,
      name,
      screens,
      cells: Vec::new(),
    }
  }
}

/// Тип шаблона
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum TemplateType {
  /// Вертикальное разделение
  Vertical,
  /// Горизонтальное разделение
  Horizontal,
  /// Диагональное разделение
  Diagonal,
  /// Сетка
  Grid,
  /// Пользовательский
  Custom,
}

/// Ячейка шаблона
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TemplateCell {
  /// Индекс ячейки (0-based)
  pub index: usize,
  /// Позиция X в процентах (0-100)
  pub x: f32,
  /// Позиция Y в процентах (0-100)
  pub y: f32,
  /// Ширина в процентах (0-100)
  pub width: f32,
  /// Высота в процентах (0-100)
  pub height: f32,
  /// Режим масштабирования видео
  pub fit_mode: FitMode,
  /// Горизонтальное выравнивание
  pub align_x: AlignX,
  /// Вертикальное выравнивание
  pub align_y: AlignY,
  /// Дополнительное масштабирование (1.0 = 100%)
  pub scale: Option<f32>,
}

/// Режим масштабирования видео в ячейке
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum FitMode {
  /// Вписать полностью с черными полосами
  Contain,
  /// Заполнить с обрезкой
  Cover,
  /// Растянуть на всю ячейку
  Fill,
}

/// Горизонтальное выравнивание
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum AlignX {
  /// По левому краю
  Left,
  /// По центру
  Center,
  /// По правому краю
  Right,
}

/// Вертикальное выравнивание
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum AlignY {
  /// По верхнему краю
  Top,
  /// По центру
  Center,
  /// По нижнему краю
  Bottom,
}

/// Стильный шаблон (интро, аутро, титры)
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StyleTemplate {
  /// Уникальный идентификатор шаблона
  pub id: String,
  /// Название шаблона
  pub name: String,
  /// Категория шаблона
  pub category: StyleTemplateCategory,
  /// Стиль шаблона
  pub style: StyleTemplateStyle,
  /// Длительность в секундах
  pub duration: f64,
  /// Элементы шаблона
  pub elements: Vec<StyleTemplateElement>,
}

impl StyleTemplate {
  /// Создать новый стильный шаблон
  pub fn new(
    name: String,
    category: StyleTemplateCategory,
    style: StyleTemplateStyle,
    duration: f64,
  ) -> Self {
    Self {
      id: uuid::Uuid::new_v4().to_string(),
      name,
      category,
      style,
      duration,
      elements: Vec::new(),
    }
  }
}

/// Категория стильного шаблона
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum StyleTemplateCategory {
  /// Интро
  Intro,
  /// Аутро
  Outro,
  /// Нижняя треть
  LowerThird,
  /// Титры
  Title,
  /// Переход
  Transition,
  /// Наложение
  Overlay,
}

/// Стиль шаблона
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum StyleTemplateStyle {
  /// Современный
  Modern,
  /// Винтажный
  Vintage,
  /// Минимальный
  Minimal,
  /// Корпоративный
  Corporate,
  /// Креативный
  Creative,
  /// Кинематографический
  Cinematic,
}

/// Элемент стильного шаблона
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StyleTemplateElement {
  /// Уникальный идентификатор элемента
  pub id: String,
  /// Тип элемента
  pub element_type: StyleElementType,
  /// Название элемента
  pub name: String,
  /// Позиция элемента
  pub position: Position2D,
  /// Размер элемента
  pub size: Size2D,
  /// Временные параметры
  pub timing: ElementTiming,
  /// Свойства элемента
  pub properties: StyleElementProperties,
  /// Анимации элемента
  pub animations: Vec<ElementAnimation>,
}

/// Тип элемента стильного шаблона
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum StyleElementType {
  /// Текст
  Text,
  /// Фигура
  Shape,
  /// Изображение
  Image,
  /// Видео
  Video,
  /// Анимация
  Animation,
  /// Частицы
  Particle,
}

/// Позиция в 2D пространстве
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Position2D {
  /// Позиция X в процентах (0-100)
  pub x: f32,
  /// Позиция Y в процентах (0-100)
  pub y: f32,
}

/// Размер в 2D пространстве
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Size2D {
  /// Ширина в процентах (0-100)
  pub width: f32,
  /// Высота в процентах (0-100)
  pub height: f32,
}

/// Временные параметры элемента
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ElementTiming {
  /// Время начала в секундах
  pub start: f64,
  /// Время окончания в секундах
  pub end: f64,
}

/// Свойства элемента стильного шаблона
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StyleElementProperties {
  /// Прозрачность (0-1)
  pub opacity: Option<f32>,
  /// Поворот в градусах
  pub rotation: Option<f32>,
  /// Масштаб
  pub scale: Option<f32>,

  // Текстовые свойства
  /// Текст
  pub text: Option<String>,
  /// Размер шрифта
  pub font_size: Option<f32>,
  /// Семейство шрифтов
  pub font_family: Option<String>,
  /// Цвет
  pub color: Option<String>,
  /// Выравнивание текста
  pub text_align: Option<TextAlign>,
  /// Толщина шрифта
  pub font_weight: Option<FontWeight>,

  // Свойства фигур
  /// Цвет фона
  pub background_color: Option<String>,
  /// Цвет границы
  pub border_color: Option<String>,
  /// Толщина границы
  pub border_width: Option<f32>,
  /// Радиус скругления
  pub border_radius: Option<f32>,

  // Свойства изображений/видео
  /// Источник
  pub src: Option<String>,
  /// Режим заполнения
  pub object_fit: Option<ObjectFit>,
}

/// Выравнивание текста
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum TextAlign {
  /// По левому краю
  Left,
  /// По центру
  Center,
  /// По правому краю
  Right,
}

/// Толщина шрифта
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum FontWeight {
  /// Обычный
  Normal,
  /// Жирный
  Bold,
  /// Тонкий
  Light,
}

/// Режим заполнения объекта
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum ObjectFit {
  /// Вписать с сохранением пропорций
  Contain,
  /// Заполнить с обрезкой
  Cover,
  /// Растянуть
  Fill,
}

/// Анимация элемента
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ElementAnimation {
  /// Уникальный идентификатор анимации
  pub id: String,
  /// Тип анимации
  pub animation_type: AnimationType,
  /// Длительность анимации в секундах
  pub duration: f64,
  /// Задержка перед началом
  pub delay: Option<f64>,
  /// Функция сглаживания
  pub easing: Option<AnimationEasing>,
  /// Направление анимации
  pub direction: Option<AnimationDirection>,
  /// Дополнительные свойства
  pub properties: HashMap<String, serde_json::Value>,
}

/// Тип анимации
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum AnimationType {
  /// Появление
  FadeIn,
  /// Исчезновение
  FadeOut,
  /// Въезд
  SlideIn,
  /// Выезд
  SlideOut,
  /// Увеличение
  ScaleIn,
  /// Уменьшение
  ScaleOut,
  /// Прыжок
  Bounce,
  /// Тряска
  Shake,
}

/// Функция сглаживания анимации
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum AnimationEasing {
  /// Линейная
  Linear,
  /// Плавная
  Ease,
  /// Плавный вход
  EaseIn,
  /// Плавный выход
  EaseOut,
  /// Плавный вход и выход
  EaseInOut,
}

/// Направление анимации
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum AnimationDirection {
  /// Влево
  Left,
  /// Вправо
  Right,
  /// Вверх
  Up,
  /// Вниз
  Down,
}

/// Переход между клипами
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Transition {
  /// Уникальный идентификатор перехода
  pub id: String,
  /// Тип перехода (строка для расширяемости)
  pub transition_type: TransitionType,
  /// Название перехода
  pub name: String,
  /// Метки перехода (локализованные)
  pub labels: Option<HashMap<String, String>>,
  /// Описание перехода (локализованное)
  pub description: Option<HashMap<String, String>>,
  /// Категория перехода
  pub category: Option<TransitionCategory>,
  /// Сложность перехода
  pub complexity: Option<TransitionComplexity>,
  /// Теги перехода
  pub tags: Vec<TransitionTag>,
  /// Настройки длительности
  pub duration: TransitionDuration,
  /// Время начала перехода на timeline
  pub start_time: f64,
  /// ID клипа "от"
  pub from_clip_id: String,
  /// ID клипа "к"
  pub to_clip_id: String,
  /// Параметры перехода
  pub parameters: HashMap<String, EffectParameter>,
  /// FFmpeg команда (в виде шаблона)
  pub ffmpeg_command: Option<String>,
  /// Путь к превью
  pub preview_path: Option<String>,
}

/// Настройки длительности перехода
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TransitionDuration {
  /// Минимальная длительность в секундах
  pub min: f64,
  /// Максимальная длительность в секундах
  pub max: f64,
  /// Длительность по умолчанию
  pub default: f64,
  /// Текущая длительность
  pub current: f64,
}

/// Фильтр видео
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct VideoFilter {
  /// Уникальный идентификатор фильтра
  pub id: String,
  /// Название фильтра
  pub name: String,
  /// Категория фильтра
  pub category: FilterCategory,
  /// Сложность фильтра
  pub complexity: FilterComplexity,
  /// Теги фильтра
  pub tags: Vec<FilterTag>,
  /// Описание фильтра (локализованное)
  pub description: HashMap<String, String>,
  /// Метки фильтра (локализованные)
  pub labels: HashMap<String, String>,
  /// Параметры фильтра
  pub params: HashMap<String, f32>,
}

/// Категория фильтра
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum FilterCategory {
  /// Цветокоррекция
  ColorCorrection,
  /// Технические
  Technical,
  /// Кинематографические
  Cinematic,
  /// Художественные
  Artistic,
  /// Креативные
  Creative,
  /// Винтажные
  Vintage,
}

/// Сложность фильтра
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum FilterComplexity {
  /// Базовый
  Basic,
  /// Средний
  Intermediate,
  /// Продвинутый
  Advanced,
}

/// Тег фильтра
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum FilterTag {
  /// Логарифмический
  Log,
  /// Профессиональный
  Professional,
  /// Стандартный
  Standard,
  /// Нейтральный
  Neutral,
  /// Кинематографический
  Cinematic,
  /// Портрет
  Portrait,
  /// Пейзаж
  Landscape,
  /// Винтажный
  Vintage,
  /// Теплый
  Warm,
  /// Холодный
  Cold,
  /// Драматический
  Dramatic,
  /// Мягкий
  Soft,
  /// Яркий
  Vibrant,
  /// Резервный
  Fallback,
}

/// Тип перехода (расширяемый через строки)
pub type TransitionType = String;

/// Категория перехода
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum TransitionCategory {
  /// Базовые
  Basic,
  /// Продвинутые
  Advanced,
  /// Креативные
  Creative,
  /// 3D
  ThreeD,
  /// Художественные
  Artistic,
  /// Кинематографические
  Cinematic,
}

/// Сложность перехода
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum TransitionComplexity {
  /// Базовый
  Basic,
  /// Средний
  Intermediate,
  /// Продвинутый
  Advanced,
}

/// Тег перехода
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum TransitionTag {
  /// Приближение
  Zoom,
  /// Масштаб
  Scale,
  /// Плавный
  Smooth,
  /// Затухание
  Fade,
  /// Прозрачность
  Opacity,
  /// Классический
  Classic,
  /// Слайд
  Slide,
  /// Движение
  Movement,
  /// Направление
  Direction,
  /// Размер
  Size,
  /// Трансформация
  Transform,
  /// Поворот
  Rotate,
  /// Вращение
  Spin,
  /// Переворот
  Flip,
  /// Зеркало
  Mirror,
  /// Выталкивание
  Push,
  /// Смещение
  Displacement,
  /// Сжатие
  Squeeze,
  /// Компрессия
  Compress,
  /// Эластичный
  Elastic,
  /// Диагональный
  Diagonal,
  /// Угол
  Angle,
  /// Спираль
  Spiral,
  /// Вращение
  Rotation,
  /// 3D
  ThreeD,
  /// Сложный
  Complex,
  /// Резервный
  Fallback,
  /// Шторка
  Wipe,
  /// Горизонтальный
  Horizontal,
  /// Вертикальный
  Vertical,
  /// Радиальный
  Radial,
  /// Круговой
  Circular,
  /// Центр
  Center,
  /// Куб
  Cube,
  /// Страница
  Page,
  /// Поворот
  Turn,
  /// Книга
  Book,
  /// Креативный
  Creative,
  /// Рябь
  Ripple,
  /// Вода
  Water,
  /// Волна
  Wave,
  /// Искажение
  Distortion,
  /// Пиксель
  Pixel,
  /// Цифровой
  Digital,
  /// Ретро
  Retro,
  /// 8-бит
  EightBit,
  /// Растворение
  Dissolve,
  /// Шум
  Noise,
  /// Морфинг
  Morph,
  /// Жидкий
  Fluid,
  /// Глитч
  Glitch,
  /// Современный
  Modern,
  /// Калейдоскоп
  Kaleidoscope,
  /// Геометрический
  Geometric,
  /// Артистический
  Artistic,
  /// Разбитие
  Shatter,
  /// Ломать
  Break,
  /// Стекло
  Glass,
  /// Драматический
  Dramatic,
  /// Горение
  Burn,
  /// Огонь
  Fire,
  /// Кинематографический
  Cinematic,
  /// Жалюзи
  Blinds,
  /// Полосы
  Stripes,
  /// Диафрагма
  Iris,
  /// Камера
  Camera,
  /// Водоворот
  Swirl,
  /// Закручивание
  Twist,
  /// Размытие
  Blur,
  /// Движение
  Motion,
  /// Скорость
  Speed,
  /// ТВ
  Tv,
  /// Помехи
  Static,
  /// Аналоговый
  Analog,
}

/// Настройки проекта
#[derive(Serialize, Deserialize, Debug, Clone, Default)]
pub struct ProjectSettings {
  /// Настройки экспорта
  pub export: ExportSettings,
  /// Настройки превью
  pub preview: PreviewSettings,
  /// Пользовательские настройки
  pub custom: HashMap<String, serde_json::Value>,
}

/// Настройки экспорта
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ExportSettings {
  /// Формат вывода
  pub format: OutputFormat,
  /// Качество (от 1 до 100)
  pub quality: u8,
  /// Битрейт видео (kbps)
  pub video_bitrate: u32,
  /// Битрейт аудио (kbps)
  pub audio_bitrate: u32,
  /// Использовать аппаратное ускорение
  pub hardware_acceleration: bool,
  /// Предпочитаемый GPU кодировщик (опционально)
  pub preferred_gpu_encoder: Option<String>,
  /// Дополнительные параметры FFmpeg
  pub ffmpeg_args: Vec<String>,

  // Новые поля для расширенных настроек
  /// Профиль кодирования
  pub encoding_profile: Option<String>,
  /// Режим контроля битрейта
  pub rate_control_mode: Option<String>,
  /// Интервал ключевых кадров (GOP size)
  pub keyframe_interval: Option<u32>,
  /// Количество B-кадров
  pub b_frames: Option<u32>,
  /// Количество проходов кодирования (1 или 2)
  pub multi_pass: Option<u8>,
  /// Пресет скорости кодирования
  pub preset: Option<String>,
  /// Максимальный битрейт
  pub max_bitrate: Option<u32>,
  /// Минимальный битрейт
  pub min_bitrate: Option<u32>,
  /// CRF значение (0-51)
  pub crf: Option<u8>,
  /// Оптимизация для скорости
  pub optimize_for_speed: Option<bool>,
  /// Оптимизация для сети
  pub optimize_for_network: Option<bool>,
  /// Нормализация аудио
  pub normalize_audio: Option<bool>,
  /// Целевой уровень аудио в LKFS
  pub audio_target: Option<f32>,
  /// Пиковый уровень аудио в dBTP
  pub audio_peak: Option<f32>,
}

impl Default for ExportSettings {
  fn default() -> Self {
    Self {
      format: OutputFormat::Mp4,
      quality: 85,
      video_bitrate: 8000,
      audio_bitrate: 192,
      hardware_acceleration: true,
      preferred_gpu_encoder: None,
      ffmpeg_args: Vec::new(),

      // Новые поля по умолчанию
      encoding_profile: Some("main".to_string()),
      rate_control_mode: Some("vbr".to_string()),
      keyframe_interval: Some(60),
      b_frames: Some(2),
      multi_pass: Some(1),
      preset: Some("medium".to_string()),
      max_bitrate: None,
      min_bitrate: None,
      crf: None,
      optimize_for_speed: Some(false),
      optimize_for_network: Some(false),
      normalize_audio: Some(false),
      audio_target: Some(-23.0),
      audio_peak: Some(-1.0),
    }
  }
}

/// Формат вывода видео
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum OutputFormat {
  Mp4,
  Avi,
  Mov,
  Mkv,
  WebM,
  Gif,
  Custom(String),
}

/// Настройки превью
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PreviewSettings {
  /// Разрешение превью
  pub resolution: (u32, u32),
  /// Качество превью (от 1 до 100)
  pub quality: u8,
  /// FPS превью
  pub fps: u32,
  /// Формат превью
  pub format: PreviewFormat,
}

impl Default for PreviewSettings {
  fn default() -> Self {
    Self {
      resolution: (640, 360),
      quality: 75,
      fps: 15,
      format: PreviewFormat::Jpeg,
    }
  }
}

/// Формат превью
#[derive(Serialize, Deserialize, Debug, Clone)]
pub enum PreviewFormat {
  Jpeg,
  Png,
  WebP,
}

/// Субтитр
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Subtitle {
  /// Уникальный идентификатор субтитра
  pub id: String,
  /// Текст субтитра
  pub text: String,
  /// Время начала в секундах
  pub start_time: f64,
  /// Время окончания в секундах
  pub end_time: f64,
  /// Позиция субтитра на экране
  pub position: SubtitlePosition,
  /// Стиль субтитра
  pub style: SubtitleStyle,
  /// Включен ли субтитр
  pub enabled: bool,
  /// Анимации субтитра
  pub animations: Vec<SubtitleAnimation>,
}

impl Subtitle {
  /// Создать новый субтитр
  pub fn new(text: String, start_time: f64, end_time: f64) -> Self {
    Self {
      id: uuid::Uuid::new_v4().to_string(),
      text,
      start_time,
      end_time,
      position: SubtitlePosition::default(),
      style: SubtitleStyle::default(),
      enabled: true,
      animations: Vec::new(),
    }
  }

  /// Проверить валидность субтитра
  pub fn validate(&self) -> Result<(), String> {
    if self.text.is_empty() {
      return Err("Текст субтитра не может быть пустым".to_string());
    }

    if self.start_time < 0.0 {
      return Err("Время начала не может быть отрицательным".to_string());
    }

    if self.end_time <= self.start_time {
      return Err("Время окончания должно быть больше времени начала".to_string());
    }

    Ok(())
  }

  /// Получить длительность субтитра
  pub fn get_duration(&self) -> f64 {
    self.end_time - self.start_time
  }
}

/// Позиция субтитра на экране
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SubtitlePosition {
  /// Позиция X в процентах (0-100)
  pub x: f32,
  /// Позиция Y в процентах (0-100)  
  pub y: f32,
  /// Выравнивание по горизонтали
  pub align_x: SubtitleAlignX,
  /// Выравнивание по вертикали
  pub align_y: SubtitleAlignY,
  /// Отступы в пикселях
  pub margin: SubtitleMargin,
}

impl Default for SubtitlePosition {
  fn default() -> Self {
    Self {
      x: 50.0, // По центру
      y: 85.0, // Внизу экрана
      align_x: SubtitleAlignX::Center,
      align_y: SubtitleAlignY::Bottom,
      margin: SubtitleMargin::default(),
    }
  }
}

/// Горизонтальное выравнивание субтитра
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum SubtitleAlignX {
  /// По левому краю
  Left,
  /// По центру
  Center,
  /// По правому краю
  Right,
}

/// Вертикальное выравнивание субтитра
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum SubtitleAlignY {
  /// По верхнему краю
  Top,
  /// По центру
  Center,
  /// По нижнему краю
  Bottom,
}

/// Отступы субтитра
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SubtitleMargin {
  /// Отступ сверху в пикселях
  pub top: f32,
  /// Отступ справа в пикселях
  pub right: f32,
  /// Отступ снизу в пикселях
  pub bottom: f32,
  /// Отступ слева в пикселях
  pub left: f32,
}

impl Default for SubtitleMargin {
  fn default() -> Self {
    Self {
      top: 20.0,
      right: 20.0,
      bottom: 20.0,
      left: 20.0,
    }
  }
}

/// Стиль субтитра
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SubtitleStyle {
  /// Название шрифта
  pub font_family: String,
  /// Размер шрифта в пикселях
  pub font_size: f32,
  /// Толщина шрифта
  pub font_weight: SubtitleFontWeight,
  /// Цвет текста (в формате #RRGGBB или #RRGGBBAA)
  pub color: String,
  /// Цвет обводки (опционально)
  pub stroke_color: Option<String>,
  /// Толщина обводки в пикселях
  pub stroke_width: f32,
  /// Цвет тени (опционально)
  pub shadow_color: Option<String>,
  /// Смещение тени по X
  pub shadow_x: f32,
  /// Смещение тени по Y
  pub shadow_y: f32,
  /// Размытие тени
  pub shadow_blur: f32,
  /// Цвет фона (опционально)
  pub background_color: Option<String>,
  /// Прозрачность фона (0-1)
  pub background_opacity: f32,
  /// Отступы текста внутри фона
  pub padding: SubtitlePadding,
  /// Радиус скругления фона
  pub border_radius: f32,
  /// Межстрочный интервал
  pub line_height: f32,
  /// Межбуквенный интервал
  pub letter_spacing: f32,
  /// Максимальная ширина в процентах
  pub max_width: f32,
}

impl Default for SubtitleStyle {
  fn default() -> Self {
    Self {
      font_family: "Arial".to_string(),
      font_size: 24.0,
      font_weight: SubtitleFontWeight::Normal,
      color: "#FFFFFF".to_string(),
      stroke_color: Some("#000000".to_string()),
      stroke_width: 2.0,
      shadow_color: Some("#000000".to_string()),
      shadow_x: 2.0,
      shadow_y: 2.0,
      shadow_blur: 4.0,
      background_color: None,
      background_opacity: 0.8,
      padding: SubtitlePadding::default(),
      border_radius: 4.0,
      line_height: 1.2,
      letter_spacing: 0.0,
      max_width: 80.0,
    }
  }
}

/// Толщина шрифта субтитра
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum SubtitleFontWeight {
  /// Тонкий
  Thin,
  /// Светлый
  Light,
  /// Обычный
  Normal,
  /// Средний
  Medium,
  /// Жирный
  Bold,
  /// Очень жирный
  Black,
}

/// Отступы текста внутри фона субтитра
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SubtitlePadding {
  /// Отступ сверху
  pub top: f32,
  /// Отступ справа
  pub right: f32,
  /// Отступ снизу
  pub bottom: f32,
  /// Отступ слева
  pub left: f32,
}

impl Default for SubtitlePadding {
  fn default() -> Self {
    Self {
      top: 8.0,
      right: 12.0,
      bottom: 8.0,
      left: 12.0,
    }
  }
}

/// Анимация субтитра
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct SubtitleAnimation {
  /// Уникальный идентификатор анимации
  pub id: String,
  /// Тип анимации
  pub animation_type: SubtitleAnimationType,
  /// Длительность анимации в секундах
  pub duration: f64,
  /// Задержка перед началом анимации
  pub delay: f64,
  /// Функция сглаживания
  pub easing: SubtitleEasing,
  /// Направление анимации (для движения)
  pub direction: Option<SubtitleDirection>,
  /// Дополнительные параметры
  pub properties: HashMap<String, serde_json::Value>,
}

impl SubtitleAnimation {
  /// Создать новую анимацию субтитра
  pub fn new(animation_type: SubtitleAnimationType, duration: f64) -> Self {
    Self {
      id: uuid::Uuid::new_v4().to_string(),
      animation_type,
      duration,
      delay: 0.0,
      easing: SubtitleEasing::EaseInOut,
      direction: None,
      properties: HashMap::new(),
    }
  }
}

/// Тип анимации субтитра
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum SubtitleAnimationType {
  /// Появление с изменением прозрачности
  FadeIn,
  /// Исчезновение с изменением прозрачности
  FadeOut,
  /// Въезд с указанного направления
  SlideIn,
  /// Выезд в указанном направлении
  SlideOut,
  /// Увеличение от 0 до полного размера
  ScaleIn,
  /// Уменьшение до 0
  ScaleOut,
  /// Печатающаяся машинка (по буквам)
  Typewriter,
  /// Волна (буквы появляются по очереди)
  Wave,
  /// Подпрыгивание
  Bounce,
  /// Покачивание
  Shake,
  /// Мигание
  Blink,
  /// Растворение (буквы исчезают случайно)
  Dissolve,
}

/// Функция сглаживания анимации субтитра
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum SubtitleEasing {
  /// Линейная
  Linear,
  /// Плавная
  Ease,
  /// Плавный вход
  EaseIn,
  /// Плавный выход
  EaseOut,
  /// Плавный вход и выход
  EaseInOut,
  /// Эластичная
  Elastic,
  /// Прыжок
  Bounce,
}

/// Направление анимации субтитра
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum SubtitleDirection {
  /// Сверху
  Top,
  /// Снизу
  Bottom,
  /// Слева
  Left,
  /// Справа
  Right,
  /// Из центра
  Center,
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_project_schema_creation() {
    let project = ProjectSchema::new("Test Project".to_string());
    assert_eq!(project.metadata.name, "Test Project");
    assert_eq!(project.version, "1.0.0");
    assert_eq!(project.timeline.fps, 30);
    assert_eq!(project.timeline.resolution, (1920, 1080));
  }

  #[test]
  fn test_track_creation() {
    let track = Track::new(TrackType::Video, "Video Track 1".to_string());
    assert_eq!(track.track_type, TrackType::Video);
    assert_eq!(track.name, "Video Track 1");
    assert!(track.enabled);
    assert_eq!(track.volume, 1.0);
    assert!(!track.id.is_empty());
  }

  #[test]
  fn test_clip_creation() {
    let clip = Clip::new(PathBuf::from("/test/video.mp4"), 10.0, 5.0);
    assert_eq!(clip.start_time, 10.0);
    assert_eq!(clip.end_time, 15.0);
    assert_eq!(clip.get_timeline_duration(), 5.0);
    assert_eq!(clip.speed, 1.0);
    assert!(!clip.id.is_empty());
  }

  #[test]
  fn test_effect_creation() {
    let effect = Effect::new(EffectType::Blur, "Blur".to_string());
    assert_eq!(effect.effect_type, EffectType::Blur);
    assert_eq!(effect.name, "Blur");
    assert!(effect.enabled);
    assert!(!effect.id.is_empty());
  }

  #[test]
  fn test_project_validation() {
    let mut project = ProjectSchema::new("Test".to_string());

    // Пустой проект должен быть валидным
    assert!(project.validate().is_ok());

    // Невалидный FPS
    project.timeline.fps = 0;
    assert!(project.validate().is_err());

    // Восстанавливаем валидный FPS
    project.timeline.fps = 30;
    assert!(project.validate().is_ok());

    // Невалидное разрешение
    project.timeline.resolution = (0, 1080);
    assert!(project.validate().is_err());
  }

  #[test]
  fn test_timeline_duration_calculation() {
    let mut project = ProjectSchema::new("Test".to_string());

    // Добавляем трек с клипом
    let mut track = Track::new(TrackType::Video, "Test Track".to_string());
    let clip = Clip::new(PathBuf::from("/test.mp4"), 5.0, 10.0);
    track.clips.push(clip);
    project.tracks.push(track);

    // Длительность должна быть 15.0 (start_time 5.0 + duration 10.0)
    assert_eq!(project.get_duration(), 15.0);
  }

  #[test]
  fn test_effect_parameter_types() {
    let mut params = HashMap::new();
    params.insert("intensity".to_string(), EffectParameter::Float(0.5));
    params.insert("enabled".to_string(), EffectParameter::Bool(true));
    params.insert(
      "name".to_string(),
      EffectParameter::String("test".to_string()),
    );
    params.insert("color".to_string(), EffectParameter::Color(0xFF0000FF));

    assert_eq!(params.len(), 4);
  }

  #[test]
  fn test_serialization() {
    let project = ProjectSchema::new("Serialization Test".to_string());

    // Сериализация в JSON
    let json = serde_json::to_string(&project).unwrap();
    assert!(json.contains("Serialization Test"));

    // Десериализация из JSON
    let deserialized: ProjectSchema = serde_json::from_str(&json).unwrap();
    assert_eq!(deserialized.metadata.name, "Serialization Test");
  }

  #[test]
  fn test_subtitle_creation() {
    let subtitle = Subtitle::new("Привет мир!".to_string(), 10.0, 15.0);
    assert_eq!(subtitle.text, "Привет мир!");
    assert_eq!(subtitle.start_time, 10.0);
    assert_eq!(subtitle.end_time, 15.0);
    assert_eq!(subtitle.get_duration(), 5.0);
    assert!(subtitle.enabled);
    assert!(!subtitle.id.is_empty());
  }

  #[test]
  fn test_subtitle_validation() {
    // Валидный субтитр
    let subtitle = Subtitle::new("Текст".to_string(), 0.0, 5.0);
    assert!(subtitle.validate().is_ok());

    // Пустой текст
    let mut invalid_subtitle = subtitle.clone();
    invalid_subtitle.text = "".to_string();
    assert!(invalid_subtitle.validate().is_err());

    // Отрицательное время начала
    let mut invalid_subtitle = subtitle.clone();
    invalid_subtitle.start_time = -1.0;
    assert!(invalid_subtitle.validate().is_err());

    // Время окончания меньше времени начала
    let mut invalid_subtitle = subtitle.clone();
    invalid_subtitle.end_time = invalid_subtitle.start_time - 1.0;
    assert!(invalid_subtitle.validate().is_err());
  }

  #[test]
  fn test_subtitle_style_default() {
    let style = SubtitleStyle::default();
    assert_eq!(style.font_family, "Arial");
    assert_eq!(style.font_size, 24.0);
    assert_eq!(style.color, "#FFFFFF");
    assert_eq!(style.stroke_width, 2.0);
    assert!(style.stroke_color.is_some());
    assert!(style.shadow_color.is_some());
  }

  #[test]
  fn test_subtitle_position_default() {
    let position = SubtitlePosition::default();
    assert_eq!(position.x, 50.0); // По центру
    assert_eq!(position.y, 85.0); // Внизу экрана
    assert_eq!(position.align_x, SubtitleAlignX::Center);
    assert_eq!(position.align_y, SubtitleAlignY::Bottom);
  }

  #[test]
  fn test_subtitle_animation_creation() {
    let animation = SubtitleAnimation::new(SubtitleAnimationType::FadeIn, 1.0);
    assert_eq!(animation.animation_type, SubtitleAnimationType::FadeIn);
    assert_eq!(animation.duration, 1.0);
    assert_eq!(animation.delay, 0.0);
    assert_eq!(animation.easing, SubtitleEasing::EaseInOut);
    assert!(!animation.id.is_empty());
  }

  #[test]
  fn test_project_schema_duration_calculation() {
    let mut project = ProjectSchema::new("Duration Test".to_string());
    
    // Add a track with clips
    let mut track = Track::new(TrackType::Video, "Video Track".to_string());
    let clip1 = Clip::new(std::path::PathBuf::from("video1.mp4"), 0.0, 10.0);
    let clip2 = Clip::new(std::path::PathBuf::from("video2.mp4"), 10.0, 5.0);
    
    track.add_clip(clip1).unwrap();
    track.add_clip(clip2).unwrap();
    project.tracks.push(track);
    
    // Project duration should be based on the longest track
    let duration = project.get_duration();
    assert_eq!(duration, 15.0); // 0+10 + 10+5 = 15
  }

  #[test]
  fn test_clip_validation_edge_cases() {
    // For testing, we need to use an existing file or skip file existence check
    // Let's test the logic without file existence check
    
    // Test invalid duration - creates clip with negative duration
    let invalid_duration_clip = Clip::new(std::path::PathBuf::from("/tmp/test.mp4"), 0.0, -1.0);
    // The clip is created with end_time = start_time + duration = 0.0 + (-1.0) = -1.0
    // This should fail validation because end_time <= start_time
    assert!(invalid_duration_clip.validate().is_err());
    
    // Test invalid start time
    let invalid_start_clip = Clip::new(std::path::PathBuf::from("/tmp/test.mp4"), -5.0, 10.0);
    assert!(invalid_start_clip.validate().is_err());
    
    // Test valid clip parameters (without file check)
    let mut valid_clip = Clip::new(std::path::PathBuf::from("/tmp/test.mp4"), 0.0, 10.0);
    // Temporarily change source_path to avoid file existence check
    valid_clip.source_path = std::path::PathBuf::from("/dev/null"); // Always exists on Unix
    #[cfg(target_os = "windows")]
    {
      valid_clip.source_path = std::path::PathBuf::from("NUL"); // Windows equivalent
    }
    assert!(valid_clip.validate().is_ok());
  }

  #[test]
  fn test_track_clip_overlap_detection() {
    let mut track = Track::new(TrackType::Video, "Test Track".to_string());
    
    // Add first clip
    let clip1 = Clip::new(std::path::PathBuf::from("video1.mp4"), 0.0, 10.0);
    assert!(track.add_clip(clip1).is_ok());
    
    // Try to add overlapping clip - should fail
    let overlapping_clip = Clip::new(std::path::PathBuf::from("video2.mp4"), 5.0, 10.0);
    assert!(track.add_clip(overlapping_clip).is_err());
    
    // Add non-overlapping clip - should succeed
    let non_overlapping_clip = Clip::new(std::path::PathBuf::from("video3.mp4"), 15.0, 5.0);
    assert!(track.add_clip(non_overlapping_clip).is_ok());
  }

  #[test]
  fn test_effect_parameter_types_extended() {
    let mut effect = Effect::new(EffectType::Blur, "Complex Effect".to_string());
    
    // Test different parameter types
    effect.parameters.insert("float_param".to_string(), EffectParameter::Float(1.5));
    effect.parameters.insert("int_param".to_string(), EffectParameter::Int(42));
    effect.parameters.insert("string_param".to_string(), EffectParameter::String("test".to_string()));
    effect.parameters.insert("bool_param".to_string(), EffectParameter::Bool(true));
    
    // Verify parameters are stored correctly
    assert_eq!(effect.parameters.len(), 4);
    
    if let Some(EffectParameter::Float(val)) = effect.parameters.get("float_param") {
      assert_eq!(*val, 1.5);
    } else {
      panic!("Float parameter not found or wrong type");
    }
    
    if let Some(EffectParameter::Bool(val)) = effect.parameters.get("bool_param") {
      assert_eq!(*val, true);
    } else {
      panic!("Bool parameter not found or wrong type");
    }
  }

  #[test]
  fn test_template_screens_validation() {
    // Valid template with multiple screens
    let valid_template = Template::new(TemplateType::Grid, "4-split".to_string(), 4);
    assert_eq!(valid_template.screens, 4);
    
    // Test maximum screens limit
    let large_template = Template::new(TemplateType::Grid, "16-split".to_string(), 16);
    // Should not crash and should handle reasonable screen counts
    assert_eq!(large_template.screens, 16);
  }

  #[test]
  fn test_filter_type_coverage() {
    // Test creation of different filter types
    let blur_filter = Filter::new(FilterType::Blur, "Blur Filter".to_string());
    assert_eq!(blur_filter.filter_type, FilterType::Blur);
    assert_eq!(blur_filter.name, "Blur Filter");
    
    let brightness_filter = Filter::new(FilterType::Brightness, "Brightness Filter".to_string());
    assert_eq!(brightness_filter.filter_type, FilterType::Brightness);
    
    let contrast_filter = Filter::new(FilterType::Contrast, "Contrast Filter".to_string());
    assert_eq!(contrast_filter.filter_type, FilterType::Contrast);
  }

  #[test]
  fn test_clip_timeline_calculations() {
    let clip = Clip::new(std::path::PathBuf::from("test.mp4"), 10.0, 30.0);
    
    // Timeline duration should equal duration
    assert_eq!(clip.get_timeline_duration(), 30.0);
    
    // Source duration should equal duration (no trimming)
    assert_eq!(clip.get_source_duration(), 30.0);
    
    // Test with trim settings
    let mut trimmed_clip = clip.clone();
    trimmed_clip.source_start = 5.0;
    trimmed_clip.source_end = 25.0;
    
    // Timeline duration unchanged
    assert_eq!(trimmed_clip.get_timeline_duration(), 30.0);
    
    // Source duration should reflect trimming
    assert_eq!(trimmed_clip.get_source_duration(), 20.0); // 25 - 5
  }

  #[test]
  fn test_style_template_defaults() {
    let style_template = StyleTemplate::new(
      "Test Style".to_string(),
      StyleTemplateCategory::Intro,
      StyleTemplateStyle::Modern,
      5.0
    );
    
    assert_eq!(style_template.name, "Test Style");
    assert_eq!(style_template.category, StyleTemplateCategory::Intro);
    assert_eq!(style_template.style, StyleTemplateStyle::Modern);
    assert_eq!(style_template.duration, 5.0);
    assert!(!style_template.id.is_empty());
  }

  #[test]
  fn test_project_touch_functionality() {
    let mut project = ProjectSchema::new("Touch Test".to_string());
    let original_modified = project.metadata.modified_at;
    
    // Wait a bit to ensure timestamp difference
    std::thread::sleep(std::time::Duration::from_millis(10));
    
    project.touch();
    
    // Modified timestamp should be more recent
    assert!(project.metadata.modified_at > original_modified);
  }
}
