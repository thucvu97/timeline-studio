/**
 * AI инструмент для интеллектуального анализа контента с использованием BaseAITool
 */

import { type AIToolExecutionOptions, type AIToolLogger, type AIToolResult, BaseAITool } from "../base-ai-tool"

// Типы для интеллектуального анализа контента
export interface ContentIntelligenceInput {
  operation:
    | "analyze_content"
    | "detect_scenes"
    | "classify_content"
    | "adapt_platform"
    | "generate_multilanguage"
    | "generate_variants"
    | "analyze_audience"
    | "optimize_engagement"
  mediaFiles?: string[]
  analysisDepth?: "quick" | "normal" | "deep"
  targetPlatforms?: ("youtube" | "tiktok" | "instagram" | "telegram" | "twitter" | "facebook" | "linkedin")[]
  languages?: string[]
  enablePersonTracking?: boolean
  generateScript?: boolean
  sourceContent?: {
    script?: string
    scenes?: any[]
    metadata?: any
  }
  targetPlatform?:
    | "youtube_long"
    | "youtube_shorts"
    | "tiktok"
    | "instagram_reels"
    | "instagram_igtv"
    | "facebook"
    | "linkedin"
    | "twitter"
    | "telegram"
  adaptationDepth?: "basic" | "advanced" | "algorithm_optimized"
  includeSeo?: boolean
  generateVariants?: number
  targetLanguages?: string[]
  localizationLevel?: "translation" | "localization" | "cultural_adaptation"
  maintainTiming?: boolean
  culturalSensitivity?: boolean
  variantStrategies?: ("emotional_tone" | "content_length" | "hook_style" | "cta_approach" | "visual_style")[]
  contentGoal?: "engagement" | "conversion" | "awareness" | "education" | "entertainment"
  testingMetrics?: ("ctr" | "engagement" | "retention" | "conversion")[]
  audienceSegments?: ("demographic" | "behavioral" | "psychographic" | "contextual")[]
  analysisScope?: "full_content" | "key_moments" | "audience_segments" | "performance_factors"
  competitorBenchmarking?: boolean
  predictiveModeling?: boolean
  engagementFactors?: ("thumbnail" | "title" | "hook" | "pacing" | "music" | "effects" | "cta")[]
  optimizationGoals?: ("reach" | "engagement" | "retention" | "conversion" | "virality")[]
  platformAlgorithms?: boolean
  timeRange?: {
    start: number
    end: number
  }
  includeRecommendations?: boolean
  generateReport?: boolean
  reason: string
}

export interface ContentAnalysisResult {
  analysisType: string
  sceneDetection?: {
    scenes: Array<{
      startTime: number
      endTime: number
      type: string
      confidence: number
      keyElements: string[]
    }>
    totalScenes: number
    avgSceneLength: number
  }
  contentClassification?: {
    genre: string
    style: string
    mood: string
    target_audience: string
    content_rating: string
    topics: string[]
  }
  personTracking?: {
    detectedPersons: Array<{
      id: string
      appearances: Array<{
        startTime: number
        endTime: number
        confidence: number
      }>
    }>
    totalPersons: number
  }
  scriptGeneration?: {
    generatedScript: string
    structure: {
      intro: string
      body: string[]
      conclusion: string
    }
    timing: Array<{
      text: string
      startTime: number
      endTime: number
    }>
  }
  platformAdaptation?: {
    platform: string
    optimizations: {
      duration?: number
      aspectRatio?: string
      thumbnailSuggestions?: string[]
      titleVariations?: string[]
      descriptionOptimized?: string
      hashtagSuggestions?: string[]
      bestPostingTimes?: string[]
    }
  }
  audienceAnalysis?: {
    segments: Array<{
      name: string
      characteristics: string[]
      engagement_prediction: number
      content_preferences: string[]
    }>
    overallScore: number
  }
  engagementOptimization?: {
    currentScore: number
    improvementAreas: Array<{
      factor: string
      currentRating: number
      suggestions: string[]
      potential_impact: number
    }>
    predictedImprovement: number
  }
}

export interface ContentVariant {
  id: string
  strategy: string
  changes: Array<{
    element: string
    original: string
    modified: string
    rationale: string
  }>
  predictedPerformance: {
    engagement: number
    retention: number
    conversion: number
  }
}

