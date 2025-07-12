import { useHotkeys } from "react-hotkeys-hook"

import { useSpeedRamping } from "./use-speed-ramping"
import { useTimeline } from "./use-timeline"

export function useSpeedRampingHotkeys() {
  const { send, uiState } = useTimeline()
  const { resetToConstantSpeed } = useSpeedRamping()

  // Включить/выключить speed ramping для выбранных клипов
  useHotkeys(
    "cmd+shift+r, ctrl+shift+r",
    (e) => {
      e.preventDefault()
      const selectedClipIds = uiState?.selectedClipIds || []

      selectedClipIds.forEach((clipId) => {
        send({ type: "ENABLE_SPEED_RAMPING", clipId })
      })
    },
    {
      enableOnFormTags: false,
      enabled: true,
    },
  )

  // Сбросить скорость к нормальной
  useHotkeys(
    "cmd+alt+r, ctrl+alt+r",
    (e) => {
      e.preventDefault()
      const selectedClipIds = uiState?.selectedClipIds || []

      selectedClipIds.forEach((clipId) => {
        resetToConstantSpeed(clipId, 1.0)
      })
    },
    {
      enableOnFormTags: false,
      enabled: true,
    },
  )

  // Установить скорость 0.5x
  useHotkeys(
    "5",
    (e) => {
      e.preventDefault()
      const selectedClipIds = uiState?.selectedClipIds || []

      selectedClipIds.forEach((clipId) => {
        resetToConstantSpeed(clipId, 0.5)
      })
    },
    {
      enableOnFormTags: false,
      enabled: true,
    },
  )

  // Установить скорость 2x
  useHotkeys(
    "2",
    (e) => {
      e.preventDefault()
      const selectedClipIds = uiState?.selectedClipIds || []

      selectedClipIds.forEach((clipId) => {
        resetToConstantSpeed(clipId, 2.0)
      })
    },
    {
      enableOnFormTags: false,
      enabled: true,
    },
  )

  // Установить скорость 4x
  useHotkeys(
    "4",
    (e) => {
      e.preventDefault()
      const selectedClipIds = uiState?.selectedClipIds || []

      selectedClipIds.forEach((clipId) => {
        resetToConstantSpeed(clipId, 4.0)
      })
    },
    {
      enableOnFormTags: false,
      enabled: true,
    },
  )

  // Инвертировать скорость (reverse)
  useHotkeys(
    "cmd+r, ctrl+r",
    (e) => {
      e.preventDefault()
      const selectedClipIds = uiState?.selectedClipIds || []

      selectedClipIds.forEach((clipId) => {
        // TODO: Implement reverse speed
        console.log("Reverse speed for clip:", clipId)
      })
    },
    {
      enableOnFormTags: false,
      enabled: true,
    },
  )

  return null
}
