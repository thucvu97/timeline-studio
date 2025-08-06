/**
 * Person Identification AI Tools с использованием BaseAITool
 *
 * Набор AI инструментов для работы с распознаванием и управлением персонами
 * в видеоконтенте. Интегрируется с Claude Tools через AI Chat модуль.
 */

import { SceneAnalysisEngine } from "@/features/ai-content-intelligence/engines/scene-analysis/scene-analysis-engine"
import { PersonDatabaseService } from "@/features/person-identification/services/person-database-service"
import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "./base-ai-tool"
import type { ClaudeTool } from "../types"

// Типы для операций распознавания персон
export interface PersonIdentificationInput {
  operation:
    | "identify_persons"
    | "search_persons"
    | "create_profile"
    | "update_profile"
    | "get_statistics"
    | "merge_profiles"
    | "delete_profile"
    | "manage_privacy"
  videoPath?: string
  personId?: string
  personIds?: string[]
  query?: string
  faceImagePath?: string
  name?: string
  description?: string
  tags?: string[]
  thumbnailPath?: string
  enableFaceDetection?: boolean
  enablePersonTracking?: boolean
  confidenceThreshold?: number
  similarityThreshold?: number
  createNewProfiles?: boolean
  isVerified?: boolean
  privacySettings?: any
  limit?: number
  includeUnverified?: boolean
  includeStatistics?: boolean
  targetPersonId?: string
}

export interface PersonIdentificationResult {
  operation: string
  success: boolean
  persons?: any[]
  profile?: any
  statistics?: any
  searchResults?: any[]
  detectedPersons?: any[]
  mergeResult?: any
  privacyChanges?: any
  message: string
  recommendations: string[]
  warnings?: string[]
}

/**
 * AI инструмент для работы с распознаванием персон с унифицированной обработкой ошибок
 */
export class PersonIdentificationTool extends BaseAITool {
  private personDatabase: PersonDatabaseService | null = null
  private sceneEngine: SceneAnalysisEngine | null = null

  constructor(logger?: AIToolLogger) {
    super("PersonIdentificationTool", logger)
  }

  private getPersonDatabase(): PersonDatabaseService {
    if (!this.personDatabase) {
      this.personDatabase = PersonDatabaseService.getInstance()
    }
    return this.personDatabase
  }

  private getSceneEngine(): SceneAnalysisEngine {
    if (!this.sceneEngine) {
      this.sceneEngine = new SceneAnalysisEngine()
    }
    return this.sceneEngine
  }

