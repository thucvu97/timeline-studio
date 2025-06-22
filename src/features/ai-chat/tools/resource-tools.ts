/**
 * AI инструменты для управления ресурсами
 *
 * Предоставляет Claude инструменты для анализа, добавления
 * и управления ресурсами в Resources Provider
 */

import { ClaudeTool } from "../services/claude-service"

/**
 * Инструменты для работы с ресурсами
 */
export const resourceTools: ClaudeTool[] = [
  {
    name: "analyze_available_resources",
    description: "Анализирует все доступные ресурсы в Resources Provider и возвращает подробную статистику",
    input_schema: {
      type: "object",
      properties: {
        resourceType: {
          type: "string",
          enum: ["all", "media", "music", "effect", "filter", "transition", "template", "style-template"],
          description: "Тип ресурсов для анализа",
        },
        includeStats: {
          type: "boolean",
          description: "Включить статистику использования",
          default: true,
        },
        filter: {
          type: "object",
          properties: {
            addedAfter: { type: "string", description: "ISO дата, после которой были добавлены ресурсы" },
            addedBy: { type: "string", description: "Фильтр по источнику добавления" },
          },
          description: "Дополнительные фильтры для анализа",
        },
      },
      required: ["resourceType"],
    },
  },

  {
    name: "add_resource_to_pool",
    description: "Добавляет конкретный ресурс в пул ресурсов проекта с указанием причины",
    input_schema: {
      type: "object",
      properties: {
        resourceType: {
          type: "string",
          enum: ["media", "music", "effect", "filter", "transition", "template", "style-template"],
          description: "Тип добавляемого ресурса",
        },
        resourceId: {
          type: "string",
          description: "Уникальный идентификатор ресурса",
        },
        reason: {
          type: "string",
          description: "Объяснение, зачем этот ресурс добавляется в проект",
        },
        autoApply: {
          type: "boolean",
          description: "Автоматически применить ресурс к подходящим элементам",
          default: false,
        },
      },
      required: ["resourceType", "resourceId", "reason"],
    },
  },

  {
    name: "bulk_add_resources",
    description: "Массово добавляет ресурсы в пул по заданным критериям",
    input_schema: {
      type: "object",
      properties: {
        criteria: {
          type: "object",
          properties: {
            resourceType: {
              type: "string",
              enum: ["media", "music", "effect", "filter", "transition", "template", "style-template"],
            },
            selectionMethod: {
              type: "string",
              enum: ["all", "filtered", "recent", "favorites", "smart"],
              description: "Метод выбора ресурсов",
            },
            filters: {
              type: "object",
              properties: {
                searchQuery: { type: "string" },
                dateRange: {
                  type: "object",
                  properties: {
                    start: { type: "string" },
                    end: { type: "string" },
                  },
                },
                fileTypes: {
                  type: "array",
                  items: { type: "string", enum: ["video", "audio", "image"] },
                },
                minDuration: { type: "number" },
                maxDuration: { type: "number" },
                tags: { type: "array", items: { type: "string" } },
              },
            },
            maxCount: {
              type: "number",
              description: "Максимальное количество ресурсов для добавления",
            },
          },
          required: ["resourceType", "selectionMethod"],
        },
        reason: {
          type: "string",
          description: "Объяснение цели массового добавления ресурсов",
        },
      },
      required: ["criteria", "reason"],
    },
  },

  {
    name: "remove_resource_from_pool",
    description: "Удаляет ресурс из пула ресурсов проекта",
    input_schema: {
      type: "object",
      properties: {
        resourceId: {
          type: "string",
          description: "Идентификатор удаляемого ресурса",
        },
        reason: {
          type: "string",
          description: "Причина удаления ресурса",
        },
        removeFromTimeline: {
          type: "boolean",
          description: "Также удалить из таймлайна, если используется",
          default: false,
        },
      },
      required: ["resourceId", "reason"],
    },
  },

  {
    name: "suggest_complementary_resources",
    description: "Анализирует текущие ресурсы и предлагает дополнительные для улучшения проекта",
    input_schema: {
      type: "object",
      properties: {
        baseContent: {
          type: "array",
          items: {
            type: "object",
            properties: {
              resourceId: { type: "string" },
              resourceType: { type: "string" },
            },
          },
          description: "Основной контент для анализа",
        },
        projectType: {
          type: "string",
          enum: ["wedding", "travel", "corporate", "social", "documentary", "education", "music-video", "commercial"],
          description: "Тип проекта для контекстных предложений",
        },
        mood: {
          type: "string",
          enum: ["energetic", "calm", "dramatic", "romantic", "professional", "playful", "serious", "uplifting"],
          description: "Желаемое настроение проекта",
        },
        targetDuration: {
          type: "number",
          description: "Целевая длительность проекта в секундах",
        },
        includeAutoAdd: {
          type: "boolean",
          description: "Автоматически добавить наиболее подходящие ресурсы",
          default: false,
        },
      },
      required: ["projectType", "mood"],
    },
  },

  {
    name: "update_resource_parameters",
    description: "Обновляет параметры уже добавленного ресурса",
    input_schema: {
      type: "object",
      properties: {
        resourceId: {
          type: "string",
          description: "Идентификатор ресурса для обновления",
        },
        newParameters: {
          type: "object",
          description: "Новые параметры ресурса (зависят от типа ресурса)",
        },
        reason: {
          type: "string",
          description: "Причина изменения параметров",
        },
      },
      required: ["resourceId", "newParameters", "reason"],
    },
  },

  {
    name: "analyze_resource_compatibility",
    description: "Анализирует совместимость ресурсов между собой и с текущим проектом",
    input_schema: {
      type: "object",
      properties: {
        resourceIds: {
          type: "array",
          items: { type: "string" },
          description: "Список идентификаторов ресурсов для проверки совместимости",
        },
        checkAgainst: {
          type: "string",
          enum: ["project-settings", "other-resources", "timeline-structure", "all"],
          description: "С чем проверять совместимость",
        },
        includeRecommendations: {
          type: "boolean",
          description: "Включить рекомендации по устранению проблем совместимости",
          default: true,
        },
      },
      required: ["resourceIds"],
    },
  },

  {
    name: "get_resource_usage_stats",
    description: "Получает статистику использования ресурсов в проекте",
    input_schema: {
      type: "object",
      properties: {
        timeRange: {
          type: "object",
          properties: {
            start: { type: "string", description: "Начальная дата анализа" },
            end: { type: "string", description: "Конечная дата анализа" },
          },
          description: "Временной диапазон для анализа",
        },
        groupBy: {
          type: "string",
          enum: ["type", "date", "source", "usage-frequency"],
          description: "Способ группировки статистики",
        },
        includeUnused: {
          type: "boolean",
          description: "Включить неиспользуемые ресурсы в статистику",
          default: true,
        },
      },
    },
  },

  {
    name: "cleanup_unused_resources",
    description: "Удаляет неиспользуемые ресурсы из пула для оптимизации",
    input_schema: {
      type: "object",
      properties: {
        dryRun: {
          type: "boolean",
          description: "Только показать, что будет удалено, не удалять",
          default: true,
        },
        criteria: {
          type: "object",
          properties: {
            unusedForDays: { type: "number", description: "Не использовались N дней" },
            resourceTypes: {
              type: "array",
              items: { type: "string" },
              description: "Типы ресурсов для очистки",
            },
            excludeFavorites: {
              type: "boolean",
              description: "Исключить избранные ресурсы",
              default: true,
            },
          },
        },
        reason: {
          type: "string",
          description: "Причина очистки ресурсов",
        },
      },
      required: ["reason"],
    },
  },

  {
    name: "export_resource_list",
    description: "Экспортирует список ресурсов в различных форматах для внешнего использования",
    input_schema: {
      type: "object",
      properties: {
        format: {
          type: "string",
          enum: ["json", "csv", "text", "markdown"],
          description: "Формат экспорта",
        },
        includeMetadata: {
          type: "boolean",
          description: "Включить метаданные ресурсов",
          default: true,
        },
        filterCriteria: {
          type: "object",
          properties: {
            resourceTypes: { type: "array", items: { type: "string" } },
            usedOnly: { type: "boolean" },
            addedAfter: { type: "string" },
          },
          description: "Критерии фильтрации для экспорта",
        },
      },
      required: ["format"],
    },
  },
]

/**
 * Типы событий для ресурсов, которые могут генерировать инструменты
 */
export type ResourceToolEvent =
  | { type: "RESOURCE_ADDED"; resourceId: string; resourceType: string; reason: string }
  | { type: "RESOURCE_REMOVED"; resourceId: string; reason: string }
  | { type: "RESOURCES_BULK_ADDED"; count: number; criteria: any; reason: string }
  | { type: "RESOURCE_UPDATED"; resourceId: string; changes: any; reason: string }
  | { type: "RESOURCES_ANALYZED"; analysis: any }
  | { type: "RESOURCES_CLEANUP"; removedCount: number; criteria: any }

/**
 * Результат выполнения инструмента для ресурсов
 */
export interface ResourceToolResult {
  success: boolean
  message: string
  data?: {
    addedResources?: string[]
    removedResources?: string[]
    analysis?: any
    suggestions?: string[]
    warnings?: string[]
  }
  errors?: string[]
  nextActions?: string[]
}
