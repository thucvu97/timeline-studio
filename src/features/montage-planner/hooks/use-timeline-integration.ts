/**
 * Hook для интеграции Montage Planner с Timeline
 */

import { useCallback, useState } from "react"

import { MediaFile } from "@/features/media/types/media"
import { useTimeline } from "@/features/timeline/hooks/use-timeline"
import { useTimelineActions } from "@/features/timeline/hooks/use-timeline-actions"

import {
  TimelineIntegrationOptions,
  applyPlanToTimeline as applyPlanToTimelineService,
  createMarkersFromPlan,
} from "../services/timeline-integration-service"

import type { MontagePlan, PlannedClip, Sequence } from "../types"

export interface UseTimelineIntegrationReturn {
  // Основные действия
  applyPlanToTimeline: (
    plan: MontagePlan,
    mediaFiles: MediaFile[],
    options?: TimelineIntegrationOptions,
  ) => Promise<void>

  createMarkersFromPlan: (plan: MontagePlan, timeOffset?: number) => void

  // Состояние
  isApplying: boolean
  error: string | null

  // Утилиты
  canApplyPlan: (plan: MontagePlan) => boolean
  getRequiredMediaFiles: (plan: MontagePlan) => string[]
}

export function useTimelineIntegration(): UseTimelineIntegrationReturn {
  const { project } = useTimeline()
  // TODO: Timeline integration methods need to be implemented
  const updateProject = async (_project: any) => {
    console.warn("Timeline update not yet implemented")
  }
  const addMarkers = (_markers: any[]) => {
    console.warn("Markers addition not yet implemented")
  }
  const { addMediaToTimeline } = useTimelineActions()

  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Применить монтажный план к Timeline
   */
  const applyPlanToTimeline = useCallback(
    async (plan: MontagePlan, mediaFiles: MediaFile[], options: TimelineIntegrationOptions = {}) => {
      if (!project) {
        setError("No timeline project loaded")
        return
      }

      setIsApplying(true)
      setError(null)

      try {
        // Проверяем наличие всех необходимых медиафайлов
        const requiredFiles = getRequiredMediaFiles(plan)
        const availableFiles = new Set(mediaFiles.map((f) => f.path))

        const missingFiles = requiredFiles.filter((path) => !availableFiles.has(path))
        if (missingFiles.length > 0) {
          throw new Error(`Missing media files: ${missingFiles.join(", ")}`)
        }

        // Применяем план к Timeline
        const updatedProject = applyPlanToTimelineService(plan, project, mediaFiles, options)

        // Обновляем проект
        await updateProject(updatedProject)

        // Добавляем маркеры если нужно
        if (options.createNewSection) {
          const markers = createMarkersFromPlan(plan, options.timeOffset || 0)
          addMarkers(markers)
        }

        console.log(`Successfully applied montage plan: ${plan.name}`)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to apply montage plan"
        setError(errorMessage)
        console.error("Failed to apply montage plan:", err)
      } finally {
        setIsApplying(false)
      }
    },
    [project],
  )

  /**
   * Создать маркеры из монтажного плана
   */
  const createMarkers = useCallback(
    (plan: MontagePlan, timeOffset = 0) => {
      if (!project) {
        setError("No timeline project loaded")
        return
      }

      try {
        const markers = createMarkersFromPlan(plan, timeOffset)
        addMarkers(markers)
        console.log(`Added ${markers.length} markers from montage plan`)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to create markers"
        setError(errorMessage)
        console.error("Failed to create markers:", err)
      }
    },
    [project],
  )

  /**
   * Проверить возможность применения плана
   */
  const canApplyPlan = useCallback(
    (plan: MontagePlan): boolean => {
      if (!project) return false
      if (!plan.sequences || plan.sequences.length === 0) return false
      if (plan.totalDuration <= 0) return false

      return true
    },
    [project],
  )

  /**
   * Получить список необходимых медиафайлов
   */
  const getRequiredMediaFiles = useCallback((plan: MontagePlan): string[] => {
    const files = new Set<string>()

    // Extract files from all sequences and clips
    plan.sequences.forEach((sequence: Sequence) => {
      sequence.clips.forEach((clip: PlannedClip) => {
        if (clip.fragment?.sourceFile?.path) {
          files.add(clip.fragment.sourceFile.path)
        }
      })
    })

    return Array.from(files)
  }, [])

  return {
    applyPlanToTimeline,
    createMarkersFromPlan: createMarkers,
    isApplying,
    error,
    canApplyPlan,
    getRequiredMediaFiles,
  }
}
