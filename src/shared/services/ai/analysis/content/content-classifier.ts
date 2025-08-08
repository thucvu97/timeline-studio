/**
 * Content Classifier Service
 * Классификация контента с использованием AI и эвристических методов
 */

import type { Audience, ClassificationResult, ContentClassification, EmotionalTone, SceneAnalysis } from "../interfaces"
import { ContentType, Emotion, Genre } from "../interfaces"

interface ClassifierConfig {
  useAI: boolean
  aiModel?: string
  confidenceThreshold: number
  enableCaching: boolean
  cacheTimeout?: number // минуты
}

interface ClassificationFeatures {
  // Визуальные признаки
  averageSceneDuration: number
  sceneChangeRate: number
  motionIntensity: number
  colorVariety: number
  visualComplexity: number

  // Аудио признаки
  speechPercentage: number
  musicPercentage: number
  silencePercentage: number
  audioEnergy: number

  // Структурные признаки
  sceneCount: number
  totalDuration: number
  hasIntro: boolean
  hasOutro: boolean
  editingPace: "slow" | "medium" | "fast"
}

export class ContentClassifier {
  private static instance: ContentClassifier
  private config: ClassifierConfig
  private cache = new Map<string, ClassificationResult>()

  private constructor(config?: Partial<ClassifierConfig>) {
    this.config = {
      useAI: true,
      aiModel: "gpt-4",
      confidenceThreshold: 0.7,
      enableCaching: true,
      cacheTimeout: 60, // 60 минут
      ...config,
    }
  }

  /**
   * Получить экземпляр классификатора (Singleton)
   */
  public static getInstance(config?: Partial<ClassifierConfig>): ContentClassifier {
    if (!ContentClassifier.instance) {
      ContentClassifier.instance = new ContentClassifier(config)
    }
    return ContentClassifier.instance
  }

  /**
   * Классифицировать контент
   */
  public async classify(
    scenes: SceneAnalysis[],
    metadata: any,
    features?: Partial<ClassificationFeatures>,
  ): Promise<ContentClassification> {
    // Проверяем кэш
    const cacheKey = this.generateCacheKey(scenes, metadata)
    if (this.config.enableCaching && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!
      return this.buildClassification(cached)
    }

    // Извлекаем признаки
    const extractedFeatures = this.extractFeatures(scenes, metadata, features)

    // Классифицируем
    let result: ClassificationResult
    if (this.config.useAI) {
      result = await this.classifyWithAI(extractedFeatures, scenes, metadata)
    } else {
      result = await this.classifyWithHeuristics(extractedFeatures)
    }

    // Сохраняем в кэш
    if (this.config.enableCaching) {
      this.cache.set(cacheKey, result)
      setTimeout(() => this.cache.delete(cacheKey), (this.config.cacheTimeout || 60) * 60 * 1000)
    }

    return this.buildClassification(result)
  }

  /**
   * Определить тип контента
   */
  public async detectContentType(features: ClassificationFeatures): Promise<{ type: ContentType; confidence: number }> {
    // Эвристические правила для определения типа контента
    const scores: Record<ContentType, number> = {
      [ContentType.DOCUMENTARY]: 0,
      [ContentType.VLOG]: 0,
      [ContentType.TUTORIAL]: 0,
      [ContentType.NEWS]: 0,
      [ContentType.ENTERTAINMENT]: 0,
      [ContentType.COMMERCIAL]: 0,
      [ContentType.MUSIC_VIDEO]: 0,
      [ContentType.INTERVIEW]: 0,
      [ContentType.PRESENTATION]: 0,
      [ContentType.OTHER]: 0,
    }

    // Анализируем признаки
    if (features.speechPercentage > 70 && features.averageSceneDuration > 5) {
      scores[ContentType.DOCUMENTARY] += 0.8
      scores[ContentType.TUTORIAL] += 0.6
    }

    if (features.musicPercentage > 80) {
      scores[ContentType.MUSIC_VIDEO] += 0.9
    }

    if (features.editingPace === "fast" && features.sceneChangeRate > 10) {
      scores[ContentType.COMMERCIAL] += 0.7
      scores[ContentType.MUSIC_VIDEO] += 0.5
    }

    if (features.speechPercentage > 50 && features.averageSceneDuration < 3) {
      scores[ContentType.VLOG] += 0.7
      scores[ContentType.NEWS] += 0.5
    }

    if (features.totalDuration < 60 && features.editingPace === "fast") {
      scores[ContentType.COMMERCIAL] += 0.6
    }

    // Находим максимальный score
    let maxScore = 0
    let detectedType = ContentType.ENTERTAINMENT

    for (const [type, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score
        detectedType = type as ContentType
      }
    }

    return {
      type: detectedType,
      confidence: Math.min(1, maxScore),
    }
  }

