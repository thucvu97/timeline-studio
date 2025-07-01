import { VideoEffect } from "@/features/effects/types"

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
function createFunctionFromTemplate(template: string | undefined | null) {
  return (params: Record<string, any> = {}) => {
    // Return empty string if template is not a string
    if (typeof template !== "string") {
      console.warn("createFunctionFromTemplate: template is not a string:", template)
      return ""
    }

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
  if (!rawEffect || typeof rawEffect !== "object") {
    throw new Error("processEffect: Invalid effect data")
  }

  // Проверяем обязательные поля
  if (!rawEffect.id || !rawEffect.name) {
    throw new Error(`processEffect: Effect missing required fields - id: ${rawEffect.id}, name: ${rawEffect.name}`)
  }

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
  if (!Array.isArray(rawEffects)) {
    console.error("processEffects: rawEffects is not an array", rawEffects)
    return []
  }

  return rawEffects
    .filter((effect) => effect != null) // Фильтруем null и undefined
    .map((effect) => {
      try {
        return processEffect(effect)
      } catch (error) {
        console.error("processEffects: Failed to process effect", effect, error)
        return null
      }
    })
    .filter((effect): effect is VideoEffect => effect !== null) // Убираем null результаты
}

/**
 * Валидирует структуру данных эффекта
 */
export function validateEffect(effect: any): effect is RawEffectData {
  if (!effect || typeof effect !== "object") {
    return false
  }

  const requiredFields = ["id", "name", "type", "category", "complexity", "description", "ffmpegCommand", "labels"]

  return requiredFields.every((field) => field in effect && effect[field] !== undefined)
}

/**
 * Валидирует массив эффектов
 */
export function validateEffectsData(data: any): boolean {
  if (!data || !Array.isArray(data.effects)) {
    console.error("validateEffectsData: Invalid data structure", data)
    return false
  }

  // Проверяем метаданные
  if (data.version && data.totalEffects) {
    console.log(
      `📊 Effects metadata: v${data.version}, ${data.totalEffects} effects, updated: ${data.lastUpdated || "unknown"}`,
    )
  }

  // Фильтруем null/undefined элементы перед валидацией
  const validEffects = data.effects.filter((effect: any) => effect != null)
  if (validEffects.length !== data.effects.length) {
    console.warn(`validateEffectsData: Found ${data.effects.length - validEffects.length} null/undefined effects`)
  }

  return validEffects.every(validateEffect)
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
