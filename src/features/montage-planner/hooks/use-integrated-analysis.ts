/**
 * Интегрированный хук для анализа контента с подключением к backend
 */

import { useCallback, useState } from "react"

import { MediaFile } from "@/features/media/types/media"

import { useContentAnalysis } from "./use-content-analysis"
import { useMontageBackend } from "./use-montage-backend"
import { useMontagePlanner } from "./use-montage-planner"
import { usePlanGenerator } from "./use-plan-generator"

import type { MomentScore, MontageAnalysisConfig, MontagePlan, PlanGeneratorConfig } from "../types"

export interface UseIntegratedAnalysisReturn {
  // Основные действия
  analyzeProject: (mediaFiles: MediaFile[]) => Promise<void>
  generateSmartPlan: (style?: string, targetDuration?: number) => Promise<MontagePlan | null>

  // Расширенные действия
  analyzeSelectedFiles: (filePaths: string[], config?: MontageAnalysisConfig) => Promise<void>

  detectMomentsFromAnalysis: () => Promise<MomentScore[]>

  // Состояние
  isAnalyzing: boolean
  isGenerating: boolean
  analysisProgress: number
  generationProgress: number
  error: string | null

  // Результаты
  analysisResults: {
    videoCount: number
    audioCount: number
    momentsDetected: number
    averageQuality: number
  } | null

  // Из существующих хуков
  contentAnalysis: ReturnType<typeof useContentAnalysis>
  planGenerator: ReturnType<typeof usePlanGenerator>
}

