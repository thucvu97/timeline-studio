import type { TimeRange } from "@/types/time-range"

import type { MediaFile, MediaTrack } from "../types/media"

/**
 * Интерфейс для видеопотока
 */
export interface VideoStream {
  codec_type: string
  rotation?: string
  width?: number
  height?: number
}

/**
 * Интерфейс для размеров видео
 */
export interface Dimensions {
  width: number
  height: number
  style: string
}

/**
 * Интерфейс для группировки файлов по дате
 */
export interface DateGroup {
  date: string
  files: MediaFile[]
}

/**
 * Интерфейс для сектора на таймлайне
 */
export interface Sector {
  id: string
  name: string
  tracks: MediaTrack[]
  timeRanges: TimeRange[]
  zoomLevel?: number
  scrollPosition?: number
  startTime: number
  endTime: number
}

export type { TimeRange }
