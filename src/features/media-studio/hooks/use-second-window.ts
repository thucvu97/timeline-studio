import { useCallback, useEffect, useRef, useState } from "react"

import { Window } from "@tauri-apps/api/window"

export function useSecondWindow() {
  const windowRef = useRef<Window | null>(null)
  const [isCreated, setIsCreated] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createWindow = useCallback(async () => {
    try {
      if (windowRef.current) {
        return
      }

      // Используем существующее окно вместо создания нового
      const win = await Window.getByLabel("second-window")
      if (!win) {
        throw new Error("Окно не найдено в конфигурации")
      }

      // Показываем окно
      void win.show()

      // win.once("tauri://created", () => {
      //   setIsCreated(true)
      //   console.log("Второе окно создано")
      // })

      // win.once("tauri://error", (event) => {
      //   setError("Ошибка создания окна")
      //   console.error("Ошибка создания окна", event)
      // })

      windowRef.current = win
    } catch (e) {
      setError(e instanceof Error ? e.message : "Неизвестная ошибка")
    }
  }, [])

  const closeWindow = useCallback(async () => {
    try {
      await windowRef.current?.hide()
      windowRef.current = null
      setIsCreated(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка при закрытии окна")
    }
  }, [])

  // Закрываем окно при размонтировании компонента
  useEffect(() => {
    return () => {
      if (windowRef.current) {
        void closeWindow()
      }
    }
  }, [closeWindow])

  return {
    createWindow,
    closeWindow,
    isCreated,
    error,
  }
}
