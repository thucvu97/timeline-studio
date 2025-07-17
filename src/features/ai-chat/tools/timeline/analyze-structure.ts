/**
 * AI инструмент для анализа структуры Timeline
 */

import type { TimelineClip, TimelineSection, TimelineTrack } from "@/features/timeline/types"

import { getTimelineStateAccess } from "./types"
import {
  calculateTimelineDensity,
  detectStructureIssues,
  generateStructureRecommendations,
  getTrackTypeDistribution,
} from "./utils/analyzers"

import type { TimelineToolResult } from "./types"
import type { ClaudeTool } from "../../services/claude-service"

export const analyzeTimelineStructureTool: ClaudeTool = {
  name: "analyze_timeline_structure",
  description: "Анализирует структуру текущего таймлайна и предоставляет детальную информацию",
  input_schema: {
    type: "object",
    properties: {
      includeClips: {
        type: "boolean",
        description: "Включить информацию о клипах",
        default: true,
      },
      includeTracks: {
        type: "boolean",
        description: "Включить информацию о треках",
        default: true,
      },
      includeSections: {
        type: "boolean",
        description: "Включить информацию о секциях",
        default: true,
      },
      includeResources: {
        type: "boolean",
        description: "Включить информацию об используемых ресурсах",
        default: false,
      },
      analysisDepth: {
        type: "string",
        enum: ["basic", "detailed", "comprehensive"],
        description: "Глубина анализа",
        default: "basic",
      },
    },
  },
}

export async function analyzeTimelineStructure(params: any): Promise<TimelineToolResult> {
  const {
    includeClips = true,
    includeTracks = true,
    includeSections = true,
    includeResources = false,
    analysisDepth = "basic",
  } = params

  try {
    const timelineStateAccess = getTimelineStateAccess()

    if (!timelineStateAccess) {
      return {
        success: false,
        message: "Timeline state access not configured",
        errors: ["Timeline state access not available"],
      }
    }

    const currentProject = timelineStateAccess.getCurrentProject()

    if (!currentProject) {
      return {
        success: false,
        message: "Нет активного проекта Timeline для анализа",
        warnings: ["Создайте проект Timeline перед анализом"],
      }
    }

    const projectStats = timelineStateAccess.getProjectStats()

    const analysis: any = {
      projectInfo: {
        id: currentProject.id,
        name: currentProject.name,
        duration: currentProject.duration,
        fps: currentProject.fps,
        resolution: currentProject.settings.resolution,
        tracks: projectStats.totalTracks,
        sections: projectStats.totalSections,
        clips: projectStats.totalClips,
      },
    }

    if (includeTracks) {
      analysis.tracks = currentProject.globalTracks.map((track: TimelineTrack) => ({
        id: track.id,
        name: track.name,
        type: track.type,
        clipsCount: track.clips.length,
        isHidden: track.isHidden,
        isMuted: track.isMuted,
        isLocked: track.isLocked,
        height: track.height,
        order: track.order,
      }))
      // Добавляем треки из секций
      currentProject.sections.forEach((section) => {
        section.tracks.forEach((track) => {
          analysis.tracks.push({
            id: track.id,
            name: track.name,
            type: track.type,
            sectionId: section.id,
            clipsCount: track.clips.length,
            isHidden: track.isHidden,
            isMuted: track.isMuted,
            isLocked: track.isLocked,
          })
        })
      })
    }

    if (includeSections) {
      analysis.sections = currentProject.sections.map((section: TimelineSection) => ({
        id: section.id,
        name: section.name,
        index: section.index,
        duration: section.duration,
        startTime: section.startTime,
        endTime: section.endTime,
        tracksCount: section.tracks.length,
        isCollapsed: section.isCollapsed,
        color: section.color,
        tags: section.tags,
      }))
    }

    if (includeClips) {
      const allClips: TimelineClip[] = []
      // Собираем клипы со всех треков
      currentProject.globalTracks.forEach((track) => allClips.push(...track.clips))
      currentProject.sections.forEach((section) => {
        section.tracks.forEach((track) => allClips.push(...track.clips))
      })

      analysis.clips = allClips.map((clip: TimelineClip) => ({
        id: clip.id,
        name: clip.name,
        trackId: clip.trackId,
        mediaId: clip.mediaId,
        startTime: clip.startTime,
        duration: clip.duration,
        volume: clip.volume,
        speed: clip.speed,
        hasEffects: clip.effects.length > 0,
        hasFilters: clip.filters.length > 0,
        hasTransitions: clip.transitions.length > 0,
        isSelected: clip.isSelected,
        isLocked: clip.isLocked,
      }))
    }

    if (analysisDepth === "detailed" || analysisDepth === "comprehensive") {
      const allClips: TimelineClip[] = []
      currentProject.globalTracks.forEach((track) => allClips.push(...track.clips))
      currentProject.sections.forEach((section) => {
        section.tracks.forEach((track) => allClips.push(...track.clips))
      })

      // Собираем все треки для статистики
      const allTracksForStats: TimelineTrack[] = [...currentProject.globalTracks]
      currentProject.sections.forEach((section) => allTracksForStats.push(...section.tracks))

      analysis.statistics = {
        averageClipDuration:
          allClips.length > 0 ? allClips.reduce((sum, clip) => sum + clip.duration, 0) / allClips.length : 0,
        trackTypeDistribution: getTrackTypeDistribution(allTracksForStats),
        timelineDensity: calculateTimelineDensity(currentProject),
        usedResources: {
          effects: currentProject.resources.effects.length,
          filters: currentProject.resources.filters.length,
          transitions: currentProject.resources.transitions.length,
          templates: currentProject.resources.templates.length,
          media: currentProject.resources.media.length,
        },
      }
    }

    if (analysisDepth === "comprehensive") {
      analysis.recommendations = generateStructureRecommendations(currentProject)
      analysis.issues = detectStructureIssues(currentProject)
    }

    return {
      success: true,
      message: `Анализ структуры проекта "${currentProject.name}" завершен`,
      data: {
        analysis,
      },
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка анализа структуры Timeline: ${String(error)}`,
      errors: [String(error)],
    }
  }
}
