import { useCallback, useRef, useState } from "react"

import { useTranslation } from "react-i18next"

interface UseVoiceRecordingProps {
  selectedAudioDevice: string
  isMuted: boolean
  setErrorMessage: (message: string) => void
  onSaveRecording: (blob: Blob, fileName: string) => Promise<void>
}

export function useVoiceRecording({
  selectedAudioDevice,
  isMuted,
  setErrorMessage,
  onSaveRecording,
}: UseVoiceRecordingProps) {
  const { t } = useTranslation()
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [showCountdown, setShowCountdown] = useState<boolean>(false)
  const [recordingTime, setRecordingTime] = useState<number>(0)
  const [isDeviceReady, setIsDeviceReady] = useState<boolean>(false)
  const [countdown, setCountdown] = useState<number>(3)

  // Refs для управления потоком и записью
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)
  const countdownTimerRef = useRef<number | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Форматируем время записи в формат MM:SS
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [])

  // Останавливаем запись
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop()
    }

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    setIsRecording(false)
    setRecordingTime(0)
  }, [])

  // Запускаем запись
  const startRecording = useCallback(() => {
    if (!streamRef.current) return

    chunksRef.current = []

    const options = { mimeType: "audio/webm" }
    try {
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options)
    } catch (e) {
      console.error("MediaRecorder не поддерживает данный формат:", e)
      try {
        // Пробуем другой формат
        mediaRecorderRef.current = new MediaRecorder(streamRef.current)
      } catch (e) {
        console.error("MediaRecorder не поддерживается браузером:", e)
        return
      }
    }

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data)
      }
    }

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "audio/webm" })
      const now = new Date()
      const fileName = `voice_recording_${now.toISOString().replace(/:/g, "-")}.webm`
      void onSaveRecording(blob, fileName)
    }

    mediaRecorderRef.current.start()
    setIsRecording(true)

    // Запускаем таймер для отслеживания времени записи
    let seconds = 0
    timerRef.current = window.setInterval(() => {
      seconds++
      setRecordingTime(seconds)
    }, 1000)
  }, [onSaveRecording])

  // Запускаем обратный отсчет перед записью
  const startCountdown = useCallback(() => {
    if (!isDeviceReady) return

    setShowCountdown(true)
    let count = countdown
    setCountdown(count)

    countdownTimerRef.current = window.setInterval(() => {
      count--
      setCountdown(count)

      if (count <= 0) {
        if (countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current)
          countdownTimerRef.current = null
        }
        setShowCountdown(false)
        startRecording()
      }
    }, 1000)
  }, [isDeviceReady, countdown, startRecording])

  // Инициализация потока с микрофона
  const initAudio = useCallback(async () => {
    if (!selectedAudioDevice) {
      console.log("Устройство не выбрано")
      return
    }

    try {
      console.log("Инициализация микрофона с устройством:", selectedAudioDevice)

      // Останавливаем предыдущий поток, если есть
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      // Настраиваем ограничения для аудио потока
      const constraints: MediaStreamConstraints = {
        audio: {
          deviceId: { exact: selectedAudioDevice },
        },
      }

      // Запрашиваем поток с микрофона
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      // Создаем аудио элемент для предпросмотра
      if (audioRef.current) {
        audioRef.current.srcObject = stream
        audioRef.current.muted = isMuted
      }

      setIsDeviceReady(true)
      console.log("Микрофон инициализирован успешно")
    } catch (error) {
      console.error("Ошибка при инициализации микрофона:", error)
      setErrorMessage(
        t("dialogs.voiceRecord.initError", {
          defaultValue: "Failed to initialize microphone. Please check settings and permissions.",
        }),
      )
      setIsDeviceReady(false)
    }
  }, [selectedAudioDevice, isMuted, t, setErrorMessage])

  // Очистка ресурсов
  const cleanup = useCallback(() => {
    if (isRecording) {
      stopRecording()
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current)
      countdownTimerRef.current = null
    }

    setIsDeviceReady(false)
  }, [isRecording, stopRecording])

  return {
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
  }
}
