import { RefObject, useCallback, useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { ResolutionOption } from "@/types/project"

interface UseCameraStreamResult {
  isDeviceReady: boolean
  setIsDeviceReady: (ready: boolean) => void
  errorMessage: string
  initCamera: () => Promise<void>
  streamRef: RefObject<MediaStream | null>
}

/**
 * Хук для управления потоком с камеры
 */
export function useCameraStream(
  videoRef: RefObject<HTMLVideoElement | null>,
  selectedDevice: string,
  selectedAudioDevice: string,
  selectedResolution: string,
  frameRate: number,
  availableResolutions: ResolutionOption[],
  setErrorMessage: (message: string) => void,
): UseCameraStreamResult {
  const { t } = useTranslation()
  const [isDeviceReady, setIsDeviceReady] = useState<boolean>(false)
  const streamRef = useRef<MediaStream | null>(null)

  // Инициализация потока с камеры
  const initCamera = useCallback(async () => {
    if (!selectedDevice) {
      console.log("Устройство не выбрано")
      return
    }

    try {
      console.log("Инициализация камеры с устройством:", selectedDevice)

      // Останавливаем предыдущий поток, если есть
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      // Извлекаем выбранное разрешение
      let width = 1920
      let height = 1080

      if (selectedResolution) {
        // Извлекаем числа из строки разрешения (например, "1920x1080")
        console.log("Выбранное разрешение для обработки:", selectedResolution)

        const resolutionMatch = /(\d+)x(\d+)/.exec(selectedResolution)
        if (resolutionMatch && resolutionMatch.length >= 3) {
          width = Number.parseInt(resolutionMatch[1], 10)
          height = Number.parseInt(resolutionMatch[2], 10)
          console.log(`Извлечено разрешение: ${width}x${height}`)
        } else {
          console.warn("Не удалось извлечь разрешение из строки:", selectedResolution)

          // Ищем разрешение в доступных разрешениях
          const resolution = availableResolutions.find((r) => r.value === selectedResolution)
          if (resolution) {
            width = resolution.width
            height = resolution.height
            console.log(`Найдено разрешение в списке: ${width}x${height}`)
          }
        }
      } else {
        // Если разрешение не выбрано, используем максимальное из доступных
        if (availableResolutions.length > 0) {
          // Сортируем по убыванию (сначала самые высокие разрешения)
          const sortedResolutions = [...availableResolutions].sort((a, b) => {
            const pixelsA = a.width * a.height
            const pixelsB = b.width * b.height
            return pixelsB - pixelsA
          })

          // Берем максимальное разрешение
          const maxResolution = sortedResolutions[0]
          width = maxResolution.width
          height = maxResolution.height

          console.log("Разрешение не выбрано, используем максимальное:", width, "x", height)
        }
      }

      console.log(`Запрашиваем разрешение: ${width}x${height}, частота кадров: ${frameRate}`)

      // Проверяем, что разрешение имеет разумные значения
      if (width < 640 || height < 480) {
        console.warn(`Обнаружено слишком низкое разрешение ${width}x${height}, устанавливаем минимальное 640x480`)
        width = 640
        height = 480
      }

      // Настраиваем ограничения для видео потока
      // Используем exact для устройства и ideal для разрешения
      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: { exact: selectedDevice },
          width: { ideal: width },
          height: { ideal: height },
          frameRate: { ideal: frameRate },
        },
        audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : false,
      }

      console.log("Запрашиваем медиа-поток с ограничениями:", constraints)
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints)
        console.log("Поток получен:", stream)
        streamRef.current = stream

        // Получаем информацию о фактическом разрешении из трека
        const videoTrack = stream.getVideoTracks()[0]
        if (videoTrack) {
          const settings = videoTrack.getSettings()
          console.log("Фактические настройки трека:", settings)
          if (settings.width && settings.height) {
            console.log(`Фактическое разрешение трека: ${settings.width}x${settings.height}`)
          }
        }
      } catch (error) {
        console.error("Ошибка при получении потока с запрошенным разрешением:", error)
        setErrorMessage(
          t(
            "dialogs.cameraCapture.errorRequestingStream",
            "Не удалось получить поток с запрошенным разрешением. Пробуем получить поток с настройками по умолчанию.",
          ),
        )

        // Пробуем получить поток без указания разрешения
        console.log("Пробуем получить поток без указания разрешения")
        const fallbackConstraints: MediaStreamConstraints = {
          video: {
            deviceId: { exact: selectedDevice },
          },
          audio: selectedAudioDevice ? { deviceId: { exact: selectedAudioDevice } } : false,
        }

        try {
          const stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints)
          console.log("Поток получен с резервными настройками:", stream)
          streamRef.current = stream
        } catch (fallbackError) {
          console.error("Ошибка при получении потока с резервными настройками:", fallbackError)
          setErrorMessage(
            t(
              "dialogs.cameraCapture.errorRequestingStreamFallback",
              "Не удалось получить поток с камеры. Пожалуйста, проверьте настройки камеры и разрешения.",
            ),
          )
          setIsDeviceReady(false)
          return
        }
      }

      if (videoRef.current && streamRef.current) {
        console.log("Устанавливаем srcObject для видео элемента")
        // Дополнительная проверка, что videoRef.current не null
        const video = videoRef.current
        if (video) {
          video.srcObject = streamRef.current

          // Добавляем обработчик события loadedmetadata
          video.onloadedmetadata = () => {
            console.log("Видео метаданные загружены, начинаем воспроизведение")
            video.play().catch((e: unknown) => console.error("Ошибка воспроизведения:", e))

            // Получаем фактическое разрешение видео для логирования
            const actualWidth = video.videoWidth
            const actualHeight = video.videoHeight
            console.log(`Фактическое разрешение видео: ${actualWidth}x${actualHeight}`)

            setIsDeviceReady(true)
          }

          // Добавляем обработчик ошибок
          video.onerror = (e) => {
            console.error("Ошибка видео элемента:", e)
            setErrorMessage(
              t(
                "dialogs.cameraCapture.videoElementError",
                "Ошибка при инициализации видео элемента. Пожалуйста, попробуйте другое устройство или разрешение.",
              ),
            )
            setIsDeviceReady(false)
          }
        } else {
          console.error("Ссылка на видео элемент отсутствует")
          setIsDeviceReady(false)
        }
      } else {
        console.error("Ссылка на видео элемент или поток отсутствует")
        setIsDeviceReady(false)
      }
    } catch (error) {
      console.error("Ошибка при инициализации камеры:", error)
      setErrorMessage(
        t(
          "dialogs.cameraCapture.cameraInitError",
          "Ошибка при инициализации камеры. Пожалуйста, проверьте настройки камеры и разрешения.",
        ),
      )
      setIsDeviceReady(false)
    }
  }, [
    selectedDevice,
    selectedAudioDevice,
    selectedResolution,
    frameRate,
    availableResolutions,
    videoRef,
    t,
    setErrorMessage,
  ])

  // Очищаем ресурсы при размонтировании
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
      }
    }
  }, [])

  return {
    isDeviceReady,
    setIsDeviceReady,
    errorMessage: "",
    initCamera,
    streamRef,
  }
}
