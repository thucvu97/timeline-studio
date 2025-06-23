/**
 * Инструменты Claude AI для пакетной обработки клипов
 * Массовый анализ, транскрипция и обработка видео
 */

import { 
  BatchOperationParams, 
  BatchOperationResult, 
  BatchOperationType,
  BatchProcessingService,
  BatchProgress 
} from "../services/batch-processing-service"
import { ClaudeTool } from "../services/claude-service"

/**
 * Инструменты для пакетной обработки
 */
export const batchProcessingTools: ClaudeTool[] = [
  // 1. Запуск пакетной операции
  {
    name: "start_batch_operation",
    description: "Запускает пакетную обработку нескольких клипов с выбранной операцией",
    input_schema: {
      type: "object",
      properties: {
        clipIds: {
          type: "array",
          items: { type: "string" },
          description: "Список ID клипов для обработки"
        },
        operation: {
          type: "string",
          enum: [
            "video_analysis",
            "whisper_transcription", 
            "subtitle_generation",
            "quality_analysis",
            "scene_detection",
            "motion_analysis", 
            "audio_analysis",
            "language_detection",
            "comprehensive_analysis"
          ],
          description: "Тип пакетной операции"
        },
        options: {
          type: "object",
          description: "Опции для операции",
          properties: {
            language: {
              type: "string",
              description: "Язык для транскрипции"
            },
            model: {
              type: "string", 
              description: "Модель для использования"
            },
            threshold: {
              type: "number",
              description: "Порог для детекции сцен"
            },
            format: {
              type: "string",
              description: "Формат вывода"
            }
          }
        },
        priority: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Приоритет операции",
          default: "medium"
        },
        maxConcurrent: {
          type: "number",
          description: "Максимальное количество одновременных операций",
          default: 3
        }
      },
      required: ["clipIds", "operation"]
    }
  },

  // 2. Получение прогресса пакетной операции
  {
    name: "get_batch_progress",
    description: "Получает текущий прогресс выполнения пакетной операции",
    input_schema: {
      type: "object",
      properties: {
        jobId: {
          type: "string",
          description: "ID пакетной операции"
        }
      },
      required: ["jobId"]
    }
  },

  // 3. Отмена пакетной операции
  {
    name: "cancel_batch_operation", 
    description: "Отменяет выполняющуюся пакетную операцию",
    input_schema: {
      type: "object",
      properties: {
        jobId: {
          type: "string",
          description: "ID пакетной операции для отмены"
        }
      },
      required: ["jobId"]
    }
  },

  // 4. Получение статистики пакетных операций
  {
    name: "get_batch_processing_stats",
    description: "Получает общую статистику по всем пакетным операциям",
    input_schema: {
      type: "object",
      properties: {},
      required: []
    }
  },

  // 5. Получение истории пакетных операций
  {
    name: "get_batch_history",
    description: "Получает историю выполненных пакетных операций",
    input_schema: {
      type: "object",
      properties: {
        limit: {
          type: "number",
          description: "Максимальное количество записей для возврата",
          default: 50
        }
      },
      required: []
    }
  },

  // 6. Массовый анализ видео
  {
    name: "batch_analyze_videos",
    description: "Выполняет комплексный анализ нескольких видео одновременно",
    input_schema: {
      type: "object",
      properties: {
        clipIds: {
          type: "array",
          items: { type: "string" },
          description: "Список ID клипов для анализа"
        },
        analysisTypes: {
          type: "array",
          items: {
            type: "string",
            enum: ["quality", "scenes", "motion", "audio", "metadata"]
          },
          description: "Типы анализа для выполнения"
        },
        detailedReport: {
          type: "boolean",
          description: "Создать детальный отчет",
          default: true
        }
      },
      required: ["clipIds", "analysisTypes"]
    }
  },

  // 7. Массовая транскрипция
  {
    name: "batch_transcribe_videos",
    description: "Транскрибирует речь в нескольких видео с помощью Whisper",
    input_schema: {
      type: "object",
      properties: {
        clipIds: {
          type: "array",
          items: { type: "string" },
          description: "Список ID клипов для транскрипции"
        },
        language: {
          type: "string",
          description: "Язык аудио (auto для автоопределения)",
          default: "auto"
        },
        model: {
          type: "string",
          description: "Модель Whisper для использования",
          default: "whisper-1"
        },
        generateSubtitles: {
          type: "boolean",
          description: "Также генерировать файлы субтитров",
          default: false
        },
        subtitleFormat: {
          type: "string",
          enum: ["srt", "vtt", "ass"],
          description: "Формат субтитров",
          default: "srt"
        }
      },
      required: ["clipIds"]
    }
  },

  // 8. Массовая генерация субтитров
  {
    name: "batch_generate_subtitles",
    description: "Генерирует субтитры для нескольких видео одновременно",
    input_schema: {
      type: "object",
      properties: {
        clipIds: {
          type: "array",
          items: { type: "string" },
          description: "Список ID клипов для генерации субтитров"
        },
        language: {
          type: "string",
          description: "Язык для распознавания речи",
          default: "auto"
        },
        format: {
          type: "string",
          enum: ["srt", "vtt", "ass"],
          description: "Формат субтитров",
          default: "srt"
        },
        maxCharactersPerLine: {
          type: "number",
          description: "Максимальное количество символов в строке",
          default: 42
        },
        translateToLanguages: {
          type: "array", 
          items: { type: "string" },
          description: "Языки для перевода субтитров"
        }
      },
      required: ["clipIds"]
    }
  },

  // 9. Определение языка в нескольких видео
  {
    name: "batch_detect_languages",
    description: "Определяет язык аудиодорожки в нескольких видео",
    input_schema: {
      type: "object",
      properties: {
        clipIds: {
          type: "array",
          items: { type: "string" },
          description: "Список ID клипов для анализа языка"
        },
        sampleDuration: {
          type: "number",
          description: "Длительность образца для анализа в секундах",
          default: 30
        }
      },
      required: ["clipIds"]
    }
  },

  // 10. Массовая детекция сцен
  {
    name: "batch_detect_scenes",
    description: "Выполняет детекцию сцен в нескольких видео",
    input_schema: {
      type: "object",
      properties: {
        clipIds: {
          type: "array",
          items: { type: "string" },
          description: "Список ID клипов для детекции сцен"
        },
        threshold: {
          type: "number",
          description: "Порог чувствительности для детекции сцен",
          default: 0.3
        },
        minSceneLength: {
          type: "number",
          description: "Минимальная длительность сцены в секундах",
          default: 1.0
        },
        exportTimestamps: {
          type: "boolean",
          description: "Экспортировать временные метки сцен",
          default: true
        }
      },
      required: ["clipIds"]
    }
  },

  // 11. Создание отчета по пакетной обработке
  {
    name: "create_batch_report",
    description: "Создает детальный отчет по результатам пакетной обработки",
    input_schema: {
      type: "object",
      properties: {
        jobId: {
          type: "string",
          description: "ID завершенной пакетной операции"
        },
        format: {
          type: "string",
          enum: ["json", "csv", "html", "markdown"],
          description: "Формат отчета",
          default: "json"
        },
        includeDetails: {
          type: "boolean",
          description: "Включить детальную информацию по каждому клипу",
          default: true
        },
        includeErrors: {
          type: "boolean", 
          description: "Включить информацию об ошибках",
          default: true
        }
      },
      required: ["jobId"]
    }
  },

  // 12. Очистка истории пакетных операций
  {
    name: "clear_batch_history",
    description: "Очищает историю выполненных пакетных операций",
    input_schema: {
      type: "object",
      properties: {
        olderThan: {
          type: "string",
          description: "Удалить записи старше указанной даты (ISO format)"
        },
        keepSuccessful: {
          type: "boolean",
          description: "Сохранить успешные операции",
          default: false
        }
      },
      required: []
    }
  }
]

