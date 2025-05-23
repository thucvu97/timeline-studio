import { useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

import {
  CameraPermissionRequest,
  CameraPreview,
  CameraSettings,
  RecordingControls,
} from "./components"
import {
  useCameraPermissions,
  useCameraStream,
  useDeviceCapabilities,
  useDevices,
  useRecording,
} from "./hooks"
import { useModal } from "../../services"

/**
 * Модальное окно для захвата видео с камеры
 */
export function CameraCaptureModal() {
  const { t } = useTranslation()

  const { isOpen, closeModal } = useModal()

  const videoRef = useRef<HTMLVideoElement>(null)
  const [errorMessage, setErrorMessage] = useState<string>("")

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
  const { permissionStatus, errorMessage: permissionError, requestPermissions } =
    useCameraPermissions(getDevices)

  // Управляем потоком с камеры
  const { isDeviceReady, initCamera, streamRef } = useCameraStream(
    videoRef,
    selectedDevice,
    selectedAudioDevice,
    selectedResolution,
    frameRate,
    availableResolutions,
    setErrorMessage
  )

  // Обработка записанного видео
  const handleVideoRecorded = async (blob: Blob, fileName: string) => {
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
  } = useRecording(streamRef, 3, handleVideoRecorded)

  // Инициализируем камеру при изменении выбранного устройства или разрешения
  useEffect(() => {
    if (selectedDevice && permissionStatus === "granted") {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      initCamera()
    }
  }, [selectedDevice, selectedResolution, frameRate, permissionStatus, initCamera])

  // Запрашиваем разрешения при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      requestPermissions()
    }
  }, [isOpen, requestPermissions])

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{t("dialogs.cameraCapture.title", "Запись с камеры")}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col">
          {/* Запрос разрешений */}
          <CameraPermissionRequest
            permissionStatus={permissionStatus}
            errorMessage={permissionError || errorMessage}
            onRequestPermissions={requestPermissions}
          />

          {/* Предпросмотр видео */}
          <CameraPreview
            videoRef={videoRef}
            isDeviceReady={isDeviceReady}
            showCountdown={showCountdown}
            countdown={countdown}
          />

          {/* Настройки камеры */}
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

          {/* Управление записью */}
          <RecordingControls
            isRecording={isRecording}
            recordingTime={recordingTime}
            isDeviceReady={isDeviceReady}
            onStartRecording={startCountdown}
            onStopRecording={stopRecording}
            formatRecordingTime={formatRecordingTime}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
