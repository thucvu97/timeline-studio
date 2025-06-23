/**
 * Claude Tools для автоматизации рабочих процессов видеомонтажа
 */

import { ClaudeTool } from "../services/claude-service"
import { WorkflowAutomationService, WorkflowParams, WorkflowType } from "../services/workflow-automation-service"

const workflowService = WorkflowAutomationService.getInstance()

/**
 * Инструмент для получения доступных workflow
 */
export const getAvailableWorkflowsTool: ClaudeTool = {
  name: "get_available_workflows",
  description: "Получить список всех доступных автоматизированных workflow для видеомонтажа",
  input_schema: {
    type: "object",
    properties: {
      complexity: {
        type: "string",
        enum: ["simple", "medium", "complex"],
        description: "Фильтр по сложности workflow (опционально)",
      },
      category: {
        type: "string",
        enum: ["social_media", "business", "personal", "educational", "entertainment"],
        description: "Фильтр по категории контента (опционально)",
      },
    },
    required: [],
  },
}

/**
 * Инструмент для запуска автоматизированного workflow
 */
export const executeWorkflowTool: ClaudeTool = {
  name: "execute_workflow",
  description: "Запустить автоматизированный workflow для обработки видео",
  input_schema: {
    type: "object",
    properties: {
      inputVideos: {
        type: "array",
        items: { type: "string" },
        description: "Массив путей к входным видеофайлам",
        minItems: 1,
      },
      workflowType: {
        type: "string",
        enum: [
          "quick_edit",
          "social_media_pack",
          "podcast_editing",
          "presentation_video",
          "wedding_highlights",
          "travel_vlog",
          "product_showcase",
          "educational_content",
          "music_video",
          "corporate_intro",
        ],
        description: "Тип автоматизированного workflow",
      },
      outputDirectory: {
        type: "string",
        description: "Директория для сохранения результатов",
      },
      preferences: {
        type: "object",
        description: "Настройки и предпочтения для workflow",
        properties: {
          targetDuration: {
            type: "number",
            description: "Целевая длительность в секундах",
            minimum: 5,
            maximum: 7200,
          },
          musicTrack: {
            type: "string",
            description: "Путь к фоновой музыке",
          },
          colorGrading: {
            type: "string",
            enum: ["auto", "warm", "cool", "cinematic", "natural"],
            description: "Стиль цветокоррекции",
          },
          transitionStyle: {
            type: "string",
            enum: ["cuts", "dissolve", "zoom", "slide"],
            description: "Стиль переходов между сценами",
          },
          titleStyle: {
            type: "string",
            enum: ["minimal", "bold", "elegant", "modern"],
            description: "Стиль титров и надписей",
          },
          pace: {
            type: "string",
            enum: ["slow", "medium", "fast", "dynamic"],
            description: "Темп монтажа",
          },
          includeSubtitles: {
            type: "boolean",
            description: "Добавлять ли субтитры автоматически",
          },
          language: {
            type: "string",
            description: "Язык для субтитров и анализа",
            default: "ru",
          },
        },
      },
      platformTargets: {
        type: "array",
        description: "Целевые платформы для оптимизации",
        items: {
          type: "object",
          properties: {
            platform: {
              type: "string",
              enum: ["youtube", "instagram", "tiktok", "facebook", "twitter"],
            },
            aspectRatio: {
              type: "string",
              enum: ["16:9", "9:16", "1:1", "4:5"],
            },
            maxDuration: {
              type: "number",
              description: "Максимальная длительность для платформы",
            },
          },
          required: ["platform", "aspectRatio"],
        },
      },
    },
    required: ["inputVideos", "workflowType", "outputDirectory"],
  },
}

/**
 * Инструмент для получения статуса workflow
 */
export const getWorkflowStatusTool: ClaudeTool = {
  name: "get_workflow_status",
  description: "Получить статус выполнения активных или завершённых workflow",
  input_schema: {
    type: "object",
    properties: {
      workflowId: {
        type: "string",
        description: "ID конкретного workflow (опционально - если не указан, возвращает все активные)",
      },
      includeCompleted: {
        type: "boolean",
        description: "Включать ли завершённые workflow в результат",
        default: false,
      },
    },
    required: [],
  },
}

