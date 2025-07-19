/**
 * AI инструменты для анализа контента и предложения источников
 */

import { formatFileSize, getBrowserFiles, getBrowserStats, hasBrowserAccess } from "./utils/helpers"

import type { AnalyzeMissingContentParams, BrowserToolResult, ExportFileListParams, SuggestImportParams } from "./types"
import type { ClaudeTool } from "../../services/claude-service"


export const analyzeMissingContentTool: ClaudeTool = {
  name: "analyze_missing_content",
  description: "Анализирует отсутствующий контент и предлагает что добавить для улучшения проекта",
  input_schema: {
    type: "object",
    properties: {
      analysisScope: {
        type: "string",
        enum: ["project", "resources", "timeline", "all"],
        description: "Область анализа отсутствующего контента",
      },
      includeRecent: {
        type: "boolean",
        description: "Учитывать недавно добавленные файлы",
        default: true,
      },
      checkExternal: {
        type: "boolean",
        description: "Проверить внешние источники",
        default: false,
      },
    },
    required: ["analysisScope"],
  },
}

export const suggestImportSourcesTool: ClaudeTool = {
  name: "suggest_import_sources",
  description: "Предлагает источники для импорта недостающего контента",
  input_schema: {
    type: "object",
    properties: {
      contentType: {
        type: "string",
        enum: ["video", "audio", "image", "effect", "filter", "transition", "template", "music"],
        description: "Тип контента для поиска источников",
      },
      style: {
        type: "string",
        description: "Стиль или жанр контента",
      },
      mood: {
        type: "string",
        description: "Настроение контента",
      },
      projectType: {
        type: "string",
        description: "Тип проекта для контекстных рекомендаций",
      },
      includeAI: {
        type: "boolean",
        description: "Включить AI-генерированный контент",
        default: true,
      },
      includeFree: {
        type: "boolean",
        description: "Включить бесплатные источники",
        default: true,
      },
      includePremium: {
        type: "boolean",
        description: "Включить премиум источники",
        default: false,
      },
    },
    required: ["contentType"],
  },
}

export const exportFileListTool: ClaudeTool = {
  name: "export_file_list",
  description: "Экспортирует список файлов из браузера в различных форматах",
  input_schema: {
    type: "object",
    properties: {
      format: {
        type: "string",
        enum: ["json", "csv", "text", "xml"],
        description: "Формат экспорта",
      },
      includeMetadata: {
        type: "boolean",
        description: "Включить метаданные файлов",
        default: true,
      },
      filterCriteria: {
        type: "object",
        properties: {
          selectedOnly: {
            type: "boolean",
            description: "Только выбранные файлы",
            default: false,
          },
          tab: {
            type: "string",
            description: "Конкретная вкладка для экспорта",
          },
          fileTypes: {
            type: "array",
            items: { type: "string" },
            description: "Типы файлов для включения",
          },
          dateRange: {
            type: "object",
            properties: {
              start: { type: "string" },
              end: { type: "string" },
            },
            description: "Диапазон дат для фильтрации",
          },
        },
        description: "Критерии фильтрации для экспорта",
      },
    },
    required: ["format"],
  },
}

