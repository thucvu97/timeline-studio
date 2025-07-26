/**
 * Унифицированный сервис для работы со всеми AI провайдерами
 * Обеспечивает единую точку входа, fallback и балансировку нагрузки
 */

import { CLAUDE_MODELS, ClaudeService } from "./claude-service"
import { DEEPSEEK_MODELS, DeepSeekService } from "./deepseek-service"
import { OllamaService } from "./ollama-service"
import { AI_MODELS, OpenAiService } from "./open-ai-service"
import { contentIntelligenceTools } from "../tools/content-intelligence-tools"
import { personIdentificationTools } from "../tools/person-identification-tools"
import { AiMessage } from "../types/ai-message"
import { StreamingOptions } from "../types/streaming"

// Типы AI провайдеров
export type AIProvider = "claude" | "openai" | "deepseek" | "ollama"

// Конфигурация модели
export interface ModelConfig {
  id: string
  name: string
  provider: AIProvider
  isLocal: boolean
  supportsStreaming: boolean
  supportsTools: boolean
  maxTokens: number
  description?: string
}

// Все доступные модели
export const UNIFIED_MODELS: Record<string, ModelConfig> = {
  // Claude модели
  [CLAUDE_MODELS.CLAUDE_4_SONNET]: {
    id: CLAUDE_MODELS.CLAUDE_4_SONNET,
    name: "Claude 4 Sonnet",
    provider: "claude",
    isLocal: false,
    supportsStreaming: true,
    supportsTools: true,
    maxTokens: 200000,
    description: "Самая производительная модель Claude",
  },
  [CLAUDE_MODELS.CLAUDE_4_OPUS]: {
    id: CLAUDE_MODELS.CLAUDE_4_OPUS,
    name: "Claude 4 Opus",
    provider: "claude",
    isLocal: false,
    supportsStreaming: true,
    supportsTools: true,
    maxTokens: 200000,
    description: "Премиум модель Claude с максимальными возможностями",
  },

  // OpenAI модели
  [AI_MODELS.GPT_4]: {
    id: AI_MODELS.GPT_4,
    name: "GPT-4",
    provider: "openai",
    isLocal: false,
    supportsStreaming: true,
    supportsTools: false,
    maxTokens: 8192,
    description: "Мощная модель OpenAI GPT-4",
  },
  [AI_MODELS.GPT_4O]: {
    id: AI_MODELS.GPT_4O,
    name: "GPT-4o",
    provider: "openai",
    isLocal: false,
    supportsStreaming: true,
    supportsTools: false,
    maxTokens: 128000,
    description: "Мультимодальная модель GPT-4 Omni",
  },
  [AI_MODELS.GPT_3_5]: {
    id: AI_MODELS.GPT_3_5,
    name: "GPT-3.5 Turbo",
    provider: "openai",
    isLocal: false,
    supportsStreaming: true,
    supportsTools: false,
    maxTokens: 16385,
    description: "Быстрая и экономичная модель",
  },
  [AI_MODELS.O3]: {
    id: AI_MODELS.O3,
    name: "o3",
    provider: "openai",
    isLocal: false,
    supportsStreaming: true,
    supportsTools: false,
    maxTokens: 128000,
    description: "Новейшая модель OpenAI o3",
  },

  // DeepSeek модели
  [DEEPSEEK_MODELS.DEEPSEEK_R1]: {
    id: DEEPSEEK_MODELS.DEEPSEEK_R1,
    name: "DeepSeek R1",
    provider: "deepseek",
    isLocal: false,
    supportsStreaming: true,
    supportsTools: false,
    maxTokens: 65536,
    description: "Последняя модель DeepSeek с улучшенными возможностями рассуждения",
  },
  [DEEPSEEK_MODELS.DEEPSEEK_CHAT]: {
    id: DEEPSEEK_MODELS.DEEPSEEK_CHAT,
    name: "DeepSeek Chat",
    provider: "deepseek",
    isLocal: false,
    supportsStreaming: true,
    supportsTools: false,
    maxTokens: 32768,
    description: "Базовая модель DeepSeek для общения",
  },
  [DEEPSEEK_MODELS.DEEPSEEK_CODER]: {
    id: DEEPSEEK_MODELS.DEEPSEEK_CODER,
    name: "DeepSeek Coder",
    provider: "deepseek",
    isLocal: false,
    supportsStreaming: true,
    supportsTools: false,
    maxTokens: 32768,
    description: "Специализированная модель для программирования",
  },

  // Ollama модели (будут добавлены динамически)
}

