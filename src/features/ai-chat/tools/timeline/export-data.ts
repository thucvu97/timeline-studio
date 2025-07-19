/**
 * AI инструмент для экспорта данных Timeline
 */

import type { TimelineToolResult } from "./types"
import type { ClaudeTool } from "../../services/claude-service"

export const exportTimelineDataTool: ClaudeTool = {
  name: "export_timeline_data",
  description: "Экспортирует данные таймлайна в различных форматах",
  input_schema: {
    type: "object",
    properties: {
      exportFormat: {
        type: "string",
        enum: ["json", "xml", "csv", "edl", "fcpxml", "davinci-resolve"],
        description: "Формат экспорта данных",
      },
      includeData: {
        type: "object",
        properties: {
          projectSettings: { type: "boolean" },
          sections: { type: "boolean" },
          tracks: { type: "boolean" },
          clips: { type: "boolean" },
          effects: { type: "boolean" },
          transitions: { type: "boolean" },
          metadata: { type: "boolean" },
        },
      },
      exportScope: {
        type: "string",
        enum: ["full-project", "selected-elements", "time-range"],
        description: "Область экспорта",
      },
    },
    required: ["exportFormat"],
  },
}

export async function exportTimelineData(params: any): Promise<TimelineToolResult> {
  const {
    exportFormat = "json",
    includeData = {
      projectSettings: true,
      sections: true,
      tracks: true,
      clips: true,
      effects: true,
      transitions: true,
      metadata: true,
    },
    exportScope = "full-project",
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
        message: "Нет активного проекта для экспорта",
        errors: ["Откройте или создайте проект в timeline"],
      }
    }

    // Подготавливаем данные для экспорта
    const exportData = await prepareExportData(currentProject, includeData, exportScope)

    // Форматируем данные в соответствии с выбранным форматом
    const formattedData = await formatExportData(exportData, exportFormat)

    // Генерируем имя файла
    const fileName = generateExportFileName(currentProject.name || "timeline", exportFormat)

    // Получаем статистику экспорта
    const exportStats = calculateExportStats(exportData, exportFormat)

    // Генерируем рекомендации
    const recommendations = generateExportRecommendations(exportFormat, exportStats, includeData)

    return {
      success: true,
      message: `Экспорт данных завершен в формате ${exportFormat.toUpperCase()}`,
      data: {
        exportData: formattedData,
        exportSettings: {
          format: exportFormat,
          scope: exportScope,
          includeData,
          fileName,
        },
        statistics: exportStats,
        fileInfo: {
          name: fileName,
          format: exportFormat,
          size: calculateDataSize(formattedData),
          timestamp: new Date().toISOString(),
        },
      },
      nextActions: [
        "Сохранить экспортированные данные",
        "Проверить содержимое экспорта",
        "Импортировать в другую систему",
        "Создать резервную копию проекта",
      ],
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка экспорта данных: ${error instanceof Error ? error.message : String(error)}`,
      errors: [error instanceof Error ? error.message : String(error)],
    }
  }
}

// Подготавливает данные для экспорта
async function prepareExportData(project: any, includeData: any, exportScope: string): Promise<any> {
  const exportData: any = {
    version: "1.0.0",
    exportTimestamp: new Date().toISOString(),
    exportScope,
  }

  // Настройки проекта
  if (includeData.projectSettings) {
    exportData.projectSettings = {
      name: project.name,
      id: project.id,
      duration: project.duration,
      frameRate: project.frameRate,
      resolution: project.resolution,
      audioSampleRate: project.audioSampleRate,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }
  }

  // Получаем все треки
  const allTracks = [...project.globalTracks]
  project.sections.forEach((section: any) => allTracks.push(...section.tracks))

  // Секции
  if (includeData.sections) {
    exportData.sections = project.sections.map((section: any) => ({
      id: section.id,
      name: section.name,
      startTime: section.startTime,
      duration: section.duration,
      color: section.color,
      description: section.description,
      trackIds: section.tracks.map((track: any) => track.id),
    }))
  }

  // Треки
  if (includeData.tracks) {
    exportData.tracks = allTracks.map((track: any) => ({
      id: track.id,
      name: track.name,
      type: track.type,
      sectionId: track.sectionId,
      height: track.height,
      volume: track.volume,
      muted: track.muted,
      locked: track.locked,
      clipIds: track.clips.map((clip: any) => clip.id),
    }))
  }

  // Клипы
  if (includeData.clips) {
    const allClips: any[] = []
    allTracks.forEach((track) => allClips.push(...track.clips))

    exportData.clips = allClips.map((clip: any) => ({
      id: clip.id,
      name: clip.name,
      trackId: clip.trackId,
      startTime: clip.startTime,
      duration: clip.duration,
      mediaFile: clip.mediaFile,
      volume: clip.volume,
      speed: clip.speed,
      opacity: clip.opacity,
      effectIds: clip.effects?.map((effect: any) => effect.id) || [],
      transitionIds: clip.transitions?.map((transition: any) => transition.id) || [],
    }))
  }

  // Эффекты
  if (includeData.effects) {
    const allEffects: any[] = []
    allTracks.forEach((track) => {
      track.clips.forEach((clip: any) => {
        if (clip.effects) {
          allEffects.push(...clip.effects)
        }
      })
    })

    exportData.effects = allEffects.map((effect: any) => ({
      id: effect.id,
      type: effect.type,
      name: effect.name,
      parameters: effect.parameters,
      enabled: effect.enabled,
      startTime: effect.startTime,
      duration: effect.duration,
    }))
  }

  // Переходы
  if (includeData.transitions) {
    const allTransitions: any[] = []
    allTracks.forEach((track) => {
      track.clips.forEach((clip: any) => {
        if (clip.transitions) {
          allTransitions.push(...clip.transitions)
        }
      })
    })

    exportData.transitions = allTransitions.map((transition: any) => ({
      id: transition.id,
      type: transition.type,
      name: transition.name,
      duration: transition.duration,
      startTime: transition.startTime,
      endTime: transition.endTime,
      parameters: transition.parameters,
    }))
  }

  // Метаданные
  if (includeData.metadata) {
    exportData.metadata = {
      totalTracks: allTracks.length,
      totalClips: allTracks.reduce((sum: number, track: any) => sum + track.clips.length, 0),
      totalSections: project.sections.length,
      videoTracks: allTracks.filter((track: any) => track.type === "video").length,
      audioTracks: allTracks.filter((track: any) => track.type === "audio").length,
      projectDuration: project.duration,
      exportedBy: "Timeline Studio AI",
    }
  }

  return exportData
}

// Форматирует данные в соответствии с выбранным форматом
async function formatExportData(exportData: any, format: string): Promise<any> {
  switch (format) {
    case "json":
      return JSON.stringify(exportData, null, 2)

    case "xml":
      return convertToXML(exportData)

    case "csv":
      return convertToCSV(exportData)

    case "edl":
      return convertToEDL(exportData)

    case "fcpxml":
      return convertToFCPXML(exportData)

    case "davinci-resolve":
      return convertToDaVinciResolve(exportData)

    default:
      return JSON.stringify(exportData, null, 2)
  }
}

// Конвертирует данные в XML формат
function convertToXML(data: any): string {
  const xmlHeader = '<?xml version="1.0" encoding="UTF-8"?>\n'
  const xmlContent = objectToXML(data, "timeline")
  return xmlHeader + xmlContent
}

// Конвертирует данные в CSV формат
function convertToCSV(data: any): string {
  const csvLines: string[] = []

  // Заголовки CSV
  csvLines.push("Type,ID,Name,StartTime,Duration,TrackType,SectionId")

  // Клипы
  if (data.clips) {
    data.clips.forEach((clip: any) => {
      csvLines.push(["Clip", clip.id, clip.name || "", clip.startTime, clip.duration, "", ""].join(","))
    })
  }

  // Треки
  if (data.tracks) {
    data.tracks.forEach((track: any) => {
      csvLines.push(["Track", track.id, track.name || "", "", "", track.type, track.sectionId || ""].join(","))
    })
  }

  return csvLines.join("\n")
}

// Конвертирует данные в EDL формат
function convertToEDL(data: any): string {
  const edlLines: string[] = []
  edlLines.push("TITLE: Timeline Studio Export")
  edlLines.push("FCM: NON-DROP FRAME")
  edlLines.push("")

  if (data.clips) {
    data.clips.forEach((clip: any, index: number) => {
      const editNumber = String(index + 1).padStart(3, "0")
      const timecode = formatTimecode(clip.startTime)
      const duration = formatTimecode(clip.duration)

      edlLines.push(`${editNumber}  ${clip.name || "CLIP"} V     C        ${timecode} ${duration}`)
    })
  }

  return edlLines.join("\n")
}

// Конвертирует данные в FCPXML формат
function convertToFCPXML(data: any): string {
  const fcpxmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.8">
  <resources>
    <!-- Resources would go here -->
  </resources>
  <library>
    <event name="Timeline Studio Export">
      <project name="${data.projectSettings?.name || "Exported Project"}">
        <sequence format="r1" tcStart="0s">
          <spine>
            ${
  data.clips
    ?.map(
      (clip: any) => `
            <video offset="${clip.startTime}s" duration="${clip.duration}s" name="${clip.name || "Clip"}">
              <adjust-conform type="fit"/>
            </video>`,
    )
    .join("") || ""
}
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`

  return fcpxmlContent
}

