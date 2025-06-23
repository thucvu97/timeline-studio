/**
 * Сервис для мультимодального анализа видео с помощью GPT-4V
 * Анализ кадров, создание описаний, определение ключевых моментов
 */

import { invoke } from "@tauri-apps/api/core"

import { ApiKeyLoader } from "./api-key-loader"

/**
 * Типы мультимодального анализа
 */
export type MultimodalAnalysisType = 
  | "frame_description"      // Описание кадров
  | "scene_understanding"    // Понимание сцен
  | "object_detection"       // Детекция объектов
  | "emotion_analysis"       // Анализ эмоций
  | "action_recognition"     // Распознавание действий
  | "text_recognition"       // Распознавание текста в кадрах
  | "aesthetic_analysis"     // Эстетический анализ
  | "content_moderation"     // Модерация контента
  | "thumbnail_selection"    // Выбор превью
  | "highlight_detection"    // Детекция ключевых моментов

/**
 * Параметры анализа кадра
 */
export interface FrameAnalysisParams {
  frameImagePath: string
  analysisType: MultimodalAnalysisType
  customPrompt?: string
  detailLevel?: "low" | "medium" | "high"
  language?: string
  contextInfo?: {
    videoTitle?: string
    videoDuration?: number
    frameTimestamp?: number
    previousFrames?: string[]
  }
}

/**
 * Результат анализа кадра
 */
export interface FrameAnalysisResult {
  frameTimestamp: number
  analysisType: MultimodalAnalysisType
  description: string
  confidence: number
  detectedObjects?: Array<{
    name: string
    confidence: number
    boundingBox?: { x: number; y: number; width: number; height: number }
  }>
  detectedText?: Array<{
    text: string
    confidence: number
    language?: string
    position?: { x: number; y: number }
  }>
  emotions?: Array<{
    emotion: string
    confidence: number
    person?: string
  }>
  aestheticScore?: {
    composition: number
    lighting: number
    colorHarmony: number
    overall: number
  }
  tags: string[]
  metadata: Record<string, any>
}

/**
 * Параметры видео анализа
 */
export interface VideoAnalysisParams {
  clipId: string
  analysisTypes: MultimodalAnalysisType[]
  samplingRate?: number // кадров в секунду для анализа
  maxFrames?: number
  customPrompts?: Record<MultimodalAnalysisType, string>
  contextInfo?: {
    title?: string
    description?: string
    genre?: string
    targetAudience?: string
  }
}

/**
 * Результат анализа видео
 */
export interface VideoAnalysisResult {
  clipId: string
  analysisTypes: MultimodalAnalysisType[]
  frameResults: FrameAnalysisResult[]
  summary: {
    mainSubjects: string[]
    overallMood: string
    keyMoments: Array<{
      timestamp: number
      description: string
      importance: number
    }>
    suggestedCuts: Array<{
      startTime: number
      endTime: number
      reason: string
      confidence: number
    }>
    aestheticHighlights: Array<{
      timestamp: number
      score: number
      reason: string
    }>
  }
  metadata: {
    totalFramesAnalyzed: number
    processingTime: number
    averageConfidence: number
    detectedLanguages: string[]
  }
}

/**
 * Параметры для создания превью
 */
export interface ThumbnailSuggestionParams {
  clipId: string
  count?: number
  criteria?: Array<"aesthetic" | "emotion" | "action" | "text" | "faces">
  targetAspectRatio?: string
  contextPrompt?: string
}

/**
 * Результат выбора превью
 */
export interface ThumbnailSuggestion {
  frameTimestamp: number
  frameImagePath: string
  score: number
  reasons: string[]
  aestheticScore: number
  emotionalImpact: number
  visualComplexity: number
  textContent?: string
}

/**
 * Сервис мультимодального анализа
 */
export class MultimodalAnalysisService {
  private static instance: MultimodalAnalysisService
  private apiKeyLoader: ApiKeyLoader
  private readonly supportedModels = ["gpt-4o", "gpt-4-turbo", "gpt-4o-mini"]