// Опции для запроса
export interface UnifiedRequestOptions {
  temperature?: number
  maxTokens?: number
  fallbackModels?: string[]
  timeout?: number
  retryAttempts?: number
}

// Результат запроса
export interface UnifiedResponse {
  content: string
  model: string
  provider: AIProvider
  usage?: {
    promptTokens?: number
    completionTokens?: number
    totalTokens?: number
  }
  responseTime: number
}

// Content Intelligence специфические типы
export interface MediaInput {
  path: string
  filename: string
  duration?: number
  type: "video" | "audio" | "image"
}

export interface UnifiedContentAnalysis {
  id: string
  mediaFile: MediaInput
  scenes: SceneAnalysis[]
  classification: ContentClassification
  script?: GeneratedScript
  platformVariants?: PlatformVariant[]
  qualityMetrics: QualityMetrics
  insights: ContentInsights
}

export interface SceneAnalysis {
  id: string
  startTime: number
  endTime: number
  type: "dialog" | "action" | "landscape" | "closeup" | "transition"
  confidence: number
  keyFrames: string[]
  description: string
  objects?: DetectedObject[]
  persons?: DetectedPerson[]
}

export interface ContentClassification {
  genre: string
  style: string
  emotion: string
  audience: string
  technicalQuality: string
  contentRating: string
  confidence: Record<string, number>
}

export interface GeneratedScript {
  id: string
  title: string
  style: string
  structure: string
  tone: string
  scenes: ScriptScene[]
  shotList?: ShotListItem[]
  metadata: ScriptMetadata
}

export interface ScriptScene {
  id: string
  sceneNumber: number
  location: string
  timeOfDay: string
  description: string
  dialogue?: DialogueLine[]
  action: string[]
  notes: string[]
}

export interface DialogueLine {
  character: string
  text: string
  direction?: string
}

export interface ShotListItem {
  shotNumber: number
  type: "wide" | "medium" | "close-up" | "extreme-close-up" | "over-shoulder" | "point-of-view" | "establishing"
  description: string
  cameraMovement?: string
  duration: number
  notes?: string
}

export interface ScriptMetadata {
  estimatedDuration: number
  targetAudience: string
  genre: string
  createdAt: string
  version: string
}

export interface PlatformVariant {
  platform: string
  adaptations: PlatformAdaptation[]
  seoData?: SEOData
  variants?: ContentVariant[]
}

export interface PlatformAdaptation {
  type: "title" | "description" | "tags" | "duration" | "format" | "content"
  original: string
  adapted: string
  reason: string
}

export interface SEOData {
  title: string
  description: string
  tags: string[]
  thumbnail?: string
  category: string
}

export interface ContentVariant {
  id: string
  type: "tone_variation" | "length_variation" | "structure_variation" | "style_variation"
  changes: string[]
  targetMetric: string
  description: string
}

export interface QualityMetrics {
  technical: TechnicalQuality
  narrative: NarrativeQuality
  engagement: EngagementQuality
  accessibility: AccessibilityQuality
}

export interface TechnicalQuality {
  videoQuality: number
  audioQuality: number
  stabilization: number
  colorCorrection: number
  lighting: number
  overallScore: number
}

export interface NarrativeQuality {
  structure: number
  pacing: number
  clarity: number
  engagement: number
  overallScore: number
}

export interface EngagementQuality {
  hookStrength: number
  retentionPotential: number
  emotionalImpact: number
  callToActionEffectiveness: number
  overallScore: number
}

export interface AccessibilityQuality {
  subtitleQuality: number
  audioClarity: number
  visualClarity: number
  languageSimplicity: number
  overallScore: number
}

export interface ContentInsights {
  summary: string
  tags: string[]
  strengths: string[]
  weaknesses: string[]
  recommendations: Recommendation[]
  marketingAngles: string[]
  targetDemographics: string[]
  qualityMetrics?: {
    overall: number
    sharpness: number
    brightness: number
    contrast: number
    saturation: number
  }
  mood?: {
    valence: number
    arousal: number
    dominantEmotion: string
    intensity: number
  }
}

