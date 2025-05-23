import { useCallback, useState } from "react"

import { useTranslation } from "react-i18next"

interface CaptureDevice {
  deviceId: string
  label: string
}

interface UseAudioDevicesProps {
  setErrorMessage: (message: string) => void
}

export function useAudioDevices({ setErrorMessage }: UseAudioDevicesProps) {
  const { t } = useTranslation()
  const [audioDevices, setAudioDevices] = useState<CaptureDevice[]>([])
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("")

  // Получаем список доступных аудио устройств
  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()

      const audioDevices = devices
        .filter((device) => device.kind === "audioinput")
        .map((device) => {
          // Очищаем названия устройств от текста в скобках
          let label =
            device.label ||
            t("dialogs.voiceRecord.microphoneWithNumber", {
              number: devices.indexOf(device) + 1,
              defaultValue: `Microphone ${devices.indexOf(device) + 1}`,
            })
          // Удаляем текст в скобках, если он присутствует
          label = label.replace(/\s*\([^)]*\)\s*$/, "")

          return {
            deviceId: device.deviceId || `microphone-${devices.indexOf(device)}`,
            label: label,
          }
        })

      setAudioDevices(audioDevices)

      console.log("Найдены аудио устройства:", audioDevices)

      // Выбираем первое устройство, если еще не выбрано
      if (audioDevices.length > 0 && !selectedAudioDevice) {
        setSelectedAudioDevice(audioDevices[0].deviceId)
      }

      return true
    } catch (error) {
      console.error("Ошибка при получении устройств:", error)
      setErrorMessage(t("dialogs.voiceRecord.errorGettingDevices", "Не удалось получить список устройств"))
      return false
    }
  }, [selectedAudioDevice, t, setErrorMessage])

  return {
    audioDevices,
    selectedAudioDevice,
    setSelectedAudioDevice,
    getDevices
  }
}
