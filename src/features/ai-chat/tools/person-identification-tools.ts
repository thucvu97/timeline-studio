/**
 * Person Identification AI Tools
 *
 * Набор AI инструментов для работы с распознаванием и управлением персонами
 * в видеоконтенте. Интегрируется с Claude Tools через AI Chat модуль.
 */

import { SceneAnalysisEngine } from "@/features/ai-content-intelligence/engines/scene-analysis/scene-analysis-engine"
import { PersonDatabaseService } from "@/features/person-identification/services/person-database-service"

import { type ClaudeTool } from "../services/claude-service"

// Инициализируем сервисы
const personDatabase = PersonDatabaseService.getInstance()
const sceneEngine = new SceneAnalysisEngine()

/**
 * 1. Детекция и идентификация персон в видео
 */
export const identifyPersonsInVideo: ClaudeTool = {
  name: "identify_persons_in_video",
  description:
    "Детектирует и идентифицирует персон в видеофайле, создает профили новых персон и обновляет существующие",
  input_schema: {
    type: "object",
    properties: {
      videoPath: {
        type: "string",
        description: "Путь к видеофайлу для анализа",
      },
      enableFaceDetection: {
        type: "boolean",
        description: "Включить детекцию лиц",
        default: true,
      },
      enablePersonTracking: {
        type: "boolean",
        description: "Включить отслеживание персон",
        default: true,
      },
      confidenceThreshold: {
        type: "number",
        description: "Порог уверенности для детекции (0-1)",
        default: 0.7,
      },
      createNewProfiles: {
        type: "boolean",
        description: "Создавать профили для новых персон",
        default: true,
      },
    },
    required: ["videoPath"],
  },
}

/**
 * 2. Поиск персон в базе данных
 */
export const searchPersons: ClaudeTool = {
  name: "search_persons",
  description: "Поиск персон в базе данных по имени, характеристикам или эмбеддингам лиц",
  input_schema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Поисковый запрос (имя персоны)",
      },
      faceImagePath: {
        type: "string",
        description: "Путь к изображению лица для поиска по сходству",
      },
      similarityThreshold: {
        type: "number",
        description: "Порог сходства для поиска по лицу (0-1)",
        default: 0.7,
      },
      limit: {
        type: "number",
        description: "Максимальное количество результатов",
        default: 10,
      },
      includeUnverified: {
        type: "boolean",
        description: "Включить неподтвержденные профили",
        default: true,
      },
    },
    required: [],
  },
}

/**
 * 3. Создание профиля персоны
 */
export const createPersonProfile: ClaudeTool = {
  name: "create_person_profile",
  description: "Создает новый профиль персоны с указанными характеристиками",
  input_schema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Имя персоны",
      },
      description: {
        type: "string",
        description: "Описание персоны",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Теги для категоризации",
      },
      thumbnailPath: {
        type: "string",
        description: "Путь к основной фотографии",
      },
      isVerified: {
        type: "boolean",
        description: "Подтвержден ли профиль",
        default: false,
      },
      privacySettings: {
        type: "object",
        properties: {
          blurFace: { type: "boolean", default: false },
          hideFromSearch: { type: "boolean", default: false },
          anonymize: { type: "boolean", default: false },
        },
        description: "Настройки приватности",
      },
    },
    required: [],
  },
}

/**
 * 4. Обновление профиля персоны
 */
export const updatePersonProfile: ClaudeTool = {
  name: "update_person_profile",
  description: "Обновляет существующий профиль персоны",
  input_schema: {
    type: "object",
    properties: {
      personId: {
        type: "string",
        description: "ID персоны для обновления",
      },
      name: {
        type: "string",
        description: "Новое имя персоны",
      },
      description: {
        type: "string",
        description: "Новое описание",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Новые теги",
      },
      isVerified: {
        type: "boolean",
        description: "Статус подтверждения",
      },
      privacySettings: {
        type: "object",
        properties: {
          blurFace: { type: "boolean" },
          hideFromSearch: { type: "boolean" },
          anonymize: { type: "boolean" },
          blurIntensity: { type: "number" },
        },
        description: "Настройки приватности",
      },
    },
    required: ["personId"],
  },
}

/**
 * 5. Получение статистики персоны
 */
