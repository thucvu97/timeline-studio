/**
 * Утилита для управления превью видео эффектов
 * Позволяет отображать специфичные превью для разных эффектов
 */

export interface EffectPreviewConfig {
  videoPath: string
  description?: string
  duration?: number
}

// Маппинг эффектов на их превью видео
export const EFFECT_PREVIEW_MAPPING: Record<string, EffectPreviewConfig> = {
  // Цветокоррекция
  brightness: {
    videoPath: "/previews/brightness-demo.mp4",
    description: "Демонстрация изменения яркости",
    duration: 3
  },
  contrast: {
    videoPath: "/previews/contrast-demo.mp4", 
    description: "Демонстрация изменения контраста",
    duration: 3
  },
  saturation: {
    videoPath: "/previews/saturation-demo.mp4",
    description: "Демонстрация изменения насыщенности",
    duration: 3
  },
  temperature: {
    videoPath: "/previews/temperature-demo.mp4",
    description: "Демонстрация изменения цветовой температуры",
    duration: 4
  },
  exposure: {
    videoPath: "/previews/exposure-demo.mp4",
    description: "Демонстрация изменения экспозиции",
    duration: 4
  },
  
  // Художественные эффекты
  blur: {
    videoPath: "/previews/blur-demo.mp4",
    description: "Демонстрация размытия",
    duration: 3
  },
  pixelate: {
    videoPath: "/previews/pixelate-demo.mp4",
    description: "Демонстрация пикселизации",
    duration: 3
  },
  emboss: {
    videoPath: "/previews/emboss-demo.mp4",
    description: "Демонстрация рельефа",
    duration: 3
  },
  
  // Винтажные эффекты
  vintage: {
    videoPath: "/previews/vintage-demo.mp4",
    description: "Демонстрация винтажного эффекта",
    duration: 4
  },
  sepia: {
    videoPath: "/previews/sepia-demo.mp4",
    description: "Демонстрация сепии",
    duration: 3
  },
  noir: {
    videoPath: "/previews/noir-demo.mp4",
    description: "Демонстрация черно-белого стиля",
    duration: 4
  },
  
  // Креативные эффекты
  glitch: {
    videoPath: "/previews/glitch-demo.mp4",
    description: "Демонстрация глитч эффекта",
    duration: 3
  },
  neon: {
    videoPath: "/previews/neon-demo.mp4",
    description: "Демонстрация неонового эффекта",
    duration: 4
  },
  hologram: {
    videoPath: "/previews/hologram-demo.mp4",
    description: "Демонстрация голографического эффекта",
    duration: 5
  },
  "zoom-blur": {
    videoPath: "/previews/zoom-blur-demo.mp4",
    description: "Демонстрация радиального размытия",
    duration: 3
  },
  
  // Движение
  speed: {
    videoPath: "/previews/speed-demo.mp4",
    description: "Демонстрация изменения скорости",
    duration: 5
  },
  reverse: {
    videoPath: "/previews/reverse-demo.mp4",
    description: "Демонстрация реверса",
    duration: 4
  },
  "motion-blur": {
    videoPath: "/previews/motion-blur-demo.mp4",
    description: "Демонстрация размытия движения",
    duration: 4
  },
  
  // Технические эффекты
  sharpen: {
    videoPath: "/previews/sharpen-demo.mp4",
    description: "Демонстрация повышения резкости",
    duration: 3
  },
  "noise-reduction": {
    videoPath: "/previews/noise-reduction-demo.mp4",
    description: "Демонстрация шумоподавления",
    duration: 4
  },
  stabilization: {
    videoPath: "/previews/stabilization-demo.mp4",
    description: "Демонстрация стабилизации",
    duration: 5
  },
  "edge-enhance": {
    videoPath: "/previews/edge-enhance-demo.mp4",
    description: "Демонстрация усиления краев",
    duration: 3
  },
  
  // Fallback для эффектов без специфичного превью
  default: {
    videoPath: "/t1.mp4",
    description: "Общее превью эффекта",
    duration: 5
  }
}

/**
 * Получить конфигурацию превью для эффекта
 * @param effectId ID эффекта
 * @returns Конфигурация превью с fallback на default
 */
export function getEffectPreview(effectId: string): EffectPreviewConfig {
  return EFFECT_PREVIEW_MAPPING[effectId] || EFFECT_PREVIEW_MAPPING.default
}

/**
 * Проверить существование превью для эффекта
 * @param effectId ID эффекта
 * @returns true если есть специфичное превью, false если используется default
 */
export function hasCustomPreview(effectId: string): boolean {
  return effectId in EFFECT_PREVIEW_MAPPING && effectId !== 'default'
}

/**
 * Получить список всех эффектов с кастомными превью
 * @returns Массив ID эффектов с кастомными превью
 */
export function getEffectsWithCustomPreviews(): string[] {
  return Object.keys(EFFECT_PREVIEW_MAPPING).filter(id => id !== 'default')
}

/**
 * Сгенерировать путь к превью на основе ID эффекта
 * Используется для автоматической генерации путей
 * @param effectId ID эффекта
 * @returns Путь к файлу превью
 */
export function generatePreviewPath(effectId: string): string {
  return `/previews/${effectId}-demo.mp4`
}