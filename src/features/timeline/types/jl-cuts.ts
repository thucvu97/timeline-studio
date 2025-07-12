/**
 * Типы для J-Cut и L-Cut операций
 */

export type CutType = "j-cut" | "l-cut" | "straight-cut"

export interface JLCutConfig {
  type: CutType
  offset: number // Смещение в секундах
  maintainSync: boolean // Сохранять ли синхронизацию других клипов
}

export interface LinkedClipPair {
  videoClipId: string
  audioClipId: string
  isLinked: boolean
  audioOffset: number // Смещение аудио относительно видео
}

export interface JLCutOperation {
  clipId: string
  cutType: CutType
  offset: number
  affectedClips: string[] // ID клипов, которые были затронуты
}

export interface JLCutPreview {
  videoStart: number
  videoEnd: number
  audioStart: number
  audioEnd: number
  cutType: CutType
  offset: number
}

// Утилиты для определения типа cut
export function getCutType(audioOffset: number): CutType {
  if (audioOffset > 0) return "j-cut"
  if (audioOffset < 0) return "l-cut"
  return "straight-cut"
}

export function getAudioOffsetForCut(cutType: CutType, offset: number): number {
  switch (cutType) {
    case "j-cut":
      return Math.abs(offset)
    case "l-cut":
      return -Math.abs(offset)
    case "straight-cut":
      return 0
    default:
      return 0
  }
}
