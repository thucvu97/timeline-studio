/**
 * Timeline AI Service
 *
 * Основной сервис для координации AI операций между
 * ресурсами, браузером, плеером и таймлайном
 */

import { MediaFile } from "@/features/media/types/media"
import { ResourcesContextType } from "@/features/resources/services/resources-provider"
import { TimelineProject } from "@/features/timeline/types"

import { CLAUDE_MODELS, ClaudeService, ClaudeTool } from "./claude-service"
import { batchProcessingTools, executeBatchProcessingTool } from "../tools/batch-processing-tools"
import { browserTools } from "../tools/browser-tools"
import { executeMultimodalAnalysisTool, multimodalAnalysisTools } from "../tools/multimodal-analysis-tools"
import { executePlatformOptimizationTool, platformOptimizationTools } from "../tools/platform-optimization-tools"
import { playerTools } from "../tools/player-tools"
import { resourceTools } from "../tools/resource-tools"
import { executeSubtitleTool, subtitleTools } from "../tools/subtitle-tools"
import { timelineTools } from "../tools/timeline-tools"
import { executeVideoAnalysisTool, videoAnalysisTools } from "../tools/video-analysis-tools"
import { executeWhisperTool, whisperTools } from "../tools/whisper-tools"
import { executeWorkflowAutomationTool, workflowAutomationTools } from "../tools/workflow-automation-tools"
import {
  AIToolResult,
  BrowserContext,
  ContentStoryAnalysis,
  PlayerContext,
  ResourcesContext,
  TimelineContext,
  TimelineStudioContext,
} from "../types/ai-context"

/**
 * Результат выполнения AI команды Timeline
 */
export interface TimelineAIResult {
  success: boolean
  message: string
  data?: {
    createdProject?: TimelineProject
    addedResources?: string[]
    placedClips?: string[]
    appliedEnhancements?: string[]
    analysis?: ContentStoryAnalysis
    suggestions?: string[]
  }
  errors?: string[]
  warnings?: string[]
  executionTime: number
  nextActions?: string[]
}

/**
 * Сервис для AI интеграции с Timeline Studio
 */
export class TimelineAIService {
  private claudeService: ClaudeService
  private allTools: ClaudeTool[]

  constructor(
    private resourcesProvider: ResourcesContextType,
    private browserState: any, // BrowserStateMachine context
    private playerState: any, // PlayerStateMachine context
    private timelineState: any, // TimelineStateMachine context
  ) {
    this.claudeService = ClaudeService.getInstance()

    // Объединяем все инструменты
    this.allTools = [
      ...resourceTools,
      ...browserTools,
      ...playerTools,
      ...timelineTools,
      ...subtitleTools,
      ...videoAnalysisTools,
      ...whisperTools,
      ...batchProcessingTools,
      ...multimodalAnalysisTools,
      ...platformOptimizationTools,
      ...workflowAutomationTools,
    ]
  }

  /**
   * Устанавливает API ключ Claude
   * @deprecated Используйте API Keys Management вместо прямой установки ключа
   */
  public setApiKey(apiKey: string): void {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    this.claudeService.setApiKey(apiKey)
  }