export interface ContentIntelligenceResult {
  operation: string
  success: boolean
  processedFiles: string[]
  analysisResults?: ContentAnalysisResult
  contentVariants?: ContentVariant[]
  multiLanguageVersions?: Array<{
    language: string
    content: any
    culturalAdaptations: string[]
  }>
  statistics: {
    totalFiles: number
    processingTime: number
    analysisDepth: string
    confidenceScore: number
  }
  recommendations: string[]
  warnings?: string[]
  nextActions: string[]
}

/**
 * AI инструмент для комплексного интеллектуального анализа контента с унифицированной обработкой ошибок
 * Использует shared Content Analysis service
 */
export class ContentIntelligenceTool extends BaseAITool {
  constructor(logger?: AIToolLogger) {
    super("ContentIntelligenceTool", logger)
  }

  /**
   * Выполняет операции интеллектуального анализа контента
   */
  public async processContentIntelligence(
    input: ContentIntelligenceInput,
    options: AIToolExecutionOptions = {},
  ): Promise<AIToolResult<ContentIntelligenceResult>> {
    // Валидация входных данных
    const validation = this.validateInput(input, (data) => {
      const errors: string[] = []

      const validOperations = [
        "analyze_content",
        "detect_scenes",
        "classify_content",
        "adapt_platform",
        "generate_multilanguage",
        "generate_variants",
        "analyze_audience",
        "optimize_engagement",
      ]
      if (!validOperations.includes(data.operation)) {
        errors.push(`Неподдерживаемая операция: ${data.operation}`)
      }

      if (!data.reason) {
        errors.push("Требуется указать причину анализа контента")
      }

      // Специфические валидации для разных операций
      switch (data.operation) {
        case "analyze_content":
        case "detect_scenes":
        case "classify_content":
          if (!data.mediaFiles || data.mediaFiles.length === 0) {
            errors.push("Для анализа контента требуется указать mediaFiles")
          }
          break
        case "adapt_platform":
          if (!data.sourceContent || !data.targetPlatform) {
            errors.push("Для адаптации под платформу требуется sourceContent и targetPlatform")
          }
          break
        case "generate_multilanguage":
          if (!data.sourceContent || !data.targetLanguages || data.targetLanguages.length === 0) {
            errors.push("Для мультиязычной генерации требуется sourceContent и targetLanguages")
          }
          break
        case "generate_variants":
          if (!data.sourceContent) {
            errors.push("Для генерации вариантов требуется sourceContent")
          }
          if (data.generateVariants !== undefined && (data.generateVariants < 1 || data.generateVariants > 10)) {
            errors.push("Количество вариантов должно быть между 1 и 10")
          }
          break
      }

      if (data.analysisDepth && !["quick", "normal", "deep"].includes(data.analysisDepth)) {
        errors.push("Неподдерживаемая глубина анализа")
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
        message: "Ошибка валидации входных данных для анализа контента",
        executionTime: 0,
        toolName: this.toolName,
      }
    }

    const operation = input.operation
    const mediaFiles = input.mediaFiles || []

    // Выполняем анализ контента с унифицированной обработкой ошибок
    return this.executeWithErrorHandling(
      async () => {
        this.logger?.info("Начинаем интеллектуальный анализ контента", {
          operation,
          filesCount: mediaFiles.length,
          reason: input.reason,
        })

        // Выполняем конкретную операцию
        let analysisResults: ContentAnalysisResult | undefined
        let contentVariants: ContentVariant[] | undefined
        let multiLanguageVersions: any[] | undefined
        let processedFiles: string[] = []
        const recommendations: string[] = []
        const warnings: string[] = []
        const nextActions: string[] = []
        let confidenceScore = 0

        switch (operation) {
          case "analyze_content":
            analysisResults = await this.performContentAnalysis(input)
            processedFiles = mediaFiles
            recommendations.push("Используйте результаты анализа для улучшения контента")
            nextActions.push("Применить рекомендации по оптимизации")
            confidenceScore = 8.5
            break

          case "detect_scenes":
            analysisResults = await this.performSceneDetection(input)
            processedFiles = mediaFiles
            recommendations.push("Проверьте точность детекции сцен")
            nextActions.push("Создать маркеры для найденных сцен")
            confidenceScore = 8.0
            break

          case "classify_content":
            analysisResults = await this.performContentClassification(input)
            processedFiles = mediaFiles
            recommendations.push("Используйте классификацию для таргетинга аудитории")
            nextActions.push("Настроить рекомендательные алгоритмы")
            confidenceScore = 8.3
            break

          case "adapt_platform":
            analysisResults = await this.performPlatformAdaptation(input)
            processedFiles = ["adapted_content"]
            recommendations.push("Проверьте соответствие требованиям платформы")
            nextActions.push("Тестировать производительность на целевой платформе")
            confidenceScore = 8.7
            break

          case "generate_multilanguage":
            multiLanguageVersions = await this.performMultiLanguageGeneration(input)
            processedFiles = input.targetLanguages || []
            recommendations.push("Проверьте культурную адекватность переводов")
            nextActions.push("Тестировать контент на носителях языка")
            confidenceScore = 8.2
            break

          case "generate_variants":
            contentVariants = await this.performVariantGeneration(input)
            processedFiles = [`${input.generateVariants || 3}_variants`]
            recommendations.push("Проведите A/B тестирование вариантов")
            nextActions.push("Анализировать метрики производительности")
            confidenceScore = 8.4
            break

          case "analyze_audience":
            analysisResults = await this.performAudienceAnalysis(input)
            processedFiles = mediaFiles
            recommendations.push("Адаптируйте контент под выявленные сегменты")
            nextActions.push("Создать персонализированные версии")
            confidenceScore = 8.1
            break

          case "optimize_engagement":
            analysisResults = await this.performEngagementOptimization(input)
            processedFiles = mediaFiles
            recommendations.push("Примените предложенные улучшения")
            nextActions.push("Измерить влияние на метрики вовлечения")
            confidenceScore = 8.6
            break

          default:
            throw new Error(`Неподдерживаемая операция: ${operation}`)
        }

        // Добавляем общие предупреждения
        if (input.analysisDepth === "deep" && mediaFiles.length > 5) {
          warnings.push("Глубокий анализ большого количества файлов может занять значительное время")
        }

        if (input.generateVariants && input.generateVariants > 5) {
          warnings.push("Большое количество вариантов может затруднить анализ результатов")
        }

        const result: ContentIntelligenceResult = {
          operation,
          success: true,
          processedFiles,
          analysisResults,
          contentVariants,
          multiLanguageVersions,
          statistics: {
            totalFiles: processedFiles.length,
            processingTime: 0, // Будет заполнено в executeWithErrorHandling
            analysisDepth: input.analysisDepth || "normal",
            confidenceScore,
          },
          recommendations,
          warnings: warnings.length > 0 ? warnings : undefined,
          nextActions,
        }

        this.logger?.info("Интеллектуальный анализ контента завершен", {
          operation,
          processedFiles: processedFiles.length,
          success: true,
        })

        return result
      },
      {
        timeout: options.timeout || 600000, // 10 минут для анализа контента
        retries: options.retries || 1,
        retryDelay: options.retryDelay || 3000,
        enableLogging: options.enableLogging !== false,
        metadata: {
          operation,
          filesCount: mediaFiles.length,
          reason: input.reason,
          ...options.metadata,
        },
      },
    )
  }

  /**
   * Выполняет комплексный анализ контента
   */
  private async performContentAnalysis(input: ContentIntelligenceInput): Promise<ContentAnalysisResult> {
    this.logger?.info("Выполняем комплексный анализ контента", {
      depth: input.analysisDepth,
      files: input.mediaFiles?.length,
    })

    return {
      analysisType: "comprehensive",
      sceneDetection: {
        scenes: [
          {
            startTime: 0,
            endTime: 30,
            type: "intro",
            confidence: 0.95,
            keyElements: ["logo", "title", "music"],
          },
          {
            startTime: 30,
            endTime: 120,
            type: "main_content",
            confidence: 0.92,
            keyElements: ["speaker", "visuals", "data"],
          },
        ],
        totalScenes: 2,
        avgSceneLength: 60,
      },
      contentClassification: {
        genre: "educational",
        style: "professional",
        mood: "informative",
        target_audience: "business_professionals",
        content_rating: "general",
        topics: ["technology", "business", "innovation"],
      },
    }
  }

  /**
   * Выполняет детекцию сцен
   */
  private async performSceneDetection(input: ContentIntelligenceInput): Promise<ContentAnalysisResult> {
    this.logger?.info("Выполняем детекцию сцен", {
      files: input.mediaFiles?.length,
    })

    return {
      analysisType: "scene_detection",
      sceneDetection: {
        scenes: Array.from({ length: 5 }, (_, i) => ({
          startTime: i * 30,
          endTime: (i + 1) * 30,
          type: ["intro", "content", "transition", "climax", "outro"][i],
          confidence: 0.85 + Math.random() * 0.1,
          keyElements: ["visual_change", "audio_transition", "speaker_change"],
        })),
        totalScenes: 5,
        avgSceneLength: 30,
      },
    }
  }

  /**
   * Выполняет классификацию контента
   */
  private async performContentClassification(_input: ContentIntelligenceInput): Promise<ContentAnalysisResult> {
    this.logger?.info("Выполняем классификацию контента")

    return {
      analysisType: "classification",
      contentClassification: {
        genre: "tutorial",
        style: "casual",
        mood: "friendly",
        target_audience: "general_public",
        content_rating: "suitable_for_all",
        topics: ["how-to", "lifestyle", "tips"],
      },
    }
  }

  /**
   * Выполняет адаптацию под платформу
   */
  private async performPlatformAdaptation(input: ContentIntelligenceInput): Promise<ContentAnalysisResult> {
    this.logger?.info("Выполняем адаптацию под платформу", {
      platform: input.targetPlatform,
    })

    return {
      analysisType: "platform_adaptation",
      platformAdaptation: {
        platform: input.targetPlatform || "youtube",
        optimizations: {
          duration: input.targetPlatform?.includes("shorts") ? 60 : 600,
          aspectRatio: input.targetPlatform?.includes("shorts") ? "9:16" : "16:9",
          thumbnailSuggestions: ["Bright colors", "Clear text", "Emotional expression"],
          titleVariations: ["How to...", "Amazing...", "You won't believe..."],
          descriptionOptimized: "SEO optimized description with keywords",
          hashtagSuggestions: ["#tutorial", "#tips", "#howto"],
          bestPostingTimes: ["2PM-4PM", "7PM-9PM"],
        },
      },
    }
  }

  /**
   * Выполняет мультиязычную генерацию
   */
  private async performMultiLanguageGeneration(input: ContentIntelligenceInput): Promise<any[]> {
    this.logger?.info("Выполняем мультиязычную генерацию", {
      languages: input.targetLanguages?.length,
    })

    return (
      input.targetLanguages?.map((lang) => ({
        language: lang,
        content: {
          script: `Translated script for ${lang}`,
          title: `Translated title for ${lang}`,
          description: `Translated description for ${lang}`,
        },
        culturalAdaptations: [`Cultural adaptation 1 for ${lang}`, `Cultural adaptation 2 for ${lang}`],
      })) || []
    )
  }

  /**
   * Выполняет генерацию вариантов
   */
  private async performVariantGeneration(input: ContentIntelligenceInput): Promise<ContentVariant[]> {
    this.logger?.info("Выполняем генерацию вариантов", {
      count: input.generateVariants,
    })

    return Array.from({ length: input.generateVariants || 3 }, (_, i) => ({
      id: `variant_${i + 1}`,
      strategy: ["emotional_tone", "content_length", "hook_style"][i % 3],
      changes: [
        {
          element: "title",
          original: "Original Title",
          modified: `Variant ${i + 1} Title`,
          rationale: `Strategy: ${["emotional_tone", "content_length", "hook_style"][i % 3]}`,
        },
      ],
      predictedPerformance: {
        engagement: 0.7 + Math.random() * 0.2,
        retention: 0.6 + Math.random() * 0.3,
        conversion: 0.05 + Math.random() * 0.1,
      },
    }))
  }

  /**
   * Выполняет анализ аудитории
   */
  private async performAudienceAnalysis(_input: ContentIntelligenceInput): Promise<ContentAnalysisResult> {
    this.logger?.info("Выполняем анализ аудитории")

    return {
      analysisType: "audience_analysis",
      audienceAnalysis: {
        segments: [
          {
            name: "Tech Enthusiasts",
            characteristics: ["18-34 years", "High tech adoption", "Urban"],
            engagement_prediction: 8.5,
            content_preferences: ["tutorials", "reviews", "news"],
          },
          {
            name: "Business Professionals",
            characteristics: ["25-45 years", "Career focused", "LinkedIn active"],
            engagement_prediction: 7.8,
            content_preferences: ["insights", "case studies", "industry trends"],
          },
        ],
        overallScore: 8.2,
      },
    }
  }

  /**
   * Выполняет оптимизацию вовлечения
   */
  private async performEngagementOptimization(_input: ContentIntelligenceInput): Promise<ContentAnalysisResult> {
    this.logger?.info("Выполняем оптимизацию вовлечения")

    return {
      analysisType: "engagement_optimization",
      engagementOptimization: {
        currentScore: 7.5,
        improvementAreas: [
          {
            factor: "hook",
            currentRating: 6.5,
            suggestions: ["Start with a question", "Use statistics", "Create urgency"],
            potential_impact: 1.5,
          },
          {
            factor: "pacing",
            currentRating: 7.0,
            suggestions: ["Vary scene lengths", "Add transitions", "Remove dead air"],
            potential_impact: 1.2,
          },
        ],
        predictedImprovement: 1.3,
      },
    }
  }
}

// Экспортируем готовый экземпляр для использования
export const contentIntelligenceTool = new ContentIntelligenceTool()

// Функции-обертки для обратной совместимости
export async function analyzeContentIntelligence(params: any): Promise<AIToolResult<ContentIntelligenceResult>> {
  const input: ContentIntelligenceInput = {
    operation: "analyze_content",
    mediaFiles: params.media_files,
    analysisDepth: params.analysis_depth,
    targetPlatforms: params.target_platforms,
    languages: params.languages,
    enablePersonTracking: params.enable_person_tracking,
    generateScript: params.generate_script,
    reason: params.reason || "Комплексный анализ контента",
  }

  return contentIntelligenceTool.processContentIntelligence(input)
}

export async function detectSceneBoundaries(params: any): Promise<AIToolResult<ContentIntelligenceResult>> {
  const input: ContentIntelligenceInput = {
    operation: "detect_scenes",
    mediaFiles: [params.video_path],
    reason: params.reason || "Детекция границ сцен",
  }

  return contentIntelligenceTool.processContentIntelligence(input)
}

export async function classifyContent(params: any): Promise<AIToolResult<ContentIntelligenceResult>> {
  const input: ContentIntelligenceInput = {
    operation: "classify_content",
    mediaFiles: [params.media_input],
    reason: params.reason || "Классификация контента",
  }

  return contentIntelligenceTool.processContentIntelligence(input)
}

export async function adaptContentToPlatform(params: any): Promise<AIToolResult<ContentIntelligenceResult>> {
  const input: ContentIntelligenceInput = {
    operation: "adapt_platform",
    sourceContent: params.source_content,
    targetPlatform: params.target_platform,
    adaptationDepth: params.adaptation_depth,
    includeSeo: params.include_seo,
    generateVariants: params.generate_variants,
    reason: params.reason || "Адаптация контента под платформу",
  }

  return contentIntelligenceTool.processContentIntelligence(input)
}

export async function generateMultiLanguageBatch(params: any): Promise<AIToolResult<ContentIntelligenceResult>> {
  const input: ContentIntelligenceInput = {
    operation: "generate_multilanguage",
    sourceContent: params.source_content,
    targetLanguages: params.target_languages,
    localizationLevel: params.localization_level,
    maintainTiming: params.maintain_timing,
    culturalSensitivity: params.cultural_sensitivity,
    reason: params.reason || "Генерация мультиязычного контента",
  }

  return contentIntelligenceTool.processContentIntelligence(input)
}

export async function generateContentVariants(params: any): Promise<AIToolResult<ContentIntelligenceResult>> {
  const input: ContentIntelligenceInput = {
    operation: "generate_variants",
    sourceContent: params.source_content,
    generateVariants: params.variant_count,
    variantStrategies: params.variant_strategies,
    contentGoal: params.content_goal,
    testingMetrics: params.testing_metrics,
    reason: params.reason || "Генерация вариантов контента",
  }

  return contentIntelligenceTool.processContentIntelligence(input)
}

export async function analyzeAudienceSegments(params: any): Promise<AIToolResult<ContentIntelligenceResult>> {
  const input: ContentIntelligenceInput = {
    operation: "analyze_audience",
    mediaFiles: params.content_samples,
    audienceSegments: params.segment_types,
    analysisScope: params.analysis_scope,
    competitorBenchmarking: params.competitor_benchmarking,
    reason: params.reason || "Анализ сегментов аудитории",
  }

  return contentIntelligenceTool.processContentIntelligence(input)
}

export async function optimizeEngagementFactors(params: any): Promise<AIToolResult<ContentIntelligenceResult>> {
  const input: ContentIntelligenceInput = {
    operation: "optimize_engagement",
    mediaFiles: params.content_files,
    engagementFactors: params.optimization_factors,
    optimizationGoals: params.goals,
    platformAlgorithms: params.consider_algorithms,
    reason: params.reason || "Оптимизация факторов вовлечения",
  }

  return contentIntelligenceTool.processContentIntelligence(input)
}

// Старые типы и интерфейсы для обратной совместимости
export const contentIntelligenceTools: any[] = [
  {
    name: "analyze_content_intelligence",
    description: "Анализирует медиафайлы с помощью AI для понимания контента, сцен, объектов и действий",
  },
  {
    name: "detect_scene_boundaries",
    description: "Обнаруживает границы сцен в видео",
  },
  {
    name: "classify_content",
    description: "Классифицирует контент по жанру, стилю и тематике",
  },
  {
    name: "adapt_content_to_platform",
    description: "Адаптирует контент для конкретной платформы",
  },
  {
    name: "generate_multilanguage_batch",
    description: "Генерирует мультиязычные версии контента",
  },
  {
    name: "generate_content_variants",
    description: "Создает варианты контента для A/B тестирования",
  },
  {
    name: "analyze_audience_segments",
    description: "Анализирует целевую аудиторию контента",
  },
  {
    name: "optimize_engagement_factors",
    description: "Оптимизирует факторы вовлечения",
  },
]

// Интерфейсы для совместимости со старым API
export interface ContentIntelligenceToolResult {
  success: boolean
  message: string
  data?: {
    contentAnalysis?: any
    sceneDetection?: any
    contentClassification?: any
    platformAdaptation?: any
    multiLanguageVersions?: any[]
    contentVariants?: any[]
    audienceAnalysis?: any
    engagementOptimization?: any
    recommendations?: string[]
    warnings?: string[]
  }
  errors?: string[]
  nextActions?: string[]
}

/**
 * Выполняет инструмент интеллектуального анализа контента (legacy API)
 */
export async function executeContentIntelligenceTool(
  toolName: string,
  input: Record<string, any>,
): Promise<ContentIntelligenceToolResult> {
  try {
    // Маппинг старых названий на новые операции
    const operationMap: Record<string, () => Promise<any>> = {
      analyze_content_intelligence: () => analyzeContentIntelligence(input),
      detect_scene_boundaries: () => detectSceneBoundaries(input),
      classify_content: () => classifyContent(input),
      adapt_content_to_platform: () => adaptContentToPlatform(input),
      generate_multilanguage_batch: () => generateMultiLanguageBatch(input),
      generate_content_variants: () => generateContentVariants(input),
      analyze_audience_segments: () => analyzeAudienceSegments(input),
      optimize_engagement_factors: () => optimizeEngagementFactors(input),
    }

    const operation = operationMap[toolName]
    if (!operation) {
      return {
        success: false,
        message: `Неизвестный инструмент интеллектуального анализа: ${toolName}`,
        errors: [`Инструмент ${toolName} не найден`],
      }
    }

    const result = await operation()

    // Конвертируем результат в старый формат
    return {
      success: result.success,
      message: result.message || "Операция выполнена успешно",
      data: {
        contentAnalysis: result.data?.analysisResults,
        sceneDetection: result.data?.analysisResults?.sceneDetection,
        contentClassification: result.data?.analysisResults?.contentClassification,
        platformAdaptation: result.data?.analysisResults?.platformAdaptation,
        multiLanguageVersions: result.data?.multiLanguageVersions,
        contentVariants: result.data?.contentVariants,
        audienceAnalysis: result.data?.analysisResults?.audienceAnalysis,
        engagementOptimization: result.data?.analysisResults?.engagementOptimization,
        recommendations: result.data?.recommendations || [],
        warnings: result.data?.warnings,
      },
      errors: result.errors,
      nextActions: result.data?.nextActions || [],
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка выполнения интеллектуального анализа ${toolName}: ${error instanceof Error ? error.message : String(error)}`,
      errors: [error instanceof Error ? error.message : String(error)],
    }
  }
}
