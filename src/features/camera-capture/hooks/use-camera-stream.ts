import { RefObject, useCallback, useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { ResolutionOption } from "@/features/project-settings/types/project"

import { cleanupMediaStream } from "../utils"

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
  const [errorMessage, setLocalErrorMessage] = useState<string>("")
  const streamRef = useRef<MediaStream | null>(null)
  const initializingRef = useRef<boolean>(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // Синхронизируем локальное состояние ошибки с внешним
  const updateErrorMessage = useCallback((message: string) => {
    setLocalErrorMessage(message)
    setErrorMessage(message)
  }, [setErrorMessage])

  // Инициализация потока с камеры
  const initCamera = useCallback(async () => {
    // Предотвращаем параллельные вызовы
    if (initializingRef.current) {
      console.log("Инициализация камеры уже в процессе, пропускаем вызов")
      return
    }

    if (!selectedDevice) {
      console.log("Устройство не выбрано")
      return
    }

    // Проверяем доступность API mediaDevices
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("MediaDevices API недоступен")
      updateErrorMessage(
        t(
          "dialogs.cameraCapture.mediaDevicesNotSupported",
          "Запись с камеры не поддерживается в данном приложении. Функция доступна только в веб-браузере.",
        ),
      )
      setIsDeviceReady(false)
      return
    }

    // Устанавливаем флаг инициализации
    initializingRef.current = true
    
    // Отменяем предыдущий запрос, если есть
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Создаём новый AbortController для текущего запроса
    abortControllerRef.current = new AbortController()
    const currentAbortController = abortControllerRef.current

    try {
      console.log("Инициализация камеры с устройством:", selectedDevice)

      // Проверяем, не была ли операция отменена
      if (currentAbortController.signal.aborted) {
        console.log("Инициализация камеры отменена")
        return
      }

      // Останавливаем предыдущий поток, если есть
      if (streamRef.current) {
        cleanupMediaStream(streamRef.current, "Camera stream cleanup")
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

      // Проверяем снова, не была ли операция отменена перед запросом потока
      if (currentAbortController.signal.aborted) {
        console.log("Инициализация камеры отменена перед запросом медиа-потока")
        return
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
        const stream = await navigator.mediaDevices?.getUserMedia?.(constraints)
        
        // Проверяем после асинхронной операции
        if (currentAbortController.signal.aborted) {
          console.log("Инициализация камеры отменена после получения потока")
          if (stream) {
            cleanupMediaStream(stream, "Aborted stream cleanup")
          }
          return
        }
        
        console.log("Поток получен:", stream)

        if (!stream) {
          console.error("Не удалось получить медиа-поток")
          throw new Error("Медиа-поток недоступен")
        }

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
        // Проверяем, не была ли операция отменена
        if (currentAbortController.signal.aborted) {
          console.log("Инициализация камеры отменена во время обработки ошибки")
          return
        }
        
        console.error("Ошибка при получении потока с запрошенным разрешением:", error)
        updateErrorMessage(
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
          const stream = await navigator.mediaDevices?.getUserMedia?.(fallbackConstraints)
          
          // Проверяем после асинхронной операции
          if (currentAbortController.signal.aborted) {
            console.log("Инициализация камеры отменена после получения fallback потока")
            if (stream) {
              cleanupMediaStream(stream, "Aborted fallback stream cleanup")
            }
            return
          }
          
          console.log("Поток получен с резервными настройками:", stream)

          if (!stream) {
            console.error("Не удалось получить медиа-поток с резервными настройками")
            throw new Error("Медиа-поток недоступен")
          }

          streamRef.current = stream
        } catch (fallbackError) {
          // Проверяем, не была ли операция отменена
          if (currentAbortController.signal.aborted) {
            console.log("Инициализация камеры отменена во время обработки fallback ошибки")
            return
          }
          
          console.error("Ошибка при получении потока с резервными настройками:", fallbackError)
          updateErrorMessage(
            t(
              "dialogs.cameraCapture.errorRequestingStreamFallback",
              "Не удалось получить поток с камеры. Пожалуйста, проверьте настройки камеры и разрешения.",
            ),
          )
          setIsDeviceReady(false)
          return
        }
      }

      // Финальная проверка перед установкой видео элемента
      if (currentAbortController.signal.aborted) {
        console.log("Инициализация камеры отменена перед установкой видео элемента")
        return
      }

      if (videoRef.current && streamRef.current) {
        console.log("Устанавливаем srcObject для видео элемента")
        // Дополнительная проверка, что videoRef.current не null
        const video = videoRef.current
        if (video) {
          video.srcObject = streamRef.current

          // Добавляем обработчик события loadedmetadata
          video.onloadedmetadata = () => {
            // Проверяем, не была ли операция отменена
            if (currentAbortController.signal.aborted) {
              console.log("Инициализация камеры отменена в onloadedmetadata")
              return
            }
            
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
            updateErrorMessage(
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
      // Проверяем, не была ли операция отменена
      if (currentAbortController.signal.aborted) {
        console.log("Инициализация камеры отменена в блоке catch")
        return
      }
      
      console.error("Ошибка при инициализации камеры:", error)
      updateErrorMessage(
        t(
          "dialogs.cameraCapture.cameraInitError",
          "Ошибка при инициализации камеры. Пожалуйста, проверьте настройки камеры и разрешения.",
        ),
      )
      setIsDeviceReady(false)
    } finally {
      // Сбрасываем флаг инициализации только для текущего запроса
      if (abortControllerRef.current === currentAbortController) {
        initializingRef.current = false
        abortControllerRef.current = null
        console.log("Инициализация камеры завершена, флаги сброшены")
      } else {
        console.log("Инициализация камеры завершена для устаревшего запроса")
      }
    }
  }, [
    selectedDevice,
    selectedAudioDevice,
    selectedResolution,
    frameRate,
    availableResolutions,
    videoRef,
    t,
    updateErrorMessage,
  ])

  // Очищаем ресурсы при размонтировании или изменении устройства
  useEffect(() => {
    // Очищаем предыдущий поток при изменении устройства
    return () => {
      if (streamRef.current) {
        cleanupMediaStream(streamRef.current, "Camera stream device change cleanup")
        streamRef.current = null
      }
      
      // Отменяем текущую инициализацию при изменении устройства
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      
      initializingRef.current = false
    }
  }, [selectedDevice, selectedAudioDevice])

  // Общая очистка при размонтировании компонента
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        cleanupMediaStream(streamRef.current, "Camera stream final cleanup")
        streamRef.current = null
      }
      
      // Отменяем любую текущую инициализацию при размонтировании
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
      
      initializingRef.current = false
    }
  }, [])

  return {
    isDeviceReady,
    setIsDeviceReady,
    errorMessage,
    initCamera,
    streamRef,
  }
}
