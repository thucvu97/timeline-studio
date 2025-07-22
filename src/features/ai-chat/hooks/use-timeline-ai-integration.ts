import { useCallback, useEffect } from "react"

import { TimelineStateAccess } from "@/features/ai-chat/tools/timeline/types"
import { setTimelineStateAccess } from "@/features/ai-chat/tools/timeline/utils/helpers"
import { useTimeline } from "@/features/timeline/hooks"
import { TimelineClip, TimelineProject, TimelineSection, TimelineTrack } from "@/features/timeline/types"

/**
 * Хук для интеграции Timeline с AI функциональностью
 * Предоставляет доступ к состоянию timeline для AI инструментов
 */
export function useTimelineAIIntegration() {
  const timeline = useTimeline()

  // Функция для получения всех клипов
  const getAllClips = useCallback((): TimelineClip[] => {
    if (!timeline.project) return []

    const clips: TimelineClip[] = []
    timeline.project.tracks.forEach((track) => {
      clips.push(...track.clips)
    })
    return clips
  }, [timeline.project])

  // Функция для получения всех треков
  const getAllTracks = useCallback((): TimelineTrack[] => {
    if (!timeline.project) return []
    return timeline.project.tracks
  }, [timeline.project])

  // Функция для получения всех секций
  const getAllSections = useCallback((): TimelineSection[] => {
    if (!timeline.project) return []
    return timeline.project.sections || []
  }, [timeline.project])

  // Функция для расчета общей длительности проекта
  const getProjectDuration = useCallback((): number => {
    if (!timeline.project) return 0

    let maxEndTime = 0
    timeline.project.tracks.forEach((track) => {
      track.clips.forEach((clip) => {
        const clipEndTime = clip.startTime + clip.duration
        if (clipEndTime > maxEndTime) {
          maxEndTime = clipEndTime
        }
      })
    })

    return maxEndTime
  }, [timeline.project])

  // Функция для получения выбранных клипов
  const getSelectedClips = useCallback((): TimelineClip[] => {
    if (!timeline.project || !timeline.uiState) return []

    const selectedClipIds = timeline.uiState.selectedClipIds || []
    const allClips = getAllClips()

    return allClips.filter((clip) => selectedClipIds.includes(clip.id))
  }, [timeline.project, timeline.uiState, getAllClips])

  // Функция для получения клипов на определенном времени
  const getClipsAtTime = useCallback(
    (time: number): TimelineClip[] => {
      const allClips = getAllClips()
      return allClips.filter((clip) => time >= clip.startTime && time < clip.startTime + clip.duration)
    },
    [getAllClips],
  )

  // Эффект для установки доступа к состоянию timeline
  useEffect(() => {
    const timelineAccess: TimelineStateAccess = {
      getCurrentProject: () => timeline.project,
      createProject: async (project: TimelineProject) => {
        await timeline.createProject(project.name, project.settings)
      },
      updateProject: async (_updates: Partial<TimelineProject>) => {
        // TODO: Implement project update
        console.warn("updateProject not implemented yet")
      },
      createSection: async (section: Omit<TimelineSection, "id">) => {
        const id = `section_${Date.now()}`
        await timeline.addSection(section.name, section.startTime, section.duration)
        return { ...section, id } as TimelineSection
      },
      createTrack: async (track: Omit<TimelineTrack, "id">) => {
        const id = `track_${Date.now()}`
        await timeline.addTrack(track.type, undefined, track.name)
        return { ...track, id, clips: [] } as TimelineTrack
      },
      addClip: async (clip: Omit<TimelineClip, "id">) => {
        const id = `clip_${Date.now()}`
        // TODO: Need mediaFile parameter in addClip
        console.warn("addClip needs proper implementation")
        return { ...clip, id } as TimelineClip
      },
      getProjectStats: () => {
        const clips = getAllClips()
        const tracks = getAllTracks()
        const sections = getAllSections()

        return {
          totalDuration: getProjectDuration(),
          totalClips: clips.length,
          totalTracks: tracks.length,
          totalSections: sections.length,
        }
      },
      sendTimelineCommand: async (command: string, params?: any) => {
        // Map commands to timeline actions
        switch (command) {
          case "play":
            await timeline.play()
            break
          case "pause":
            await timeline.pause()
            break
          case "seek":
            if (params?.time !== undefined) {
              await timeline.seek(params.time)
            }
            break
          case "selectClips":
            if (params?.clipIds) {
              timeline.selectClips(params.clipIds)
            }
            break
          default:
            console.warn(`Unknown timeline command: ${command}`)
        }
      },
    }

    // Устанавливаем доступ для AI инструментов
    setTimelineStateAccess(timelineAccess)

    // Очищаем при размонтировании
    return () => {
      setTimelineStateAccess(null)
    }
  }, [timeline, getAllClips, getAllTracks, getAllSections, getProjectDuration, getSelectedClips, getClipsAtTime])

  return {
    isReady: timeline.isReady && timeline.project !== null,
    hasProject: timeline.project !== null,
    clipsCount: getAllClips().length,
    tracksCount: getAllTracks().length,
    projectDuration: getProjectDuration(),
  }
}
