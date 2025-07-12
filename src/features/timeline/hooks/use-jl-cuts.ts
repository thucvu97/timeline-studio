import { useCallback } from "react"

import { useTimeline } from "./use-timeline"
import { getAudioOffsetForCut } from "../types/jl-cuts"

import type { CutType, JLCutPreview, LinkedClipPair } from "../types/jl-cuts"
import type { TimelineClip } from "../types/timeline"


export interface UseJLCutsReturn {
  // Создание J/L cuts
  createJCut: (clipId: string, offset: number) => void
  createLCut: (clipId: string, offset: number) => void
  resetCut: (clipId: string) => void

  // Link/Unlink операции
  linkClips: (videoClipId: string, audioClipId: string) => void
  unlinkClips: (clipId: string) => void

  // Запросы
  getLinkedClip: (clipId: string) => TimelineClip | null
  getLinkedPair: (clipId: string) => LinkedClipPair | null
  getCutPreview: (clipId: string, cutType: CutType, offset: number) => JLCutPreview | null

  // Утилиты
  isVideoClip: (clip: TimelineClip) => boolean
  isAudioClip: (clip: TimelineClip) => boolean
  hasJLCut: (clipId: string) => boolean
}

export function useJLCuts(): UseJLCutsReturn {
  const { project, send } = useTimeline()

  // Проверка типа клипа
  const isVideoClip = useCallback(
    (clip: TimelineClip): boolean => {
      if (!project) return false

      const track = [...project.globalTracks, ...project.sections.flatMap((s) => s.tracks)].find(
        (t) => t.id === clip.trackId,
      )

      return track?.type === "video" || track?.type === "image"
    },
    [project],
  )

  const isAudioClip = useCallback(
    (clip: TimelineClip): boolean => {
      if (!project) return false

      const track = [...project.globalTracks, ...project.sections.flatMap((s) => s.tracks)].find(
        (t) => t.id === clip.trackId,
      )

      return ["audio", "music", "voiceover", "sfx", "ambient"].includes(track?.type || "")
    },
    [project],
  )

  // Получение связанного клипа
  const getLinkedClip = useCallback(
    (clipId: string): TimelineClip | null => {
      if (!project) return null

      const allClips = [...project.globalTracks, ...project.sections.flatMap((s) => s.tracks)].flatMap(
        (track) => track.clips,
      )

      const clip = allClips.find((c) => c.id === clipId)
      if (!clip?.linkedClipId) return null

      return allClips.find((c) => c.id === clip.linkedClipId) || null
    },
    [project],
  )

  // Получение связанной пары
  const getLinkedPair = useCallback(
    (clipId: string): LinkedClipPair | null => {
      if (!project) return null

      const clip = [...project.globalTracks, ...project.sections.flatMap((s) => s.tracks)]
        .flatMap((track) => track.clips)
        .find((c) => c.id === clipId)

      if (!clip) return null

      const linkedClip = getLinkedClip(clipId)
      if (!linkedClip) return null

      const videoClip = isVideoClip(clip) ? clip : linkedClip
      const audioClip = isAudioClip(clip) ? clip : linkedClip

      if (!isVideoClip(videoClip) || !isAudioClip(audioClip)) return null

      return {
        videoClipId: videoClip.id,
        audioClipId: audioClip.id,
        isLinked: clip.isLinked || false,
        audioOffset: audioClip.audioOffset || 0,
      }
    },
    [project, getLinkedClip, isVideoClip, isAudioClip],
  )

  // Создание J-Cut
  const createJCut = useCallback(
    (clipId: string, offset: number) => {
      const pair = getLinkedPair(clipId)
      if (!pair) return

      // Отправляем событие в машину состояний
      send({
        type: "CREATE_JL_CUT",
        clipId: pair.audioClipId,
        cutType: "j-cut",
        offset: Math.abs(offset),
      })
    },
    [getLinkedPair, send],
  )

  // Создание L-Cut
  const createLCut = useCallback(
    (clipId: string, offset: number) => {
      const pair = getLinkedPair(clipId)
      if (!pair) return

      // Отправляем событие в машину состояний
      send({
        type: "CREATE_JL_CUT",
        clipId: pair.audioClipId,
        cutType: "l-cut",
        offset: Math.abs(offset),
      })
    },
    [getLinkedPair, send],
  )

  // Сброс cut
  const resetCut = useCallback(
    (clipId: string) => {
      const pair = getLinkedPair(clipId)
      if (!pair) return

      // Отправляем событие в машину состояний
      send({
        type: "RESET_JL_CUT",
        clipId: pair.audioClipId,
      })
    },
    [getLinkedPair, send],
  )

  // Связывание клипов
  const linkClips = useCallback(
    (videoClipId: string, audioClipId: string) => {
      // Отправляем событие в машину состояний
      send({
        type: "LINK_CLIPS",
        videoClipId,
        audioClipId,
      })
    },
    [send],
  )

  // Разрыв связи
  const unlinkClips = useCallback(
    (clipId: string) => {
      const linkedClip = getLinkedClip(clipId)
      if (!linkedClip) return

      // Отправляем событие в машину состояний
      send({
        type: "UNLINK_CLIPS",
        clipId,
        linkedClipId: linkedClip.id,
      })
    },
    [getLinkedClip, send],
  )

  // Предпросмотр cut
  const getCutPreview = useCallback(
    (clipId: string, cutType: CutType, offset: number): JLCutPreview | null => {
      const pair = getLinkedPair(clipId)
      if (!pair) return null

      const videoClip = [...project!.globalTracks, ...project!.sections.flatMap((s) => s.tracks)]
        .flatMap((track) => track.clips)
        .find((c) => c.id === pair.videoClipId)

      const audioClip = [...project!.globalTracks, ...project!.sections.flatMap((s) => s.tracks)]
        .flatMap((track) => track.clips)
        .find((c) => c.id === pair.audioClipId)

      if (!videoClip || !audioClip) return null

      const audioOffset = getAudioOffsetForCut(cutType, offset)

      return {
        videoStart: videoClip.startTime,
        videoEnd: videoClip.startTime + videoClip.duration,
        audioStart: videoClip.startTime + audioOffset,
        audioEnd: videoClip.startTime + audioClip.duration + audioOffset,
        cutType,
        offset: audioOffset,
      }
    },
    [project, getLinkedPair],
  )

  // Проверка наличия J/L cut
  const hasJLCut = useCallback(
    (clipId: string): boolean => {
      const pair = getLinkedPair(clipId)
      return pair ? pair.audioOffset !== 0 : false
    },
    [getLinkedPair],
  )

  return {
    createJCut,
    createLCut,
    resetCut,
    linkClips,
    unlinkClips,
    getLinkedClip,
    getLinkedPair,
    getCutPreview,
    isVideoClip,
    isAudioClip,
    hasJLCut,
  }
}