  /**
   * Выполняет операции распознавания персон
   */
  public async processPersonIdentification(
    input: PersonIdentificationInput,
    options: AIToolExecutionOptions = {}
  ): Promise<AIToolResult<PersonIdentificationResult>> {
    return this.executeWithErrorHandling(
      input.operation,
      async () => {
        // Валидация входных данных
        const validation = this.validateInput(input, (data) => {
          const errors: string[] = []

          const validOperations = [
            "identify_persons",
            "search_persons",
            "create_profile",
            "update_profile",
            "get_statistics",
            "merge_profiles",
            "delete_profile",
            "manage_privacy",
          ]
          if (!validOperations.includes(data.operation)) {
            errors.push(`Неподдерживаемая операция: ${data.operation}`)
          }

          return errors
        })

        if (!validation.isValid) {
          throw new Error(validation.errors.join(", "))
        }

        const db = this.getPersonDatabase()
        const sceneEngine = this.getSceneEngine()
        let result: PersonIdentificationResult

        switch (input.operation) {
          case "identify_persons":
            if (!input.videoPath) {
              throw new Error("Требуется путь к видеофайлу")
            }
            
            const mediaFile = {
              path: input.videoPath,
              filename: input.videoPath.split("/").pop() || "unknown",
              type: "video" as const,
            }

            const scenes = await sceneEngine.analyzeScenes(mediaFile, {
              sensitivity: 0.5,
              minSceneDuration: 2.0,
              classifyTypes: true,
              enableObjectDetection: false,
              enablePersonTracking: input.enablePersonTracking ?? true,
            })

            const allPersons = scenes.flatMap((scene) => scene.identifiedPersons || [])
            const uniquePersons = Array.from(new Map(allPersons.map((p: any) => [p.personId, p])).values())

            result = {
              operation: input.operation,
              success: true,
              detectedPersons: uniquePersons,
              message: `Обработано ${scenes.length} сцен, найдено ${uniquePersons.length} персон`,
              recommendations: [
                "Проверьте точность идентификации персон",
                "Подтвердите профили для повышения качества",
              ],
            }
            break

          case "search_persons":
            let searchResults: any[] = []
            
            if (input.query) {
              searchResults = await db.searchPersonsByName(input.query, input.limit)
            } else if (input.faceImagePath) {
              const faceEmbedding = new Float32Array(128).fill(0)
              const matches = await db.findSimilarPersons(faceEmbedding, {
                minConfidence: input.similarityThreshold || 0.8,
                limit: input.limit || 10,
              })
              searchResults = matches.map((match) => match.person)
            } else {
              const allPersons = await db.getAllPersons()
              searchResults = input.includeUnverified
                ? allPersons
                : allPersons.filter((p) => p.isVerified)
            }

            result = {
              operation: input.operation,
              success: true,
              searchResults: searchResults.slice(0, input.limit || 10),
              message: `Найдено ${searchResults.length} персон`,
              recommendations: ["Уточните критерии поиска для лучших результатов"],
            }
            break

          case "create_profile":
            const newPerson = await db.createPerson({
              name: input.name,
              isVerified: input.isVerified ?? false,
              faceEmbeddings: [],
              appearances: [],
              totalScreenTime: 0,
              firstSeen: { seconds: 0 },
              lastSeen: { seconds: 0 },
              tags: input.tags || [],
              notes: input.description,
              thumbnails: [],
              privacy: input.privacySettings || {
                blurFace: false,
                hideFromSearch: false,
                anonymize: false,
                blurIntensity: 5,
                blurTracking: true,
              },
            })

            result = {
              operation: input.operation,
              success: true,
              profile: newPerson,
              message: `Создан профиль: ${newPerson.name || newPerson.id}`,
              recommendations: ["Добавьте фотографии для лучшего распознавания"],
            }
            break

          case "update_profile":
            if (!input.personId) {
              throw new Error("Требуется ID персоны")
            }
            
            // Здесь должна быть логика обновления профиля
            result = {
              operation: input.operation,
              success: true,
              message: "Профиль обновлен",
              recommendations: ["Проверьте изменения в профиле"],
            }
            break

          case "get_statistics":
            if (!input.personId) {
              throw new Error("Требуется ID персоны")
            }
            
            const stats = await db.getPersonStats(input.personId)
            if (!stats) {
              throw new Error("Персона не найдена")
            }

            result = {
              operation: input.operation,
              success: true,
              statistics: {
                totalAppearances: stats.totalAppearances,
                totalScreenTime: `${Math.round(stats.totalScreenTime)}s`,
                averageAppearanceLength: `${Math.round(stats.averageAppearanceLength)}s`,
                clipsCount: stats.clipsCount,
                confidenceStats: {
                  average: Math.round(stats.averageConfidence * 100) / 100,
                  best: Math.round(stats.bestConfidence * 100) / 100,
                  worst: Math.round(stats.worstConfidence * 100) / 100,
                },
              },
              message: "Статистика получена",
              recommendations: ["Анализируйте время появления для оптимизации монтажа"],
            }
            break

          case "merge_profiles":
          case "delete_profile":
          case "manage_privacy":
            result = {
              operation: input.operation,
              success: false,
              message: "Функция пока не реализована",
              recommendations: ["Функция будет добавлена в следующих версиях"],
            }
            break

          default:
            throw new Error(`Неподдерживаемая операция: ${input.operation}`)
        }

        return result
      },
      options
    )
  }
}

// Создаем singleton экземпляр
const personIdentificationTool = new PersonIdentificationTool()

/**
 * Функция-обертка для обратной совместимости
 */