  /**
   * Создает полный контекст Timeline Studio для AI
   */
  private createContext(): TimelineStudioContext {
    // Собираем контекст ресурсов
    const resourcesContext: ResourcesContext = {
      availableResources: {
        media: this.resourcesProvider.mediaResources.map((r) => r.file),
        effects: this.resourcesProvider.effectResources.map((r) => r.effect),
        filters: this.resourcesProvider.filterResources.map((r) => r.filter),
        transitions: this.resourcesProvider.transitionResources.map((r) => r.transition),
        templates: this.resourcesProvider.templateResources.map((r) => r.template),
        styleTemplates: this.resourcesProvider.styleTemplateResources.map((r) => r.template),
        music: this.resourcesProvider.musicResources.map((r) => r.file),
      },
      stats: {
        totalMedia: this.resourcesProvider.mediaResources.length,
        totalDuration: this.calculateTotalDuration(),
        totalSize: this.calculateTotalSize(),
        resourceTypes: this.calculateResourceTypeStats(),
      },
      recentlyAdded: this.getRecentlyAddedResources(),
    }

    // Собираем контекст браузера
    const browserContext: BrowserContext = {
      activeTab: this.browserState?.activeTab || "media",
      availableMedia: this.getBrowserMedia(),
      currentFilters: this.getBrowserFilters(),
      favoriteFiles: this.getFavoriteFiles(),
    }

    // Собираем контекст плеера
    const playerContext: PlayerContext = {
      currentVideo: this.playerState?.video || null,
      playbackState: {
        isPlaying: this.playerState?.isPlaying || false,
        currentTime: this.playerState?.currentTime || 0,
        duration: this.playerState?.duration || 0,
        volume: this.playerState?.volume || 1,
      },
      previewEffects: this.playerState?.appliedEffects || [],
      previewFilters: this.playerState?.appliedFilters || [],
      previewTemplate: this.playerState?.appliedTemplate || null,
    }

    // Собираем контекст таймлайна
    const timelineContext: TimelineContext = {
      currentProject: this.timelineState?.project || null,
      projectStats: this.calculateProjectStats(),
      recentChanges: this.getRecentTimelineChanges(),
      issues: this.analyzeTimelineIssues(),
    }

    // Пользовательские предпочтения (заглушки)
    const userPreferences = {
      defaultProjectSettings: {
        resolution: { width: 1920, height: 1080 },
        fps: 30,
        aspectRatio: "16:9",
      },
      contentPreferences: {
        preferredTransitionDuration: 0.5,
        autoApplyColorCorrection: true,
        autoBalanceAudio: true,
        preferredTrackTypes: ["video", "audio", "music"],
      },
      aiCommandHistory: [],
    }

    return {
      resources: resourcesContext,
      browser: browserContext,
      player: playerContext,
      timeline: timelineContext,
      userPreferences,
    }
  }

  /**
   * Создает Timeline проект из промпта пользователя
   */
  public async createTimelineFromPrompt(prompt: string): Promise<TimelineAIResult> {
    const startTime = Date.now()

    try {
      const context = this.createContext()

      // Создаем системный промпт для Claude
      const systemPrompt = this.createSystemPrompt(context)

      // Отправляем запрос к Claude с инструментами
      const response = await this.claudeService.sendRequestWithTools(
        CLAUDE_MODELS.CLAUDE_4_SONNET,
        [{ role: "user", content: prompt }],
        this.allTools,
        {
          system: systemPrompt,
          temperature: 0.7,
          max_tokens: 4000,
        },
      )

      // Обрабатываем ответ и выполняем инструменты
      const result = await this.processClaudeResponse(response, context)

      return {
        success: result.success,
        message: result.message,
        data: result.data,
        errors: result.errors,
        warnings: result.warnings,
        executionTime: Date.now() - startTime,
        nextActions: [], // AIToolResult не имеет nextActions
      }
    } catch (error) {
      return {
        success: false,
        message: `Ошибка при создании Timeline: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`,
        errors: [error instanceof Error ? error.message : "Неизвестная ошибка"],
        executionTime: Date.now() - startTime,
      }
    }
  }

  /**
   * Анализирует доступные ресурсы и предлагает улучшения
   */
  public async analyzeAndSuggestResources(query: string): Promise<TimelineAIResult> {
    const startTime = Date.now()

    try {
      const context = this.createContext()
      const systemPrompt = this.createAnalysisSystemPrompt(context)

      const response = await this.claudeService.sendRequestWithTools(
        CLAUDE_MODELS.CLAUDE_4_SONNET,
        [{ role: "user", content: query }],
        [...resourceTools, ...browserTools],
        {
          system: systemPrompt,
          temperature: 0.5,
          max_tokens: 2000,
        },
      )

      const result = await this.processClaudeResponse(response, context)

      return {
        success: result.success,
        message: result.message,
        data: result.data,
        executionTime: Date.now() - startTime,
        nextActions: [], // AIToolResult не имеет nextActions
      }
    } catch (error) {
      return {
        success: false,
        message: `Ошибка при анализе ресурсов: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`,
        errors: [error instanceof Error ? error.message : "Неизвестная ошибка"],
        executionTime: Date.now() - startTime,
      }
    }
  }

