/**
 * Hook для управления эффектами на клипах timeline
 */

import { useCallback } from "react"
import type { AppliedEffect } from "../types"
import { useTimeline } from "./use-timeline"

export function useTimelineEffects() {
  const { send } = useTimeline()

  const applyEffect = useCallback(
    (clipId: string, effect: AppliedEffect) => {
      send({
        type: "ADD_EFFECT_TO_CLIP",
        clipId,
        effect,
      })
    },
    [send],
  )

  const removeEffect = useCallback(
    (clipId: string, effectId: string) => {
      send({
        type: "REMOVE_EFFECT_FROM_CLIP",
        clipId,
        effectId,
      })
    },
    [send],
  )

  const updateEffect = useCallback(
    (clipId: string, effectId: string, updates: Partial<AppliedEffect>) => {
      send({
        type: "UPDATE_CLIP_EFFECT",
        clipId,
        effectId,
        updates,
      })
    },
    [send],
  )

  const reorderEffects = useCallback(
    (clipId: string, fromIndex: number, toIndex: number) => {
      send({
        type: "REORDER_CLIP_EFFECTS",
        clipId,
        fromIndex,
        toIndex,
      })
    },
    [send],
  )

  return {
    applyEffect,
    removeEffect,
    updateEffect,
    reorderEffects,
  }
}
