import { useHotkeys } from "react-hotkeys-hook"

import { useTimeline } from "./use-timeline"
import { useTimelineMarkers } from "./use-timeline-markers"

export function useMarkerHotkeys() {
  const { currentTime, seek } = useTimeline()
  const { addMarker, removeMarker, markers } = useTimelineMarkers()

  // Получить маркер в указанное время
  const getMarkerAtTime = (time: number) => {
    return markers.find(marker => Math.abs(marker.time - time) < 0.1)
  }

  // Перейти к следующему маркеру
  const goToNextMarker = () => {
    const nextMarker = markers.find(marker => marker.time > currentTime)
    if (nextMarker) {
      void seek(nextMarker.time)
    }
  }

  // Перейти к предыдущему маркеру
  const goToPreviousMarker = () => {
    const sortedMarkers = [...markers].sort((a, b) => b.time - a.time)
    const prevMarker = sortedMarkers.find(marker => marker.time < currentTime)
    if (prevMarker) {
      void seek(prevMarker.time)
    }
  }

  // M - Add marker at current time
  useHotkeys(
    "m",
    (e) => {
      e.preventDefault()
      const markerName = `Marker ${new Date().toLocaleTimeString()}`
      addMarker({
        time: currentTime,
        name: markerName,
        type: "note",
        color: "#3b82f6"
      })
    },
    {
      enableOnFormTags: false,
    },
    [currentTime, addMarker],
  )

  // Shift+M - Add chapter marker
  useHotkeys(
    "shift+m",
    (e) => {
      e.preventDefault()
      const markerName = `Chapter ${new Date().toLocaleTimeString()}`
      addMarker({
        time: currentTime,
        name: markerName,
        type: "chapter",
        color: "#10b981"
      })
    },
    {
      enableOnFormTags: false,
    },
    [currentTime, addMarker],
  )

  // Ctrl/Cmd+M - Add export marker
  useHotkeys(
    "cmd+m, ctrl+m",
    (e) => {
      e.preventDefault()
      const markerName = `Export ${new Date().toLocaleTimeString()}`
      addMarker({
        time: currentTime,
        name: markerName,
        type: "export",
        color: "#f59e0b"
      })
    },
    {
      enableOnFormTags: false,
    },
    [currentTime, addMarker],
  )

  // Delete - Remove marker at current time
  useHotkeys(
    "delete",
    (e) => {
      e.preventDefault()
      const marker = getMarkerAtTime(currentTime)
      if (marker && !marker.isLocked) {
        removeMarker(marker.id)
      }
    },
    {
      enableOnFormTags: false,
    },
    [currentTime, getMarkerAtTime, removeMarker],
  )

  // ' (apostrophe) - Go to next marker
  useHotkeys(
    "'",
    (e) => {
      e.preventDefault()
      goToNextMarker()
    },
    {
      enableOnFormTags: false,
    },
    [goToNextMarker],
  )

  // ; (semicolon) - Go to previous marker
  useHotkeys(
    ";",
    (e) => {
      e.preventDefault()
      goToPreviousMarker()
    },
    {
      enableOnFormTags: false,
    },
    [goToPreviousMarker],
  )

  // Shift+' - Go to next chapter marker
  useHotkeys(
    "shift+'",
    (e) => {
      e.preventDefault()
      // This would require filtering by type in the hook
      // For now, just go to next marker
      goToNextMarker()
    },
    {
      enableOnFormTags: false,
    },
    [goToNextMarker],
  )

  // Shift+; - Go to previous chapter marker
  useHotkeys(
    "shift+;",
    (e) => {
      e.preventDefault()
      // This would require filtering by type in the hook
      // For now, just go to previous marker
      goToPreviousMarker()
    },
    {
      enableOnFormTags: false,
    },
    [goToPreviousMarker],
  )
}