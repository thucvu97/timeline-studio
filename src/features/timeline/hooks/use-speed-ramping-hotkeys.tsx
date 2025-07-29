import { useEffect } from "react"

import { shortcutsRegistry } from "@/features/keyboard-shortcuts"

import { useSpeedRamping } from "./use-speed-ramping"
import { useTimeline } from "./use-timeline"

export function useSpeedRampingHotkeys() {
  const { send, uiState } = useTimeline()
  const { resetToConstantSpeed } = useSpeedRamping()

  // Register keyboard shortcuts for speed ramping operations
  useEffect(() => {
    const shortcuts = [
      {
        id: "enable-speed-ramping",
        action: () => {
          const selectedClipIds = uiState?.selectedClipIds || []
          selectedClipIds.forEach((clipId) => {
            send({ type: "ENABLE_SPEED_RAMPING", clipId })
          })
        },
      },
      {
        id: "reset-speed",
        action: () => {
          const selectedClipIds = uiState?.selectedClipIds || []
          selectedClipIds.forEach((clipId) => {
            resetToConstantSpeed(clipId, 1.0)
          })
        },
      },
      {
        id: "speed-half",
        action: () => {
          const selectedClipIds = uiState?.selectedClipIds || []
          selectedClipIds.forEach((clipId) => {
            resetToConstantSpeed(clipId, 0.5)
          })
        },
      },
      {
        id: "speed-double",
        action: () => {
          const selectedClipIds = uiState?.selectedClipIds || []
          selectedClipIds.forEach((clipId) => {
            resetToConstantSpeed(clipId, 2.0)
          })
        },
      },
      {
        id: "speed-quad",
        action: () => {
          const selectedClipIds = uiState?.selectedClipIds || []
          selectedClipIds.forEach((clipId) => {
            resetToConstantSpeed(clipId, 4.0)
          })
        },
      },
      {
        id: "reverse-speed",
        action: () => {
          const selectedClipIds = uiState?.selectedClipIds || []
          selectedClipIds.forEach((clipId) => {
            // TODO: Implement reverse speed
            console.log("Reverse speed for clip:", clipId)
          })
        },
      },
    ]

    // Регистрируем все shortcuts
    shortcuts.forEach(({ id, action }) => {
      shortcutsRegistry.updateAction(id, action)
    })

    // Очищаем actions при размонтировании
    return () => {
      shortcuts.forEach(({ id }) => {
        shortcutsRegistry.updateAction(id, undefined)
      })
    }
  }, [send, uiState?.selectedClipIds, resetToConstantSpeed])

  return null
}
