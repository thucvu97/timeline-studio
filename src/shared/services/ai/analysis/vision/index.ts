/**
 * Vision Analysis Service
 * Адаптер для компьютерного зрения и анализа изображений
 */

// Экспорт object tracking и onnx runtime
export * from "./object-tracking"
export * from "./onnx-runtime"

import type {
  ColorAnalysis,
  CompositionAnalysis,
  DetectedObject,
  ExtractedText,
  FrameAnalysis,
  FrameAnalysisResult,
  IVisionService,
} from "../interfaces"

// Импорт существующих сервисов (временно, до полной миграции)
let VisionAnalysisService: any = null
let YOLOService: any = null

try {
  // Динамический импорт YOLO сервиса
  YOLOService = require("@/features/recognition/services/yolo-service").YOLOService
} catch (error) {
  console.warn("YOLO service not available:", error)
}

// VisionAnalysisService пока не существует, используем заглушку

export class VisionAdapter implements IVisionService {
  private visionService: any
  private yoloService: any

  constructor() {
    if (VisionAnalysisService) {
      this.visionService = VisionAnalysisService.getInstance()
    }
    if (YOLOService) {
      this.yoloService = YOLOService.getInstance()
    }
  }

  async analyzeFrame(imagePath: string): Promise<FrameAnalysisResult> {
    if (!this.visionService) {
      throw new Error("Vision service not available")
    }

    try {
      // Параллельно выполняем все виды анализа
      const [objects, text, faces] = await Promise.all([
        this.detectObjects(imagePath),
        this.extractText(imagePath),
        this.detectFaces(imagePath),
      ])

      // Преобразуем к формату FrameAnalysisResult
      return {
        objects: objects.map((obj) => ({
          label: obj.class,
          confidence: obj.confidence,
          bbox: {
            x: obj.boundingBox.x,
            y: obj.boundingBox.y,
            width: obj.boundingBox.width,
            height: obj.boundingBox.height,
          },
        })),
        faces: faces,
        text: text.map((t) => ({
          text: t.text,
          confidence: t.confidence,
          bbox: {
            x: t.boundingBox.x,
            y: t.boundingBox.y,
            width: t.boundingBox.width,
            height: t.boundingBox.height,
          },
        })),
        scene: {
          type: "unknown",
          confidence: 0.5,
          attributes: [],
        },
        nsfw: {
          safe: 0.9,
          suggestive: 0.08,
          explicit: 0.02,
        },
      }
    } catch (error) {
      throw new Error(`Frame analysis error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async analyzeFrames(imagePaths: string[]): Promise<FrameAnalysis[]> {
    // Анализируем кадры батчами для оптимизации
    const batchSize = 5
    const results: FrameAnalysis[] = []

    for (let i = 0; i < imagePaths.length; i += batchSize) {
      const batch = imagePaths.slice(i, i + batchSize)
      const batchResults = await Promise.all(
        batch.map(async (path) => {
          const frameResult = await this.analyzeFrame(path)

          // Преобразуем FrameAnalysisResult обратно в FrameAnalysis для совместимости
          const [composition, colors, quality] = await Promise.all([
            this.analyzeComposition(path),
            this.analyzeColors(path),
            this.analyzeFrameQuality(path),
          ])

          return {
            id: `frame_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
            timestamp: Date.now(),
            objects: frameResult.objects.map((obj) => ({
              class: obj.label,
              confidence: obj.confidence,
              boundingBox: {
                x: obj.bbox.x,
                y: obj.bbox.y,
                width: obj.bbox.width,
                height: obj.bbox.height,
              },
              attributes: {},
            })),
            text: frameResult.text.map((t) => ({
              text: t.text,
              confidence: t.confidence,
              boundingBox: {
                x: t.bbox.x,
                y: t.bbox.y,
                width: t.bbox.width,
                height: t.bbox.height,
              },
              language: "unknown",
            })),
            composition,
            colors,
            quality,
          } as FrameAnalysis
        }),
      )
      results.push(...batchResults)
    }

    return results
  }

  async detectObjects(imagePath: string): Promise<DetectedObject[]> {
    if (!this.yoloService && !this.visionService) {
      return []
    }

    try {
      // Используем YOLO сервис если доступен, иначе fallback на vision service
      const service = this.yoloService || this.visionService
      const detections = await service.detectObjects(imagePath)

      return (
        detections?.map((detection: any) => ({
          class: detection.class || detection.label || "unknown",
          confidence: detection.confidence || detection.score || 0.5,
          boundingBox: {
            x: detection.bbox?.x || detection.x || 0,
            y: detection.bbox?.y || detection.y || 0,
            width: detection.bbox?.width || detection.width || 0,
            height: detection.bbox?.height || detection.height || 0,
          },
          attributes: detection.attributes || {},
        })) || []
      )
    } catch (error) {
      console.warn(`Object detection failed for ${imagePath}:`, error)
      return []
    }
  }

  async extractText(imagePath: string): Promise<ExtractedText[]> {
    if (!this.visionService) {
      return []
    }

    try {
      const textResults = await this.visionService.extractText(imagePath)

      return (
        textResults?.map((result: any) => ({
          text: result.text || "",
          confidence: result.confidence || 0.8,
          boundingBox: {
            x: result.bbox?.x || result.x || 0,
            y: result.bbox?.y || result.y || 0,
            width: result.bbox?.width || result.width || 0,
            height: result.bbox?.height || result.height || 0,
          },
          language: result.language || "unknown",
        })) || []
      )
    } catch (error) {
      console.warn(`Text extraction failed for ${imagePath}:`, error)
      return []
    }
  }

  async analyzeComposition(imagePath: string): Promise<CompositionAnalysis> {
    if (!this.visionService) {
      return this.getDefaultComposition()
    }

    try {
      const composition = await this.visionService.analyzeComposition(imagePath)

      return {
        ruleOfThirds: {
          score: composition.ruleOfThirds?.score || 50,
          points:
            composition.ruleOfThirds?.points?.map((p: any) => ({
              x: p.x || 0,
              y: p.y || 0,
            })) || [],
        },
        leadingLines: {
          score: composition.leadingLines?.score || 50,
          lines:
            composition.leadingLines?.lines?.map((line: any) => ({
              start: { x: line.start?.x || 0, y: line.start?.y || 0 },
              end: { x: line.end?.x || 0, y: line.end?.y || 0 },
              angle: line.angle || 0,
            })) || [],
        },
        balance: {
          score: composition.balance?.score || 50,
          centerOfMass: {
            x: composition.balance?.centerOfMass?.x || 0.5,
            y: composition.balance?.centerOfMass?.y || 0.5,
          },
        },
        symmetry: {
          score: composition.symmetry?.score || 50,
          axis: composition.symmetry?.axis || undefined,
        },
      }
    } catch (error) {
      console.warn(`Composition analysis failed for ${imagePath}:`, error)
      return this.getDefaultComposition()
    }
  }

  async analyzeColors(imagePath: string): Promise<ColorAnalysis> {
    if (!this.visionService) {
      return this.getDefaultColors()
    }

    try {
      const colorAnalysis = await this.visionService.analyzeColors(imagePath)

      return {
        dominantColors:
          colorAnalysis.dominantColors?.map((color: any) => ({
            r: color.r || 0,
            g: color.g || 0,
            b: color.b || 0,
            hex: color.hex || "#000000",
            percentage: color.percentage || 0,
          })) || [],
        palette:
          colorAnalysis.palette?.map((color: any) => ({
            r: color.r || 0,
            g: color.g || 0,
            b: color.b || 0,
            hex: color.hex || "#000000",
            percentage: color.percentage || 0,
          })) || [],
        temperature: colorAnalysis.temperature || "neutral",
        saturation: colorAnalysis.saturation || "medium",
        brightness: colorAnalysis.brightness || "medium",
      }
    } catch (error) {
      console.warn(`Color analysis failed for ${imagePath}:`, error)
      return this.getDefaultColors()
    }
  }

  private async analyzeFrameQuality(imagePath: string): Promise<{
    sharpness: number
    brightness: number
    contrast: number
  }> {
    if (!this.visionService) {
      return { sharpness: 75, brightness: 75, contrast: 75 }
    }

    try {
      const quality = await this.visionService.analyzeFrameQuality(imagePath)

      return {
        sharpness: quality.sharpness || 75,
        brightness: quality.brightness || 75,
        contrast: quality.contrast || 75,
      }
    } catch (error) {
      console.warn(`Frame quality analysis failed for ${imagePath}:`, error)
      return { sharpness: 75, brightness: 75, contrast: 75 }
    }
  }

  private getDefaultComposition(): CompositionAnalysis {
    return {
      ruleOfThirds: { score: 50, points: [] },
      leadingLines: { score: 50, lines: [] },
      balance: { score: 50, centerOfMass: { x: 0.5, y: 0.5 } },
      symmetry: { score: 50 },
    }
  }

  private getDefaultColors(): ColorAnalysis {
    return {
      dominantColors: [],
      palette: [],
      temperature: "neutral",
      saturation: "medium",
      brightness: "medium",
    }
  }

  // Недостающие методы из интерфейса IVisionService

  async analyzeVideo(videoPath: string, sampleRate: number = 1): Promise<FrameAnalysisResult[]> {
    if (!this.visionService) {
      throw new Error("Vision service not available")
    }

    try {
      // Извлекаем ключевые кадры из видео с заданной частотой
      const keyframes = await this.extractVideoFrames(videoPath, sampleRate)

      // Анализируем каждый кадр
      const results: FrameAnalysisResult[] = []

      for (let i = 0; i < keyframes.length; i++) {
        const frame = keyframes[i]
        const timestamp = i / sampleRate

        const [objects, faces, text] = await Promise.all([
          this.detectObjects(frame),
          this.detectFaces(frame),
          this.extractText(frame),
        ])

        // Преобразуем к формату FrameAnalysisResult
        results.push({
          objects: objects.map((obj) => ({
            label: obj.class,
            confidence: obj.confidence,
            bbox: {
              x: obj.boundingBox.x,
              y: obj.boundingBox.y,
              width: obj.boundingBox.width,
              height: obj.boundingBox.height,
            },
          })),
          faces: await this.detectFaces(frame),
          text: text.map((t) => ({
            text: t.text,
            confidence: t.confidence,
            bbox: {
              x: t.boundingBox.x,
              y: t.boundingBox.y,
              width: t.boundingBox.width,
              height: t.boundingBox.height,
            },
          })),
          scene: {
            type: "unknown",
            confidence: 0.5,
            attributes: [],
          },
          nsfw: {
            safe: 0.9,
            suggestive: 0.08,
            explicit: 0.02,
          },
        })
      }

      return results
    } catch (error) {
      throw new Error(`Video analysis error: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  async detectFaces(imagePath: string): Promise<any[]> {
    if (!this.visionService) {
      return []
    }

    try {
      const faceDetections = await this.visionService.detectFaces?.(imagePath)

      return (
        faceDetections?.map((face: any) => ({
          confidence: face.confidence || 0.8,
          bbox: {
            x: face.bbox?.x || face.x || 0,
            y: face.bbox?.y || face.y || 0,
            width: face.bbox?.width || face.width || 0,
            height: face.bbox?.height || face.height || 0,
          },
          emotions: face.emotions || {
            neutral: 0.7,
            happy: 0.1,
            sad: 0.1,
            angry: 0.05,
            surprised: 0.05,
          },
        })) || []
      )
    } catch (error) {
      console.warn(`Face detection failed for ${imagePath}:`, error)
      return []
    }
  }

  async recognizeText(imagePath: string): Promise<string> {
    if (!this.visionService) {
      return ""
    }

    try {
      const textResults = await this.extractText(imagePath)
      return textResults.map((result) => result.text).join(" ")
    } catch (error) {
      console.warn(`Text recognition failed for ${imagePath}:`, error)
      return ""
    }
  }

  private async extractVideoFrames(videoPath: string, sampleRate: number): Promise<string[]> {
    // Placeholder для извлечения кадров из видео
    // В реальной реализации здесь должно быть взаимодействие с FFmpeg
    console.warn(`Video frame extraction not implemented: ${videoPath} at ${sampleRate} fps`)
    return []
  }
}

// Фабричная функция
export function createVisionService(): VisionAdapter {
  return new VisionAdapter()
}