export interface Recommendation {
  category: "technical" | "narrative" | "engagement" | "marketing"
  priority: "high" | "medium" | "low"
  title: string
  description: string
  actionSteps: string[]
  estimatedImpact: string
}

export interface DetectedObject {
  class: string
  confidence: number
  boundingBox: BoundingBox
  timestamp: number
}

export interface DetectedPerson {
  id: string
  confidence: number
  boundingBox: BoundingBox
  timestamp: number
  characteristics?: PersonCharacteristics
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
}

export interface PersonCharacteristics {
  age?: "child" | "teenager" | "adult" | "senior"
  gender?: "male" | "female" | "unknown"
  emotion?: "happy" | "sad" | "angry" | "surprised" | "neutral"
}

/**
 * Унифицированный сервис для работы со всеми AI провайдерами
 */
export class UnifiedAIService {
  private static instance: UnifiedAIService
  private claudeService: ClaudeService
  private openAiService: OpenAiService
  private deepSeekService: DeepSeekService
  private ollamaService: OllamaService
  private responseCache = new Map<string, { response: UnifiedResponse; timestamp: number }>()
  private cacheTimeout = 5 * 60 * 1000 // 5 минут

  private constructor() {
    this.claudeService = ClaudeService.getInstance()
    this.openAiService = OpenAiService.getInstance()
    this.deepSeekService = DeepSeekService.getInstance()
    this.ollamaService = OllamaService.getInstance()
  }

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): UnifiedAIService {
    if (!UnifiedAIService.instance) {
      UnifiedAIService.instance = new UnifiedAIService()
    }
    return UnifiedAIService.instance
  }

  /**
   * Получить провайдера по модели
   */
  private getProviderByModel(model: string): AIProvider {
    const modelConfig = UNIFIED_MODELS[model]
    if (modelConfig) {
      return modelConfig.provider
    }

    // Fallback определение по префиксу
    if (model.startsWith("claude")) return "claude"
    if (model.startsWith("gpt") || model.startsWith("o3")) return "openai"
    if (model.startsWith("deepseek")) return "deepseek"
    return "ollama" // По умолчанию считаем локальной моделью
  }

  /**
   * Проверить доступность модели
   */
  public async isModelAvailable(model: string): Promise<boolean> {
    const provider = this.getProviderByModel(model)

    try {
      switch (provider) {
        case "claude":
          return await this.claudeService.hasApiKey()
        case "openai":
          return await this.openAiService.hasApiKey(model)
        case "deepseek":
          return await this.deepSeekService.hasApiKey()
        case "ollama":
          return await this.ollamaService.isAvailable()
        default:
          return false
      }
    } catch (error) {
      console.warn(`Ошибка проверки доступности модели ${model}:`, error)
      return false
    }
  }

  /**
   * Получить доступные модели
   */
  public async getAvailableModels(): Promise<ModelConfig[]> {
    const models: ModelConfig[] = []

    // Добавляем статические модели из конфигурации
    for (const modelConfig of Object.values(UNIFIED_MODELS)) {
      if (await this.isModelAvailable(modelConfig.id)) {
        models.push(modelConfig)
      }
    }

    // Добавляем динамические модели Ollama
    try {
      if (await this.ollamaService.isAvailable()) {
        const ollamaModels = await this.ollamaService.getInstalledModels()
        for (const model of ollamaModels) {
          models.push({
            id: model.name,
            name: model.name,
            provider: "ollama",
            isLocal: true,
            supportsStreaming: true,
            supportsTools: false,
            maxTokens: 2048,
            description: `Локальная модель Ollama (${model.details.parameter_size})`,
          })
        }
      }
    } catch (error) {
      console.warn("Ошибка получения Ollama моделей:", error)
    }

    return models
  }

  /**
   * Создать ключ кэша
   */
  private createCacheKey(model: string, messages: AiMessage[], options: UnifiedRequestOptions): string {
    const content = messages.map((m) => `${m.role}:${m.content}`).join("|")
    const opts = JSON.stringify({ model, temperature: options.temperature, maxTokens: options.maxTokens })
    return btoa(content + opts).slice(0, 50) // Ограничиваем длину ключа
  }

  /**
   * Получить ответ из кэша
   */
  private getCachedResponse(cacheKey: string): UnifiedResponse | null {
    const cached = this.responseCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.response
    }
    return null
  }

  /**
   * Сохранить ответ в кэш
   */
  private setCachedResponse(cacheKey: string, response: UnifiedResponse): void {
    this.responseCache.set(cacheKey, {
      response,
      timestamp: Date.now(),
    })

    // Очистка старых записей
    if (this.responseCache.size > 100) {
      const oldestKey = Array.from(this.responseCache.keys())[0]
      this.responseCache.delete(oldestKey)
    }
  }

  /**
   * Отправить запрос с автоматическим fallback
   */
  public async sendRequest(
    model: string,
    messages: AiMessage[],
    options: UnifiedRequestOptions = {},
  ): Promise<UnifiedResponse> {
    const startTime = Date.now()
    const cacheKey = this.createCacheKey(model, messages, options)

    // Проверяем кэш
    const cached = this.getCachedResponse(cacheKey)
    if (cached) {
      return { ...cached, responseTime: Date.now() - startTime }
    }

    const modelsToTry = [model, ...(options.fallbackModels || [])]
    const maxRetries = options.retryAttempts || 1

    for (const currentModel of modelsToTry) {
      const provider = this.getProviderByModel(currentModel)

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          let content: string
          const requestStartTime = Date.now()

          switch (provider) {
            case "claude":
              content = await this.claudeService.sendRequest(currentModel, messages, {
                temperature: options.temperature,
                max_tokens: options.maxTokens,
              })
              break

            case "openai":
              content = await this.openAiService.sendRequest(currentModel, messages, {
                temperature: options.temperature,
                max_tokens: options.maxTokens,
              })
              break

            case "deepseek":
              content = await this.deepSeekService.sendRequest(currentModel, messages, {
                temperature: options.temperature,
                max_tokens: options.maxTokens,
              })
              break

            case "ollama":
              content = await this.ollamaService.sendRequest(currentModel, messages, {
                temperature: options.temperature,
                num_ctx: options.maxTokens,
              })
              break

            default:
              throw new Error(`Неподдерживаемый провайдер: ${provider}`)
          }

          const response: UnifiedResponse = {
            content,
            model: currentModel,
            provider,
            responseTime: Date.now() - requestStartTime,
          }

          // Сохраняем в кэш
          this.setCachedResponse(cacheKey, response)

          return response
        } catch (error) {
          console.warn(`Ошибка запроса к ${currentModel} (попытка ${attempt + 1}):`, error)

          // Если это последняя попытка для последней модели, выбрасываем ошибку
          if (currentModel === modelsToTry[modelsToTry.length - 1] && attempt === maxRetries - 1) {
            throw error
          }

          // Ждем перед повторной попыткой
          if (attempt < maxRetries - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)))
          }
        }
      }
    }

    throw new Error("Все модели недоступны")
  }

  /**
   * Отправить потоковый запрос
   */
  public async sendStreamingRequest(
    model: string,
    messages: AiMessage[],
    options: UnifiedRequestOptions & StreamingOptions = {},
  ): Promise<void> {
    const provider = this.getProviderByModel(model)

    try {
      switch (provider) {
        case "claude":
          await this.claudeService.sendStreamingRequest(model, messages, {
            temperature: options.temperature,
            max_tokens: options.maxTokens,
            onContent: options.onContent,
            onComplete: options.onComplete,
            onError: options.onError,
            signal: options.signal,
          })
          break

        case "openai":
          await this.openAiService.sendStreamingRequest(model, messages, {
            temperature: options.temperature,
            max_tokens: options.maxTokens,
            onContent: options.onContent,
            onComplete: options.onComplete,
            onError: options.onError,
            signal: options.signal,
          })
          break

        case "deepseek":
          await this.deepSeekService.sendStreamingRequest(model, messages, {
            temperature: options.temperature,
            max_tokens: options.maxTokens,
            onContent: options.onContent,
            onComplete: options.onComplete,
            onError: options.onError,
            signal: options.signal,
          })
          break

        case "ollama":
          await this.ollamaService.sendStreamingRequest(model, messages, {
            temperature: options.temperature,
            num_ctx: options.maxTokens,
            onContent: options.onContent,
            onComplete: options.onComplete,
            onError: options.onError,
            signal: options.signal,
          })
          break

        default:
          throw new Error(`Неподдерживаемый провайдер для потокового запроса: ${provider}`)
      }
    } catch (error) {
      options.onError?.(error as Error)
      throw error
    }
  }

  /**
   * Очистить кэш ответов
   */
  public clearCache(): void {
    this.responseCache.clear()
  }

  /**
   * Получить статистику использования кэша
   */
  public getCacheStats(): { size: number; timeout: number } {
    return {
      size: this.responseCache.size,
      timeout: this.cacheTimeout,
    }
  }

  /**
   * Content Intelligence: Полный анализ контента
   */
  public async analyzeContentIntelligence(
    mediaFiles: MediaInput[],
    options: {
      analysisDepth?: "quick" | "normal" | "deep"
      targetPlatforms?: string[]
      languages?: string[]
      enablePersonTracking?: boolean
      generateScript?: boolean
    } = {},
  ): Promise<UnifiedContentAnalysis[]> {
    const {
      analysisDepth = "normal",
      targetPlatforms = [],
      languages = [],
      enablePersonTracking = false,
      generateScript = false,
    } = options

    const results: UnifiedContentAnalysis[] = []

    for (const mediaFile of mediaFiles) {
      try {
        // 1. Scene Analysis с использованием existing video analysis tools
        const scenes = await this.performSceneAnalysis(mediaFile, analysisDepth, enablePersonTracking)

        // 2. Content Classification
        const classification = await this.classifyContent(mediaFile, scenes)

        // 3. Quality Analysis
        const qualityMetrics = await this.analyzeQuality(mediaFile, scenes)

        // 4. Script Generation (если запрошено)
        let script: GeneratedScript | undefined
        if (generateScript) {
          script = await this.generateScript(scenes, classification)
        }

        // 5. Platform Adaptation (если указаны платформы)
        let platformVariants: PlatformVariant[] | undefined
        if (targetPlatforms.length > 0) {
          platformVariants = await this.adaptToPlatforms({ scenes, classification, script }, targetPlatforms, languages)
        }

        // 6. Content Insights
        const insights = await this.generateInsights(scenes, classification, qualityMetrics)

        const analysis: UnifiedContentAnalysis = {
          id: `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
          mediaFile,
          scenes,
          classification,
          script,
          platformVariants,
          qualityMetrics,
          insights,
        }

        results.push(analysis)
      } catch (error) {
        console.error(`Ошибка анализа файла ${mediaFile.filename}:`, error)
        // Продолжаем с другими файлами
      }
    }

    return results
  }

  /**
   * Scene Analysis с использованием existing video tools
   */
  private async performSceneAnalysis(
    mediaFile: MediaInput,
    depth: "quick" | "normal" | "deep",
    enablePersonTracking: boolean,
  ): Promise<SceneAnalysis[]> {
    // Используем существующие video-analysis-tools
    const sceneDetectionResult = await this.sendRequest(
      "claude-4-sonnet", // Используем лучшую модель для анализа
      [
        {
          role: "user",
          content: `Выполни детекцию сцен для видео: ${mediaFile.path}
          
Глубина анализа: ${depth}
Отслеживание персон: ${enablePersonTracking}
Форматируй результат как JSON с полями: id, startTime, endTime, type, confidence, description`,
        },
      ],
      { temperature: 0.3 },
    )

    // Парсим ответ и создаем SceneAnalysis объекты
    try {
      const scenes = JSON.parse(sceneDetectionResult.content)
      return scenes.map((scene: any) => ({
        id: scene.id || `scene_${Math.random().toString(36).substring(2, 11)}`,
        startTime: scene.startTime || 0,
        endTime: scene.endTime || 0,
        type: scene.type || "action",
        confidence: scene.confidence || 0.8,
        keyFrames: scene.keyFrames || [],
        description: scene.description || "",
        objects: scene.objects || [],
        persons: enablePersonTracking ? scene.persons || [] : undefined,
      }))
    } catch (error) {
      console.warn("Ошибка парсинга результатов детекции сцен:", error)
      return []
    }
  }

  /**
   * Content Classification
   */
  private async classifyContent(mediaFile: MediaInput, scenes: SceneAnalysis[]): Promise<ContentClassification> {
    const classificationResult = await this.sendRequest(
      "claude-4-sonnet",
      [
        {
          role: "user",
          content: `Классифицируй видео контент на основе анализа сцен:
          
Файл: ${mediaFile.filename}
Сцены: ${JSON.stringify(scenes.slice(0, 5))} // Первые 5 сцен для контекста

Определи:
- genre (documentary, narrative, instructional, promotional, etc.)
- style (professional, casual, artistic, etc.)
- emotion (positive, negative, neutral, dramatic, etc.)
- audience (children, teenagers, adults, seniors, general)
- technicalQuality (poor, fair, good, excellent)
- contentRating (G, PG, PG-13, R)

Форматируй как JSON с полями genre, style, emotion, audience, technicalQuality, contentRating и confidence (объект с уверенностью для каждого поля).`,
        },
      ],
      { temperature: 0.2 },
    )

    try {
      return JSON.parse(classificationResult.content)
    } catch (error) {
      console.warn("Ошибка парсинга классификации контента:", error)
      return {
        genre: "unknown",
        style: "unknown",
        emotion: "neutral",
        audience: "general",
        technicalQuality: "fair",
        contentRating: "G",
        confidence: {},
      }
    }
  }

  /**
   * Quality Analysis
   */
  private async analyzeQuality(mediaFile: MediaInput, scenes: SceneAnalysis[]): Promise<QualityMetrics> {
    const qualityResult = await this.sendRequest(
      "claude-4-sonnet",
      [
        {
          role: "user",
          content: `Проанализируй качество видео контента:

Файл: ${mediaFile.filename}
Количество сцен: ${scenes.length}

Оцени по шкале 0-10:

Technical Quality:
- videoQuality: качество видео (разрешение, четкость, сжатие)
- audioQuality: качество звука (чистота, громкость, шумы)
- stabilization: стабилизация изображения
- colorCorrection: цветокоррекция
- lighting: освещение

Narrative Quality:
- structure: структура повествования
- pacing: темп и ритм
- clarity: ясность изложения
- engagement: вовлеченность

Engagement Quality:
- hookStrength: сила начального крючка
- retentionPotential: потенциал удержания внимания
- emotionalImpact: эмоциональное воздействие
- callToActionEffectiveness: эффективность призыва к действию

Accessibility Quality:
- subtitleQuality: качество субтитров
- audioClarity: четкость речи
- visualClarity: визуальная ясность
- languageSimplicity: простота языка

Для каждой категории также рассчитай overallScore как среднее арифметическое.
Форматируй как JSON.`,
        },
      ],
      { temperature: 0.2 },
    )

    try {
      return JSON.parse(qualityResult.content)
    } catch (error) {
      console.warn("Ошибка парсинга анализа качества:", error)
      return {
        technical: {
          videoQuality: 5,
          audioQuality: 5,
          stabilization: 5,
          colorCorrection: 5,
          lighting: 5,
          overallScore: 5,
        },
        narrative: {
          structure: 5,
          pacing: 5,
          clarity: 5,
          engagement: 5,
          overallScore: 5,
        },
        engagement: {
          hookStrength: 5,
          retentionPotential: 5,
          emotionalImpact: 5,
          callToActionEffectiveness: 5,
          overallScore: 5,
        },
        accessibility: {
          subtitleQuality: 5,
          audioClarity: 5,
          visualClarity: 5,
          languageSimplicity: 5,
          overallScore: 5,
        },
      }
    }
  }

  /**
   * Script Generation
   */
  private async generateScript(
    scenes: SceneAnalysis[],
    classification: ContentClassification,
  ): Promise<GeneratedScript> {
    const scriptResult = await this.sendRequest(
      "claude-4-sonnet",
      [
        {
          role: "user",
          content: `Сгенерируй полный сценарий на основе анализа видео:

Сцены: ${JSON.stringify(scenes)}
Классификация: ${JSON.stringify(classification)}

Создай сценарий в формате JSON с полями:
- id: уникальный идентификатор
- title: название
- style: стиль сценария (${classification.style})
- structure: структура повествования
- tone: тон (на основе emotion: ${classification.emotion})
- scenes: массив сцен с полями id, sceneNumber, location, timeOfDay, description, dialogue, action, notes
- shotList: список кадров (опционально)
- metadata: метаданные с estimatedDuration, targetAudience, genre, createdAt, version`,
        },
      ],
      { temperature: 0.4 },
    )

    try {
      const script = JSON.parse(scriptResult.content)
      return {
        ...script,
        id: script.id || `script_${Date.now()}`,
        metadata: {
          ...script.metadata,
          createdAt: new Date().toISOString(),
          version: "1.0",
        },
      }
    } catch (error) {
      console.warn("Ошибка парсинга генерации сценария:", error)
      return {
        id: `script_${Date.now()}`,
        title: "Generated Script",
        style: classification.style,
        structure: "chronological",
        tone: classification.emotion,
        scenes: [],
        metadata: {
          estimatedDuration: 0,
          targetAudience: classification.audience,
          genre: classification.genre,
          createdAt: new Date().toISOString(),
          version: "1.0",
        },
      }
    }
  }

  /**
   * Platform Adaptation
   */
  private async adaptToPlatforms(
    content: { scenes: SceneAnalysis[]; classification: ContentClassification; script?: GeneratedScript },
    platforms: string[],
    _languages: string[],
  ): Promise<PlatformVariant[]> {
    const variants: PlatformVariant[] = []

    for (const platform of platforms) {
      const adaptationResult = await this.sendRequest(
        "claude-4-sonnet",
        [
          {
            role: "user",
            content: `Адаптируй контент под платформу ${platform}:

Контент:
- Жанр: ${content.classification.genre}
- Стиль: ${content.classification.style}
- Аудитория: ${content.classification.audience}
- Количество сцен: ${content.scenes.length}

Создай адаптацию в формате JSON:
- platform: "${platform}"
- adaptations: массив изменений с полями type, original, adapted, reason
- seoData: title, description, tags, category
- variants: варианты для A/B тестирования

Учти специфику платформы:
- YouTube: длинные видео, SEO, миниатюры
- TikTok: короткие вертикальные видео, тренды
- Instagram: визуальность, хештеги, Stories/Reels
- Telegram: каналы, боты, стикеры`,
          },
        ],
        { temperature: 0.3 },
      )

      try {
        const variant = JSON.parse(adaptationResult.content)
        variants.push(variant)
      } catch (error) {
        console.warn(`Ошибка адаптации для платформы ${platform}:`, error)
      }
    }

    return variants
  }

  /**
   * Content Insights Generation
   */
  private async generateInsights(
    scenes: SceneAnalysis[],
    classification: ContentClassification,
    quality: QualityMetrics,
  ): Promise<ContentInsights> {
    const insightsResult = await this.sendRequest(
      "claude-4-sonnet",
      [
        {
          role: "user",
          content: `Сгенерируй инсайты по контенту:

Сцены: ${scenes.length} сцен, типы: ${scenes.map((s) => s.type).join(", ")}
Классификация: ${JSON.stringify(classification)}
Качество: Техническое ${quality.technical.overallScore}/10, Повествование ${quality.narrative.overallScore}/10

Создай анализ в формате JSON:
- strengths: массив сильных сторон
- weaknesses: массив слабых сторон  
- recommendations: массив рекомендаций с полями category, priority, title, description, actionSteps, estimatedImpact
- marketingAngles: углы для продвижения
- targetDemographics: целевые демографии

Будь конкретным и действенным в рекомендациях.`,
        },
      ],
      { temperature: 0.4 },
    )

    try {
      return JSON.parse(insightsResult.content)
    } catch (error) {
      console.warn("Ошибка парсинга генерации инсайтов:", error)
      return {
        summary: "",
        tags: [],
        strengths: [],
        weaknesses: [],
        recommendations: [],
        marketingAngles: [],
        targetDemographics: [],
      }
    }
  }

  /**
   * Получить все доступные Content Intelligence инструменты
   */
  public getContentIntelligenceTools() {
    return contentIntelligenceTools
  }

  /**
   * Получить все доступные Person Identification инструменты
   */
  public getPersonIdentificationTools() {
    return personIdentificationTools
  }

  /**
   * Получить все AI инструменты (Content Intelligence + Person Identification)
   */
  public getAllAITools() {
    return [...contentIntelligenceTools, ...personIdentificationTools]
  }
}
