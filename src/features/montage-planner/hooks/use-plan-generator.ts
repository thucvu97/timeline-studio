/**
 * Hook for plan generation and optimization
 * Manages montage plan creation and editing
 */

import { useCallback, useMemo } from "react"

import { useMontagePlanner } from "./use-montage-planner"

import type { PlannedClip, Sequence } from "../types"

export function usePlanGenerator() {
  const {
    context,
    currentPlan,
    isGenerating,
    isOptimizing,
    generatePlan,
    optimizePlan,
    editFragment,
    reorderFragments,
  } = useMontagePlanner()

  // Get sequence by ID
  const getSequence = useCallback(
    (sequenceId: string): Sequence | undefined => {
      return currentPlan?.sequences.find((seq) => seq.id === sequenceId)
    },
    [currentPlan],
  )

  // Get clip by ID
  const getPlannedClip = useCallback(
    (clipId: string): PlannedClip | undefined => {
      for (const sequence of currentPlan?.sequences || []) {
        const clip = sequence.clips.find((c) => c.fragmentId === clipId)
        if (clip) return clip
      }
      return undefined
    },
    [currentPlan],
  )

  // Plan statistics
  const planStats = useMemo(() => {
    if (!currentPlan) return null

    const sequences = currentPlan.sequences
    const totalClips = sequences.reduce((sum, seq) => Number(sum) + Number(seq.clips?.length || 0), 0)
    const averageSequenceDuration =
      sequences.reduce((sum, seq) => Number(sum) + Number(seq.duration || 0), 0) / (sequences.length || 1)

    const energyProfile = sequences.map((seq) => ({
      sequenceId: seq.id,
      type: seq.type,
      energy: seq.energyLevel,
    }))

    return {
      sequenceCount: sequences.length,
      totalClips,
      averageSequenceDuration,
      totalDuration: currentPlan.totalDuration,
      energyProfile,
      qualityScore: currentPlan.qualityScore,
      engagementScore: currentPlan.engagementScore,
      coherenceScore: currentPlan.coherenceScore,
    }
  }, [currentPlan])

  // Sequence breakdown
  const sequenceBreakdown = useMemo(() => {
    if (!currentPlan) return []

    return currentPlan.sequences.map((sequence) => ({
      id: sequence.id,
      type: sequence.type,
      duration: sequence.duration,
      clipCount: sequence.clips.length,
      energyLevel: sequence.energyLevel,
      purpose: sequence.purpose,
      transitionCount: sequence.transitions.length,
    }))
  }, [currentPlan])

  // Fragment usage analysis
  const fragmentUsage = useMemo(() => {
    const usage = new Map<string, number>()

    if (currentPlan) {
      currentPlan.sequences.forEach((sequence) => {
        sequence.clips.forEach((clip) => {
          usage.set(clip.fragmentId, (usage.get(clip.fragmentId) || 0) + 1)
        })
      })
    }

    return {
      totalFragments: context.fragments.length,
      usedFragments: usage.size,
      unusedFragments: context.fragments.filter((f) => !usage.has(f.id)),
      multiUseFragments: Array.from(usage.entries()).filter(([_, count]) => count > 1),
    }
  }, [currentPlan, context.fragments])

  // Transition usage
  const transitionUsage = useMemo(() => {
    const usage = new Map<string, number>()

    if (currentPlan) {
      currentPlan.sequences.forEach((sequence) => {
        sequence.transitions.forEach((transition) => {
          usage.set(transition.transitionId, (usage.get(transition.transitionId) || 0) + 1)
        })
      })
    }

    return Array.from(usage.entries())
      .map(([transitionId, count]) => ({ transitionId, count }))
      .sort((a, b) => b.count - a.count)
  }, [currentPlan])

  // Emotional arc analysis
  const emotionalArc = useMemo(() => {
    if (!currentPlan) return []

    return currentPlan.sequences.map((sequence) => ({
      sequenceId: sequence.id,
      startEnergy: sequence.emotionalArc.startEnergy,
      peakEnergy: sequence.emotionalArc.peakEnergy,
      endEnergy: sequence.emotionalArc.endEnergy,
      peakPosition: sequence.emotionalArc.peakPosition,
    }))
  }, [currentPlan])

  // Suggestions for improvement
  const improvementSuggestions = useMemo(() => {
    const suggestions: string[] = []

    if (planStats) {
      // Quality suggestions
      if (planStats.qualityScore < 70) {
        suggestions.push("Consider replacing low-quality fragments with better alternatives")
      }

      // Engagement suggestions
      if (planStats.engagementScore < 60) {
        suggestions.push("Add more dynamic transitions or high-action moments")
      }

      // Duration suggestions
      if (context.targetDuration) {
        const durationDiff = Math.abs(planStats.totalDuration - context.targetDuration)
        if (durationDiff > 10) {
          suggestions.push(
            planStats.totalDuration > context.targetDuration
              ? "Plan is too long - consider trimming some clips"
              : "Plan is too short - add more content or extend key moments",
          )
        }
      }

      // Fragment usage
      if (fragmentUsage.unusedFragments.length > fragmentUsage.usedFragments * 0.5) {
        suggestions.push("Many fragments are unused - consider incorporating more variety")
      }
    }

    return suggestions
  }, [planStats, context.targetDuration, fragmentUsage])

  return {
    // State
    currentPlan,
    isGenerating,
    isOptimizing,
    planHistory: context.planHistory,

    // Actions
    generatePlan,
    optimizePlan,
    editFragment,
    reorderFragments,

    // Helpers
    getSequence,
    getPlannedClip,

    // Computed
    planStats,
    sequenceBreakdown,
    fragmentUsage,
    transitionUsage,
    emotionalArc,
    improvementSuggestions,

    // Generation options
    generationOptions: context.generationOptions,
    selectedStyle: context.selectedStyle,
    targetDuration: context.targetDuration,
    instructions: context.instructions,
  }
}
