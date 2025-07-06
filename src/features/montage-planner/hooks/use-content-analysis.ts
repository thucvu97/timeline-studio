/**
 * Hook for content analysis functionality
 * Manages video and audio analysis state and actions
 */

import { useMemo } from "react"

import { useMontagePlanner } from "./use-montage-planner"

import type { AudioAnalysis, MomentScore, VideoAnalysis } from "../types"

export function useContentAnalysis() {
  const { context, isAnalyzing, progress, progressMessage } = useMontagePlanner()

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
    return [...context.momentScores]
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 10)
  }, [context.momentScores])

  // Moment categories breakdown
  const momentCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    context.momentScores.forEach(moment => {
      counts[moment.category] = (counts[moment.category] || 0) + 1
    })
    return counts
  }, [context.momentScores])

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
    
    // Data
    videoAnalyses: context.videoAnalyses,
    audioAnalyses: context.audioAnalyses,
    momentScores: context.momentScores,
    fragments: context.fragments,
    
    // Helpers
    getVideoAnalysis,
    getAudioAnalysis,
    
    // Computed
    averageVideoQuality,
    averageAudioQuality,
    topMoments,
    momentCategoryCounts,
    contentStats,
    
    // Analysis options
    analysisOptions: context.analysisOptions,
  }
}