  /**
   * Определить жанры
   */
  public async detectGenres(contentType: ContentType, features: ClassificationFeatures): Promise<Genre[]> {
    const genres: Genre[] = []

    // Логика определения жанров на основе типа контента
    switch (contentType) {
      case ContentType.ENTERTAINMENT:
      case ContentType.MUSIC_VIDEO:
        if (features.editingPace === "fast" && features.motionIntensity > 0.7) {
          genres.push(Genre.ACTION)
        }
        if (features.colorVariety < 0.3 && features.audioEnergy < 0.4) {
          genres.push(Genre.DRAMA)
        }
        break

      case ContentType.DOCUMENTARY:
        genres.push(Genre.EDUCATIONAL) // Documentary относится к Educational
        if (features.totalDuration > 1800) {
          // > 30 минут
          genres.push(Genre.EDUCATIONAL)
        }
        break

      case ContentType.TUTORIAL:
        genres.push(Genre.EDUCATIONAL)
        if (features.visualComplexity > 0.7) {
          genres.push(Genre.TECH)
        }
        break

      case ContentType.VLOG:
        genres.push(Genre.LIFESTYLE)
        if (features.sceneCount > 20) {
          genres.push(Genre.TRAVEL)
        }
        break

      default:
        // Для других типов контента добавляем базовый жанр
        genres.push(Genre.OTHER)
        break
    }

    // Убираем дубликаты
    return Array.from(new Set(genres))
  }

  /**
   * Определить эмоциональный тон
   */
  public async detectEmotionalTone(features: ClassificationFeatures, _scenes: SceneAnalysis[]): Promise<EmotionalTone> {
    // Анализируем визуальные и аудио характеристики
    let primaryEmotion: Emotion = Emotion.CALM
    let intensity = 0.5

    if (features.audioEnergy > 0.8 && features.editingPace === "fast") {
      primaryEmotion = Emotion.EXCITING
      intensity = 0.8
    } else if (features.audioEnergy < 0.3 && features.speechPercentage < 20) {
      primaryEmotion = Emotion.CALM
      intensity = 0.7
    } else if (features.motionIntensity > 0.7) {
      primaryEmotion = Emotion.INTENSE
      intensity = 0.6
    }

    // Определяем вторичную эмоцию
    let secondaryEmotion: Emotion | undefined
    if (features.musicPercentage > 50) {
      if (features.audioEnergy > 0.6) {
        secondaryEmotion = Emotion.HAPPY
      } else {
        secondaryEmotion = Emotion.INSPIRING // Используем Inspiring вместо Romantic
      }
    }

    return {
      primary: primaryEmotion,
      secondary: secondaryEmotion,
      intensity,
    }
  }

  /**
   * Определить целевую аудиторию
   */
  public async detectAudience(
    contentType: ContentType,
    genres: Genre[],
    _features: ClassificationFeatures,
  ): Promise<Audience> {
    // Базовые правила для определения аудитории
    let minAge = 13
    let maxAge = 65
    const interests: string[] = []

    // Корректируем на основе типа контента
    switch (contentType) {
      case ContentType.ENTERTAINMENT: // Gaming теперь относится к Entertainment
        minAge = 13
        maxAge = 35
        interests.push("gaming", "technology", "entertainment")
        break

      case ContentType.TUTORIAL:
        minAge = 18
        maxAge = 55
        interests.push("education", "self-improvement", "skills")
        break

      case ContentType.NEWS:
        minAge = 25
        maxAge = 65
        interests.push("current events", "politics", "society")
        break

      case ContentType.MUSIC_VIDEO:
        minAge = 16
        maxAge = 45
        interests.push("music", "entertainment", "culture")
        break

      default:
        // Для других типов контента используем общие настройки
        minAge = 13
        maxAge = 65
        interests.push("general", "entertainment")
        break
    }

    // Корректируем на основе жанров
    if (genres.includes(Genre.EDUCATIONAL)) {
      interests.push("learning", "knowledge")
    }
    if (genres.includes(Genre.TECH)) {
      interests.push("technology", "innovation")
    }
    if (genres.includes(Genre.FITNESS)) {
      interests.push("health", "wellness", "sports")
    }

    return {
      ageGroup: this.mapAgeRangeToGroup(minAge, maxAge),
      interests: Array.from(new Set(interests)),
      language: "ru", // По умолчанию русский
    }
  }

