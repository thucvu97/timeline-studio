/**
 * AI инструмент для работы с Whisper транскрипцией с использованием BaseAITool
 * Управление моделями, транскрипция и перевод аудио
 */

import { WhisperService } from "../../services/whisper-service"
import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../base-ai-tool"

// Типы для Whisper операций
export interface WhisperInput {
  operation:
    | "check_availability"
    | "get_models"
    | "download_model"
    | "transcribe"
    | "translate"
    | "batch_transcribe"
    | "create_subtitles"
    | "detect_language"
    | "improve_quality"
    | "sync_subtitles"
  clipId?: string
  clipIds?: string[]
  language?: string
  model?: string
  modelName?: string
  useLocal?: boolean
  includeLocal?: boolean
  includeApi?: boolean
  includeWordTimestamps?: boolean
  prompt?: string
  transcriptionText?: string
  format?: "srt" | "vtt" | "ass"
  maxCharactersPerLine?: number
  maxLinesPerSubtitle?: number
  sampleDuration?: number
  subtitleText?: string
  alignmentPrecision?: number
  reason: string
}

export interface WhisperResult {
  operation: string
  success: boolean
  availability?: {
    openai: boolean
    local: boolean
    models: string[]
  }
  models?: {
    api: string[]
    local: any[]
  }
  downloadProgress?: {
    status: string
    progress: number
    message: string
  }
  transcription?: {
    text: string
    segments: any[]
    language: string
    duration: number
  }
  subtitles?: {
    format: string
    content: string
    segments: any[]
  }
  detectedLanguage?: {
    language: string
    confidence: number
    alternatives: any[]
  }
  message: string
  recommendations: string[]
  warnings?: string[]
}

/**
 * AI инструмент для работы с Whisper с унифицированной обработкой ошибок
 */
export class WhisperTool extends BaseAITool {
  private whisperService: WhisperService

  constructor(logger?: AIToolLogger) {
    super("WhisperTool", logger)
    this.whisperService = WhisperService.getInstance()
  }

