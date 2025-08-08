/**
 * Media Analysis Interface
 * Provides abstraction layer for AI and FFmpeg services
 */

import type { IFFmpegAnalysisService, IVisionService, IContentAnalysisService } from "@/shared/services/ai/analysis/interfaces"
import { getAIContainer } from "@/shared/services/ai"

let ffmpegService: IFFmpegAnalysisService | null = null
let visionService: IVisionService | null = null
let contentAnalysisService: IContentAnalysisService | null = null
let aiService: any = null

/**
 * Get FFmpeg analysis service
 */
export async function getFFmpegService(): Promise<IFFmpegAnalysisService> {
  if (!ffmpegService) {
    const aiContainer = getAIContainer()
    ffmpegService = await aiContainer.resolve<IFFmpegAnalysisService>("FFmpegService")
  }
  return ffmpegService
}

/**
 * Get Vision service for scene analysis
 */
export async function getVisionService(): Promise<IVisionService> {
  if (!visionService) {
    const aiContainer = getAIContainer()
    visionService = await aiContainer.resolve<IVisionService>("VisionService")
  }
  return visionService
}

/**
 * Get Content Analysis service
 */
export async function getContentAnalysisService(): Promise<IContentAnalysisService> {
  if (!contentAnalysisService) {
    const aiContainer = getAIContainer()
    contentAnalysisService = await aiContainer.resolve<IContentAnalysisService>("ContentAnalysisService")
  }
  return contentAnalysisService
}

/**
 * Get AI service for content generation
 */
export async function getAIService(): Promise<any> {
  if (!aiService) {
    const aiContainer = getAIContainer()
    aiService = await aiContainer.resolve("UnifiedAIService")
  }
  return aiService
}

/**
 * Reset all services (for testing)
 */
export function resetServices(): void {
  ffmpegService = null
  visionService = null
  contentAnalysisService = null
  aiService = null
}