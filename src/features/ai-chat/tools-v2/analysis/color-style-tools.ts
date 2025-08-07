/**
 * AI инструмент для работы с цветом и стилизацией с использованием BaseAITool
 */

import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "./base-ai-tool"

// Типы для работы с цветом и стилизацией
export interface ColorStyleInput {
  operation:
    | "analyze_palette"
    | "apply_grading"
    | "create_matching"
    | "generate_transfer"
    | "create_schemes"
    | "optimize_consistency"
  analysisScope?: "full-project" | "selected-clips" | "timeline-range" | "current-frame"
  timeRange?: {
    start: number
    end: number
  }
  colorAnalysisType?: ("dominant-colors" | "color-harmony" | "temperature" | "saturation" | "brightness" | "contrast")[]
  samplingMethod?: "uniform" | "adaptive" | "key-frames" | "scene-changes"
  includeHistogram?: boolean
  generatePalette?: boolean
  compareWithStandards?: ("rec709" | "rec2020" | "dci-p3" | "adobe-rgb" | "srgb")[]
  gradingStyle?:
    | "cinematic"
    | "vintage"
    | "modern"
    | "thriller"
    | "romance"
    | "sci-fi"
    | "documentary"
    | "commercial"
    | "custom"
  targetClips?: string[]
  colorProfile?: {
    temperature?: number
    tint?: number
    exposure?: number
    highlights?: number
    shadows?: number
    contrast?: number
    saturation?: number
  }
  lutSettings?: {
    useLUT?: boolean
    lutFile?: string
    lutIntensity?: number
    blendMode?: "normal" | "multiply" | "screen" | "overlay" | "soft-light"
  }
  adaptiveCorrection?: boolean
  preserveSkinTones?: boolean
  matchingMethod?: "reference-frame" | "shot-matching" | "auto-balance" | "manual-targets" | "histogram-matching"
  referenceClip?: string
  matchingParameters?: {
    matchBrightness?: boolean
    matchContrast?: boolean
    matchColor?: boolean
    matchSaturation?: boolean
    preserveHighlights?: boolean
    preserveShadows?: boolean
  }
  analysisRegions?: Array<{
    name: string
    coordinates: {
      x: number
      y: number
      width: number
      height: number
    }
    weight?: number
  }>
  tolerance?: number
  previewMode?: boolean
  styleSource?: "reference-image" | "artistic-style" | "preset" | "custom-parameters"
  referenceImagePath?: string
  artisticStyle?: "oil-painting" | "watercolor" | "sketch" | "impressionist" | "pop-art" | "vintage" | "noir" | "sepia"
  transferIntensity?: number
  targetElements?: ("colors" | "textures" | "lighting" | "contrast" | "composition")[]
  processingQuality?: "draft" | "preview" | "high" | "ultra"
  preserveDetails?: {
    faces?: boolean
    text?: boolean
    motion?: boolean
    edges?: boolean
  }
  blendingOptions?: {
    blendMode?: "replace" | "overlay" | "multiply" | "soft-light" | "color-dodge"
    opacity?: number
    maskAreas?: string[]
  }
  schemeType?: "complementary" | "triadic" | "analogous" | "monochromatic" | "split-complementary" | "tetradic"
  adaptationTriggers?: ("scene-change" | "music-beat" | "emotional-content" | "time-of-day" | "action-intensity")[]
  baseColor?: string
  colorMood?: "warm" | "cool" | "neutral" | "vibrant" | "muted" | "dramatic" | "peaceful"
  transitionSettings?: {
    duration?: number
    easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out" | "bounce"
    smoothness?: number
  }
  intensityMapping?: {
    lowIntensity?: string
    mediumIntensity?: string
    highIntensity?: string
  }
  constraintsSettings?: {
    maintainReadability?: boolean
    limitSaturation?: {
      min?: number
      max?: number
    }
    preserveBrandColors?: boolean
  }
  consistencyAspects?: (
    | "color-temperature"
    | "exposure"
    | "contrast"
    | "saturation"
    | "style"
    | "lighting"
    | "composition"
  )[]
  analysisMethod?: "statistical" | "perceptual" | "technical" | "artistic"
  toleranceSettings?: {
    colorVariation?: number
    exposureVariation?: number
    contrastVariation?: number
  }
  correctionStrategy?: "automatic" | "guided" | "manual-review" | "preserve-artistic"
  priorityWeights?: {
    technicalAccuracy?: number
    artisticVision?: number
    viewerComfort?: number
  }
  excludeRegions?: Array<{
    clipId: string
    timeRange: {
      start: number
      end: number
    }
    reason: string
  }>
  generateReport?: boolean
  reason: string
}