export const getPersonStats: ClaudeTool = {
  name: "get_person_stats",
  description: "Получает подробную статистику появлений персоны в видео",
  input_schema: {
    type: "object",
    properties: {
      personId: {
        type: "string",
        description: "ID персоны",
      },
      timeRange: {
        type: "object",
        properties: {
          startTime: { type: "number", description: "Начальное время в секундах" },
          endTime: { type: "number", description: "Конечное время в секундах" },
        },
        description: "Временной диапазон для анализа",
      },
      includeEmotions: {
        type: "boolean",
        description: "Включить анализ эмоций",
        default: true,
      },
      includeClipBreakdown: {
        type: "boolean",
        description: "Включить разбивку по клипам",
        default: true,
      },
    },
    required: ["personId"],
  },
}

/**
 * 6. Объединение профилей персон
 */
export const mergePersonProfiles: ClaudeTool = {
  name: "merge_person_profiles",
  description: "Объединяет несколько профилей персон в один (для дубликатов)",
  input_schema: {
    type: "object",
    properties: {
      targetPersonId: {
        type: "string",
        description: "ID основной персоны (куда объединять)",
      },
      sourcePersonIds: {
        type: "array",
        items: { type: "string" },
        description: "IDs персон для объединения",
      },
      preserveNames: {
        type: "boolean",
        description: "Сохранить все имена как теги",
        default: true,
      },
      mergeStrategy: {
        type: "string",
        enum: ["keep_target", "merge_all", "best_quality"],
        description: "Стратегия объединения данных",
        default: "merge_all",
      },
    },
    required: ["targetPersonId", "sourcePersonIds"],
  },
}

/**
 * 7. Автоматическая кластеризация лиц
 */
export const clusterUnidentifiedFaces: ClaudeTool = {
  name: "cluster_unidentified_faces",
  description: "Автоматически группирует неопознанные лица в потенциальные профили персон",
  input_schema: {
    type: "object",
    properties: {
      videoPath: {
        type: "string",
        description: "Путь к видео для анализа",
      },
      similarityThreshold: {
        type: "number",
        description: "Порог сходства для группировки (0-1)",
        default: 0.8,
      },
      minClusterSize: {
        type: "number",
        description: "Минимальный размер группы лиц",
        default: 3,
      },
      createProfiles: {
        type: "boolean",
        description: "Создать профили для найденных групп",
        default: true,
      },
      qualityThreshold: {
        type: "number",
        description: "Минимальное качество лиц для кластеризации",
        default: 0.6,
      },
    },
    required: ["videoPath"],
  },
}

/**
 * 8. Экспорт данных персон
 */
export const exportPersonData: ClaudeTool = {
  name: "export_person_data",
  description: "Экспортирует данные о персонах в различных форматах",
  input_schema: {
    type: "object",
    properties: {
      format: {
        type: "string",
        enum: ["json", "csv", "xml", "srt"],
        description: "Формат экспорта",
        default: "json",
      },
      personIds: {
        type: "array",
        items: { type: "string" },
        description: "IDs персон для экспорта (все, если не указано)",
      },
      includeEmbeddings: {
        type: "boolean",
        description: "Включить векторные представления лиц",
        default: false,
      },
      includeThumbnails: {
        type: "boolean",
        description: "Включить миниатюры",
        default: true,
      },
      includeTimecodes: {
        type: "boolean",
        description: "Включить временные коды появлений",
        default: true,
      },
      timeRange: {
        type: "object",
        properties: {
          startTime: { type: "number" },
          endTime: { type: "number" },
        },
        description: "Временной диапазон",
      },
    },
    required: ["format"],
  },
}

/**
 * 9. Анализ эмоций персон
 */
export const analyzePersonEmotions: ClaudeTool = {
  name: "analyze_person_emotions",
  description: "Анализирует эмоциональные состояния персон в видео",
  input_schema: {
    type: "object",
    properties: {
      personId: {
        type: "string",
        description: "ID персоны для анализа",
      },
      videoPath: {
        type: "string",
        description: "Путь к видео",
      },
      timeRange: {
        type: "object",
        properties: {
          startTime: { type: "number" },
          endTime: { type: "number" },
        },
        description: "Временной диапазон для анализа",
      },
      emotionCategories: {
        type: "array",
        items: {
          type: "string",
          enum: ["happy", "sad", "angry", "surprised", "neutral", "fear", "disgust"],
        },
        description: "Категории эмоций для анализа",
      },
      generateReport: {
        type: "boolean",
        description: "Создать подробный отчет",
        default: true,
      },
    },
    required: ["videoPath"],
  },
}