// Конвертирует данные в DaVinci Resolve формат
function convertToDaVinciResolve(data: any): string {
  const resolveData = {
    version: "1.0",
    timelineData: {
      name: data.projectSettings?.name || "Exported Timeline",
      frameRate: data.projectSettings?.frameRate || 24,
      resolution: data.projectSettings?.resolution || { width: 1920, height: 1080 },
      tracks: data.tracks || [],
      clips: data.clips || [],
    },
    metadata: data.metadata || {},
  }

  return JSON.stringify(resolveData, null, 2)
}

// Вспомогательные функции

function objectToXML(obj: any, rootName: string): string {
  const xmlLines: string[] = []
  xmlLines.push(`<${rootName}>`)

  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      xmlLines.push(`  <${key}>`)
      value.forEach((item: any) => {
        xmlLines.push("    <item>")
        if (typeof item === "object") {
          for (const [itemKey, itemValue] of Object.entries(item)) {
            let safeValue = ""
            if (itemValue !== null && itemValue !== undefined) {
              if (typeof itemValue === "object") {
                safeValue = JSON.stringify(itemValue)
              } else {
                // eslint-disable-next-line @typescript-eslint/no-base-to-string
                safeValue = String(itemValue)
              }
            }
            xmlLines.push(`      <${itemKey}>${safeValue}</${itemKey}>`)
          }
        } else {
          xmlLines.push(`      ${item}`)
        }
        xmlLines.push("    </item>")
      })
      xmlLines.push(`  </${key}>`)
    } else if (typeof value === "object") {
      xmlLines.push(`  <${key}>`)
      for (const [subKey, subValue] of Object.entries(value)) {
        let safeSubValue = ""
        if (subValue !== null && subValue !== undefined) {
          if (typeof subValue === "object") {
            safeSubValue = JSON.stringify(subValue)
          } else {
            // eslint-disable-next-line @typescript-eslint/no-base-to-string
            safeSubValue = String(subValue)
          }
        }
        xmlLines.push(`    <${subKey}>${safeSubValue}</${subKey}>`)
      }
      xmlLines.push(`  </${key}>`)
    } else {
      let safeValue = ""
      if (value !== null && value !== undefined) {
        if (typeof value === "object") {
          safeValue = JSON.stringify(value)
        } else {
          // eslint-disable-next-line @typescript-eslint/no-base-to-string
          safeValue = String(value)
        }
      }
      xmlLines.push(`  <${key}>${safeValue}</${key}>`)
    }
  }

  xmlLines.push(`</${rootName}>`)
  return xmlLines.join("\n")
}