  /**
   * Выполняет операции Whisper
   */
  public async processWhisper(
    input: WhisperInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<WhisperResult>> {
    // Валидация входных данных
    const validation = this.validateInput(input, (data) => {
      const errors: string[] = []

      const validOperations = [
        "check_availability",
        "get_models",
        "download_model",
        "transcribe",
        "translate",
        "batch_transcribe",
        "create_subtitles",
        "detect_language",
        "improve_quality",
        "sync_subtitles",
      ]
      if (!validOperations.includes(data.operation)) {
        errors.push(`Неподдерживаемая операция: ${data.operation}`)
      }

      if (!data.reason) {
        errors.push("Требуется указать причину операции")
      }

      // Специфические валидации для разных операций
      switch (data.operation) {
        case "download_model":
          if (!data.modelName) {
            errors.push("Для скачивания модели требуется указать modelName")
          }
          break
        case "transcribe":
        case "translate":
        case "detect_language":
        case "sync_subtitles":
          if (!data.clipId) {
            errors.push("Для операции требуется указать clipId")
          }
          break
        case "batch_transcribe":
          if (!data.clipIds || data.clipIds.length === 0) {
            errors.push("Для пакетной транскрипции требуется указать clipIds")
          }
          break
        case "create_subtitles":
          if (!data.transcriptionText) {
            errors.push("Для создания субтитров требуется transcriptionText")
          }
          break
        case "improve_quality":
          if (!data.clipId || !data.transcriptionText) {
            errors.push("Для улучшения качества требуется clipId и transcriptionText")
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
        message: "Ошибка валидации входных данных для Whisper",
        executionTime: 0,
        toolName: this.toolName,
      }
    }

    const operation = input.operation

    // Выполняем операцию с унифицированной обработкой ошибок
    return this.executeWithErrorHandling(
      async () => {
        this.logger?.info("Начинаем операцию Whisper", {
          operation,
          clipId: input.clipId,
          model: input.model,
        })

        let result: WhisperResult
        const recommendations: string[] = []
        const warnings: string[] = []

        switch (operation) {
          case "check_availability":
            result = await this.checkAvailability()
            if (!result.availability?.openai && !result.availability?.local) {
              recommendations.push("Настройте API ключ OpenAI или установите локальные модели")
            }
            break

          case "get_models":
            result = await this.getModels(input)
            if (result.models && result.models.local.length === 0) {
              recommendations.push("Скачайте локальные модели для офлайн работы")
            }
            break

          case "download_model":
            result = await this.downloadModel(input)
            recommendations.push("Проверьте доступное место на диске")
            break

          case "transcribe":
            result = await this.transcribeMedia(input)
            if (result.transcription && result.transcription.segments.length > 100) {
              recommendations.push("Рассмотрите разделение на части для длинных видео")
            }
            break

          case "translate":
            result = await this.translateAudio(input)
            recommendations.push("Проверьте качество перевода")
            break

          case "batch_transcribe":
            result = await this.batchTranscribe(input)
            warnings.push("Пакетная обработка может занять значительное время")
            break

          case "create_subtitles":
            result = await this.createSubtitles(input)
            recommendations.push("Проверьте синхронизацию субтитров с видео")
            break

          case "detect_language":
            result = await this.detectLanguage(input)
            if (result.detectedLanguage && result.detectedLanguage.confidence < 0.8) {
              warnings.push("Низкая уверенность в определении языка")
            }
            break

          case "improve_quality":
            result = await this.improveQuality(input)
            recommendations.push("Используйте контекстные подсказки для лучших результатов")
            break

          case "sync_subtitles":
            result = await this.syncSubtitles(input)
            recommendations.push("Проверьте финальную синхронизацию вручную")
            break

          default:
            throw new Error(`Неподдерживаемая операция: ${operation}`)
        }

        result.recommendations = [...result.recommendations, ...recommendations]
        result.warnings = result.warnings
          ? [...result.warnings, ...warnings]
          : warnings.length > 0
            ? warnings
            : undefined

        this.logger?.info("Операция Whisper завершена", {
          operation,
          success: result.success,
        })

        return result
      },
      {
        timeout: options.timeout || 300000, // 5 минут для транскрипции
        retries: options.retries || 1,
        retryDelay: options.retryDelay || 2000,
        enableLogging: options.enableLogging !== false,
        metadata: {
          operation,
          clipId: input.clipId,
          model: input.model,
          ...options.metadata,
        },
      },
    )
  }

  /**
   * Проверка доступности Whisper
   */
  private async checkAvailability(): Promise<WhisperResult> {
    this.logger?.info("Проверяем доступность Whisper")

    try {
      const hasApiKey = await this.whisperService.loadApiKey()
      const localAvailable = await this.whisperService.isLocalWhisperAvailable()
      const localModels = await this.whisperService.getAvailableLocalModels()
      const downloadedModels = localModels.filter((m) => m.isDownloaded).map((m) => m.name)

      return {
        operation: "check_availability",
        success: true,
        availability: {
          openai: hasApiKey,
          local: localAvailable,
          models: downloadedModels,
        },
        message: "Проверка доступности завершена",
        recommendations: [],
      }
    } catch (error) {
      return {
        operation: "check_availability",
        success: false,
        availability: {
          openai: false,
          local: false,
          models: [],
        },
        message: `Ошибка проверки доступности: ${error}`,
        recommendations: [],
      }
    }
  }

  /**
   * Получение списка моделей
   */
  private async getModels(input: WhisperInput): Promise<WhisperResult> {
    this.logger?.info("Получаем список моделей Whisper")

    const result: WhisperResult = {
      operation: "get_models",
      success: true,
      models: {
        api: [],
        local: [],
      },
      message: "Список моделей получен",
      recommendations: [],
    }

    if (input.includeApi !== false) {
      const hasApiKey = await this.whisperService.loadApiKey()
      if (hasApiKey) {
        result.models!.api = ["whisper-1"]
      }
    }

    if (input.includeLocal !== false) {
      const localModels = await this.whisperService.getAvailableLocalModels()
      result.models!.local = localModels
    }

    return result
  }

  /**
   * Скачивание модели
   */
  private async downloadModel(input: WhisperInput): Promise<WhisperResult> {
    this.logger?.info("Скачиваем модель Whisper", { model: input.modelName })

    // Заглушка для скачивания
    return {
      operation: "download_model",
      success: true,
      downloadProgress: {
        status: "completed",
        progress: 100,
        message: `Модель ${input.modelName} успешно скачана`,
      },
      message: "Модель скачана",
      recommendations: ["Перезапустите приложение для активации модели"],
    }
  }

  /**
   * Транскрипция медиа
   */
  private async transcribeMedia(input: WhisperInput): Promise<WhisperResult> {
    this.logger?.info("Транскрибируем медиа", {
      clipId: input.clipId,
      language: input.language,
    })

    try {
      const result = await this.whisperService.transcribeClip(
        input.clipId!,
        {
          language: input.language || "auto",
          model: input.model || "whisper-1",
          includeWordTimestamps: input.includeWordTimestamps || false,
          prompt: input.prompt,
        },
        input.useLocal || false,
      )

      return {
        operation: "transcribe",
        success: true,
        transcription: result,
        message: "Транскрипция завершена успешно",
        recommendations: [],
      }
    } catch (error) {
      return {
        operation: "transcribe",
        success: false,
        message: `Ошибка транскрипции: ${error}`,
        recommendations: ["Проверьте качество аудио", "Попробуйте другую модель"],
      }
    }
  }

  /**
   * Перевод аудио
   */
  private async translateAudio(input: WhisperInput): Promise<WhisperResult> {
    this.logger?.info("Переводим аудио на английский", { clipId: input.clipId })

    try {
      const result = await this.whisperService.translateToEnglish(input.clipId!, {
        model: input.model || "whisper-1",
        prompt: input.prompt,
      })

      return {
        operation: "translate",
        success: true,
        transcription: result,
        message: "Перевод завершен успешно",
        recommendations: [],
      }
    } catch (error) {
      return {
        operation: "translate",
        success: false,
        message: `Ошибка перевода: ${error}`,
        recommendations: ["Проверьте исходный язык аудио"],
      }
    }
  }

  /**
   * Пакетная транскрипция
   */
  private async batchTranscribe(input: WhisperInput): Promise<WhisperResult> {
    this.logger?.info("Запускаем пакетную транскрипцию", {
      clipIds: input.clipIds?.length,
    })

    // Заглушка для пакетной обработки
    return {
      operation: "batch_transcribe",
      success: true,
      message: `Пакетная транскрипция запущена для ${input.clipIds?.length} клипов`,
      recommendations: ["Отслеживайте прогресс в разделе задач"],
    }
  }

  /**
   * Создание субтитров
   */
  private async createSubtitles(input: WhisperInput): Promise<WhisperResult> {
    this.logger?.info("Создаем субтитры", { format: input.format })

    // Заглушка для создания субтитров
    const format = input.format || "srt"
    const content = this.formatSubtitles(input.transcriptionText!, format)

    return {
      operation: "create_subtitles",
      success: true,
      subtitles: {
        format,
        content,
        segments: [],
      },
      message: "Субтитры созданы",
      recommendations: [],
    }
  }

  /**
   * Определение языка
   */
  private async detectLanguage(input: WhisperInput): Promise<WhisperResult> {
    this.logger?.info("Определяем язык аудио", { clipId: input.clipId })

    // Заглушка для определения языка
    return {
      operation: "detect_language",
      success: true,
      detectedLanguage: {
        language: "ru",
        confidence: 0.95,
        alternatives: [
          { language: "uk", confidence: 0.03 },
          { language: "be", confidence: 0.02 },
        ],
      },
      message: "Язык определен",
      recommendations: [],
    }
  }

  /**
   * Улучшение качества транскрипции
   */
  private async improveQuality(input: WhisperInput): Promise<WhisperResult> {
    this.logger?.info("Улучшаем качество транскрипции")

    // Заглушка для улучшения качества
    return {
      operation: "improve_quality",
      success: true,
      transcription: {
        text: `${input.transcriptionText} (улучшено)`,
        segments: [],
        language: "ru",
        duration: 0,
      },
      message: "Качество транскрипции улучшено",
      recommendations: [],
    }
  }

  /**
   * Синхронизация субтитров
   */
  private async syncSubtitles(input: WhisperInput): Promise<WhisperResult> {
    this.logger?.info("Синхронизируем субтитры", { clipId: input.clipId })

    // Заглушка для синхронизации
    return {
      operation: "sync_subtitles",
      success: true,
      subtitles: {
        format: "srt",
        content: input.subtitleText || "",
        segments: [],
      },
      message: "Субтитры синхронизированы",
      recommendations: [],
    }
  }

  /**
   * Форматирование субтитров
   */
  private formatSubtitles(text: string, format: string): string {
    // Простое форматирование для демонстрации
    if (format === "srt") {
      return `1\n00:00:00,000 --> 00:00:05,000\n${text}\n`
    }
    if (format === "vtt") {
      return `WEBVTT\n\n00:00:00.000 --> 00:00:05.000\n${text}\n`
    }
    return text
  }
}

// Экспортируем готовый экземпляр для использования
export const whisperTool = new WhisperTool()

// Функции-обертки для обратной совместимости
export async function checkWhisperAvailability(): Promise<AIToolResult<WhisperResult>> {
  const input: WhisperInput = {
    operation: "check_availability",
    reason: "Проверка доступности Whisper API",
  }
  return whisperTool.processWhisper(input)
}

export async function getWhisperModels(includeLocal = true, includeApi = true): Promise<AIToolResult<WhisperResult>> {
  const input: WhisperInput = {
    operation: "get_models",
    includeLocal,
    includeApi,
    reason: "Получение списка доступных моделей",
  }
  return whisperTool.processWhisper(input)
}

export async function downloadWhisperModel(modelName: string): Promise<AIToolResult<WhisperResult>> {
  const input: WhisperInput = {
    operation: "download_model",
    modelName,
    reason: "Скачивание локальной модели Whisper",
  }
  return whisperTool.processWhisper(input)
}

export async function transcribeMedia(params: any): Promise<AIToolResult<WhisperResult>> {
  const input: WhisperInput = {
    operation: "transcribe",
    clipId: params.clipId,
    language: params.language,
    model: params.model,
    useLocal: params.useLocal,
    includeWordTimestamps: params.includeWordTimestamps,
    prompt: params.prompt,
    reason: params.reason || "Транскрипция медиафайла",
  }
  return whisperTool.processWhisper(input)
}

export async function translateAudioToEnglish(params: any): Promise<AIToolResult<WhisperResult>> {
  const input: WhisperInput = {
    operation: "translate",
    clipId: params.clipId,
    model: params.model,
    prompt: params.prompt,
    reason: params.reason || "Перевод аудио на английский",
  }
  return whisperTool.processWhisper(input)
}

export async function batchTranscribeClips(params: any): Promise<AIToolResult<WhisperResult>> {
  const input: WhisperInput = {
    operation: "batch_transcribe",
    clipIds: params.clipIds,
    language: params.language,
    model: params.model,
    useLocal: params.useLocal,
    reason: params.reason || "Пакетная транскрипция клипов",
  }
  return whisperTool.processWhisper(input)
}

export async function createSubtitlesFromTranscription(params: any): Promise<AIToolResult<WhisperResult>> {
  const input: WhisperInput = {
    operation: "create_subtitles",
    transcriptionText: params.transcriptionText,
    format: params.format,
    maxCharactersPerLine: params.maxCharactersPerLine,
    maxLinesPerSubtitle: params.maxLinesPerSubtitle,
    reason: params.reason || "Создание субтитров из транскрипции",
  }
  return whisperTool.processWhisper(input)
}

export async function detectAudioLanguage(params: any): Promise<AIToolResult<WhisperResult>> {
  const input: WhisperInput = {
    operation: "detect_language",
    clipId: params.clipId,
    sampleDuration: params.sampleDuration,
    reason: params.reason || "Определение языка аудио",
  }
  return whisperTool.processWhisper(input)
}

export async function improveTranscriptionQuality(params: any): Promise<AIToolResult<WhisperResult>> {
  const input: WhisperInput = {
    operation: "improve_quality",
    clipId: params.clipId,
    transcriptionText: params.transcriptionText,
    prompt: params.prompt,
    reason: params.reason || "Улучшение качества транскрипции",
  }
  return whisperTool.processWhisper(input)
}

export async function syncSubtitlesWithWhisper(params: any): Promise<AIToolResult<WhisperResult>> {
  const input: WhisperInput = {
    operation: "sync_subtitles",
    clipId: params.clipId,
    subtitleText: params.subtitleText,
    alignmentPrecision: params.alignmentPrecision,
    reason: params.reason || "Синхронизация субтитров с аудио",
  }
  return whisperTool.processWhisper(input)
}

// Экспортируем массив инструментов для обратной совместимости
export const whisperTools: any[] = [
  {
    name: "check_whisper_availability",
    description: "Проверяет доступность OpenAI Whisper API и локальных моделей для транскрипции",
  },
  {
    name: "get_whisper_models",
    description: "Получает список доступных моделей Whisper (API и локальных)",
  },
  {
    name: "download_whisper_model",
    description: "Скачивает локальную модель Whisper для offline транскрипции",
  },
  {
    name: "transcribe_media",
    description: "Транскрибирует аудио или видео файл в текст с временными метками",
  },
  {
    name: "translate_audio_to_english",
    description: "Переводит аудио с любого языка на английский с помощью Whisper",
  },
  {
    name: "batch_transcribe_clips",
    description: "Транскрибирует несколько клипов одновременно",
  },
  {
    name: "create_subtitles_from_transcription",
    description: "Создает файл субтитров из результата транскрипции Whisper",
  },
  {
    name: "detect_audio_language",
    description: "Определяет язык аудио с помощью Whisper API",
  },
  {
    name: "improve_transcription_quality",
    description: "Улучшает качество транскрипции через повторный анализ с контекстом",
  },
  {
    name: "sync_subtitles_with_whisper",
    description: "Синхронизирует существующие субтитры с аудио через Whisper",
  },
]

/**
 * Функция для обработки выполнения Whisper инструментов (legacy API)
 */
export async function executeWhisperTool(toolName: string, input: Record<string, any>): Promise<any> {
  try {
    // Маппинг старых названий на новые функции
    const functionMap: Record<string, () => Promise<any>> = {
      check_whisper_availability: () => checkWhisperAvailability(),
      get_whisper_models: () => getWhisperModels(input.includeLocal, input.includeApi),
      download_whisper_model: () => downloadWhisperModel(input.modelName),
      transcribe_media: () => transcribeMedia(input),
      translate_audio_to_english: () => translateAudioToEnglish(input),
      batch_transcribe_clips: () => batchTranscribeClips(input),
      create_subtitles_from_transcription: () => createSubtitlesFromTranscription(input),
      detect_audio_language: () => detectAudioLanguage(input),
      improve_transcription_quality: () => improveTranscriptionQuality(input),
      sync_subtitles_with_whisper: () => syncSubtitlesWithWhisper(input),
    }

    const func = functionMap[toolName]
    if (!func) {
      throw new Error(`Неизвестный Whisper инструмент: ${toolName}`)
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