  private constructor() {
    this.apiKeyLoader = ApiKeyLoader.getInstance()
  }

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(): MultimodalAnalysisService {
    if (!MultimodalAnalysisService.instance) {
      MultimodalAnalysisService.instance = new MultimodalAnalysisService()
    }
    return MultimodalAnalysisService.instance
  }

  /**
   * Анализ одного кадра
   */
  public async analyzeFrame(params: FrameAnalysisParams): Promise<FrameAnalysisResult> {
    const apiKey = await this.apiKeyLoader.getApiKey("openai")
    if (!apiKey) {
      throw new Error("OpenAI API ключ не найден. Необходим для GPT-4V анализа.")
    }

    // Конвертируем изображение в base64
    const imageBase64 = await this.imageToBase64(params.frameImagePath)
    
    // Создаем промпт в зависимости от типа анализа
    const prompt = this.buildAnalysisPrompt(params)
    
    try {
      const response = await this.callGPT4Vision({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                  detail: params.detailLevel || "medium"
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      }, apiKey)

      return this.parseFrameAnalysisResponse(response, params)
    } catch (error) {
      throw new Error(`Ошибка анализа кадра: ${String(error)}`)
    }
  }

  /**
   * Анализ всего видео
   */
  public async analyzeVideo(params: VideoAnalysisParams): Promise<VideoAnalysisResult> {
    console.log(`Начинаем мультимодальный анализ видео ${params.clipId}`)
    
    // Извлекаем кадры из видео
    const frames = await this.extractFramesForAnalysis(params.clipId, {
      samplingRate: params.samplingRate || 1,
      maxFrames: params.maxFrames || 20
    })

    const frameResults: FrameAnalysisResult[] = []
    
    // Анализируем каждый кадр
    for (const frame of frames) {
      for (const analysisType of params.analysisTypes) {
        try {
          const result = await this.analyzeFrame({
            frameImagePath: frame.imagePath,
            analysisType,
            customPrompt: params.customPrompts?.[analysisType],
            contextInfo: {
              ...params.contextInfo,
              frameTimestamp: frame.timestamp,
              previousFrames: frameResults.slice(-3).map(r => r.description)
            }
          })
          
          frameResults.push({
            ...result,
            frameTimestamp: frame.timestamp
          })
        } catch (error) {
          console.error(`Ошибка анализа кадра ${frame.timestamp}:`, error)
        }
      }
    }

    // Создаем общий анализ видео
    const summary = this.generateVideoSummary(frameResults, params.contextInfo)
    
    return {
      clipId: params.clipId,
      analysisTypes: params.analysisTypes,
      frameResults,
      summary,
      metadata: {
        totalFramesAnalyzed: frames.length,
        processingTime: Date.now(), // TODO: реальное время
        averageConfidence: this.calculateAverageConfidence(frameResults),
        detectedLanguages: this.extractDetectedLanguages(frameResults)
      }
    }
  }

  /**
   * Предложения для превью
   */
  public async suggestThumbnails(params: ThumbnailSuggestionParams): Promise<ThumbnailSuggestion[]> {
    // Извлекаем кадры-кандидаты
    const candidateFrames = await this.extractFramesForAnalysis(params.clipId, {
      samplingRate: 0.5, // Каждые 2 секунды
      maxFrames: 50
    })

    const suggestions: ThumbnailSuggestion[] = []

    // Анализируем каждый кадр-кандидат
    for (const frame of candidateFrames) {
      try {
        const analysisResult = await this.analyzeFrame({
          frameImagePath: frame.imagePath,
          analysisType: "thumbnail_selection",
          customPrompt: this.buildThumbnailSelectionPrompt(params),
          contextInfo: {
            frameTimestamp: frame.timestamp
          }
        })

        const suggestion: ThumbnailSuggestion = {
          frameTimestamp: frame.timestamp,
          frameImagePath: frame.imagePath,
          score: analysisResult.confidence,
          reasons: analysisResult.tags,
          aestheticScore: analysisResult.aestheticScore?.overall || 0,
          emotionalImpact: this.extractEmotionalImpact(analysisResult),
          visualComplexity: this.calculateVisualComplexity(analysisResult),
          textContent: analysisResult.detectedText?.map(t => t.text).join(" ")
        }

        suggestions.push(suggestion)
      } catch (error) {
        console.error(`Ошибка анализа кадра для превью ${frame.timestamp}:`, error)
      }
    }

    // Сортируем по общему скору и возвращаем лучшие
    return suggestions
      .sort((a, b) => b.score - a.score)
      .slice(0, params.count || 5)
  }

