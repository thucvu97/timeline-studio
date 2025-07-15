/**
 * Scene Analysis Engine
 * Расширяет FFmpegAnalysisService для продвинутого анализа сцен
 */

import { FFmpegAnalysisService } from "@/features/ai-chat/services/ffmpeg-analysis-service"
import { UnifiedAIService } from "@/features/ai-chat/services/unified-ai-service"
import type { Person } from "@/features/montage-planner/types"
import type { DetectedFace, PersonProfile } from "@/features/person-identification/types"

import {
  ContentType,
  Genre,
  KeyMoment,
  KeyMomentType,
  QualityMetrics,
  SceneAnalysis,
  SceneType,
} from "../../../shared/types/content-analysis"
import { BaseAIEngine, type EngineCapabilities } from "../../types"
import { CameraMovementType, LightingType, MotionDirection } from "../types"
import { VisionService } from "./vision-service"

import type {
  AudioProfile,
  KeyframeData,
  SceneAnalysisConfig,
  SceneAnalysisResult,
  TimelineSegment,
  VisualFeatures,
} from "../types"

// Интеграция с montage-planner для работы с персонажами

export class SceneAnalysisEngine extends BaseAIEngine {
  name = "Scene Analysis Engine"
  version = "1.0.0"
  description = "Advanced scene analysis with AI-powered content understanding"

  private ffmpegService: FFmpegAnalysisService
  private aiService: UnifiedAIService
  private visionService?: VisionService
  private config: SceneAnalysisConfig = this.getDefaultConfig()

  // Кэш для персонажей из montage-planner
  private personProfilesCache = new Map<string, PersonProfile>()
  private detectedPersonsCache = new Map<string, Person[]>()

  constructor() {
    super()
    this.ffmpegService = FFmpegAnalysisService.getInstance()
    this.aiService = UnifiedAIService.getInstance()
  }

  async initialize(): Promise<void> {
    try {
      console.log("Initializing Scene Analysis Engine with YOLO/ONNX support...")

      // Инициализация VisionService с YOLO/ONNX
      if (this.config.vision.enableObjectDetection || this.config.vision.enableFaceDetection) {
        this.visionService = VisionService.getInstance({
          enableObjectDetection: this.config.vision.enableObjectDetection,
          enableFaceDetection: this.config.vision.enableFaceDetection,
          enableTextRecognition: this.config.vision.enableTextRecognition,
          enableActivityDetection: this.config.vision.enableActivityDetection,
          objectConfidenceThreshold: this.config.vision.confidenceThreshold,
          faceConfidenceThreshold: this.config.vision.confidenceThreshold,
          textConfidenceThreshold: this.config.vision.confidenceThreshold,
          maxDetectionsPerFrame: 100,
        })

        await this.visionService.initialize()
        console.log("VisionService initialized with YOLO/ONNX models")
      }

      // Загружаем существующие профили персонажей
      await this.loadPersonProfiles()

      this._isReady = true
      console.log("Scene Analysis Engine ready")
    } catch (error) {
      console.error("Failed to initialize Scene Analysis Engine:", error)
      throw error
    }
  }

  async process(data: { mediaFile: MediaFile }, config?: Partial<SceneAnalysisConfig>): Promise<SceneAnalysisResult> {
    if (!this._isReady) {
      throw new Error("Scene Analysis Engine not initialized")
    }

    // Объединяем конфигурацию
    const finalConfig = { ...this.config, ...config }

    try {
      // 1. Базовый анализ через FFmpeg
      const ffmpegAnalysis = await this.performFFmpegAnalysis(data.mediaFile, finalConfig)

      // 2. Продвинутый анализ сцен
      const scenes = await this.analyzeScenes(ffmpegAnalysis, data.mediaFile, finalConfig)

      // 3. Определение ключевых моментов
      const keyMoments = await this.detectKeyMoments(scenes, ffmpegAnalysis)

      // 4. Классификация контента с помощью AI
      const classification = await this.classifyContent(scenes, ffmpegAnalysis, finalConfig)

      // 5. Создание timeline данных
      const timeline = this.createTimelineData(scenes, keyMoments, ffmpegAnalysis)

      // 6. Агрегируем информацию о персонажах из всех сцен
      const allDetectedPersons = this.getDetectedPersonsForVideo(data.mediaFile.path)
      const fragmentsWithPersons = scenes
        .map((scene) => scene.content?.montagePlannerFragment)
        .filter((fragment) => fragment && fragment.people.length > 0)

      // 7. Сборка финального результата
      const result: SceneAnalysisResult = {
        scenes,
        keyMoments,
        classification,
        summary: {
          totalScenes: scenes.length,
          averageSceneDuration: this.calculateAverageSceneDuration(scenes),
          dominantColors: await this.extractDominantColors(scenes),
          visualComplexity: this.calculateVisualComplexity(scenes),
          audioProfile: this.createAudioProfile(ffmpegAnalysis),
        },
        timeline,
        // Интеграция с montage-planner
        persons: allDetectedPersons,
        fragments: fragmentsWithPersons,
        personStats: this.calculatePersonStats(allDetectedPersons, scenes),
      }

      return result
    } catch (error) {
      console.error("Scene analysis failed:", error)
      throw error
    }
  }

