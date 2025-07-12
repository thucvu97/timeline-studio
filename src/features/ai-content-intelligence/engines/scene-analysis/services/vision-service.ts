/**
 * Vision Service
 * Сервис компьютерного зрения для анализа визуального контента
 * Подготовлен для интеграции с YOLO/ONNX
 */

import { ONNXRuntimeService } from "./onnx-runtime-service"

import type {
  ActivityDetection,
  BoundingBox,
  CompositionAnalysis,
  FaceDetection,
  ObjectDetection,
  TextDetection,
} from "../../../shared/types/content-analysis"

interface VisionServiceConfig {
  enableObjectDetection: boolean
  enableFaceDetection: boolean
  enableTextRecognition: boolean
  enableActivityDetection: boolean
  objectConfidenceThreshold: number
  faceConfidenceThreshold: number
  textConfidenceThreshold: number
  maxDetectionsPerFrame: number
  modelPath?: string
}

interface FrameAnalysisResult {
  objects: ObjectDetection[]
  faces: FaceDetection[]
  text: TextDetection[]
  activities: ActivityDetection[]
  composition: CompositionAnalysis
}

export class VisionService {
  private static instance: VisionService
  private config: VisionServiceConfig
  private isInitialized = false
  private onnxService: ONNXRuntimeService

  private constructor(config?: Partial<VisionServiceConfig>) {
    this.config = {
      enableObjectDetection: true,
      enableFaceDetection: true,
      enableTextRecognition: false,
      enableActivityDetection: false,
      objectConfidenceThreshold: 0.5,
      faceConfidenceThreshold: 0.6,
      textConfidenceThreshold: 0.7,
      maxDetectionsPerFrame: 100,
      ...config,
    }
    this.onnxService = ONNXRuntimeService.getInstance()
  }

  /**
   * Получить экземпляр сервиса (Singleton)
   */
  public static getInstance(config?: Partial<VisionServiceConfig>): VisionService {
    if (!VisionService.instance) {
      VisionService.instance = new VisionService(config)
    }
    return VisionService.instance
  }

  /**
   * Инициализировать модели
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      // Инициализируем ONNX Runtime Service
      await this.onnxService.initialize()

      // Проверяем доступность моделей
      if (this.config.enableObjectDetection && !this.onnxService.hasModel("yolov8n")) {
        console.warn("YOLO model not available, object detection will use mock data")
      }

      if (this.config.enableFaceDetection && !this.onnxService.hasModel("face-detection")) {
        console.warn("Face detection model not available, will use mock data")
      }

      this.isInitialized = true
      console.log("Vision Service initialized with ONNX Runtime")
    } catch (error) {
      console.error("Failed to initialize vision models:", error)
      throw error
    }
  }

  /**
   * Анализировать кадр
   */
  public async analyzeFrame(frameData: ImageData | string, frameNumber: number): Promise<FrameAnalysisResult> {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const results: FrameAnalysisResult = {
      objects: [],
      faces: [],
      text: [],
      activities: [],
      composition: this.analyzeComposition(frameData),
    }

    // Параллельное выполнение детекций
    const promises: Promise<void>[] = []

    if (this.config.enableObjectDetection) {
      promises.push(
        this.detectObjects(frameData, frameNumber).then((objects) => {
          results.objects = objects
        }),
      )
    }

    if (this.config.enableFaceDetection) {
      promises.push(
        this.detectFaces(frameData, frameNumber).then((faces) => {
          results.faces = faces
        }),
      )
    }

    if (this.config.enableTextRecognition) {
      promises.push(
        this.recognizeText(frameData).then((text) => {
          results.text = text
        }),
      )
    }

    await Promise.all(promises)

    return results
  }

