import { useEffect, useState } from "react"

import { getCurrentWindow } from "@tauri-apps/api/window"

export function useMultiDisplay() {
  const [hasMultipleDisplays, setHasMultipleDisplays] = useState(false)
  const [isFirstDisplay] = useState(() => getCurrentWindow().label === "main")

  // Проверяем количество дисплеев
  useEffect(() => {
    async function checkDisplays() {
      try {
        const currentWindow = getCurrentWindow()
        // В Tauri 2.0 пока нет прямого API для получения всех мониторов
        // Используем доступное API для определения второго монитора
        const monitor = await currentWindow.outerPosition()
        setHasMultipleDisplays(monitor !== null)
      } catch (err) {
        console.error("Failed to get monitors:", err)
        setHasMultipleDisplays(false)
      }
    }

    void checkDisplays()
  }, [])

  return {
    hasMultipleDisplays,
    isFirstDisplay,
  }
}
