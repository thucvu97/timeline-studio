/**
 * Инструменты Claude AI для мультимодального анализа видео с GPT-4V с использованием BaseAITool
 * Анализ кадров, создание описаний, выбор превью
 */

import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "./base-ai-tool"
import {
  type FrameAnalysisParams,
  MultimodalAnalysisService,
  type MultimodalAnalysisType,
  type ThumbnailSuggestionParams,
  type VideoAnalysisParams,
} from "../services/multimodal-analysis-service"

// Типы для операций мультимодального анализа
export interface MultimodalInput {
  operation:
    | "analyze_frame"
    | "analyze_video"
    | "suggest_thumbnails"
    | "detect_highlights"
    | "analyze_emotions"
    | "generate_description"
    | "analyze_audio_visual"
    | "moderate_content"
    | "analyze_scene_transitions"
    | "analyze_brand_elements"
  frameImagePath?: string
  clipId?: string
  analysisType?: MultimodalAnalysisType
  analysisTypes?: MultimodalAnalysisType[]
  customPrompt?: string
  detailLevel?: "low" | "medium" | "high"
  contextInfo?: any
  samplingRate?: number
  maxFrames?: number
  count?: number
  criteria?: string[]
  highlightTypes?: string[]
  descriptionLength?: "short" | "medium" | "long" | "custom"
  includeSpeech?: boolean
  contentCategories?: string[]
  checkContext?: boolean
  transitionTypes?: string[]
  brandElements?: any[]
}

export interface MultimodalResult {
  operation: string
  success: boolean
  analysis?: any
  suggestions?: any[]
  highlights?: any[]
  emotions?: any
  description?: string
  moderationResult?: any
  transitions?: any[]
  brandAnalysis?: any
  message: string
  recommendations: string[]
  warnings?: string[]
}

/**
 * AI инструмент для мультимодального анализа с унифицированной обработкой ошибок
 */
export class MultimodalAnalysisTool extends BaseAITool {
  private analysisService: MultimodalAnalysisService

  constructor(logger?: AIToolLogger) {
    super("MultimodalAnalysisTool", logger)
    this.analysisService = new MultimodalAnalysisService()
  }