  getCapabilities(): EngineCapabilities {
    return {
      supportsStreaming: false,
      supportsBatch: true,
      maxBatchSize: 10,
      supportedFormats: ["mp4", "avi", "mov", "mkv", "webm"],
      requiredResources: {
        minRAM: 2048, // 2GB
        recommendedRAM: 8192, // 8GB
        requiresGPU: this.config.vision.enableObjectDetection,
        gpuMemory: 2048, // 2GB VRAM для YOLO
        diskSpace: 1024, // 1GB для временных файлов
      },
      estimatedProcessingTime: (data) => {
        // Примерная оценка: 1 секунда на 10 секунд видео
        const duration = data.mediaFile?.duration || 60
        return duration / 10
      },
    }
  }

  configure(config: Partial<SceneAnalysisConfig>): Promise<void> {
    this.config = { ...this.config, ...config }
    return Promise.resolve()
  }

  // Приватные методы

  private async performFFmpegAnalysis(mediaFile: MediaFile, config: SceneAnalysisConfig) {
    const [metadata, scenes, quality, silence, motion, keyFrames] = await Promise.all([
      this.ffmpegService.getVideoMetadata(mediaFile.path),
      this.ffmpegService.detectScenes(mediaFile.path, {
        threshold: config.ffmpeg.sceneThreshold,
        minSceneLength: config.ffmpeg.minSceneLength,
      }),
      this.ffmpegService.analyzeQuality(mediaFile.path, {
        sampleRate: config.ffmpeg.qualitySampleRate,
      }),
      this.ffmpegService.detectSilence(mediaFile.path),
      this.ffmpegService.analyzeMotion(mediaFile.path),
      this.ffmpegService.extractKeyFrames(mediaFile.path, {
        count: Math.floor(mediaFile.duration / config.ffmpeg.keyframeInterval),
      }),
    ])

    return { metadata, scenes, quality, silence, motion, keyFrames }
  }

  private async analyzeScenes(
    ffmpegAnalysis: any,
    mediaFile: MediaFile,
    config: SceneAnalysisConfig,
  ): Promise<SceneAnalysis[]> {
    const scenes: SceneAnalysis[] = []

    for (const ffmpegScene of ffmpegAnalysis.scenes.scenes) {
      const scene: SceneAnalysis = {
        id: `scene-${scenes.length + 1}`,
        startTime: ffmpegScene.startTime,
        endTime: ffmpegScene.endTime,
        duration: ffmpegScene.endTime - ffmpegScene.startTime,
        type: await this.detectSceneType(ffmpegScene, ffmpegAnalysis),
        keyFrames: await this.extractSceneKeyFrames(ffmpegScene, ffmpegAnalysis.keyFrames),
        quality: this.extractSceneQuality(ffmpegScene, ffmpegAnalysis.quality),
        content: await this.analyzeSceneContent(ffmpegScene, mediaFile, config),
        transitions: [], // TODO: Analyze transitions between scenes
      }

      scenes.push(scene)
    }

    return scenes
  }