  /**
   * Детекция объектов
   */
  public async detectObjects(frameData: ImageData | string, frameNumber: number): Promise<ObjectDetection[]> {
    try {
      // Преобразуем строку в ImageData если нужно
      let imageData: ImageData
      if (typeof frameData === "string") {
        // Для строки (URL) создаем временный canvas
        const img = new Image()
        img.src = frameData
        await new Promise((resolve) => (img.onload = resolve))

        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(img, 0, 0)
        imageData = ctx.getImageData(0, 0, img.width, img.height)
      } else {
        imageData = frameData
      }

      // Запускаем YOLO инференс
      const yoloDetections = await this.onnxService.runYOLOInference(imageData)

      // Преобразуем результаты YOLO в формат ObjectDetection
      return yoloDetections
        .filter((det) => det.confidence >= this.config.objectConfidenceThreshold)
        .map((det, index) => ({
          id: `obj-${frameNumber}-${index}`,
          label: det.class,
          confidence: det.confidence,
          boundingBox: {
            x: det.bbox.x * imageData.width,
            y: det.bbox.y * imageData.height,
            width: det.bbox.width * imageData.width,
            height: det.bbox.height * imageData.height,
          },
          frameNumbers: [frameNumber],
          trackId: det.trackId,
        }))
    } catch (error) {
      console.error("Object detection failed:", error)
      // Возвращаем пустой массив в случае ошибки
      return []
    }
  }

  /**
   * Детекция лиц
   */
  public async detectFaces(frameData: ImageData | string, frameNumber: number): Promise<FaceDetection[]> {
    try {
      // Преобразуем строку в ImageData если нужно
      let imageData: ImageData
      if (typeof frameData === "string") {
        const img = new Image()
        img.src = frameData
        await new Promise((resolve) => (img.onload = resolve))

        const canvas = document.createElement("canvas")
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext("2d")!
        ctx.drawImage(img, 0, 0)
        imageData = ctx.getImageData(0, 0, img.width, img.height)
      } else {
        imageData = frameData
      }

      // Запускаем детекцию лиц
      const faceResults = await this.onnxService.runFaceDetection(imageData)

      // Преобразуем результаты в формат FaceDetection
      return faceResults
        .filter((face) => face.confidence >= this.config.faceConfidenceThreshold)
        .map((face, index) => ({
          id: `face-${frameNumber}-${index}`,
          confidence: face.confidence,
          boundingBox: {
            x: face.bbox.x * imageData.width,
            y: face.bbox.y * imageData.height,
            width: face.bbox.width * imageData.width,
            height: face.bbox.height * imageData.height,
          },
          landmarks: face.landmarks
            ? {
              leftEye: {
                x: face.landmarks[0].x * imageData.width,
                y: face.landmarks[0].y * imageData.height,
              },
              rightEye: {
                x: face.landmarks[1].x * imageData.width,
                y: face.landmarks[1].y * imageData.height,
              },
              nose: {
                x: face.landmarks[2].x * imageData.width,
                y: face.landmarks[2].y * imageData.height,
              },
              mouth: {
                x: ((face.landmarks[3].x + face.landmarks[4].x) / 2) * imageData.width,
                y: ((face.landmarks[3].y + face.landmarks[4].y) / 2) * imageData.height,
              },
            }
            : undefined,
        }))
    } catch (error) {
      console.error("Face detection failed:", error)
      return []
    }
  }

  /**
   * Распознавание текста
   */
  public async recognizeText(_frameData: ImageData | string): Promise<TextDetection[]> {
    // TODO: Реализовать с использованием OCR
    // Временная заглушка

    const mockText: TextDetection[] = [
      {
        text: "Sample Text",
        confidence: 0.9,
        boundingBox: { x: 50, y: 50, width: 200, height: 40 },
        language: "en",
      },
    ]

    return mockText.filter((text) => text.confidence >= this.config.textConfidenceThreshold)
  }

  /**
   * Детекция активности
   */
  public async detectActivity(
    _frames: Array<ImageData | string>,
    startFrame: number,
    endFrame: number,
  ): Promise<ActivityDetection[]> {
    // TODO: Реализовать с использованием activity recognition модели
    // Временная заглушка

    const activities: ActivityDetection[] = [
      {
        activity: "walking",
        confidence: 0.8,
        startFrame,
        endFrame,
      },
    ]

    return activities
  }

  /**
   * Анализ композиции кадра
   */
  public analyzeComposition(frameData: ImageData | string): CompositionAnalysis {
    // TODO: Реализовать реальный анализ композиции
    // Сейчас возвращаем базовые значения

    return {
      ruleOfThirds: this.calculateRuleOfThirds(frameData),
      balance: this.calculateBalance(frameData),
      leadingLines: this.detectLeadingLines(frameData),
      depth: this.calculateDepth(frameData),
      colorHarmony: this.calculateColorHarmony(frameData),
    }
  }

