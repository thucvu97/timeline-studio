/**
 * Analysis AI Tools - Инструменты анализа и обработки контента
 *
 * Анализ видео, аудио, контента и мультимодальный анализ
 */

// Audio analysis инструменты
export * from "./audio-analysis-tools"
// Color & Style analysis инструменты
export * from "./color-style-tools"

// Content intelligence инструменты
export * from "./content-intelligence-tools"

// Multimodal analysis инструменты
export * from "./multimodal-tools"
// Person identification инструменты
export * from "./person-identification-tools"
// Video analysis инструменты
export * from "./video-analysis-tools"
// Whisper (речевой анализ) инструменты
export * from "./whisper-tools"

import { audioProcessingTools } from "./audio-analysis-tools"
import { colorStyleTools } from "./color-style-tools"
import { contentIntelligenceTools } from "./content-intelligence-tools"
import { multimodalAnalysisTools } from "./multimodal-tools"
import { personIdentificationTools } from "./person-identification-tools"
// Сбор всех analysis инструментов в один массив
import { videoAnalysisTools } from "./video-analysis-tools"
import { whisperTools } from "./whisper-tools"

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