  /**
   * Выполняет команду Timeline AI
   */
  public async executeCommand(command: string, params: any = {}): Promise<TimelineAIResult> {
    const startTime = Date.now()

    try {
      const context = this.createContext()
      const fullPrompt = `${command}\n\nПараметры: ${JSON.stringify(params, null, 2)}`

      const systemPrompt = this.createSystemPrompt(context)

      const response = await this.claudeService.sendRequestWithTools(
        CLAUDE_MODELS.CLAUDE_4_SONNET,
        [{ role: "user", content: fullPrompt }],
        this.allTools,
        {
          system: systemPrompt,
          temperature: 0.6,
          max_tokens: 3000,
        },
      )

      const result = await this.processClaudeResponse(response, context)

      return {
        success: result.success,
        message: result.message,
        data: result.data,
        executionTime: Date.now() - startTime,
        nextActions: [], // AIToolResult не имеет nextActions
      }
    } catch (error) {
      return {
        success: false,
        message: `Ошибка при выполнении команды: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`,
        errors: [error instanceof Error ? error.message : "Неизвестная ошибка"],
        executionTime: Date.now() - startTime,
      }
    }
  }

  /**
   * Создает системный промпт для анализа ресурсов
   */
  private createAnalysisSystemPrompt(context: TimelineStudioContext): string {
    return `Ты - AI ассистент для анализа медиа ресурсов в Timeline Studio.

ЗАДАЧА: Проанализировать доступные ресурсы и предложить рекомендации

ДОСТУПНЫЕ РЕСУРСЫ:
- Медиафайлы: ${context.resources.stats.totalMedia}
- Эффекты: ${context.resources.stats.resourceTypes.effect}
- Фильтры: ${context.resources.stats.resourceTypes.filter}
- Переходы: ${context.resources.stats.resourceTypes.transition}
- Шаблоны: ${context.resources.stats.resourceTypes.template}

ПРИНЦИПЫ АНАЛИЗА:
1. Оценивай качество и разнообразие контента
2. Предлагай оптимальные комбинации ресурсов
3. Учитывай цветовую схему и стиль
4. Рекомендуй подходящие эффекты и переходы

Используй доступные инструменты для анализа и предложений.`
  }

  /**
   * Создает системный промпт для Claude
   */
  private createSystemPrompt(context: TimelineStudioContext): string {
    return `Ты - AI ассистент для Timeline Studio, профессионального видеоредактора.

ТВОЯ РОЛЬ:
- Помогать пользователям создавать Timeline проекты из медиа ресурсов
- Анализировать доступный контент и предлагать оптимальную структуру
- Автоматизировать размещение клипов и применение эффектов
- Предлагать улучшения качества и повествования

ТЕКУЩИЙ КОНТЕКСТ:
- Доступно ресурсов: ${context.resources.stats.totalMedia} медиафайлов, ${Object.values(context.resources.stats.resourceTypes).reduce((a, b) => a + b, 0)} других ресурсов
- Активная вкладка браузера: ${context.browser.activeTab}
- Текущий проект: ${context.timeline.currentProject ? context.timeline.currentProject.name : "отсутствует"}
- Плеер: ${context.player.currentVideo ? `воспроизводит ${context.player.currentVideo.name}` : "свободен"}

ПРИНЦИПЫ РАБОТЫ:
1. Всегда сначала анализируй доступные ресурсы перед созданием Timeline
2. Предпочитай добавление ресурсов в Resources Provider перед размещением на Timeline
3. Создавай логичную структуру секций и треков
4. Учитывай хронологию и тематику контента
5. Предлагай конкретные действия, а не общие рекомендации

ИНСТРУМЕНТЫ:
Используй доступные инструменты для анализа, добавления ресурсов, создания Timeline и применения улучшений.

Отвечай кратко и конкретно. Фокусируйся на практических действиях.`
  }

