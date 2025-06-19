import { useCallback, useRef, useState } from "react"

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

      const stream = await navigator.mediaDevices.getDisplayMedia(constraints as DisplayMediaStreamOptions)

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
      streamRef.current.getTracks().forEach((track) => {
        track.stop()
        console.log(`Остановлен трек: ${track.kind}`)
      })
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

  return {
    screenStream,
    isScreenSharing,
    error,
    startScreenCapture,
    stopScreenCapture,
    getSourceInfo,
  }
}
