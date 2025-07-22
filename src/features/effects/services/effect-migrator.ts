/**
 * Effect Migrator - Миграция эффектов из старой системы в новую
 * Поддерживает постепенную миграцию и валидацию
 */

import type { BaseEffect, EffectCategory, EffectParameter } from "../types/unified-effects"

// Старый формат эффекта (из effects.json)
interface OldEffect {
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
    [key: string]: string
  }
  ffmpegCommand?: string
  cssFilter?: string
  params?: Record<string, any>
  previewPath?: string
  labels: {
    ru: string
    en: string
    [key: string]: string
  }
  presets?: Record<
    string,
    {
      name: Record<string, string>
      params: Record<string, any>
      description?: Record<string, string>
    }
  >
}

// Маппинг старых категорий в новые
const CATEGORY_MAPPING: Record<string, EffectCategory> = {
  "color-correction": "color_correction",
  vintage: "stylize",
  artistic: "stylize",
  cinematic: "stylize",
  creative: "stylize",
  technical: "color_correction",
  motion: "motion",
  distortion: "distort",
}

// Маппинг типов эффектов в новые категории
const TYPE_TO_CATEGORY: Record<string, EffectCategory> = {
  // Color correction
  brightness: "color_correction",
  contrast: "color_correction",
  saturation: "color_correction",
  "hue-rotate": "color_correction",
  grayscale: "color_correction",
  sepia: "color_correction",
  invert: "color_correction",

  // Blur & Sharpen
  blur: "blur_sharpen",
  sharpen: "blur_sharpen",

  // Stylize
  vintage: "stylize",
  duotone: "stylize",
  noir: "stylize",
  cyberpunk: "stylize",
  dreamy: "stylize",
  infrared: "stylize",
  matrix: "stylize",
  arctic: "stylize",
  sunset: "stylize",
  lomo: "stylize",
  twilight: "stylize",
  neon: "stylize",

  // Lighting
  vignette: "lighting",
  glow: "lighting",
  "lens-flare": "lighting",

  // Noise & Grain
  "film-grain": "noise_grain",
  "noise-reduction": "noise_grain",

  // Distort
  "chromatic-aberration": "distort",
  "lens-distortion": "distort",

  // Motion & Temporal
  speed: "temporal",
  reverse: "temporal",
  stabilization: "motion",
}

export class EffectMigrator {
  private migratedCount = 0
  private skippedCount = 0
  private errors: Array<{ effectId: string; error: string }> = []

  /**
   * Мигрирует один эффект из старого формата в новый
   */
  migrateEffect(oldEffect: OldEffect): BaseEffect | null {
    try {
      // Определяем новую категорию
      const category = this.determineCategory(oldEffect)

      // Конвертируем параметры
      const parameters = this.migrateParameters(oldEffect.params || {})

      // Создаем базовый эффект в новом формате
      const newEffect: BaseEffect = {
        // Идентификация
        id: `effect_${oldEffect.id}`,
        name: this.migrateLabels(oldEffect.labels),
        description: oldEffect.description,

        // Классификация
        category,
        scope: this.determineScope(oldEffect),
        processingType: this.determineProcessingType(oldEffect),

        // Версия
        version: "1.0.0",

        // Метаданные
        tags: this.migrateTags(oldEffect.tags),

        // Производительность
        complexity: this.migrateComplexity(oldEffect.complexity),
        gpuAccelerated: this.isGpuAccelerated(oldEffect),

        // Параметры
        parameters,

        // Пресеты
        presets: this.migratePresets(oldEffect.presets),

        // Превью
        preview: oldEffect.previewPath,

        // Процессоры
        processors: this.createProcessors(oldEffect),
      }

      this.migratedCount++
      return newEffect
    } catch (error) {
      this.errors.push({
        effectId: oldEffect.id,
        error: error instanceof Error ? error.message : "Unknown error",
      })
      this.skippedCount++
      return null
    }
  }

  /**
   * Мигрирует массив эффектов
   */
  migrateEffects(oldEffects: OldEffect[]): BaseEffect[] {
    const migrated: BaseEffect[] = []

    for (const oldEffect of oldEffects) {
      const newEffect = this.migrateEffect(oldEffect)
      if (newEffect) {
        migrated.push(newEffect)
      }
    }

    return migrated
  }

  /**
   * Мигрирует эффекты по категориям (для постепенной миграции)
   */
  migrateByCategory(oldEffects: OldEffect[], category: string): BaseEffect[] {
    const filtered = oldEffects.filter((e) => e.category === category)
    return this.migrateEffects(filtered)
  }

  /**
   * Мигрирует только определенные типы эффектов
   */
  migrateByTypes(oldEffects: OldEffect[], types: string[]): BaseEffect[] {
    const filtered = oldEffects.filter((e) => types.includes(e.type))
    return this.migrateEffects(filtered)
  }

