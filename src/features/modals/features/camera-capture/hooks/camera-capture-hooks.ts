import { useCallback, useState } from "react"

import { useTranslation } from "react-i18next"

import { COMMON_FRAMERATES, COMMON_RESOLUTIONS, ResolutionOption } from "@/types/project"

// Интерфейс для устройств захвата (камеры, микрофоны)
export interface CaptureDevice {
  deviceId: string
  label: string
}

interface UseCameraPermissionsResult {
  permissionStatus: "pending" | "granted" | "denied" | "error"
  errorMessage: string
  requestPermissions: () => Promise<void>
}

/**
 * Хук для запроса разрешений на доступ к камере и микрофону
 */
export function useCameraPermissions(
  getDevices: () => Promise<boolean>
): UseCameraPermissionsResult {
  const { t } = useTranslation()
  const [permissionStatus, setPermissionStatus] = useState<
    "pending" | "granted" | "denied" | "error"
  >("pending")
  const [errorMessage, setErrorMessage] = useState<string>("")

  const requestPermissions = useCallback(async () => {
    try {
      setPermissionStatus("pending")
      setErrorMessage("")

      // Запрашиваем доступ к камере и микрофону, чтобы получить метки устройств
      const tempStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      // После получения доступа останавливаем временный поток
      tempStream.getTracks().forEach((track) => track.stop())

      // Теперь можем получить полный список устройств с названиями
      setPermissionStatus("granted")
      await getDevices()
    } catch (error) {
      console.error("Error requesting permissions:", error)
      setPermissionStatus("error")

      if (error instanceof DOMException) {
        if (error.name === "NotAllowedError") {
          setErrorMessage(
            t(
              "dialogs.cameraCapture.permissionDenied",
              "Camera and microphone access denied. Please allow access in browser settings.",
            ),
          )
          setPermissionStatus("denied")
        } else if (error.name === "NotFoundError") {
          setErrorMessage(
            t(
              "dialogs.cameraCapture.deviceNotFound",
              "Camera or microphone not found. Please connect devices and try again.",
            ),
          )
        } else {
          setErrorMessage(
            `${t("dialogs.cameraCapture.errorAccess", "Error accessing devices:")} ${error.message}`,
          )
        }
      } else {
        setErrorMessage(
          t("dialogs.cameraCapture.unknownError", "Unknown error requesting device access"),
        )
      }
    }
  }, [getDevices, t])

  return { permissionStatus, errorMessage, requestPermissions }
}

interface UseDeviceCapabilitiesResult {
  availableResolutions: ResolutionOption[]
  supportedResolutions: ResolutionOption[]
  supportedFrameRates: number[]
  isLoadingCapabilities: boolean
  getDeviceCapabilities: (deviceId: string) => Promise<void>
}

/**
 * Хук для получения возможностей устройства (разрешения, частоты кадров)
 */
