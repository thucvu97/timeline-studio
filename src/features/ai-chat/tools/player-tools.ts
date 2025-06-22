/**
 * AI инструменты для работы с видеоплеером
 *
 * Предоставляет Claude возможности для управления плеером,
 * применения эффектов и анализа медиа
 */

import { ClaudeTool } from "../services/claude-service"

/**
 * Инструменты для работы с плеером
 */
export const playerTools: ClaudeTool[] = [
  {
    name: "analyze_current_media",
    description: "Анализирует текущее медиа в плеере и его характеристики",
    input_schema: {
      type: "object",
      properties: {
        includeMetadata: {
          type: "boolean",
          description: "Включить технические метаданные",
          default: true,
        },
        includeEffects: {
          type: "boolean",
          description: "Включить информацию о применяемых эффектах",
          default: true,
        },
        analyzeContent: {
          type: "boolean",
          description: "Анализировать содержимое медиа (сцены, объекты, лица)",
          default: false,
        },
        detectIssues: {
          type: "boolean",
          description: "Обнаружить технические проблемы (шум, дрожание, экспозиция)",
          default: true,
        },
      },
    },
  },

  {
    name: "apply_preview_effects",
    description: "Применяет эффекты к медиа в плеере для предпросмотра",
    input_schema: {
      type: "object",
      properties: {
        effects: {
          type: "array",
          items: {
            type: "object",
            properties: {
              effectId: { type: "string", description: "ID эффекта из ресурсов" },
              parameters: {
                type: "object",
                description: "Параметры эффекта (переопределяют значения по умолчанию)",
              },
              intensity: {
                type: "number",
                minimum: 0,
                maximum: 1,
                description: "Интенсивность применения эффекта",
              },
              timeRange: {
                type: "object",
                properties: {
                  start: { type: "number" },
                  end: { type: "number" },
                },
                description: "Временной диапазон применения эффекта",
              },
            },
            required: ["effectId"],
          },
        },
        previewMode: {
          type: "string",
          enum: ["real-time", "render-preview", "compare-split"],
          description: "Режим предпросмотра эффектов",
        },
        autoOptimize: {
          type: "boolean",
          description: "Автоматически оптимизировать параметры для текущего медиа",
          default: false,
        },
      },
      required: ["effects"],
    },
  },

  {
    name: "apply_preview_filters",
    description: "Применяет фильтры цветокоррекции к медиа в плеере",
    input_schema: {
      type: "object",
      properties: {
        filters: {
          type: "array",
          items: {
            type: "object",
            properties: {
              filterId: { type: "string", description: "ID фильтра из ресурсов" },
              parameters: { type: "object", description: "Параметры фильтра" },
              order: { type: "number", description: "Порядок применения в цепочке" },
            },
            required: ["filterId"],
          },
        },
        autoColorCorrection: {
          type: "boolean",
          description: "Включить автоматическую цветокоррекцию",
          default: false,
        },
        referenceImage: {
          type: "string",
          description: "ID изображения для использования как эталон цветокоррекции",
        },
      },
      required: ["filters"],
    },
  },

  {
    name: "apply_template_preview",
    description: "Применяет шаблон многокамерной раскладки к набору медиафайлов",
    input_schema: {
      type: "object",
      properties: {
        templateId: {
          type: "string",
          description: "ID шаблона раскладки из ресурсов",
        },
        mediaFiles: {
          type: "array",
          items: {
            type: "object",
            properties: {
              mediaId: { type: "string" },
              cellIndex: { type: "number", description: "Индекс ячейки в шаблоне" },
              timeOffset: { type: "number", description: "Временной сдвиг для синхронизации" },
            },
            required: ["mediaId"],
          },
          description: "Медиафайлы для размещения в шаблоне",
        },
        templateParameters: {
          type: "object",
          properties: {
            syncMethod: {
              type: "string",
              enum: ["timecode", "audio", "manual", "automatic"],
              description: "Метод синхронизации камер",
            },
            audioSource: {
              type: "string",
              enum: ["main-camera", "external-audio", "mixed"],
              description: "Источник аудио для шаблона",
            },
            transitionType: {
              type: "string",
              description: "Тип переходов между камерами",
            },
          },
        },
      },
      required: ["templateId", "mediaFiles"],
    },
  },

  {
    name: "analyze_media_quality",
    description: "Анализирует качество медиа и предлагает улучшения",
    input_schema: {
      type: "object",
      properties: {
        analysisTypes: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "exposure",
              "color-balance",
              "sharpness",
              "noise",
              "stability",
              "audio-quality",
              "compression-artifacts",
              "frame-drops",
            ],
          },
          description: "Типы анализа качества",
        },
        generateReport: {
          type: "boolean",
          description: "Создать подробный отчет о качестве",
          default: true,
        },
        suggestCorrections: {
          type: "boolean",
          description: "Предложить автоматические коррекции",
          default: true,
        },
        compareWithStandards: {
          type: "boolean",
          description: "Сравнить с отраслевыми стандартами",
          default: false,
        },
      },
    },
  },

  {
    name: "extract_frame_or_clip",
    description: "Извлекает кадр или фрагмент из текущего медиа",
    input_schema: {
      type: "object",
      properties: {
        extractionType: {
          type: "string",
          enum: ["single-frame", "clip-segment", "audio-segment", "multiple-frames"],
          description: "Тип извлечения",
        },
        timeParameters: {
          type: "object",
          properties: {
            timestamp: { type: "number", description: "Временная метка для кадра" },
            startTime: { type: "number", description: "Начало сегмента" },
            endTime: { type: "number", description: "Конец сегмента" },
            frameInterval: { type: "number", description: "Интервал между кадрами" },
          },
        },
        outputSettings: {
          type: "object",
          properties: {
            format: { type: "string", enum: ["jpg", "png", "mp4", "mov", "wav", "mp3"] },
            quality: { type: "string", enum: ["low", "medium", "high", "lossless"] },
            resolution: {
              type: "object",
              properties: {
                width: { type: "number" },
                height: { type: "number" },
              },
            },
          },
        },
        purpose: {
          type: "string",
          description: "Назначение извлечения (для оптимизации настроек)",
        },
      },
      required: ["extractionType", "timeParameters"],
    },
  },

  {
    name: "compare_media_versions",
    description: "Сравнивает разные версии или обработки медиа",
    input_schema: {
      type: "object",
      properties: {
        comparisonType: {
          type: "string",
          enum: ["before-after", "multiple-versions", "with-reference"],
          description: "Тип сравнения",
        },
        mediaVersions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              mediaId: { type: "string" },
              label: { type: "string" },
              appliedEffects: { type: "array", items: { type: "string" } },
            },
            required: ["mediaId", "label"],
          },
        },
        comparisonMetrics: {
          type: "array",
          items: {
            type: "string",
            enum: ["visual-quality", "color-accuracy", "sharpness", "noise-level", "file-size"],
          },
          description: "Метрики для сравнения",
        },
        displayMode: {
          type: "string",
          enum: ["side-by-side", "overlay", "difference", "split-screen"],
          description: "Режим отображения сравнения",
        },
      },
      required: ["comparisonType", "mediaVersions"],
    },
  },

  {
    name: "save_preview_as_resource",
    description: "Сохраняет текущий предпросмотр как новый ресурс",
    input_schema: {
      type: "object",
      properties: {
        resourceName: {
          type: "string",
          description: "Название для сохраненного ресурса",
        },
        resourceType: {
          type: "string",
          enum: ["preset", "template", "media-export", "effect-chain"],
          description: "Тип сохраняемого ресурса",
        },
        saveSettings: {
          type: "object",
          properties: {
            includeEffects: { type: "boolean", description: "Включить примененные эффекты" },
            includeFilters: { type: "boolean", description: "Включить примененные фильтры" },
            includeTimestamp: { type: "boolean", description: "Включить временную метку" },
            exportMedia: { type: "boolean", description: "Экспортировать обработанное медиа" },
          },
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Теги для категоризации ресурса",
        },
        description: {
          type: "string",
          description: "Описание сохраняемого ресурса",
        },
      },
      required: ["resourceName", "resourceType"],
    },
  },

  {
    name: "control_playback",
    description: "Управляет воспроизведением медиа в плеере",
    input_schema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["play", "pause", "stop", "seek", "step-forward", "step-backward", "set-speed"],
          description: "Действие управления воспроизведением",
        },
        parameters: {
          type: "object",
          properties: {
            seekTime: { type: "number", description: "Время для перехода (в секундах)" },
            playbackSpeed: { type: "number", description: "Скорость воспроизведения" },
            stepSize: { type: "number", description: "Размер шага в кадрах" },
            volume: { type: "number", description: "Уровень громкости (0-1)" },
          },
        },
        reason: {
          type: "string",
          description: "Причина изменения воспроизведения",
        },
      },
      required: ["action"],
    },
  },

  {
    name: "generate_thumbnails",
    description: "Генерирует превью-изображения для медиа",
    input_schema: {
      type: "object",
      properties: {
        thumbnailSettings: {
          type: "object",
          properties: {
            count: { type: "number", description: "Количество превью" },
            interval: { type: "number", description: "Интервал между превью в секундах" },
            size: {
              type: "object",
              properties: {
                width: { type: "number" },
                height: { type: "number" },
              },
            },
            format: { type: "string", enum: ["jpg", "png", "webp"] },
            quality: { type: "number", minimum: 1, maximum: 100 },
          },
        },
        extractionMethod: {
          type: "string",
          enum: ["uniform-intervals", "key-frames", "scene-changes", "custom-times"],
          description: "Метод извлечения кадров",
        },
        customTimes: {
          type: "array",
          items: { type: "number" },
          description: "Пользовательские временные метки для превью",
        },
      },
    },
  },
]

/**
 * Типы событий плеера, которые могут генерировать инструменты
 */
export type PlayerToolEvent =
  | { type: "MEDIA_ANALYZED"; mediaId: string; analysis: any }
  | { type: "EFFECTS_APPLIED"; effectIds: string[]; parameters: any }
  | { type: "FILTERS_APPLIED"; filterIds: string[]; parameters: any }
  | { type: "TEMPLATE_APPLIED"; templateId: string; mediaFiles: string[] }
  | { type: "PREVIEW_SAVED"; resourceId: string; resourceType: string }
  | { type: "PLAYBACK_CONTROLLED"; action: string; parameters: any }
  | { type: "THUMBNAILS_GENERATED"; count: number; settings: any }

/**
 * Результат выполнения инструмента плеера
 */
export interface PlayerToolResult {
  success: boolean
  message: string
  data?: {
    analysis?: any
    appliedEffects?: string[]
    appliedFilters?: string[]
    savedResource?: string
    extractedMedia?: string[]
    thumbnails?: string[]
    playbackState?: any
  }
  errors?: string[]
  warnings?: string[]
  nextActions?: string[]
}
