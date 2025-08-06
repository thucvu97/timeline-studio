// Категории стилей субтитров
export type SubtitleCategory =
  | "basic" // Базовые
  | "cinematic" // Кинематографические
  | "stylized" // Стилизованные
  | "minimal" // Минималистичные
  | "animated" // Анимированные
  | "modern" // Современные

// Сложность стиля субтитров
export type SubtitleComplexity = "basic" | "intermediate" | "advanced"

// Теги для стилей субтитров
export type SubtitleTag =
  | "simple" // Простой
  | "clean" // Чистый
  | "readable" // Читаемый
  | "elegant" // Элегантный
  | "professional" // Профессиональный
  | "movie" // Кинематографический
  | "bold" // Жирный
  | "dramatic" // Драматический
  | "neon" // Неоновый
  | "glow" // Свечение
  | "futuristic" // Футуристический
  | "retro" // Ретро
  | "vintage" // Винтажный
  | "minimal" // Минималистичный
  | "modern" // Современный
  | "animated" // Анимированный
  | "typewriter" // Печатная машинка
  | "fade" // Затухание
  | "gradient" // Градиент
  | "colorful" // Цветной
  | "fallback" // Резервный

/**
 * Интерфейс, описывающий стиль субтитров
 */
export interface SubtitleStyleTemplate {
  id: string // Уникальный идентификатор стиля
  name: string // Название стиля
  category: SubtitleCategory // Категория стиля
  complexity: SubtitleComplexity // Сложность стиля
  tags: SubtitleTag[] // Теги стиля
  description: {
    ru: string
    en: string
  } // Описание стиля
  labels: {
    ru: string
    en: string
    es?: string
    fr?: string
    de?: string
  } // Локализованные названия
  style: {
    fontFamily?: string // Семейство шрифта
    fontSize?: number // Размер шрифта
    fontWeight?: string | number // Жирность шрифта
    fontStyle?: string // Стиль шрифта (normal, italic)
    color?: string // Цвет текста
    backgroundColor?: string // Цвет фона
    textShadow?: string // Тень текста
    letterSpacing?: number // Межбуквенное расстояние
    lineHeight?: number // Высота строки
    textAlign?: string // Выравнивание текста
    padding?: string | number // Отступы
    borderRadius?: string | number // Скругление углов фона
    animation?: string // Анимация появления/исчезновения
    textTransform?: string // Трансформация текста (uppercase, lowercase, capitalize)
    opacity?: number // Прозрачность
    border?: string // Граница
    background?: string // Градиентный фон
    WebkitBackgroundClip?: string // Клип фона для градиентного текста
    WebkitTextFillColor?: string // Цвет заливки текста для градиентов
  } // CSS стили
}

/**
 * Интерфейс, описывающий объект категории стилей субтитров
 */
export interface SubtitleCategoryInfo {
  id: string // Уникальный идентификатор категории
  name: string // Название категории
  description?: string // Описание категории
  styles: SubtitleStyleTemplate[] // Список стилей в категории
}

/**
 * Интерфейс для субтитра с временными метками
 */
export interface Subtitle {
  id: string // Уникальный ID субтитра
  startTime: number // Время начала (в секундах)
  endTime: number // Время окончания (в секундах)
  text: string // Текст субтитра
  style?: SubtitleStyleTemplate // Стиль субтитра
  speaker?: string // Говорящий (если известно)
  confidence?: number // Уверенность распознавания (0-1)
  language?: string // Язык субтитра
}

/**
 * Типы анимаций субтитров (синхронизировано с Backend)
 */
export type SubtitleAnimationType =
  | "fade"
  | "slide"
  | "scale"
  | "typewriter"
  | "wave"
  | "bounce"
  | "shake"
  | "blink"
  | "dissolve"

/**
 * Функции сглаживания анимации
 */
export type SubtitleEasing = "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out" | "elastic" | "bounce"

/**
 * Направление анимации
 */
export type SubtitleDirection = "top" | "bottom" | "left" | "right" | "center"

/**
 * Выравнивание субтитров
 */
export type SubtitleAlignment =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "middle-center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right"

/**
 * Интерфейс анимации субтитра
 */
export interface SubtitleAnimation {
  type: SubtitleAnimationType
  duration: number // В секундах
  delay?: number // Задержка перед началом
  easing?: SubtitleEasing
  direction?: SubtitleDirection // Для slide анимаций
}

/**
 * Интерфейс позиционирования субтитра
 */
export interface SubtitlePosition {
  alignment: SubtitleAlignment
  marginX?: number // Отступ по горизонтали в пикселях
  marginY?: number // Отступ по вертикали в пикселях
}

/**
 * Интерфейс стиля субтитра (inline переопределения)
 */
export interface SubtitleInlineStyle {
  fontFamily?: string
  fontSize?: number
  fontWeight?: string | number
  fontStyle?: string
  color?: string
  backgroundColor?: string
  textShadow?: string
  textAlign?: string
  lineHeight?: number
  letterSpacing?: number
  textTransform?: string
  animation?: string
  background?: string
  WebkitBackgroundClip?: string
  WebkitTextFillColor?: string
  padding?: string
  borderRadius?: string
  // Дополнительные стили из Backend
  strokeColor?: string
  strokeWidth?: number
  shadowColor?: string
  shadowX?: number
  shadowY?: number
  shadowBlur?: number
  backgroundOpacity?: number
  maxWidth?: number // В процентах
}

/**
 * Унифицированный интерфейс для клипа субтитров на таймлайне
 * Объединяет функциональность из subtitles и timeline модулей
 */
export interface SubtitleClip {
  // Основные поля клипа
  id: string
  trackId: string
  type: "subtitle"
  startTime: number
  duration: number

  // Содержание субтитра
  text: string

  // Стиль субтитра
  subtitleStyleId?: string // Ссылка на стиль из ресурсов
  style?: SubtitleInlineStyle // Inline переопределения стиля
  formatting?: SubtitleInlineStyle // Альтернативное название для совместимости

  // Позиционирование
  subtitlePosition?: SubtitlePosition
  position?: {
    // Для совместимости с общим ClipPosition
    x: number
    y: number
    width?: number
    height?: number
    rotation?: number
    scaleX?: number
    scaleY?: number
  }

  // Анимации
  animationIn?: SubtitleAnimation
  animationOut?: SubtitleAnimation

  // Дополнительные настройки
  wordWrap?: boolean
  maxWidth?: number // Максимальная ширина в процентах
  enabled?: boolean // Включен ли субтитр

  // Поля для совместимости с timeline
  name?: string
  sourceId?: string
  mediaStartTime?: number
  mediaEndTime?: number
  effects?: any[]
  transitions?: any[]
  metadata?: Record<string, any>
}

/**
 * Результат импорта файла субтитров
 */
export interface SubtitleImportResult {
  content: string
  format: string
  file_name: string
}

/**
 * Опции экспорта субтитров
 */
export interface SubtitleExportOptions {
  format: "srt" | "vtt" | "ass"
  content: string
  output_path: string
}