  private async analyzeSceneContent(scene: any, mediaFile: MediaFile, config: SceneAnalysisConfig): Promise<any> {
    const content: any = {
      objects: [],
      faces: [],
      text: [],
      activities: [],
      dominantColors: [],
      composition: null,
      mood: null,
    }

    // Если компьютерное зрение отключено, возвращаем базовую информацию
    if (
      !config.vision.enableObjectDetection &&
      !config.vision.enableFaceDetection &&
      !config.vision.enableTextRecognition
    ) {
      return content
    }

    // VisionService уже инициализирован в initialize()
    if (!this.visionService) {
      console.warn("VisionService not initialized, skipping computer vision analysis")
      return content
    }

    try {
      // Извлекаем кадры из сцены для анализа
      const frameCount = Math.min(5, Math.ceil(scene.duration)) // Анализируем до 5 кадров на сцену
      const frameInterval = scene.duration / frameCount

      for (let i = 0; i < frameCount; i++) {
        const timestamp = Number(scene.startTime) + i * frameInterval

        // Извлекаем кадр через FFmpeg
        const frameData = await this.ffmpegService.extractFrame(mediaFile.path, timestamp)

        if (frameData) {
          // Анализируем кадр
          const frameAnalysis = await this.visionService.analyzeFrame(frameData, i)

          // Объединяем результаты
          content.objects.push(...frameAnalysis.objects)
          content.faces.push(...frameAnalysis.faces)
          content.text.push(...frameAnalysis.text)
          content.activities.push(...frameAnalysis.activities)

          // Сохраняем композицию последнего кадра
          content.composition = frameAnalysis.composition
        }
      }

      // Извлекаем доминирующие цвета
      if (frameCount > 0) {
        const middleFrameTimestamp = Number(scene.startTime) + scene.duration / 2
        const middleFrame = await this.ffmpegService.extractFrame(mediaFile.path, middleFrameTimestamp)
        if (middleFrame) {
          content.dominantColors = this.visionService.extractDominantColors(middleFrame)
        }
      }

      // Идентифицируем персонажей на основе детекций лиц
      if (content.faces.length > 0) {
        const identifiedPersons = await this.identifyPersons(content.faces, scene.id)
        content.identifiedPersons = identifiedPersons

        console.log(
          `Scene ${scene.id}: Found ${identifiedPersons.length} persons`,
          identifiedPersons.map((p) => `${p.name}(${Math.round(p.confidence * 100)}%)`),
        )
      }

      // Определяем настроение сцены с помощью AI
      if (config.ai.enableMoodDetection) {
        content.mood = await this.detectSceneMood(content, scene)
      }

      // Создаем Fragment в формате montage-planner
      if (content.identifiedPersons?.length > 0) {
        const fragment = this.createFragmentFromScene(
          { ...scene, content } as SceneAnalysis,
          mediaFile,
          content.identifiedPersons,
        )
        content.montagePlannerFragment = fragment
      }
    } catch (error) {
      console.error("Failed to analyze scene content:", error)
    }

    return content
  }

  private async detectSceneMood(content: any, scene: any): Promise<string> {
    // Простая эвристика для определения настроения
    const hasHappyFaces = content.faces.some((face: any) => face.emotion === "happy")
    const isDarkScene = content.dominantColors.some((color: any) => {
      const hex = color.hex.replace("#", "")
      const r = Number.parseInt(hex.substr(0, 2), 16)
      const g = Number.parseInt(hex.substr(2, 2), 16)
      const b = Number.parseInt(hex.substr(4, 2), 16)
      const brightness = (r + g + b) / 3
      return brightness < 50
    })

    if (hasHappyFaces) return "positive"
    if (isDarkScene) return "dark"
    if (scene.duration < 2) return "dynamic"

    return "neutral"
  }

  private async detectSceneType(scene: any, analysis: any): Promise<SceneType> {
    // Простая эвристика для определения типа сцены
    const motion = analysis.motion?.motionIntensity || 0
    const duration = scene.endTime - scene.startTime

    if (motion > 0.7) return SceneType.ACTION
    if (duration < 2) return SceneType.TRANSITION
    if (duration > 10 && motion < 0.2) return SceneType.ESTABLISHING

    // TODO: Использовать AI для более точного определения
    return SceneType.DIALOGUE
  }

