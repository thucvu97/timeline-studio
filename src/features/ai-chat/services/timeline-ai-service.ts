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
import { browserTools } from "../tools/browser-tools"
import { playerTools } from "../tools/player-tools"
import { resourceTools } from "../tools/resource-tools"
import { timelineTools } from "../tools/timeline-tools"
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
    this.allTools = [...resourceTools, ...browserTools, ...playerTools, ...timelineTools]
  }

  /**
   * Устанавливает API ключ Claude
   */
  public setApiKey(apiKey: string): void {
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
- Плеер: ${context.player.currentVideo ? "воспроизводит " + context.player.currentVideo.name : "свободен"}

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
   * Создает системный промпт для анализа
   */
  private createAnalysisSystemPrompt(context: TimelineStudioContext): string {
    return `Ты - AI аналитик для Timeline Studio.

ЗАДАЧА: Анализировать медиа ресурсы и предлагать оптимальные решения.

КОНТЕКСТ:
- Ресурсов в пуле: ${context.resources.availableResources.media.length} медиа, ${context.resources.availableResources.effects.length} эффектов
- В браузере: ${context.browser.availableMedia.length} файлов
- Активные фильтры: ${context.browser.currentFilters.searchQuery || "нет"}

Сосредоточься на анализе качества, совместимости и предложениях по улучшению.`
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
  private async executeToolFunction(toolUse: any, context: TimelineStudioContext): Promise<AIToolResult> {
    const { name, input } = toolUse

    // Здесь будет логика выполнения конкретных инструментов
    // Пока возвращаем заглушку
    console.log(`Executing tool: ${name} with input:`, input)

    return {
      success: true,
      message: `Инструмент ${name} выполнен успешно`,
      data: { toolName: name, input },
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
      effects: this.resourcesProvider.effectResources.length,
      filters: this.resourcesProvider.filterResources.length,
      transitions: this.resourcesProvider.transitionResources.length,
      templates: this.resourcesProvider.templateResources.length,
      styleTemplates: this.resourcesProvider.styleTemplateResources.length,
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