  /**
   * Обрабатывает ответ Claude и выполняет инструменты
   */
  private async processClaudeResponse(
    response: { text: string; tool_use?: any },
    context: TimelineStudioContext,
  ): Promise<AIToolResult> {
    const result: AIToolResult = {
      success: true,
      message: response.text,
      data: {},
    }

    // Если Claude использовал инструмент
    if (response.tool_use) {
      try {
        const toolResult = await this.executeToolFunction(response.tool_use, context)
        result.data = { ...result.data, ...toolResult.data }

        if (!toolResult.success) {
          result.success = false
          result.errors = toolResult.errors
          result.warnings = toolResult.warnings
        }
      } catch (error) {
        result.success = false
        result.errors = [
          `Ошибка выполнения инструмента: ${error instanceof Error ? error.message : "Неизвестная ошибка"}`,
        ]
      }
    }

    return result
  }

  /**
   * Выполняет функцию инструмента
   */
  private async executeToolFunction(toolUse: any, _context: TimelineStudioContext): Promise<AIToolResult> {
    const { name, input } = toolUse

    try {
      console.log(`Executing tool: ${name} with input:`, input)

      let result: any

      // Роутинг по категориям инструментов
      if (
        name.startsWith("whisper_") ||
        [
          "check_whisper_availability",
          "get_whisper_models",
          "download_whisper_model",
          "transcribe_media",
          "translate_audio_to_english",
          "batch_transcribe_clips",
          "create_subtitles_from_transcription",
          "detect_audio_language",
          "improve_transcription_quality",
          "sync_subtitles_with_whisper",
        ].includes(name)
      ) {
        result = await executeWhisperTool(name, input)
      } else if (
        name.startsWith("subtitle_") ||
        [
          "analyze_audio_for_transcription",
          "generate_subtitles_from_audio",
          "translate_subtitles",
          "edit_subtitle_text",
          "sync_subtitles_with_audio",
          "apply_subtitle_styling",
          "split_long_subtitles",
          "filter_subtitle_content",
          "export_subtitles",
          "create_multilingual_subtitles",
          "analyze_subtitle_quality",
          "create_chapters_from_subtitles",
        ].includes(name)
      ) {
        result = await executeSubtitleTool(name, input)
      } else if (
        name.startsWith("video_analysis_") ||
        name.startsWith("ffmpeg_") ||
        [
          "get_video_metadata",
          "detect_video_scenes",
          "analyze_video_quality",
          "detect_silence_segments",
          "analyze_motion_detection",
          "extract_keyframes",
          "analyze_audio_properties",
          "quick_video_analysis",
          "comprehensive_video_analysis",
          "batch_analyze_videos",
          "analyze_video_for_editing",
          "detect_scene_changes",
          "analyze_video_content",
          "compare_video_quality",
          "analyze_video_encoding",
        ].includes(name)
      ) {
        result = await executeVideoAnalysisTool(name, input)
      } else if (
        name.startsWith("batch_") ||
        [
          "start_batch_operation",
          "get_batch_progress",
          "cancel_batch_operation",
          "get_batch_processing_stats",
          "get_batch_history",
          "batch_analyze_videos",
          "batch_transcribe_videos",
          "batch_generate_subtitles",
          "batch_detect_languages",
          "batch_detect_scenes",
          "create_batch_report",
          "clear_batch_history",
        ].includes(name)
      ) {
        result = await executeBatchProcessingTool(name, input)
      } else if (
        name.startsWith("multimodal_") ||
        name.startsWith("analyze_video_") ||
        [
          "analyze_video_frame",
          "analyze_video_multimodal",
          "suggest_video_thumbnails",
          "detect_video_highlights",
          "analyze_video_emotions",
          "extract_video_text",
          "analyze_video_aesthetics",
          "batch_analyze_multimodal",
          "generate_video_descriptions",
          "moderate_video_content",
        ].includes(name)
      ) {
        result = await executeMultimodalAnalysisTool(name, input)
      } else if (
        name.startsWith("platform_") ||
        [
          "get_platform_specs",
          "get_all_platforms",
          "get_recommended_platforms",
          "analyze_video_for_platforms",
          "optimize_for_platform",
          "batch_optimize_for_platforms",
          "generate_platform_thumbnail",
          "check_platform_compliance",
          "get_optimization_stats",
          "generate_platform_metadata",
        ].includes(name)
      ) {
        result = await executePlatformOptimizationTool(name, input)
      } else if (
        name.startsWith("workflow_") ||
        name.includes("workflow") ||
        [
          "get_available_workflows",
          "execute_workflow",
          "get_workflow_status",
          "cancel_workflow",
          "create_custom_workflow",
          "analyze_video_for_workflow",
          "get_workflow_suggestions",
          "export_workflow_results",
          "create_workflow_template",
        ].includes(name)
      ) {
        result = await executeWorkflowAutomationTool(name, input)
      } else {
        // Пока заглушка для остальных инструментов (browser, player, timeline, resource)
        console.warn(`Tool execution not implemented for: ${name}`)
        result = {
          success: false,
          message: `Инструмент ${name} пока не реализован`,
          toolName: name,
          input,
        }
      }

      return {
        success: true,
        message: `Инструмент ${name} выполнен успешно`,
        data: result,
      }
    } catch (error) {
      console.error(`Error executing tool ${name}:`, error)
      return {
        success: false,
        message: `Ошибка выполнения инструмента ${name}: ${String(error)}`,
        data: { toolName: name, input, error: String(error) },
      }
    }
  }

