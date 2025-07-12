/**
 * Хук для управления content pipeline
 * Предоставляет удобный интерфейс для работы с пайплайном обработки контента
 */

import { useCallback, useEffect, useRef, useState } from "react"

import { useAIIntelligence } from "./use-ai-intelligence"

import type {
  BatchProcessingConfig,
  BatchProgress,
  IntelligentContent,
  PipelineConfig,
  PipelineEvent,
  PipelineProgress,
} from "../shared/types"

interface UseContentPipelineOptions {
  config?: PipelineConfig
  onEvent?: (event: PipelineEvent) => void
  onProgress?: (progress: PipelineProgress) => void
  onBatchProgress?: (progress: BatchProgress) => void
}

interface UseContentPipelineReturn {
  // Состояние pipeline
  isRunning: boolean
  isPaused: boolean
  progress: PipelineProgress | null
  currentStep: string | null
  results: IntelligentContent[]
  errors: Error[]

  // Управление pipeline
  startPipeline: (mediaFiles: MediaFile[], config?: PipelineConfig) => Promise<IntelligentContent>
  pausePipeline: () => Promise<void>
  resumePipeline: () => Promise<void>
  stopPipeline: () => Promise<void>

  // Batch обработка
  processBatch: (config: BatchProcessingConfig) => Promise<IntelligentContent[]>

  // Утилиты
  clearResults: () => void
  exportResults: (format: "json" | "csv") => Promise<Blob>
  getStepDuration: (stepName: string) => number | null
}

interface MediaFile {
  path: string
  name: string
  size?: number
}