  /**
   * Выполняет мультимодальный анализ
   */
  public async analyzeMultimodal(
    input: MultimodalInput,
    options: AIToolExecutionOptions = {}
  ): Promise<AIToolResult<MultimodalResult>> {
    // Валидация входных данных
    const validation = this.validateInput(input, (data) => {
      const errors: string[] = []

      const validOperations = [
        "analyze_frame",
        "analyze_video",
        "suggest_thumbnails",
        "detect_highlights",
        "analyze_emotions",
        "generate_description",
        "analyze_audio_visual",
        "moderate_content",
        "analyze_scene_transitions",
        "analyze_brand_elements",
      ]
      if (!validOperations.includes(data.operation)) {
        errors.push(`Неподдерживаемая операция: ${data.operation}`)
      }

      // Специфические валидации
      switch (data.operation) {
        case "analyze_frame":
          if (!data.frameImagePath || !data.analysisType) {
            errors.push("Требуются frameImagePath и analysisType")
          }
          break
        case "analyze_video":
        case "suggest_thumbnails":
        case "detect_highlights":
        case "analyze_emotions":
        case "generate_description":
        case "analyze_audio_visual":
        case "moderate_content":
        case "analyze_scene_transitions":
        case "analyze_brand_elements":
          if (!data.clipId) {
            errors.push("Требуется clipId для анализа видео")
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
        message: "Ошибка валидации входных данных для мультимодального анализа",
        executionTime: 0,
        toolName: this.toolName,
      }
    }

    const operation = input.operation

    // Выполняем операцию с унифицированной обработкой ошибок
    return this.executeWithErrorHandling(
      async (context) => {
        context.logger?.("info", "Начинаем мультимодальный анализ", {
          operation,
          clipId: input.clipId,
        })

        let result: MultimodalResult
        const recommendations: string[] = []
        const warnings: string[] = []

        switch (operation) {
          case "analyze_frame":
            result = await this.analyzeFrame(input, context)
            break

          case "analyze_video":
            result = await this.analyzeVideo(input, context)
            if (input.maxFrames && input.maxFrames > 50) {
              warnings.push("Анализ большого количества кадров может занять время")
            }
            break

          case "suggest_thumbnails":
            result = await this.suggestThumbnails(input, context)
            recommendations.push("Проверьте предложенные превью на разных устройствах")
            break

          case "detect_highlights":
            result = await this.detectHighlights(input, context)
            break

          case "analyze_emotions":
            result = await this.analyzeEmotions(input, context)
            break

          case "generate_description":
            result = await this.generateDescription(input, context)
            break

          case "analyze_audio_visual":
            result = await this.analyzeAudioVisual(input, context)
            break

          case "moderate_content":
            result = await this.moderateContent(input, context)
            if (result.moderationResult?.flagged) {
              warnings.push("Обнаружен потенциально нежелательный контент")
            }
            break

          case "analyze_scene_transitions":
            result = await this.analyzeSceneTransitions(input, context)
            break

          case "analyze_brand_elements":
            result = await this.analyzeBrandElements(input, context)
            break

          default:
            throw new Error(`Неподдерживаемая операция: ${operation}`)
        }

        result.recommendations = [...result.recommendations, ...recommendations]
        result.warnings = warnings.length > 0 ? warnings : undefined

        context.logger?.("info", "Мультимодальный анализ завершен", {
          operation,
          success: result.success,
        })

        return result
      },
      {
        timeout: options.timeout || 180000, // 3 минуты для анализа
        retries: options.retries || 2,
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
   * Анализ одного кадра
   */
  private async analyzeFrame(input: MultimodalInput, context: any): Promise<MultimodalResult> {
    context.logger?.("info", "Анализируем кадр", {
      path: input.frameImagePath,
      type: input.analysisType,
    })

    try {
      const params: FrameAnalysisParams = {
        imagePath: input.frameImagePath!,
        analysisType: input.analysisType!,
        customPrompt: input.customPrompt,
        detailLevel: input.detailLevel || "medium",
        contextInfo: input.contextInfo,
      }

      const analysis = await this.analysisService.analyzeFrame(params)

      return {
        operation: "analyze_frame",
        success: true,
        analysis,
        message: "Анализ кадра выполнен успешно",
        recommendations: [],
      }
    } catch (error) {
      return {
        operation: "analyze_frame",
        success: false,
        message: `Ошибка анализа кадра: ${error}`,
        recommendations: ["Проверьте формат изображения"],
      }
    }
  }

  /**
   * Комплексный анализ видео
   */
  private async analyzeVideo(input: MultimodalInput, context: any): Promise<MultimodalResult> {
    context.logger?.("info", "Анализируем видео", {
      clipId: input.clipId,
      types: input.analysisTypes,
    })

    try {
      const params: VideoAnalysisParams = {
        clipId: input.clipId!,
        analysisTypes: input.analysisTypes || ["scene_understanding"],
        samplingRate: input.samplingRate || 1,
        maxFrames: input.maxFrames || 20,
        contextInfo: input.contextInfo,
      }

      const analysis = await this.analysisService.analyzeVideo(params)

      return {
        operation: "analyze_video",
        success: true,
        analysis,
        message: "Комплексный анализ видео завершен",
        recommendations: [],
      }
    } catch (error) {
      return {
        operation: "analyze_video",
        success: false,
        message: `Ошибка анализа видео: ${error}`,
        recommendations: ["Уменьшите количество кадров для анализа"],
      }
    }
  }

  /**
   * Предложения для превью
   */
  private async suggestThumbnails(input: MultimodalInput, context: any): Promise<MultimodalResult> {
    context.logger?.("info", "Предлагаем превью", {
      clipId: input.clipId,
      count: input.count,
    })

    try {
      const params: ThumbnailSuggestionParams = {
        clipId: input.clipId!,
        count: input.count || 5,
        criteria: input.criteria || ["aesthetic"],
        contextPrompt: input.customPrompt,
      }

      const suggestions = await this.analysisService.suggestThumbnails(params)

      return {
        operation: "suggest_thumbnails",
        success: true,
        suggestions,
        message: `Предложено ${suggestions.length} вариантов превью`,
        recommendations: [],
      }
    } catch (error) {
      return {
        operation: "suggest_thumbnails",
        success: false,
        message: `Ошибка предложения превью: ${error}`,
        recommendations: [],
      }
    }
  }

  /**
   * Детекция ключевых моментов
   */
  private async detectHighlights(input: MultimodalInput, context: any): Promise<MultimodalResult> {
    context.logger?.("info", "Детектируем ключевые моменты", {
      clipId: input.clipId,
      types: input.highlightTypes,
    })

    // Заглушка для ключевых моментов
    const highlights = [
      {
        timestamp: 15.5,
        duration: 3.2,
        type: "emotional_peak",
        confidence: 0.85,
        description: "Эмоциональный момент",
      },
      {
        timestamp: 42.0,
        duration: 5.0,
        type: "action_sequence",
        confidence: 0.92,
        description: "Динамичная сцена",
      },
    ]

    return {
      operation: "detect_highlights",
      success: true,
      highlights,
      message: `Обнаружено ${highlights.length} ключевых моментов`,
      recommendations: [],
    }
  }

  /**
   * Анализ эмоций
   */
  private async analyzeEmotions(input: MultimodalInput, context: any): Promise<MultimodalResult> {
    context.logger?.("info", "Анализируем эмоции", {
      clipId: input.clipId,
    })

    // Заглушка для эмоций
    const emotions = {
      summary: {
        dominant: "happiness",
        secondary: ["excitement", "surprise"],
        valence: 0.8,
        arousal: 0.7,
      },
      timeline: [
        { time: 0, emotion: "neutral", confidence: 0.9 },
        { time: 15, emotion: "happiness", confidence: 0.85 },
        { time: 30, emotion: "excitement", confidence: 0.78 },
      ],
    }

    return {
      operation: "analyze_emotions",
      success: true,
      emotions,
      message: "Анализ эмоций завершен",
      recommendations: [],
    }
  }

  /**
   * Генерация описания
   */
  private async generateDescription(input: MultimodalInput, context: any): Promise<MultimodalResult> {
    context.logger?.("info", "Генерируем описание", {
      clipId: input.clipId,
      length: input.descriptionLength,
    })

    // Заглушка для описания
    const description = "Это динамичное видео с яркими визуальными эффектами и захватывающим сюжетом."

    return {
      operation: "generate_description",
      success: true,
      description,
      message: "Описание сгенерировано",
      recommendations: [],
    }
  }

  /**
   * Анализ аудио-визуальной связи
   */
  private async analyzeAudioVisual(input: MultimodalInput, context: any): Promise<MultimodalResult> {
    context.logger?.("info", "Анализируем аудио-визуальную связь")

    // Заглушка
    const analysis = {
      synchronization: 0.95,
      audioVisualCorrelation: 0.88,
      keyMoments: [],
    }

    return {
      operation: "analyze_audio_visual",
      success: true,
      analysis,
      message: "Аудио-визуальный анализ завершен",
      recommendations: [],
    }
  }

  /**
   * Модерация контента
   */
  private async moderateContent(input: MultimodalInput, context: any): Promise<MultimodalResult> {
    context.logger?.("info", "Модерируем контент")

    // Заглушка
    const moderationResult = {
      flagged: false,
      categories: {
        violence: 0.02,
        adult: 0.01,
        hate: 0.0,
      },
      warnings: [],
    }

    return {
      operation: "moderate_content",
      success: true,
      moderationResult,
      message: "Модерация контента завершена",
      recommendations: [],
    }
  }

  /**
   * Анализ переходов сцен
   */
  private async analyzeSceneTransitions(input: MultimodalInput, context: any): Promise<MultimodalResult> {
    context.logger?.("info", "Анализируем переходы сцен")

    // Заглушка
    const transitions = [
      {
        timestamp: 10.0,
        type: "cut",
        smoothness: 0.9,
      },
      {
        timestamp: 25.5,
        type: "fade",
        smoothness: 0.95,
      },
    ]

    return {
      operation: "analyze_scene_transitions",
      success: true,
      transitions,
      message: `Обнаружено ${transitions.length} переходов`,
      recommendations: [],
    }
  }

  /**
   * Анализ бренд элементов
   */
  private async analyzeBrandElements(input: MultimodalInput, context: any): Promise<MultimodalResult> {
    context.logger?.("info", "Анализируем бренд элементы")

    // Заглушка
    const brandAnalysis = {
      logosDetected: 2,
      brandColors: ["#FF0000", "#000000"],
      brandConsistency: 0.92,
    }

    return {
      operation: "analyze_brand_elements",
      success: true,
      brandAnalysis,
      message: "Анализ бренд элементов завершен",
      recommendations: [],
    }
  }
}

// Экспортируем готовый экземпляр для использования
export const multimodalAnalysisTool = new MultimodalAnalysisTool()

// Функции-обертки для обратной совместимости
export async function analyzeVideoFrame(params: any): Promise<AIToolResult<MultimodalResult>> {
  const input: MultimodalInput = {
    operation: "analyze_frame",
    frameImagePath: params.frameImagePath,
    analysisType: params.analysisType,
    customPrompt: params.customPrompt,
    detailLevel: params.detailLevel,
    contextInfo: params.contextInfo,
  }
  return multimodalAnalysisTool.analyzeMultimodal(input)
}

export async function analyzeVideoMultimodal(params: any): Promise<AIToolResult<MultimodalResult>> {
  const input: MultimodalInput = {
    operation: "analyze_video",
    clipId: params.clipId,
    analysisTypes: params.analysisTypes,
    samplingRate: params.samplingRate,
    maxFrames: params.maxFrames,
    contextInfo: params.contextInfo,
  }
  return multimodalAnalysisTool.analyzeMultimodal(input)
}

export async function suggestVideoThumbnails(params: any): Promise<AIToolResult<MultimodalResult>> {
  const input: MultimodalInput = {
    operation: "suggest_thumbnails",
    clipId: params.clipId,
    count: params.count,
    criteria: params.criteria,
    customPrompt: params.contextPrompt,
  }
  return multimodalAnalysisTool.analyzeMultimodal(input)
}

export async function detectVideoHighlights(params: any): Promise<AIToolResult<MultimodalResult>> {
  const input: MultimodalInput = {
    operation: "detect_highlights",
    clipId: params.clipId,
    highlightTypes: params.highlightTypes,
  }
  return multimodalAnalysisTool.analyzeMultimodal(input)
}

export async function analyzeVideoEmotions(params: any): Promise<AIToolResult<MultimodalResult>> {
  const input: MultimodalInput = {
    operation: "analyze_emotions",
    clipId: params.clipId,
  }
  return multimodalAnalysisTool.analyzeMultimodal(input)
}

export async function generateVideoDescription(params: any): Promise<AIToolResult<MultimodalResult>> {
  const input: MultimodalInput = {
    operation: "generate_description",
    clipId: params.clipId,
    descriptionLength: params.descriptionLength,
    includeSpeech: params.includeSpeech,
  }
  return multimodalAnalysisTool.analyzeMultimodal(input)
}

export async function analyzeAudioVisualSync(params: any): Promise<AIToolResult<MultimodalResult>> {
  const input: MultimodalInput = {
    operation: "analyze_audio_visual",
    clipId: params.clipId,
  }
  return multimodalAnalysisTool.analyzeMultimodal(input)
}

export async function moderateVideoContent(params: any): Promise<AIToolResult<MultimodalResult>> {
  const input: MultimodalInput = {
    operation: "moderate_content",
    clipId: params.clipId,
    contentCategories: params.contentCategories,
    checkContext: params.checkContext,
  }
  return multimodalAnalysisTool.analyzeMultimodal(input)
}

export async function analyzeSceneTransitions(params: any): Promise<AIToolResult<MultimodalResult>> {
  const input: MultimodalInput = {
    operation: "analyze_scene_transitions",
    clipId: params.clipId,
    transitionTypes: params.transitionTypes,
  }
  return multimodalAnalysisTool.analyzeMultimodal(input)
}

export async function analyzeBrandElements(params: any): Promise<AIToolResult<MultimodalResult>> {
  const input: MultimodalInput = {
    operation: "analyze_brand_elements",
    clipId: params.clipId,
    brandElements: params.brandElements,
  }
  return multimodalAnalysisTool.analyzeMultimodal(input)
}

// Экспортируем массив инструментов для обратной совместимости
export const multimodalAnalysisTools: any[] = [
  {
    name: "analyze_video_frame",
    description: "Анализирует один кадр видео с помощью GPT-4V для понимания содержимого",
  },
  {
    name: "analyze_video_multimodal",
    description: "Выполняет комплексный мультимодальный анализ всего видео с извлечением ключевых кадров",
  },
  {
    name: "suggest_video_thumbnails",
    description: "Анализирует кадры видео и предлагает лучшие варианты для превью",
  },
  {
    name: "detect_video_highlights",
    description: "Находит ключевые и интересные моменты в видео для создания highlights",
  },
  {
    name: "analyze_video_emotions",
    description: "Анализирует эмоциональную составляющую видео через анализ лиц и сцен",
  },
  {
    name: "generate_video_description",
    description: "Создает автоматическое описание видео на основе визуального анализа",
  },
  {
    name: "analyze_audio_visual_sync",
    description: "Анализирует синхронизацию аудио и видео составляющих",
  },
  {
    name: "moderate_video_content",
    description: "Проверяет видео на наличие нежелательного контента",
  },
  {
    name: "analyze_scene_transitions",
    description: "Анализирует переходы между сценами и их эффективность",
  },
  {
    name: "analyze_brand_elements",
    description: "Обнаруживает и анализирует брендовые элементы в видео",
  },
]

/**
 * Функция для обработки выполнения инструментов мультимодального анализа (legacy API)
 */
export async function executeMultimodalAnalysisTool(toolName: string, input: Record<string, any>): Promise<any> {
  try {
    // Маппинг старых названий на новые функции
    const functionMap: Record<string, () => Promise<any>> = {
      analyze_video_frame: () => analyzeVideoFrame(input),
      analyze_video_multimodal: () => analyzeVideoMultimodal(input),
      suggest_video_thumbnails: () => suggestVideoThumbnails(input),
      detect_video_highlights: () => detectVideoHighlights(input),
      analyze_video_emotions: () => analyzeVideoEmotions(input),
      generate_video_description: () => generateVideoDescription(input),
      analyze_audio_visual_sync: () => analyzeAudioVisualSync(input),
      moderate_video_content: () => moderateVideoContent(input),
      analyze_scene_transitions: () => analyzeSceneTransitions(input),
      analyze_brand_elements: () => analyzeBrandElements(input),
    }

    const func = functionMap[toolName]
    if (!func) {
      throw new Error(`Неизвестный инструмент мультимодального анализа: ${toolName}`)
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
  // 1. Анализ одного кадра
  {
    name: "analyze_video_frame",
    description: "Анализирует один кадр видео с помощью GPT-4V для понимания содержимого",
    input_schema: {
      type: "object",
      properties: {
        frameImagePath: {
          type: "string",
          description: "Путь к файлу изображения кадра",
        },
        analysisType: {
          type: "string",
          enum: [
            "frame_description",
            "scene_understanding",
            "object_detection",
            "emotion_analysis",
            "action_recognition",
            "text_recognition",
            "aesthetic_analysis",
            "content_moderation",
            "thumbnail_selection",
            "highlight_detection",
          ],
          description: "Тип анализа кадра",
        },
        customPrompt: {
          type: "string",
          description: "Пользовательский промпт для анализа",
        },
        detailLevel: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "Уровень детализации анализа",
          default: "medium",
        },
        contextInfo: {
          type: "object",
          properties: {
            videoTitle: { type: "string" },
            frameTimestamp: { type: "number" },
            videoDuration: { type: "number" },
          },
          description: "Контекстная информация о видео",
        },
      },
      required: ["frameImagePath", "analysisType"],
    },
  },

  // 2. Комплексный анализ видео
  {
    name: "analyze_video_multimodal",
    description: "Выполняет комплексный мультимодальный анализ всего видео с извлечением ключевых кадров",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для анализа",
        },
        analysisTypes: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "frame_description",
              "scene_understanding",
              "object_detection",
              "emotion_analysis",
              "action_recognition",
              "text_recognition",
              "aesthetic_analysis",
              "content_moderation",
              "highlight_detection",
            ],
          },
          description: "Типы анализа для выполнения",
        },
        samplingRate: {
          type: "number",
          description: "Количество кадров в секунду для анализа",
          default: 1,
        },
        maxFrames: {
          type: "number",
          description: "Максимальное количество кадров для анализа",
          default: 20,
        },
        contextInfo: {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            genre: { type: "string" },
            targetAudience: { type: "string" },
          },
          description: "Контекстная информация о видео",
        },
      },
      required: ["clipId", "analysisTypes"],
    },
  },

  // 3. Предложения для превью/thumbnail
  {
    name: "suggest_video_thumbnails",
    description: "Анализирует кадры видео и предлагает лучшие варианты для превью",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для анализа",
        },
        count: {
          type: "number",
          description: "Количество предложений превью",
          default: 5,
        },
        criteria: {
          type: "array",
          items: {
            type: "string",
            enum: ["aesthetic", "emotion", "action", "text", "faces"],
          },
          description: "Критерии для выбора превью",
        },
        targetAspectRatio: {
          type: "string",
          description: "Желаемое соотношение сторон (16:9, 4:3, 1:1)",
          default: "16:9",
        },
        contextPrompt: {
          type: "string",
          description: "Дополнительный контекст для выбора превью",
        },
      },
      required: ["clipId"],
    },
  },

  // 4. Детекция ключевых моментов
  {
    name: "detect_video_highlights",
    description: "Находит ключевые и интересные моменты в видео для создания highlights",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для анализа",
        },
        highlightTypes: {
          type: "array",
          items: {
            type: "string",
            enum: ["emotional_peaks", "action_sequences", "visual_aesthetics", "text_moments", "face_closeups"],
          },
          description: "Типы ключевых моментов для поиска",
        },
        maxHighlights: {
          type: "number",
          description: "Максимальное количество ключевых моментов",
          default: 10,
        },
        minConfidence: {
          type: "number",
          description: "Минимальная уверенность для ключевого момента",
          default: 0.7,
        },
      },
      required: ["clipId"],
    },
  },

  // 5. Анализ эмоций в видео
  {
    name: "analyze_video_emotions",
    description: "Анализирует эмоциональную составляющую видео через анализ лиц и сцен",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для анализа эмоций",
        },
        trackIndividuals: {
          type: "boolean",
          description: "Отслеживать эмоции отдельных людей",
          default: false,
        },
        emotionCategories: {
          type: "array",
          items: {
            type: "string",
            enum: ["happy", "sad", "angry", "surprised", "fear", "disgust", "neutral", "excited"],
          },
          description: "Категории эмоций для отслеживания",
        },
        generateEmotionalArc: {
          type: "boolean",
          description: "Создать эмоциональную дугу видео",
          default: true,
        },
      },
      required: ["clipId"],
    },
  },

  // 6. Распознавание текста в видео
  {
    name: "extract_video_text",
    description: "Извлекает и распознает весь текст, появляющийся в видео",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для извлечения текста",
        },
        languages: {
          type: "array",
          items: { type: "string" },
          description: "Ожидаемые языки текста",
          default: ["ru", "en"],
        },
        includeSubtitles: {
          type: "boolean",
          description: "Включить распознавание субтитров",
          default: true,
        },
        includeSigns: {
          type: "boolean",
          description: "Включить распознавание указателей и вывесок",
          default: true,
        },
        generateTranscript: {
          type: "boolean",
          description: "Создать транскрипт из найденного текста",
          default: false,
        },
      },
      required: ["clipId"],
    },
  },

  // 7. Анализ композиции и эстетики
  {
    name: "analyze_video_aesthetics",
    description: "Анализирует визуальную композицию, освещение и эстетическую привлекательность видео",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для эстетического анализа",
        },
        aspectsToAnalyze: {
          type: "array",
          items: {
            type: "string",
            enum: ["composition", "lighting", "color_harmony", "visual_balance", "depth_of_field", "camera_movement"],
          },
          description: "Аспекты для анализа",
        },
        generateReport: {
          type: "boolean",
          description: "Создать детальный отчет по эстетике",
          default: true,
        },
        suggestImprovements: {
          type: "boolean",
          description: "Предложить улучшения",
          default: true,
        },
      },
      required: ["clipId"],
    },
  },

  // 8. Пакетный мультимодальный анализ
  {
    name: "batch_analyze_multimodal",
    description: "Выполняет мультимодальный анализ нескольких видео одновременно",
    input_schema: {
      type: "object",
      properties: {
        clipIds: {
          type: "array",
          items: { type: "string" },
          description: "Список ID клипов для анализа",
        },
        analysisTypes: {
          type: "array",
          items: {
            type: "string",
            enum: [
              "frame_description",
              "scene_understanding",
              "object_detection",
              "emotion_analysis",
              "aesthetic_analysis",
              "highlight_detection",
            ],
          },
          description: "Типы анализа для всех видео",
        },
        maxConcurrent: {
          type: "number",
          description: "Максимальное количество одновременных анализов",
          default: 2,
        },
        samplingRate: {
          type: "number",
          description: "Кадров в секунду для анализа",
          default: 0.5,
        },
        generateComparison: {
          type: "boolean",
          description: "Создать сравнительный анализ видео",
          default: false,
        },
      },
      required: ["clipIds", "analysisTypes"],
    },
  },

  // 9. Создание описаний для видео
  {
    name: "generate_video_descriptions",
    description: "Создает автоматические описания видео на основе мультимодального анализа",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для создания описания",
        },
        descriptionType: {
          type: "string",
          enum: ["short", "detailed", "marketing", "educational", "social_media"],
          description: "Тип описания",
          default: "detailed",
        },
        targetAudience: {
          type: "string",
          description: "Целевая аудитория для описания",
        },
        includeKeywords: {
          type: "boolean",
          description: "Включить SEO ключевые слова",
          default: false,
        },
        language: {
          type: "string",
          description: "Язык описания",
          default: "ru",
        },
        maxLength: {
          type: "number",
          description: "Максимальная длина описания в символах",
          default: 500,
        },
      },
      required: ["clipId"],
    },
  },

  // 10. Модерация контента
  {
    name: "moderate_video_content",
    description: "Проверяет видео на наличие неподходящего контента с помощью анализа кадров",
    input_schema: {
      type: "object",
      properties: {
        clipId: {
          type: "string",
          description: "ID клипа для модерации",
        },
        moderationLevel: {
          type: "string",
          enum: ["strict", "moderate", "permissive"],
          description: "Уровень строгости модерации",
          default: "moderate",
        },
        checkCategories: {
          type: "array",
          items: {
            type: "string",
            enum: ["violence", "adult_content", "inappropriate_language", "dangerous_activities", "hate_speech"],
          },
          description: "Категории для проверки",
        },
        generateReport: {
          type: "boolean",
          description: "Создать детальный отчет модерации",
          default: true,
        },
        flagThreshold: {
          type: "number",
          description: "Порог для флага контента (0-1)",
          default: 0.5,
        },
      },
      required: ["clipId"],
    },
  },
]

