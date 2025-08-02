/**
 * AI инструмент для создания секций на Timeline
 */

import type { TimelineClip, TimelineSection } from "@/features/timeline/types/timeline"
import type { ClaudeTool } from "../../services/claude-service"
import type { TimelineToolResult } from "./types"
import { calculateSectionsCoverage } from "./utils/calculators"
import {
  createManualSections,
  createSectionsByContentType,
  createSectionsByDate,
  createSectionsByDuration,
  createSectionsByLocation,
  createSmartSections,
} from "./utils/creators"
import { getCurrentTimelineProject, saveTimelineProject } from "./utils/helpers"

export const createSectionsByStrategyTool: ClaudeTool = {
  name: "create_sections_by_strategy",
  description: "Создает секции на таймлайне по заданной стратегии",
  input_schema: {
    type: "object",
    properties: {
      strategy: {
        type: "string",
        enum: ["by-date", "by-duration", "by-content-type", "by-location", "manual", "smart"],
        description: "Стратегия создания секций",
      },
      sectionSettings: {
        type: "object",
        properties: {
          sectionDuration: {
            type: "number",
            description: "Длительность секции для стратегии by-duration",
          },
          defaultColor: {
            type: "string",
            description: "Цвет секций по умолчанию",
          },
          sections: {
            type: "array",
            description: "Массив секций для manual стратегии",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                startTime: { type: "number" },
                endTime: { type: "number" },
                duration: { type: "number" },
                color: { type: "string" },
                tags: {
                  type: "array",
                  items: { type: "string" },
                },
              },
            },
          },
        },
      },
      targetClips: {
        type: "array",
        items: { type: "string" },
        description: "ID клипов для обработки (опционально)",
      },
    },
    required: ["strategy"],
  },
}

export async function createSectionsByStrategy(params: any): Promise<TimelineToolResult> {
  const { strategy, sectionSettings = {}, targetClips = [] } = params

  try {
    const currentProject = await getCurrentTimelineProject()

    if (!currentProject) {
      return {
        success: false,
        message: "Нет активного проекта для создания секций",
        warnings: ["Создайте проект Timeline перед созданием секций"],
      }
    }

    let sections: TimelineSection[] = []

    // Собираем все клипы из проекта
    const allClips: TimelineClip[] = []
    currentProject.globalTracks.forEach((track) => allClips.push(...track.clips))
    currentProject.sections.forEach((section) => {
      section.tracks.forEach((track) => allClips.push(...track.clips))
    })

    // Фильтруем клипы если указаны конкретные
    const clipsToProcess = targetClips.length > 0 ? allClips.filter((clip) => targetClips.includes(clip.id)) : allClips

    switch (strategy) {
      case "by-date":
        sections = createSectionsByDate(clipsToProcess, sectionSettings)
        break
      case "by-duration":
        sections = createSectionsByDuration(clipsToProcess, sectionSettings)
        break
      case "by-content-type":
        sections = createSectionsByContentType(clipsToProcess, sectionSettings)
        break
      case "by-location":
        sections = createSectionsByLocation(clipsToProcess, sectionSettings)
        break
      case "manual":
        sections = createManualSections(sectionSettings)
        break
      case "smart":
        sections = createSmartSections(clipsToProcess, sectionSettings)
        break
      default:
        sections = createSmartSections(clipsToProcess, sectionSettings)
        break
    }

    // Добавляем секции в проект
    currentProject.sections.push(...sections)
    await saveTimelineProject(currentProject)

    return {
      success: true,
      message: `Создано ${sections.length} секций по стратегии "${strategy}"`,
      data: {
        createdElements: sections.map((s) => s.id),
        analysis: {
          strategy,
          sectionsCount: sections.length,
          totalCoverage: calculateSectionsCoverage(sections),
        },
      },
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка создания секций: ${String(error)}`,
      errors: [String(error)],
    }
  }
}