/**
 * Функция для обработки выполнения инструментов пакетной обработки
 */
export async function executeBatchProcessingTool(toolName: string, input: Record<string, any>): Promise<any> {
  const batchService = BatchProcessingService.getInstance()

  switch (toolName) {
    case "start_batch_operation":
      return await startBatchOperation(input)

    case "get_batch_progress":
      return getBatchProgress(input.jobId)

    case "cancel_batch_operation":
      return await cancelBatchOperation(input.jobId)

    case "get_batch_processing_stats":
      return getBatchProcessingStats()

    case "get_batch_history":
      return getBatchHistory(input.limit)

    case "batch_analyze_videos":
      return await batchAnalyzeVideos(input)

    case "batch_transcribe_videos":
      return await batchTranscribeVideos(input)

    case "batch_generate_subtitles":
      return await batchGenerateSubtitles(input)

    case "batch_detect_languages":
      return await batchDetectLanguages(input)

    case "batch_detect_scenes":
      return await batchDetectScenes(input)

    case "create_batch_report":
      return await createBatchReport(input)

    case "clear_batch_history":
      return clearBatchHistory(input)

    default:
      throw new Error(`Неизвестный инструмент пакетной обработки: ${toolName}`)
  }
}

// Реализация функций инструментов

async function startBatchOperation(params: any): Promise<{ jobId: string; message: string }> {
  const batchService = BatchProcessingService.getInstance()
  
  const operationParams: BatchOperationParams = {
    clipIds: params.clipIds,
    operation: params.operation as BatchOperationType,
    options: params.options || {},
    priority: params.priority || "medium",
    maxConcurrent: params.maxConcurrent || 3
  }

  const jobId = await batchService.startBatchOperation(operationParams)
  
  return {
    jobId,
    message: `Пакетная операция ${params.operation} запущена для ${params.clipIds.length} клипов`
  }
}