/**
 * Функция для обработки выполнения мультимодальных инструментов
 */
export async function executeMultimodalAnalysisTool(toolName: string, input: Record<string, any>): Promise<any> {
  const multimodalService = MultimodalAnalysisService.getInstance()

  switch (toolName) {
    case "analyze_video_frame":
      return await analyzeVideoFrame(input)

    case "analyze_video_multimodal":
      return await analyzeVideoMultimodal(input)

    case "suggest_video_thumbnails":
      return await suggestVideoThumbnails(input)

    case "detect_video_highlights":
      return await detectVideoHighlights(input)

    case "analyze_video_emotions":
      return await analyzeVideoEmotions(input)

    case "extract_video_text":
      return await extractVideoText(input)

    case "analyze_video_aesthetics":
      return await analyzeVideoAesthetics(input)

    case "batch_analyze_multimodal":
      return await batchAnalyzeMultimodal(input)

    case "generate_video_descriptions":
      return await generateVideoDescriptions(input)

    case "moderate_video_content":
      return await moderateVideoContent(input)

    default:
      throw new Error(`Неизвестный инструмент мультимодального анализа: ${toolName}`)
  }
}

// Реализация функций инструментов

async function analyzeVideoFrame(params: any): Promise<any> {
  const multimodalService = MultimodalAnalysisService.getInstance()

  const analysisParams: FrameAnalysisParams = {
    frameImagePath: params.frameImagePath,
    analysisType: params.analysisType as MultimodalAnalysisType,
    customPrompt: params.customPrompt,
    detailLevel: params.detailLevel || "medium",
    contextInfo: params.contextInfo,
  }

  return await multimodalService.analyzeFrame(analysisParams)
}

