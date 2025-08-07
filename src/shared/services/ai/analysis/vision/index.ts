/**
 * Vision Analysis Service
 * Адаптер для компьютерного зрения и анализа изображений
 */

import type {
  ColorAnalysis,
  CompositionAnalysis,
  DetectedObject,
  ExtractedText,
  FrameAnalysis,
  IVisionService,
} from "../interfaces"

// Импорт существующих сервисов (временно, до полной миграции)
let VisionAnalysisService: any = null
let YOLOService: any = null

try {
  // Динамический импорт для избежания циклических зависимостей
  VisionAnalysisService =
    require("@/features/ai-content-intelligence/services/vision-analysis-service").VisionAnalysisService
  YOLOService = require("@/features/recognition/services/yolo-service").YOLOService
} catch (error) {
  console.warn("Vision services not available:", error)
}

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

  async analyzeFrame(imagePath: string): Promise<FrameAnalysis> {
    if (!this.visionService) {
      throw new Error("Vision service not available")
    }

    try {
      // Параллельно выполняем все виды анализа
      const [objects, text, composition, colors, quality] = await Promise.all([
        this.detectObjects(imagePath),
        this.extractText(imagePath),
        this.analyzeComposition(imagePath),
        this.analyzeColors(imagePath),
        this.analyzeFrameQuality(imagePath),
      ])

      return {
        id: `frame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        objects,
        text,
        composition,
        colors,
        quality,
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
      const batchResults = await Promise.all(batch.map((path) => this.analyzeFrame(path)))
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
}

// Фабричная функция
export function createVisionService(): VisionAdapter {
  return new VisionAdapter()
}