/**
 * 10. Управление приватностью персон
 */
export const managePersonPrivacy: ClaudeTool = {
  name: "manage_person_privacy",
  description: "Управляет настройками приватности персон (размытие, анонимизация)",
  input_schema: {
    type: "object",
    properties: {
      personId: {
        type: "string",
        description: "ID персоны",
      },
      action: {
        type: "string",
        enum: ["blur_face", "unblur_face", "anonymize", "deanonymize", "hide_from_search", "show_in_search"],
        description: "Действие с приватностью",
      },
      blurIntensity: {
        type: "number",
        description: "Интенсивность размытия (1-10)",
        default: 5,
      },
      applyToAllAppearances: {
        type: "boolean",
        description: "Применить ко всем появлениям",
        default: true,
      },
      videoPath: {
        type: "string",
        description: "Путь к конкретному видео (если не все)",
      },
    },
    required: ["personId", "action"],
  },
}

/**
 * 11. Поиск персон по времени
 */
export const findPersonsAtTime: ClaudeTool = {
  name: "find_persons_at_time",
  description: "Находит всех персон, присутствующих в определенный момент времени",
  input_schema: {
    type: "object",
    properties: {
      videoPath: {
        type: "string",
        description: "Путь к видеофайлу",
      },
      timestamp: {
        type: "number",
        description: "Временная метка в секундах",
      },
      timeWindow: {
        type: "number",
        description: "Окно поиска в секундах",
        default: 1.0,
      },
      includeUnidentified: {
        type: "boolean",
        description: "Включить неопознанных персон",
        default: false,
      },
      minimumConfidence: {
        type: "number",
        description: "Минимальная уверенность детекции",
        default: 0.5,
      },
    },
    required: ["videoPath", "timestamp"],
  },
}

/**
 * 12. Генерация отчета по персонам
 */
export const generatePersonReport: ClaudeTool = {
  name: "generate_person_report",
  description: "Генерирует подробный отчет о персонах в проекте",
  input_schema: {
    type: "object",
    properties: {
      reportType: {
        type: "string",
        enum: ["summary", "detailed", "timeline", "statistics", "privacy_audit"],
        description: "Тип отчета",
        default: "summary",
      },
      personIds: {
        type: "array",
        items: { type: "string" },
        description: "IDs персон для включения (все, если не указано)",
      },
      includeCharts: {
        type: "boolean",
        description: "Включить графики и диаграммы",
        default: true,
      },
      includeMetrics: {
        type: "boolean",
        description: "Включить метрики производительности",
        default: true,
      },
      timeRange: {
        type: "object",
        properties: {
          startTime: { type: "number" },
          endTime: { type: "number" },
        },
        description: "Временной диапазон для отчета",
      },
      outputFormat: {
        type: "string",
        enum: ["html", "pdf", "json", "markdown"],
        description: "Формат выходного отчета",
        default: "html",
      },
    },
    required: ["reportType"],
  },
}

// Экспорт всех инструментов
export const personIdentificationTools: ClaudeTool[] = [
  identifyPersonsInVideo,
  searchPersons,
  createPersonProfile,
  updatePersonProfile,
  getPersonStats,
  mergePersonProfiles,
  clusterUnidentifiedFaces,
  exportPersonData,
  analyzePersonEmotions,
  managePersonPrivacy,
  findPersonsAtTime,
  generatePersonReport,
]

/**
 * Обработчики для выполнения AI инструментов
 * Эти функции будут вызываться Claude при использовании инструментов
 */

