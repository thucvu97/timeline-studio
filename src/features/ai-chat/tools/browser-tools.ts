/**
 * AI инструменты для работы с медиа браузером
 * 
 * Предоставляет Claude возможности для анализа и поиска 
 * медиафайлов в браузере перед добавлением в ресурсы
 */

import { ClaudeTool } from "../services/claude-service"

/**
 * Инструменты для работы с медиа браузером
 */
export const browserTools: ClaudeTool[] = [
  {
    name: "analyze_media_browser",
    description: "Анализирует все доступные медиафайлы в браузере по указанным критериям",
    input_schema: {
      type: "object",
      properties: {
        tab: {
          type: "string",
          enum: ["media", "effects", "filters", "transitions", "templates", "music"],
          description: "Вкладка браузера для анализа"
        },
        filters: {
          type: "object",
          properties: {
            searchQuery: { 
              type: "string",
              description: "Поисковый запрос для фильтрации файлов"
            },
            fileTypes: {
              type: "array",
              items: { type: "string", enum: ["video", "audio", "image"] },
              description: "Типы файлов для включения в анализ"
            },
            dateRange: {
              type: "object",
              properties: {
                start: { type: "string", description: "Начальная дата (ISO format)" },
                end: { type: "string", description: "Конечная дата (ISO format)" }
              },
              description: "Диапазон дат создания/изменения файлов"
            },
            sizeRange: {
              type: "object",
              properties: {
                min: { type: "number", description: "Минимальный размер файла в байтах" },
                max: { type: "number", description: "Максимальный размер файла в байтах" }
              }
            },
            durationRange: {
              type: "object",
              properties: {
                min: { type: "number", description: "Минимальная длительность в секундах" },
                max: { type: "number", description: "Максимальная длительность в секундах" }
              }
            }
          }
        },
        analysisDepth: {
          type: "string",
          enum: ["basic", "detailed", "full"],
          description: "Глубина анализа файлов",
          default: "basic"
        },
        includeMetadata: {
          type: "boolean",
          description: "Включить технические метаданные файлов",
          default: false
        }
      },
      required: ["tab"]
    }
  },

  {
    name: "search_media_files",
    description: "Выполняет целенаправленный поиск медиафайлов по конкретным критериям",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Поисковый запрос (название файла, тег, описание)"
        },
        searchCriteria: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["video", "audio", "image", "any"],
              description: "Тип искомых файлов"
            },
            sortBy: {
              type: "string",
              enum: ["name", "date", "duration", "size", "relevance"],
              description: "Критерий сортировки результатов"
            },
            sortOrder: {
              type: "string",
              enum: ["asc", "desc"],
              description: "Порядок сортировки"
            },
            limit: {
              type: "number",
              description: "Максимальное количество результатов",
              default: 50
            }
          }
        },
        advancedFilters: {
          type: "object",
          properties: {
            resolution: {
              type: "object",
              properties: {
                minWidth: { type: "number" },
                minHeight: { type: "number" },
                aspectRatio: { type: "string" }
              }
            },
            codec: { type: "string", description: "Кодек видео/аудио" },
            fps: { type: "number", description: "Частота кадров для видео" },
            bitrate: { type: "number", description: "Битрейт для аудио/видео" },
            hasAudio: { type: "boolean", description: "Наличие аудиодорожки" },
            isStabilized: { type: "boolean", description: "Стабилизированное видео" }
          }
        }
      },
      required: ["query"]
    }
  },

  {
    name: "get_file_groups",
    description: "Получает информацию о группах файлов (серии, последовательности, связанные файлы)",
    input_schema: {
      type: "object",
      properties: {
        groupingStrategy: {
          type: "string",
          enum: ["by-date", "by-location", "by-series", "by-type", "by-duration", "smart"],
          description: "Стратегия группировки файлов"
        },
        includeMergedGroups: {
          type: "boolean",
          description: "Включить объединенные группы файлов",
          default: true
        },
        minGroupSize: {
          type: "number",
          description: "Минимальное количество файлов в группе",
          default: 2
        }
      }
    }
  },

  {
    name: "analyze_file_relationships",
    description: "Анализирует связи между файлами (последовательности, дубликаты, версии)",
    input_schema: {
      type: "object",
      properties: {
        fileIds: {
          type: "array",
          items: { type: "string" },
          description: "Список идентификаторов файлов для анализа связей"
        },
        relationshipTypes: {
          type: "array",
          items: {
            type: "string",
            enum: ["sequence", "duplicate", "version", "similar", "complementary"]
          },
          description: "Типы связей для поиска"
        },
        similarity: {
          type: "object",
          properties: {
            threshold: { type: "number", description: "Порог схожести (0-1)" },
            compareBy: { 
              type: "array",
              items: { type: "string", enum: ["visual", "audio", "metadata", "filename"] }
            }
          }
        }
      }
    }
  },

  {
    name: "bulk_select_files",
    description: "Массово выбирает файлы по критериям для последующего добавления в ресурсы",
    input_schema: {
      type: "object",
      properties: {
        selectionCriteria: {
          type: "object",
          properties: {
            method: {
              type: "string",
              enum: ["all-matching", "best-quality", "representative", "time-distributed", "manual-list"],
              description: "Метод выбора файлов"
            },
            filters: {
              type: "object",
              properties: {
                searchQuery: { type: "string" },
                fileTypes: { type: "array", items: { type: "string" } },
                qualityThreshold: { type: "string", enum: ["low", "medium", "high", "excellent"] },
                dateRange: {
                  type: "object",
                  properties: {
                    start: { type: "string" },
                    end: { type: "string" }
                  }
                }
              }
            },
            maxCount: {
              type: "number",
              description: "Максимальное количество файлов для выбора"
            },
            prioritize: {
              type: "array",
              items: { type: "string", enum: ["favorites", "recent", "high-quality", "diverse", "long-duration"] },
              description: "Приоритеты при выборе файлов"
            }
          },
          required: ["method"]
        },
        purpose: {
          type: "string",
          description: "Цель выбора файлов (для какого типа проекта)"
        }
      },
      required: ["selectionCriteria", "purpose"]
    }
  },

  {
    name: "get_browser_state",
    description: "Получает текущее состояние браузера (активная вкладка, фильтры, выбранные файлы)",
    input_schema: {
      type: "object",
      properties: {
        includeSelection: {
          type: "boolean",
          description: "Включить информацию о выбранных файлах",
          default: true
        },
        includeFilters: {
          type: "boolean",
          description: "Включить текущие фильтры и настройки",
          default: true
        },
        includeStats: {
          type: "boolean",
          description: "Включить статистику по файлам в браузере",
          default: false
        }
      }
    }
  },

  {
    name: "update_browser_filters",
    description: "Обновляет фильтры и настройки браузера для лучшего отображения нужных файлов",
    input_schema: {
      type: "object",
      properties: {
        tab: {
          type: "string",
          enum: ["media", "effects", "filters", "transitions", "templates", "music"],
          description: "Вкладка для изменения настроек"
        },
        newFilters: {
          type: "object",
          properties: {
            searchQuery: { type: "string" },
            filterType: { type: "string" },
            sortBy: { type: "string" },
            sortOrder: { type: "string", enum: ["asc", "desc"] },
            viewMode: { type: "string", enum: ["grid", "list", "detail"] },
            showFavoritesOnly: { type: "boolean" }
          }
        },
        reason: {
          type: "string",
          description: "Причина изменения фильтров"
        }
      },
      required: ["tab", "newFilters", "reason"]
    }
  },

  {
    name: "analyze_missing_content",
    description: "Анализирует, какого типа контента не хватает в браузере для конкретного проекта",
    input_schema: {
      type: "object",
      properties: {
        projectType: {
          type: "string",
          enum: ["wedding", "travel", "corporate", "social", "documentary", "education", "music-video"],
          description: "Тип проекта для анализа"
        },
        currentContent: {
          type: "object",
          properties: {
            videoCount: { type: "number" },
            audioCount: { type: "number" },
            imageCount: { type: "number" },
            totalDuration: { type: "number" },
            dominantTypes: { type: "array", items: { type: "string" } }
          },
          description: "Характеристики текущего контента"
        },
        targetRequirements: {
          type: "object",
          properties: {
            desiredDuration: { type: "number" },
            mustHaveElements: { type: "array", items: { type: "string" } },
            preferredRatio: { type: "string" },
            qualityLevel: { type: "string", enum: ["basic", "professional", "cinema"] }
          }
        }
      },
      required: ["projectType"]
    }
  },

  {
    name: "suggest_import_sources",
    description: "Предлагает источники для импорта недостающего контента",
    input_schema: {
      type: "object",
      properties: {
        missingContentTypes: {
          type: "array",
          items: { type: "string" },
          description: "Типы недостающего контента"
        },
        projectBudget: {
          type: "string",
          enum: ["free", "low", "medium", "high"],
          description: "Бюджет проекта для предложений"
        },
        preferredSources: {
          type: "array",
          items: { type: "string", enum: ["stock-footage", "music-library", "user-generated", "ai-generated"] },
          description: "Предпочитаемые источники контента"
        }
      },
      required: ["missingContentTypes"]
    }
  },

  {
    name: "export_file_list",
    description: "Экспортирует список файлов из браузера в различных форматах",
    input_schema: {
      type: "object",
      properties: {
        format: {
          type: "string",
          enum: ["json", "csv", "text", "xml"],
          description: "Формат экспорта списка файлов"
        },
        includeMetadata: {
          type: "boolean",
          description: "Включить метаданные файлов в экспорт",
          default: false
        },
        filterCriteria: {
          type: "object",
          description: "Критерии для фильтрации экспортируемых файлов"
        }
      },
      required: ["format"]
    }
  }
]

/**
 * Типы событий браузера, которые могут генерировать инструменты
 */
export type BrowserToolEvent = 
  | { type: "BROWSER_ANALYZED"; tab: string; filesFound: number }
  | { type: "FILES_SEARCHED"; query: string; resultsCount: number }
  | { type: "FILES_SELECTED"; count: number; criteria: any }
  | { type: "BROWSER_FILTERS_UPDATED"; tab: string; newFilters: any }
  | { type: "RELATIONSHIPS_ANALYZED"; files: string[]; relationships: any[] }

/**
 * Результат выполнения инструмента браузера
 */
export interface BrowserToolResult {
  success: boolean
  message: string
  data?: {
    files?: any[]
    groups?: any[]
    relationships?: any[]
    analysis?: any
    suggestions?: string[]
    selectedFiles?: string[]
  }
  errors?: string[]
  warnings?: string[]
  nextActions?: string[]
}