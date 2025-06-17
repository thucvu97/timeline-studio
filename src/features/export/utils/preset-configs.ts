/**
 * Preset Configurations
 *
 * Детальные конфигурации для каждого пресета экспорта.
 * Включают расширенные настройки кодеков и оптимизации.
 */

export interface PresetConfig {
  id: string
  name: string
  platform?: "youtube" | "vimeo" | "tiktok" | "instagram" | "twitter"
  category: "social" | "professional" | "device" | "custom"

  // Основные настройки
  format: {
    container: "mp4" | "mov" | "webm" | "quicktime"
    extension: string
  }

  // Видео настройки
  video: {
    codec: "h264" | "h265" | "prores" | "vp8" | "vp9"
    codecLongName?: string
    profile?: "baseline" | "main" | "high" | "main10" | "main422"
    level?: string // например "4.1", "5.1"
    pixelFormat?: string // "yuv420p", "yuv422p", "yuv444p"

    // Разрешение
    resolution: {
      width?: number
      height?: number
      useTimeline?: boolean
      useVertical?: boolean // для вертикальных форматов
      maxWidth?: number
      maxHeight?: number
    }

    // Частота кадров
    frameRate: {
      fps?: number
      useTimeline?: boolean
      maxFps?: number
    }

    // Битрейт и качество
    bitrate: {
      mode: "auto" | "cbr" | "vbr" | "crf"
      target?: number // в Кбит/с
      max?: number
      min?: number
      crf?: number // для режима CRF (0-51)
      buffer?: number // размер буфера
    }

    // Расширенные настройки кодирования
    encoding: {
      preset?: "ultrafast" | "superfast" | "veryfast" | "faster" | "fast" | "medium" | "slow" | "slower" | "veryslow"
      tune?: "film" | "animation" | "grain" | "stillimage" | "fastdecode" | "zerolatency"
      entropy?: "cabac" | "cavlc"
      keyframeInterval?: number // GOP size
      bFrames?: number
      refFrames?: number
      multipass?: boolean
      threads?: number
    }

    // GPU ускорение
    hardware?: {
      enabled: boolean
      encoder?: "nvenc" | "qsv" | "videotoolbox" | "amf"
      preset?: string
    }
  }

  // Аудио настройки
  audio: {
    codec: "aac" | "mp3" | "opus" | "pcm" | "alac"
    bitrate?: number // в Кбит/с
    sampleRate?: number // 44100, 48000
    channels?: number // 1 (mono), 2 (stereo), 6 (5.1)

    // Нормализация
    normalize?: {
      enabled: boolean
      target?: number // LKFS/LUFS
      peak?: number // dBTP
      standard?: "youtube" | "broadcast" | "streaming"
    }
  }

  // Дополнительные опции
  options?: {
    optimizeForNetwork?: boolean
    optimizeForSpeed?: boolean
    useProxyMedia?: boolean
    renderWithoutTimecode?: boolean
    interlaced?: boolean
    chapters?: boolean // главы по маркерам
    uploadDirectly?: boolean
    maxFileSize?: number // в МБ
    watermark?: boolean
  }

  // Ограничения платформы
  limitations?: {
    maxDuration?: number // в секундах
    maxFileSize?: number // в МБ
    maxBitrate?: number
    requiredAspectRatio?: string // "16:9", "9:16", "1:1"
  }
}

// Пресеты для социальных сетей
export const SOCIAL_PRESETS: PresetConfig[] = [
  {
    id: "youtube-1080p",
    name: "YouTube 1080p",
    platform: "youtube",
    category: "social",
    format: {
      container: "mp4",
      extension: ".mp4",
    },
    video: {
      codec: "h264",
      codecLongName: "H.264 / AVC",
      profile: "high",
      level: "4.1",
      pixelFormat: "yuv420p",
      resolution: {
        width: 1920,
        height: 1080,
        maxWidth: 1920,
        maxHeight: 1080,
      },
      frameRate: {
        useTimeline: true,
        maxFps: 60,
      },
      bitrate: {
        mode: "vbr",
        target: 12000,
        max: 16000,
        buffer: 24000,
      },
      encoding: {
        preset: "medium",
        entropy: "cabac",
        keyframeInterval: 60,
        bFrames: 2,
        refFrames: 3,
        multipass: true,
      },
      hardware: {
        enabled: true,
      },
    },
    audio: {
      codec: "aac",
      bitrate: 256,
      sampleRate: 48000,
      channels: 2,
      normalize: {
        enabled: true,
        target: -14, // YouTube стандарт
        peak: -1,
        standard: "youtube",
      },
    },
    options: {
      optimizeForNetwork: true,
      chapters: true,
      uploadDirectly: true,
    },
  },

  {
    id: "youtube-4k",
    name: "YouTube 4K",
    platform: "youtube",
    category: "social",
    format: {
      container: "mp4",
      extension: ".mp4",
    },
    video: {
      codec: "h265",
      codecLongName: "H.265 / HEVC",
      profile: "main10",
      level: "5.1",
      pixelFormat: "yuv420p10le",
      resolution: {
        width: 3840,
        height: 2160,
      },
      frameRate: {
        useTimeline: true,
        maxFps: 60,
      },
      bitrate: {
        mode: "vbr",
        target: 45000,
        max: 60000,
        buffer: 90000,
      },
      encoding: {
        preset: "slow",
        entropy: "cabac",
        keyframeInterval: 60,
        bFrames: 3,
        refFrames: 5,
        multipass: true,
      },
      hardware: {
        enabled: true,
        encoder: "nvenc",
        preset: "quality",
      },
    },
    audio: {
      codec: "aac",
      bitrate: 320,
      sampleRate: 48000,
      channels: 2,
      normalize: {
        enabled: true,
        target: -14,
        peak: -1,
        standard: "youtube",
      },
    },
    options: {
      optimizeForNetwork: true,
      chapters: true,
      uploadDirectly: true,
    },
  },

  {
    id: "tiktok-vertical",
    name: "TikTok Вертикальный",
    platform: "tiktok",
    category: "social",
    format: {
      container: "mp4",
      extension: ".mp4",
    },
    video: {
      codec: "h264",
      profile: "main",
      level: "4.1",
      pixelFormat: "yuv420p",
      resolution: {
        width: 1080,
        height: 1920,
        useVertical: true,
      },
      frameRate: {
        fps: 30,
        maxFps: 60,
      },
      bitrate: {
        mode: "auto",
        target: 6000,
        max: 8000,
      },
      encoding: {
        preset: "fast",
        entropy: "cabac",
        keyframeInterval: 30,
        bFrames: 0,
      },
      hardware: {
        enabled: true,
      },
    },
    audio: {
      codec: "aac",
      bitrate: 192,
      sampleRate: 48000,
      channels: 2,
    },
    options: {
      optimizeForNetwork: true,
      uploadDirectly: true,
    },
    limitations: {
      maxDuration: 600, // 10 минут
      maxFileSize: 4096, // 4 ГБ
      requiredAspectRatio: "9:16",
    },
  },

  {
    id: "vimeo-1080p",
    name: "Vimeo 1080p HQ",
    platform: "vimeo",
    category: "social",
    format: {
      container: "mp4",
      extension: ".mp4",
    },
    video: {
      codec: "h264",
      profile: "high",
      level: "4.2",
      pixelFormat: "yuv420p",
      resolution: {
        width: 1920,
        height: 1080,
      },
      frameRate: {
        useTimeline: true,
        maxFps: 60,
      },
      bitrate: {
        mode: "vbr",
        target: 20000,
        max: 25000,
        buffer: 40000,
      },
      encoding: {
        preset: "slow",
        tune: "film",
        entropy: "cabac",
        keyframeInterval: 120,
        bFrames: 3,
        refFrames: 5,
        multipass: true,
      },
      hardware: {
        enabled: true,
      },
    },
    audio: {
      codec: "aac",
      bitrate: 320,
      sampleRate: 48000,
      channels: 2,
    },
    options: {
      optimizeForNetwork: true,
      optimizeForSpeed: false,
    },
  },
]

