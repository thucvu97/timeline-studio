/**
 * AI инструменты для работы с Timeline
 * 
 * Предоставляет Claude возможности для создания, анализа 
 * и модификации структуры таймлайна
 */

import { ClaudeTool } from "../services/claude-service"

/**
 * Инструменты для работы с Timeline
 */
export const timelineTools: ClaudeTool[] = [
  {
    name: "analyze_timeline_structure", 
    description: "Анализирует структуру текущего таймлайна и предоставляет детальную информацию",
    input_schema: {
      type: "object",
      properties: {
        includeClips: {
          type: "boolean",
          description: "Включить информацию о клипах",
          default: true
        },
        includeTracks: {
          type: "boolean", 
          description: "Включить информацию о треках",
          default: true
        },
        includeSections: {
          type: "boolean",
          description: "Включить информацию о секциях",
          default: true
        },
        includeResources: {
          type: "boolean",
          description: "Включить информацию об используемых ресурсах",
          default: false
        },
        analysisDepth: {
          type: "string",
          enum: ["basic", "detailed", "comprehensive"],
          description: "Глубина анализа",
          default: "basic"
        }
      }
    }
  },

  {
    name: "create_timeline_project",
    description: "Создает новый проект Timeline с заданными настройками и структурой",
    input_schema: {
      type: "object",
      properties: {
        projectSettings: {
          type: "object",
          properties: {
            name: { type: "string", description: "Название проекта" },
            description: { type: "string", description: "Описание проекта" },
            resolution: {
              type: "object",
              properties: {
                width: { type: "number" },
                height: { type: "number" }
              },
              required: ["width", "height"]
            },
            fps: { type: "number", description: "Частота кадров" },
            aspectRatio: { type: "string", description: "Соотношение сторон" },
            duration: { type: "number", description: "Предполагаемая длительность в секундах" },
            sampleRate: { type: "number", description: "Частота дискретизации аудио" }
          },
          required: ["name", "resolution", "fps"]
        },
        autoCreateStructure: {
          type: "boolean",
          description: "Автоматически создать базовую структуру треков",
          default: true
        },
        templateType: {
          type: "string",
          enum: ["empty", "basic", "advanced", "custom"],
          description: "Тип шаблона для создания проекта"
        }
      },
      required: ["projectSettings"]
    }
  },

  {
    name: "create_sections_by_strategy",
    description: "Создает секции на таймлайне по заданной стратегии",
    input_schema: {
      type: "object",
      properties: {
        strategy: {
          type: "string",
          enum: ["by-date", "by-duration", "by-content-type", "by-location", "manual", "smart"],
          description: "Стратегия создания секций"
        },
        sectionData: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              duration: { type: "number" },
              startTime: { type: "number" },
              realStartTime: { type: "string", description: "Реальное время начала (ISO format)" },
              tags: { type: "array", items: { type: "string" } },
              color: { type: "string", description: "Цвет секции" }
            },
            required: ["name", "duration"]
          },
          description: "Данные для создания секций"
        },
        autoDistribute: {
          type: "boolean",
          description: "Автоматически распределить секции по времени",
          default: true
        },
        defaultSectionDuration: {
          type: "number",
          description: "Длительность секции по умолчанию в секундах"
        }
      },
      required: ["strategy"]
    }
  },

  {
    name: "create_track_structure",
    description: "Создает структуру треков для проекта или секции",
    input_schema: {
      type: "object",
      properties: {
        targetSection: {
          type: "string",
          description: "ID секции для создания треков (если не указан - глобальные треки)"
        },
        trackConfiguration: {
          type: "object",
          properties: {
            video: { type: "number", description: "Количество видео треков" },
            audio: { type: "number", description: "Количество аудио треков" },
            music: { type: "number", description: "Количество музыкальных треков" },
            title: { type: "number", description: "Количество титровых треков" },
            subtitle: { type: "number", description: "Количество субтитровых треков" },
            voiceover: { type: "number", description: "Количество треков закадрового голоса" },
            sfx: { type: "number", description: "Количество треков звуковых эффектов" }
          }
        },
        trackSettings: {
          type: "object",
          properties: {
            defaultHeight: { type: "number", description: "Высота треков по умолчанию" },
            defaultVolume: { type: "number", description: "Громкость по умолчанию" },
            autoName: { type: "boolean", description: "Автоматически называть треки" },
            groupSimilar: { type: "boolean", description: "Группировать похожие треки" }
          }
        }
      },
      required: ["trackConfiguration"]
    }
  },

  {
    name: "place_clips_on_timeline",
    description: "Размещает клипы из ресурсов на треки таймлайна по заданной стратегии",
    input_schema: {
      type: "object",
      properties: {
        clipsToPlace: {
          type: "array",
          items: {
            type: "object",
            properties: {
              resourceId: { type: "string", description: "ID ресурса для размещения" },
              targetTrackId: { type: "string", description: "ID целевого трека" },
              startTime: { type: "number", description: "Время начала на треке" },
              duration: { type: "number", description: "Длительность клипа" },
              trimStart: { type: "number", description: "Обрезка начала медиа" },
              trimEnd: { type: "number", description: "Обрезка конца медиа" }
            },
            required: ["resourceId"]
          }
        },
        placementStrategy: {
          type: "object",
          properties: {
            method: {
              type: "string",
              enum: ["chronological", "manual", "smart-gaps", "overlay", "story-driven"],
              description: "Метод размещения клипов"
            },
            trackAssignment: {
              type: "string",
              enum: ["auto", "by-type", "manual", "balanced"],
              description: "Стратегия назначения треков"
            },
            gapHandling: {
              type: "string",
              enum: ["remove", "keep", "fill-with-transitions", "fill-with-media"],
              description: "Обработка пропусков между клипами"
            },
            overlapHandling: {
              type: "string",
              enum: ["prevent", "allow", "auto-split", "crossfade"],
              description: "Обработка перекрытий клипов"
            },
            timing: {
              type: "object",
              properties: {
                defaultClipDuration: { type: "number" },
                transitionDuration: { type: "number" },
                paddingBetweenClips: { type: "number" },
                syncToMusic: { type: "boolean" }
              }
            }
          },
          required: ["method"]
        },
        validation: {
          type: "object",
          properties: {
            checkCompatibility: { type: "boolean", description: "Проверить совместимость медиа с треками" },
            preventOverlaps: { type: "boolean", description: "Предотвратить перекрытия" },
            validateDuration: { type: "boolean", description: "Валидировать длительность" }
          }
        }
      },
      required: ["clipsToPlace", "placementStrategy"]
    }
  },

  {
    name: "apply_automatic_enhancements",
    description: "Применяет автоматические улучшения к таймлайну",
    input_schema: {
      type: "object",
      properties: {
        enhancements: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "transitions", "color-correction", "audio-balance", "stabilization",
              "noise-reduction", "auto-cut", "scene-detection", "music-sync",
              "auto-titles", "smart-crops", "duplicate-removal"
            ]
          },
          description: "Типы улучшений для применения"
        },
        intensity: {
          type: "string",
          enum: ["subtle", "moderate", "strong"],
          description: "Интенсивность применения улучшений"
        },
        targetElements: {
          type: "object",
          properties: {
            sectionIds: { type: "array", items: { type: "string" } },
            trackIds: { type: "array", items: { type: "string" } },
            clipIds: { type: "array", items: { type: "string" } },
            timeRange: {
              type: "object",
              properties: {
                start: { type: "number" },
                end: { type: "number" }
              }
            }
          },
          description: "Элементы для применения улучшений"
        },
        preferences: {
          type: "object",
          properties: {
            preserveOriginal: { type: "boolean", description: "Сохранить оригинальные настройки" },
            previewFirst: { type: "boolean", description: "Сначала показать предпросмотр" },
            applyToExisting: { type: "boolean", description: "Применить к существующим эффектам" },
            autoAdjustParameters: { type: "boolean", description: "Автоматически настроить параметры" }
          }
        }
      },
      required: ["enhancements"]
    }
  },

  {
    name: "analyze_content_for_story",
    description: "Анализирует контент медиа для создания связного повествования",
    input_schema: {
      type: "object",
      properties: {
        mediaFiles: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              type: { type: "string", enum: ["video", "audio", "image"] },
              duration: { type: "number" },
              timestamp: { type: "string", description: "Время создания" },
              metadata: { type: "object", description: "Дополнительные метаданные" }
            },
            required: ["id", "type"]
          }
        },
        storyParameters: {
          type: "object",
          properties: {
            storyType: {
              type: "string",
              enum: ["chronological", "thematic", "emotional", "dramatic", "documentary"],
              description: "Тип повествования"
            },
            preferredDuration: { type: "number", description: "Желаемая длительность в секундах" },
            mood: { type: "string", description: "Желаемое настроение" },
            keyMoments: {
              type: "array",
              items: { type: "string" },
              description: "Ключевые моменты для выделения"
            },
            pace: {
              type: "string",
              enum: ["slow", "medium", "fast", "dynamic"],
              description: "Темп повествования"
            }
          }
        },
        outputFormat: {
          type: "string",
          enum: ["timeline-structure", "clip-sequence", "story-outline", "full-analysis"],
          description: "Формат результата анализа"
        }
      },
      required: ["mediaFiles", "storyParameters"]
    }
  },

  {
    name: "detect_and_split_scenes",
    description: "Автоматически определяет смены сцен и создает разрезы",
    input_schema: {
      type: "object",
      properties: {
        targetClips: {
          type: "array",
          items: { type: "string" },
          description: "ID клипов для анализа сцен"
        },
        detectionSettings: {
          type: "object",
          properties: {
            sensitivity: {
              type: "string",
              enum: ["low", "medium", "high", "custom"],
              description: "Чувствительность определения смен сцен"
            },
            method: {
              type: "string",
              enum: ["visual", "audio", "combined", "motion"],
              description: "Метод определения смен сцен"
            },
            minSceneDuration: { type: "number", description: "Минимальная длительность сцены" },
            threshold: { type: "number", description: "Порог изменения для определения смены" }
          }
        },
        actions: {
          type: "object",
          properties: {
            createSplits: { type: "boolean", description: "Создать разрезы на местах смен" },
            addMarkers: { type: "boolean", description: "Добавить маркеры смен сцен" },
            createSections: { type: "boolean", description: "Создать секции для каждой сцены" },
            suggestTransitions: { type: "boolean", description: "Предложить переходы между сценами" }
          }
        }
      },
      required: ["targetClips"]
    }
  },

  {
    name: "synchronize_with_music",
    description: "Синхронизирует видео клипы с музыкальным сопровождением",
    input_schema: {
      type: "object",
      properties: {
        musicTrackId: {
          type: "string",
          description: "ID музыкального трека для синхронизации"
        },
        videoClips: {
          type: "array",
          items: { type: "string" },
          description: "ID видео клипов для синхронизации"
        },
        syncSettings: {
          type: "object",
          properties: {
            syncType: {
              type: "string",
              enum: ["beat", "phrase", "section", "dynamic", "custom"],
              description: "Тип синхронизации с музыкой"
            },
            beatDetection: {
              type: "object",
              properties: {
                enabled: { type: "boolean" },
                sensitivity: { type: "number" },
                manualBpm: { type: "number" }
              }
            },
            cutPreference: {
              type: "string",
              enum: ["on-beat", "before-beat", "after-beat", "musical-phrase"],
              description: "Предпочтение для создания разрезов"
            },
            adjustmentMethod: {
              type: "string",
              enum: ["stretch", "cut", "speed-change", "crossfade"],
              description: "Метод подгонки длительности клипов"
            }
          }
        }
      },
      required: ["musicTrackId", "videoClips"]
    }
  },

  {
    name: "suggest_timeline_improvements",
    description: "Анализирует таймлайн и предлагает улучшения",
    input_schema: {
      type: "object",
      properties: {
        analysisScope: {
          type: "string",
          enum: ["full-timeline", "selected-elements", "time-range", "specific-issues"],
          description: "Область анализа для предложений"
        },
        targetElements: {
          type: "object",
          properties: {
            sectionIds: { type: "array", items: { type: "string" } },
            trackIds: { type: "array", items: { type: "string" } },
            clipIds: { type: "array", items: { type: "string" } }
          }
        },
        improvementTypes: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "performance", "visual-quality", "audio-quality", "structure",
              "storytelling", "technical", "creative", "accessibility"
            ]
          },
          description: "Типы улучшений для поиска"
        },
        prioritize: {
          type: "string",
          enum: ["quality", "performance", "creativity", "technical", "user-experience"],
          description: "Приоритет предложений"
        }
      }
    }
  },

  {
    name: "export_timeline_data",
    description: "Экспортирует данные таймлайна в различных форматах",
    input_schema: {
      type: "object",
      properties: {
        exportFormat: {
          type: "string",
          enum: ["json", "xml", "csv", "edl", "fcpxml", "davinci-resolve"],
          description: "Формат экспорта данных"
        },
        includeData: {
          type: "object",
          properties: {
            projectSettings: { type: "boolean" },
            sections: { type: "boolean" },
            tracks: { type: "boolean" },
            clips: { type: "boolean" },
            effects: { type: "boolean" },
            transitions: { type: "boolean" },
            metadata: { type: "boolean" }
          }
        },
        exportScope: {
          type: "string",
          enum: ["full-project", "selected-elements", "time-range"],
          description: "Область экспорта"
        }
      },
      required: ["exportFormat"]
    }
  }
]

/**
 * Типы событий таймлайна, которые могут генерировать инструменты
 */
export type TimelineToolEvent = 
  | { type: "PROJECT_CREATED"; projectId: string; settings: any }
  | { type: "SECTIONS_CREATED"; sectionIds: string[]; strategy: string }
  | { type: "TRACKS_CREATED"; trackIds: string[]; configuration: any }
  | { type: "CLIPS_PLACED"; clipIds: string[]; strategy: any }
  | { type: "ENHANCEMENTS_APPLIED"; enhancements: string[]; targetElements: any }
  | { type: "SCENES_DETECTED"; clipId: string; scenes: any[] }
  | { type: "TIMELINE_ANALYZED"; analysis: any }

/**
 * Результат выполнения инструмента таймлайна
 */
export interface TimelineToolResult {
  success: boolean
  message: string
  data?: {
    projectId?: string
    createdElements?: string[]
    analysis?: any
    suggestions?: string[]
    modifications?: any[]
    exportData?: any
  }
  errors?: string[]
  warnings?: string[]
  nextActions?: string[]
}