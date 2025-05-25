import { useCallback, useEffect, useState } from "react"

import { RefreshCw } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useModal } from "@/features/modals"

import { AudioPermissionRequest } from "./components/audio-permission-request"
import { useAudioDevices } from "./hooks/use-audio-devices"
import { useAudioPermissions } from "./hooks/use-audio-permissions"
import { useVoiceRecording } from "./hooks/use-voice-recording"

export function VoiceRecordModal() {
  const { t } = useTranslation()
  const [savePath, setSavePath] = useState<string>("")
  const [isMuted] = useState<boolean>(true)
  const { isOpen, closeModal } = useModal()

  // Используем хук для управления разрешениями на доступ к микрофону
  const { permissionStatus, errorMessage, requestPermissions, setErrorMessage } = useAudioPermissions()

  // Используем хук для управления аудио устройствами
  const { audioDevices, selectedAudioDevice, setSelectedAudioDevice, getDevices } = useAudioDevices({
    setErrorMessage,
  })

  // Функция для сохранения аудиозаписи (временная заглушка)
  const saveAudioToServer = useCallback(
    async (blob: Blob, fileName: string) => {
      try {
        // Создаем URL для предпросмотра записи
        const audioUrl = URL.createObjectURL(blob)

        // В реальном приложении здесь будет код для сохранения файла
        console.log("Аудиозапись создана:", { fileName, size: blob.size, url: audioUrl })

        // Можно добавить код для скачивания файла
        // const a = document.createElement("a")
        // a.href = audioUrl
        // a.download = fileName
        // a.click()

        // Закрываем диалог после успешного сохранения
        closeModal()
      } catch (error) {
        console.error("Ошибка при сохранении аудиозаписи:", error)
        setErrorMessage(t("dialogs.voiceRecord.saveError", "Ошибка при сохранении аудиозаписи"))
      }
    },
    [closeModal, setErrorMessage, t],
  )

  // Используем хук для управления записью голоса
  const {
    isRecording,
    showCountdown,
    recordingTime,
    isDeviceReady,
    countdown,
    setCountdown,
    audioRef,
    formatTime,
    stopRecording,
    startCountdown,
    initAudio,
    cleanup,
  } = useVoiceRecording({
    selectedAudioDevice,
    isMuted,
    setErrorMessage,
    onSaveRecording: saveAudioToServer,
  })

  // Получаем устройства после получения разрешений
  const getDevicesAfterPermissions = useCallback(async () => {
    try {
      // Запрашиваем разрешения с помощью хука
      const permissionGranted = await requestPermissions()

      if (permissionGranted) {
        // Если разрешения получены, получаем список устройств
        await getDevices()
      }
    } catch (error) {
      console.error("Ошибка при получении устройств после разрешений:", error)
    }
  }, [requestPermissions, getDevices])

  // Запрашиваем устройства и запускаем микрофон при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      void getDevicesAfterPermissions()
    } else {
      cleanup()
    }
  }, [isOpen, getDevicesAfterPermissions, cleanup])

  // Инициализируем микрофон при изменении устройства
  useEffect(() => {
    if (isOpen && selectedAudioDevice) {
      void initAudio()
    }
  }, [isOpen, selectedAudioDevice, initAudio])

  return (
    <div className="p-6">
      {/* Отображаем компонент запроса разрешений */}
      <AudioPermissionRequest
        permissionStatus={permissionStatus}
        errorMessage={errorMessage}
        onRequestPermissions={requestPermissions}
      />

      {/* Основной контент */}
      {permissionStatus === "granted" && (
        <>
          {/* Аудио элемент для предпросмотра (скрытый) */}
          <audio ref={audioRef} autoPlay muted={isMuted} />

          {/* Настройки устройств */}
          <div className="mb-8 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-5">
            <div className="text-sm text-gray-300">{t("dialogs.voiceRecord.device", { defaultValue: "Device" })}:</div>
            <div className="flex items-center gap-2">
              <Select value={selectedAudioDevice} onValueChange={setSelectedAudioDevice} disabled={isRecording}>
                <SelectTrigger className="w-full border-[#444] bg-[#222] focus:ring-0 focus:ring-offset-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="w-full border-[#444] bg-[#222]">
                  {audioDevices.map(
                    (device) =>
                      device.deviceId && (
                        <SelectItem
                          key={device.deviceId}
                          value={device.deviceId}
                          className="text-white hover:bg-[#333] focus:bg-[#333]"
                        >
                          {device.label}
                        </SelectItem>
                      ),
                  )}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 border-[#444] bg-[#222] hover:bg-[#333]"
                onClick={getDevices}
                title={t("dialogs.voiceRecord.refreshDevices", {
                  defaultValue: "Refresh devices",
                })}
              >
                <RefreshCw size={16} />
              </Button>
            </div>

            <div className="text-sm text-gray-300">
              {t("dialogs.voiceRecord.savePath", { defaultValue: "Save to" })}:
            </div>
            <Input
              value={savePath}
              onChange={(e) => setSavePath(e.target.value)}
              className="border-[#444] bg-[#222] text-white focus:border-[#666]"
              placeholder="/Users/username/Movies"
              disabled={isRecording}
            />

            <div className="text-sm text-gray-300">
              {t("dialogs.voiceRecord.countdown", { defaultValue: "Countdown" })}:
            </div>
            <Input
              type="number"
              min="0"
              max="10"
              value={countdown}
              onChange={(e) => setCountdown(Number.parseInt(e.target.value) || 0)}
              className="w-20 border-[#444] bg-[#222] text-white focus:border-[#666]"
              disabled={isRecording}
            />
          </div>

          {/* Запись */}
          <div className="mt-auto flex flex-col items-center pt-4">
            {/* Отображаем обратный отсчет */}
            {showCountdown && (
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-red-600 text-4xl font-bold">
                {countdown}
              </div>
            )}

            {/* Отображаем время записи */}
            {isRecording && (
              <div className="mb-4 text-center">
                <div className="text-lg font-semibold">
                  {t("dialogs.voiceRecord.recordingTime", { defaultValue: "Recording time" })}{" "}
                  {formatTime(recordingTime)}
                </div>
                <div className="mt-2 h-2 w-full bg-gray-700">
                  <div
                    className="h-2 bg-red-600"
                    style={{ width: `${Math.min(100, (recordingTime / 300) * 100)}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="mb-4 flex items-center justify-center gap-6">
              {!isRecording ? (
                <Button
                  className="mb-0 flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-red-600 shadow-lg hover:bg-red-700"
                  onClick={startCountdown}
                  disabled={!isDeviceReady}
                  title={t("dialogs.voiceRecord.startRecording", {
                    defaultValue: "Start Recording",
                  })}
                  aria-label={t("dialogs.voiceRecord.startRecording", {
                    defaultValue: "Start Recording",
                  })}
                >
                  <div className="h-5 w-5 animate-pulse rounded-full bg-white" />
                </Button>
              ) : (
                <Button
                  className="mb-0 flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-red-600 shadow-lg hover:bg-red-700"
                  onClick={stopRecording}
                  title={t("dialogs.voiceRecord.stopRecording", {
                    defaultValue: "Stop Recording",
                  })}
                  aria-label={t("dialogs.voiceRecord.stopRecording", {
                    defaultValue: "Stop Recording",
                  })}
                >
                  <div className="h-5 w-5 rounded bg-white" />
                </Button>
              )}
            </div>

            <div className="mt-4 text-center text-xs text-gray-400">
              {t("dialogs.voiceRecord.hint", {
                defaultValue:
                  "Click the record button to start. The recording will be automatically added to the media library.",
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
