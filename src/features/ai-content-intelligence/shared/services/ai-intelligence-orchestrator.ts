/**
 * AI Intelligence Orchestrator v2
 * Использует XState машину состояний для управления процессом
 */

import type { Actor } from "xstate"
import { AIIntelligenceContext, aiIntelligenceMachine } from "@/domains/ai-services/machines/ai-intelligence-machine"
import type {
  AdaptedContent,
  AIConfig,
  GeneratedScript,
  IntelligentContent,
  PipelineControl,
  PipelineEvent,
  PipelineProgress,
  PlatformId,
  ScriptGenerationParams,
  UnifiedContentAnalysis,
} from "../types"
import { AccuracyLevel, AIProvider, AnalysisDepth, ProcessingStatus, SpeedPriority } from "../types"

// Интерфейс для движков (сохраняем для совместимости)
interface AIEngine {
  name: string
  initialize(): Promise<void>
  process(data: any, config: any): Promise<any>
}

interface MediaFile {
  path: string
  name: string
  size?: number
}

interface Content {
  analysis: UnifiedContentAnalysis
  script?: GeneratedScript
}

export class AIIntelligenceOrchestrator {
  private actor: Actor<typeof aiIntelligenceMachine>
  private eventListeners = new Map<string, Set<(event: PipelineEvent) => void>>()
  private progressListeners = new Set<(progress: PipelineProgress) => void>()

  // Движки (будут загружены через DI)
  private sceneAnalyzer?: AIEngine
  private scriptGenerator?: AIEngine
  private multiPlatformAdapter?: AIEngine
  private engineFactory?: any

  constructor(actor: Actor<typeof aiIntelligenceMachine>) {
    this.actor = actor
  }

  /**
   * Инициализировать движки через DI
   */
  public async initialize(engines?: {
    sceneAnalyzer?: AIEngine
    scriptGenerator?: AIEngine
    multiPlatformAdapter?: AIEngine
  }): Promise<void> {
    // Если движки переданы явно, используем их (для обратной совместимости)
    if (engines) {
      if (engines.sceneAnalyzer) {
        this.sceneAnalyzer = engines.sceneAnalyzer
        await this.sceneAnalyzer.initialize()
      }

      if (engines.scriptGenerator) {
        this.scriptGenerator = engines.scriptGenerator
        await this.scriptGenerator.initialize()
      }

      if (engines.multiPlatformAdapter) {
        this.multiPlatformAdapter = engines.multiPlatformAdapter
        await this.multiPlatformAdapter.initialize()
      }
    } else {
      // Загружаем движки через DI фабрику
      try {
        const { getEngineFactory } = await import("../../factories/engine-factory")
        this.engineFactory = getEngineFactory()

        const loadedEngines = await this.engineFactory.createAllEngines()

        // Адаптируем движки к старому интерфейсу
        this.sceneAnalyzer = {
          name: "SceneAnalysisEngine",
          initialize: async () => {},
          process: async (data: any) => loadedEngines.sceneEngine.analyzeScenes(data.mediaFile, data.options),
        }

        this.scriptGenerator = {
          name: "ScriptGenerationEngine",
          initialize: async () => {},
          process: async (data: any, config: any) => loadedEngines.scriptEngine.generateScript(data, config),
        }
      } catch (error) {
        console.warn("Не удалось загрузить движки через DI:", error)
      }
    }
  }

  /**
   * Анализировать контент
   */
  public async analyzeContent(mediaFiles: MediaFile[], config?: Partial<AIConfig>): Promise<UnifiedContentAnalysis> {
    // Создаем минимальную конфигурацию для анализа
    const analysisConfig: AIConfig = {
      providers: [
        {
          provider: AIProvider.OPENAI,
          model: "gpt-4",
        },
      ],
      defaultProvider: AIProvider.OPENAI,
      features: {
        sceneAnalysis: true,
        scriptGeneration: false,
        multiPlatform: false,
        contentClassification: true,
        qualityEnhancement: false,
        autoSuggestions: true,
        ...config?.features,
      },
      processing: {
        parallel: true,
        maxConcurrent: 3,
        batchSize: 10,
        cacheResults: true,
        cacheDuration: 24,
        retryAttempts: 3,
        timeout: 300,
        ...config?.processing,
      },
      quality: {
        analysisDepth: AnalysisDepth.STANDARD,
        accuracy: AccuracyLevel.BALANCED,
        speed: SpeedPriority.NORMAL,
        resourceUsage: {
          maxCPU: 80,
          maxRAM: 4096,
          maxDiskSpace: 1024,
        },
        ...config?.quality,
      },
    }

    return new Promise((resolve, reject) => {
      const actor = this.actor

      // Подписываемся на результат анализа
      actor.subscribe((snapshot) => {
        if (snapshot.matches("analysisComplete") && snapshot.context.analysis) {
          resolve(snapshot.context.analysis)
          actor.stop()
        } else if (snapshot.matches("error")) {
          reject(new Error(snapshot.context.errors[0]?.message || "Analysis failed"))
          actor.stop()
        }
      })

      // Запускаем анализ
      actor.send({ type: "START_ANALYSIS", mediaFiles, config: analysisConfig })
    })
  }