export const personIdentificationHandlers = {
  async identify_persons_in_video(params: {
    videoPath: string
    enableFaceDetection?: boolean
    enablePersonTracking?: boolean
    confidenceThreshold?: number
    createNewProfiles?: boolean
  }) {
    try {
      await personDatabase.initialize()

      const mediaFile = {
        path: params.videoPath,
        filename: params.videoPath.split("/").pop() || "unknown",
        type: "video" as const,
      }

      // Анализируем сцены с Person Identification
      const scenes = await sceneEngine.analyzeScenes(mediaFile, {
        sensitivity: 0.5,
        minSceneDuration: 2.0,
        classifyTypes: true,
        enableObjectDetection: false,
        enablePersonTracking: params.enablePersonTracking ?? true,
      })

      // Собираем всех обнаруженных персон
      const allPersons = scenes.flatMap((scene) => scene.identifiedPersons || [])
      const uniquePersons = Array.from(new Map(allPersons.map((p: any) => [p.personId, p])).values())

      return {
        success: true,
        totalScenes: scenes.length,
        personsFound: uniquePersons.length,
        persons: uniquePersons.map((p: any) => ({
          id: p.personId,
          name: p.person?.name || "Unknown",
          confidence: p.confidence,
          appearances: p.appearances?.length || 0,
          isMainCharacter: p.appearances?.some((app: any) => app.isMainCharacter) || false,
        })),
        message: `Обработано ${scenes.length} сцен, найдено ${uniquePersons.length} персон`,
      }
    } catch (error) {
      return {
        success: false,
        error: `Ошибка идентификации персон: ${String(error)}`,
      }
    }
  },

  async search_persons(params: {
    query?: string
    faceImagePath?: string
    similarityThreshold?: number
    limit?: number
    includeUnverified?: boolean
  }) {
    try {
      await personDatabase.initialize()

      if (params.query) {
        // Поиск по имени
        const results = await personDatabase.searchPersonsByName(params.query, params.limit)
        return {
          success: true,
          method: "name_search",
          query: params.query,
          results: results.map((person) => ({
            id: person.id,
            name: person.name || "Unknown",
            isVerified: person.isVerified,
            totalAppearances: person.appearances.length,
            totalScreenTime: person.totalScreenTime,
            tags: person.tags,
          })),
        }
      }
      if (params.faceImagePath) {
        // Поиск по изображению лица с использованием эмбеддингов
        try {
          const faceEmbedding = await sceneEngine.generateFaceEmbedding(params.faceImagePath)
          const matchingPersons = await personDatabase.findSimilarPersons(faceEmbedding, {
            threshold: params.similarityThreshold || 0.8,
            maxResults: params.limit || 10,
          })

          return {
            success: true,
            data: {
              foundPersons: matchingPersons.map((match) => ({
                ...match.person,
                confidence: match.confidence,
                lastSeen: match.person.lastSeen?.toISOString(),
                appearances: match.person.appearances?.length || 0,
              })),
              searchImage: params.faceImagePath,
              totalMatches: matchingPersons.length,
            },
          }
        } catch (error) {
          return {
            success: false,
            error: `Ошибка поиска по изображению: ${error instanceof Error ? error.message : String(error)}`,
          }
        }
      }
      // Возвращаем всех персон
      const allPersons = await personDatabase.getAllPersons()
      const filtered = params.includeUnverified ? allPersons : allPersons.filter((p) => p.isVerified)

      return {
        success: true,
        method: "list_all",
        results: filtered.slice(0, params.limit || 10).map((person) => ({
          id: person.id,
          name: person.name || "Unknown",
          isVerified: person.isVerified,
          totalAppearances: person.appearances.length,
          totalScreenTime: person.totalScreenTime,
          tags: person.tags,
        })),
      }
    } catch (error) {
      return {
        success: false,
        error: `Ошибка поиска персон: ${String(error)}`,
      }
    }
  },

  async create_person_profile(params: {
    name?: string
    description?: string
    tags?: string[]
    thumbnailPath?: string
    isVerified?: boolean
    privacySettings?: any
  }) {
    try {
      await personDatabase.initialize()

      const person = await personDatabase.createPerson({
        name: params.name,
        isVerified: params.isVerified ?? false,
        faceEmbeddings: [],
        appearances: [],
        totalScreenTime: 0,
        firstSeen: { seconds: 0 },
        lastSeen: { seconds: 0 },
        tags: params.tags || [],
        notes: params.description,
        thumbnails: [],
        privacy: params.privacySettings || {
          blurFace: false,
          hideFromSearch: false,
          anonymize: false,
          blurIntensity: 5,
          blurTracking: true,
        },
      })

      return {
        success: true,
        person: {
          id: person.id,
          name: person.name,
          isVerified: person.isVerified,
          tags: person.tags,
          createdAt: person.createdAt,
        },
        message: `Создан профиль персоны: ${person.name || person.id}`,
      }
    } catch (error) {
      return {
        success: false,
        error: `Ошибка создания профиля: ${String(error)}`,
      }
    }
  },

  async get_person_stats(params: {
    personId: string
    timeRange?: { startTime: number; endTime: number }
    includeEmotions?: boolean
    includeClipBreakdown?: boolean
  }) {
    try {
      await personDatabase.initialize()

      const stats = await personDatabase.getPersonStats(params.personId)
      if (!stats) {
        return {
          success: false,
          error: "Персона не найдена",
        }
      }

      return {
        success: true,
        personId: params.personId,
        stats: {
          totalAppearances: stats.totalAppearances,
          totalScreenTime: `${Math.round(stats.totalScreenTime)}s`,
          averageAppearanceLength: `${Math.round(stats.averageAppearanceLength)}s`,
          clipsCount: stats.clipsCount,
          confidenceStats: {
            average: Math.round(stats.averageConfidence * 100) / 100,
            best: Math.round(stats.bestConfidence * 100) / 100,
            worst: Math.round(stats.worstConfidence * 100) / 100,
          },
          timeline: {
            firstAppearance: stats.firstAppearance,
            lastAppearance: stats.lastAppearance,
          },
          emotions: params.includeEmotions ? stats.emotionDistribution : undefined,
          clips: params.includeClipBreakdown ? stats.clipIds : undefined,
        },
      }
    } catch (error) {
      return {
        success: false,
        error: `Ошибка получения статистики: ${String(error)}`,
      }
    }
  },

  // Заглушки для остальных обработчиков
  async merge_person_profiles(_params: any) {
    return { success: false, error: "Пока не реализовано" }
  },

  async cluster_unidentified_faces(_params: any) {
    return { success: false, error: "Пока не реализовано" }
  },

  async export_person_data(_params: any) {
    return { success: false, error: "Пока не реализовано" }
  },

  async analyze_person_emotions(_params: any) {
    return { success: false, error: "Пока не реализовано" }
  },

  async manage_person_privacy(_params: any) {
    return { success: false, error: "Пока не реализовано" }
  },

  async find_persons_at_time(_params: any) {
    return { success: false, error: "Пока не реализовано" }
  },

  async generate_person_report(_params: any) {
    return { success: false, error: "Пока не реализовано" }
  },
}