function formatTimecode(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  const frames = Math.floor((seconds % 1) * 24) // Assuming 24fps

  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`
}

function generateExportFileName(projectName: string, format: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").split("T")[0]
  const extension = getFileExtension(format)
  const sanitizedName = projectName.replace(/[^a-zA-Z0-9_-]/g, "_")

  return `${sanitizedName}_export_${timestamp}.${extension}`
}

function getFileExtension(format: string): string {
  switch (format) {
    case "json":
      return "json"
    case "xml":
      return "xml"
    case "csv":
      return "csv"
    case "edl":
      return "edl"
    case "fcpxml":
      return "fcpxml"
    case "davinci-resolve":
      return "resolve"
    default:
      return "txt"
  }
}

function calculateExportStats(exportData: any, format: string): any {
  return {
    totalElements: Object.keys(exportData).length,
    includedSections: exportData.sections?.length || 0,
    includedTracks: exportData.tracks?.length || 0,
    includedClips: exportData.clips?.length || 0,
    includedEffects: exportData.effects?.length || 0,
    includedTransitions: exportData.transitions?.length || 0,
    format,
    compressionRatio: calculateCompressionRatio(exportData, format),
  }
}

function calculateCompressionRatio(data: any, _format: string): number {
  const jsonSize = JSON.stringify(data).length
  const formattedSize = calculateDataSize(data)
  return formattedSize / jsonSize
}

function calculateDataSize(data: any): number {
  if (typeof data === "string") {
    return new Blob([data]).size
  }
  return new Blob([JSON.stringify(data)]).size
}

function generateExportRecommendations(format: string, stats: any, includeData: any): string[] {
  const recommendations: string[] = []

  // Рекомендации по форматам
  switch (format) {
    case "json":
      recommendations.push("JSON формат подходит для резервного копирования и импорта в Timeline Studio")
      break
    case "xml":
      recommendations.push("XML формат обеспечивает структурированный обмен данными")
      break
    case "csv":
      recommendations.push("CSV формат подходит для анализа данных в электронных таблицах")
      break
    case "edl":
      recommendations.push("EDL формат совместим с большинством профессиональных видеоредакторов")
      break
    case "fcpxml":
      recommendations.push("FCPXML формат предназначен для Final Cut Pro X")
      break
    case "davinci-resolve":
      recommendations.push("Формат DaVinci Resolve для импорта в DaVinci Resolve")
      break
    default:
      recommendations.push("Выбранный формат подходит для экспорта данных")
      break
  }

  // Рекомендации по содержимому
  if (stats.includedClips > 100) {
    recommendations.push("Большое количество клипов - рассмотрите разделение на несколько файлов")
  }

  if (stats.includedEffects > 50) {
    recommendations.push("Много эффектов - проверьте совместимость с целевой системой")
  }

  if (!includeData.metadata) {
    recommendations.push("Включите метаданные для лучшей совместимости")
  }

  recommendations.push("Сохраните экспортированные данные в безопасном месте")
  recommendations.push("Проверьте целостность данных перед использованием")

  return recommendations
}