  // Приватные методы

  private mapAgeRangeToGroup(
    minAge: number,
    maxAge: number,
  ): "children" | "teenagers" | "young_adults" | "adults" | "seniors" | "all" {
    if (maxAge < 13) return "children"
    if (minAge >= 13 && maxAge <= 19) return "teenagers"
    if (minAge >= 18 && maxAge <= 35) return "young_adults"
    if (minAge >= 25 && maxAge <= 65) return "adults"
    if (minAge > 60) return "seniors"
    return "all"
  }

  private extractFeatures(
    scenes: SceneAnalysis[],
    metadata: any,
    providedFeatures?: Partial<ClassificationFeatures>,
  ): ClassificationFeatures {
    const totalDuration = scenes.length > 0 ? scenes[scenes.length - 1].endTime : metadata.duration || 0

    const averageSceneDuration = scenes.length > 0 ? totalDuration / scenes.length : 0

    const sceneChangeRate =
      totalDuration > 0
        ? (scenes.length / totalDuration) * 60 // сцен в минуту
        : 0

    // Определяем темп монтажа
    let editingPace: "slow" | "medium" | "fast" = "medium"
    if (sceneChangeRate < 5) editingPace = "slow"
    else if (sceneChangeRate > 15) editingPace = "fast"

    return {
      averageSceneDuration,
      sceneChangeRate,
      motionIntensity: metadata.motion?.motionIntensity || 0.5,
      colorVariety: this.calculateColorVariety(scenes),
      visualComplexity: this.calculateVisualComplexity(scenes),
      speechPercentage: metadata.silence?.speechPercentage || 50,
      musicPercentage: this.calculateMusicPercentage(metadata),
      silencePercentage: metadata.silence?.totalSilenceDuration
        ? (metadata.silence.totalSilenceDuration / totalDuration) * 100
        : 20,
      audioEnergy: metadata.audio?.volume?.average || 0.5,
      sceneCount: scenes.length,
      totalDuration,
      hasIntro: this.detectIntro(scenes),
      hasOutro: this.detectOutro(scenes),
      editingPace,
      ...providedFeatures,
    }
  }

  private calculateVisualComplexity(scenes: SceneAnalysis[]): number {
    // Упрощенный расчет визуальной сложности
    const uniqueSceneTypes = new Set(scenes.map((s) => s.type)).size
    const averageObjectsPerScene = 0 // TODO: Нужно добавить анализ объектов в сценах

    return Math.min(1, (uniqueSceneTypes / 5 + averageObjectsPerScene / 10) / 2)
  }

  private detectIntro(scenes: SceneAnalysis[]): boolean {
    if (scenes.length < 2) return false

    const firstScene = scenes[0]
    const sceneDuration = firstScene.endTime - firstScene.startTime
    return (
      (firstScene.type as string) === "establishing" ||
      sceneDuration < 5 ||
      firstScene.description?.includes("intro") ||
      false
    )
  }

  private detectOutro(scenes: SceneAnalysis[]): boolean {
    if (scenes.length < 2) return false

    const lastScene = scenes[scenes.length - 1]
    const sceneDuration = lastScene.endTime - lastScene.startTime
    return (
      sceneDuration < 5 ||
      lastScene.description?.toLowerCase().includes("thanks") ||
      lastScene.description?.toLowerCase().includes("subscribe") ||
      false
    )
  }