/**
 * Результат выполнения Person Identification инструмента
 */
export interface PersonIdentificationToolResult {
  success: boolean
  message: string
  toolName: string
  input: any
  data?: any
  persons?: any[]
  stats?: any
  profile?: any
  report?: any
  error?: any
}

/**
 * Выполнение Person Identification инструментов
 */
export async function executePersonIdentificationTool(
  toolName: string,
  input: Record<string, any>,
): Promise<PersonIdentificationToolResult> {
  try {
    const handlerName = toolName.replace(/-/g, "_")
    const handler = personIdentificationHandlers[handlerName as keyof typeof personIdentificationHandlers]

    if (!handler) {
      return {
        success: false,
        message: `Неизвестный инструмент Person Identification: ${toolName}`,
        toolName,
        input,
      }
    }

    const result = await handler(input)

    return {
      success: result.success,
      message: result.success
        ? `Инструмент ${toolName} выполнен успешно`
        : result.error || `Ошибка выполнения ${toolName}`,
      toolName,
      input,
      data: result,
      persons: (result as any).persons,
      stats: (result as any).stats,
      profile: (result as any).profile,
      report: (result as any).report,
      error: result.success ? undefined : result.error,
    }
  } catch (error) {
    console.error(`Ошибка выполнения Person Identification инструмента ${toolName}:`, error)
    return {
      success: false,
      message: `Ошибка выполнения ${toolName}: ${error instanceof Error ? error.message : String(error)}`,
      toolName,
      input,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export default personIdentificationTools
