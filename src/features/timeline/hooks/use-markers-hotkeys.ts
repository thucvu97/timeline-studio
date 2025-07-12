import { useHotkeys } from "react-hotkeys-hook"

import { useTimeline } from "./use-timeline"
import { useTimelineMarkers } from "./use-timeline-markers"

/**
 * Хук для обработки горячих клавиш маркеров
 */
export function useMarkersHotkeys() {
  const { addMarker, removeMarker, goToMarker, markers } = useTimelineMarkers()
  const { currentTime, selectedMarkerId } = useTimeline()

  // M - добавить маркер
  useHotkeys(
    "m",
    () => {
      const markerCount = markers.length
      addMarker({
        time: currentTime,
        name: `Marker ${markerCount + 1}`,
        type: "cue",
        color: "#8b5cf6",
      })
    },
    {
      preventDefault: true,
      enableOnContentEditable: true,
    },
  )

  // Shift+M - добавить маркер главы
  useHotkeys(
    "shift+m",
    () => {
      const chapterCount = markers.filter((m) => m.type === "chapter").length
      addMarker({
        time: currentTime,
        name: `Chapter ${chapterCount + 1}`,
        type: "chapter",
        color: "#3b82f6",
      })
    },
    {
      preventDefault: true,
      enableOnContentEditable: true,
    },
  )

  // Delete/Backspace - удалить выбранный маркер
  useHotkeys(
    "del,backspace",
    () => {
      if (selectedMarkerId) {
        removeMarker(selectedMarkerId)
      }
    },
    {
      preventDefault: true,
      enableOnContentEditable: true,
    },
  )

  // Cmd/Ctrl+Shift+Left - предыдущий маркер
  useHotkeys(
    "cmd+shift+left,ctrl+shift+left",
    () => {
      const sortedMarkers = markers.sort((a, b) => a.time - b.time)
      const currentMarkerIndex = sortedMarkers.findIndex((m) => m.time < currentTime)
      const prevMarker = sortedMarkers[currentMarkerIndex]

      if (prevMarker) {
        goToMarker(prevMarker.id)
      }
    },
    {
      preventDefault: true,
      enableOnContentEditable: true,
    },
  )

  // Cmd/Ctrl+Shift+Right - следующий маркер
  useHotkeys(
    "cmd+shift+right,ctrl+shift+right",
    () => {
      const sortedMarkers = markers.sort((a, b) => a.time - b.time)
      const nextMarker = sortedMarkers.find((m) => m.time > currentTime)

      if (nextMarker) {
        goToMarker(nextMarker.id)
      }
    },
    {
      preventDefault: true,
      enableOnContentEditable: true,
    },
  )
}