function getBatchProgress(jobId: string): BatchProgress | { error: string } {
  const batchService = BatchProcessingService.getInstance()
  const progress = batchService.getBatchProgress(jobId)
  
  if (!progress) {
    return { error: `Пакетная операция с ID ${jobId} не найдена` }
  }
  
  return progress
}

async function cancelBatchOperation(jobId: string): Promise<{ success: boolean; message: string }> {
  const batchService = BatchProcessingService.getInstance()
  const cancelled = await batchService.cancelBatchOperation(jobId)
  
  return {
    success: cancelled,
    message: cancelled 
      ? `Пакетная операция ${jobId} отменена`
      : `Не удалось отменить операцию ${jobId} (возможно, уже завершена)`
  }
}

function getBatchProcessingStats(): any {
  const batchService = BatchProcessingService.getInstance()
  return batchService.getBatchProcessingStats()
}

function getBatchHistory(limit?: number): BatchOperationResult[] {
  const batchService = BatchProcessingService.getInstance()
  return batchService.getBatchHistory(limit)
}

async function batchAnalyzeVideos(params: any): Promise<{ jobId: string; message: string }> {
  const batchService = BatchProcessingService.getInstance()
  
  const jobId = await batchService.startBatchOperation({
    clipIds: params.clipIds,
    operation: "comprehensive_analysis",
    options: {
      analysisTypes: params.analysisTypes,
      detailedReport: params.detailedReport
    }
  })

  return {
    jobId,
    message: `Запущен комплексный анализ ${params.clipIds.length} видео`
  }
}

async function batchTranscribeVideos(params: any): Promise<{ jobId: string; message: string }> {
  const batchService = BatchProcessingService.getInstance()
  
  const operation = params.generateSubtitles ? "subtitle_generation" : "whisper_transcription"
  
  const jobId = await batchService.startBatchOperation({
    clipIds: params.clipIds,
    operation,
    options: {
      language: params.language,
      model: params.model,
      format: params.subtitleFormat
    }
  })

  return {
    jobId,
    message: `Запущена транскрипция ${params.clipIds.length} видео`
  }
}

async function batchGenerateSubtitles(params: any): Promise<{ jobId: string; message: string }> {
  const batchService = BatchProcessingService.getInstance()
  
  const jobId = await batchService.startBatchOperation({
    clipIds: params.clipIds,
    operation: "subtitle_generation",
    options: {
      language: params.language,
      format: params.format,
      maxCharactersPerLine: params.maxCharactersPerLine,
      translateToLanguages: params.translateToLanguages
    }
  })

  return {
    jobId,
    message: `Запущена генерация субтитров для ${params.clipIds.length} видео`
  }
}

async function batchDetectLanguages(params: any): Promise<{ jobId: string; message: string }> {
  const batchService = BatchProcessingService.getInstance()
  
  const jobId = await batchService.startBatchOperation({
    clipIds: params.clipIds,
    operation: "language_detection",
    options: {
      sampleDuration: params.sampleDuration
    }
  })

  return {
    jobId,
    message: `Запущено определение языка для ${params.clipIds.length} видео`
  }
}

async function batchDetectScenes(params: any): Promise<{ jobId: string; message: string }> {
  const batchService = BatchProcessingService.getInstance()
  
  const jobId = await batchService.startBatchOperation({
    clipIds: params.clipIds,
    operation: "scene_detection",
    options: {
      threshold: params.threshold,
      minSceneLength: params.minSceneLength,
      exportTimestamps: params.exportTimestamps
    }
  })

  return {
    jobId,
    message: `Запущена детекция сцен для ${params.clipIds.length} видео`
  }
}

async function createBatchReport(params: any): Promise<any> {
  const batchService = BatchProcessingService.getInstance()
  const history = batchService.getBatchHistory()
  
  const job = history.find(j => j.jobId === params.jobId)
  if (!job) {
    return { error: `Пакетная операция с ID ${params.jobId} не найдена в истории` }
  }

  const report = {
    jobId: params.jobId,
    operation: job.summary.operation,
    summary: {
      totalClips: job.totalProcessed,
      successful: job.successCount,
      failed: job.failureCount,
      executionTime: job.executionTime,
      startTime: job.summary.startTime,
      endTime: job.summary.endTime
    },
    results: params.includeDetails ? job.results : undefined,
    errors: params.includeErrors ? job.errors : undefined,
    format: params.format
  }

  return report
}

function clearBatchHistory(params: any): { cleared: number; message: string } {
  const batchService = BatchProcessingService.getInstance()
  const historyBefore = batchService.getBatchHistory().length
  
  // TODO: Добавить фильтрацию по дате и статусу
  batchService.clearBatchHistory()
  
  return {
    cleared: historyBefore,
    message: `Очищено ${historyBefore} записей из истории пакетных операций`
  }
}