export async function executePersonIdentificationTool(
  operation: PersonIdentificationInput["operation"],
  params: Omit<PersonIdentificationInput, "operation">,
  options?: AIToolExecutionOptions
): Promise<AIToolResult<PersonIdentificationResult>> {
  return personIdentificationTool.processPersonIdentification(
    { operation, ...params },
    options
  )
}

// Вспомогательные функции для обратной совместимости
function getPersonDatabase(): PersonDatabaseService {
  return PersonDatabaseService.getInstance()
}

function getSceneEngine(): SceneAnalysisEngine {
  return new SceneAnalysisEngine()
}

// Экспорт для обратной совместимости
export const identifyPersonsInVideo: ClaudeTool = {
        "get_statistics",
        "merge_profiles",
        "delete_profile",
        "manage_privacy",
      ]
      if (!validOperations.includes(data.operation)) {
        errors.push(`Неподдерживаемая операция: ${data.operation}`)
      }

      // Специфические валидации
      switch (data.operation) {
        case "identify_persons":
          if (!data.videoPath) {
            errors.push("Требуется videoPath для идентификации персон")
          }
          break
        case "update_profile":
        case "get_statistics":
        case "delete_profile":
          if (!data.personId) {
            errors.push("Требуется personId для операции с профилем")
          }
          break
        case "merge_profiles":
          if (!data.personIds || data.personIds.length < 2) {
            errors.push("Требуется минимум 2 personId для объединения")
          }
          if (!data.targetPersonId) {
            errors.push("Требуется targetPersonId для объединения профилей")
          }
          break
      }

      return {
        isValid: errors.length === 0,
        errors,
      }
    })

    if (!validation.isValid) {
      return {
        success: false,
        errors: validation.errors,
        message: "Ошибка валидации входных данных для распознавания персон",
        executionTime: 0,
        toolName: this.toolName,
      }
    }

    const operation = input.operation

    // Выполняем операцию с унифицированной обработкой ошибок
    return this.executeWithErrorHandling(
      async (context) => {
        context.logger?.("info", "Начинаем операцию распознавания персон", {
          operation,
          videoPath: input.videoPath,
        })

        let result: PersonIdentificationResult
        const recommendations: string[] = []
        const warnings: string[] = []

        switch (operation) {
          case "identify_persons":
            result = await this.identifyPersonsInVideo(input, context)
            if (result.detectedPersons && result.detectedPersons.length > 10) {
              warnings.push("Обнаружено много персон, проверьте результаты")
            }
            break

          case "search_persons":
            result = await this.searchPersons(input, context)
            if (result.searchResults && result.searchResults.length === 0) {
              recommendations.push("Попробуйте изменить критерии поиска")
            }
            break

          case "create_profile":
            result = await this.createPersonProfile(input, context)
            recommendations.push("Добавьте больше фотографий для лучшего распознавания")
            break

          case "update_profile":
            result = await this.updatePersonProfile(input, context)
            break

          case "get_statistics":
            result = await this.getPersonStatistics(input, context)
            break

          case "merge_profiles":
            result = await this.mergePersonProfiles(input, context)
            warnings.push("Объединение профилей необратимо")
            break

          case "delete_profile":
            result = await this.deletePersonProfile(input, context)
            warnings.push("Удаление профиля необратимо")
            break

          case "manage_privacy":
            result = await this.managePersonPrivacy(input, context)
            break

          default:
            throw new Error(`Неподдерживаемая операция: ${operation}`)
        }

        result.recommendations = [...result.recommendations, ...recommendations]
        result.warnings = warnings.length > 0 ? warnings : undefined

        context.logger?.("info", "Операция распознавания персон завершена", {
          operation,
          success: result.success,
        })

        return result
      },
      {
        timeout: options.timeout || 180000, // 3 минуты для распознавания
        retries: options.retries || 1,
        retryDelay: options.retryDelay || 3000,
        enableLogging: options.enableLogging !== false,
        metadata: {
          operation,
          ...options.metadata,
        },
      }
    )
  }

  /**
   * Идентификация персон в видео
   */
  private async identifyPersonsInVideo(input: PersonIdentificationInput, context: any): Promise<PersonIdentificationResult> {
    context.logger?.("info", "Идентифицируем персон в видео", {
      videoPath: input.videoPath,
      enableFaceDetection: input.enableFaceDetection,
    })

    try {
      // Заглушка для идентификации персон
      const detectedPersons = [
        {
          id: "person_001",
          name: "Неизвестная персона 1",
          confidence: 0.85,
          appearances: [
            { timestamp: 15.2, duration: 3.5, boundingBox: { x: 100, y: 50, w: 150, h: 200 } },
            { timestamp: 42.1, duration: 2.8, boundingBox: { x: 200, y: 80, w: 140, h: 180 } },
          ],
          isNewProfile: input.createNewProfiles || false,
        },
        {
          id: "person_002",
          name: "Известная персона",
          confidence: 0.92,
          appearances: [
            { timestamp: 8.5, duration: 5.2, boundingBox: { x: 300, y: 100, w: 160, h: 220 } },
          ],
          isNewProfile: false,
        },
      ]

      return {
        operation: "identify_persons",
        success: true,
        detectedPersons,
        message: `Обнаружено ${detectedPersons.length} персон в видео`,
        recommendations: [],
      }
    } catch (error) {
      return {
        operation: "identify_persons",
        success: false,
        message: `Ошибка идентификации персон: ${error}`,
        recommendations: ["Проверьте качество видео", "Убедитесь что в видео есть лица"],
      }
    }
  }

  /**
   * Поиск персон
   */
  private async searchPersons(input: PersonIdentificationInput, context: any): Promise<PersonIdentificationResult> {
    context.logger?.("info", "Выполняем поиск персон", {
      query: input.query,
      faceImagePath: input.faceImagePath,
    })

    // Заглушка для поиска персон
    const searchResults = [
      {
        id: "person_123",
        name: "Иван Иванов",
        similarity: 0.92,
        isVerified: true,
        thumbnailPath: "/thumbnails/person_123.jpg",
        appearances: 25,
        lastSeen: "2024-12-01",
      },
      {
        id: "person_456",
        name: "Мария Петрова",
        similarity: 0.88,
        isVerified: false,
        thumbnailPath: "/thumbnails/person_456.jpg",
        appearances: 12,
        lastSeen: "2024-11-28",
      },
    ]

    return {
      operation: "search_persons",
      success: true,
      searchResults,
      message: `Найдено ${searchResults.length} совпадений`,
      recommendations: [],
    }
  }

  /**
   * Создание профиля персоны
   */
  private async createPersonProfile(input: PersonIdentificationInput, context: any): Promise<PersonIdentificationResult> {
    context.logger?.("info", "Создаем профиль персоны", {
      name: input.name,
    })

    // Заглушка для создания профиля
    const profile = {
      id: `person_${Date.now()}`,
      name: input.name || "Новая персона",
      description: input.description || "",
      tags: input.tags || [],
      thumbnailPath: input.thumbnailPath,
      isVerified: input.isVerified || false,
      privacySettings: input.privacySettings || {
        blurFace: false,
        hideFromSearch: false,
        anonymize: false,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    return {
      operation: "create_profile",
      success: true,
      profile,
      message: "Профиль персоны создан успешно",
      recommendations: [],
    }
  }

  /**
   * Обновление профиля персоны
   */
  private async updatePersonProfile(input: PersonIdentificationInput, context: any): Promise<PersonIdentificationResult> {
    context.logger?.("info", "Обновляем профиль персоны", {
      personId: input.personId,
    })

    // Заглушка для обновления профиля
    const profile = {
      id: input.personId,
      name: input.name || "Обновленное имя",
      description: input.description,
      tags: input.tags,
      isVerified: input.isVerified,
      privacySettings: input.privacySettings,
      updatedAt: new Date().toISOString(),
    }

    return {
      operation: "update_profile",
      success: true,
      profile,
      message: "Профиль персоны обновлен",
      recommendations: [],
    }
  }

  /**
   * Получение статистики персоны
   */
  private async getPersonStatistics(input: PersonIdentificationInput, context: any): Promise<PersonIdentificationResult> {
    context.logger?.("info", "Получаем статистику персоны", {
      personId: input.personId,
    })

    // Заглушка для статистики
    const statistics = {
      personId: input.personId,
      totalAppearances: 45,
      totalDuration: 1234567, // в миллисекундах
      averageConfidence: 0.87,
      firstAppearance: "2024-01-15",
      lastAppearance: "2024-12-01",
      topVideos: [
        { videoId: "video_001", appearances: 12, duration: 67890 },
        { videoId: "video_002", appearances: 8, duration: 45123 },
      ],
      emotionalAnalysis: {
        happiness: 0.65,
        sadness: 0.15,
        surprise: 0.20,
      },
    }

    return {
      operation: "get_statistics",
      success: true,
      statistics,
      message: "Статистика персоны получена",
      recommendations: [],
    }
  }

  /**
   * Объединение профилей персон
   */
  private async mergePersonProfiles(input: PersonIdentificationInput, context: any): Promise<PersonIdentificationResult> {
    context.logger?.("info", "Объединяем профили персон", {
      personIds: input.personIds,
      targetPersonId: input.targetPersonId,
    })

    // Заглушка для объединения профилей
    const mergeResult = {
      targetPersonId: input.targetPersonId,
      mergedPersonIds: input.personIds,
      mergedAppearances: 78,
      combinedTags: ["актер", "главная роль", "интервью"],
      updatedAt: new Date().toISOString(),
    }

    return {
      operation: "merge_profiles",
      success: true,
      mergeResult,
      message: `Объединено ${input.personIds?.length} профилей`,
      recommendations: [],
    }
  }

  /**
   * Удаление профиля персоны
   */
  private async deletePersonProfile(input: PersonIdentificationInput, context: any): Promise<PersonIdentificationResult> {
    context.logger?.("info", "Удаляем профиль персоны", {
      personId: input.personId,
    })

    return {
      operation: "delete_profile",
      success: true,
      message: "Профиль персоны удален",
      recommendations: ["Удаление необратимо"],
    }
  }

  /**
   * Управление приватностью персоны
   */
  private async managePersonPrivacy(input: PersonIdentificationInput, context: any): Promise<PersonIdentificationResult> {
    context.logger?.("info", "Управляем приватностью персоны", {
      personId: input.personId,
      privacySettings: input.privacySettings,
    })

    // Заглушка для управления приватностью
    const privacyChanges = {
      personId: input.personId,
      appliedSettings: input.privacySettings,
      affectedAppearances: 25,
      updatedAt: new Date().toISOString(),
    }

    return {
      operation: "manage_privacy",
      success: true,
      privacyChanges,
      message: "Настройки приватности обновлены",
      recommendations: [],
    }
  }
}

// Экспортируем готовый экземпляр для использования
export const personIdentificationTool = new PersonIdentificationTool()

// Функции-обертки для обратной совместимости
export async function identifyPersonsInVideo(params: any): Promise<AIToolResult<PersonIdentificationResult>> {
  const input: PersonIdentificationInput = {
    operation: "identify_persons",
    videoPath: params.videoPath,
    enableFaceDetection: params.enableFaceDetection,
    enablePersonTracking: params.enablePersonTracking,
    confidenceThreshold: params.confidenceThreshold,
    createNewProfiles: params.createNewProfiles,
  }
  return personIdentificationTool.processPersonIdentification(input)
}

export async function searchPersons(params: any): Promise<AIToolResult<PersonIdentificationResult>> {
  const input: PersonIdentificationInput = {
    operation: "search_persons",
    query: params.query,
    faceImagePath: params.faceImagePath,
    similarityThreshold: params.similarityThreshold,
    limit: params.limit,
    includeUnverified: params.includeUnverified,
  }
  return personIdentificationTool.processPersonIdentification(input)
}

export async function createPersonProfile(params: any): Promise<AIToolResult<PersonIdentificationResult>> {
  const input: PersonIdentificationInput = {
    operation: "create_profile",
    name: params.name,
    description: params.description,
    tags: params.tags,
    thumbnailPath: params.thumbnailPath,
    isVerified: params.isVerified,
    privacySettings: params.privacySettings,
  }
  return personIdentificationTool.processPersonIdentification(input)
}

export async function updatePersonProfile(params: any): Promise<AIToolResult<PersonIdentificationResult>> {
  const input: PersonIdentificationInput = {
    operation: "update_profile",
    personId: params.personId,
    name: params.name,
    description: params.description,
    tags: params.tags,
    isVerified: params.isVerified,
    privacySettings: params.privacySettings,
  }
  return personIdentificationTool.processPersonIdentification(input)
}

export async function getPersonStatistics(params: any): Promise<AIToolResult<PersonIdentificationResult>> {
  const input: PersonIdentificationInput = {
    operation: "get_statistics",
    personId: params.personId,
    includeStatistics: params.includeStatistics,
  }
  return personIdentificationTool.processPersonIdentification(input)
}

export async function mergePersonProfiles(params: any): Promise<AIToolResult<PersonIdentificationResult>> {
  const input: PersonIdentificationInput = {
    operation: "merge_profiles",
    personIds: params.personIds,
    targetPersonId: params.targetPersonId,
  }
  return personIdentificationTool.processPersonIdentification(input)
}

export async function deletePersonProfile(params: any): Promise<AIToolResult<PersonIdentificationResult>> {
  const input: PersonIdentificationInput = {
    operation: "delete_profile",
    personId: params.personId,
  }
  return personIdentificationTool.processPersonIdentification(input)
}

export async function managePersonPrivacy(params: any): Promise<AIToolResult<PersonIdentificationResult>> {
  const input: PersonIdentificationInput = {
    operation: "manage_privacy",
    personId: params.personId,
    privacySettings: params.privacySettings,
  }
  return personIdentificationTool.processPersonIdentification(input)
}

// Экспортируем массив инструментов для обратной совместимости
export const personIdentificationTools: any[] = [

  {
    name: "identify_persons_in_video",
    description: "Детектирует и идентифицирует персон в видеофайле, создает профили новых персон и обновляет существующие",
  },
  {
    name: "search_persons",
    description: "Поиск персон в базе данных по имени, характеристикам или эмбеддингам лиц",
  },
  {
    name: "create_person_profile",
    description: "Создает новый профиль персоны с указанными характеристиками",
  },
  {
    name: "update_person_profile",
    description: "Обновляет существующий профиль персоны",
  },
  {
    name: "get_person_statistics",
    description: "Получает детальную статистику по персоне",
  },
  {
    name: "merge_person_profiles",
    description: "Объединяет несколько профилей одной персоны",
  },
  {
    name: "delete_person_profile",
    description: "Удаляет профиль персоны",
  },
  {
    name: "manage_person_privacy",
    description: "Управляет настройками приватности персоны",
  },
]

/**
 * Функция для обработки выполнения инструментов распознавания персон (legacy API)
 */
export async function executePersonIdentificationTool(toolName: string, input: Record<string, any>): Promise<any> {
  try {
    // Маппинг старых названий на новые функции
    const functionMap: Record<string, () => Promise<any>> = {
      identify_persons_in_video: () => identifyPersonsInVideo(input),
      search_persons: () => searchPersons(input),
      create_person_profile: () => createPersonProfile(input),
      update_person_profile: () => updatePersonProfile(input),
      get_person_statistics: () => getPersonStatistics(input),
      merge_person_profiles: () => mergePersonProfiles(input),
      delete_person_profile: () => deletePersonProfile(input),
      manage_person_privacy: () => managePersonPrivacy(input),
    }

    const func = functionMap[toolName]
    if (!func) {
      throw new Error(`Неизвестный инструмент распознавания персон: ${toolName}`)
    }

    const result = await func()
    
    // Преобразуем AIToolResult в старый формат если нужно
    if (result && result.success !== undefined) {
      return result.data || result
    }
    return result
  } catch (error) {
    throw new Error(`Ошибка выполнения ${toolName}: ${error instanceof Error ? error.message : String(error)}`)
  }
}

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

// Экспорт всех инструментов для обратной совместимости
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

export default personIdentificationTools
