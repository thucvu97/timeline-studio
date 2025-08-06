/**
 * Утилиты для преобразования типов медиафайлов
 */

import type { MediaFile } from "@/features/media/types/media"
import type { MediaItem } from "@/types/generated/tauri-bindings"

/**
 * Преобразует MediaItem из Tauri в MediaFile
 */
export function mediaItemToMediaFile(item: MediaItem): MediaFile {
  return {
    id: item.id,
    name: item.name,
    path: item.path,
    size: 0, // MediaItem не содержит размер
    type: item.media_type.toLowerCase() as "video" | "audio" | "image",
    isVideo: item.media_type === "Video",
    isAudio: item.media_type === "Audio",
    isImage: item.media_type === "Image",
    duration: item.duration ?? undefined,
    width: item.width ?? undefined,
    height: item.height ?? undefined,
    fps: item.fps ?? undefined,
    bitRate: undefined,
    codec: undefined,
    probeData: item.probe_data
      ? {
          streams: item.probe_data.streams || [],
          format: item.probe_data.format || {},
        }
      : undefined,
    thumbnailPath: item.thumbnail_path ?? undefined,
    createdAt: new Date(item.created_at),
    importedAt: new Date(item.imported_at),
    lastModified: new Date(item.last_modified),
    metadata: item.metadata || {},
  }
}

/**
 * Преобразует массив MediaItem в массив MediaFile
 */
export function mediaItemsToMediaFiles(items: MediaItem[]): MediaFile[] {
  return items.map(mediaItemToMediaFile)
}