export function useDeviceCapabilities(
  setSelectedResolution: (resolution: string) => void,
  setFrameRate: (frameRate: number) => void
): UseDeviceCapabilitiesResult {
  const { t } = useTranslation()
  const [availableResolutions, setAvailableResolutions] = useState<ResolutionOption[]>([])
  const [supportedResolutions, setSupportedResolutions] = useState<ResolutionOption[]>([])
  const [supportedFrameRates, setSupportedFrameRates] = useState<number[]>([])
  const [isLoadingCapabilities, setIsLoadingCapabilities] = useState<boolean>(false)

  const getDeviceCapabilities = useCallback(async (deviceId: string) => {
    setIsLoadingCapabilities(true)
    try {
      // Временно запрашиваем поток для определения возможностей
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: deviceId },
        },
      })

      // Получаем трек
      const videoTrack = stream.getVideoTracks()[0]

      if (videoTrack && "getCapabilities" in videoTrack) {
        // Современный подход через getCapabilities
        const capabilities = videoTrack.getCapabilities()
        console.log("Возможности камеры:", capabilities)

        // Получаем разрешения
        const resolutions: ResolutionOption[] = []

        if (capabilities.width && capabilities.height) {
          // Получаем максимальное разрешение устройства
          const deviceWidthMax = capabilities.width?.max || 1920
          const deviceHeightMax = capabilities.height?.max || 1080

          console.log(`Максимальное разрешение устройства: ${deviceWidthMax}x${deviceHeightMax}`)

          // Проверяем, что максимальное разрешение имеет стандартное соотношение сторон
          const aspectRatio = deviceWidthMax / deviceHeightMax
          const isStandardAspectRatio =
            Math.abs(aspectRatio - 16/9) < 0.1 || // 16:9
            Math.abs(aspectRatio - 9/16) < 0.1 || // 9:16
            Math.abs(aspectRatio - 1) < 0.1 ||    // 1:1
            Math.abs(aspectRatio - 4/3) < 0.1 ||  // 4:3
            Math.abs(aspectRatio - 4/5) < 0.1 ||  // 4:5
            Math.abs(aspectRatio - 21/9) < 0.1;   // 21:9

          // Добавляем максимальное разрешение устройства только если оно имеет стандартное соотношение сторон
          if (isStandardAspectRatio) {
            resolutions.push({
              width: deviceWidthMax,
              height: deviceHeightMax,
              label: `${deviceWidthMax}x${deviceHeightMax}`,
              value: `${deviceWidthMax}x${deviceHeightMax}`,
            })
          } else {
            console.log(`Максимальное разрешение устройства ${deviceWidthMax}x${deviceHeightMax} имеет нестандартное соотношение сторон ${aspectRatio.toFixed(2)}`)
          }

          // Добавляем стандартные разрешения, которые меньше максимального
          for (const res of COMMON_RESOLUTIONS) {
            if (res.width <= deviceWidthMax && res.height <= deviceHeightMax) {
              // Проверяем, что такого разрешения еще нет в списке
              if (!resolutions.some(r => r.width === res.width && r.height === res.height)) {
                resolutions.push(res)
              }
            }
          }

          // Получаем частоты кадров
          let frameRates: number[] = []
          if (capabilities.frameRate) {
            const frMin = capabilities.frameRate.min || 0
            const frMax = capabilities.frameRate.max || 60

            console.log(`Диапазон частот кадров: ${frMin}-${frMax} fps`)

            // Добавляем стандартные частоты кадров, которые в пределах диапазона
            const standard = [24, 25, 30, 50, 60]
            frameRates = standard.filter((fps) => fps >= frMin && fps <= frMax)

            // Добавляем максимальную частоту, если она не стандартная
            const maxFps = Math.floor(frMax)
            if (!frameRates.includes(maxFps) && maxFps > 0) {
              frameRates.push(maxFps)
            }

            // Сортируем
            frameRates.sort((a, b) => a - b)
          }

          // Сортируем разрешения от большего к меньшему
          const sortedResolutions = [...resolutions].sort((a, b) => {
            // Сравниваем по общему количеству пикселей
            const pixelsA = a.width * a.height
            const pixelsB = b.width * b.height
            return pixelsB - pixelsA
          })

          console.log(
            "Доступные разрешения:",
            sortedResolutions.map((r) => r.label),
          )

          // Устанавливаем отсортированные разрешения
          setSupportedResolutions(sortedResolutions)
          setAvailableResolutions(sortedResolutions)

          // Всегда выбираем максимальное разрешение по умолчанию
          if (sortedResolutions.length > 0) {
            const maxResolution = sortedResolutions[0]
            console.log("Выбрано максимальное разрешение:", maxResolution.label)
            setSelectedResolution(maxResolution.value)
          } else {
            // Если по какой-то причине нет разрешений, используем стандартные
            setAvailableResolutions(COMMON_RESOLUTIONS)
            setSupportedResolutions(COMMON_RESOLUTIONS)
            setSelectedResolution(COMMON_RESOLUTIONS[0].value)
          }

          if (frameRates.length > 0) {
            setSupportedFrameRates(frameRates)

            // Устанавливаем частоту по умолчанию (30 fps или лучшее доступное)
            const defaultFps = frameRates.find((fps) => fps === 30) || frameRates[0]
            setFrameRate(defaultFps)
          } else {
            setSupportedFrameRates(COMMON_FRAMERATES)
            setFrameRate(30)
          }
        } else {
          // Если нет информации о разрешении, используем стандартные значения
          console.log("Нет информации о разрешении, используем стандартные значения")
          setAvailableResolutions(COMMON_RESOLUTIONS)
          setSupportedResolutions(COMMON_RESOLUTIONS)
          setSelectedResolution(COMMON_RESOLUTIONS[0].value)
          setSupportedFrameRates(COMMON_FRAMERATES)
          setFrameRate(30)
        }
      } else {
        // Для старых браузеров используем предопределенные разрешения
        console.log("Браузер не поддерживает getCapabilities, используем стандартные значения")
        setAvailableResolutions(COMMON_RESOLUTIONS)
        setSupportedResolutions(COMMON_RESOLUTIONS)
        setSelectedResolution(COMMON_RESOLUTIONS[0].value)
        setSupportedFrameRates(COMMON_FRAMERATES)
        setFrameRate(30)
      }

      // Завершаем поток
      stream.getTracks().forEach((track) => track.stop())
    } catch (error) {
      console.error("Ошибка при получении возможностей устройства:", error)
      // Используем стандартные значения в случае ошибки
      setAvailableResolutions(COMMON_RESOLUTIONS)
      setSupportedResolutions(COMMON_RESOLUTIONS)
      setSelectedResolution(COMMON_RESOLUTIONS[0].value)
      setSupportedFrameRates(COMMON_FRAMERATES)
      setFrameRate(30)

      // Логируем ошибку
      console.error(t("dialogs.cameraCapture.errorGettingCapabilities",
        "Не удалось получить информацию о возможностях камеры. Используются стандартные настройки."))
    } finally {
      setIsLoadingCapabilities(false)
    }
  }, [t, setSelectedResolution, setFrameRate])

  return {
    availableResolutions,
    supportedResolutions,
    supportedFrameRates,
    isLoadingCapabilities,
    getDeviceCapabilities,
  }
}