  /**
   * Генерировать сценарий
   */
  public async generateScript(
    analysis: UnifiedContentAnalysis,
    params: ScriptGenerationParams,
  ): Promise<GeneratedScript> {
    // Для отдельной генерации сценария используем движок напрямую
    if (!this.scriptGenerator) {
      throw new Error("Script Generator engine not initialized")
    }

    return this.scriptGenerator.process(analysis, params)
  }

  /**
   * Адаптировать контент для платформ
   */
  public async adaptForPlatforms(content: Content, platforms: PlatformId[]): Promise<AdaptedContent[]> {
    // Для отдельной адаптации используем движок напрямую
    if (!this.multiPlatformAdapter) {
      throw new Error("Multi-Platform Adapter engine not initialized")
    }

    const adaptations = await Promise.all(
      platforms.map((platformId) => this.multiPlatformAdapter!.process(content, { platformId })),
    )

    return adaptations
  }

  /**
   * Полный pipeline обработки проекта
   */
  public async processProject(mediaFiles: MediaFile[], config: AIConfig): Promise<IntelligentContent> {
    return new Promise((resolve, reject) => {
      const actor = this.actor

      // Подписываемся на события
      actor.subscribe((snapshot) => {
        // XState v5 не предоставляет event в snapshot напрямую
        // Обработка прогресса будет через context
        if (snapshot.context.progress !== undefined) {
          const progress = this.calculateProgress(snapshot.context)
          this.progressListeners.forEach((listener) => listener(progress))
        }

        // Handle completion
        if (snapshot.matches("complete") && snapshot.context.result) {
          this.emitEvent("COMPLETED", { result: snapshot.context.result })
          resolve(snapshot.context.result)
          this.cleanup()
        }

        // Handle errors
        if (snapshot.matches("error") || snapshot.matches("cancelled")) {
          const error = new Error(snapshot.context.errors[0]?.message || "Processing failed")
          this.emitEvent("FAILED", { error })
          reject(error)
          this.cleanup()
        }
      })

      // Запускаем обработку
      this.emitEvent("STARTED", { mediaFiles, config })
      actor.send({ type: "START_ANALYSIS", mediaFiles, config })
    })
  }

  /**
   * Создать контрол для управления pipeline
   */
  public createPipelineControl(): PipelineControl {
    return {
      pause: async () => {
        if (this.actor) {
          this.actor.send({ type: "PAUSE" })
          this.emitEvent("PAUSED", {})
        }
      },

      resume: async () => {
        if (this.actor) {
          this.actor.send({ type: "RESUME" })
          this.emitEvent("RESUMED", {})
        }
      },

      cancel: async () => {
        if (this.actor) {
          this.actor.send({ type: "CANCEL" })
          this.emitEvent("CANCELLED", {})
        }
      },

      getProgress: () => {
        if (this.actor) {
          const snapshot = this.actor.getSnapshot()
          return this.calculateProgress(snapshot.context)
        }
        return {
          overall: 0,
          currentStep: "",
          steps: [],
          messages: [],
        }
      },

      onProgress: (callback) => {
        this.progressListeners.add(callback)
        return () => this.progressListeners.delete(callback)
      },

      onEvent: (callback) => {
        const id = Math.random().toString(36)
        this.addEventListener(id, callback)
        return () => this.removeEventListener(id, callback)
      },
    }
  }

  // Приватные методы

  private cleanup() {
    // Больше не очищаем actor, так как он управляется провайдером
    this.eventListeners.clear()
    this.progressListeners.clear()
  }

  private calculateProgress(context: AIIntelligenceContext): PipelineProgress {
    const totalSteps = context.steps.length
    const completedSteps = context.steps.filter((s) => s.status === ProcessingStatus.COMPLETED).length

    const overall = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

    return {
      overall,
      currentStep: context.currentStep,
      steps: context.steps.map((step) => ({
        name: step.name,
        progress: step.status === ProcessingStatus.COMPLETED ? 100 : step.status === ProcessingStatus.RUNNING ? 50 : 0,
        status: step.status,
      })),
      messages: [],
    }
  }

  private emitEvent(type: string, data: any): void {
    const event: PipelineEvent = {
      type: type as any,
      timestamp: new Date(),
      data,
    }

    this.eventListeners.forEach((listeners) => {
      listeners.forEach((listener) => listener(event))
    })
  }

  private addEventListener(id: string, listener: (event: PipelineEvent) => void): void {
    if (!this.eventListeners.has(id)) {
      this.eventListeners.set(id, new Set())
    }
    this.eventListeners.get(id)!.add(listener)
  }

  private removeEventListener(id: string, listener: (event: PipelineEvent) => void): void {
    this.eventListeners.get(id)?.delete(listener)
  }
}