export interface ColorAnalysisResult {
  analysisType: string
  dominantColors?: string[]
  colorHarmony?: {
    scheme: string
    harmony_score: number
    recommendations: string[]
  }
  temperature?: {
    average: number
    range: [number, number]
    consistency: number
  }
  histogram?: {
    red: number[]
    green: number[]
    blue: number[]
  }
  palette?: {
    colors: string[]
    weights: number[]
  }
  standards_comparison?: Record<string, any>
}

export interface StyleResult {
  gradingApplied?: {
    style: string
    adjustments: any
    lutApplied?: string
  }
  matchingResults?: {
    referenceClip: string
    adjustedClips: string[]
    matchQuality: number
  }
  styleTransfer?: {
    sourceStyle: string
    intensity: number
    processedElements: string[]
  }
  colorScheme?: {
    type: string
    colors: string[]
    adaptationPoints: number
  }
  consistencyReport?: {
    overallScore: number
    issues: Array<{
      type: string
      severity: string
      clips: string[]
      suggestion: string
    }>
  }
}

export interface ColorStyleResult {
  operation: string
  success: boolean
  processedClips: string[]
  colorAnalysis?: ColorAnalysisResult
  styleResults?: StyleResult
  statistics: {
    totalClips: number
    processingTime: number
    appliedOperations: number
    qualityScore: number
  }
  recommendations: string[]
  warnings?: string[]
  nextActions: string[]
}

/**
 * AI инструмент для комплексной работы с цветом и стилизацией с унифицированной обработкой ошибок
 */