export function useContentPipeline(options: UseContentPipelineOptions = {}): UseContentPipelineReturn {
  const { config: defaultConfig, onEvent, onProgress, onBatchProgress } = options

  // AI Intelligence хук
  const ai = useAIIntelligence({
    onProgress,
    onError: (error) => {
      setErrors((prev) => [...prev, error])
    },
  })

  // Состояние
  const [isRunning, setIsRunning] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState<PipelineProgress | null>(null)
  const [currentStep, setCurrentStep] = useState<string | null>(null)
  const [results, setResults] = useState<IntelligentContent[]>([])
  const [errors, setErrors] = useState<Error[]>([])

  // Refs
  const batchAbortControllerRef = useRef<AbortController>()
  const stepTimingsRef = useRef<Map<string, number>>(new Map())

  // Обработка событий pipeline
  useEffect(() => {
    if (ai.progress) {
      setProgress(ai.progress)
      setCurrentStep(ai.progress.currentStep)

      // Записываем timing для шагов
      ai.progress.steps.forEach((step) => {
        if (step.status === ProcessingStatus.COMPLETED && step.progress === 100) {
          // Здесь можно записать timing, если он доступен
        }
      })
    }
  }, [ai.progress])

  // Запустить pipeline
  const startPipeline = useCallback(
    async (mediaFiles: MediaFile[], config?: PipelineConfig): Promise<IntelligentContent> => {
      try {
        setIsRunning(true)
        setIsPaused(false)
        setErrors([])

        const pipelineConfig = config || defaultConfig
        if (!pipelineConfig) {
          throw new Error("Pipeline configuration is required")
        }

        // Преобразуем PipelineConfig в AIConfig
        const aiConfig = convertPipelineConfigToAIConfig(pipelineConfig)

        const result = await ai.processProject(mediaFiles, aiConfig)
        setResults((prev) => [...prev, result])

        return result
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error))
        setErrors((prev) => [...prev, err])
        throw err
      } finally {
        setIsRunning(false)
        setCurrentStep(null)
      }
    },
    [defaultConfig, ai],
  )

  // Приостановить pipeline
  const pausePipeline = useCallback(async () => {
    if (isRunning && !isPaused) {
      await ai.pausePipeline()
      setIsPaused(true)
    }
  }, [isRunning, isPaused, ai])

  // Возобновить pipeline
  const resumePipeline = useCallback(async () => {
    if (isRunning && isPaused) {
      await ai.resumePipeline()
      setIsPaused(false)
    }
  }, [isRunning, isPaused, ai])

  // Остановить pipeline
  const stopPipeline = useCallback(async () => {
    if (isRunning) {
      await ai.cancelPipeline()
      setIsRunning(false)
      setIsPaused(false)
      setCurrentStep(null)
    }
  }, [isRunning, ai])

  // Batch обработка
  const processBatch = useCallback(
    async (batchConfig: BatchProcessingConfig): Promise<IntelligentContent[]> => {
      const results: IntelligentContent[] = []
      const batchErrors: Error[] = []

      // Создаем abort controller для отмены
      batchAbortControllerRef.current = new AbortController()

      try {
        setIsRunning(true)

        const totalItems = batchConfig.items.length
        let completedItems = 0
        let failedItems = 0

        // Функция обновления прогресса
        const updateBatchProgress = () => {
          const progress: BatchProgress = {
            total: totalItems,
            completed: completedItems,
            failed: failedItems,
            inProgress: batchConfig.parallel
              ? Math.min(batchConfig.maxConcurrent, totalItems - completedItems - failedItems)
              : completedItems + failedItems < totalItems
                ? 1
                : 0,
            items: batchConfig.items.map((item, index) => ({
              id: item.id,
              status:
                index < completedItems
                  ? ProcessingStatus.COMPLETED
                  : index < completedItems + failedItems
                    ? ProcessingStatus.FAILED
                    : ProcessingStatus.PENDING,
            })),
          }

          onBatchProgress?.(progress)
        }

        // Обработка одного элемента
        const processItem = async (item: (typeof batchConfig.items)[0]) => {
          if (batchAbortControllerRef.current?.signal.aborted) {
            throw new Error("Batch processing cancelled")
          }

          try {
            const aiConfig = item.config
              ? { ...convertPipelineConfigToAIConfig(defaultConfig!), ...item.config }
              : convertPipelineConfigToAIConfig(defaultConfig!)

            const result = await ai.processProject(
              item.mediaFiles.map((path) => ({ path, name: path.split("/").pop()! })),
              aiConfig,
            )

            completedItems++
            results.push(result)
            updateBatchProgress()

            return result
          } catch (error) {
            failedItems++
            const err = error instanceof Error ? error : new Error(String(error))
            batchErrors.push(err)
            updateBatchProgress()

            if (!batchConfig.continueOnError) {
              throw err
            }
          }
        }

        // Выполнение обработки
        if (batchConfig.parallel) {
          // Параллельная обработка с ограничением
          const chunks = []
          for (let i = 0; i < batchConfig.items.length; i += batchConfig.maxConcurrent) {
            chunks.push(batchConfig.items.slice(i, i + batchConfig.maxConcurrent))
          }

          for (const chunk of chunks) {
            await Promise.all(chunk.map(processItem))
          }
        } else {
          // Последовательная обработка
          for (const item of batchConfig.items) {
            await processItem(item)
          }
        }

        setResults((prev) => [...prev, ...results])
        setErrors((prev) => [...prev, ...batchErrors])

        return results
      } finally {
        setIsRunning(false)
        batchAbortControllerRef.current = undefined
      }
    },
    [defaultConfig, ai, onBatchProgress],
  )

  // Очистить результаты
  const clearResults = useCallback(() => {
    setResults([])
    setErrors([])
  }, [])

  // Экспорт результатов
  const exportResults = useCallback(
    async (format: "json" | "csv"): Promise<Blob> => {
      if (format === "json") {
        const data = JSON.stringify(results, null, 2)
        return new Blob([data], { type: "application/json" })
      }
      // CSV экспорт - упрощенная версия
      const headers = ["ID", "Project ID", "Created", "Content Type", "Duration", "Quality"]
      const rows = results.map((r) => [
        r.id,
        r.projectId,
        r.createdAt.toISOString(),
        r.analysis.contentType,
        r.analysis.technicalSpecs.duration,
        r.analysis.qualityMetrics.overall,
      ])

      const csv = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n")

      return new Blob([csv], { type: "text/csv" })
    },
    [results],
  )

  // Получить длительность шага
  const getStepDuration = useCallback((stepName: string): number | null => {
    return stepTimingsRef.current.get(stepName) || null
  }, [])

  return {
    // Состояние
    isRunning,
    isPaused,
    progress,
    currentStep,
    results,
    errors,

    // Управление
    startPipeline,
    pausePipeline,
    resumePipeline,
    stopPipeline,

    // Batch
    processBatch,

    // Утилиты
    clearResults,
    exportResults,
    getStepDuration,
  }
}

// Вспомогательная функция конвертации конфигурации
function convertPipelineConfigToAIConfig(_pipelineConfig: PipelineConfig): any {
  // TODO: Реализовать конвертацию PipelineConfig в AIConfig
  // Это временная заглушка
  return {
    providers: [
      {
        provider: "openai",
        model: "gpt-4",
      },
    ],
    defaultProvider: "openai",
    features: {
      sceneAnalysis: true,
      scriptGeneration: true,
      multiPlatform: true,
      contentClassification: true,
      qualityEnhancement: false,
      autoSuggestions: true,
    },
    processing: {
      parallel: true,
      maxConcurrent: 3,
      batchSize: 10,
      cacheResults: true,
      cacheDuration: 24,
      retryAttempts: 3,
      timeout: 300,
    },
    quality: {
      analysisDepth: "standard",
      accuracy: "balanced",
      speed: "normal",
      resourceUsage: {
        maxCPU: 80,
        maxRAM: 4096,
        maxDiskSpace: 1024,
      },
    },
  }
}