  /**
   * Пакетный анализ видео
   */
  public async batchAnalyzeVideos(
    clipIds: string[],
    analysisTypes: MultimodalAnalysisType[],
    options?: {
      maxConcurrent?: number
      progressCallback?: (progress: { completed: number; total: number; current: string }) => void
    }
  ): Promise<Record<string, VideoAnalysisResult>> {
    const results: Record<string, VideoAnalysisResult> = {}
    const maxConcurrent = options?.maxConcurrent || 2 // GPT-4V имеет ограничения
    
    // Разбиваем на батчи для контроля параллельности
    const batches = this.chunkArray(clipIds, maxConcurrent)
    let completed = 0

    for (const batch of batches) {
      const batchPromises = batch.map(async (clipId) => {
        try {
          const result = await this.analyzeVideo({
            clipId,
            analysisTypes,
            samplingRate: 1,
            maxFrames: 10 // Ограничиваем для пакетного анализа
          })
          
          results[clipId] = result
          completed++
          
          if (options?.progressCallback) {
            options.progressCallback({
              completed,
              total: clipIds.length,
              current: clipId
            })
          }
        } catch (error) {
          console.error(`Ошибка анализа видео ${clipId}:`, error)
        }
      })

      await Promise.all(batchPromises)
    }

    return results
  }

  /**
   * Вспомогательные методы
   */

  private async imageToBase64(imagePath: string): Promise<string> {
    return await invoke("convert_image_to_base64", { imagePath })
  }

  private async extractFramesForAnalysis(
    clipId: string, 
    options: { samplingRate: number; maxFrames: number }
  ): Promise<Array<{ imagePath: string; timestamp: number }>> {
    return await invoke("extract_frames_for_multimodal_analysis", {
      clipId,
      samplingRate: options.samplingRate,
      maxFrames: options.maxFrames
    })
  }

  private buildAnalysisPrompt(params: FrameAnalysisParams): string {
    const basePrompts: Record<MultimodalAnalysisType, string> = {
      frame_description: "Опишите этот кадр детально, включая объекты, людей, действия, настроение и композицию.",
      scene_understanding: "Проанализируйте сцену: что происходит, где это происходит, какое время дня, настроение сцены.",
      object_detection: "Перечислите все объекты, которые вы видите в кадре, с указанием их местоположения и уверенности.",
      emotion_analysis: "Определите эмоции людей в кадре, их настроение и эмоциональную атмосферу сцены.",
      action_recognition: "Опишите все действия и движения, которые происходят в кадре.",
      text_recognition: "Найдите и извлеките весь текст, видимый в кадре, включая надписи, титры, знаки.",
      aesthetic_analysis: "Оцените эстетические качества кадра: композицию, освещение, цветовую гармонию, визуальную привлекательность.",
      content_moderation: "Проверьте содержимое на наличие неподходящего контента, насилия, откровенных сцен.",
      thumbnail_selection: "Оцените, насколько этот кадр подходит для использования в качестве превью видео.",
      highlight_detection: "Определите, является ли этот кадр ключевым моментом, который стоит выделить."
    }

    let prompt = params.customPrompt || basePrompts[params.analysisType]
    
    if (params.contextInfo) {
      prompt += `\n\nКонтекст: `
      if (params.contextInfo.videoTitle) prompt += `Название видео: "${params.contextInfo.videoTitle}". `
      if (params.contextInfo.frameTimestamp) prompt += `Временная метка: ${params.contextInfo.frameTimestamp}с. `
      if (params.contextInfo.previousFrames?.length) {
        prompt += `Предыдущие кадры: ${params.contextInfo.previousFrames.join(", ")}.`
      }
    }

    prompt += `\n\nВерните ответ в формате JSON со следующими полями:
{
  "description": "подробное описание",
  "confidence": число от 0 до 1,
  "tags": ["тег1", "тег2"],
  "metadata": {}
}`

    return prompt
  }