export class ColorStyleTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("ColorStyleTool", logger)
  }

  /**
   * Выполняет операции с цветом и стилизацией
   */
  public async processColorStyle(
    input: ColorStyleInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<ColorStyleResult>> {
    // Валидация входных данных
    const validation = this.validateInput(input, (data) => {
      const errors: string[] = []

      const validOperations = [
        "analyze_palette",
        "apply_grading",
        "create_matching",
        "generate_transfer",
        "create_schemes",
        "optimize_consistency",
      ]
      if (!validOperations.includes(data.operation)) {
        errors.push(`Неподдерживаемая операция: ${data.operation}`)
      }

      if (!data.reason) {
        errors.push("Требуется указать причину обработки цвета и стиля")
      }

      // Специфические валидации для разных операций
      switch (data.operation) {
        case "apply_grading":
          if (!data.gradingStyle) {
            errors.push("Для применения градации требуется указать gradingStyle")
          }
          break
        case "create_matching":
          if (!data.matchingMethod || !data.targetClips || data.targetClips.length === 0) {
            errors.push("Для создания сопоставления требуется указать matchingMethod и targetClips")
          }
          break
        case "generate_transfer":
          if (!data.styleSource) {
            errors.push("Для передачи стиля требуется указать styleSource")
          }
          break
        case "create_schemes":
          if (!data.schemeType) {
            errors.push("Для создания схем требуется указать schemeType")
          }
          break
        case "optimize_consistency":
          if (!data.consistencyAspects || data.consistencyAspects.length === 0) {
            errors.push("Для оптимизации консистентности требуется указать consistencyAspects")
          }
          break
      }

      if (data.tolerance !== undefined && (data.tolerance < 0 || data.tolerance > 1)) {
        errors.push("Допуск должен быть между 0 и 1")
      }

      if (data.transferIntensity !== undefined && (data.transferIntensity < 0 || data.transferIntensity > 1)) {
        errors.push("Интенсивность передачи должна быть между 0 и 1")
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
        message: "Ошибка валидации входных данных для обработки цвета и стиля",
        executionTime: 0,
        toolName: this.toolName,
      }
    }

    const operation = input.operation
    const targetClips = input.targetClips || []

    // Выполняем обработку цвета и стиля с унифицированной обработкой ошибок
    return this.executeWithErrorHandling(
      async (context) => {
        context.logger?.("info", "Начинаем обработку цвета и стиля", {
          operation,
          clipsCount: targetClips.length,
          reason: input.reason,
        })

        // Выполняем конкретную операцию
        let colorAnalysis: ColorAnalysisResult | undefined
        let styleResults: StyleResult | undefined
        let processedClips: string[] = []
        const recommendations: string[] = []
        const warnings: string[] = []
        const nextActions: string[] = []
        let appliedOperations = 0
        let qualityScore = 0

        switch (operation) {
          case "analyze_palette":
            colorAnalysis = await this.performColorPaletteAnalysis(input, context)
            processedClips = targetClips.length > 0 ? targetClips : await this.getAllVideoClips()
            recommendations.push("Используйте результаты анализа для улучшения цветовой схемы")
            nextActions.push("Применить цветокоррекцию на основе анализа")
            qualityScore = 8.0
            break

          case "apply_grading":
            styleResults = await this.performCinematicGrading(input, context)
            processedClips = targetClips
            appliedOperations = 1
            recommendations.push("Проверьте результаты градации на разных устройствах")
            nextActions.push("Настроить параметры при необходимости")
            qualityScore = 8.5
            break

          case "create_matching":
            styleResults = await this.performColorMatching(input, context)
            processedClips = input.targetClips || []
            appliedOperations = 1
            recommendations.push("Проверьте качество сопоставления цветов")
            nextActions.push("Тонкая настройка параметров сопоставления")
            qualityScore = 8.2
            break

          case "generate_transfer":
            styleResults = await this.performStyleTransfer(input, context)
            processedClips = targetClips
            appliedOperations = 1
            recommendations.push("Оцените художественный эффект передачи стиля")
            nextActions.push("Настроить интенсивность эффекта")
            qualityScore = 7.8
            break

          case "create_schemes":
            styleResults = await this.performColorSchemeCreation(input, context)
            processedClips = targetClips
            appliedOperations = 1
            recommendations.push("Протестируйте схему на различных сценах")
            nextActions.push("Настроить триггеры адаптации")
            qualityScore = 8.3
            break

          case "optimize_consistency":
            styleResults = await this.performConsistencyOptimization(input, context)
            processedClips = targetClips.length > 0 ? targetClips : await this.getAllVideoClips()
            appliedOperations = 1
            recommendations.push("Проверьте улучшение визуальной консистентности")
            nextActions.push("Применить рекомендации из отчета")
            qualityScore = 8.7
            break

          default:
            throw new Error(`Неподдерживаемая операция: ${operation}`)
        }

        // Добавляем предупреждения по безопасности
        if (
          operation === "apply_grading" &&
          input.colorProfile?.exposure &&
          Math.abs(input.colorProfile.exposure) > 2
        ) {
          warnings.push("Сильные изменения экспозиции могут повлиять на качество изображения")
        }

        if (operation === "generate_transfer" && input.transferIntensity && input.transferIntensity > 0.8) {
          warnings.push("Высокая интенсивность может сильно исказить оригинальное изображение")
        }

        const result: ColorStyleResult = {
          operation,
          success: true,
          processedClips,
          colorAnalysis,
          styleResults,
          statistics: {
            totalClips: processedClips.length,
            processingTime: 0, // Будет заполнено в executeWithErrorHandling
            appliedOperations,
            qualityScore,
          },
          recommendations,
          warnings: warnings.length > 0 ? warnings : undefined,
          nextActions,
        }

        context.logger?.("info", "Обработка цвета и стиля завершена", {
          operation,
          processedClips: processedClips.length,
          success: true,
        })

        return result
      },
      {
        timeout: options.timeout || 180000, // 3 минуты для обработки цвета
        retries: options.retries || 1,
        retryDelay: options.retryDelay || 2000,
        enableLogging: options.enableLogging !== false,
        metadata: {
          operation,
          clipsCount: targetClips.length,
          reason: input.reason,
          ...options.metadata,
        },
      },
    )
  }

  /**
   * Анализирует цветовую палитру
   */
  private async performColorPaletteAnalysis(input: ColorStyleInput, context: any): Promise<ColorAnalysisResult> {
    context.logger?.("info", "Выполняем анализ цветовой палитры", {
      scope: input.analysisScope,
      types: input.colorAnalysisType,
    })

    // Заглушка для анализа палитры
    return {
      analysisType: "comprehensive",
      dominantColors: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"],
      colorHarmony: {
        scheme: "triadic",
        harmony_score: 8.5,
        recommendations: ["Цветовая гармония хорошая", "Рассмотрите добавление акцентных цветов"],
      },
      temperature: {
        average: 5200,
        range: [4800, 5800],
        consistency: 0.85,
      },
      palette: {
        colors: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"],
        weights: [0.3, 0.25, 0.2, 0.15, 0.1],
      },
    }
  }

  /**
   * Применяет кинематографическую градацию
   */
  private async performCinematicGrading(input: ColorStyleInput, context: any): Promise<StyleResult> {
    context.logger?.("info", "Применяем кинематографическую градацию", {
      style: input.gradingStyle,
      clips: input.targetClips?.length,
    })

    return {
      gradingApplied: {
        style: input.gradingStyle || "cinematic",
        adjustments: {
          temperature: input.colorProfile?.temperature || 0,
          tint: input.colorProfile?.tint || 0,
          exposure: input.colorProfile?.exposure || 0,
          contrast: input.colorProfile?.contrast || 10,
          saturation: input.colorProfile?.saturation || 5,
        },
        lutApplied: input.lutSettings?.lutFile || "default_cinematic.cube",
      },
    }
  }

  /**
   * Выполняет сопоставление цветов
   */
  private async performColorMatching(input: ColorStyleInput, context: any): Promise<StyleResult> {
    context.logger?.("info", "Выполняем сопоставление цветов", {
      method: input.matchingMethod,
      reference: input.referenceClip,
      targets: input.targetClips?.length,
    })

    return {
      matchingResults: {
        referenceClip: input.referenceClip || "clip_1",
        adjustedClips: input.targetClips || [],
        matchQuality: 0.92,
      },
    }
  }

  /**
   * Выполняет передачу стиля
   */
  private async performStyleTransfer(input: ColorStyleInput, context: any): Promise<StyleResult> {
    context.logger?.("info", "Выполняем передачу стиля", {
      source: input.styleSource,
      intensity: input.transferIntensity,
    })

    return {
      styleTransfer: {
        sourceStyle: input.artisticStyle || "reference-image",
        intensity: input.transferIntensity || 0.7,
        processedElements: input.targetElements || ["colors", "lighting"],
      },
    }
  }

  /**
   * Создает динамические цветовые схемы
   */
  private async performColorSchemeCreation(input: ColorStyleInput, context: any): Promise<StyleResult> {
    context.logger?.("info", "Создаем динамические цветовые схемы", {
      type: input.schemeType,
      triggers: input.adaptationTriggers,
    })

    return {
      colorScheme: {
        type: input.schemeType || "complementary",
        colors: ["#FF6B6B", "#4ECDC4", "#45B7D1"],
        adaptationPoints: input.adaptationTriggers?.length || 2,
      },
    }
  }

  /**
   * Оптимизирует визуальную консистентность
   */
  private async performConsistencyOptimization(input: ColorStyleInput, context: any): Promise<StyleResult> {
    context.logger?.("info", "Оптимизируем визуальную консистентность", {
      aspects: input.consistencyAspects,
      method: input.analysisMethod,
    })

    return {
      consistencyReport: {
        overallScore: 8.5,
        issues: [
          {
            type: "color-temperature",
            severity: "medium",
            clips: ["clip_2", "clip_5"],
            suggestion: "Выровнять цветовую температуру",
          },
        ],
      },
    }
  }

  /**
   * Получает список всех видео клипов
   */
  private async getAllVideoClips(): Promise<string[]> {
    // Заглушка - в реальности получали бы из системы
    return ["video_clip_1", "video_clip_2", "video_clip_3"]
  }
}

// Экспортируем готовый экземпляр для использования
export const colorStyleTool = new ColorStyleTool()

// Функции-обертки для обратной совместимости
export async function analyzeColorPalette(params: any): Promise<AIToolResult<ColorStyleResult>> {
  const input: ColorStyleInput = {
    operation: "analyze_palette",
    analysisScope: params.analysisScope,
    timeRange: params.timeRange,
    colorAnalysisType: params.colorAnalysisType,
    samplingMethod: params.samplingMethod,
    includeHistogram: params.includeHistogram,
    generatePalette: params.generatePalette,
    compareWithStandards: params.compareWithStandards,
    reason: params.reason || "Анализ цветовой палитры",
  }

  return colorStyleTool.processColorStyle(input)
}

export async function applyCinematicColorGrading(params: any): Promise<AIToolResult<ColorStyleResult>> {
  const input: ColorStyleInput = {
    operation: "apply_grading",
    gradingStyle: params.gradingStyle,
    targetClips: params.targetClips,
    colorProfile: params.colorProfile,
    lutSettings: params.lutSettings,
    adaptiveCorrection: params.adaptiveCorrection,
    preserveSkinTones: params.preserveSkinTones,
    reason: params.reason || "Применение кинематографической цветокоррекции",
  }

  return colorStyleTool.processColorStyle(input)
}

export async function createColorMatching(params: any): Promise<AIToolResult<ColorStyleResult>> {
  const input: ColorStyleInput = {
    operation: "create_matching",
    matchingMethod: params.matchingMethod,
    referenceClip: params.referenceClip,
    targetClips: params.targetClips,
    matchingParameters: params.matchingParameters,
    analysisRegions: params.analysisRegions,
    tolerance: params.tolerance,
    previewMode: params.previewMode,
    reason: params.reason || "Создание цветового соответствия",
  }

  return colorStyleTool.processColorStyle(input)
}

export async function generateStyleTransfer(params: any): Promise<AIToolResult<ColorStyleResult>> {
  const input: ColorStyleInput = {
    operation: "generate_transfer",
    styleSource: params.styleSource,
    referenceImagePath: params.referenceImagePath,
    artisticStyle: params.artisticStyle,
    transferIntensity: params.transferIntensity,
    targetElements: params.targetElements,
    processingQuality: params.processingQuality,
    preserveDetails: params.preserveDetails,
    blendingOptions: params.blendingOptions,
    targetClips: params.targetClips,
    reason: params.reason || "Генерация стилистической передачи",
  }

  return colorStyleTool.processColorStyle(input)
}

export async function createDynamicColorSchemes(params: any): Promise<AIToolResult<ColorStyleResult>> {
  const input: ColorStyleInput = {
    operation: "create_schemes",
    schemeType: params.schemeType,
    adaptationTriggers: params.adaptationTriggers,
    baseColor: params.baseColor,
    colorMood: params.colorMood,
    transitionSettings: params.transitionSettings,
    intensityMapping: params.intensityMapping,
    constraintsSettings: params.constraintsSettings,
    targetClips: params.targetClips,
    reason: params.reason || "Создание динамических цветовых схем",
  }

  return colorStyleTool.processColorStyle(input)
}

export async function optimizeVisualConsistency(params: any): Promise<AIToolResult<ColorStyleResult>> {
  const input: ColorStyleInput = {
    operation: "optimize_consistency",
    consistencyAspects: params.consistencyAspects,
    analysisMethod: params.analysisMethod,
    toleranceSettings: params.toleranceSettings,
    correctionStrategy: params.correctionStrategy,
    priorityWeights: params.priorityWeights,
    excludeRegions: params.excludeRegions,
    generateReport: params.generateReport,
    targetClips: params.targetClips,
    reason: params.reason || "Оптимизация визуальной консистентности",
  }

  return colorStyleTool.processColorStyle(input)
}

// Старые типы и интерфейсы для обратной совместимости
export const colorStyleTools: any[] = [
  {
    name: "analyze_color_palette",
    description: "Анализирует цветовую палитру проекта и предлагает улучшения гармонии",
    input_schema: {
      type: "object",
      properties: {
        analysisScope: {
          type: "string",
          enum: ["full-project", "selected-clips", "timeline-range", "current-frame"],
          description: "Область анализа цветовой палитры",
          default: "full-project",
        },
        timeRange: {
          type: "object",
          properties: {
            start: { type: "number", description: "Начальное время в секундах" },
            end: { type: "number", description: "Конечное время в секундах" },
          },
          description: "Временной диапазон для анализа",
        },
        colorAnalysisType: {
          type: "array",
          items: {
            type: "string",
            enum: ["dominant-colors", "color-harmony", "temperature", "saturation", "brightness", "contrast"],
          },
          description: "Типы цветового анализа",
          default: ["dominant-colors", "color-harmony", "temperature"],
        },
        samplingMethod: {
          type: "string",
          enum: ["uniform", "adaptive", "key-frames", "scene-changes"],
          description: "Метод сэмплирования кадров",
          default: "adaptive",
        },
        includeHistogram: {
          type: "boolean",
          description: "Включить гистограмму цветов",
          default: true,
        },
        generatePalette: {
          type: "boolean",
          description: "Генерировать цветовую палитру",
          default: true,
        },
        compareWithStandards: {
          type: "array",
          items: {
            type: "string",
            enum: ["rec709", "rec2020", "dci-p3", "adobe-rgb", "srgb"],
          },
          description: "Сравнить с цветовыми стандартами",
        },
      },
    },
  },

  {
    name: "apply_cinematic_color_grading",
    description: "Применяет кинематографическую цветокоррекцию с различными стилями и LUT",
    input_schema: {
      type: "object",
      properties: {
        gradingStyle: {
          type: "string",
          enum: [
            "cinematic",
            "vintage",
            "modern",
            "thriller",
            "romance",
            "sci-fi",
            "documentary",
            "commercial",
            "custom",
          ],
          description: "Стиль цветокоррекции",
        },
        targetClips: {
          type: "array",
          items: { type: "string" },
          description: "ID клипов для применения цветокоррекции",
        },
        colorProfile: {
          type: "object",
          properties: {
            temperature: {
              type: "number",
              minimum: -100,
              maximum: 100,
              description: "Цветовая температура",
            },
            tint: {
              type: "number",
              minimum: -100,
              maximum: 100,
              description: "Оттенок",
            },
            exposure: {
              type: "number",
              minimum: -3,
              maximum: 3,
              description: "Экспозиция",
            },
            highlights: {
              type: "number",
              minimum: -100,
              maximum: 100,
              description: "Светлые участки",
            },
            shadows: {
              type: "number",
              minimum: -100,
              maximum: 100,
              description: "Тени",
            },
            contrast: {
              type: "number",
              minimum: -100,
              maximum: 100,
              description: "Контраст",
            },
            saturation: {
              type: "number",
              minimum: -100,
              maximum: 100,
              description: "Насыщенность",
            },
          },
        },
        lutSettings: {
          type: "object",
          properties: {
            useLUT: { type: "boolean", description: "Использовать LUT" },
            lutFile: { type: "string", description: "Путь к LUT файлу" },
            lutIntensity: {
              type: "number",
              minimum: 0,
              maximum: 1,
              description: "Интенсивность LUT",
              default: 1,
            },
            blendMode: {
              type: "string",
              enum: ["normal", "multiply", "screen", "overlay", "soft-light"],
              description: "Режим наложения LUT",
              default: "normal",
            },
          },
        },
        adaptiveCorrection: {
          type: "boolean",
          description: "Адаптивная коррекция под контент",
          default: true,
        },
        preserveSkinTones: {
          type: "boolean",
          description: "Сохранять естественные тона кожи",
          default: true,
        },
        reason: {
          type: "string",
          description: "Цель применения цветокоррекции",
        },
      },
      required: ["gradingStyle", "reason"],
    },
  },

  {
    name: "create_color_matching",
    description: "Создает цветовое соответствие между различными клипами и камерами",
    input_schema: {
      type: "object",
      properties: {
        matchingMethod: {
          type: "string",
          enum: ["reference-frame", "shot-matching", "auto-balance", "manual-targets", "histogram-matching"],
          description: "Метод сопоставления цветов",
          default: "shot-matching",
        },
        referenceClip: {
          type: "string",
          description: "ID клипа-образца для сопоставления",
        },
        targetClips: {
          type: "array",
          items: { type: "string" },
          description: "ID клипов для корректировки",
        },
        matchingParameters: {
          type: "object",
          properties: {
            matchBrightness: { type: "boolean", description: "Сопоставлять яркость" },
            matchContrast: { type: "boolean", description: "Сопоставлять контраст" },
            matchColor: { type: "boolean", description: "Сопоставлять цвет" },
            matchSaturation: { type: "boolean", description: "Сопоставлять насыщенность" },
            preserveHighlights: { type: "boolean", description: "Сохранять блики" },
            preserveShadows: { type: "boolean", description: "Сохранять тени" },
          },
        },
        analysisRegions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string", description: "Название области" },
              coordinates: {
                type: "object",
                properties: {
                  x: { type: "number" },
                  y: { type: "number" },
                  width: { type: "number" },
                  height: { type: "number" },
                },
              },
              weight: { type: "number", minimum: 0, maximum: 1, description: "Вес области при анализе" },
            },
          },
          description: "Области кадра для анализа соответствия",
        },
        tolerance: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "Допустимое отклонение при сопоставлении",
          default: 0.1,
        },
        previewMode: {
          type: "boolean",
          description: "Режим предварительного просмотра",
          default: true,
        },
        reason: {
          type: "string",
          description: "Цель создания цветового соответствия",
        },
      },
      required: ["matchingMethod", "targetClips", "reason"],
    },
  },

  {
    name: "generate_style_transfer",
    description: "Применяет стилистическую передачу для создания художественных эффектов",
    input_schema: {
      type: "object",
      properties: {
        styleSource: {
          type: "string",
          enum: ["reference-image", "artistic-style", "preset", "custom-parameters"],
          description: "Источник стиля для передачи",
        },
        referenceImagePath: {
          type: "string",
          description: "Путь к изображению-образцу стиля",
        },
        artisticStyle: {
          type: "string",
          enum: ["oil-painting", "watercolor", "sketch", "impressionist", "pop-art", "vintage", "noir", "sepia"],
          description: "Художественный стиль",
        },
        transferIntensity: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "Интенсивность применения стиля",
          default: 0.7,
        },
        targetElements: {
          type: "array",
          items: {
            type: "string",
            enum: ["colors", "textures", "lighting", "contrast", "composition"],
          },
          description: "Элементы для передачи стиля",
          default: ["colors", "lighting"],
        },
        processingQuality: {
          type: "string",
          enum: ["draft", "preview", "high", "ultra"],
          description: "Качество обработки",
          default: "high",
        },
        preserveDetails: {
          type: "object",
          properties: {
            faces: { type: "boolean", description: "Сохранять детали лиц" },
            text: { type: "boolean", description: "Сохранять читаемость текста" },
            motion: { type: "boolean", description: "Сохранять четкость движения" },
            edges: { type: "boolean", description: "Сохранять резкость краев" },
          },
        },
        blendingOptions: {
          type: "object",
          properties: {
            blendMode: {
              type: "string",
              enum: ["replace", "overlay", "multiply", "soft-light", "color-dodge"],
              description: "Режим наложения стиля",
            },
            opacity: {
              type: "number",
              minimum: 0,
              maximum: 1,
              description: "Прозрачность эффекта",
            },
            maskAreas: {
              type: "array",
              items: { type: "string" },
              description: "Области для применения маски",
            },
          },
        },
        reason: {
          type: "string",
          description: "Цель применения стилистической передачи",
        },
      },
      required: ["styleSource", "reason"],
    },
  },

  {
    name: "create_dynamic_color_schemes",
    description: "Создает динамические цветовые схемы, адаптирующиеся к содержимому",
    input_schema: {
      type: "object",
      properties: {
        schemeType: {
          type: "string",
          enum: ["complementary", "triadic", "analogous", "monochromatic", "split-complementary", "tetradic"],
          description: "Тип цветовой схемы",
        },
        adaptationTriggers: {
          type: "array",
          items: {
            type: "string",
            enum: ["scene-change", "music-beat", "emotional-content", "time-of-day", "action-intensity"],
          },
          description: "Триггеры для изменения схемы",
          default: ["scene-change", "emotional-content"],
        },
        baseColor: {
          type: "string",
          description: "Базовый цвет в hex формате",
        },
        colorMood: {
          type: "string",
          enum: ["warm", "cool", "neutral", "vibrant", "muted", "dramatic", "peaceful"],
          description: "Настроение цветовой схемы",
        },
        transitionSettings: {
          type: "object",
          properties: {
            duration: {
              type: "number",
              minimum: 0.1,
              maximum: 5,
              description: "Длительность перехода в секундах",
              default: 1,
            },
            easing: {
              type: "string",
              enum: ["linear", "ease-in", "ease-out", "ease-in-out", "bounce"],
              description: "Функция сглаживания перехода",
              default: "ease-in-out",
            },
            smoothness: {
              type: "number",
              minimum: 0,
              maximum: 1,
              description: "Плавность перехода",
              default: 0.8,
            },
          },
        },
        intensityMapping: {
          type: "object",
          properties: {
            lowIntensity: { type: "string", description: "Цветовая схема для низкой интенсивности" },
            mediumIntensity: { type: "string", description: "Цветовая схема для средней интенсивности" },
            highIntensity: { type: "string", description: "Цветовая схема для высокой интенсивности" },
          },
        },
        constraintsSettings: {
          type: "object",
          properties: {
            maintainReadability: { type: "boolean", description: "Поддерживать читаемость текста" },
            limitSaturation: {
              type: "object",
              properties: {
                min: { type: "number", minimum: 0, maximum: 1 },
                max: { type: "number", minimum: 0, maximum: 1 },
              },
            },
            preserveBrandColors: { type: "boolean", description: "Сохранять брендовые цвета" },
          },
        },
        reason: {
          type: "string",
          description: "Цель создания динамической цветовой схемы",
        },
      },
      required: ["schemeType", "reason"],
    },
  },

  {
    name: "optimize_visual_consistency",
    description: "Оптимизирует визуальную консистентность проекта через анализ стиля и цвета",
    input_schema: {
      type: "object",
      properties: {
        consistencyAspects: {
          type: "array",
          items: {
            type: "string",
            enum: ["color-temperature", "exposure", "contrast", "saturation", "style", "lighting", "composition"],
          },
          description: "Аспекты для обеспечения консистентности",
          default: ["color-temperature", "exposure", "contrast"],
        },
        analysisMethod: {
          type: "string",
          enum: ["statistical", "perceptual", "technical", "artistic"],
          description: "Метод анализа консистентности",
          default: "perceptual",
        },
        toleranceSettings: {
          type: "object",
          properties: {
            colorVariation: {
              type: "number",
              minimum: 0,
              maximum: 1,
              description: "Допустимое отклонение цвета",
              default: 0.15,
            },
            exposureVariation: {
              type: "number",
              minimum: 0,
              maximum: 2,
              description: "Допустимое отклонение экспозиции",
              default: 0.5,
            },
            contrastVariation: {
              type: "number",
              minimum: 0,
              maximum: 1,
              description: "Допустимое отклонение контраста",
              default: 0.2,
            },
          },
        },
        correctionStrategy: {
          type: "string",
          enum: ["automatic", "guided", "manual-review", "preserve-artistic"],
          description: "Стратегия коррекции",
          default: "guided",
        },
        priorityWeights: {
          type: "object",
          properties: {
            technicalAccuracy: {
              type: "number",
              minimum: 0,
              maximum: 1,
              description: "Вес технической точности",
            },
            artisticVision: {
              type: "number",
              minimum: 0,
              maximum: 1,
              description: "Вес художественного видения",
            },
            viewerComfort: {
              type: "number",
              minimum: 0,
              maximum: 1,
              description: "Вес комфорта для зрителя",
            },
          },
        },
        excludeRegions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              clipId: { type: "string" },
              timeRange: {
                type: "object",
                properties: {
                  start: { type: "number" },
                  end: { type: "number" },
                },
              },
              reason: { type: "string", description: "Причина исключения" },
            },
          },
          description: "Области для исключения из оптимизации",
        },
        generateReport: {
          type: "boolean",
          description: "Создать отчет о консистентности",
          default: true,
        },
        reason: {
          type: "string",
          description: "Цель оптимизации визуальной консистентности",
        },
      },
      required: ["consistencyAspects", "reason"],
    },
  },
]

