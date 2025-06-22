//! Subtitles - Субтитры и их настройки

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

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

  // Поля для обратной совместимости
  /// Семейство шрифта
  pub font_family: String,
  /// Размер шрифта
  pub font_size: f32,
  /// Цвет текста
  pub color: String,
  /// Прозрачность
  pub opacity: f32,
  /// Жирность шрифта
  pub font_weight: SubtitleFontWeight,
  /// Тень
  pub shadow: bool,
  /// Обводка
  pub outline: bool,
  /// Длительность (вычисляется)
  pub duration: f64,
}

impl Subtitle {
  /// Создать новый субтитр
  pub fn new(text: String, start_time: f64, end_time: f64) -> Self {
    let duration = end_time - start_time;
    Self {
      id: uuid::Uuid::new_v4().to_string(),
      text,
      start_time,
      end_time,
      position: SubtitlePosition::default(),
      style: SubtitleStyle::default(),
      enabled: true,
      animations: Vec::new(),
      // Поля для обратной совместимости
      font_family: "Arial".to_string(),
      font_size: 24.0,
      color: "#FFFFFF".to_string(),
      opacity: 1.0,
      font_weight: SubtitleFontWeight::Normal,
      shadow: true,
      outline: true,
      duration,
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
#[serde(tag = "type")]
pub enum SubtitlePosition {
  /// Абсолютная позиция
  Absolute { x: f32, y: f32 },
  /// Относительная позиция с выравниванием
  Relative {
    align_x: SubtitleAlignX,
    align_y: SubtitleAlignY,
  },
}

impl Default for SubtitlePosition {
  fn default() -> Self {
    Self::Relative {
      align_x: SubtitleAlignX::Center,
      align_y: SubtitleAlignY::Bottom,
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
  /// По центру (альтернативное название)
  Middle,
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
  /// Время начала анимации (для обратной совместимости)
  pub start_time: f64,
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
      start_time: 0.0,
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
  /// Масштабирование (для обратной совместимости)
  Scale,
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