  private buildThumbnailSelectionPrompt(params: ThumbnailSuggestionParams): string {
    let prompt = "Оцените этот кадр как потенциальное превью для видео. "
    
    if (params.criteria) {
      prompt += `Особое внимание уделите: ${params.criteria.join(", ")}. `
    }
    
    if (params.contextPrompt) {
      prompt += params.contextPrompt + " "
    }

    prompt += `Оцените по критериям:
- Визуальная привлекательность (0-10)
- Информативность (0-10) 
- Эмоциональное воздействие (0-10)
- Качество композиции (0-10)
- Наличие лиц/людей (0-10)

Верните JSON с оценками и общим скором.`

    return prompt
  }

  private async callGPT4Vision(payload: any, apiKey: string): Promise<any> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${response.status} ${error}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  private parseFrameAnalysisResponse(response: string, params: FrameAnalysisParams): FrameAnalysisResult {
    try {
      const parsed = JSON.parse(response)
      
      return {
        frameTimestamp: params.contextInfo?.frameTimestamp || 0,
        analysisType: params.analysisType,
        description: parsed.description || "",
        confidence: parsed.confidence || 0,
        detectedObjects: parsed.objects || [],
        detectedText: parsed.text || [],
        emotions: parsed.emotions || [],
        aestheticScore: parsed.aesthetic || undefined,
        tags: parsed.tags || [],
        metadata: parsed.metadata || {}
      }
    } catch (error) {
      // Fallback если JSON parsing не удался
      return {
        frameTimestamp: params.contextInfo?.frameTimestamp || 0,
        analysisType: params.analysisType,
        description: response,
        confidence: 0.5,
        tags: [],
        metadata: {}
      }
    }
  }

  private generateVideoSummary(frameResults: FrameAnalysisResult[], contextInfo?: any): VideoAnalysisResult["summary"] {
    // Извлекаем основные субъекты
    const allTags = frameResults.flatMap(r => r.tags)
    const tagCounts = allTags.reduce<Record<string, number>>((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1
      return acc
    }, {})
    
    const mainSubjects = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([tag]) => tag)

    // Определяем общее настроение
    const emotions = frameResults.flatMap(r => r.emotions || [])
    const overallMood = emotions.length > 0 
      ? emotions.reduce((prev, curr) => curr.confidence > prev.confidence ? curr : prev).emotion
      : "neutral"

    // Находим ключевые моменты (кадры с высокой уверенностью)
    const keyMoments = frameResults
      .filter(r => r.confidence > 0.8)
      .map(r => ({
        timestamp: r.frameTimestamp,
        description: r.description,
        importance: r.confidence
      }))
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 10)

    return {
      mainSubjects,
      overallMood,
      keyMoments,
      suggestedCuts: [], // TODO: implement cut detection
      aestheticHighlights: frameResults
        .filter(r => r.aestheticScore?.overall && r.aestheticScore.overall > 7)
        .map(r => ({
          timestamp: r.frameTimestamp,
          score: r.aestheticScore!.overall,
          reason: "High aesthetic score"
        }))
    }
  }

  private calculateAverageConfidence(frameResults: FrameAnalysisResult[]): number {
    if (frameResults.length === 0) return 0
    const total = frameResults.reduce((sum, r) => sum + r.confidence, 0)
    return total / frameResults.length
  }

  private extractDetectedLanguages(frameResults: FrameAnalysisResult[]): string[] {
    const languages = new Set<string>()
    frameResults.forEach(r => {
      r.detectedText?.forEach(t => {
        if (t.language) languages.add(t.language)
      })
    })
    return Array.from(languages)
  }

  private extractEmotionalImpact(result: FrameAnalysisResult): number {
    if (!result.emotions || result.emotions.length === 0) return 0
    return result.emotions.reduce((max, e) => Math.max(max, e.confidence), 0)
  }

  private calculateVisualComplexity(result: FrameAnalysisResult): number {
    // Простая эвристика на основе количества объектов
    const objectCount = result.detectedObjects?.length || 0
    const textCount = result.detectedText?.length || 0
    return Math.min(10, (objectCount * 0.5 + textCount * 0.3))
  }

  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize))
    }
    return chunks
  }
}