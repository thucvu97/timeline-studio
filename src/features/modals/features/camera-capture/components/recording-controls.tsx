import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"

interface RecordingControlsProps {
  isRecording: boolean
  recordingTime: number
  isDeviceReady: boolean
  onStartRecording: () => void
  onStopRecording: () => void
  formatRecordingTime: (time: number) => string
}

/**
 * Компонент для управления записью видео
 */
export function RecordingControls({
  isRecording,
  recordingTime,
  isDeviceReady,
  onStartRecording,
  onStopRecording,
  formatRecordingTime,
}: RecordingControlsProps) {
  const { t } = useTranslation()

  return (
    <div className="mt-auto flex flex-col items-center pt-4">
      <div className="mb-4 flex items-center justify-center gap-6">
        {!isRecording ? (
          <Button
            className="mb-0 flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-red-600 shadow-lg hover:bg-red-700"
            onClick={onStartRecording}
            disabled={!isDeviceReady}
            title={t("dialogs.cameraCapture.startRecording")}
            aria-label={t("dialogs.cameraCapture.startRecording")}
          >
            <div className="h-5 w-5 animate-pulse rounded-full bg-white" />
          </Button>
        ) : (
          <Button
            className="mb-0 flex h-16 w-16 items-center justify-center rounded-full border-2 border-white bg-red-600 shadow-lg hover:bg-red-700"
            onClick={onStopRecording}
            title={t("dialogs.cameraCapture.stopRecording")}
            aria-label={t("dialogs.cameraCapture.stopRecording")}
          >
            <div className="h-5 w-5 rounded bg-white" />
          </Button>
        )}
      </div>
      <div className="font-mono text-lg font-semibold">
        {t("dialogs.cameraCapture.recordingTime")}{" "}
        {formatRecordingTime(recordingTime)}
      </div>
    </div>
  )
}
