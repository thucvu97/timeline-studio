import { useCallback, useEffect, useRef, useState } from "react"

import { cleanupMediaStream } from "../utils"

interface ScreenCaptureOptions {
  video?: boolean | MediaTrackConstraints
  audio?: boolean | MediaTrackConstraints
  preferCurrentTab?: boolean
}

// Расширяем тип для поддержки экспериментальных свойств
interface ExtendedDisplayMediaStreamOptions extends DisplayMediaStreamOptions {
  preferCurrentTab?: boolean
}

// Расширяем тип MediaTrackSettings для поддержки свойств записи экрана
interface ExtendedMediaTrackSettings extends MediaTrackSettings {
  displaySurface?: string
  cursor?: string
}

export function useScreenCapture() {
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const startScreenCapture = useCallback(async (options: ScreenCaptureOptions = {}) => {
    // Проверяем доступность API getDisplayMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
      const errorMsg = "Запись экрана не поддерживается в данном приложении. Функция доступна только в веб-браузере."
      setError(errorMsg)
      throw new Error(errorMsg)
    }

    try {
      setError(null)

      // Настройки по умолчанию
      const constraints: ExtendedDisplayMediaStreamOptions = {
        video:
          options.video !== false
            ? {
              width: { ideal: 1920 },
              height: { ideal: 1080 },
              frameRate: { ideal: 30 },
              ...(typeof options.video === "object" ? options.video : {}),
            }
            : false,
        audio:
          options.audio !== false
            ? {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
              ...(typeof options.audio === "object" ? options.audio : {}),
            }
            : false,
        preferCurrentTab: options.preferCurrentTab,
      }

      console.log("Запрашиваем разрешение на запись экрана с параметрами:", constraints)

      const stream = await navigator.mediaDevices?.getDisplayMedia?.(constraints as DisplayMediaStreamOptions)

      if (!stream) {
        console.error("Не удалось получить поток захвата экрана")
        throw new Error("Захват экрана недоступен")
      }

      // Обработка остановки записи пользователем
      const videoTrack = stream.getVideoTracks()[0]
      if (videoTrack) {
        videoTrack.addEventListener("ended", () => {
          console.log("Пользователь остановил запись экрана")
          stopScreenCapture()
        })
      }

      streamRef.current = stream
      setScreenStream(stream)
      setIsScreenSharing(true)

      console.log("Запись экрана начата успешно")
      return stream
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error"
      console.error("Ошибка при запуске записи экрана:", errorMessage)

      if (errorMessage.includes("Permission denied")) {
        setError("Доступ к записи экрана запрещен")
      } else if (errorMessage.includes("NotAllowedError")) {
        setError("Пользователь отменил выбор экрана")
      } else {
        setError("Не удалось начать запись экрана")
      }

      throw err
    }
  }, [])

  const stopScreenCapture = useCallback(() => {
    if (streamRef.current) {
      cleanupMediaStream(streamRef.current, "Screen capture stop")
      streamRef.current = null
      setScreenStream(null)
    }
    setIsScreenSharing(false)
    setError(null)
    console.log("Запись экрана остановлена")
  }, [])

  // Получение информации о захватываемом источнике
  const getSourceInfo = useCallback(() => {
    if (!screenStream) return null

    const videoTrack = screenStream.getVideoTracks()[0]
    if (!videoTrack) return null

    const settings = videoTrack.getSettings() as ExtendedMediaTrackSettings
    return {
      width: settings.width,
      height: settings.height,
      frameRate: settings.frameRate,
      displaySurface: settings.displaySurface, // 'monitor', 'window', 'browser'
      cursor: settings.cursor, // 'always', 'motion', 'never'
    }
  }, [screenStream])

  // Очищаем ресурсы при размонтировании компонента
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        cleanupMediaStream(streamRef.current, "Screen capture unmount cleanup")
        streamRef.current = null
      }
    }
  }, [])

  // Очищаем ресурсы при остановке потока
  useEffect(() => {
    if (!isScreenSharing && streamRef.current) {
      cleanupMediaStream(streamRef.current, "Screen capture auto cleanup")
      streamRef.current = null
      setScreenStream(null)
    }
  }, [isScreenSharing])

  return {
    screenStream,
    isScreenSharing,
    error,
    startScreenCapture,
    stopScreenCapture,
    getSourceInfo,
  }
}
