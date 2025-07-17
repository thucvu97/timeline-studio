/**
 * AI инструмент для предложения улучшений Timeline
 */

import type { TimelineToolResult } from "./types"
import type { ClaudeTool } from "../../services/claude-service"

export const suggestTimelineImprovementsTool: ClaudeTool = {
  name: "suggest_timeline_improvements",
  description: "Анализирует таймлайн и предлагает улучшения",
  input_schema: {
    type: "object",
    properties: {
      analysisCategories: {
        type: "array",
        items: {
          type: "string",
          enum: ["performance", "quality", "storytelling", "technical", "accessibility"],
        },
        description: "Категории анализа для улучшений",
      },
      improvementPriority: {
        type: "string",
        enum: ["critical-only", "high-priority", "all-suggestions"],
        description: "Приоритет предлагаемых улучшений",
      },
    },
  },
}

export async function suggestTimelineImprovements(params: any): Promise<TimelineToolResult> {
  const {
    analysisCategories = ["performance", "quality", "storytelling", "technical"],
    improvementPriority = "high-priority",
  } = params

  try {
    const { getTimelineStateAccess } = await import("./types")

    const timelineAccess = getTimelineStateAccess()
    if (!timelineAccess) {
      return {
        success: false,
        message: "Timeline state access не настроен",
        errors: ["Доступ к timeline не сконфигурирован"],
      }
    }

    const currentProject = timelineAccess.getCurrentProject()
    if (!currentProject) {
      return {
        success: false,
        message: "Нет активного проекта для анализа",
        errors: ["Откройте или создайте проект в timeline"],
      }
    }

    // Получаем все треки и клипы для анализа
    const allTracks = [...currentProject.globalTracks]
    currentProject.sections.forEach((section) => allTracks.push(...section.tracks))

    const allClips = allTracks.reduce((clips: any[], track) => {
      return clips.concat(track.clips)
    }, [])

    // Проводим анализ по категориям
    const analysisResults: any = {}
    const allSuggestions: any[] = []
    const criticalIssues: any[] = []
    const warnings: string[] = []

    for (const category of analysisCategories) {
      const categoryAnalysis = await analyzeCategory(category, currentProject, allTracks, allClips, improvementPriority)

      analysisResults[category] = categoryAnalysis
      allSuggestions.push(...categoryAnalysis.suggestions)

      if (categoryAnalysis.criticalIssues) {
        criticalIssues.push(...categoryAnalysis.criticalIssues)
      }

      if (categoryAnalysis.warnings) {
        warnings.push(...categoryAnalysis.warnings)
      }
    }

    // Приоритизируем предложения
    const prioritizedSuggestions = prioritizeSuggestions(allSuggestions, improvementPriority)

    // Генерируем общие рекомендации
    const overallRecommendations = generateOverallRecommendations(analysisResults, currentProject, allTracks, allClips)

    // Создаем план действий
    const actionPlan = createActionPlan(prioritizedSuggestions, criticalIssues)

    const success = allSuggestions.length > 0

    return {
      success,
      message: success
        ? `Анализ завершен: найдено ${allSuggestions.length} предложений по улучшению`
        : "Предложения по улучшению не найдены - проект уже оптимизирован",
      data: {
        analysis: {
          categories: analysisResults,
          summary: {
            totalSuggestions: allSuggestions.length,
            criticalIssues: criticalIssues.length,
            analyzedCategories: analysisCategories,
            priority: improvementPriority,
          },
          statistics: {
            totalTracks: allTracks.length,
            totalClips: allClips.length,
            totalSections: currentProject.sections.length,
            projectDuration: currentProject.duration,
          },
        },
        suggestions: prioritizedSuggestions,
        actionPlan,
        overallRecommendations,
      },
      warnings: warnings.length > 0 ? warnings : undefined,
      nextActions: [
        criticalIssues.length > 0 ? "Исправить критические проблемы" : "Применить высокоприоритетные улучшения",
        "Просмотреть детальный анализ",
        "Применить автоматические улучшения",
        "Создать план оптимизации",
      ],
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка анализа улучшений: ${error instanceof Error ? error.message : String(error)}`,
      errors: [error instanceof Error ? error.message : String(error)],
    }
  }
}

// Анализирует конкретную категорию
async function analyzeCategory(
  category: string,
  project: any,
  allTracks: any[],
  allClips: any[],
  priority: string,
): Promise<any> {
  switch (category) {
    case "performance":
      return analyzePerformance(project, allTracks, allClips, priority)

    case "quality":
      return analyzeQuality(project, allTracks, allClips, priority)

    case "storytelling":
      return analyzeStorytelling(project, allTracks, allClips, priority)

    case "technical":
      return analyzeTechnical(project, allTracks, allClips, priority)

    case "accessibility":
      return analyzeAccessibility(project, allTracks, allClips, priority)

    default:
      return {
        suggestions: [],
        criticalIssues: [],
        warnings: [`Неизвестная категория анализа: ${category}`],
      }
  }
}

// Анализ производительности
async function analyzePerformance(project: any, allTracks: any[], allClips: any[], _priority: string): Promise<any> {
  const suggestions: any[] = []
  const criticalIssues: any[] = []
  const warnings: string[] = []

  // Проверка количества треков
  if (allTracks.length > 20) {
    suggestions.push({
      type: "performance",
      priority: "high",
      title: "Слишком много треков",
      description: `Обнаружено ${allTracks.length} треков, что может снизить производительность`,
      action: "Объедините похожие треки или удалите неиспользуемые",
      category: "track-optimization",
      impact: "high",
    })
  }

  // Проверка количества клипов
  if (allClips.length > 200) {
    suggestions.push({
      type: "performance",
      priority: "medium",
      title: "Большое количество клипов",
      description: `Проект содержит ${allClips.length} клипов, что может замедлить работу`,
      action: "Рассмотрите разделение проекта на несколько частей",
      category: "clip-optimization",
      impact: "medium",
    })
  }

  // Проверка эффектов
  const clipsWithManyEffects = allClips.filter((clip) => clip.effects && clip.effects.length > 5)
  if (clipsWithManyEffects.length > 0) {
    suggestions.push({
      type: "performance",
      priority: "medium",
      title: "Клипы с множественными эффектами",
      description: `${clipsWithManyEffects.length} клипов содержат более 5 эффектов`,
      action: "Оптимизируйте или объедините эффекты",
      category: "effect-optimization",
      impact: "medium",
    })
  }

  // Проверка длительности проекта
  if (project.duration > 3600) {
    // Более 1 часа
    suggestions.push({
      type: "performance",
      priority: "low",
      title: "Длинный проект",
      description: `Проект длительностью ${Math.round(project.duration / 60)} минут может работать медленно`,
      action: "Рассмотрите разделение на сегменты",
      category: "project-optimization",
      impact: "low",
    })
  }

  return {
    suggestions,
    criticalIssues,
    warnings,
    score: calculatePerformanceScore(allTracks, allClips, project),
  }
}

// Анализ качества
async function analyzeQuality(project: any, allTracks: any[], allClips: any[], _priority: string): Promise<any> {
  const suggestions: any[] = []
  const criticalIssues: any[] = []
  const warnings: string[] = []

  // Проверка видео клипов без звука
  const videoTracks = allTracks.filter((track) => track.type === "video")
  const audioTracks = allTracks.filter((track) => track.type === "audio")

  if (videoTracks.length > 0 && audioTracks.length === 0) {
    suggestions.push({
      type: "quality",
      priority: "high",
      title: "Отсутствует аудио",
      description: "Проект содержит только видео без звукового сопровождения",
      action: "Добавьте музыку, голос или звуковые эффекты",
      category: "audio-quality",
      impact: "high",
    })
  }

  // Проверка клипов без переходов
  const clipsWithoutTransitions = allClips.filter((clip) => !clip.transitions || clip.transitions.length === 0)

  if (clipsWithoutTransitions.length > allClips.length * 0.8) {
    suggestions.push({
      type: "quality",
      priority: "medium",
      title: "Отсутствуют переходы",
      description: `${clipsWithoutTransitions.length} клипов без плавных переходов`,
      action: "Добавьте переходы между клипами",
      category: "transition-quality",
      impact: "medium",
    })
  }

  // Проверка цветокоррекции
  const clipsWithoutColorCorrection = allClips.filter(
    (clip) =>
      !clip.effects ||
      !clip.effects.some((effect: any) => effect.type === "color-correction" || effect.type === "color-balance"),
  )

  if (clipsWithoutColorCorrection.length > allClips.length * 0.5) {
    suggestions.push({
      type: "quality",
      priority: "medium",
      title: "Отсутствует цветокоррекция",
      description: `${clipsWithoutColorCorrection.length} клипов без цветокоррекции`,
      action: "Примените базовую цветокоррекцию",
      category: "color-quality",
      impact: "medium",
    })
  }

  // Проверка аудио нормализации
  const audioClips = allClips.filter((clip) => clip.mediaFile?.type === "audio")
  const audioClipsWithoutNormalization = audioClips.filter(
    (clip) =>
      !clip.effects ||
      !clip.effects.some((effect: any) => effect.type === "audio-normalize" || effect.type === "volume"),
  )

  if (audioClipsWithoutNormalization.length > audioClips.length * 0.7) {
    suggestions.push({
      type: "quality",
      priority: "medium",
      title: "Аудио не нормализовано",
      description: `${audioClipsWithoutNormalization.length} аудио клипов без нормализации`,
      action: "Примените нормализацию аудио",
      category: "audio-quality",
      impact: "medium",
    })
  }

  return {
    suggestions,
    criticalIssues,
    warnings,
    score: calculateQualityScore(allTracks, allClips, project),
  }
}

// Анализ сторителлинга
async function analyzeStorytelling(project: any, allTracks: any[], allClips: any[], _priority: string): Promise<any> {
  const suggestions: any[] = []
  const criticalIssues: any[] = []
  const warnings: string[] = []

  // Проверка структуры секций
  if (project.sections.length < 3) {
    suggestions.push({
      type: "storytelling",
      priority: "medium",
      title: "Недостаточная структура",
      description: `Проект содержит только ${project.sections.length} секций`,
      action: "Создайте секции для вступления, развития и заключения",
      category: "structure",
      impact: "medium",
    })
  }

  // Проверка длительности клипов
  const averageClipDuration = allClips.reduce((sum, clip) => sum + clip.duration, 0) / allClips.length

  if (averageClipDuration < 2) {
    suggestions.push({
      type: "storytelling",
      priority: "medium",
      title: "Слишком короткие клипы",
      description: `Средняя длительность клипа ${averageClipDuration.toFixed(1)} сек`,
      action: "Увеличьте длительность клипов для лучшего восприятия",
      category: "pacing",
      impact: "medium",
    })
  } else if (averageClipDuration > 10) {
    suggestions.push({
      type: "storytelling",
      priority: "low",
      title: "Слишком длинные клипы",
      description: `Средняя длительность клипа ${averageClipDuration.toFixed(1)} сек`,
      action: "Сократите длительность клипов для поддержания внимания",
      category: "pacing",
      impact: "low",
    })
  }

  // Проверка эмоциональной дуги
  const sectionsWithEmotionalMarkers = project.sections.filter(
    (section: any) =>
      section.description &&
      (section.description.includes("кульминация") ||
        section.description.includes("развязка") ||
        section.description.includes("конфликт")),
  )

  if (sectionsWithEmotionalMarkers.length === 0) {
    suggestions.push({
      type: "storytelling",
      priority: "low",
      title: "Отсутствует эмоциональная дуга",
      description: "Не определены ключевые моменты истории",
      action: "Отметьте кульминацию и эмоциональные моменты",
      category: "emotional-arc",
      impact: "low",
    })
  }

  return {
    suggestions,
    criticalIssues,
    warnings,
    score: calculateStorytellingScore(project, allTracks, allClips),
  }
}

// Технический анализ
async function analyzeTechnical(project: any, allTracks: any[], allClips: any[], _priority: string): Promise<any> {
  const suggestions: any[] = []
  const criticalIssues: any[] = []
  const warnings: string[] = []

  // Проверка отсутствующих файлов
  const missingFiles = allClips.filter((clip) => !clip.mediaFile || clip.mediaFile.status === "missing")

  if (missingFiles.length > 0) {
    criticalIssues.push({
      type: "technical",
      priority: "critical",
      title: "Отсутствующие файлы",
      description: `${missingFiles.length} клипов ссылаются на недоступные файлы`,
      action: "Восстановите ссылки на медиафайлы",
      category: "file-management",
      impact: "critical",
    })
  }

  // Проверка разрешения
  const inconsistentResolution = allClips.filter(
    (clip) =>
      clip.mediaFile?.type === "video" &&
      clip.mediaFile.resolution &&
      (clip.mediaFile.resolution.width !== project.resolution?.width ||
        clip.mediaFile.resolution.height !== project.resolution?.height),
  )

  if (inconsistentResolution.length > 0) {
    suggestions.push({
      type: "technical",
      priority: "medium",
      title: "Несовпадающие разрешения",
      description: `${inconsistentResolution.length} клипов имеют разное разрешение`,
      action: "Приведите все клипы к единому разрешению",
      category: "resolution-consistency",
      impact: "medium",
    })
  }

  // Проверка frame rate
  const inconsistentFrameRate = allClips.filter(
    (clip) =>
      clip.mediaFile?.type === "video" && clip.mediaFile.frameRate && clip.mediaFile.frameRate !== project.frameRate,
  )

  if (inconsistentFrameRate.length > 0) {
    suggestions.push({
      type: "technical",
      priority: "medium",
      title: "Несовпадающие frame rate",
      description: `${inconsistentFrameRate.length} клипов имеют разный frame rate`,
      action: "Конвертируйте клипы в единый frame rate",
      category: "framerate-consistency",
      impact: "medium",
    })
  }

  // Проверка аудио sample rate
  const inconsistentSampleRate = allClips.filter(
    (clip) =>
      clip.mediaFile?.type === "audio" &&
      clip.mediaFile.sampleRate &&
      clip.mediaFile.sampleRate !== project.audioSampleRate,
  )

  if (inconsistentSampleRate.length > 0) {
    suggestions.push({
      type: "technical",
      priority: "low",
      title: "Несовпадающие sample rate",
      description: `${inconsistentSampleRate.length} аудио клипов имеют разный sample rate`,
      action: "Конвертируйте аудио в единый sample rate",
      category: "audio-consistency",
      impact: "low",
    })
  }

  return {
    suggestions,
    criticalIssues,
    warnings,
    score: calculateTechnicalScore(allTracks, allClips, project),
  }
}

// Анализ доступности
async function analyzeAccessibility(project: any, allTracks: any[], allClips: any[], _priority: string): Promise<any> {
  const suggestions: any[] = []
  const criticalIssues: any[] = []
  const warnings: string[] = []

  // Проверка субтитров
  const subtitleTracks = allTracks.filter((track) => track.type === "subtitle")
  const videoTracks = allTracks.filter((track) => track.type === "video")

  if (videoTracks.length > 0 && subtitleTracks.length === 0) {
    suggestions.push({
      type: "accessibility",
      priority: "high",
      title: "Отсутствуют субтитры",
      description: "Проект не содержит субтитров",
      action: "Добавьте субтитры для улучшения доступности",
      category: "subtitles",
      impact: "high",
    })
  }

  // Проверка цветового контраста
  const lowContrastEffects = allClips.filter(
    (clip) =>
      clip.effects &&
      clip.effects.some(
        (effect: any) =>
          effect.type === "color-correction" && effect.parameters?.contrast && effect.parameters.contrast < 0.3,
      ),
  )

  if (lowContrastEffects.length > 0) {
    suggestions.push({
      type: "accessibility",
      priority: "medium",
      title: "Низкий контраст",
      description: `${lowContrastEffects.length} клипов имеют низкий контраст`,
      action: "Увеличьте контраст для лучшей читаемости",
      category: "visual-accessibility",
      impact: "medium",
    })
  }

  return {
    suggestions,
    criticalIssues,
    warnings,
    score: calculateAccessibilityScore(allTracks, allClips, project),
  }
}

// Вспомогательные функции для расчета баллов

function calculatePerformanceScore(allTracks: any[], allClips: any[], project: any): number {
  let score = 100

  if (allTracks.length > 20) score -= 20
  if (allClips.length > 200) score -= 15
  if (project.duration > 3600) score -= 10

  return Math.max(0, score)
}

function calculateQualityScore(allTracks: any[], allClips: any[], _project: any): number {
  let score = 100

  const videoTracks = allTracks.filter((track) => track.type === "video")
  const audioTracks = allTracks.filter((track) => track.type === "audio")

  if (videoTracks.length > 0 && audioTracks.length === 0) score -= 30

  const clipsWithoutTransitions = allClips.filter((clip) => !clip.transitions || clip.transitions.length === 0)
  if (clipsWithoutTransitions.length > allClips.length * 0.8) score -= 20

  return Math.max(0, score)
}

function calculateStorytellingScore(project: any, _allTracks: any[], allClips: any[]): number {
  let score = 100

  if (project.sections.length < 3) score -= 25

  const averageClipDuration = allClips.reduce((sum, clip) => sum + clip.duration, 0) / allClips.length
  if (averageClipDuration < 2 || averageClipDuration > 10) score -= 15

  return Math.max(0, score)
}

function calculateTechnicalScore(_allTracks: any[], allClips: any[], _project: any): number {
  let score = 100

  const missingFiles = allClips.filter((clip) => !clip.mediaFile || clip.mediaFile.status === "missing")
  if (missingFiles.length > 0) score -= 50

  return Math.max(0, score)
}

function calculateAccessibilityScore(allTracks: any[], _allClips: any[], _project: any): number {
  let score = 100

  const subtitleTracks = allTracks.filter((track) => track.type === "subtitle")
  const videoTracks = allTracks.filter((track) => track.type === "video")

  if (videoTracks.length > 0 && subtitleTracks.length === 0) score -= 40

  return Math.max(0, score)
}

// Приоритизация предложений
function prioritizeSuggestions(suggestions: any[], priority: string): any[] {
  const priorityOrder = ["critical", "high", "medium", "low"]

  let filtered = suggestions

  if (priority === "critical-only") {
    filtered = suggestions.filter((s) => s.priority === "critical")
  } else if (priority === "high-priority") {
    filtered = suggestions.filter((s) => s.priority === "critical" || s.priority === "high")
  }

  return filtered.sort((a, b) => {
    const aPriority = priorityOrder.indexOf(a.priority)
    const bPriority = priorityOrder.indexOf(b.priority)
    return aPriority - bPriority
  })
}

// Генерация общих рекомендаций
function generateOverallRecommendations(
  analysisResults: any,
  _project: any,
  allTracks: any[],
  allClips: any[],
): string[] {
  const recommendations: string[] = []

  // Общие рекомендации на основе баллов
  const avgScore =
    Object.values(analysisResults).reduce((sum: number, result: any) => sum + (result.score || 0), 0) /
    Object.keys(analysisResults).length

  if (avgScore < 50) {
    recommendations.push("Проект требует значительной доработки")
  } else if (avgScore < 70) {
    recommendations.push("Проект в целом хорош, но есть возможности для улучшения")
  } else {
    recommendations.push("Проект высокого качества")
  }

  // Специфические рекомендации
  if (allTracks.length > 15) {
    recommendations.push("Рассмотрите оптимизацию структуры треков")
  }

  if (allClips.length > 100) {
    recommendations.push("Большой проект - убедитесь в производительности")
  }

  recommendations.push("Регулярно сохраняйте проект")
  recommendations.push("Создайте резервную копию перед значительными изменениями")

  return recommendations
}

// Создание плана действий
function createActionPlan(suggestions: any[], criticalIssues: any[]): any {
  const plan = {
    immediate: criticalIssues,
    shortTerm: suggestions.filter((s) => s.priority === "high"),
    longTerm: suggestions.filter((s) => s.priority === "medium" || s.priority === "low"),
  }

  return {
    ...plan,
    totalSteps: criticalIssues.length + suggestions.length,
    estimatedTime: estimateImplementationTime(plan),
  }
}

function estimateImplementationTime(plan: any): string {
  const immediateTime = plan.immediate.length * 15 // 15 минут на критическую проблему
  const shortTermTime = plan.shortTerm.length * 10 // 10 минут на высокоприоритетную задачу
  const longTermTime = plan.longTerm.length * 5 // 5 минут на остальные задачи

  const totalMinutes = immediateTime + shortTermTime + longTermTime

  if (totalMinutes < 60) {
    return `${totalMinutes} минут`
  }
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours} час${hours > 1 ? "а" : ""} ${minutes} минут`
}
