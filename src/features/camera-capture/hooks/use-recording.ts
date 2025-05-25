import { RefObject, useCallback, useEffect, useRef, useState } from "react"

interface UseRecordingResult {
  isRecording: boolean
  recordingTime: number
  showCountdown: boolean
  countdown: number
  setCountdown: (value: number) => void
  startCountdown: () => void
  stopRecording: () => void
  formatRecordingTime: (timeInSeconds: number) => string
}

/**
 * Хук для управления записью видео
 */
export function useRecording(
  streamRef: RefObject<MediaStream | null>,
  initialCountdown = 3,
  onVideoRecorded: (blob: Blob, fileName: string) => void,
): UseRecordingResult {
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [recordingTime, setRecordingTime] = useState<number>(0)
  const [showCountdown, setShowCountdown] = useState<boolean>(false)
  const [countdown, setCountdown] = useState<number>(initialCountdown)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<number | null>(null)

  // Форматирование времени записи
  const formatRecordingTime = (timeInSeconds: number): string => {
    const hours = Math.floor(timeInSeconds / 3600)
    const minutes = Math.floor((timeInSeconds % 3600) / 60)
    const seconds = timeInSeconds % 60

    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  }

  // Запускаем запись
  const startRecording = useCallback(() => {
    if (!streamRef.current) return

    chunksRef.current = []

    const options = { mimeType: "video/webm;codecs=vp9,opus" }
    try {
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options)
    } catch (e) {
      console.error("MediaRecorder не поддерживает данный формат:", e)
      try {
        // Пробуем другой формат
        mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
          mimeType: "video/webm",
        })
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
      const blob = new Blob(chunksRef.current, { type: "video/webm" })
      const now = new Date()
      const fileName = `camera_recording_${now.toISOString().replace(/:/g, "-")}.webm`
      onVideoRecorded(blob, fileName)
    }

    mediaRecorderRef.current.start()
    setIsRecording(true)

    // Запускаем таймер для отслеживания времени записи
    let seconds = 0
    timerRef.current = window.setInterval(() => {
      seconds++
      setRecordingTime(seconds)
    }, 1000)
  }, [onVideoRecorded, streamRef])

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

  // Начинаем обратный отсчет или сразу запись
  const startCountdown = useCallback(() => {
    if (countdown <= 0) {
      // Если обратный отсчет установлен в 0, сразу начинаем запись
      startRecording()
      return
    }

    // Иначе запускаем обратный отсчет
    setShowCountdown(true)
    let currentCount = countdown

    const timer = setInterval(() => {
      currentCount -= 1
      setCountdown(currentCount)

      if (currentCount <= 0) {
        clearInterval(timer)
        setShowCountdown(false)
        startRecording()
      }
    }, 1000)
  }, [countdown, startRecording])

  // Очищаем ресурсы при размонтировании
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  return {
    isRecording,
    recordingTime,
    showCountdown,
    countdown,
    setCountdown,
    startCountdown,
    stopRecording,
    formatRecordingTime,
  }
}
