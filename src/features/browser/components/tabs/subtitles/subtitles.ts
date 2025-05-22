/**
 * Интерфейс, описывающий стиль субтитров
 */
export interface SubtitleStyle {
  id: string // Уникальный идентификатор стиля
  name: string // Название стиля
  category: string // Категория стиля
  previewUrl?: string // URL превью стиля (если есть)
  isFavorite?: boolean // Флаг избранного стиля
  description?: string // Описание стиля
  fontFamily: string // Семейство шрифта
  fontSize: number // Размер шрифта
  fontWeight: string | number // Жирность шрифта
  fontStyle: string // Стиль шрифта (normal, italic)
  color: string // Цвет текста
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
}

/**
 * Интерфейс, описывающий категорию стилей субтитров
 */
export interface SubtitleCategory {
  id: string // Уникальный идентификатор категории
  name: string // Название категории
  description?: string // Описание категории
  styles: SubtitleStyle[] // Список стилей в категории
}

/**
 * Примеры стилей субтитров для демонстрации
 */
export const SUBTITLE_STYLES: SubtitleStyle[] = [
  // Базовые стили
  {
    id: "basic-white",
    name: "Базовый белый",
    category: "basic",
    fontFamily: "Arial, sans-serif",
    fontSize: 24,
    fontWeight: "normal",
    fontStyle: "normal",
    color: "#ffffff",
    textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
    textAlign: "center",
  },
  {
    id: "basic-yellow",
    name: "Базовый желтый",
    category: "basic",
    fontFamily: "Arial, sans-serif",
    fontSize: 24,
    fontWeight: "normal",
    fontStyle: "normal",
    color: "#ffff00",
    textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
    textAlign: "center",
  },
  // Кинематографические стили
  {
    id: "cinematic-1",
    name: "Кино стиль 1",
    category: "cinematic",
    fontFamily: "Georgia, serif",
    fontSize: 28,
    fontWeight: "bold",
    fontStyle: "normal",
    color: "#ffffff",
    textShadow: "0 2px 6px rgba(0, 0, 0, 0.8)",
    letterSpacing: 1,
    textAlign: "center",
  },
  {
    id: "cinematic-2",
    name: "Кино стиль 2",
    category: "cinematic",
    fontFamily: "Palatino, serif",
    fontSize: 26,
    fontWeight: "normal",
    fontStyle: "italic",
    color: "#f0f0f0",
    textShadow: "0 3px 5px rgba(0, 0, 0, 0.7)",
    letterSpacing: 0.5,
    textAlign: "center",
  },
  // Стилизованные
  {
    id: "stylized-1",
    name: "Стилизованный 1",
    category: "stylized",
    fontFamily: "Impact, sans-serif",
    fontSize: 30,
    fontWeight: "bold",
    fontStyle: "normal",
    color: "#ffffff",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    padding: 10,
    borderRadius: 5,
    textAlign: "center",
  },
  {
    id: "stylized-2",
    name: "Стилизованный 2",
    category: "stylized",
    fontFamily: "Comic Sans MS, cursive",
    fontSize: 24,
    fontWeight: "normal",
    fontStyle: "normal",
    color: "#ffcc00",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    padding: 8,
    borderRadius: 10,
    textAlign: "center",
  },
  // Минималистичные
  {
    id: "minimal-1",
    name: "Минималистичный 1",
    category: "minimal",
    fontFamily: "Helvetica, Arial, sans-serif",
    fontSize: 22,
    fontWeight: 300,
    fontStyle: "normal",
    color: "#ffffff",
    letterSpacing: 1,
    textAlign: "center",
  },
  {
    id: "minimal-2",
    name: "Минималистичный 2",
    category: "minimal",
    fontFamily: "Roboto, sans-serif",
    fontSize: 20,
    fontWeight: "normal",
    fontStyle: "normal",
    color: "#f0f0f0",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    padding: 6,
    textAlign: "center",
  },
]

/**
 * Категории стилей субтитров
 */
export const SUBTITLE_CATEGORIES: SubtitleCategory[] = [
  {
    id: "basic",
    name: "Базовые",
    description: "Простые стили без сложного оформления",
    styles: SUBTITLE_STYLES.filter((style) => style.category === "basic"),
  },
  {
    id: "cinematic",
    name: "Кинематографические",
    description: "Стили, имитирующие субтитры в фильмах",
    styles: SUBTITLE_STYLES.filter((style) => style.category === "cinematic"),
  },
  {
    id: "stylized",
    name: "Стилизованные",
    description: "Стили с художественным оформлением",
    styles: SUBTITLE_STYLES.filter((style) => style.category === "stylized"),
  },
  {
    id: "minimal",
    name: "Минималистичные",
    description: "Простые и лаконичные стили",
    styles: SUBTITLE_STYLES.filter((style) => style.category === "minimal"),
  },
]

/**
 * Пример текста для превью субтитров
 */
export const SUBTITLE_PREVIEW_TEXT = "Пример текста субтитров"

/**
 * Получение стиля субтитров по ID
 */
export const getSubtitleStyleById = (id: string): SubtitleStyle | undefined => {
  return SUBTITLE_STYLES.find((style) => style.id === id)
}

/**
 * Получение категории субтитров по ID
 */
export const getSubtitleCategoryById = (id: string): SubtitleCategory | undefined => {
  return SUBTITLE_CATEGORIES.find((category) => category.id === id)
}

/**
 * Преобразование стиля субтитров в CSS объект
 */
export const subtitleStyleToCss = (style: SubtitleStyle): React.CSSProperties => {
  return {
    fontFamily: style.fontFamily,
    fontSize: `${style.fontSize}px`,
    fontWeight: style.fontWeight,
    fontStyle: style.fontStyle,
    color: style.color,
    backgroundColor: style.backgroundColor,
    textShadow: style.textShadow,
    letterSpacing: style.letterSpacing ? `${style.letterSpacing}px` : undefined,
    lineHeight: style.lineHeight,
    textAlign: style.textAlign as any,
    padding: style.padding,
    borderRadius: style.borderRadius,
    textTransform: style.textTransform as any,
    opacity: style.opacity,
    border: style.border,
  }
}