// Legacy types для обратной совместимости
export interface ColorStyleToolResult {
  success: boolean
  message: string
  data?: {
    colorAnalysis?: any
    appliedGrading?: any
    matchingResults?: any
    styleTransfer?: any
    colorScheme?: any
    consistencyReport?: any
    recommendations?: string[]
    warnings?: string[]
  }
  errors?: string[]
  nextActions?: string[]
}

// Интерфейс для доступа к системе цвета и стиля
interface ColorStyleSystemAccess {
  analyzeColorPalette: (scope: string, types: string[], method: string) => any
  applyCinematicGrading: (style: string, clips: string[], profile: any, lut: any) => Promise<any>
  createColorMatching: (method: string, reference: string, targets: string[], params: any) => Promise<any>
  generateStyleTransfer: (source: string, intensity: number, elements: string[], quality: string) => Promise<any>
  createDynamicColorSchemes: (type: string, triggers: string[], settings: any) => Promise<any>
  optimizeVisualConsistency: (aspects: string[], method: string, strategy: string) => Promise<any>
  getColorStandards: () => any
  validateColorSpace: (colorSpace: string) => boolean
}

// Глобальная переменная для доступа к системе цвета и стиля
let colorStyleSystemAccess: ColorStyleSystemAccess | null = null

/**
 * Устанавливает доступ к системе цвета и стиля
 */
