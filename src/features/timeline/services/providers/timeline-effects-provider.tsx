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
    async (_clipId: string, effectId: string, params = {}) => {
      await backend.executeCommand({
        type: "PlayerApplyEffect",
        params: {
          effect_id: effectId,
          params,
        },
      })
    },
    [backend],
  )

  const removeEffect = useCallback(
    async (_clipId: string, _effectId: string) => {
      await backend.executeCommand({
        type: "PlayerClearEffects",
      })
    },
    [backend],
  )

  const applyFilter = useCallback(
    async (_clipId: string, filterId: string, params = {}) => {
      await backend.executeCommand({
        type: "PlayerApplyFilter",
        params: {
          filter_id: filterId,
          params,
        },
      })
    },
    [backend],
  )

  const removeFilter = useCallback(
    async (_clipId: string, _filterId: string) => {
      await backend.executeCommand({
        type: "PlayerClearFilters",
      })
    },
    [backend],
  )

  const applyTransition = useCallback(async (clipId: string, transitionId: string, params = {}) => {
    // Transitions are more complex and may require specific positioning
    console.log("Apply transition not yet implemented:", { clipId, transitionId, params })
  }, [])

  const removeTransition = useCallback(async (clipId: string, transitionId: string) => {
    console.log("Remove transition not yet implemented:", { clipId, transitionId })
  }, [])

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