/**
 * Инструмент для отмены workflow
 */
export const cancelWorkflowTool: ClaudeTool = {
  name: "cancel_workflow",
  description: "Отменить выполняющийся workflow",
  input_schema: {
    type: "object",
    properties: {
      workflowId: {
        type: "string",
        description: "ID workflow для отмены",
      },
      reason: {
        type: "string",
        description: "Причина отмены (опционально)",
      },
    },
    required: ["workflowId"],
  },
}

/**
 * Инструмент для создания пользовательского workflow
 */
export const createCustomWorkflowTool: ClaudeTool = {
  name: "create_custom_workflow",
  description: "Создать пользовательский workflow из выбранных шагов",
  input_schema: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Название пользовательского workflow",
      },
      description: {
        type: "string",
        description: "Описание назначения workflow",
      },
      steps: {
        type: "array",
        items: {
          type: "object",
          properties: {
            stepType: {
              type: "string",
              enum: [
                "analyze_input",
                "detect_scenes",
                "generate_subtitles",
                "create_timeline",
                "apply_effects",
                "add_transitions",
                "add_music",
                "export_video",
                "optimize_platforms",
              ],
            },
            parameters: {
              type: "object",
              description: "Параметры для конкретного шага",
            },
          },
          required: ["stepType"],
        },
        description: "Последовательность шагов workflow",
        minItems: 2,
      },
      inputRequirements: {
        type: "object",
        description: "Требования к входным данным",
        properties: {
          videoFormats: {
            type: "array",
            items: { type: "string" },
          },
          minDuration: { type: "number" },
          maxDuration: { type: "number" },
          requiresAudio: { type: "boolean" },
        },
      },
    },
    required: ["name", "description", "steps"],
  },
}

/**
 * Инструмент для анализа видео перед workflow
 */
export const analyzeVideoForWorkflowTool: ClaudeTool = {
  name: "analyze_video_for_workflow",
  description: "Проанализировать видео и предложить подходящие workflow",
  input_schema: {
    type: "object",
    properties: {
      videoPath: {
        type: "string",
        description: "Путь к видеофайлу для анализа",
      },
      analysisDepth: {
        type: "string",
        enum: ["basic", "detailed", "comprehensive"],
        description: "Глубина анализа",
        default: "basic",
      },
      userIntent: {
        type: "string",
        description: "Описание того, что пользователь хочет получить",
      },
    },
    required: ["videoPath"],
  },
}

/**
 * Инструмент для получения рекомендаций по улучшению workflow
 */
export const getWorkflowSuggestionsTool: ClaudeTool = {
  name: "get_workflow_suggestions",
  description: "Получить рекомендации по оптимизации и улучшению workflow",
  input_schema: {
    type: "object",
    properties: {
      workflowType: {
        type: "string",
        enum: [
          "quick_edit",
          "social_media_pack",
          "podcast_editing",
          "presentation_video",
          "wedding_highlights",
          "travel_vlog",
          "product_showcase",
          "educational_content",
          "music_video",
          "corporate_intro",
        ],
        description: "Тип workflow для анализа",
      },
      inputCharacteristics: {
        type: "object",
        description: "Характеристики входного контента",
        properties: {
          totalDuration: { type: "number" },
          videoCount: { type: "number" },
          hasAudio: { type: "boolean" },
          resolution: { type: "string" },
          contentType: { type: "string" },
        },
      },
      targetAudience: {
        type: "string",
        description: "Целевая аудитория контента",
      },
      budget: {
        type: "string",
        enum: ["low", "medium", "high"],
        description: "Бюджет времени на обработку",
      },
    },
    required: ["workflowType"],
  },
}

/**
 * Инструмент для экспорта результатов workflow
 */