export function useIntegratedAnalysis(): UseIntegratedAnalysisReturn {
  const backend = useMontageBackend()
  const contentAnalysis = useContentAnalysis()
  const planGenerator = usePlanGenerator()
  const { send, context } = useMontagePlanner()

  const [analysisResults, setAnalysisResults] = useState<{
    videoCount: number
    audioCount: number
    momentsDetected: number
    averageQuality: number
  } | null>(null)

  /**
   * Полный анализ проекта с использованием backend команд
   */
  const analyzeProject = useCallback(
    async (mediaFiles: MediaFile[]): Promise<void> => {
      try {
        // Начинаем анализ
        send({ type: "START_ANALYSIS", videoIds: mediaFiles.map((f) => f.id) })

        let videoCount = 0
        let audioCount = 0
        let totalQuality = 0
        const allMoments: MomentScore[] = []

        // Анализируем каждый медиафайл
        for (const [index, mediaFile] of mediaFiles.entries()) {
          const progress = (index / mediaFiles.length) * 90 // 90% на анализ файлов
          send({
            type: "UPDATE_PROGRESS",
            progress,
            message: `Analyzing ${mediaFile.name}...`,
          })

          try {
            if (mediaFile.type === "video" || mediaFile.type === "image") {
              // Анализ видео/изображения
              const videoAnalysis = await backend.analyzeVideoQuality(mediaFile.path)

              // Сохраняем анализ в состояние
              send({
                type: "ADD_VIDEO_ANALYSIS",
                videoId: mediaFile.id,
                analysis: videoAnalysis,
              })

              // Если есть YOLO процессор, анализируем композицию
              try {
                const processorId = "default" // TODO: получить из настроек
                const compositionAnalysis = await backend.analyzeVideoComposition(mediaFile.path, processorId)

                // Детектируем моменты из анализа композиции
                if (compositionAnalysis.moments) {
                  allMoments.push(...compositionAnalysis.moments)
                }
              } catch (compositionError) {
                console.warn("Composition analysis failed, skipping:", compositionError)
              }

              videoCount++
              totalQuality += videoAnalysis.quality_score || 0
            }

            if (mediaFile.type === "audio" || (mediaFile.type === "video" && mediaFile.metadata?.hasAudio)) {
              // Анализ аудио
              const audioAnalysis = await backend.analyzeAudioContent(mediaFile.path)

              // Сохраняем анализ в состояние
              send({
                type: "ADD_AUDIO_ANALYSIS",
                videoId: mediaFile.id,
                analysis: audioAnalysis,
              })

              audioCount++
            }
          } catch (fileError) {
            console.error(`Failed to analyze ${mediaFile.name}:`, fileError)
            // Продолжаем с остальными файлами
          }
        }

        // Финальная детекция моментов
        send({
          type: "UPDATE_PROGRESS",
          progress: 95,
          message: "Detecting key moments...",
        })

        if (allMoments.length > 0) {
          // Дополнительная обработка моментов через backend
          const qualityScores = allMoments.map((m) => m.totalScore)
          const enhancedMoments = await backend.detectKeyMoments(allMoments, qualityScores)

          // Сохраняем моменты
          send({
            type: "SET_MOMENT_SCORES",
            moments: enhancedMoments,
          })
        }

        // Завершаем анализ
        setAnalysisResults({
          videoCount,
          audioCount,
          momentsDetected: allMoments.length,
          averageQuality: videoCount > 0 ? totalQuality / videoCount : 0,
        })

        send({
          type: "ANALYSIS_COMPLETE",
          results: {
            analyzedVideos: videoCount,
            analyzedAudio: audioCount,
            detectedMoments: allMoments.length,
          },
        })
      } catch (error) {
        console.error("Project analysis failed:", error)
        send({
          type: "ANALYSIS_ERROR",
          error: error instanceof Error ? error.message : "Analysis failed",
        })
        throw error
      }
    },
    [backend, send],
  )

  /**
   * Анализ выбранных файлов
   */
  const analyzeSelectedFiles = useCallback(
    async (filePaths: string[], _config: MontageAnalysisConfig = {}): Promise<void> => {
      try {
        send({ type: "START_ANALYSIS", videoIds: filePaths })

        for (const [index, filePath] of filePaths.entries()) {
          const progress = (index / filePaths.length) * 100
          send({
            type: "UPDATE_PROGRESS",
            progress,
            message: `Analyzing ${filePath}...`,
          })

          // Определяем тип файла и анализируем соответственно
          const isVideo = /\.(mp4|avi|mov|mkv|webm)$/i.test(filePath)
          const isAudio = /\.(mp3|wav|flac|aac|m4a)$/i.test(filePath)

          if (isVideo) {
            const analysis = await backend.analyzeVideoQuality(filePath)
            send({
              type: "ADD_VIDEO_ANALYSIS",
              videoId: filePath,
              analysis,
            })
          }

          if (isAudio || isVideo) {
            const audioAnalysis = await backend.analyzeAudioContent(filePath)
            send({
              type: "ADD_AUDIO_ANALYSIS",
              videoId: filePath,
              analysis: audioAnalysis,
            })
          }
        }

        send({ type: "ANALYSIS_COMPLETE", results: {} })
      } catch (error) {
        send({
          type: "ANALYSIS_ERROR",
          error: error instanceof Error ? error.message : "Analysis failed",
        })
        throw error
      }
    },
    [backend, send],
  )

  /**
   * Детекция моментов из существующих анализов
   */
  const detectMomentsFromAnalysis = useCallback(async (): Promise<MomentScore[]> => {
    const videoAnalyses = Array.from(context.videoAnalyses.values())

    if (videoAnalyses.length === 0) {
      throw new Error("No video analyses available for moment detection")
    }

    // Создаем моковые детекции для анализа
    const mockDetections = videoAnalyses.map((analysis, index) => ({
      class_id: 0,
      confidence: analysis.quality_score / 100,
      bbox: [0.25, 0.25, 0.5, 0.5], // центр кадра
      frame_timestamp: index * 1.0,
    }))

    const qualityScores = videoAnalyses.map((a) => a.quality_score)

    const moments = await backend.detectKeyMoments(mockDetections, qualityScores)

    send({
      type: "SET_MOMENT_SCORES",
      moments,
    })

    return moments
  }, [backend, context.videoAnalyses, send])

  /**
   * Генерация умного плана с использованием backend
   */
  const generateSmartPlan = useCallback(
    async (style = "dynamic", targetDuration = 120): Promise<MontagePlan | null> => {
      try {
        // Проверяем наличие моментов
        let moments = context.momentScores
        if (moments.length === 0) {
          // Пытаемся детектировать моменты из анализов
          moments = await detectMomentsFromAnalysis()
        }

        if (moments.length === 0) {
          throw new Error("No moments available for plan generation")
        }

        // Конфигурация генератора
        const config: PlanGeneratorConfig = {
          style: { name: style },
          target_duration: targetDuration,
          max_clips: Math.min(moments.length, 20),
          quality_threshold: 60,
          use_audio_sync: true,
          genetic_algorithm: {
            population_size: 50,
            generations: 100,
            mutation_rate: 0.1,
            crossover_rate: 0.8,
          },
        }

        // Список исходных файлов
        const sourceFiles = Array.from(context.videoAnalyses.keys())

        // Генерируем план
        send({ type: "START_GENERATION" })

        const plan = await backend.generateMontagePlan(moments, config, sourceFiles)

        // Сохраняем план
        send({
          type: "PLAN_GENERATED",
          plan,
        })

        return plan
      } catch (error) {
        console.error("Smart plan generation failed:", error)
        send({
          type: "GENERATION_ERROR",
          error: error instanceof Error ? error.message : "Generation failed",
        })
        return null
      }
    },
    [backend, context.momentScores, context.videoAnalyses, send, detectMomentsFromAnalysis],
  )

  return {
    // Основные действия
    analyzeProject,
    generateSmartPlan,
    analyzeSelectedFiles,
    detectMomentsFromAnalysis,

    // Состояние
    isAnalyzing: contentAnalysis.isAnalyzing || backend.isAnalyzing,
    isGenerating: planGenerator.isGenerating || backend.isGenerating,
    analysisProgress: contentAnalysis.progress || backend.progress,
    generationProgress: backend.progress,
    error: backend.error,

    // Результаты
    analysisResults,

    // Вложенные хуки
    contentAnalysis,
    planGenerator,
  }
}
