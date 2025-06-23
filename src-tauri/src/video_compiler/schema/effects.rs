//! Effects - Эффекты, фильтры и переходы

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;

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
  #[allow(dead_code)]
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
  // Добавляем отсутствующие типы для обратной совместимости
  /// Цветокоррекция
  ColorCorrection,
  /// Хромакей
  ChromaKey,
  /// Пользовательский эффект
  Custom,
  /// Общий аудио фейд
  AudioFade,
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
  /// Интенсивность фильтра (для обратной совместимости)
  pub intensity: f32,
  /// Пользовательский фильтр (для обратной совместимости)
  pub custom_filter: Option<String>,
}

impl Filter {
  /// Создать новый фильтр
  #[allow(dead_code)]
  pub fn new(filter_type: FilterType, name: String) -> Self {
    Self {
      id: uuid::Uuid::new_v4().to_string(),
      filter_type,
      name,
      enabled: true,
      parameters: HashMap::new(),
      ffmpeg_command: None,
      intensity: 1.0,
      custom_filter: None,
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
  /// Оттенок
  Hue,
  /// Размытие
  Blur,
  /// Резкость
  Sharpen,
  /// Виньетка
  Vignette,
  /// Зерно
  Grain,
  /// Свечение
  Glow,
  /// Тени/Света
  ShadowsHighlights,
  /// Баланс белого
  WhiteBalance,
  /// Экспозиция
  Exposure,
  /// Кривые
  Curves,
  /// Уровни
  Levels,
  /// Цветовой баланс
  ColorBalance,
  /// Пользовательский
  Custom,
}

/// Переход между клипами
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Transition {
  /// Уникальный идентификатор перехода
  pub id: String,
  /// Тип перехода
  pub transition_type: String,
  /// Название перехода
  pub name: String,
  /// Длительность перехода
  pub duration: TransitionDuration,
  /// Категория перехода
  pub category: Option<TransitionCategory>,
  /// Теги перехода
  pub tags: Vec<TransitionTag>,
  /// Сложность перехода
  pub complexity: Option<TransitionComplexity>,
  /// Включен ли переход
  pub enabled: bool,
  /// Параметры перехода
  pub parameters: HashMap<String, serde_json::Value>,
  /// FFmpeg команда для перехода
  pub ffmpeg_command: Option<String>,
  /// Кривая плавности перехода
  pub easing: Option<String>,
  /// Направление перехода
  pub direction: Option<String>,
}

/// Длительность перехода
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TransitionDuration {
  /// Основная длительность в секундах
  pub value: f64,
  /// Минимальная длительность
  pub min: Option<f64>,
  /// Максимальная длительность
  pub max: Option<f64>,
}

impl std::fmt::Display for TransitionDuration {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    write!(f, "{}", self.value)
  }
}

/// Категория перехода
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum TransitionCategory {
  /// Базовые переходы
  Basic,
  /// Растворение
  Dissolve,
  /// Слайды
  Slide,
  /// Вытеснение
  Wipe,
  /// 3D переходы
  ThreeD,
  /// Морфинг
  Morph,
  /// Искажения
  Distortion,
  /// Геометрические
  Geometric,
  /// Световые
  Light,
  /// Частицы
  Particle,
  /// Специальные
  Special,
}

/// Сложность перехода
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum TransitionComplexity {
  /// Простой
  Simple,
  /// Средний
  Medium,
  /// Сложный
  Complex,
}

/// Теги переходов
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum TransitionTag {
  /// Плавный
  Smooth,
  /// Резкий
  Sharp,
  /// Элегантный
  Elegant,
  /// Динамичный
  Dynamic,
  /// Минималистичный
  Minimal,
  /// Драматичный
  Dramatic,
  /// Современный
  Modern,
  /// Классический
  Classic,
  /// Креативный
  Creative,
  /// Быстрый
  Fast,
  /// Медленный
  Slow,
}

/// Видео фильтр
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct VideoFilter {
  /// ID фильтра
  pub id: String,
  /// Тип фильтра
  pub filter_type: String,
  /// Название
  pub name: String,
  /// Категория
  pub category: FilterCategory,
  /// Теги
  pub tags: Vec<FilterTag>,
  /// Сложность
  pub complexity: FilterComplexity,
  /// Параметры
  pub parameters: HashMap<String, serde_json::Value>,
  /// FFmpeg команда
  pub ffmpeg_command: String,
  /// CSS фильтр
  pub css_filter: Option<String>,
}

/// Категория фильтра
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum FilterCategory {
  /// Цветокоррекция
  ColorCorrection,
  /// Стилизация
  Stylization,
  /// Размытие и резкость
  BlurSharpness,
  /// Искажения
  Distortion,
  /// Световые эффекты
  LightEffects,
  /// Художественные
  Artistic,
  /// Утилиты
  Utility,
}

/// Сложность фильтра
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum FilterComplexity {
  /// Простой
  Simple,
  /// Средний
  Medium,
  /// Сложный
  Complex,
}

/// Теги фильтров
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum FilterTag {
  /// Цвет
  Color,
  /// Свет
  Light,
  /// Тень
  Shadow,
  /// Размытие
  Blur,
  /// Резкость
  Sharpen,
  /// Искажение
  Distort,
  /// Стиль
  Style,
  /// Винтаж
  Vintage,
  /// Современный
  Modern,
  /// Художественный
  Artistic,
  /// Технический
  Technical,
  /// Быстрый
  Fast,
  /// Качественный
  Quality,
}
