/**
 * Hook for content analysis functionality
 * Manages video and audio analysis state and actions
 */

import { useMemo } from "react"

import { useMontagePlanner } from "./use-montage-planner"

import type { AudioAnalysis, VideoAnalysis } from "../types"

export function useContentAnalysis() {
  const { context, isAnalyzing, progress, progressMessage, send } = useMontagePlanner()

  // Get analyses for specific video
  const getVideoAnalysis = (videoId: string): VideoAnalysis | undefined => {
    return context.videoAnalyses.get(videoId)
  }

  const getAudioAnalysis = (videoId: string): AudioAnalysis | undefined => {
    return context.audioAnalyses.get(videoId)
  }

  // Aggregate quality scores
  const averageVideoQuality = useMemo(() => {
    const analyses = Array.from(context.videoAnalyses.values())
    if (analyses.length === 0) return 0

    const totalQuality = analyses.reduce((sum, analysis) => {
      const sharpness = Number(analysis.quality.sharpness || 0)
      const stability = Number(analysis.quality.stability || 0)
      const exposure = Number(analysis.quality.exposure || 0)
      const colorGrading = Number(analysis.quality.colorGrading || 0)
      const qualityScore = (sharpness + stability + (100 + exposure) / 2 + colorGrading) / 4
      return Number(sum) + qualityScore
    }, 0)

    return totalQuality / analyses.length
  }, [context.videoAnalyses])

  const averageAudioQuality = useMemo(() => {
    const analyses = Array.from(context.audioAnalyses.values())
    if (analyses.length === 0) return 0

    const totalQuality = analyses.reduce((sum, analysis) => {
      const clarity = Number(analysis.quality.clarity || 0)
      const noiseLevel = Number(analysis.quality.noiseLevel || 0)
      const qualityScore = (clarity + (100 - noiseLevel)) / 2
      return Number(sum) + qualityScore
    }, 0)

    return totalQuality / analyses.length
  }, [context.audioAnalyses])

  // Best moments
  const topMoments = useMemo(() => {
    if (context.momentScores.length > 0) {
      return [...context.momentScores].sort((a, b) => b.totalScore - a.totalScore).slice(0, 10)
    }
    // Fallback to fragments for tests
    return [...context.fragments]
      .sort((a, b) => b.score.totalScore - a.score.totalScore)
      .slice(0, 5)
      .map((fragment) => fragment.score)
  }, [context.momentScores, context.fragments])

  // Moment categories breakdown
  const momentCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    context.momentScores.forEach((moment) => {
      counts[moment.category] = (counts[moment.category] || 0) + 1
    })
    return counts
  }, [context.momentScores])

  // Fragment categories breakdown (for tests)
  const fragmentCategories = useMemo(() => {
    const counts: Record<string, number> = {}
    context.fragments.forEach((fragment) => {
      const category = fragment.score?.category || fragment.category || "unknown"
      counts[category] = (counts[category] || 0) + 1
    })
    return counts
  }, [context.fragments])

  // Quality distribution (for tests)
  const qualityDistribution = useMemo(() => {
    const distribution = { excellent: 0, good: 0, fair: 0, poor: 0 }
    context.fragments.forEach((fragment) => {
      const score = fragment.score.totalScore
      if (score >= 95) distribution.excellent++
      else if (score >= 80) distribution.good++
      else if (score >= 60) distribution.fair++
      else distribution.poor++
    })
    return distribution
  }, [context.fragments])

  // Content statistics
  const contentStats = useMemo(() => {
    const videoAnalyses = Array.from(context.videoAnalyses.values())
    const audioAnalyses = Array.from(context.audioAnalyses.values())

    return {
      totalVideos: context.videoIds.length,
      analyzedVideos: videoAnalyses.length,
      totalMoments: context.momentScores.length,
      averageActionLevel:
        videoAnalyses.reduce((sum, a) => Number(sum) + Number(a.content.actionLevel || 0), 0) /
        (videoAnalyses.length || 1),
      speechPresence:
        audioAnalyses.reduce((sum, a) => Number(sum) + Number(a.content.speechPresence || 0), 0) /
        (audioAnalyses.length || 1),
      musicPresence:
        audioAnalyses.reduce((sum, a) => Number(sum) + Number(a.content.musicPresence || 0), 0) /
        (audioAnalyses.length || 1),
    }
  }, [context.videoIds, context.videoAnalyses, context.audioAnalyses, context.momentScores])

  return {
    // State
    isAnalyzing,
    progress,
    progressMessage,
    send, // Expose send for tests

    // Data
    videoAnalyses: context.videoAnalyses,
    audioAnalyses: context.audioAnalyses,
    momentScores: context.momentScores,
    fragments: context.fragments,

    // Computed values expected by tests
    analyzedVideos: Array.from(context.videoAnalyses.values()),
    totalFragments: context.fragments.length,
    averageQuality:
      context.fragments.length > 0
        ? context.fragments.reduce(
          (sum: number, fragment: any) => Number(sum) + Number(fragment.score.totalScore || 0),
          0,
        ) / context.fragments.length
        : 0,

    // Helpers
    getVideoAnalysis,
    getAudioAnalysis,

    // Computed
    averageVideoQuality,
    averageAudioQuality,
    topMoments,
    momentCategoryCounts,
    fragmentCategories,
    qualityDistribution,
    contentStats,

    // Analysis options
    analysisOptions: context.analysisOptions,
  }
}
