/**
 * Analysis AI Tools - Инструменты анализа и обработки контента
 * 
 * Анализ видео, аудио, контента и мультимодальный анализ
 */

// Video analysis инструменты
export * from "./video-analysis-tools"

// Audio analysis инструменты  
export * from "./audio-analysis-tools"

// Content intelligence инструменты
export * from "./content-intelligence-tools"

// Multimodal analysis инструменты
export * from "./multimodal-tools"

// Whisper (речевой анализ) инструменты
export * from "./whisper-tools"

// Person identification инструменты
export * from "./person-identification-tools"

// Color & Style analysis инструменты
export * from "./color-style-tools"

// Сбор всех analysis инструментов в один массив
import { videoAnalysisTools } from "./video-analysis-tools"
import { audioProcessingTools } from "./audio-analysis-tools"
import { contentIntelligenceTools } from "./content-intelligence-tools"
import { multimodalAnalysisTools } from "./multimodal-tools"
import { whisperTools } from "./whisper-tools"
import { personIdentificationTools } from "./person-identification-tools"
import { colorStyleTools } from "./color-style-tools"

export const analysisTools = [
  ...videoAnalysisTools,
  ...audioProcessingTools,
  ...contentIntelligenceTools,
  ...multimodalAnalysisTools,
  ...whisperTools,
  ...personIdentificationTools,
  ...colorStyleTools,
]

export const ANALYSIS_TOOLS_COUNT = analysisTools.length