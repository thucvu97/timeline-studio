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
    <div className="flex flex-row items-center justify-between px-4 py-3 bg-gray-900 rounded-md">
      <div className="font-mono text-lg font-semibold">
        {t("dialogs.cameraCapture.recordingTime")}{" "}
        {formatRecordingTime(recordingTime)}
      </div>
      <div className="flex items-center justify-center">
        {!isRecording ? (
          <Button
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-red-600 shadow-lg hover:bg-red-700"
            onClick={onStartRecording}
            disabled={!isDeviceReady}
            title={t("dialogs.cameraCapture.startRecording")}
            aria-label={t("dialogs.cameraCapture.startRecording")}
          >
            <div className="h-4 w-4 rounded-full bg-white" />
          </Button>
        ) : (
          <Button
            className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-red-600 shadow-lg hover:bg-red-700"
            onClick={onStopRecording}
            title={t("dialogs.cameraCapture.stopRecording")}
            aria-label={t("dialogs.cameraCapture.stopRecording")}
          >
            <div className="h-4 w-4 rounded bg-white" />
          </Button>
        )}
      </div>
    </div>
  )
}