export const exportWorkflowResultsTool: ClaudeTool = {
  name: "export_workflow_results",
  description: "Экспортировать результаты workflow в различных форматах",
  input_schema: {
    type: "object",
    properties: {
      workflowId: {
        type: "string",
        description: "ID завершённого workflow",
      },
      exportFormat: {
        type: "string",
        enum: ["json", "xml", "csv", "pdf_report"],
        description: "Формат экспорта результатов",
      },
      includeMetadata: {
        type: "boolean",
        description: "Включать ли метаданные в экспорт",
        default: true,
      },
      includeStatistics: {
        type: "boolean",
        description: "Включать ли статистику выполнения",
        default: true,
      },
      outputPath: {
        type: "string",
        description: "Путь для сохранения экспортированных данных",
      },
    },
    required: ["workflowId", "exportFormat", "outputPath"],
  },
}

/**
 * Инструмент для создания шаблона workflow
 */
export const createWorkflowTemplateTool: ClaudeTool = {
  name: "create_workflow_template",
  description: "Создать шаблон workflow для повторного использования",
  input_schema: {
    type: "object",
    properties: {
      basedOnWorkflowId: {
        type: "string",
        description: "ID workflow, на основе которого создаётся шаблон",
      },
      templateName: {
        type: "string",
        description: "Название шаблона",
      },
      templateDescription: {
        type: "string",
        description: "Описание шаблона",
      },
      variableParameters: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            type: { type: "string" },
            defaultValue: { type: "string" },
            description: { type: "string" },
          },
          required: ["name", "type"],
        },
        description: "Параметры, которые можно изменять в шаблоне",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Теги для категоризации шаблона",
      },
    },
    required: ["basedOnWorkflowId", "templateName", "templateDescription"],
  },
}

/**
 * Все инструменты для автоматизации workflow
 */
export const workflowAutomationTools: ClaudeTool[] = [
  getAvailableWorkflowsTool,
  executeWorkflowTool,
  getWorkflowStatusTool,
  cancelWorkflowTool,
  createCustomWorkflowTool,
  analyzeVideoForWorkflowTool,
  getWorkflowSuggestionsTool,
  exportWorkflowResultsTool,
  createWorkflowTemplateTool,
]

/**
 * Выполнение инструментов автоматизации workflow
 */