  // Вспомогательные методы для сбора контекста

  private calculateTotalDuration(): number {
    return this.resourcesProvider.mediaResources.reduce((total: number, resource) => {
      const duration: number = typeof resource.file.duration === "number" ? resource.file.duration : 0
      return total + duration
    }, 0)
  }

  private calculateTotalSize(): number {
    return this.resourcesProvider.mediaResources.reduce((total: number, resource) => {
      const size: number = typeof resource.file.size === "number" ? resource.file.size : 0
      return total + size
    }, 0)
  }

  private calculateResourceTypeStats(): Record<string, number> {
    return {
      media: this.resourcesProvider.mediaResources.length,
      effect: this.resourcesProvider.effectResources.length,
      filter: this.resourcesProvider.filterResources.length,
      transition: this.resourcesProvider.transitionResources.length,
      template: this.resourcesProvider.templateResources.length,
      styleTemplate: this.resourcesProvider.styleTemplateResources.length,
      music: this.resourcesProvider.musicResources.length,
    }
  }

  private getRecentlyAddedResources(): any[] {
    // Заглушка - нужно реализовать логику отслеживания времени добавления
    return []
  }

  private getBrowserMedia(): MediaFile[] {
    // Заглушка - нужно получать данные из браузера
    return []
  }

  private getBrowserFilters(): any {
    return this.browserState?.tabSettings?.[this.browserState?.activeTab] || {}
  }

  private getFavoriteFiles(): string[] {
    // Заглушка - нужно получать избранные файлы
    return []
  }

  private calculateProjectStats(): any {
    if (!this.timelineState?.project) {
      return {
        totalDuration: 0,
        totalClips: 0,
        totalTracks: 0,
        totalSections: 0,
        usedResources: {},
      }
    }

    // Заглушка - нужно реализовать подсчет статистики проекта
    return {
      totalDuration: 0,
      totalClips: 0,
      totalTracks: 0,
      totalSections: 0,
      usedResources: {},
    }
  }

  private getRecentTimelineChanges(): any[] {
    // Заглушка - нужно реализовать отслеживание изменений
    return []
  }

  private analyzeTimelineIssues(): any[] {
    // Заглушка - нужно реализовать анализ проблем
    return []
  }
}