  private async extractSceneKeyFrames(scene: any, keyFrames: any): Promise<any[]> {
    // Фильтруем ключевые кадры для данной сцены
    return (
      keyFrames?.keyFrames
        ?.filter((kf: any) => kf.timestamp >= scene.startTime && kf.timestamp <= scene.endTime)
        .map((kf: any) => ({
          timestamp: kf.timestamp,
          thumbnailPath: kf.imagePath,
          composition: {
            ruleOfThirds: 0.5, // TODO: Implement real analysis
            balance: 0.5,
            leadingLines: false,
            depth: 0.5,
            colorHarmony: 0.5,
          },
          isKeyMoment: false,
          score: kf.confidence || 0.5,
        })) || []
    )
  }

  private extractSceneQuality(_scene: any, qualityAnalysis: any): QualityMetrics {
    // Возвращаем качество для сцены
    return {
      overall: qualityAnalysis?.overall || 75,
      sharpness: qualityAnalysis?.sharpness || 80,
      brightness: qualityAnalysis?.brightness || 70,
      contrast: qualityAnalysis?.contrast || 75,
      saturation: qualityAnalysis?.saturation || 70,
      stability: qualityAnalysis?.stability || 85,
      noise: qualityAnalysis?.noise || 20,
    }
  }

  private async detectKeyMoments(scenes: SceneAnalysis[], _ffmpegAnalysis: any): Promise<KeyMoment[]> {
    const keyMoments: KeyMoment[] = []

    // Определяем ключевые моменты на основе различных критериев
    for (const scene of scenes) {
      // Высокая активность
      if (scene.type === SceneType.ACTION) {
        keyMoments.push({
          id: `moment-${keyMoments.length + 1}`,
          timestamp: scene.startTime + scene.duration / 2,
          duration: Math.min(scene.duration, 5),
          type: KeyMomentType.ACTION_PEAK,
          score: 0.8,
          description: "High action sequence",
          sceneId: scene.id,
        })
      }

      // Начало и конец видео
      if (scenes.indexOf(scene) === 0) {
        keyMoments.push({
          id: `moment-${keyMoments.length + 1}`,
          timestamp: scene.startTime,
          duration: Math.min(scene.duration, 3),
          type: KeyMomentType.VISUAL_HIGHLIGHT,
          score: 0.7,
          description: "Opening scene",
          sceneId: scene.id,
        })
      }

      if (scenes.indexOf(scene) === scenes.length - 1) {
        keyMoments.push({
          id: `moment-${keyMoments.length + 1}`,
          timestamp: scene.endTime - Math.min(scene.duration, 3),
          duration: Math.min(scene.duration, 3),
          type: KeyMomentType.VISUAL_HIGHLIGHT,
          score: 0.7,
          description: "Closing scene",
          sceneId: scene.id,
        })
      }
    }

    return keyMoments
  }

  private async classifyContent(
    scenes: SceneAnalysis[],
    ffmpegAnalysis: any,
    config: SceneAnalysisConfig,
  ): Promise<any> {
    if (!config.ai.enableContentClassification) {
      // Базовая классификация без AI
      return {
        contentType: ContentType.NARRATIVE,
        genres: [Genre.DOCUMENTARY],
        confidence: 0.5,
      }
    }

    // Используем AI для классификации
    const prompt = this.buildClassificationPrompt(scenes, ffmpegAnalysis)
    const response = await this.aiService.sendRequest(config.ai.model || "gpt-4", [{ role: "user", content: prompt }], {
      temperature: 0.3,
      maxTokens: 1000,
    })

    return this.parseClassificationResponse(response.content || "{}")
  }

  private buildClassificationPrompt(scenes: SceneAnalysis[], analysis: any): string {
    return `Classify this video content based on the following analysis:

Video Info:
- Duration: ${analysis.metadata.duration}s
- Number of scenes: ${scenes.length}
- Average scene duration: ${this.calculateAverageSceneDuration(scenes)}s
- Scene types: ${scenes.map((s) => s.type).join(", ")}

Quality Metrics:
- Overall quality: ${analysis.quality?.overall}/100
- Motion intensity: ${analysis.motion?.motionIntensity || "N/A"}

Please provide:
1. Content type (documentary, vlog, tutorial, music video, etc.)
2. Genres (can be multiple)
3. Confidence level (0-1)

Format as JSON: { contentType: string, genres: string[], confidence: number }`
  }