export function setColorStyleSystemAccess(access: ColorStyleSystemAccess | null) {
  colorStyleSystemAccess = access
}

/**
 * Выполняет color & style инструмент (legacy API)
 */
export async function executeColorStyleTool(
  toolName: string,
  input: Record<string, any>,
): Promise<ColorStyleToolResult> {
  try {
    // Маппинг старых названий на новые операции
    const operationMap: Record<string, () => Promise<any>> = {
      analyze_color_palette: () => analyzeColorPalette(input),
      apply_cinematic_color_grading: () => applyCinematicColorGrading(input),
      create_color_matching: () => createColorMatching(input),
      generate_style_transfer: () => generateStyleTransfer(input),
      create_dynamic_color_schemes: () => createDynamicColorSchemes(input),
      optimize_visual_consistency: () => optimizeVisualConsistency(input),
    }

    const operation = operationMap[toolName]
    if (!operation) {
      return {
        success: false,
        message: `Неизвестный color & style инструмент: ${toolName}`,
        errors: [`Инструмент ${toolName} не найден`],
      }
    }

    const result = await operation()

    // Конвертируем результат в старый формат
    return {
      success: result.success,
      message: result.message || "Операция выполнена успешно",
      data: {
        colorAnalysis: result.data?.colorAnalysis,
        appliedGrading: result.data?.styleResults?.gradingApplied,
        matchingResults: result.data?.styleResults?.matchingResults,
        styleTransfer: result.data?.styleResults?.styleTransfer,
        colorScheme: result.data?.styleResults?.colorScheme,
        consistencyReport: result.data?.styleResults?.consistencyReport,
        recommendations: result.data?.recommendations || [],
        warnings: result.data?.warnings,
      },
      errors: result.errors,
      nextActions: result.data?.nextActions || [],
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка выполнения color & style инструмента ${toolName}: ${error instanceof Error ? error.message : String(error)}`,
      errors: [error instanceof Error ? error.message : String(error)],
    }
  }
}