  // ============================================================================
  // ПРИВАТНЫЕ МЕТОДЫ МИГРАЦИИ
  // ============================================================================

  private determineCategory(oldEffect: OldEffect): EffectCategory {
    // Сначала проверяем по типу эффекта
    if (TYPE_TO_CATEGORY[oldEffect.type]) {
      return TYPE_TO_CATEGORY[oldEffect.type]
    }

    // Затем по старой категории
    if (CATEGORY_MAPPING[oldEffect.category]) {
      return CATEGORY_MAPPING[oldEffect.category]
    }

    // По умолчанию - стилизация
    return "stylize"
  }

  private determineScope(oldEffect: OldEffect): Array<"clip" | "track" | "sequence" | "global"> {
    // Временные эффекты только для клипов
    if (["speed", "reverse"].includes(oldEffect.type)) {
      return ["clip"]
    }

    // Цветокоррекция может применяться везде
    if (oldEffect.category === "color-correction") {
      return ["clip", "track", "sequence"]
    }

    // По умолчанию - клип и трек
    return ["clip", "track"]
  }

  private determineProcessingType(oldEffect: OldEffect): "realtime" | "render" | "hybrid" {
    // Если есть CSS фильтр - может работать в realtime
    if (oldEffect.cssFilter && !oldEffect.ffmpegCommand) {
      return "realtime"
    }

    // Если только FFmpeg - требует рендеринга
    if (oldEffect.ffmpegCommand && !oldEffect.cssFilter) {
      return "render"
    }

    // Если есть оба - гибридный
    return "hybrid"
  }

  private migrateLabels(labels: Record<string, string>): Record<string, string> {
    // Убеждаемся что есть минимум en и ru
    return {
      en: labels.en || labels.ru || "Unknown Effect",
      ru: labels.ru || labels.en || "Неизвестный эффект",
      ...labels,
    }
  }

  private migrateTags(oldTags: string[]): string[] {
    const tagMapping: Record<string, string> = {
      popular: "popular",
      "beginner-friendly": "beginner",
      professional: "pro",
      experimental: "experimental",
      retro: "vintage",
      modern: "modern",
      dramatic: "dramatic",
      subtle: "subtle",
      intense: "intense",
    }

    return oldTags.map((tag) => tagMapping[tag] || tag)
  }

  private migrateComplexity(oldComplexity: string): "low" | "medium" | "high" | "extreme" {
    const mapping: Record<string, "low" | "medium" | "high" | "extreme"> = {
      basic: "low",
      intermediate: "medium",
      advanced: "high",
    }

    return mapping[oldComplexity] || "medium"
  }

  private isGpuAccelerated(oldEffect: OldEffect): boolean {
    // Эффекты с CSS фильтрами могут ускоряться GPU
    return !!oldEffect.cssFilter
  }

  private migrateParameters(oldParams: Record<string, any>): EffectParameter[] {
    const parameters: EffectParameter[] = []

    for (const [key, value] of Object.entries(oldParams)) {
      const param = this.createParameter(key, value)
      if (param) {
        parameters.push(param)
      }
    }

    return parameters
  }

  private createParameter(key: string, defaultValue: any): EffectParameter | null {
    // Определяем тип параметра
    const type =
      typeof defaultValue === "number"
        ? "number"
        : typeof defaultValue === "boolean"
          ? "boolean"
          : typeof defaultValue === "string"
            ? "text"
            : "number"

    // Определяем диапазоны для известных параметров
    const paramRanges: Record<string, { min: number; max: number; step: number }> = {
      intensity: { min: 0, max: 2, step: 0.01 },
      brightness: { min: -1, max: 1, step: 0.01 },
      contrast: { min: 0, max: 2, step: 0.01 },
      saturation: { min: 0, max: 2, step: 0.01 },
      hue: { min: -180, max: 180, step: 1 },
      temperature: { min: -100, max: 100, step: 1 },
      tint: { min: -100, max: 100, step: 1 },
      radius: { min: 0, max: 100, step: 0.1 },
      amount: { min: 0, max: 100, step: 1 },
      speed: { min: 0.1, max: 10, step: 0.1 },
    }

    const range = paramRanges[key]

    return {
      id: key,
      name: {
        en: this.formatParameterName(key),
        ru: this.translateParameterName(key),
      },
      type: type as any,
      defaultValue,
      ...(range || {}),
      animatable: true,
      visible: true,
      enabled: true,
    }
  }

  private formatParameterName(key: string): string {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim()
  }

