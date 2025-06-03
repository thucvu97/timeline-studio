import { VideoFilter } from "@/features/filters/types/filters"

/**
 * Интерфейс для параметров CSS-фильтра
 */
interface CSSFilterParams {
  brightness?: number
  contrast?: number
  saturation?: number
  gamma?: number
  temperature?: number
  tint?: number
  hue?: number
  vibrance?: number
  shadows?: number
  highlights?: number
  blacks?: number
  whites?: number
  clarity?: number
  dehaze?: number
  vignette?: number
  grain?: number
}

/**
 * Генерирует CSS filter строку из параметров фильтра
 * @param params - Параметры фильтра
 * @returns CSS filter строка
 */
export function generateCSSFilter(params: CSSFilterParams): string {
  const filters: string[] = []

  // Основные CSS-фильтры
  if (params.brightness !== undefined) {
    filters.push(`brightness(${Math.max(0, 1 + params.brightness)})`)
  }

  if (params.contrast !== undefined) {
    filters.push(`contrast(${Math.max(0, params.contrast)})`)
  }

  if (params.saturation !== undefined) {
    filters.push(`saturate(${Math.max(0, params.saturation)})`)
  }

  // Цветовые корректировки
  if (params.hue !== undefined) {
    filters.push(`hue-rotate(${params.hue}deg)`)
  }

  if (params.temperature !== undefined) {
    // Температура: положительные значения = теплее (желтее), отрицательные = холоднее (синее)
    const tempValue = Math.abs(params.temperature) * 0.01 // Нормализуем значение
    if (params.temperature > 0) {
      filters.push(`sepia(${Math.min(1, tempValue)})`)
    } else {
      filters.push(`hue-rotate(${params.temperature * 2}deg)`)
    }
  }

  if (params.tint !== undefined) {
    filters.push(`hue-rotate(${params.tint}deg)`)
  }

  // Дополнительные эффекты (эмулируем через доступные CSS-фильтры)
  if (params.clarity !== undefined && params.clarity !== 0) {
    // Clarity через contrast и небольшой sharpen эффект
    const clarityValue = 1 + params.clarity * 0.3
    filters.push(`contrast(${Math.max(0.1, clarityValue)})`)
  }

  if (params.vibrance !== undefined && params.vibrance !== 0) {
    // Vibrance через дополнительную насыщенность
    const vibranceValue = 1 + params.vibrance * 0.5
    filters.push(`saturate(${Math.max(0.1, vibranceValue)})`)
  }

  // Shadows и highlights эмулируем через brightness корректировки
  if (params.shadows !== undefined && params.shadows !== 0) {
    const shadowValue = 1 + params.shadows * 0.2
    filters.push(`brightness(${Math.max(0.1, shadowValue)})`)
  }

  if (params.highlights !== undefined && params.highlights !== 0) {
    const highlightValue = 1 - params.highlights * 0.1
    filters.push(`brightness(${Math.max(0.1, highlightValue)})`)
  }

  // Объединяем все фильтры в одну строку
  return filters.join(" ")
}

/**
 * Применяет CSS-фильтр к HTML элементу
 * @param element - HTML элемент
 * @param params - Параметры фильтра
 */
export function applyCSSFilter(element: HTMLElement, params: CSSFilterParams): void {
  const filterString = generateCSSFilter(params)
  element.style.filter = filterString
}

/**
 * Сбрасывает CSS-фильтр с HTML элемента
 * @param element - HTML элемент
 */
export function resetCSSFilter(element: HTMLElement): void {
  element.style.filter = ""
}

/**
 * Генерирует CSS-фильтр из объекта VideoFilter
 * @param filter - Объект фильтра
 * @returns CSS filter строка
 */
export function filterToCSSFilter(filter: VideoFilter): string {
  return generateCSSFilter(filter.params)
}

/**
 * Предустановленные CSS-фильтры для быстрого применения
 */
export const presetCSSFilters = {
  // Базовые фильтры
  none: "",
  brighten: "brightness(1.2)",
  darken: "brightness(0.8)",
  highContrast: "contrast(1.5)",
  lowContrast: "contrast(0.7)",
  saturate: "saturate(1.5)",
  desaturate: "saturate(0.5)",

  // Цветовые эффекты
  warm: "sepia(0.3) hue-rotate(10deg)",
  cool: "hue-rotate(-10deg) saturate(1.1)",
  vintage: "sepia(0.5) contrast(0.9) brightness(1.1)",

  // Художественные эффекты
  dramatic: "contrast(1.4) saturate(1.2) brightness(0.9)",
  soft: "contrast(0.8) brightness(1.1) saturate(0.9)",
  vivid: "contrast(1.2) saturate(1.8) brightness(1.05)",

  // Технические профили (эмуляция)
  rec709: "contrast(1) saturate(1) brightness(1)",
  slog: "contrast(0.8) saturate(0.9) brightness(1.1)",
  flat: "contrast(0.7) saturate(0.7) brightness(1)",
} as const

/**
 * Получает предустановленный CSS-фильтр по имени
 * @param presetName - Имя предустановки
 * @returns CSS filter строка
 */
export function getPresetCSSFilter(presetName: keyof typeof presetCSSFilters): string {
  return presetCSSFilters[presetName] || ""
}

/**
 * Комбинирует несколько CSS-фильтров
 * @param filters - Массив CSS filter строк
 * @returns Объединенная CSS filter строка
 */
export function combineCSSFilters(filters: string[]): string {
  return filters.filter((f) => f.trim()).join(" ")
}

/**
 * Парсит CSS filter строку в объект параметров (упрощенная версия)
 * @param filterString - CSS filter строка
 * @returns Объект с параметрами
 */
export function parseCSSFilter(filterString: string): Partial<CSSFilterParams> {
  const params: Partial<CSSFilterParams> = {}

  // Простой парсинг основных фильтров
  const brightnessMatch = /brightness\(([^)]+)\)/.exec(filterString)
  if (brightnessMatch) {
    params.brightness = Number.parseFloat(brightnessMatch[1]) - 1
  }

  const contrastMatch = /contrast\(([^)]+)\)/.exec(filterString)
  if (contrastMatch) {
    params.contrast = Number.parseFloat(contrastMatch[1])
  }

  const saturateMatch = /saturate\(([^)]+)\)/.exec(filterString)
  if (saturateMatch) {
    params.saturation = Number.parseFloat(saturateMatch[1])
  }

  const hueMatch = /hue-rotate\(([^)]+)deg\)/.exec(filterString)
  if (hueMatch) {
    params.hue = Number.parseFloat(hueMatch[1])
  }

  return params
}

/**
 * Валидирует параметры CSS-фильтра
 * @param params - Параметры для валидации
 * @returns true если параметры валидны
 */
export function validateCSSFilterParams(params: CSSFilterParams): boolean {
  // Проверяем, что все числовые значения находятся в разумных пределах
  const numericParams = [
    "brightness",
    "contrast",
    "saturation",
    "gamma",
    "temperature",
    "tint",
    "hue",
    "vibrance",
    "shadows",
    "highlights",
    "blacks",
    "whites",
    "clarity",
    "dehaze",
    "vignette",
    "grain",
  ] as const

  for (const param of numericParams) {
    const value = params[param]
    if (value !== undefined) {
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return false
      }

      // Проверяем разумные пределы для некоторых параметров
      if (param === "brightness" && (value < -1 || value > 2)) return false
      if (param === "contrast" && (value < 0 || value > 3)) return false
      if (param === "saturation" && (value < 0 || value > 3)) return false
      if (param === "hue" && (value < -360 || value > 360)) return false
    }
  }

  return true
}
