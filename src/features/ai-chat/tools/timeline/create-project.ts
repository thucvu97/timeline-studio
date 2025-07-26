/**
 * AI инструмент для создания нового проекта Timeline
 */

import type { TimelineProject } from "@/features/timeline/types/timeline"

import { getTimelineStateAccess } from "./types"
import { createDefaultTrackStructure } from "./utils/creators"
import { generateProjectId } from "./utils/generators"

import type { TimelineToolResult } from "./types"
import type { ClaudeTool } from "../../services/claude-service"

export const createTimelineProjectTool: ClaudeTool = {
  name: "create_timeline_project",
  description: "Создает новый проект Timeline с заданными настройками и структурой",
  input_schema: {
    type: "object",
    properties: {
      projectSettings: {
        type: "object",
        properties: {
          name: { type: "string", description: "Название проекта" },
          description: { type: "string", description: "Описание проекта" },
          resolution: {
            type: "object",
            properties: {
              width: { type: "number" },
              height: { type: "number" },
            },
            required: ["width", "height"],
          },
          fps: { type: "number", description: "Частота кадров" },
          aspectRatio: { type: "string", description: "Соотношение сторон" },
          duration: {
            type: "number",
            description: "Предполагаемая длительность в секундах",
          },
          sampleRate: {
            type: "number",
            description: "Частота дискретизации аудио",
          },
        },
        required: ["name", "resolution", "fps"],
      },
      autoCreateStructure: {
        type: "boolean",
        description: "Автоматически создать базовую структуру треков",
        default: true,
      },
      templateType: {
        type: "string",
        enum: ["empty", "basic", "advanced", "custom"],
        description: "Тип шаблона для создания проекта",
      },
    },
    required: ["projectSettings"],
  },
}

export async function createTimelineProject(params: any): Promise<TimelineToolResult> {
  const { projectSettings, autoCreateStructure = true, templateType = "basic" } = params

  try {
    const timelineStateAccess = getTimelineStateAccess()

    if (!timelineStateAccess) {
      return {
        success: false,
        message: "Timeline state access not configured",
        errors: ["Timeline state access not available"],
      }
    }

    // Создаем новый проект
    const projectId = generateProjectId()
    const project: TimelineProject = {
      id: projectId,
      name: projectSettings.name,
      description: projectSettings.description,
      duration: projectSettings.duration || 0,
      fps: projectSettings.fps,
      sampleRate: projectSettings.sampleRate || 48000,
      sections: [],
      globalTracks: [],
      markers: [],
      resources: {
        effects: [],
        filters: [],
        transitions: [],
        templates: [],
        styleTemplates: [],
        subtitleStyles: [],
        music: [],
        media: [],
      },
      settings: {
        resolution: projectSettings.resolution,
        fps: projectSettings.fps,
        aspectRatio: projectSettings.aspectRatio || "16:9",
        sampleRate: projectSettings.sampleRate || 48000,
        channels: 2,
        bitDepth: 24,
        timeFormat: "timecode",
        snapToGrid: true,
        gridSize: 1,
        autoSave: true,
        autoSaveInterval: 300,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      version: "1.0.0",
    }

    // Автоматически создаем базовую структуру треков
    if (autoCreateStructure) {
      project.globalTracks = createDefaultTrackStructure(templateType)
    }

    // Сохраняем проект
    await timelineStateAccess.createProject(project)

    return {
      success: true,
      message: `Проект "${project.name}" создан успешно`,
      data: {
        projectId: project.id,
        createdElements: project.globalTracks.map((t) => t.id),
      },
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка создания проекта Timeline: ${String(error)}`,
      errors: [String(error)],
    }
  }
}