  /**
   * Отслеживание объектов между кадрами
   */
  public async trackObjects(
    previousDetections: ObjectDetection[],
    currentDetections: ObjectDetection[],
  ): Promise<Map<string, string>> {
    // Простое сопоставление по IoU (Intersection over Union)
    const matches = new Map<string, string>()

    for (const prev of previousDetections) {
      let bestMatch: ObjectDetection | null = null
      let bestIoU = 0

      for (const curr of currentDetections) {
        if (prev.label === curr.label) {
          const iou = this.calculateIoU(prev.boundingBox, curr.boundingBox)
          if (iou > bestIoU && iou > 0.5) {
            bestIoU = iou
            bestMatch = curr
          }
        }
      }

      if (bestMatch) {
        matches.set(prev.id, bestMatch.id)
      }
    }

    return matches
  }

  /**
   * Анализ визуальной сложности
   */
  public calculateVisualComplexity(detections: FrameAnalysisResult): number {
    const objectCount = detections.objects.length
    const faceCount = detections.faces.length
    const textCount = detections.text.length

    // Нормализуем количества
    const normalizedObjects = Math.min(objectCount / 10, 1)
    const normalizedFaces = Math.min(faceCount / 5, 1)
    const normalizedText = Math.min(textCount / 3, 1)

    // Композиционная сложность
    const compositionComplexity =
      (1 - detections.composition.balance) * 0.3 +
      (1 - detections.composition.ruleOfThirds) * 0.3 +
      (detections.composition.leadingLines ? 0.2 : 0) +
      (1 - detections.composition.colorHarmony) * 0.2

    // Общая сложность
    return (normalizedObjects + normalizedFaces + normalizedText + compositionComplexity) / 4
  }

  // Приватные методы

  private calculateRuleOfThirds(_frameData: ImageData | string): number {
    // TODO: Реализовать анализ правила третей
    // Проверить, насколько ключевые объекты расположены на линиях третей
    return 0.7 // Временное значение
  }

  private calculateBalance(_frameData: ImageData | string): number {
    // TODO: Реализовать анализ баланса композиции
    // Проверить распределение визуального веса
    return 0.8 // Временное значение
  }

  private detectLeadingLines(_frameData: ImageData | string): boolean {
    // TODO: Реализовать детекцию направляющих линий
    // Использовать Hough transform или подобные методы
    return false // Временное значение
  }

  private calculateDepth(_frameData: ImageData | string): number {
    // TODO: Реализовать оценку глубины сцены
    // Можно использовать размеры объектов и их позиции
    return 0.5 // Временное значение
  }

  private calculateColorHarmony(_frameData: ImageData | string): number {
    // TODO: Реализовать анализ цветовой гармонии
    // Проверить цветовую схему (комплементарная, аналоговая и т.д.)
    return 0.6 // Временное значение
  }

  private calculateIoU(box1: BoundingBox, box2: BoundingBox): number {
    const x1 = Math.max(box1.x, box2.x)
    const y1 = Math.max(box1.y, box2.y)
    const x2 = Math.min(box1.x + box1.width, box2.x + box2.width)
    const y2 = Math.min(box1.y + box1.height, box2.y + box2.height)

    if (x2 < x1 || y2 < y1) return 0

    const intersection = (x2 - x1) * (y2 - y1)
    const area1 = box1.width * box1.height
    const area2 = box2.width * box2.height
    const union = area1 + area2 - intersection

    return intersection / union
  }

  /**
   * Получить доминирующие цвета
   */
  public async extractDominantColors(
    _frameData: ImageData | string,
    _count = 5,
  ): Promise<Array<{ hex: string; percentage: number }>> {
    // TODO: Реализовать извлечение доминирующих цветов
    // Можно использовать k-means кластеризацию

    return [
      { hex: "#1a1a1a", percentage: 30 },
      { hex: "#f0f0f0", percentage: 25 },
      { hex: "#3498db", percentage: 20 },
      { hex: "#2ecc71", percentage: 15 },
      { hex: "#e74c3c", percentage: 10 },
    ]
  }

  /**
   * Обновить конфигурацию
   */
  public updateConfig(config: Partial<VisionServiceConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * Проверить готовность сервиса
   */
  public isReady(): boolean {
    return this.isInitialized
  }
}
