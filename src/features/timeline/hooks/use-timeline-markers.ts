import { useMemo } from "react"

import { useTimeline } from "./use-timeline"
import { ExtendedTimelineMarker, MarkerType, createMarker } from "../types/markers"

export interface AddMarkerData {
  time: number
  name: string
  type: MarkerType
  color: string
  description?: string
  duration?: number
}

export interface UseTimelineMarkersReturn {
  markers: ExtendedTimelineMarker[]
  addMarker: (data: AddMarkerData) => void
  updateMarker: (markerId: string, updates: Partial<ExtendedTimelineMarker>) => void
  removeMarker: (markerId: string) => void
  goToMarker: (markerId: string) => void
  getMarkerTypes: () => MarkerType[]
  getMarkersByType: (type: MarkerType) => ExtendedTimelineMarker[]
  exportMarkers: (format: "edl" | "csv" | "json") => string
}

/**
 * Хук для работы с маркерами timeline
 */
export function useTimelineMarkers(): UseTimelineMarkersReturn {
  const { project, send, seekTo } = useTimeline()

  // Получаем маркеры из проекта и сортируем по времени
  const markers = useMemo(() => {
    if (!project?.markers) return []

    return [...project.markers]
      .sort((a, b) => a.time - b.time)
      .map((marker) => ({
        ...marker,
        isLocked: marker.isLocked || false,
      })) as ExtendedTimelineMarker[]
  }, [project?.markers])

  const addMarker = (data: AddMarkerData) => {
    const marker = createMarker(data.time, data.name, data.type, data.description)

    // Устанавливаем пользовательский цвет если указан
    if (data.color) {
      marker.color = data.color
    }

    if (data.duration) {
      marker.duration = data.duration
    }

    send({
      type: "ADD_MARKER",
      marker,
    })
  }

  const updateMarker = (markerId: string, updates: Partial<ExtendedTimelineMarker>) => {
    const updatesWithTimestamp = {
      ...updates,
      modifiedAt: new Date(),
    }

    send({
      type: "UPDATE_MARKER",
      markerId,
      updates: updatesWithTimestamp,
    })
  }

  const removeMarker = (markerId: string) => {
    send({
      type: "REMOVE_MARKER",
      markerId,
    })
  }

  const goToMarker = (markerId: string) => {
    const marker = markers.find((m) => m.id === markerId)
    if (marker && seekTo) {
      seekTo(marker.time)
    }
  }

  const getMarkerTypes = (): MarkerType[] => {
    const types = new Set<MarkerType>()
    markers.forEach((marker) => types.add(marker.type))
    return Array.from(types)
  }

  const getMarkersByType = (type: MarkerType): ExtendedTimelineMarker[] => {
    return markers.filter((marker) => marker.type === type)
  }

  const exportMarkers = (format: "edl" | "csv" | "json"): string => {
    switch (format) {
      case "edl":
        return exportToEDL(markers)
      case "csv":
        return exportToCSV(markers)
      case "json":
        return exportToJSON(markers)
      default:
        throw new Error(`Unsupported export format: ${format}`)
    }
  }

  return {
    markers,
    addMarker,
    updateMarker,
    removeMarker,
    goToMarker,
    getMarkerTypes,
    getMarkersByType,
    exportMarkers,
  }
}

// Функции экспорта
function exportToEDL(markers: ExtendedTimelineMarker[]): string {
  let edl = "* MARKERS\n"

  markers.forEach((marker, index) => {
    const trackNumber = String(index + 1).padStart(3, "0")
    const clipNumber = "001"
    const track = "V"
    const transition = "C"

    const timeCode = formatTimeCode(marker.time)
    const endTimeCode = formatTimeCode(marker.time + 0.04) // 1 frame duration

    edl += `${trackNumber}  ${clipNumber}      ${track}     ${transition}        ${timeCode} ${endTimeCode} ${marker.name}\n`
  })

  return edl
}

function exportToCSV(markers: ExtendedTimelineMarker[]): string {
  let csv = "Name,Type,Time,Color\n"

  markers.forEach((marker) => {
    csv += `${marker.name},${marker.type},${marker.time},${marker.color}\n`
  })

  return csv
}

function exportToJSON(markers: ExtendedTimelineMarker[]): string {
  return JSON.stringify(
    {
      markers: markers.map((marker) => ({
        id: marker.id,
        name: marker.name,
        type: marker.type,
        time: marker.time,
        color: marker.color,
        description: marker.description,
        duration: marker.duration,
      })),
      exportedAt: new Date().toISOString(),
    },
    null,
    2,
  )
}

function formatTimeCode(timeInSeconds: number): string {
  const hours = Math.floor(timeInSeconds / 3600)
  const minutes = Math.floor((timeInSeconds % 3600) / 60)
  const seconds = Math.floor(timeInSeconds % 60)
  const frames = Math.floor((timeInSeconds % 1) * 25) // 25 FPS

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}:${frames.toString().padStart(2, "0")}`
}
