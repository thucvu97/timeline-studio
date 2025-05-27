import { VideoEffect } from "@/types/effects"

/**
 * Интерфейс для сырых данных эффекта из JSON
 */
interface RawEffectData {
  id: string
  name: string
  type: string
  duration: number
  category: string
  complexity: string
  tags: string[]
  description: {
    ru: string
    en: string
  }
  ffmpegCommand: string
  cssFilter?: string
  params: Record<string, any>
  previewPath: string
  labels: {
    ru: string
    en: string
    es: string
    fr: string
    de: string
  }
  presets?: Record<string, any>
}

/**
 * Создает функцию из строкового шаблона с параметрами
 * Заменяет {paramName} на значения из объекта параметров
 */
function createFunctionFromTemplate(template: string) {
  return (params: Record<string, any> = {}) => {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      const value = params[key]
      return value !== undefined ? value.toString() : match
    })
  }
}

/**
 * Обрабатывает сырые данные эффекта из JSON и преобразует их в VideoEffect
 */
export function processEffect(rawEffect: RawEffectData): VideoEffect {
  const processedEffect: VideoEffect = {
    ...rawEffect,
    // Преобразуем строковые шаблоны в функции
    ffmpegCommand: createFunctionFromTemplate(rawEffect.ffmpegCommand),
    cssFilter: rawEffect.cssFilter ? createFunctionFromTemplate(rawEffect.cssFilter) : undefined,
  } as VideoEffect

  return processedEffect
}

/**
 * Обрабатывает массив сырых эффектов из JSON
 */
export function processEffects(rawEffects: RawEffectData[]): VideoEffect[] {
  return rawEffects.map(processEffect)
}

/**
 * Валидирует структуру данных эффекта
 */
export function validateEffect(effect: any): effect is RawEffectData {
  if (!effect || typeof effect !== "object") {
    return false
  }

  const requiredFields = ["id", "name", "type", "category", "complexity", "description", "ffmpegCommand", "labels"]

  return requiredFields.every((field) => field in effect)
}

/**
 * Валидирует массив эффектов
 */
export function validateEffectsData(data: any): boolean {
  if (!data || !Array.isArray(data.effects)) {
    return false
  }

  // Проверяем метаданные
  if (data.version && data.totalEffects) {
    console.log(
      `📊 Effects metadata: v${data.version}, ${data.totalEffects} effects, updated: ${data.lastUpdated || "unknown"}`,
    )
  }

  return data.effects.every(validateEffect)
}

/**
 * Создает fallback эффект в случае ошибки загрузки
 */
export function createFallbackEffect(id: string): VideoEffect {
  return {
    id,
    name: "Неизвестный эффект",
    type: "brightness" as any,
    duration: 0,
    category: "color-correction",
    complexity: "basic",
    tags: [],
    description: {
      ru: "Эффект не найден",
      en: "Effect not found",
    },
    ffmpegCommand: () => "brightness=1",
    cssFilter: () => "brightness(1)",
    params: {},
    previewPath: "/t1.mp4",
    labels: {
      ru: "Неизвестный",
      en: "Unknown",
      es: "Desconocido",
      fr: "Inconnu",
      de: "Unbekannt",
    },
  }
}