  private async classifyWithAI(
    features: ClassificationFeatures,
    scenes: SceneAnalysis[],
    metadata: any,
  ): Promise<ClassificationResult> {
    const prompt = this.buildAIPrompt(features, scenes, metadata)

    try {
      // For now, fallback to heuristics as sendMessage is not available
      // A real implementation would use the AI service API
      return await this.classifyWithHeuristics(features)
    } catch (error) {
      console.error("AI classification failed, falling back to heuristics:", error)
      return await this.classifyWithHeuristics(features)
    }
  }

  private async classifyWithHeuristics(features: ClassificationFeatures): Promise<ClassificationResult> {
    const contentTypeResult = await this.detectContentType(features)
    const genres = await this.detectGenres(contentTypeResult.type, features)
    const emotionalTone = await this.detectEmotionalTone(features, [])
    const audience = await this.detectAudience(contentTypeResult.type, genres, features)

    return {
      contentType: contentTypeResult.type,
      genres,
      emotions: emotionalTone.secondary ? [emotionalTone.primary, emotionalTone.secondary] : [emotionalTone.primary],
      audience,
      confidence: contentTypeResult.confidence,
    }
  }

  private buildAIPrompt(features: ClassificationFeatures, scenes: SceneAnalysis[], _metadata: any): string {
    return `Analyze and classify this video content based on the following features:

Video Characteristics:
- Duration: ${features.totalDuration}s
- Number of scenes: ${features.sceneCount}
- Average scene duration: ${features.averageSceneDuration.toFixed(1)}s
- Scene change rate: ${features.sceneChangeRate.toFixed(1)} scenes/min
- Editing pace: ${features.editingPace}

Visual Features:
- Motion intensity: ${features.motionIntensity.toFixed(2)}
- Visual complexity: ${features.visualComplexity.toFixed(2)}
- Color variety: ${features.colorVariety.toFixed(2)}

Audio Features:
- Speech: ${features.speechPercentage.toFixed(1)}%
- Music: ${features.musicPercentage.toFixed(1)}%
- Silence: ${features.silencePercentage.toFixed(1)}%
- Audio energy: ${features.audioEnergy.toFixed(2)}

Structure:
- Has intro: ${features.hasIntro}
- Has outro: ${features.hasOutro}

Scene Types: ${scenes
      .slice(0, 10)
      .map((s) => s.type)
      .join(", ")}

Please classify this content and provide:
1. Content type (documentary, vlog, tutorial, music video, etc.)
2. Genres (can be multiple)
3. Emotional tone
4. Target audience
5. Confidence level (0-1)
6. Brief reasoning

Format your response as JSON with this structure:
{
  "contentType": "string",
  "genres": ["string"],
  "emotionalTone": {
    "primary": "string",
    "secondary": "string",
    "intensity": number
  },
  "audience": {
    "ageRange": { "min": number, "max": number },
    "interests": ["string"],
    "demographics": { "primary": "string", "secondary": ["string"] }
  },
  "confidence": number,
  "reasoning": "string"
}`
  }

  private buildClassification(result: ClassificationResult): ContentClassification {
    const emotionalTone = this.getEmotionalToneFromResult(result)
    return {
      ...result,
      keywords: this.generateKeywords(result),
      topics: this.generateTopics(result),
      tone: emotionalTone,
    }
  }

  private getEmotionalToneFromResult(result: ClassificationResult): EmotionalTone {
    return {
      primary: result.emotions[0] || Emotion.NEUTRAL,
      secondary: result.emotions[1],
      intensity: 0.7,
    }
  }

  private generateKeywords(result: ClassificationResult): string[] {
    const keywords: string[] = [result.contentType]

    // Добавляем жанры
    keywords.push(...result.genres)

    // Добавляем дополнительные ключевые слова на основе типа контента
    switch (result.contentType) {
      case ContentType.TUTORIAL:
        keywords.push("educational", "how-to", "learning")
        break
      case ContentType.VLOG:
        keywords.push("personal", "lifestyle", "daily")
        break
      case ContentType.MUSIC_VIDEO:
        keywords.push("music", "entertainment", "artistic")
        break
      default:
        // Для других типов добавляем общие теги
        keywords.push("content", "media")
        break
    }

    return Array.from(new Set(keywords))
  }

