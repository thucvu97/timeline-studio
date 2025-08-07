/**
 * Timeline Effects Provider
 * Управление эффектами, фильтрами и переходами
 */

import type { ReactNode } from "react"
import { createContext, useCallback, useContext, useMemo } from "react"

import { useTimelineProject } from "./timeline-project-provider"
import type { TimelineEffectsContextType } from "./types"

const TimelineEffectsContext = createContext<TimelineEffectsContextType | null>(null)

interface TimelineEffectsProviderProps {
  children: ReactNode
}

export function TimelineEffectsProvider({ children }: TimelineEffectsProviderProps) {
  const { backend } = useTimelineProject()

  // Effects operations
  const applyEffect = useCallback(
    async (clipId: string, effectId: string, params = {}) => {
      await backend.executeCommand({
        type: "PlayerApplyEffect",
        params: {
          clip_id: clipId,
          effect_id: effectId,
          params,
        },
      })
    },
    [backend],
  )

  const removeEffect = useCallback(
    async (clipId: string, effectId: string) => {
      await backend.executeCommand({
        type: "PlayerRemoveEffect",
        params: {
          clip_id: clipId,
          effect_id: effectId,
        },
      })
    },
    [backend],
  )

  const applyFilter = useCallback(
    async (clipId: string, filterId: string, params = {}) => {
      await backend.executeCommand({
        type: "PlayerApplyFilter",
        params: {
          clip_id: clipId,
          filter_id: filterId,
          params,
        },
      })
    },
    [backend],
  )

  const removeFilter = useCallback(
    async (clipId: string, filterId: string) => {
      await backend.executeCommand({
        type: "PlayerRemoveFilter",
        params: {
          clip_id: clipId,
          filter_id: filterId,
        },
      })
    },
    [backend],
  )

  const applyTransition = useCallback(
    async (clipId: string, transitionId: string, params = {}) => {
      // Переходы применяются между клипами
      await backend.executeCommand({
        type: "ApplyTransition",
        params: {
          clip_id: clipId,
          transition_id: transitionId,
          params,
        },
      })
    },
    [backend],
  )

  const removeTransition = useCallback(
    async (clipId: string, transitionId: string) => {
      await backend.executeCommand({
        type: "RemoveTransition",
        params: {
          clip_id: clipId,
          transition_id: transitionId,
        },
      })
    },
    [backend],
  )

  const contextValue: TimelineEffectsContextType = useMemo(
    () => ({
      applyEffect,
      removeEffect,
      applyFilter,
      removeFilter,
      applyTransition,
      removeTransition,
    }),
    [applyEffect, removeEffect, applyFilter, removeFilter, applyTransition, removeTransition],
  )

  return <TimelineEffectsContext.Provider value={contextValue}>{children}</TimelineEffectsContext.Provider>
}

export function useTimelineEffects() {
  const context = useContext(TimelineEffectsContext)
  if (!context) {
    throw new Error("useTimelineEffects must be used within a TimelineEffectsProvider")
  }
  return context
}
