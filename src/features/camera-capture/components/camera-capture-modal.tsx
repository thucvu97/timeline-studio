import { useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { useModal } from "@/features/modals"

import {
  useCameraPermissions,
  useCameraStream,
  useDeviceCapabilities,
  useDevices,
  useRecording,
  useScreenCapture,
} from "../hooks"

import { CameraPermissionRequest, CameraPreview, CameraSettings, RecordingControls } from "."

/**
 * Модальное окно для захвата видео с камеры
 */
export function CameraCaptureModal() {
  const { t } = useTranslation()

  const { isOpen, closeModal } = useModal()

  const videoRef = useRef<HTMLVideoElement>(null)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [captureMode, setCaptureMode] = useState<"camera" | "screen">("camera")

  // Проверяем поддержку MediaDevices API
  const [isMediaDevicesSupported] = useState(() => {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  })

  // Получаем возможности устройства (разрешения, частоты кадров)
  const [selectedResolution, setSelectedResolution] = useState<string>("")
  const [frameRate, setFrameRate] = useState<number>(30)
  const {
    availableResolutions,
    supportedResolutions,
    supportedFrameRates,
    isLoadingCapabilities,
    getDeviceCapabilities,
  } = useDeviceCapabilities(setSelectedResolution, setFrameRate)

  // Получаем список устройств
  const {
    devices,
    audioDevices,
    selectedDevice,
    selectedAudioDevice,
    setSelectedDevice,
    setSelectedAudioDevice,
    getDevices,
  } = useDevices(getDeviceCapabilities, setErrorMessage)

  // Запрашиваем разрешения на доступ к камере и микрофону
  const { permissionStatus, errorMessage: permissionError, requestPermissions } = useCameraPermissions(getDevices)

  // Управляем потоком с камеры
  const { isDeviceReady, setIsDeviceReady, initCamera, streamRef } = useCameraStream(
    videoRef,
    selectedDevice,
    selectedAudioDevice,
    selectedResolution,
    frameRate,
    availableResolutions,
    setErrorMessage,
  )

  // Управляем записью экрана
  const {
    screenStream,
    isScreenSharing,
    error: screenError,
    startScreenCapture,
    stopScreenCapture,
  } = useScreenCapture()

  // Обработка записанного видео
  const handleVideoRecorded = async (_blob: Blob, _fileName: string) => {
    // try {
    // Импортируем записанное видео
    //   await importMedia([
    //     {
    //       file: new File([blob], fileName, { type: "video/webm" }),
    //       type: "video",
    //     },
    //   ])
    //   toast({
    //     title: t("dialogs.cameraCapture.recordingSuccess", "Запись успешно сохранена"),
    //     description: fileName,
    //   })
    //   // Закрываем модальное окно
    //   closeModal()
    // } catch (error) {
    //   console.error("Ошибка при сохранении записи:", error)
    //   toast({
    //     title: t("dialogs.cameraCapture.recordingError", "Ошибка при сохранении записи"),
    //     description: String(error),
    //     variant: "destructive",
    //   })
    // }
  }

  // Определяем какой поток использовать для записи
  const activeStreamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (captureMode === "screen" && screenStream) {
      activeStreamRef.current = screenStream
      // Устанавливаем поток экрана в video элемент
      if (videoRef.current) {
        videoRef.current.srcObject = screenStream
      }
    } else if (captureMode === "camera" && streamRef.current) {
      activeStreamRef.current = streamRef.current
      // Поток камеры уже устанавливается в useCameraStream
    }
  }, [captureMode, screenStream, streamRef])

  // Управляем записью
  const {
    isRecording,
    recordingTime,
    showCountdown,
    countdown,
    setCountdown,
    startCountdown,
    stopRecording,
    formatRecordingTime,
  } = useRecording(activeStreamRef, 3, handleVideoRecorded)

  // Инициализируем камеру при изменении выбранного устройства или разрешения
  useEffect(() => {
    if (selectedDevice && permissionStatus === "granted") {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      initCamera()
    }
  }, [selectedDevice, selectedResolution, frameRate, permissionStatus, initCamera])

  // Запрашиваем разрешения при открытии модального окна и останавливаем камеру при закрытии
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      requestPermissions()
    } else {
      // Останавливаем все треки при закрытии модального окна
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      if (isScreenSharing) {
        stopScreenCapture()
      }
      setIsDeviceReady(false)
      setCaptureMode("camera") // Сбрасываем на камеру
    }
  }, [isOpen, requestPermissions, streamRef, isScreenSharing, stopScreenCapture])

  // Обработчик изменения устройства
  const handleDeviceChange = (deviceId: string) => {
    setSelectedDevice(deviceId)
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getDeviceCapabilities(deviceId)
  }

  // Обработчик изменения аудио устройства
  const handleAudioDeviceChange = (deviceId: string) => {
    setSelectedAudioDevice(deviceId)
  }

  // Обработчик изменения разрешения
  const handleResolutionChange = (resolution: string) => {
    setSelectedResolution(resolution)
  }

  // Обработчик изменения частоты кадров
  const handleFrameRateChange = (fps: number) => {
    setFrameRate(fps)
  }

  // Обработчик изменения обратного отсчета
  const handleCountdownChange = (value: number) => {
    setCountdown(value)
  }

  // Обработчик переключения режима захвата
  const handleCaptureModeChange = async (mode: "camera" | "screen") => {
    // Останавливаем текущую запись
    if (isRecording) {
      stopRecording()
    }

    // Останавливаем текущий поток
    if (captureMode === "screen" && isScreenSharing) {
      stopScreenCapture()
    } else if (captureMode === "camera" && streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setIsDeviceReady(false)
    }

    // Меняем режим
    setCaptureMode(mode)

    // Запускаем новый поток
    if (mode === "screen") {
      try {
        await startScreenCapture({
          video: true,
          audio: !!selectedAudioDevice,
        })
      } catch (error) {
        console.error("Failed to start screen capture:", error)
        setErrorMessage(screenError || "Failed to start screen capture")
      }
    } else if (mode === "camera") {
      if (selectedDevice && permissionStatus === "granted") {
        await initCamera()
      }
    }
  }

  // Если MediaDevices не поддерживается, показываем сообщение
  if (!isMediaDevicesSupported) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h3 className="text-lg font-semibold mb-4">
          {t("dialogs.cameraCapture.notSupported", "Запись с камеры недоступна")}
        </h3>
        <p className="text-muted-foreground mb-6">
          {t(
            "dialogs.cameraCapture.notSupportedDescription",
            "Запись с камеры не поддерживается в десктопном приложении. Эта функция доступна только при использовании Timeline Studio в веб-браузере.",
          )}
        </p>
        <Button onClick={closeModal} variant="outline">
          {t("common.close", "Закрыть")}
        </Button>
      </div>
    )
  }

  return (
    <>
      {/* Запрос разрешений */}
      <CameraPermissionRequest
        permissionStatus={permissionStatus}
        errorMessage={permissionError || errorMessage}
        onRequestPermissions={requestPermissions}
      />

      <div className="flex flex-row gap-4">
        {/* Левая колонка - видео */}
        <div className="flex flex-col w-3/5">
          {/* Кнопки переключения режима */}
          <div className="flex gap-2 mb-4">
            <Button
              variant={captureMode === "camera" ? "default" : "outline"}
              onClick={() => handleCaptureModeChange("camera")}
              disabled={isRecording}
              className="flex-1"
            >
              {t("cameraCapture.cameraMode", "Camera")}
            </Button>
            <Button
              variant={captureMode === "screen" ? "default" : "outline"}
              onClick={() => handleCaptureModeChange("screen")}
              disabled={isRecording}
              className="flex-1"
            >
              {t("cameraCapture.screenMode", "Screen")}
            </Button>
          </div>

          {/* Предпросмотр видео */}
          <CameraPreview
            videoRef={videoRef}
            isDeviceReady={captureMode === "camera" ? isDeviceReady : isScreenSharing}
            showCountdown={showCountdown}
            countdown={countdown}
          />

          {/* Управление записью */}
          <RecordingControls
            isRecording={isRecording}
            recordingTime={recordingTime}
            isDeviceReady={captureMode === "camera" ? isDeviceReady : isScreenSharing}
            onStartRecording={startCountdown}
            onStopRecording={stopRecording}
            formatRecordingTime={formatRecordingTime}
          />
        </div>

        {/* Правая колонка - настройки */}
        <div className="flex flex-col w-2/5">
          {/* Настройки камеры - показываем только в режиме камеры */}
          {captureMode === "camera" ? (
            <CameraSettings
              devices={devices}
              selectedDevice={selectedDevice}
              onDeviceChange={handleDeviceChange}
              audioDevices={audioDevices}
              selectedAudioDevice={selectedAudioDevice}
              onAudioDeviceChange={handleAudioDeviceChange}
              availableResolutions={availableResolutions}
              selectedResolution={selectedResolution}
              onResolutionChange={handleResolutionChange}
              supportedResolutions={supportedResolutions}
              frameRate={frameRate}
              onFrameRateChange={handleFrameRateChange}
              supportedFrameRates={supportedFrameRates}
              countdown={countdown}
              onCountdownChange={handleCountdownChange}
              isRecording={isRecording}
              isLoadingCapabilities={isLoadingCapabilities}
            />
          ) : (
            // Настройки для записи экрана
            <div className="space-y-4 p-4">
              <h3 className="text-lg font-semibold">
                {t("cameraCapture.screenSettings", "Screen Recording Settings")}
              </h3>

              <div className="text-sm text-muted-foreground">
                {t("cameraCapture.screenInfo", "Select a window, tab, or entire screen to record")}
              </div>

              {/* Аудио устройство для записи экрана */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("cameraCapture.microphone", "Microphone")}</label>
                <select
                  value={selectedAudioDevice || ""}
                  onChange={(e) => setSelectedAudioDevice(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  disabled={isRecording}
                >
                  <option value="">{t("cameraCapture.noAudio", "No Audio")}</option>
                  {audioDevices.map((device) => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Настройки обратного отсчета */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("cameraCapture.countdown", "Countdown")}</label>
                <select
                  value={countdown}
                  onChange={(e) => handleCountdownChange(Number(e.target.value))}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  disabled={isRecording}
                >
                  <option value={0}>{t("cameraCapture.noCountdown", "No countdown")}</option>
                  <option value={3}>3 {t("cameraCapture.seconds", "seconds")}</option>
                  <option value={5}>5 {t("cameraCapture.seconds", "seconds")}</option>
                  <option value={10}>10 {t("cameraCapture.seconds", "seconds")}</option>
                </select>
              </div>

              {screenError && (
                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{screenError}</div>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-end border-t border-[#333] p-4">
        <Button className="bg-[#0CC] px-6 font-medium text-black hover:bg-[#0AA]" onClick={closeModal}>
          {t("common.ok")}
        </Button>
      </div>
    </>
  )
}