  private generateTopics(result: ClassificationResult): string[] {
    const topics: string[] = []

    // Генерируем темы на основе жанров
    result.genres.forEach((genre) => {
      switch (genre) {
        case Genre.EDUCATIONAL:
          topics.push("education", "learning")
          break
        case Genre.TECH:
          topics.push("technology", "innovation")
          break
        case Genre.FITNESS:
          topics.push("health", "wellness")
          break
        case Genre.TRAVEL:
          topics.push("travel", "tourism")
          break
        default:
          break
      }
    })

    // Добавляем интересы аудитории как темы
    if (result.audience.interests) {
      topics.push(...result.audience.interests)
    }

    return Array.from(new Set(topics))
  }

  private generateCacheKey(scenes: SceneAnalysis[], metadata: any): string {
    // Создаем уникальный ключ на основе ключевых характеристик
    const key = `${scenes.length}-${metadata.duration}-${scenes[0]?.id || "none"}`
    return key
  }

  /**
   * Очистить кэш
   */
  public clearCache(): void {
    this.cache.clear()
  }

  /**
   * Обновить конфигурацию
   */
  public updateConfig(config: Partial<ClassifierConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Вычисляет разнообразие цветов в сценах
   */
  private calculateColorVariety(scenes: SceneAnalysis[]): number {
    try {
      if (scenes.length === 0) return 0.5

      // Простая оценка на основе количества сцен
      // Чем больше сцен, тем выше вероятность цветового разнообразия
      const sceneDiversity = Math.min(1, scenes.length / 20)
      return sceneDiversity * 0.8 + 0.2 // Базовый уровень 0.2
    } catch (error) {
      console.error("Failed to calculate color variety:", error)
      return 0.5
    }
  }

  /**
   * Вычисляет процент музыки из метаданных
   */
  private calculateMusicPercentage(metadata: any): number {
    try {
      // Проверяем различные источники музыкальных данных в метаданных

      // 1. Данные из music detection service
      if (metadata.musicSegments && Array.isArray(metadata.musicSegments)) {
        const totalDuration = metadata.duration || 0
        if (totalDuration > 0) {
          const musicDuration = metadata.musicSegments.reduce((sum: number, segment: any) => {
            return sum + (segment.endTime - segment.startTime)
          }, 0)
          return Math.min(100, (musicDuration / totalDuration) * 100)
        }
      }

      // 2. Данные из FFmpeg аудио анализа
      if (metadata.audio?.analysis?.musicPercentage !== undefined) {
        return metadata.audio.analysis.musicPercentage
      }

      // 3. Эвристика на основе аудио характеристик
      if (metadata.audio) {
        const volume = metadata.audio.volume?.average || 0
        const frequencies = metadata.audio.frequencies

        // Если есть данные о частотах
        if (frequencies) {
          // Проверяем музыкальные частоты
          const bassLevel = frequencies.low || 0
          const midLevel = frequencies.mid || 0
          const highLevel = frequencies.high || 0

          // Музыка обычно имеет более сбалансированное распределение частот
          const frequencyBalance = 1 - Math.abs((bassLevel + midLevel + highLevel) / 3 - 0.5)
          const musicScore = (volume + frequencyBalance) / 2

          return Math.min(100, musicScore * 100)
        }

        // Простая эвристика на основе громкости
        if (volume > 0.3) {
          return Math.min(80, volume * 100) // Громкий звук часто содержит музыку
        }
      }

      // 4. Анализ речи для косвенного определения музыки
      if (metadata.silence?.speechPercentage !== undefined) {
        const speechPercentage = metadata.silence.speechPercentage
        const silencePercentage = metadata.silence.totalSilenceDuration
          ? (metadata.silence.totalSilenceDuration / (metadata.duration || 1)) * 100
          : 0

        // Если мало речи и мало тишины, вероятно есть музыка
        const nonSpeechNonSilence = 100 - speechPercentage - silencePercentage
        return Math.max(0, Math.min(70, nonSpeechNonSilence))
      }

      // Дефолтное значение
      return 30
    } catch (error) {
      console.error("Failed to calculate music percentage:", error)
      return 30
    }
  }

  /**
   * Генерирует вторичные классификации
   */
  // Удаляем метод generateSecondaryClassifications, так как он больше не используется
}