export async function analyzeMissingContent(params: AnalyzeMissingContentParams): Promise<BrowserToolResult> {
  const { analysisScope, includeRecent = true, checkExternal = false } = params

  if (!hasBrowserAccess()) {
    return {
      success: false,
      message: "Browser state access не настроен",
      errors: ["Доступ к браузеру не сконфигурирован"],
    }
  }

  try {
    const allFiles = getBrowserFiles()
    const stats = getBrowserStats()

    // Анализируем что есть
    const contentAnalysis = {
      media: {
        video: allFiles.filter((f) => f.type?.includes("video")).length,
        audio: allFiles.filter((f) => f.type?.includes("audio")).length,
        image: allFiles.filter((f) => f.type?.includes("image")).length,
      },
      production: {
        effects: stats.filesByType.effect || 0,
        filters: stats.filesByType.filter || 0,
        transitions: stats.filesByType.transition || 0,
        templates: stats.filesByType.template || 0,
      },
      music: stats.filesByType.music || 0,
    }

    // Определяем что отсутствует
    const missingContent: string[] = []
    const recommendations: string[] = []

    // Анализ медиа контента
    if (contentAnalysis.media.video === 0) {
      missingContent.push("video")
      recommendations.push("Добавьте видеофайлы для создания основного контента")
    }

    if (contentAnalysis.media.audio === 0) {
      missingContent.push("audio")
      recommendations.push("Добавьте аудиофайлы или музыку для звукового оформления")
    }

    if (contentAnalysis.media.image === 0) {
      missingContent.push("images")
      recommendations.push("Добавьте изображения для заставок, логотипов или фонов")
    }

    // Анализ производственного контента
    if (contentAnalysis.production.effects === 0) {
      missingContent.push("effects")
      recommendations.push("Добавьте визуальные эффекты для улучшения качества видео")
    }

    if (contentAnalysis.production.filters === 0) {
      missingContent.push("filters")
      recommendations.push("Добавьте фильтры для цветокоррекции и стилизации")
    }

    if (contentAnalysis.production.transitions === 0) {
      missingContent.push("transitions")
      recommendations.push("Добавьте переходы для плавной смены сцен")
    }

    if (contentAnalysis.production.templates === 0) {
      missingContent.push("templates")
      recommendations.push("Добавьте шаблоны для титров и анимации")
    }

    if (contentAnalysis.music === 0) {
      missingContent.push("music")
      recommendations.push("Добавьте фоновую музыку для атмосферы")
    }

    // Дополнительный анализ для разных областей
    let additionalAnalysis: any = {}

    switch (analysisScope) {
      case "project":
        additionalAnalysis = {
          scope: "project",
          projectReadiness: missingContent.length === 0 ? "готов" : "требует дополнений",
          criticalMissing: missingContent.filter((item) => ["video", "audio"].includes(item)),
          optionalMissing: missingContent.filter((item) => !["video", "audio"].includes(item)),
        }
        break

      case "resources":
        additionalAnalysis = {
          scope: "resources",
          resourceCompleteness: Math.round(((8 - missingContent.length) / 8) * 100),
          resourceGaps: missingContent,
        }
        break

      case "timeline":
        additionalAnalysis = {
          scope: "timeline",
          timelineReadiness: contentAnalysis.media.video > 0 && contentAnalysis.media.audio > 0,
          minimumRequirements: {
            video: contentAnalysis.media.video > 0,
            audio: contentAnalysis.media.audio > 0,
          },
        }
        break

      case "all":
        additionalAnalysis = {
          scope: "all",
          overallCompleteness: Math.round(((8 - missingContent.length) / 8) * 100),
          categorizedMissing: {
            critical: missingContent.filter((item) => ["video", "audio"].includes(item)),
            important: missingContent.filter((item) => ["music", "transitions"].includes(item)),
            optional: missingContent.filter((item) => ["effects", "filters", "templates", "images"].includes(item)),
          },
        }
        break

      default:
        additionalAnalysis = {
          scope: analysisScope,
          overallCompleteness: Math.round(((8 - missingContent.length) / 8) * 100),
          missingContent,
        }
        break
    }

    // Генерируем предложения на основе анализа
    const suggestions: string[] = [...recommendations]

    if (missingContent.length === 0) {
      suggestions.push("Все основные типы контента присутствуют")
      suggestions.push("Рассмотрите добавление дополнительных файлов для разнообразия")
    } else {
      if (missingContent.includes("video") && missingContent.includes("audio")) {
        suggestions.push("КРИТИЧНО: Отсутствуют основные медиафайлы")
        suggestions.push("Начните с импорта видео и аудио контента")
      }

      suggestions.push(`Отсутствует: ${missingContent.join(", ")}`)

      if (checkExternal) {
        suggestions.push("Рассмотрите использование внешних источников контента")
        suggestions.push("Проверьте библиотеки стоковых материалов")
      }
    }

    // Следующие действия
    const nextActions: string[] = []
    if (missingContent.length > 0) {
      nextActions.push("Импортировать недостающий контент")
      nextActions.push("Найти источники для недостающих типов файлов")
      if (missingContent.includes("video") || missingContent.includes("audio")) {
        nextActions.push("Приоритетно добавить основные медиафайлы")
      }
    } else {
      nextActions.push("Проверить качество существующего контента")
      nextActions.push("Добавить дополнительные варианты для разнообразия")
    }

    return {
      success: true,
      message: `Анализ отсутствующего контента завершен: найдено ${missingContent.length} пропусков`,
      data: {
        analysis: {
          ...additionalAnalysis,
          contentAnalysis,
          missingContent,
          totalFiles: allFiles.length,
          completenessScore: Math.round(((8 - missingContent.length) / 8) * 100),
        },
        suggestions,
      },
      nextActions,
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка анализа отсутствующего контента: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

export async function suggestImportSources(params: SuggestImportParams): Promise<BrowserToolResult> {
  const { contentType, style, mood, projectType, includeAI = true, includeFree = true, includePremium = false } = params

  try {
    // Базы данных источников (в реальном приложении это будет внешний API)
    const sourceMap: Record<
      string,
      Array<{ name: string; url: string; type: "free" | "premium" | "ai"; description: string; features: string[] }>
    > = {
      video: [
        {
          name: "Pixabay",
          url: "https://pixabay.com/videos/",
          type: "free",
          description: "Бесплатные видео высокого качества",
          features: ["HD качество", "Без авторских прав", "Большой выбор"],
        },
        {
          name: "Pexels Videos",
          url: "https://www.pexels.com/videos/",
          type: "free",
          description: "Профессиональные видео",
          features: ["4K качество", "Простая лицензия", "Еженедельные обновления"],
        },
        {
          name: "Shutterstock",
          url: "https://www.shutterstock.com/video/",
          type: "premium",
          description: "Премиум стоковые видео",
          features: ["Эксклюзивный контент", "4K/8K качество", "Расширенная лицензия"],
        },
        {
          name: "Runway ML",
          url: "https://runwayml.com/",
          type: "ai",
          description: "AI генерация видео",
          features: ["Text-to-video", "Персонализация", "Уникальный контент"],
        },
      ],
      audio: [
        {
          name: "Freesound",
          url: "https://freesound.org/",
          type: "free",
          description: "Звуковые эффекты и семплы",
          features: ["Creative Commons", "Высокое качество", "Большое сообщество"],
        },
        {
          name: "YouTube Audio Library",
          url: "https://studio.youtube.com/",
          type: "free",
          description: "Музыка для видео",
          features: ["Без авторских прав", "Разные жанры", "Простое использование"],
        },
        {
          name: "AudioJungle",
          url: "https://audiojungle.net/",
          type: "premium",
          description: "Профессиональная музыка",
          features: ["Высокое качество", "Эксклюзивные треки", "Различные лицензии"],
        },
        {
          name: "AIVA",
          url: "https://www.aiva.ai/",
          type: "ai",
          description: "AI композитор",
          features: ["Персонализированная музыка", "Различные стили", "Быстрая генерация"],
        },
      ],
      music: [
        {
          name: "Incompetech",
          url: "https://incompetech.com/",
          type: "free",
          description: "Музыка Kevin MacLeod",
          features: ["Разные жанры", "Creative Commons", "Высокое качество"],
        },
        {
          name: "Epidemic Sound",
          url: "https://www.epidemicsound.com/",
          type: "premium",
          description: "Музыкальная библиотека",
          features: ["Подписка", "Без роялти", "Новые треки каждый день"],
        },
        {
          name: "Mubert",
          url: "https://mubert.com/",
          type: "ai",
          description: "AI музыка в реальном времени",
          features: ["Бесконечная музыка", "Настройка под настроение", "Адаптивное качество"],
        },
      ],
      image: [
        {
          name: "Unsplash",
          url: "https://unsplash.com/",
          type: "free",
          description: "Профессиональные фотографии",
          features: ["Высокое разрешение", "Простая лицензия", "Отличное качество"],
        },
        {
          name: "Pexels",
          url: "https://www.pexels.com/",
          type: "free",
          description: "Бесплатные стоковые фото",
          features: ["Без авторских прав", "Удобный поиск", "Мобильное приложение"],
        },
        {
          name: "Getty Images",
          url: "https://www.gettyimages.com/",
          type: "premium",
          description: "Премиум изображения",
          features: ["Эксклюзивный контент", "Редакционные фото", "Расширенные права"],
        },
        {
          name: "DALL-E 3",
          url: "https://openai.com/dall-e-3",
          type: "ai",
          description: "AI генерация изображений",
          features: ["Text-to-image", "Высокое качество", "Творческий контроль"],
        },
      ],
      effect: [
        {
          name: "Motion Array",
          url: "https://motionarray.com/",
          type: "premium",
          description: "Видео эффекты",
          features: ["After Effects", "Premiere Pro", "DaVinci Resolve"],
        },
        {
          name: "Videvo",
          url: "https://www.videvo.net/",
          type: "free",
          description: "Бесплатные эффекты",
          features: ["Motion graphics", "VFX элементы", "Простая лицензия"],
        },
      ],
      filter: [
        {
          name: "RocketStock",
          url: "https://www.rocketstock.com/",
          type: "premium",
          description: "Цветовые LUT",
          features: ["Профессиональные LUT", "Различные стили", "Готовые пресеты"],
        },
        {
          name: "Free LUTs",
          url: "https://freeluts.com/",
          type: "free",
          description: "Бесплатные LUT файлы",
          features: ["Разные стили", "Простое применение", "Регулярные обновления"],
        },
      ],
      transition: [
        {
          name: "Motion Array",
          url: "https://motionarray.com/transitions/",
          type: "premium",
          description: "Переходы для монтажа",
          features: ["Smooth transitions", "Различные стили", "Простое использование"],
        },
        {
          name: "Mixkit",
          url: "https://mixkit.co/",
          type: "free",
          description: "Бесплатные переходы",
          features: ["Готовые к использованию", "Высокое качество", "Различные категории"],
        },
      ],
      template: [
        {
          name: "Envato Elements",
          url: "https://elements.envato.com/",
          type: "premium",
          description: "Шаблоны для видео",
          features: ["After Effects", "Premiere Pro", "Неограниченные загрузки"],
        },
        {
          name: "Mixkit",
          url: "https://mixkit.co/free-video-templates/",
          type: "free",
          description: "Бесплатные шаблоны",
          features: ["Готовые проекты", "Простая настройка", "Различные форматы"],
        },
      ],
    }

    const sources = sourceMap[contentType] || []

    // Фильтруем источники по типу
    const filteredSources = sources.filter((source) => {
      if (!includeFree && source.type === "free") return false
      if (!includePremium && source.type === "premium") return false
      if (!includeAI && source.type === "ai") return false
      return true
    })

    // Добавляем контекстные рекомендации
    const contextualRecommendations: string[] = []

    if (style) {
      contextualRecommendations.push(`Ищите контент в стиле "${style}"`)
    }

    if (mood) {
      contextualRecommendations.push(`Подберите контент с настроением "${mood}"`)
    }

    if (projectType) {
      const projectSpecificSources: Record<string, string[]> = {
        wedding: ["Романтические треки", "Элегантные переходы", "Теплые фильтры"],
        corporate: ["Профессиональная музыка", "Минималистичные эффекты", "Деловые шаблоны"],
        travel: ["Приключенческая музыка", "Динамические переходы", "Яркие фильтры"],
        social: ["Трендовая музыка", "Современные эффекты", "Яркие стили"],
      }

      const projectSuggestions = projectSpecificSources[projectType]
      if (projectSuggestions) {
        contextualRecommendations.push(`Для ${projectType} проекта рекомендуем: ${projectSuggestions.join(", ")}`)
      }
    }

    // Анализ рекомендаций
    const analysis = {
      contentType,
      requestedFeatures: { style, mood, projectType },
      sourceTypes: {
        free: filteredSources.filter((s) => s.type === "free").length,
        premium: filteredSources.filter((s) => s.type === "premium").length,
        ai: filteredSources.filter((s) => s.type === "ai").length,
      },
      totalSources: filteredSources.length,
      contextualRecommendations,
    }

    // Генерируем предложения
    const suggestions: string[] = []

    if (filteredSources.length === 0) {
      suggestions.push(`Источники для ${contentType} не найдены с текущими фильтрами`)
      suggestions.push("Попробуйте включить дополнительные типы источников")
    } else {
      suggestions.push(`Найдено ${filteredSources.length} источников для ${contentType}`)

      if (includeFree && filteredSources.some((s) => s.type === "free")) {
        suggestions.push("Начните с бесплатных источников для экономии бюджета")
      }

      if (includeAI && filteredSources.some((s) => s.type === "ai")) {
        suggestions.push("AI источники позволят создать уникальный контент")
      }

      if (includePremium && filteredSources.some((s) => s.type === "premium")) {
        suggestions.push("Премиум источники обеспечат профессиональное качество")
      }

      // Специфичные предложения по типу контента
      if (contentType === "music" || contentType === "audio") {
        suggestions.push("Убедитесь в совместимости лицензии с вашим проектом")
        suggestions.push("Проверьте качество аудио (минимум 44.1kHz/16bit)")
      }

      if (contentType === "video") {
        suggestions.push("Выбирайте видео в разрешении вашего проекта")
        suggestions.push("Обратите внимание на частоту кадров")
      }
    }

    // Следующие действия
    const nextActions: string[] = []
    if (filteredSources.length > 0) {
      nextActions.push("Посетить рекомендованные источники")
      nextActions.push("Скачать пробные образцы")
      nextActions.push("Сравнить качество и лицензии")
    } else {
      nextActions.push("Расширить критерии поиска")
      nextActions.push("Включить дополнительные типы источников")
    }

    return {
      success: true,
      message: `Найдено ${filteredSources.length} источников для ${contentType}`,
      data: {
        sources: filteredSources,
        analysis,
        suggestions,
      },
      nextActions,
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка поиска источников: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

export async function exportFileList(params: ExportFileListParams): Promise<BrowserToolResult> {
  const { format, includeMetadata = true, filterCriteria = {} } = params

  if (!hasBrowserAccess()) {
    return {
      success: false,
      message: "Browser state access не настроен",
      errors: ["Доступ к браузеру не сконфигурирован"],
    }
  }

  try {
    let files = getBrowserFiles(filterCriteria.tab)

    // Применяем фильтры
    if (filterCriteria.selectedOnly) {
      // В реальной реализации получаем только выбранные файлы
      // files = getSelectedFiles()
    }

    if (filterCriteria.fileTypes?.length) {
      files = files.filter((file) => filterCriteria.fileTypes!.some((type) => file.type?.includes(type)))
    }

    if (filterCriteria.dateRange) {
      const startDate = new Date(filterCriteria.dateRange.start)
      const endDate = new Date(filterCriteria.dateRange.end)
      files = files.filter((file) => {
        const fileDate = file.modifiedAt || file.createdAt
        if (!fileDate) return true
        return fileDate >= startDate && fileDate <= endDate
      })
    }

    // Подготавливаем данные для экспорта
    const exportData = files.map((file) => {
      const baseData: any = {
        id: file.id,
        name: file.name,
        type: file.type,
        size: file.size,
        path: file.path,
      }

      if (includeMetadata) {
        baseData.duration = file.duration
        baseData.createdAt = file.createdAt
        baseData.modifiedAt = file.modifiedAt
        baseData.tags = file.tags
        baseData.location = file.location
        baseData.metadata = file.metadata
      }

      return baseData
    })

    // Форматируем данные
    let exportContent = ""
    let mimeType = "text/plain"
    let fileExtension = "txt"

    switch (format) {
      case "json":
        exportContent = JSON.stringify(
          {
            timestamp: new Date().toISOString(),
            totalFiles: exportData.length,
            filterCriteria,
            files: exportData,
          },
          null,
          2,
        )
        mimeType = "application/json"
        fileExtension = "json"
        break

      case "csv":
        const headers = ["ID", "Name", "Type", "Size", "Path"]
        if (includeMetadata) {
          headers.push("Duration", "Created", "Modified", "Tags", "Location")
        }

        const rows = exportData.map((file) => {
          const row = [file.id, file.name, file.type, file.size || "", file.path]
          if (includeMetadata) {
            row.push(
              file.duration || "",
              file.createdAt || "",
              file.modifiedAt || "",
              (file.tags || []).join(";"),
              file.location || "",
            )
          }
          return row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
        })

        exportContent = [headers.join(","), ...rows].join("\n")
        mimeType = "text/csv"
        fileExtension = "csv"
        break

      case "xml":
        exportContent = `<?xml version="1.0" encoding="UTF-8"?>
<files timestamp="${new Date().toISOString()}" total="${exportData.length}">
${exportData
    .map(
      (file) => `  <file>
    <id>${file.id}</id>
    <name>${file.name}</name>
    <type>${file.type}</type>
    <size>${file.size || 0}</size>
    <path>${file.path}</path>
    ${
  includeMetadata
    ? `<duration>${file.duration || 0}</duration>
    <tags>${(file.tags || []).join(",")}</tags>
    <location>${file.location || ""}</location>`
    : ""
}
  </file>`,
    )
    .join("\n")}
</files>`
        mimeType = "application/xml"
        fileExtension = "xml"
        break

      default:
        exportContent = `Timeline Studio Browser Export
========================================
Export Date: ${new Date().toISOString()}
Total Files: ${exportData.length}
Filter Criteria: ${JSON.stringify(filterCriteria)}

Files:
${exportData.map((file) => `- ${file.name} (${file.type}) - ${formatFileSize(file.size || 0)}`).join("\n")}
`
        break
    }

    // Статистика экспорта
    const stats = {
      totalFiles: exportData.length,
      totalSize: exportData.reduce((sum, file) => sum + (file.size || 0), 0),
      fileTypes: exportData.reduce((acc: Record<string, number>, file) => {
        const type = file.type || "unknown"
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {}),
      exportSize: exportContent.length,
    }

    return {
      success: true,
      message: `Список файлов экспортирован в формате ${format}: ${exportData.length} файлов`,
      data: {
        analysis: {
          format,
          includeMetadata,
          filterCriteria,
          exportPath: `/exports/browser_files_${Date.now()}.${fileExtension}`,
          statistics: stats,
          formattedTotalSize: formatFileSize(stats.totalSize),
          mimeType,
        },
        suggestions: [
          "Сохраните экспорт для создания резервной копии",
          "Используйте экспорт для переноса списков между проектами",
        ],
      },
      nextActions: ["Сохранить экспортированный файл", "Поделиться списком файлов"],
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка экспорта списка файлов: ${String(error)}`,
      errors: [String(error)],
    }
  }
}
