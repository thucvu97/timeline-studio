// Категории эффектов
export type EffectCategory =
  | "color-correction"    // Цветокоррекция
  | "artistic"           // Художественные
  | "vintage"            // Винтажные
  | "cinematic"          // Кинематографические
  | "creative"           // Креативные
  | "technical"          // Технические
  | "motion"             // Движение и скорость
  | "distortion"         // Искажения

// Сложность эффекта
export type EffectComplexity = "basic" | "intermediate" | "advanced"

// Теги для эффектов
export type EffectTag =
  | "popular"            // Популярный
  | "professional"       // Профессиональный
  | "beginner-friendly"  // Для начинающих
  | "experimental"       // Экспериментальный
  | "retro"             // Ретро
  | "modern"            // Современный
  | "dramatic"          // Драматический
  | "subtle"            // Тонкий
  | "intense"           // Интенсивный

export interface VideoEffect {
  id: string
  name: string
  type:
    | "blur"
    | "brightness"
    | "contrast"
    | "speed"
    | "reverse"
    | "grayscale"
    | "sepia"
    | "saturation"
    | "hue-rotate"
    | "vintage"
    | "duotone"
    | "noir"
    | "cyberpunk"
    | "dreamy"
    | "infrared"
    | "matrix"
    | "arctic"
    | "sunset"
    | "lomo"
    | "twilight"
    | "neon"
    | "invert"
    | "vignette"
    | "film-grain"
    | "chromatic-aberration"
    | "lens-flare"
    | "glow"
    | "sharpen"
    | "noise-reduction"
    | "stabilization"
  duration: number
  category: EffectCategory
  complexity: EffectComplexity
  tags: EffectTag[]
  description: {
    ru: string
    en: string
  }
  ffmpegCommand: (params: {
    intensity?: number
    speed?: number
    width?: number
    height?: number
    angle?: number
    radius?: number
    amount?: number
    threshold?: number
    temperature?: number
    tint?: number
  }) => string
  // CSS-фильтр для веб-превью
  cssFilter?: (params: {
    intensity?: number
    speed?: number
    angle?: number
    radius?: number
    amount?: number
    threshold?: number
    temperature?: number
    tint?: number
  }) => string
  params?: {
    intensity?: number
    speed?: number
    angle?: number
    radius?: number
    amount?: number
    threshold?: number
    temperature?: number
    tint?: number
  }
  previewPath: string
  labels: {
    ru: string
    en: string
    es: string
    fr: string
    de: string
  }
  // Рекомендуемые настройки для разных сценариев
  presets?: {
    [presetName: string]: {
      name: {
        ru: string
        en: string
      }
      params: Record<string, number>
      description: {
        ru: string
        en: string
      }
    }
  }
}