// Профессиональные пресеты
export const PROFESSIONAL_PRESETS: PresetConfig[] = [
  {
    id: "prores-422-hq",
    name: "ProRes 422 HQ",
    category: "professional",
    format: {
      container: "quicktime",
      extension: ".mov",
    },
    video: {
      codec: "prores",
      codecLongName: "Apple ProRes 422 HQ",
      profile: "main422",
      pixelFormat: "yuv422p10le",
      encoding: {
        preset: "medium",
      },
      resolution: {
        useTimeline: true,
      },
      frameRate: {
        useTimeline: true,
      },
      bitrate: {
        mode: "auto",
      },
    },
    audio: {
      codec: "pcm",
      sampleRate: 48000,
      channels: 2,
    },
  },

  {
    id: "h264-master",
    name: "H.264 Master",
    category: "professional",
    format: {
      container: "mp4",
      extension: ".mp4",
    },
    video: {
      codec: "h264",
      profile: "high",
      level: "5.1",
      pixelFormat: "yuv420p",
      resolution: {
        useTimeline: true,
      },
      frameRate: {
        useTimeline: true,
      },
      bitrate: {
        mode: "cbr",
        target: 80000,
        buffer: 160000,
      },
      encoding: {
        preset: "slower",
        entropy: "cabac",
        keyframeInterval: 30,
        bFrames: 3,
        refFrames: 8,
        multipass: true,
      },
      hardware: {
        enabled: true,
      },
    },
    audio: {
      codec: "aac",
      bitrate: 320,
      sampleRate: 48000,
      channels: 2,
    },
    options: {
      optimizeForSpeed: false,
      renderWithoutTimecode: false,
    },
  },
]

// Пресеты для устройств
export const DEVICE_PRESETS: PresetConfig[] = [
  {
    id: "iphone-optimized",
    name: "iPhone Optimized",
    category: "device",
    format: {
      container: "mp4",
      extension: ".mp4",
    },
    video: {
      codec: "h264",
      profile: "high",
      level: "4.1",
      pixelFormat: "yuv420p",
      resolution: {
        maxWidth: 1920,
        maxHeight: 1080,
      },
      frameRate: {
        fps: 30,
        maxFps: 30,
      },
      bitrate: {
        mode: "vbr",
        target: 6000,
        max: 8000,
      },
      encoding: {
        preset: "medium",
        tune: "fastdecode",
        entropy: "cabac",
        keyframeInterval: 30,
      },
    },
    audio: {
      codec: "aac",
      bitrate: 192,
      sampleRate: 48000,
      channels: 2,
    },
  },
]

// Функция для получения всех пресетов
export function getAllPresets(): PresetConfig[] {
  return [...SOCIAL_PRESETS, ...PROFESSIONAL_PRESETS, ...DEVICE_PRESETS]
}

// Функция для получения пресета по ID
export function getPresetById(id: string): PresetConfig | undefined {
  return getAllPresets().find((preset) => preset.id === id)
}

// Функция для получения пресетов по категории
export function getPresetsByCategory(category: PresetConfig["category"]): PresetConfig[] {
  return getAllPresets().filter((preset) => preset.category === category)
}

// Функция для получения пресетов по платформе
export function getPresetsByPlatform(platform: PresetConfig["platform"]): PresetConfig[] {
  return getAllPresets().filter((preset) => preset.platform === platform)
}
