import type { MediaFile, MediaTrack } from "@/features/media/types";
import type { TimeRange } from "@/types/time-range";

/**
 * Интерфейс для видеопотока
 */
export interface VideoStream {
  codec_type: string;
  rotation?: string;
  width?: number;
  height?: number;
}

/**
 * Интерфейс для размеров видео
 */
export interface Dimensions {
  width: number;
  height: number;
  style: string;
}

/**
 * Интерфейс для группировки файлов по дате
 */
export interface DateGroup {
  date: string;
  files: MediaFile[];
}

// Тип Sector перенесен в src/features/media/utils/types.ts

export type { MediaFile, MediaTrack, TimeRange };
