/**
 * AI Services Domain
 *
 * Централизованное место для всех AI сервисов анализа и обработки медиа
 */

// Factories
export {
  createMediaAnalysisFactory,
  getMediaAnalysisFactory,
  MediaAnalysisFactoryImpl,
} from "./factories/media-analysis-factory"
export { ContentAnalysisService } from "./services/content"
// Services
export { ContentClassifier } from "./services/content-classifier"
export type {
  Audience,
  ClassificationResult,
  ContentClassification,
  ContentType,
  Emotion,
  EmotionalTone,
  Genre,
  SceneAnalysis,
} from "./types/content-analysis"
// Types
export * from "./types/content-analysis"
// Re-export specific types for convenience
export type {
  AudioAnalysisResult,
  ColorAnalysis,
  CompositionAnalysis,
  ContentAnalysisOptions,
  ContentAnalysisResult,
  DetectedObject,
  ExtractedText,
  FrameAnalysis,
  FrameAnalysisResult,
  IContentAnalysisService,
  IFFmpegAnalysisService,
  IVisionService,
  MediaAnalysisFactory,
  MediaFile,
  MotionAnalysisResult,
  QualityAnalysisResult,
  Scene,
  SceneDetectionResult,
  SilenceDetectionResult,
  VideoAnalysisOptions,
  VideoAnalysisResult,
  VideoMetadata,
} from "./types/interfaces"
export * from "./types/interfaces"
export * from "./types/orchestration"
