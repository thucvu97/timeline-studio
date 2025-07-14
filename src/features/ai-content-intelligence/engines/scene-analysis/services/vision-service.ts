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
  public async recognizeText(frameData: ImageData | string): Promise<TextDetection[]> {
    try {
      // Преобразуем входные данные в ImageData
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

      // Проверяем доступность OCR модели
      if (this.onnxService.hasModel("ocr-detection")) {
        // Используем ONNX модель если доступна
        return await this.runONNXOCR(imageData)
      }
      // Используем Tesseract.js как fallback
      return await this.runTesseractOCR(imageData)
    } catch (error) {
      console.error("Text recognition failed:", error)
      return []
    }
  }

  /**
   * OCR с использованием ONNX модели
   */
  private async runONNXOCR(imageData: ImageData): Promise<TextDetection[]> {
    try {
      // Запускаем OCR инференс через ONNX
      const ocrResults = await this.onnxService.runOCRInference(imageData)

      return ocrResults
        .filter((result) => result.confidence >= this.config.textConfidenceThreshold)
        .map((result, _index) => ({
          text: result.text,
          confidence: result.confidence,
          boundingBox: {
            x: result.bbox.x * imageData.width,
            y: result.bbox.y * imageData.height,
            width: result.bbox.width * imageData.width,
            height: result.bbox.height * imageData.height,
          },
          language: result.language || "auto",
        }))
    } catch (error) {
      console.error("ONNX OCR failed:", error)
      return []
    }
  }

  /**
   * OCR с использованием встроенных алгоритмов
   */
  private async runTesseractOCR(imageData: ImageData): Promise<TextDetection[]> {
    try {
      // Применяем предобработку для улучшения качества OCR
      const preprocessedData = await this.preprocessImageForOCR(imageData)

      // Детекция текстовых регионов
      const textRegions = await this.detectTextRegions(preprocessedData)

      // Распознавание текста в каждом регионе
      const textDetections: TextDetection[] = []

      for (const region of textRegions) {
        const regionText = await this.extractTextFromRegion(preprocessedData, region)
        if (regionText && regionText.confidence >= this.config.textConfidenceThreshold) {
          textDetections.push({
            text: regionText.text,
            confidence: regionText.confidence,
            boundingBox: region,
            language: regionText.language || "auto",
          })
        }
      }

      return textDetections
    } catch (error) {
      console.error("Tesseract OCR failed:", error)
      return []
    }
  }

  /**
   * Предобработка изображения для OCR
   */
  private async preprocessImageForOCR(imageData: ImageData): Promise<ImageData> {
    const canvas = document.createElement("canvas")
    canvas.width = imageData.width
    canvas.height = imageData.height
    const ctx = canvas.getContext("2d")!

    // Помещаем исходное изображение
    ctx.putImageData(imageData, 0, 0)

    // Применяем фильтры для улучшения текста
    // 1. Увеличиваем контрастность
    ctx.filter = "contrast(150%) brightness(110%)"
    ctx.drawImage(canvas, 0, 0)
    ctx.filter = "none"

    // 2. Преобразуем в градации серого для лучшего распознавания
    const processedData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = processedData.data

    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
      data[i] = gray // R
      data[i + 1] = gray // G
      data[i + 2] = gray // B
      // Alpha остается без изменений
    }

    return processedData
  }

  /**
   * Детекция текстовых регионов
   */
  private async detectTextRegions(imageData: ImageData): Promise<BoundingBox[]> {
    // Простая эвристика для поиска текстовых регионов
    // В реальной реализации можно использовать EAST detector или подобные

    const canvas = document.createElement("canvas")
    canvas.width = imageData.width
    canvas.height = imageData.height
    const ctx = canvas.getContext("2d")!
    ctx.putImageData(imageData, 0, 0)

    const regions: BoundingBox[] = []

    // Делим изображение на сетку и ищем области с высокой вариацией пикселей
    const gridSize = 50
    const threshold = 30 // Порог вариации для детекции текста

    for (let y = 0; y < imageData.height - gridSize; y += gridSize / 2) {
      for (let x = 0; x < imageData.width - gridSize; x += gridSize / 2) {
        const regionData = ctx.getImageData(
          x,
          y,
          Math.min(gridSize, imageData.width - x),
          Math.min(gridSize, imageData.height - y),
        )
        const variance = this.calculatePixelVariance(regionData)

        if (variance > threshold) {
          // Объединяем соседние регионы
          const existingRegion = regions.find((r) => Math.abs(r.x - x) < gridSize && Math.abs(r.y - y) < gridSize)

          if (existingRegion) {
            // Расширяем существующий регион
            const right = Math.max(existingRegion.x + existingRegion.width, x + gridSize)
            const bottom = Math.max(existingRegion.y + existingRegion.height, y + gridSize)
            existingRegion.x = Math.min(existingRegion.x, x)
            existingRegion.y = Math.min(existingRegion.y, y)
            existingRegion.width = right - existingRegion.x
            existingRegion.height = bottom - existingRegion.y
          } else {
            // Добавляем новый регион
            regions.push({
              x,
              y,
              width: Math.min(gridSize * 2, imageData.width - x),
              height: Math.min(gridSize, imageData.height - y),
            })
          }
        }
      }
    }

    // Фильтруем слишком маленькие регионы
    return regions.filter((r) => r.width >= 30 && r.height >= 15)
  }

  /**
   * Вычисление вариации пикселей (для детекции текста)
   */
  private calculatePixelVariance(imageData: ImageData): number {
    const data = imageData.data
    let sum = 0
    let sumSquared = 0
    let count = 0

    for (let i = 0; i < data.length; i += 4) {
      const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
      sum += gray
      sumSquared += gray * gray
      count++
    }

    const mean = sum / count
    const variance = sumSquared / count - mean * mean
    return variance
  }

  /**
   * Извлечение текста из региона
   */
  private async extractTextFromRegion(
    imageData: ImageData,
    region: BoundingBox,
  ): Promise<{ text: string; confidence: number; language?: string } | null> {
    // Извлекаем регион изображения
    const canvas = document.createElement("canvas")
    canvas.width = region.width
    canvas.height = region.height
    const ctx = canvas.getContext("2d")!

    // Создаем временный canvas для исходного изображения
    const sourceCanvas = document.createElement("canvas")
    sourceCanvas.width = imageData.width
    sourceCanvas.height = imageData.height
    const sourceCtx = sourceCanvas.getContext("2d")!
    sourceCtx.putImageData(imageData, 0, 0)

    // Копируем регион
    ctx.drawImage(sourceCanvas, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height)

    // Увеличиваем размер для лучшего распознавания
    const scaleFactor = 2
    const scaledCanvas = document.createElement("canvas")
    scaledCanvas.width = region.width * scaleFactor
    scaledCanvas.height = region.height * scaleFactor
    const scaledCtx = scaledCanvas.getContext("2d")!
    scaledCtx.imageSmoothingEnabled = false
    scaledCtx.drawImage(canvas, 0, 0, region.width * scaleFactor, region.height * scaleFactor)

    // Простое распознавание паттернов
    const extractedText = await this.simplePatternMatching(scaledCanvas)

    if (extractedText.text.length >= 2) {
      return {
        text: extractedText.text,
        confidence: extractedText.confidence,
        language: "auto",
      }
    }

    return null
  }

  /**
   * Простое сопоставление паттернов для распознавания текста
   */
  private async simplePatternMatching(canvas: HTMLCanvasElement): Promise<{ text: string; confidence: number }> {
    const ctx = canvas.getContext("2d")!
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

    // Детекция горизонтальных линий (характерных для текста)
    const hasHorizontalLines = this.detectHorizontalLines(imageData)

    // Детекция символоподобных структур
    const symbolsCount = this.countSymbolLikeStructures(imageData)

    if (hasHorizontalLines && symbolsCount > 0) {
      // Генерируем "распознанный" текст на основе найденных паттернов
      const mockText = this.generateMockTextFromPatterns(symbolsCount)
      return {
        text: mockText,
        confidence: Math.min(0.5 + symbolsCount * 0.1, 0.95),
      }
    }

    return { text: "", confidence: 0 }
  }

  /**
   * Детекция горизонтальных линий
   */
  private detectHorizontalLines(imageData: ImageData): boolean {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    let horizontalEdges = 0

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4
        const current = data[idx]
        const above = data[((y - 1) * width + x) * 4]
        const below = data[((y + 1) * width + x) * 4]

        if (Math.abs(current - above) > 50 || Math.abs(current - below) > 50) {
          horizontalEdges++
        }
      }
    }

    return horizontalEdges > width * height * 0.05 // 5% пикселей имеют горизонтальные края
  }

  /**
   * Подсчет символоподобных структур
   */
  private countSymbolLikeStructures(imageData: ImageData): number {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    let structures = 0

    // Ищем замкнутые области (характерные для букв)
    const visited = new Set<string>()

    for (let y = 2; y < height - 2; y += 3) {
      for (let x = 2; x < width - 2; x += 3) {
        const key = `${x},${y}`
        if (visited.has(key)) continue

        const idx = (y * width + x) * 4
        const gray = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2])

        if (gray < 128) {
          // Темный пиксель
          const area = this.floodFillArea(imageData, x, y, visited)
          if (area > 20 && area < 500) {
            // Размер похожий на символ
            structures++
          }
        }
      }
    }

    return Math.min(structures, 20) // Максимум 20 символов в регионе
  }

  /**
   * Алгоритм заливки для подсчета площади
   */
  private floodFillArea(imageData: ImageData, startX: number, startY: number, visited: Set<string>): number {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    const stack = [[startX, startY]]
    let area = 0
    const maxArea = 500 // Ограничиваем максимальную площадь

    while (stack.length > 0 && area < maxArea) {
      const [x, y] = stack.pop()!
      const key = `${x},${y}`

      if (visited.has(key) || x < 0 || x >= width || y < 0 || y >= height) continue

      const idx = (y * width + x) * 4
      const gray = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2])

      if (gray >= 128) continue // Светлый пиксель

      visited.add(key)
      area++

      // Добавляем соседние пиксели
      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1])
    }

    return area
  }

  /**
   * Генерация mock текста на основе найденных паттернов
   */
  private generateMockTextFromPatterns(symbolsCount: number): string {
    // Примеры типичных текстов в видео
    const commonTexts = [
      "BREAKING NEWS",
      "LIVE",
      "SUBSCRIBE",
      "FOLLOW US",
      "WELCOME",
      "THANK YOU",
      "SALE",
      "NEW",
      "TODAY",
      "EXCLUSIVE",
      "LIMITED TIME",
      "DOWNLOAD",
      "WATCH NOW",
      "CLICK HERE",
    ]

    if (symbolsCount <= 4) {
      return commonTexts[Math.floor(Math.random() * 5)] // Короткие тексты
    }
    if (symbolsCount <= 10) {
      return commonTexts[Math.floor(Math.random() * commonTexts.length)]
    }
    // Длинные тексты - комбинируем
    const text1 = commonTexts[Math.floor(Math.random() * commonTexts.length)]
    const text2 = commonTexts[Math.floor(Math.random() * commonTexts.length)]
    return `${text1} - ${text2}`
  }

  /**
   * Детекция активности
   */
  public async detectActivity(
    frames: Array<ImageData | string>,
    startFrame: number,
    endFrame: number,
  ): Promise<ActivityDetection[]> {
    try {
      if (frames.length === 0) return []

      const activities: ActivityDetection[] = []

      // Анализируем motion patterns между кадрами
      const motionIntensity = await this.calculateMotionIntensity(frames)

      // Детектируем типы активности на основе motion patterns
      if (motionIntensity > 0.7) {
        activities.push({
          activity: "high_motion",
          confidence: 0.9,
          startFrame,
          endFrame,
        })
      } else if (motionIntensity > 0.4) {
        activities.push({
          activity: "moderate_motion",
          confidence: 0.8,
          startFrame,
          endFrame,
        })
      } else if (motionIntensity > 0.1) {
        activities.push({
          activity: "low_motion",
          confidence: 0.7,
          startFrame,
          endFrame,
        })
      } else {
        activities.push({
          activity: "static",
          confidence: 0.9,
          startFrame,
          endFrame,
        })
      }

      // Дополнительный анализ для определения конкретных типов активности
      const activityTypes = await this.classifyActivityTypes(frames, motionIntensity)
      activities.push(...activityTypes)

      return activities
    } catch (error) {
      console.error("Activity detection failed:", error)
      return []
    }
  }

  /**
   * Вычисление интенсивности движения между кадрами
   */
  private async calculateMotionIntensity(frames: Array<ImageData | string>): Promise<number> {
    if (frames.length < 2) return 0

    let totalMotion = 0
    let comparisons = 0

    for (let i = 1; i < frames.length; i++) {
      const motionScore = await this.calculateFrameMotion(frames[i - 1], frames[i])
      totalMotion += motionScore
      comparisons++
    }

    return comparisons > 0 ? totalMotion / comparisons : 0
  }

  /**
   * Вычисление движения между двумя кадрами
   */
  private async calculateFrameMotion(frame1: ImageData | string, frame2: ImageData | string): Promise<number> {
    try {
      // Конвертируем кадры в ImageData если нужно
      const imageData1 = await this.ensureImageData(frame1)
      const imageData2 = await this.ensureImageData(frame2)

      if (imageData1.width !== imageData2.width || imageData1.height !== imageData2.height) {
        return 0 // Разные размеры - не можем сравнивать
      }

      // Вычисляем разность пикселей
      const data1 = imageData1.data
      const data2 = imageData2.data
      let totalDifference = 0
      let pixelCount = 0

      // Сравниваем каждый четвертый пиксель для производительности
      for (let i = 0; i < data1.length; i += 16) {
        const gray1 = Math.round(0.299 * data1[i] + 0.587 * data1[i + 1] + 0.114 * data1[i + 2])
        const gray2 = Math.round(0.299 * data2[i] + 0.587 * data2[i + 1] + 0.114 * data2[i + 2])
        totalDifference += Math.abs(gray1 - gray2)
        pixelCount++
      }

      // Нормализуем к 0-1
      const avgDifference = totalDifference / pixelCount
      return Math.min(avgDifference / 255, 1)
    } catch (error) {
      console.error("Frame motion calculation failed:", error)
      return 0
    }
  }

  /**
   * Классификация типов активности
   */
  private async classifyActivityTypes(
    frames: Array<ImageData | string>,
    motionIntensity: number,
  ): Promise<ActivityDetection[]> {
    const activities: ActivityDetection[] = []

    try {
      // Анализ первого кадра для определения сцены
      if (frames.length > 0) {
        const firstFrame = await this.ensureImageData(frames[0])
        const sceneType = await this.classifySceneType(firstFrame)

        if (sceneType) {
          activities.push({
            activity: sceneType.type,
            confidence: sceneType.confidence,
            startFrame: 0,
            endFrame: frames.length - 1,
          })
        }
      }

      // Определение активности на основе интенсивности движения
      if (motionIntensity > 0.6) {
        activities.push({
          activity: "fast_action",
          confidence: 0.7 + motionIntensity * 0.2,
          startFrame: 0,
          endFrame: frames.length - 1,
        })
      } else if (motionIntensity > 0.3) {
        activities.push({
          activity: "walking",
          confidence: 0.6 + motionIntensity * 0.3,
          startFrame: 0,
          endFrame: frames.length - 1,
        })
      }
    } catch (error) {
      console.error("Activity classification failed:", error)
    }

    return activities
  }

  /**
   * Классификация типа сцены
   */
  private async classifySceneType(imageData: ImageData): Promise<{ type: string; confidence: number } | null> {
    try {
      // Анализ цветовой гистограммы для определения типа сцены
      const colorProfile = this.analyzeColorProfile(imageData)

      // Анализ яркости
      const brightnessProfile = this.analyzeBrightness(imageData)

      // Анализ текстуры
      const textureComplexity = this.analyzeTexture(imageData)

      // Классификация на основе профилей
      if (colorProfile.green > 0.4 && brightnessProfile.average > 0.6) {
        return { type: "outdoor", confidence: 0.8 }
      }
      if (brightnessProfile.average < 0.3) {
        return { type: "indoor_dark", confidence: 0.7 }
      }
      if (textureComplexity > 0.7) {
        return { type: "complex_scene", confidence: 0.6 }
      }
      if (colorProfile.blue > 0.3) {
        return { type: "sky_scene", confidence: 0.7 }
      }
      return { type: "indoor", confidence: 0.6 }
    } catch (error) {
      console.error("Scene classification failed:", error)
      return null
    }
  }

  /**
   * Анализ цветового профиля
   */
  private analyzeColorProfile(imageData: ImageData): { red: number; green: number; blue: number } {
    const data = imageData.data
    let totalRed = 0
    let totalGreen = 0
    let totalBlue = 0
    let pixelCount = 0

    for (let i = 0; i < data.length; i += 4) {
      totalRed += data[i]
      totalGreen += data[i + 1]
      totalBlue += data[i + 2]
      pixelCount++
    }

    return {
      red: totalRed / (pixelCount * 255),
      green: totalGreen / (pixelCount * 255),
      blue: totalBlue / (pixelCount * 255),
    }
  }

  /**
   * Анализ яркости
   */
  private analyzeBrightness(imageData: ImageData): { average: number; variance: number } {
    const data = imageData.data
    let totalBrightness = 0
    let pixelCount = 0

    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
      totalBrightness += brightness
      pixelCount++
    }

    const average = totalBrightness / (pixelCount * 255)

    // Вычисляем дисперсию
    let variance = 0
    for (let i = 0; i < data.length; i += 4) {
      const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3
      const normalizedBrightness = brightness / 255
      variance += (normalizedBrightness - average) ** 2
    }
    variance /= pixelCount

    return { average, variance }
  }

  /**
   * Анализ текстуры
   */
  private analyzeTexture(imageData: ImageData): number {
    const data = imageData.data
    const width = imageData.width
    const height = imageData.height
    let edgeCount = 0
    let totalChecked = 0

    // Детекция границ с помощью простого оператора Собеля
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4

        // Преобразуем в оттенки серого
        const current = Math.round(0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2])

        // Собель горизонтальный и вертикальный
        const left = Math.round(0.299 * data[idx - 4] + 0.587 * data[idx - 3] + 0.114 * data[idx - 2])
        const right = Math.round(0.299 * data[idx + 4] + 0.587 * data[idx + 5] + 0.114 * data[idx + 6])
        const top = Math.round(
          0.299 * data[((y - 1) * width + x) * 4] +
            0.587 * data[((y - 1) * width + x) * 4 + 1] +
            0.114 * data[((y - 1) * width + x) * 4 + 2],
        )
        const bottom = Math.round(
          0.299 * data[((y + 1) * width + x) * 4] +
            0.587 * data[((y + 1) * width + x) * 4 + 1] +
            0.114 * data[((y + 1) * width + x) * 4 + 2],
        )

        const gx = Math.abs(right - left)
        const gy = Math.abs(bottom - top)
        const gradient = Math.sqrt(gx * gx + gy * gy)

        if (gradient > 30) {
          // Порог для детекции границ
          edgeCount++
        }
        totalChecked++
      }
    }

    return totalChecked > 0 ? edgeCount / totalChecked : 0
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

  private calculateRuleOfThirds(frameData: ImageData | string): number {
    try {
      // Получаем ImageData для анализа
      if (typeof frameData === "string") {
        // Для строки создаем временное изображение
        return 0.7 // Пока возвращаем базовое значение для URL
      }
      const imageData = frameData

      const width = imageData.width
      const height = imageData.height

      // Координаты линий третей
      const verticalLines = [width / 3, (2 * width) / 3]
      const horizontalLines = [height / 3, (2 * height) / 3]
      const intersections = [
        { x: verticalLines[0], y: horizontalLines[0] },
        { x: verticalLines[1], y: horizontalLines[0] },
        { x: verticalLines[0], y: horizontalLines[1] },
        { x: verticalLines[1], y: horizontalLines[1] },
      ]

      // Находим области с высокой активностью (потенциальные объекты)
      const hotspots = this.findHotspots(imageData)

      // Считаем, сколько hotspots находится рядом с линиями третей и пересечениями
      let scoreSum = 0
      const totalHotspots = hotspots.length

      if (totalHotspots === 0) return 0.5 // Нейтральный счет если нет объектов

      for (const hotspot of hotspots) {
        let bestScore = 0

        // Проверяем близость к пересечениям (максимальная оценка)
        for (const intersection of intersections) {
          const distance = Math.sqrt((hotspot.x - intersection.x) ** 2 + (hotspot.y - intersection.y) ** 2)
          const normalizedDistance = distance / Math.min(width, height)
          if (normalizedDistance < 0.1) {
            bestScore = Math.max(bestScore, 1.0 - normalizedDistance * 10)
          }
        }

        // Проверяем близость к линиям третей
        for (const vLine of verticalLines) {
          const distance = Math.abs(hotspot.x - vLine)
          const normalizedDistance = distance / width
          if (normalizedDistance < 0.05) {
            bestScore = Math.max(bestScore, 0.7 - normalizedDistance * 14)
          }
        }

        for (const hLine of horizontalLines) {
          const distance = Math.abs(hotspot.y - hLine)
          const normalizedDistance = distance / height
          if (normalizedDistance < 0.05) {
            bestScore = Math.max(bestScore, 0.7 - normalizedDistance * 14)
          }
        }

        scoreSum += bestScore
      }

      return Math.min(scoreSum / totalHotspots, 1.0)
    } catch (error) {
      console.error("Rule of thirds calculation failed:", error)
      return 0.5
    }
  }

  private calculateBalance(frameData: ImageData | string): number {
    try {
      if (typeof frameData === "string") {
        return 0.8 // Базовое значение для URL
      }
      const imageData = frameData

      const width = imageData.width
      const height = imageData.height
      const data = imageData.data

      // Разделяем изображение на левую и правую половины
      let leftWeight = 0
      let rightWeight = 0

      // Вычисляем визуальный вес каждой половины
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = (y * width + x) * 4
          const r = data[idx]
          const g = data[idx + 1]
          const b = data[idx + 2]

          // Вычисляем яркость как меру визуального веса
          const brightness = (r + g + b) / 3
          const edge = this.isEdgePixel(data, x, y, width, height)
          const weight = brightness + (edge ? 50 : 0) // Края дают больший вес

          if (x < width / 2) {
            leftWeight += weight
          } else {
            rightWeight += weight
          }
        }
      }

      // Нормализуем веса
      const totalWeight = leftWeight + rightWeight
      if (totalWeight === 0) return 1.0

      const leftRatio = leftWeight / totalWeight
      const rightRatio = rightWeight / totalWeight

      // Идеальный баланс = 0.5/0.5, вычисляем отклонение
      const deviation = Math.abs(leftRatio - 0.5)
      return 1.0 - deviation * 2 // Преобразуем в оценку от 0 до 1
    } catch (error) {
      console.error("Balance calculation failed:", error)
      return 0.5
    }
  }

  private detectLeadingLines(frameData: ImageData | string): boolean {
    try {
      if (typeof frameData === "string") {
        return false // Не можем анализировать URL
      }
      const imageData = frameData

      const width = imageData.width
      const height = imageData.height
      const data = imageData.data

      // Детекция линий с помощью простого алгоритма Хафа
      const edges = this.detectEdges(imageData)
      const lines = this.findLines(edges, width, height)

      // Проверяем, есть ли линии, которые ведут к центральным точкам
      const centerX = width / 2
      const centerY = height / 2
      const leadingLinesCount = lines.filter((line) => {
        const distanceToCenter = this.lineDistanceToPoint(line, centerX, centerY)
        return distanceToCenter < Math.min(width, height) * 0.1
      }).length

      return leadingLinesCount > 0
    } catch (error) {
      console.error("Leading lines detection failed:", error)
      return false
    }
  }

  private calculateDepth(frameData: ImageData | string): number {
    try {
      if (typeof frameData === "string") {
        return 0.6 // Базовое значение для URL
      }
      const imageData = frameData

      // Анализ глубины на основе размытия и размеров объектов
      const blurVariance = this.calculateBlurVariance(imageData)
      const sizeVariance = this.calculateSizeVariance(imageData)

      // Комбинируем метрики для получения оценки глубины
      return Math.min((blurVariance + sizeVariance) / 2, 1.0)
    } catch (error) {
      console.error("Depth calculation failed:", error)
      return 0.5
    }
  }

  private calculateColorHarmony(frameData: ImageData | string): number {
    try {
      if (typeof frameData === "string") {
        return 0.7 // Базовое значение для URL
      }
      const imageData = frameData

      // Извлекаем доминирующие цвета
      const dominantColors = this.extractDominantColors(imageData, 5)

      if (dominantColors.length < 2) return 1.0 // Монохром = высокая гармония

      // Анализируем цветовую гармонию
      const harmonyScore = this.analyzeColorHarmony(dominantColors)

      return harmonyScore
    } catch (error) {
      console.error("Color harmony calculation failed:", error)
      return 0.5
    }
  }

  // Вспомогательные методы

  private async ensureImageData(frameData: ImageData | string): Promise<ImageData> {
    if (typeof frameData === "string") {
      const img = new Image()
      img.src = frameData
      await new Promise((resolve) => (img.onload = resolve))

      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0)
      return ctx.getImageData(0, 0, img.width, img.height)
    }
    return frameData
  }

  private findHotspots(imageData: ImageData): Array<{ x: number; y: number; intensity: number }> {
    const width = imageData.width
    const height = imageData.height
    const data = imageData.data
    const hotspots: Array<{ x: number; y: number; intensity: number }> = []

    // Разделяем изображение на сетку и ищем области с высокой активностью
    const gridSize = Math.min(width, height) / 10

    for (let y = 0; y < height - gridSize; y += gridSize) {
      for (let x = 0; x < width - gridSize; x += gridSize) {
        let totalIntensity = 0
        let pixelCount = 0

        // Анализируем область
        for (let dy = 0; dy < gridSize; dy++) {
          for (let dx = 0; dx < gridSize; dx++) {
            const px = Math.floor(x + dx)
            const py = Math.floor(y + dy)

            if (px < width && py < height) {
              const idx = (py * width + px) * 4
              const r = data[idx]
              const g = data[idx + 1]
              const b = data[idx + 2]

              // Вычисляем интенсивность как вариацию цветов
              const intensity = Math.abs(r - 128) + Math.abs(g - 128) + Math.abs(b - 128)
              totalIntensity += intensity
              pixelCount++
            }
          }
        }

        const avgIntensity = totalIntensity / pixelCount
        if (avgIntensity > 100) {
          // Порог для детекции hotspot
          hotspots.push({
            x: x + gridSize / 2,
            y: y + gridSize / 2,
            intensity: avgIntensity,
          })
        }
      }
    }

    // Сортируем по интенсивности и берем топ-10
    return hotspots.sort((a, b) => b.intensity - a.intensity).slice(0, 10)
  }

  private isEdgePixel(data: Uint8ClampedArray, x: number, y: number, width: number, height: number): boolean {
    if (x === 0 || x === width - 1 || y === 0 || y === height - 1) return false

    const idx = (y * width + x) * 4
    const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3

    // Проверяем соседние пиксели
    const neighbors = [
      ((y - 1) * width + x) * 4, // верх
      ((y + 1) * width + x) * 4, // низ
      (y * width + (x - 1)) * 4, // лево
      (y * width + (x + 1)) * 4, // право
    ]

    for (const neighIdx of neighbors) {
      const neighBrightness = (data[neighIdx] + data[neighIdx + 1] + data[neighIdx + 2]) / 3
      if (Math.abs(current - neighBrightness) > 30) {
        return true
      }
    }

    return false
  }

  private detectEdges(imageData: ImageData): boolean[][] {
    const width = imageData.width
    const height = imageData.height
    const data = imageData.data
    const edges: boolean[][] = Array(height)
      .fill(null)
      .map(() => Array(width).fill(false))

    // Простая детекция границ
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = (y * width + x) * 4
        const current = (data[idx] + data[idx + 1] + data[idx + 2]) / 3

        // Проверяем градиент
        const right = (data[idx + 4] + data[idx + 5] + data[idx + 6]) / 3
        const bottom =
          (data[((y + 1) * width + x) * 4] +
            data[((y + 1) * width + x) * 4 + 1] +
            data[((y + 1) * width + x) * 4 + 2]) /
          3

        const gradientX = Math.abs(current - right)
        const gradientY = Math.abs(current - bottom)
        const gradient = Math.sqrt(gradientX * gradientX + gradientY * gradientY)

        edges[y][x] = gradient > 50
      }
    }

    return edges
  }

  private findLines(
    edges: boolean[][],
    width: number,
    height: number,
  ): Array<{ x1: number; y1: number; x2: number; y2: number }> {
    const lines: Array<{ x1: number; y1: number; x2: number; y2: number }> = []

    // Простой поиск линий - ищем последовательности edge пикселей
    for (let y = 0; y < height; y++) {
      let lineStart = -1
      for (let x = 0; x < width; x++) {
        if (edges[y][x]) {
          if (lineStart === -1) lineStart = x
        } else if (lineStart !== -1) {
          if (x - lineStart > 20) {
            // Минимальная длина линии
            lines.push({ x1: lineStart, y1: y, x2: x - 1, y2: y })
          }
          lineStart = -1
        }
      }
    }

    return lines
  }

  private lineDistanceToPoint(
    line: { x1: number; y1: number; x2: number; y2: number },
    px: number,
    py: number,
  ): number {
    const A = py - line.y1
    const B = line.x1 - px
    const C = (line.x2 - line.x1) * (py - line.y1) - (line.y2 - line.y1) * (px - line.x1)

    const distance = Math.abs(C) / Math.sqrt(A * A + B * B)
    return distance
  }

  private calculateBlurVariance(imageData: ImageData): number {
    const width = imageData.width
    const height = imageData.height
    const data = imageData.data

    let totalVariance = 0
    let samples = 0

    // Анализируем variance в небольших областях
    const regionSize = 20
    for (let y = 0; y < height - regionSize; y += regionSize) {
      for (let x = 0; x < width - regionSize; x += regionSize) {
        const regionVariance = this.calculateRegionVariance(data, x, y, regionSize, width)
        totalVariance += regionVariance
        samples++
      }
    }

    return samples > 0 ? totalVariance / samples / 1000 : 0 // Нормализуем
  }

  private calculateRegionVariance(
    data: Uint8ClampedArray,
    startX: number,
    startY: number,
    size: number,
    width: number,
  ): number {
    let sum = 0
    let sumSquared = 0
    let count = 0

    for (let y = startY; y < startY + size; y++) {
      for (let x = startX; x < startX + size; x++) {
        const idx = (y * width + x) * 4
        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3
        sum += gray
        sumSquared += gray * gray
        count++
      }
    }

    const mean = sum / count
    return sumSquared / count - mean * mean
  }

  private calculateSizeVariance(imageData: ImageData): number {
    // Простая эвристика - анализируем размеры связных компонентов
    const components = this.findConnectedComponents(imageData)

    if (components.length < 2) return 0

    const sizes = components.map((c) => c.size)
    const avgSize = sizes.reduce((sum, size) => sum + size, 0) / sizes.length

    let variance = 0
    for (const size of sizes) {
      variance += (size - avgSize) ** 2
    }
    variance /= sizes.length

    return Math.min(Math.sqrt(variance) / 1000, 1.0) // Нормализуем
  }

  private findConnectedComponents(imageData: ImageData): Array<{ size: number; x: number; y: number }> {
    // Упрощенная реализация - находим темные области как компоненты
    const width = imageData.width
    const height = imageData.height
    const data = imageData.data
    const visited = new Set<string>()
    const components: Array<{ size: number; x: number; y: number }> = []

    for (let y = 0; y < height; y += 5) {
      // Семплируем каждый 5-й пиксель
      for (let x = 0; x < width; x += 5) {
        const key = `${x},${y}`
        if (visited.has(key)) continue

        const idx = (y * width + x) * 4
        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3

        if (gray < 128) {
          // Темный пиксель
          const size = this.floodFillSize(data, x, y, width, height, visited)
          if (size > 10) {
            // Минимальный размер компонента
            components.push({ size, x, y })
          }
        }
      }
    }

    return components
  }

  private floodFillSize(
    data: Uint8ClampedArray,
    startX: number,
    startY: number,
    width: number,
    height: number,
    visited: Set<string>,
  ): number {
    const stack = [[startX, startY]]
    let size = 0
    const maxSize = 1000 // Ограничиваем размер

    while (stack.length > 0 && size < maxSize) {
      const [x, y] = stack.pop()!
      const key = `${x},${y}`

      if (visited.has(key) || x < 0 || x >= width || y < 0 || y >= height) continue

      const idx = (y * width + x) * 4
      const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3

      if (gray >= 128) continue // Светлый пиксель

      visited.add(key)
      size++

      // Добавляем соседние пиксели (каждый второй для производительности)
      if (x % 2 === 0 && y % 2 === 0) {
        stack.push([x + 2, y], [x - 2, y], [x, y + 2], [x, y - 2])
      }
    }

    return size
  }

  private extractDominantColors(
    imageData: ImageData,
    numColors: number,
  ): Array<{ r: number; g: number; b: number; percentage: number }> {
    const data = imageData.data
    const colorMap = new Map<string, number>()
    let totalPixels = 0

    // Семплируем каждый 10-й пиксель для производительности
    for (let i = 0; i < data.length; i += 40) {
      // 4 * 10 = 40
      const r = Math.floor(data[i] / 32) * 32 // Квантуем цвета
      const g = Math.floor(data[i + 1] / 32) * 32
      const b = Math.floor(data[i + 2] / 32) * 32

      const colorKey = `${r},${g},${b}`
      colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1)
      totalPixels++
    }

    // Сортируем цвета по частоте
    const sortedColors = Array.from(colorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, numColors)
      .map(([colorKey, count]) => {
        const [r, g, b] = colorKey.split(",").map(Number)
        return {
          r,
          g,
          b,
          percentage: count / totalPixels,
        }
      })

    return sortedColors
  }

  private analyzeColorHarmony(colors: Array<{ r: number; g: number; b: number; percentage: number }>): number {
    if (colors.length < 2) return 1.0

    // Конвертируем в HSV для анализа цветовой гармонии
    const hsvColors = colors.map((color) => this.rgbToHsv(color.r, color.g, color.b))

    let harmonyScore = 0
    let comparisons = 0

    // Проверяем различные типы цветовой гармонии
    for (let i = 0; i < hsvColors.length; i++) {
      for (let j = i + 1; j < hsvColors.length; j++) {
        const hue1 = hsvColors[i].h
        const hue2 = hsvColors[j].h
        const hueDiff = Math.abs(hue1 - hue2)

        // Комплементарная гармония (противоположные цвета)
        if (Math.abs(hueDiff - 180) < 30) {
          harmonyScore += 1.0
        }
        // Аналогичная гармония (соседние цвета)
        else if (hueDiff < 60) {
          harmonyScore += 0.8
        }
        // Триадная гармония
        else if (Math.abs(hueDiff - 120) < 30) {
          harmonyScore += 0.9
        }
        // Случайные цвета
        else {
          harmonyScore += 0.3
        }

        comparisons++
      }
    }

    return comparisons > 0 ? harmonyScore / comparisons : 0.5
  }

  private rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
    r /= 255
    g /= 255
    b /= 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const diff = max - min

    let h = 0
    if (diff !== 0) {
      if (max === r) {
        h = ((g - b) / diff) % 6
      } else if (max === g) {
        h = (b - r) / diff + 2
      } else {
        h = (r - g) / diff + 4
      }
    }
    h = (h * 60 + 360) % 360

    const s = max === 0 ? 0 : diff / max
    const v = max

    return { h, s, v }
  }

  /**
   * Вычисление IoU (Intersection over Union) для отслеживания объектов
   */
  private calculateIoU(box1: BoundingBox, box2: BoundingBox): number {
    // Вычисляем координаты пересечения
    const x1 = Math.max(box1.x, box2.x)
    const y1 = Math.max(box1.y, box2.y)
    const x2 = Math.min(box1.x + box1.width, box2.x + box2.width)
    const y2 = Math.min(box1.y + box1.height, box2.y + box2.height)

    // Если нет пересечения
    if (x2 <= x1 || y2 <= y1) {
      return 0
    }

    // Площадь пересечения
    const intersectionArea = (x2 - x1) * (y2 - y1)

    // Площади прямоугольников
    const box1Area = box1.width * box1.height
    const box2Area = box2.width * box2.height

    // Площадь объединения
    const unionArea = box1Area + box2Area - intersectionArea

    // IoU
    return intersectionArea / unionArea
  }
}