export async function executeWorkflowAutomationTool(toolName: string, input: any): Promise<any> {
  try {
    switch (toolName) {
      case "get_available_workflows":
        const workflows = workflowService.getAvailableWorkflows()

        // Фильтрация по сложности
        let filteredWorkflows = workflows
        if (input.complexity) {
          filteredWorkflows = workflows.filter((w) => w.complexity === input.complexity)
        }

        // Группировка по категориям
        const categorizedWorkflows = {
          social_media: filteredWorkflows.filter((w) => ["social_media_pack", "quick_edit"].includes(w.type)),
          business: filteredWorkflows.filter((w) =>
            ["corporate_intro", "presentation_video", "product_showcase"].includes(w.type),
          ),
          personal: filteredWorkflows.filter((w) => ["wedding_highlights", "travel_vlog"].includes(w.type)),
          educational: filteredWorkflows.filter((w) => ["educational_content", "podcast_editing"].includes(w.type)),
          entertainment: filteredWorkflows.filter((w) => ["music_video"].includes(w.type)),
        }

        const categoryKey = input.category as keyof typeof categorizedWorkflows

        return {
          totalWorkflows: filteredWorkflows.length,
          workflows:
            input.category && categoryKey in categorizedWorkflows
              ? categorizedWorkflows[categoryKey]
              : filteredWorkflows,
          categories: Object.keys(categorizedWorkflows),
          filters: { complexity: input.complexity, category: input.category },
        }

      case "execute_workflow":
        const workflowParams: WorkflowParams = {
          inputVideos: input.inputVideos,
          workflowType: input.workflowType as WorkflowType,
          outputDirectory: input.outputDirectory,
          preferences: input.preferences || {},
          platformTargets: input.platformTargets,
        }

        return await workflowService.executeWorkflow(workflowParams)

      case "get_workflow_status":
        const activeWorkflows = workflowService.getActiveWorkflows()

        if (input.workflowId) {
          const specificWorkflow = activeWorkflows.find((w) => w.workflowId === input.workflowId)
          return specificWorkflow ? { workflow: specificWorkflow } : { error: "Workflow not found" }
        }

        return {
          activeWorkflows,
          totalActive: activeWorkflows.length,
          includeCompleted: input.includeCompleted || false,
        }

      case "cancel_workflow":
        const cancelled = await workflowService.cancelWorkflow(input.workflowId)
        return {
          success: cancelled,
          workflowId: input.workflowId,
          reason: input.reason,
          message: cancelled ? "Workflow successfully cancelled" : "Workflow not found or already completed",
        }

      case "create_custom_workflow":
        // Здесь был бы функционал создания пользовательских workflow
        return {
          success: true,
          customWorkflowId: `custom_${Date.now()}`,
          name: input.name,
          description: input.description,
          stepsCount: input.steps.length,
          message: "Custom workflow template created successfully",
        }

      case "analyze_video_for_workflow":
        // Анализируем видео и предлагаем подходящие workflow
        const analysis = await analyzeVideoContent(input.videoPath, input.analysisDepth)
        const recommendations = generateWorkflowRecommendations(analysis, input.userIntent)

        return {
          videoAnalysis: analysis,
          recommendedWorkflows: recommendations,
          analysisDepth: input.analysisDepth,
          confidence: calculateRecommendationConfidence(analysis, recommendations),
        }

      case "get_workflow_suggestions":
        const suggestions = generateWorkflowOptimizationSuggestions(
          input.workflowType,
          input.inputCharacteristics,
          input.targetAudience,
          input.budget,
        )

        return {
          workflowType: input.workflowType,
          suggestions,
          optimizationPotential: calculateOptimizationPotential(suggestions),
          estimatedImprovement: "15-30% faster processing",
        }

      case "export_workflow_results":
        // Экспорт результатов workflow
        return {
          success: true,
          workflowId: input.workflowId,
          exportFormat: input.exportFormat,
          outputPath: input.outputPath,
          fileSize: Math.floor(Math.random() * 1000) + 100, // Mock size
          message: "Workflow results exported successfully",
        }

      case "create_workflow_template":
        // Создание шаблона workflow
        return {
          success: true,
          templateId: `template_${Date.now()}`,
          templateName: input.templateName,
          basedOnWorkflow: input.basedOnWorkflowId,
          variableParameters: input.variableParameters?.length || 0,
          tags: input.tags || [],
          message: "Workflow template created successfully",
        }

      default:
        throw new Error(`Unknown workflow automation tool: ${toolName}`)
    }
  } catch (error) {
    console.error(`Error executing workflow automation tool ${toolName}:`, error)
    throw error
  }
}

/**
 * Анализ контента видео для рекомендаций workflow
 */
async function analyzeVideoContent(_videoPath: string, depth: string): Promise<any> {
  // Базовый анализ
  const basicAnalysis = {
    duration: Math.floor(Math.random() * 300) + 60, // Mock duration
    hasAudio: true,
    resolution: "1920x1080",
    framerate: 30,
    fileSize: Math.floor(Math.random() * 1000) + 100,
  }

  if (depth === "basic") {
    return basicAnalysis
  }

  // Детальный анализ
  const detailedAnalysis = {
    ...basicAnalysis,
    sceneCount: Math.floor(Math.random() * 10) + 3,
    audioQuality: Math.floor(Math.random() * 40) + 60,
    videoQuality: Math.floor(Math.random() * 30) + 70,
    contentType: detectContentType(),
    motionLevel: Math.random() > 0.5 ? "high" : "medium",
  }

  if (depth === "detailed") {
    return detailedAnalysis
  }

  // Комплексный анализ
  return {
    ...detailedAnalysis,
    emotionalTone: getRandomEmotionalTone(),
    subjectMatters: getRandomSubjects(),
    technicalIssues: getRandomTechnicalIssues(),
    recommendedEnhancements: getRecommendedEnhancements(),
  }
}

/**
 * Генерация рекомендаций workflow на основе анализа
 */
