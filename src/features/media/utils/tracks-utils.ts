import { Sector } from "../types/types"

/**
 * Обновляет временной диапазон сектора
 * @param sector - Сектор для обновления
 */
export function updateSectorTimeRange(sector: Sector): void {
  if (sector.tracks.length > 0) {
    const allVideos = sector.tracks.flatMap((track) => track.videos ?? [])
    if (allVideos.length > 0) {
      const minStartTime = Math.min(...allVideos.map((video) => video.startTime ?? 0))
      const maxEndTime = Math.max(...allVideos.map((video) => (video.startTime ?? 0) + (video.duration ?? 0)))
      sector.startTime = minStartTime
      sector.endTime = maxEndTime
    }
  }
}
