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
    width: undefined, // MediaItem не содержит width
    height: undefined, // MediaItem не содержит height
    fps: undefined, // MediaItem не содержит fps
    bitRate: undefined,
    codec: undefined,
    probeData: undefined, // MediaItem не содержит probe_data
    thumbnailPath: item.thumbnail ?? undefined,
    createdAt: new Date().toISOString(), // MediaItem не содержит created_at
    importedAt: new Date().toISOString(), // MediaItem не содержит imported_at
    lastModified: new Date().toISOString(), // MediaItem не содержит last_modified
    metadata: item.metadata || {},
  }
}

/**
 * Преобразует массив MediaItem в массив MediaFile
 */
export function mediaItemsToMediaFiles(items: MediaItem[]): MediaFile[] {
  return items.map(mediaItemToMediaFile)
}
