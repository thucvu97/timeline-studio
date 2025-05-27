import { useEffect, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { useModal } from "@/features/modals"

import { useCameraPermissions, useCameraStream, useDeviceCapabilities, useDevices, useRecording } from "../hooks"

import { CameraPermissionRequest, CameraPreview, CameraSettings, RecordingControls } from "."

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

  // Запрашиваем разрешения при открытии модального окна и останавливаем камеру при закрытии
  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      requestPermissions()
    } else {
      // Останавливаем все треки камеры при закрытии модального окна
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
      setIsDeviceReady(false)
    }
  }, [isOpen, requestPermissions, streamRef])

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
          {/* Предпросмотр видео */}
          <CameraPreview
            videoRef={videoRef}
            isDeviceReady={isDeviceReady}
            showCountdown={showCountdown}
            countdown={countdown}
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

        {/* Правая колонка - настройки */}
        <div className="flex flex-col w-2/5">
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