  private parseClassificationResponse(response: string): any {
    try {
      const jsonMatch = /```json\n([\s\S]*?)\n```/.exec(response)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1])
      }
      return JSON.parse(response)
    } catch {
      return {
        contentType: ContentType.NARRATIVE,
        genres: [Genre.DOCUMENTARY],
        confidence: 0.5,
      }
    }
  }

  private createTimelineData(scenes: SceneAnalysis[], _keyMoments: KeyMoment[], ffmpegAnalysis: any): any {
    const segments: TimelineSegment[] = scenes.map((scene) => ({
      start: scene.startTime,
      end: scene.endTime,
      type: this.mapSceneTypeToSegmentType(scene.type),
      confidence: 0.8,
      metadata: {
        sceneId: scene.id,
        quality: scene.quality.overall,
      },
    }))

    const keyframes: KeyframeData[] =
      ffmpegAnalysis.keyFrames?.keyFrames?.map((kf: any) => ({
        timestamp: kf.timestamp,
        thumbnailPath: kf.imagePath,
        features: this.extractVisualFeatures(kf),
        importance: kf.confidence || 0.5,
      })) || []

    return {
      duration: ffmpegAnalysis.metadata.duration,
      segments,
      keyframes,
    }
  }

  private mapSceneTypeToSegmentType(sceneType: SceneType): any {
    // Простое сопоставление типов
    switch (sceneType) {
      case SceneType.ESTABLISHING:
        return "intro"
      case SceneType.TRANSITION:
        return "transition"
      default:
        return "main_content"
    }
  }

  private extractVisualFeatures(_keyframe: any): VisualFeatures {
    // TODO: Implement real visual feature extraction
    return {
      dominantColors: [],
      composition: {
        ruleOfThirds: 0.5,
        symmetry: 0.5,
        balance: 0.5,
        leadingLines: false,
        goldenRatio: 0.5,
      },
      lighting: {
        brightness: 0.5,
        contrast: 0.5,
        type: LightingType.NATURAL,
        quality: 0.5,
      },
      motion: {
        intensity: 0.5,
        direction: MotionDirection.STATIC,
        speed: 0,
        cameraMovement: {
          type: CameraMovementType.STATIC,
          intensity: 0,
          smooth: true,
        },
      },
    }
  }

  private calculateAverageSceneDuration(scenes: SceneAnalysis[]): number {
    if (scenes.length === 0) return 0
    const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0)
    return totalDuration / scenes.length
  }

  private async extractDominantColors(_scenes: SceneAnalysis[]): Promise<string[]> {
    // TODO: Implement color extraction from keyframes
    return ["#000000", "#FFFFFF", "#808080"]
  }

  private calculateVisualComplexity(_scenes: SceneAnalysis[]): number {
    // Простая метрика сложности на основе количества сцен и их типов
    // Простая метрика сложности - заглушка
    return 0.5
  }

  private createAudioProfile(ffmpegAnalysis: any): AudioProfile {
    const silenceData = ffmpegAnalysis.silence
    const audioData = ffmpegAnalysis.audio

    return {
      hasSpeech: silenceData?.speechPercentage > 10,
      hasMusic: true, // TODO: Implement music detection
      hasSilence: silenceData?.totalSilenceDuration > 0,
      speechPercentage: silenceData?.speechPercentage || 0,
      musicPercentage: 0, // TODO: Calculate from audio analysis
      averageVolume: audioData?.volume?.average || 0.5,
      dynamicRange: audioData?.dynamics?.dynamicRange || 0.5,
    }
  }

  private getDefaultConfig(): SceneAnalysisConfig {
    return {
      ffmpeg: {
        sceneThreshold: 0.3,
        minSceneLength: 1.0,
        keyframeInterval: 5.0,
        qualitySampleRate: 1.0,
      },
      vision: {
        enableObjectDetection: true, // Включаем YOLO по умолчанию
        enableFaceDetection: true, // Включаем детекцию лиц
        enableTextRecognition: false,
        enableActivityDetection: false,
        confidenceThreshold: 0.5,
      },
      ai: {
        enableContentClassification: true,
        enableMoodDetection: true,
        enableGenreDetection: true,
        model: "gpt-4",
      },
      performance: {
        parallel: true,
        maxThreads: 4,
        cacheResults: true,
      },
    }
  }

  /**
   * Загрузить профили персонажей из person-identification
   */
  private async loadPersonProfiles(): Promise<void> {
    try {
      // TODO: Интеграция с person-identification service
      // const personService = PersonIdentificationService.getInstance()
      // const profiles = await personService.getAllProfiles()

      // Mock данные для тестирования
      const mockProfiles: PersonProfile[] = [
        {
          id: "person-1",
          name: "John Doe",
          isVerified: true,
          faceEmbeddings: [],
          appearances: [],
          totalScreenTime: 0,
          averageConfidence: 0.85,
          tags: ["main_character"],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "person-2",
          name: "Jane Smith",
          isVerified: true,
          faceEmbeddings: [],
          appearances: [],
          totalScreenTime: 0,
          averageConfidence: 0.82,
          tags: ["secondary_character"],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      for (const profile of mockProfiles) {
        this.personProfilesCache.set(profile.id, profile)
      }

      console.log(`Loaded ${mockProfiles.length} person profiles`)
    } catch (error) {
      console.warn("Failed to load person profiles:", error)
    }
  }

  /**
   * Идентифицировать персонажей на основе детекций лиц
   */
  private async identifyPersons(faceDetections: any[], sceneId: string): Promise<Person[]> {
    const cacheKey = `${sceneId}-persons`

    // Проверяем кэш
    if (this.detectedPersonsCache.has(cacheKey)) {
      return this.detectedPersonsCache.get(cacheKey)!
    }

    const identifiedPersons: Person[] = []

    for (const face of faceDetections) {
      // В реальной реализации здесь будет сравнение face embeddings
      // с существующими PersonProfile.faceEmbeddings

      // Mock идентификация на основе confidence
      let identifiedPerson: Person | null = null

      if (face.confidence > 0.8) {
        // Высокая уверенность - ищем по профилям
        const profiles = Array.from(this.personProfilesCache.values())
        const matchedProfile = profiles.find((p) => p.averageConfidence > 0.8)

        if (matchedProfile) {
          identifiedPerson = {
            id: matchedProfile.id,
            name: matchedProfile.name || "Unknown",
            confidence: face.confidence * 0.9, // Снижаем уверенность при сопоставлении
          }
        }
      }

      // Если не найден в профилях, создаем временного персонажа
      if (!identifiedPerson) {
        identifiedPerson = {
          id: `temp-person-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          name: `Unknown Person ${identifiedPersons.length + 1}`,
          confidence: face.confidence,
        }
      }

      identifiedPersons.push(identifiedPerson)
    }

    // Удаляем дубликаты по ID
    const uniquePersons = identifiedPersons.filter(
      (person, index, arr) => arr.findIndex((p) => p.id === person.id) === index,
    )

    // Кэшируем результат
    this.detectedPersonsCache.set(cacheKey, uniquePersons)

    return uniquePersons
  }

  /**
   * Создать Fragment на основе сцены с интеграцией montage-planner
   */
  private createFragmentFromScene(scene: SceneAnalysis, mediaFile: MediaFile, persons: Person[]): any {
    // Создаем Fragment в формате montage-planner
    return {
      id: `fragment-${scene.id}`,
      videoId: mediaFile.path,
      sourceFile: {
        path: mediaFile.path,
        name: mediaFile.name,
        duration: mediaFile.duration,
        size: 0, // TODO: Get real file size
        format: "mp4", // TODO: Detect format
        mimeType: "video/mp4",
      },
      startTime: scene.startTime,
      endTime: scene.endTime,
      duration: scene.duration,
      screenshotPath: scene.keyFrames[0]?.thumbnailPath,
      objects: scene.content?.objects?.map((obj: any) => obj.label) || [],
      people: persons,
      score: {
        overall: scene.quality.overall,
        visual: scene.quality.overall,
        audio: scene.quality.overall,
        composition: scene.keyFrames[0]?.composition?.ruleOfThirds * 100 || 50,
        timing: scene.duration > 2 ? 80 : 60, // Предпочитаем более длинные сцены
        relevance: this.calculateSceneRelevance(scene),
      },
      tags: [scene.type, `quality-${Math.round(scene.quality.overall / 20) * 20}`],
      description: `${scene.type} scene with ${persons.length} person(s)`,
    }
  }

  /**
   * Вычислить релевантность сцены для монтажа
   */
  private calculateSceneRelevance(scene: SceneAnalysis): number {
    let relevance = 50 // Базовая релевантность

    // Бонусы за тип сцены
    switch (scene.type) {
      case SceneType.ACTION:
        relevance += 30
        break
      case SceneType.DIALOGUE:
        relevance += 20
        break
      case SceneType.ESTABLISHING:
        relevance += 15
        break
      case SceneType.CLOSEUP:
        relevance += 25
        break
      default:
        // Неизвестный тип сцены остается с базовой релевантностью
        break
    }

    // Бонус за качество
    relevance += (scene.quality.overall - 50) * 0.3

    // Бонус за количество лиц
    const faceCount = scene.content?.faces?.length || 0
    relevance += Math.min(faceCount * 10, 30)

    return Math.max(0, Math.min(100, relevance))
  }

  /**
   * Получить всех детектированных персонажей для видео
   */
  public getDetectedPersonsForVideo(videoPath: string): Person[] {
    const allPersons: Person[] = []

    for (const [key, persons] of this.detectedPersonsCache.entries()) {
      if (key.includes(videoPath)) {
        allPersons.push(...persons)
      }
    }

    // Убираем дубликаты и объединяем по ID
    const uniquePersons = new Map<string, Person>()

    for (const person of allPersons) {
      if (uniquePersons.has(person.id)) {
        // Обновляем уверенность максимальной
        const existing = uniquePersons.get(person.id)!
        if (person.confidence > existing.confidence) {
          uniquePersons.set(person.id, person)
        }
      } else {
        uniquePersons.set(person.id, person)
      }
    }

    return Array.from(uniquePersons.values())
  }

  /**
   * Очистить кэш персонажей
   */
  public clearPersonCache(): void {
    this.detectedPersonsCache.clear()
    console.log("Person detection cache cleared")
  }

  /**
   * Обнаружить персонажей в видео или изображении
   */
  public async detectPersons(mediaPath: string, timerange?: { start: number; end: number }): Promise<DetectedFace[]> {
    if (!this._isReady) {
      throw new Error("Scene Analysis Engine not initialized")
    }

    const detectedFaces: DetectedFace[] = []

    try {
      // Если указан временной диапазон, анализируем только его
      const startTime = timerange?.start || 0
      const endTime = timerange?.end || 60 // По умолчанию первые 60 секунд

      // Анализируем кадры с интервалом
      const frameInterval = 1.0 // Каждую секунду
      const frameCount = Math.ceil((endTime - startTime) / frameInterval)

      for (let i = 0; i < frameCount; i++) {
        const timestamp = startTime + i * frameInterval

        // Извлекаем кадр через FFmpeg
        const frameData = await this.ffmpegService.extractFrame(mediaPath, timestamp)

        if (frameData && this.visionService) {
          // Анализируем кадр
          const frameAnalysis = await this.visionService.analyzeFrame(frameData, i)

          // Преобразуем детекции лиц в DetectedFace
          for (const face of frameAnalysis.faces) {
            const detectedFace: DetectedFace = {
              id: `face_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
              bbox: face.bbox,
              confidence: face.confidence,
              landmarks: undefined, // TODO: Преобразовать landmarks
              age: face.age,
              gender: face.gender,
              emotion: face.emotion,
              blur: 0.1, // TODO: Вычислять реальное размытие
              occlusion: 0.1, // TODO: Вычислять перекрытие
              pose: {
                yaw: 0,
                pitch: 0,
                roll: 0,
              },
              frameNumber: i,
              timestamp: {
                seconds: timestamp,
                frames: Math.floor(timestamp * 30), // Предполагаем 30 fps
              },
              clipId: mediaPath,
            }

            detectedFaces.push(detectedFace)
          }
        }
      }

      return detectedFaces
    } catch (error) {
      console.error("Failed to detect persons:", error)
      return detectedFaces
    }
  }
}

// Типы
interface MediaFile {
  path: string
  name: string
  duration: number
}
