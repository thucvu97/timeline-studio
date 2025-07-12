/**
 * Допустимые значения для активного таба в браузере
 * Определяют, какой тип контента отображается в браузере
 */
export const BROWSER_TABS = [
  "media", // Медиа-файлы (видео, изображения)
  "music", // Музыкальные файлы
  "subtitles", // Субтитры
  "transitions", // Переходы между сценами
  "effects", // Эффекты для видео
  "filters", // Фильтры для видео
  "templates", // Шаблоны проектов
  "style-templates", // Стилевые шаблоны
] as const

export const DEFAULT_TAB = "media" // Таб по умолчанию

/**
 * Тип таба браузера
 */
export type BrowserTab = (typeof BROWSER_TABS)[number]
