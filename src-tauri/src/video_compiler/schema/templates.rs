//! Templates - Шаблоны и стилевые шаблоны

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

use super::common::{AlignX, AlignY, FitMode, Position2D, Size2D};

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
  /// Регионы шаблона (для обратной совместимости)
  pub regions: Vec<TemplateRegion>,
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
      regions: Vec::new(),
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

/// Регион шаблона (для обратной совместимости)
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TemplateRegion {
  pub x: u32,
  pub y: u32,
  pub width: u32,
  pub height: u32,
  pub padding: u32,
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
  /// Цвет фона (для обратной совместимости)
  pub background_color: String,
  /// Переходы (для обратной совместимости)
  pub transitions: Vec<serde_json::Value>,
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
      background_color: "#000000".to_string(),
      transitions: Vec::new(),
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
  /// Контент элемента (для обратной совместимости)
  pub content: String,
  /// Стиль элемента (для обратной совместимости)
  pub style: Option<ElementStyle>,
}

/// Элемент стиля (для обратной совместимости)
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StyleElement {
  pub id: String,
  pub element_type: StyleElementType,
  pub position: Position2D,
  pub size: Size2D,
  pub content: String,
  pub style: Option<ElementStyle>,
  pub animations: Vec<ElementAnimation>,
}

/// Стиль элемента (для обратной совместимости)
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ElementStyle {
  pub font_family: Option<String>,
  pub font_size: Option<u32>,
  pub color: Option<String>,
  pub background_color: Option<String>,
}

/// Тип элемента стильного шаблона
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum StyleElementType {
  /// Текст
  Text,
  /// Изображение
  Image,
  /// Видео
  Video,
  /// Форма (прямоугольник, круг и т.д.)
  Shape,
  /// Линия
  Line,
  /// Иконка
  Icon,
  /// Частицы
  Particles,
}

/// Временные параметры элемента
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ElementTiming {
  /// Время появления в секундах
  pub in_time: f64,
  /// Время исчезновения в секундах
  pub out_time: f64,
  /// Длительность в секундах
  pub duration: f64,
}

/// Свойства элемента стильного шаблона
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct StyleElementProperties {
  /// Текстовое содержимое (для текстовых элементов)
  pub text: Option<String>,
  /// Семейство шрифта
  pub font_family: Option<String>,
  /// Размер шрифта
  pub font_size: Option<f32>,
  /// Толщина шрифта
  pub font_weight: Option<FontWeight>,
  /// Стиль шрифта
  pub font_style: Option<FontStyle>,
  /// Цвет текста
  pub text_color: Option<String>,
  /// Выравнивание текста
  pub text_align: Option<TextAlign>,
  /// Цвет заливки
  pub fill_color: Option<String>,
  /// Цвет обводки
  pub stroke_color: Option<String>,
  /// Толщина обводки
  pub stroke_width: Option<f32>,
  /// Прозрачность
  pub opacity: Option<f32>,
  /// Поворот в градусах
  pub rotation: Option<f32>,
  /// Масштаб
  pub scale: Option<f32>,
  /// Тень
  pub shadow: Option<ShadowProperties>,
  /// Размытие
  pub blur: Option<f32>,
  /// Путь к изображению (для изображений)
  pub image_path: Option<String>,
  /// Режим масштабирования изображения
  pub object_fit: Option<ObjectFit>,
  /// Тип формы (для форм)
  pub shape_type: Option<ShapeType>,
  /// Радиус скругления углов
  pub border_radius: Option<f32>,
  /// Дополнительные свойства
  pub custom: HashMap<String, serde_json::Value>,
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
  /// По ширине
  Justify,
}

/// Толщина шрифта
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum FontWeight {
  /// Тонкий (100)
  Thin,
  /// Очень легкий (200)
  ExtraLight,
  /// Легкий (300)
  Light,
  /// Обычный (400)
  Normal,
  /// Средний (500)
  Medium,
  /// Полужирный (600)
  SemiBold,
  /// Жирный (700)
  Bold,
  /// Очень жирный (800)
  ExtraBold,
  /// Черный (900)
  Black,
}

/// Стиль шрифта
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum FontStyle {
  /// Обычный
  Normal,
  /// Курсив
  Italic,
  /// Наклонный
  Oblique,
}

/// Режим масштабирования изображения
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum ObjectFit {
  /// Заполнить контейнер с обрезкой
  Cover,
  /// Вписать полностью
  Contain,
  /// Заполнить контейнер с искажением
  Fill,
  /// Оригинальный размер
  None,
  /// Уменьшить если больше контейнера
  ScaleDown,
}

/// Тип формы
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum ShapeType {
  /// Прямоугольник
  Rectangle,
  /// Круг
  Circle,
  /// Эллипс
  Ellipse,
  /// Треугольник
  Triangle,
  /// Звезда
  Star,
  /// Многоугольник
  Polygon,
  /// Линия
  Line,
  /// Стрелка
  Arrow,
}

/// Свойства тени
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ShadowProperties {
  /// Смещение по X
  pub offset_x: f32,
  /// Смещение по Y
  pub offset_y: f32,
  /// Размытие
  pub blur: f32,
  /// Распространение
  pub spread: f32,
  /// Цвет
  pub color: String,
}

/// Анимация элемента
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct ElementAnimation {
  /// Уникальный идентификатор анимации
  pub id: String,
  /// Тип анимации
  pub animation_type: AnimationType,
  /// Длительность в секундах
  pub duration: f64,
  /// Задержка в секундах
  pub delay: f64,
  /// Функция сглаживания
  pub easing: AnimationEasing,
  /// Количество повторений (0 = бесконечно)
  pub repeat: u32,
  /// Направление анимации
  pub direction: AnimationDirection,
  /// Дополнительные свойства анимации
  pub properties: HashMap<String, serde_json::Value>,
}

/// Тип анимации
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum AnimationType {
  /// Появление
  FadeIn,
  /// Исчезновение
  FadeOut,
  /// Слайд
  Slide,
  /// Масштабирование
  Scale,
  /// Поворот
  Rotate,
  /// Подпрыгивание
  Bounce,
  /// Покачивание
  Shake,
  /// Пульсация
  Pulse,
  /// Мерцание
  Flicker,
  /// Печатная машинка
  Typewriter,
  /// Путь движения
  MotionPath,
  /// Морфинг
  Morph,
  /// Параллакс
  Parallax,
  /// Растворение
  Dissolve,
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
  /// Квадратичная
  Quad,
  /// Кубическая
  Cubic,
  /// Квартичная
  Quart,
  /// Квинтичная
  Quint,
  /// Синусоидальная
  Sine,
  /// Экспоненциальная
  Expo,
  /// Круговая
  Circ,
  /// Эластичная
  Elastic,
  /// Возвратная
  Back,
  /// Прыжок
  Bounce,
}

/// Направление анимации
#[derive(Serialize, Deserialize, Debug, Clone, PartialEq)]
pub enum AnimationDirection {
  /// Обычное
  Normal,
  /// Обратное
  Reverse,
  /// Чередование
  Alternate,
  /// Чередование с обратным началом
  AlternateReverse,
}