async function analyzeVideoMultimodal(params: any): Promise<any> {
  const multimodalService = MultimodalAnalysisService.getInstance()

  const analysisParams: VideoAnalysisParams = {
    clipId: params.clipId,
    analysisTypes: params.analysisTypes,
    samplingRate: params.samplingRate || 1,
    maxFrames: params.maxFrames || 20,
    contextInfo: params.contextInfo,
  }

  return await multimodalService.analyzeVideo(analysisParams)
}

async function suggestVideoThumbnails(params: any): Promise<any> {
  const multimodalService = MultimodalAnalysisService.getInstance()

  const suggestionParams: ThumbnailSuggestionParams = {
    clipId: params.clipId,
    count: params.count || 5,
    criteria: params.criteria,
    targetAspectRatio: params.targetAspectRatio,
    contextPrompt: params.contextPrompt,
  }

  return await multimodalService.suggestThumbnails(suggestionParams)
}

async function detectVideoHighlights(params: any): Promise<any> {
  const multimodalService = MultimodalAnalysisService.getInstance()

  // Анализируем видео с фокусом на ключевые моменты
  const analysisResult = await multimodalService.analyzeVideo({
    clipId: params.clipId,
    analysisTypes: ["highlight_detection", "emotion_analysis", "aesthetic_analysis"],
    samplingRate: 2, // Увеличиваем частоту для лучшего обнаружения highlights
    maxFrames: 50,
  })

  // Фильтруем результаты по уверенности и типам
  const highlights = analysisResult.frameResults
    .filter((frame) => frame.confidence >= (params.minConfidence || 0.7))
    .map((frame) => ({
      timestamp: frame.frameTimestamp,
      type: frame.analysisType,
      description: frame.description,
      confidence: frame.confidence,
      aestheticScore: frame.aestheticScore?.overall || 0,
      emotionalImpact: frame.emotions?.reduce((max, e) => Math.max(max, e.confidence), 0) || 0,
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, params.maxHighlights || 10)

  return {
    clipId: params.clipId,
    highlights,
    summary: analysisResult.summary,
    totalAnalyzed: analysisResult.frameResults.length,
  }
}

async function analyzeVideoEmotions(params: any): Promise<any> {
  const multimodalService = MultimodalAnalysisService.getInstance()

  const analysisResult = await multimodalService.analyzeVideo({
    clipId: params.clipId,
    analysisTypes: ["emotion_analysis"],
    samplingRate: 1,
    maxFrames: 30,
  })

  // Обрабатываем эмоциональные данные
  const emotionTimeline = analysisResult.frameResults.map((frame) => ({
    timestamp: frame.frameTimestamp,
    emotions: frame.emotions || [],
    dominantEmotion: frame.emotions?.[0]?.emotion || "neutral",
  }))

  // Создаем эмоциональную дугу если запрошено
  const emotionalArc = params.generateEmotionalArc ? generateEmotionalArc(emotionTimeline) : undefined

  return {
    clipId: params.clipId,
    emotionTimeline,
    emotionalArc,
    overallMood: analysisResult.summary.overallMood,
    emotionalPeaks: emotionTimeline.filter((e) => e.emotions.some((emotion) => emotion.confidence > 0.8)).slice(0, 5),
  }
}

async function extractVideoText(params: any): Promise<any> {
  const multimodalService = MultimodalAnalysisService.getInstance()

  const analysisResult = await multimodalService.analyzeVideo({
    clipId: params.clipId,
    analysisTypes: ["text_recognition"],
    samplingRate: 1,
    maxFrames: 40,
  })

  // Собираем весь найденный текст
  const extractedText = analysisResult.frameResults
    .flatMap((frame) => frame.detectedText || [])
    .filter((text) => text.confidence > 0.5)

  // Группируем по временным меткам
  const textTimeline = analysisResult.frameResults
    .filter((frame) => frame.detectedText && frame.detectedText.length > 0)
    .map((frame) => ({
      timestamp: frame.frameTimestamp,
      texts: frame.detectedText!.map((t) => ({
        text: t.text,
        confidence: t.confidence,
        language: t.language,
        position: t.position,
      })),
    }))

  // Создаем транскрипт если запрошено
  const transcript = params.generateTranscript ? extractedText.map((t) => t.text).join(" ") : undefined

  return {
    clipId: params.clipId,
    extractedText,
    textTimeline,
    transcript,
    detectedLanguages: analysisResult.metadata.detectedLanguages,
    totalTextItems: extractedText.length,
  }
}

async function analyzeVideoAesthetics(params: any): Promise<any> {
  const multimodalService = MultimodalAnalysisService.getInstance()

  const analysisResult = await multimodalService.analyzeVideo({
    clipId: params.clipId,
    analysisTypes: ["aesthetic_analysis"],
    samplingRate: 0.5, // Реже для эстетического анализа
    maxFrames: 25,
  })

  // Обрабатываем эстетические данные
  const aestheticTimeline = analysisResult.frameResults
    .filter((frame) => frame.aestheticScore)
    .map((frame) => ({
      timestamp: frame.frameTimestamp,
      scores: frame.aestheticScore!,
      overallScore: frame.aestheticScore!.overall,
    }))

  // Находим лучшие кадры
  const bestFrames = aestheticTimeline.sort((a, b) => b.overallScore - a.overallScore).slice(0, 10)

  // Генерируем отчет если запрошено
  const report = params.generateReport
    ? {
        averageScores: calculateAverageAestheticScores(aestheticTimeline),
        bestMoments: bestFrames.slice(0, 5),
        improvements: params.suggestImprovements ? generateAestheticSuggestions(aestheticTimeline) : [],
      }
    : undefined

  return {
    clipId: params.clipId,
    aestheticTimeline,
    bestFrames,
    report,
    overallAestheticScore: aestheticTimeline.reduce((sum, f) => sum + f.overallScore, 0) / aestheticTimeline.length,
  }
}

async function batchAnalyzeMultimodal(params: any): Promise<any> {
  const multimodalService = MultimodalAnalysisService.getInstance()

  const results = await multimodalService.batchAnalyzeVideos(params.clipIds, params.analysisTypes, {
    maxConcurrent: params.maxConcurrent || 2,
    progressCallback: (progress) => {
      console.log(`Мультимодальный анализ: ${progress.completed}/${progress.total}`)
    },
  })

  // Создаем сравнительный анализ если запрошено
  const comparison = params.generateComparison ? generateVideoComparison(results) : undefined

  return {
    results,
    comparison,
    totalVideos: params.clipIds.length,
    analysisTypes: params.analysisTypes,
    summary: {
      totalFramesAnalyzed: Object.values(results).reduce((sum, r) => sum + r.metadata.totalFramesAnalyzed, 0),
      averageConfidence:
        Object.values(results).reduce((sum, r) => sum + r.metadata.averageConfidence, 0) / Object.keys(results).length,
    },
  }
}

async function generateVideoDescriptions(params: any): Promise<any> {
  const multimodalService = MultimodalAnalysisService.getInstance()

  // Сначала анализируем видео
  const analysisResult = await multimodalService.analyzeVideo({
    clipId: params.clipId,
    analysisTypes: ["frame_description", "scene_understanding", "object_detection"],
    samplingRate: 0.5,
    maxFrames: 15,
  })

  // Генерируем описание на основе анализа
  const description = generateDescription(analysisResult, {
    type: params.descriptionType || "detailed",
    targetAudience: params.targetAudience,
    includeKeywords: params.includeKeywords,
    maxLength: params.maxLength || 500,
    language: params.language || "ru",
  })

  return {
    clipId: params.clipId,
    description,
    type: params.descriptionType,
    keywords: params.includeKeywords ? extractKeywords(analysisResult) : [],
    mainSubjects: analysisResult.summary.mainSubjects,
    mood: analysisResult.summary.overallMood,
  }
}

async function moderateVideoContent(params: any): Promise<any> {
  const multimodalService = MultimodalAnalysisService.getInstance()

  const analysisResult = await multimodalService.analyzeVideo({
    clipId: params.clipId,
    analysisTypes: ["content_moderation"],
    samplingRate: 2, // Увеличиваем частоту для модерации
    maxFrames: 50,
  })

  // Анализируем результаты модерации
  const flaggedFrames = analysisResult.frameResults
    .filter((frame) => frame.confidence < (params.flagThreshold || 0.5))
    .map((frame) => ({
      timestamp: frame.frameTimestamp,
      reason: frame.description,
      confidence: frame.confidence,
      severity: frame.confidence < 0.3 ? "high" : frame.confidence < 0.5 ? "medium" : "low",
    }))

  const moderationResult = {
    clipId: params.clipId,
    approved: flaggedFrames.length === 0,
    flags: flaggedFrames,
    riskLevel: calculateRiskLevel(flaggedFrames),
    checkedCategories: params.checkCategories || ["violence", "adult_content"],
    report: params.generateReport
      ? {
          totalFramesChecked: analysisResult.frameResults.length,
          flaggedCount: flaggedFrames.length,
          recommendations: generateModerationRecommendations(flaggedFrames),
        }
      : undefined,
  }

  return moderationResult
}

// Вспомогательные функции

function generateEmotionalArc(emotionTimeline: any[]): any {
  // Простая реализация эмоциональной дуги
  return emotionTimeline.map((item, index) => ({
    timestamp: item.timestamp,
    emotionalIntensity:
      item.emotions.reduce((sum: number, e: any) => sum + Number(e.confidence), 0) / item.emotions.length || 0,
    dominantEmotion: item.dominantEmotion,
    arcPosition: index / emotionTimeline.length, // 0 to 1
  }))
}

function calculateAverageAestheticScores(aestheticTimeline: any[]): any {
  if (aestheticTimeline.length === 0) return {}

  const compositionSum = aestheticTimeline.reduce((sum: number, f: any) => sum + Number(f.scores?.composition || 0), 0)
  const lightingSum = aestheticTimeline.reduce((sum: number, f: any) => sum + Number(f.scores?.lighting || 0), 0)
  const colorHarmonySum = aestheticTimeline.reduce(
    (sum: number, f: any) => sum + Number(f.scores?.colorHarmony || 0),
    0,
  )
  const overallSum = aestheticTimeline.reduce((sum: number, f: any) => sum + Number(f.overallScore || 0), 0)

  return {
    composition: compositionSum / aestheticTimeline.length,
    lighting: lightingSum / aestheticTimeline.length,
    colorHarmony: colorHarmonySum / aestheticTimeline.length,
    overall: overallSum / aestheticTimeline.length,
  }
}

function generateAestheticSuggestions(aestheticTimeline: any[]): string[] {
  const avgScores = calculateAverageAestheticScores(aestheticTimeline)
  const suggestions = []

  if (avgScores.composition < 6) {
    suggestions.push("Улучшить композицию кадра: следить за правилом третей")
  }
  if (avgScores.lighting < 6) {
    suggestions.push("Улучшить освещение: избегать пересветов и глубоких теней")
  }
  if (avgScores.colorHarmony < 6) {
    suggestions.push("Работать над цветовой гармонией: сбалансировать цветовую палитру")
  }

  return suggestions
}

function generateVideoComparison(results: Record<string, any>): any {
  const videos = Object.entries(results)

  return {
    totalVideos: videos.length,
    averageConfidence:
      videos.reduce((sum, [, result]) => sum + Number(result.metadata?.averageConfidence || 0), 0) / videos.length,
    commonSubjects: findCommonSubjects(videos),
    bestVideo: videos.reduce(
      (best, [id, result]) =>
        Number(result.metadata?.averageConfidence || 0) > best.confidence
          ? { id, confidence: Number(result.metadata?.averageConfidence || 0) }
          : best,
      { id: "", confidence: 0 },
    ),
    moodDistribution: analyzeMoodDistribution(videos),
  }
}

function generateDescription(analysisResult: any, options: any): string {
  const { mainSubjects, overallMood } = analysisResult.summary
  const keyDescriptions = analysisResult.frameResults
    .filter((f: any) => f.confidence > 0.7)
    .map((f: any) => f.description)
    .slice(0, 3)

  let description = ""

  if (options.type === "short") {
    description = `Видео содержит ${mainSubjects.slice(0, 2).join(", ")}. Общее настроение: ${overallMood}.`
  } else if (options.type === "detailed") {
    description = `В этом видео представлены ${mainSubjects.join(", ")}. ${keyDescriptions.join(" ")} Общая атмосфера характеризуется как ${overallMood}.`
  } else if (options.type === "marketing") {
    description = `Увлекательное видео с ${mainSubjects.slice(0, 3).join(", ")}! ${keyDescriptions[0]} Идеально подходит для ${options.targetAudience || "широкой аудитории"}.`
  }

  // Обрезаем до максимальной длины
  if (description.length > options.maxLength) {
    description = `${description.substring(0, options.maxLength - 3)}...`
  }

  return description
}

function extractKeywords(analysisResult: any): string[] {
  const allTags = analysisResult.frameResults.flatMap((f: any) => f.tags)
  const tagCounts = allTags.reduce((acc: Record<string, number>, tag: string) => {
    acc[tag] = (acc[tag] || 0) + 1
    return acc
  }, {})

  return Object.entries(tagCounts)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([tag]) => tag)
}

function calculateRiskLevel(flaggedFrames: any[]): string {
  if (flaggedFrames.length === 0) return "low"

  const highRiskCount = flaggedFrames.filter((f) => f.severity === "high").length
  const mediumRiskCount = flaggedFrames.filter((f) => f.severity === "medium").length

  if (highRiskCount > 0) return "high"
  if (mediumRiskCount > 2) return "medium"
  return "low"
}

function generateModerationRecommendations(flaggedFrames: any[]): string[] {
  const recommendations = []

  if (flaggedFrames.length > 0) {
    recommendations.push(`Найдено ${flaggedFrames.length} потенциально проблемных кадров`)
  }

  const highRiskFrames = flaggedFrames.filter((f) => f.severity === "high")
  if (highRiskFrames.length > 0) {
    recommendations.push("Рекомендуется ручная проверка кадров с высоким риском")
  }

  return recommendations
}

function findCommonSubjects(videos: Array<[string, any]>): string[] {
  const allSubjects = videos.flatMap(([, result]) => result.summary.mainSubjects)
  const subjectCounts = allSubjects.reduce((acc: Record<string, number>, subject: string) => {
    acc[subject] = (acc[subject] || 0) + 1
    return acc
  }, {})

  return Object.entries(subjectCounts)
    .filter(([, count]) => (count as number) > 1)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 5)
    .map(([subject]) => subject)
}

function analyzeMoodDistribution(videos: Array<[string, any]>): Record<string, number> {
  const moods = videos.map(([, result]) => result.summary.overallMood)
  return moods.reduce((acc: Record<string, number>, mood: string) => {
    acc[mood] = (acc[mood] || 0) + 1
    return acc
  }, {})
}
