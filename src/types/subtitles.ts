// Категории стилей субтитров
export type SubtitleCategory =
  | "basic"        // Базовые
  | "cinematic"    // Кинематографические
  | "stylized"     // Стилизованные
  | "minimal"      // Минималистичные
  | "animated"     // Анимированные
  | "modern"       // Современные

// Сложность стиля субтитров
export type SubtitleComplexity = "basic" | "intermediate" | "advanced"

// Теги для стилей субтитров
export type SubtitleTag =
  | "simple"       // Простой
  | "clean"        // Чистый
  | "readable"     // Читаемый
  | "elegant"      // Элегантный
  | "professional" // Профессиональный
  | "movie"        // Кинематографический
  | "bold"         // Жирный
  | "dramatic"     // Драматический
  | "neon"         // Неоновый
  | "glow"         // Свечение
  | "futuristic"   // Футуристический
  | "retro"        // Ретро
  | "vintage"      // Винтажный
  | "minimal"      // Минималистичный
  | "modern"       // Современный
  | "animated"     // Анимированный
  | "typewriter"   // Печатная машинка
  | "fade"         // Затухание
  | "gradient"     // Градиент
  | "colorful"     // Цветной

/**
 * Интерфейс, описывающий стиль субтитров
 */
export interface SubtitleStyle {
  id: string; // Уникальный идентификатор стиля
  name: string; // Название стиля
  category: SubtitleCategory; // Категория стиля
  complexity: SubtitleComplexity; // Сложность стиля
  tags: SubtitleTag[]; // Теги стиля
  description: {
    ru: string;
    en: string;
  }; // Описание стиля
  labels: {
    ru: string;
    en: string;
    es?: string;
    fr?: string;
    de?: string;
  }; // Локализованные названия
  style: {
    fontFamily?: string; // Семейство шрифта
    fontSize?: number; // Размер шрифта
    fontWeight?: string | number; // Жирность шрифта
    fontStyle?: string; // Стиль шрифта (normal, italic)
    color?: string; // Цвет текста
    backgroundColor?: string; // Цвет фона
    textShadow?: string; // Тень текста
    letterSpacing?: number; // Межбуквенное расстояние
    lineHeight?: number; // Высота строки
    textAlign?: string; // Выравнивание текста
    padding?: string | number; // Отступы
    borderRadius?: string | number; // Скругление углов фона
    animation?: string; // Анимация появления/исчезновения
    textTransform?: string; // Трансформация текста (uppercase, lowercase, capitalize)
    opacity?: number; // Прозрачность
    border?: string; // Граница
    background?: string; // Градиентный фон
    WebkitBackgroundClip?: string; // Клип фона для градиентного текста
    WebkitTextFillColor?: string; // Цвет заливки текста для градиентов
  }; // CSS стили
}

/**
 * Интерфейс, описывающий объект категории стилей субтитров
 */
export interface SubtitleCategoryInfo {
  id: string; // Уникальный идентификатор категории
  name: string; // Название категории
  description?: string; // Описание категории
  styles: SubtitleStyle[]; // Список стилей в категории
}

/**
 * Интерфейс для субтитра с временными метками
 */
export interface Subtitle {
  id: string; // Уникальный ID субтитра
  startTime: number; // Время начала (в секундах)
  endTime: number; // Время окончания (в секундах)
  text: string; // Текст субтитра
  style?: SubtitleStyle; // Стиль субтитра
  speaker?: string; // Говорящий (если известно)
  confidence?: number; // Уверенность распознавания (0-1)
  language?: string; // Язык субтитра
}