  private translateParameterName(key: string): string {
    const translations: Record<string, string> = {
      intensity: "Интенсивность",
      brightness: "Яркость",
      contrast: "Контраст",
      saturation: "Насыщенность",
      hue: "Оттенок",
      temperature: "Температура",
      tint: "Тонирование",
      radius: "Радиус",
      amount: "Количество",
      speed: "Скорость",
      angle: "Угол",
      threshold: "Порог",
    }

    return translations[key] || this.formatParameterName(key)
  }

  private migratePresets(oldPresets?: Record<string, any>): any[] {
    if (!oldPresets) return []

    return Object.entries(oldPresets).map(([id, preset]) => ({
      id,
      name: preset.name || { en: id, ru: id },
      description: preset.description,
      parameters: preset.params || {},
      tags: [],
    }))
  }

  private createProcessors(oldEffect: OldEffect): any {
    const processors: any = {}

    // CSS процессор
    if (oldEffect.cssFilter) {
      processors.css = {
        filter: this.createCssFilterFunction(oldEffect.cssFilter),
      }
    }

    // FFmpeg процессор
    if (oldEffect.ffmpegCommand) {
      processors.ffmpeg = {
        filter: this.createFfmpegFilterFunction(oldEffect.ffmpegCommand),
      }
    }

    // WebGL процессор для некоторых эффектов
    const webglEffect = this.createWebGLProcessor(oldEffect)
    if (webglEffect) {
      processors.webgl = webglEffect
    }

    return processors
  }

  private createCssFilterFunction(template: string): (params: any) => string {
    return (params: any) => {
      const intensity = params.intensity || 1
      const amount = params.amount || 50
      const radius = params.radius || 5
      const angle = params.angle || 0
      const threshold = params.threshold || 0.5
      const temperature = params.temperature || 0
      const tint = params.tint || 0
      const speed = params.speed || 1

      // Заменяем переменные в шаблоне
      return template
        .replace(/\$\{intensity\}/g, String(intensity))
        .replace(/\$\{amount\}/g, String(amount))
        .replace(/\$\{radius\}/g, String(radius))
        .replace(/\$\{angle\}/g, String(angle))
        .replace(/\$\{threshold\}/g, String(threshold))
        .replace(/\$\{temperature\}/g, String(temperature))
        .replace(/\$\{tint\}/g, String(tint))
        .replace(/\$\{speed\}/g, String(speed))
    }
  }

  private createFfmpegFilterFunction(template: string): (params: any) => string {
    return (params: any) => {
      const intensity = params.intensity || 1
      const amount = params.amount || 50
      const radius = params.radius || 5
      const angle = params.angle || 0
      const threshold = params.threshold || 0.5
      const temperature = params.temperature || 0
      const tint = params.tint || 0
      const speed = params.speed || 1

      // Заменяем переменные в шаблоне
      return template
        .replace(/\$\{intensity\}/g, String(intensity))
        .replace(/\$\{amount\}/g, String(amount))
        .replace(/\$\{radius\}/g, String(radius))
        .replace(/\$\{angle\}/g, String(angle))
        .replace(/\$\{threshold\}/g, String(threshold))
        .replace(/\$\{temperature\}/g, String(temperature))
        .replace(/\$\{tint\}/g, String(tint))
        .replace(/\$\{speed\}/g, String(speed))
    }
  }

  private createWebGLProcessor(oldEffect: OldEffect): any {
    // Создаем WebGL процессоры для некоторых эффектов
    const webglShaders: Record<string, string> = {
      brightness: `
        precision mediump float;
        uniform sampler2D u_texture;
        uniform float u_intensity;
        varying vec2 v_texCoord;
        
        void main() {
          vec4 color = texture2D(u_texture, v_texCoord);
          gl_FragColor = vec4(color.rgb * u_intensity, color.a);
        }
      `,
      contrast: `
        precision mediump float;
        uniform sampler2D u_texture;
        uniform float u_intensity;
        varying vec2 v_texCoord;
        
        void main() {
          vec4 color = texture2D(u_texture, v_texCoord);
          vec3 adjusted = (color.rgb - 0.5) * u_intensity + 0.5;
          gl_FragColor = vec4(adjusted, color.a);
        }
      `,
    }

    if (webglShaders[oldEffect.type]) {
      return {
        fragmentShader: webglShaders[oldEffect.type],
        uniforms: {
          u_texture: 0,
          u_intensity: 1,
        },
      }
    }

    return null
  }

  // ============================================================================
  // СТАТИСТИКА МИГРАЦИИ
  // ============================================================================

  getStats() {
    return {
      migrated: this.migratedCount,
      skipped: this.skippedCount,
      errors: this.errors,
      successRate: (this.migratedCount / (this.migratedCount + this.skippedCount)) * 100,
    }
  }

  reset() {
    this.migratedCount = 0
    this.skippedCount = 0
    this.errors = []
  }
}
