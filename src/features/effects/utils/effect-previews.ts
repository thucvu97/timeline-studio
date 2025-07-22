/**
 * Утилиты для работы с превью эффектов
 */

interface EffectPreview {
  videoPath: string
  thumbnailPath?: string
  duration?: number
}

// Маппинг эффектов на превью видео
const effectPreviewMap: Record<string, EffectPreview> = {
  // Базовые эффекты
  brightness: {
    videoPath: "/preview-videos/effects/brightness.mp4",
    thumbnailPath: "/preview-videos/effects/brightness-thumb.jpg",
    duration: 3,
  },
  contrast: {
    videoPath: "/preview-videos/effects/contrast.mp4",
    thumbnailPath: "/preview-videos/effects/contrast-thumb.jpg",
    duration: 3,
  },
  saturation: {
    videoPath: "/preview-videos/effects/saturation.mp4",
    thumbnailPath: "/preview-videos/effects/saturation-thumb.jpg",
    duration: 3,
  },

  // Цветовые эффекты
  sepia: {
    videoPath: "/preview-videos/effects/sepia.mp4",
    thumbnailPath: "/preview-videos/effects/sepia-thumb.jpg",
    duration: 3,
  },
  grayscale: {
    videoPath: "/preview-videos/effects/grayscale.mp4",
    thumbnailPath: "/preview-videos/effects/grayscale-thumb.jpg",
    duration: 3,
  },
  invert: {
    videoPath: "/preview-videos/effects/invert.mp4",
    thumbnailPath: "/preview-videos/effects/invert-thumb.jpg",
    duration: 3,
  },

  // Размытие
  blur: {
    videoPath: "/preview-videos/effects/blur.mp4",
    thumbnailPath: "/preview-videos/effects/blur-thumb.jpg",
    duration: 3,
  },
  gaussianBlur: {
    videoPath: "/preview-videos/effects/gaussian-blur.mp4",
    thumbnailPath: "/preview-videos/effects/gaussian-blur-thumb.jpg",
    duration: 3,
  },

  // Стилизация
  vintage: {
    videoPath: "/preview-videos/effects/vintage.mp4",
    thumbnailPath: "/preview-videos/effects/vintage-thumb.jpg",
    duration: 3,
  },
  vignette: {
    videoPath: "/preview-videos/effects/vignette.mp4",
    thumbnailPath: "/preview-videos/effects/vignette-thumb.jpg",
    duration: 3,
  },
  glitch: {
    videoPath: "/preview-videos/effects/glitch.mp4",
    thumbnailPath: "/preview-videos/effects/glitch-thumb.jpg",
    duration: 3,
  },

  // Искажения
  fisheye: {
    videoPath: "/preview-videos/effects/fisheye.mp4",
    thumbnailPath: "/preview-videos/effects/fisheye-thumb.jpg",
    duration: 3,
  },

  // Освещение
  glow: {
    videoPath: "/preview-videos/effects/glow.mp4",
    thumbnailPath: "/preview-videos/effects/glow-thumb.jpg",
    duration: 3,
  },
  shadow: {
    videoPath: "/preview-videos/effects/shadow.mp4",
    thumbnailPath: "/preview-videos/effects/shadow-thumb.jpg",
    duration: 3,
  },
}

// Дефолтное превью для эффектов без специального превью
const defaultPreview: EffectPreview = {
  videoPath: "/preview-videos/effects/default.mp4",
  thumbnailPath: "/preview-videos/effects/default-thumb.jpg",
  duration: 3,
}

/**
 * Получает превью для эффекта по его ID
 * @param effectId - ID эффекта
 * @returns Объект с путями к превью
 */
export function getEffectPreview(effectId: string): EffectPreview {
  return effectPreviewMap[effectId] || defaultPreview
}

/**
 * Проверяет наличие превью для эффекта
 * @param effectId - ID эффекта
 * @returns true если превью существует
 */
export function hasEffectPreview(effectId: string): boolean {
  return effectId in effectPreviewMap
}

/**
 * Получает все доступные превью эффектов
 * @returns Массив всех превью
 */
export function getAllEffectPreviews(): Record<string, EffectPreview> {
  return { ...effectPreviewMap }
}

/**
 * Получает путь к миниатюре эффекта
 * @param effectId - ID эффекта
 * @returns Путь к миниатюре или null
 */
export function getEffectThumbnail(effectId: string): string | null {
  const preview = getEffectPreview(effectId)
  return preview.thumbnailPath || null
}