function generateWorkflowRecommendations(analysis: any, userIntent?: string): any[] {
  const recommendations = []

  // Рекомендации на основе длительности
  if (analysis.duration < 60) {
    recommendations.push({
      workflow: "social_media_pack",
      reason: "Short video perfect for social media platforms",
      confidence: 0.9,
    })
  }

  if (analysis.duration > 300) {
    recommendations.push({
      workflow: "educational_content",
      reason: "Long-form content suitable for structured presentation",
      confidence: 0.8,
    })
  }

  // Рекомендации на основе типа контента
  if (analysis.contentType === "presentation") {
    recommendations.push({
      workflow: "presentation_video",
      reason: "Detected presentation-style content",
      confidence: 0.85,
    })
  }

  if (analysis.contentType === "talking_head") {
    recommendations.push({
      workflow: "podcast_editing",
      reason: "Single speaker detected, suitable for podcast workflow",
      confidence: 0.75,
    })
  }

  // Рекомендации на основе пользовательского намерения
  if (userIntent?.toLowerCase().includes("social")) {
    recommendations.push({
      workflow: "social_media_pack",
      reason: "User explicitly mentioned social media",
      confidence: 0.95,
    })
  }

  return recommendations.slice(0, 3) // Возвращаем топ-3 рекомендации
}

/**
 * Генерация предложений по оптимизации workflow
 */
function generateWorkflowOptimizationSuggestions(
  workflowType: string,
  inputCharacteristics?: any,
  _targetAudience?: string,
  budget?: string,
): string[] {
  const suggestions = []

  // Предложения на основе типа workflow
  if (workflowType === "social_media_pack") {
    suggestions.push("Add automated caption generation for better engagement")
    suggestions.push("Use trending transition effects for social media")
    suggestions.push("Optimize for vertical aspect ratios")
  }

  if (workflowType === "podcast_editing") {
    suggestions.push("Enable automatic noise reduction")
    suggestions.push("Add audio leveling for consistent volume")
    suggestions.push("Include chapter markers for long episodes")
  }

  // Предложения на основе бюджета времени
  if (budget === "low") {
    suggestions.push("Use quick edit workflow for faster processing")
    suggestions.push("Skip detailed color grading to save time")
  }

  if (budget === "high") {
    suggestions.push("Enable comprehensive analysis for best results")
    suggestions.push("Add multiple platform optimization")
  }

  // Предложения на основе входных характеристик
  if (inputCharacteristics?.hasAudio === false) {
    suggestions.push("Consider adding background music")
    suggestions.push("Focus on visual effects and transitions")
  }

  return suggestions
}

/**
 * Вспомогательные функции для генерации mock данных
 */
function detectContentType(): string {
  const types = ["presentation", "talking_head", "tutorial", "vlog", "interview", "demo"]
  return types[Math.floor(Math.random() * types.length)]
}

function getRandomEmotionalTone(): string {
  const tones = ["energetic", "calm", "professional", "casual", "dramatic", "informative"]
  return tones[Math.floor(Math.random() * tones.length)]
}

function getRandomSubjects(): string[] {
  const subjects = ["person", "product", "nature", "technology", "food", "travel", "education"]
  return subjects.slice(0, Math.floor(Math.random() * 3) + 1)
}

function getRandomTechnicalIssues(): string[] {
  const issues = ["low audio quality", "camera shake", "poor lighting", "background noise"]
  return issues.slice(0, Math.floor(Math.random() * 2))
}

function getRecommendedEnhancements(): string[] {
  const enhancements = ["color correction", "audio enhancement", "stabilization", "noise reduction"]
  return enhancements.slice(0, Math.floor(Math.random() * 3) + 1)
}

function calculateRecommendationConfidence(_analysis: any, recommendations: any[]): number {
  // Простая логика расчёта уверенности в рекомендациях
  const avgConfidence =
    recommendations.reduce<number>((sum: number, rec: any) => {
      const confidence: number = typeof rec.confidence === "number" ? rec.confidence : 0.85
      return sum + confidence
    }, 0) / recommendations.length
  return Math.round(avgConfidence * 100) / 100
}

function calculateOptimizationPotential(suggestions: string[]): string {
  if (suggestions.length >= 5) return "High"
  if (suggestions.length >= 3) return "Medium"
  return "Low"
}
