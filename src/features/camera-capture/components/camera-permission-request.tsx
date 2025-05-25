import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"

interface CameraPermissionRequestProps {
  permissionStatus: "pending" | "granted" | "denied" | "error"
  errorMessage: string
  onRequestPermissions: () => void
}

/**
 * Компонент для запроса разрешений на доступ к камере и микрофону
 * и отображения ошибок, связанных с разрешениями
 */
export function CameraPermissionRequest({
  permissionStatus,
  errorMessage,
  onRequestPermissions,
}: CameraPermissionRequestProps) {
  const { t } = useTranslation()

  if (permissionStatus === "granted") {
    return null
  }

  return (
    <div className="mb-4">
      {permissionStatus === "pending" && (
        <div className="text-center text-sm">
          {t("dialogs.cameraCapture.requestingPermissions", "Запрашиваем разрешения...")}
        </div>
      )}

      {permissionStatus === "denied" && (
        <div className="rounded-md bg-red-900/50 p-3 text-sm text-red-100">
          {errorMessage}
          <div className="mt-2">
            <Button className="w-full bg-red-600 hover:bg-red-700" onClick={onRequestPermissions}>
              {t("dialogs.cameraCapture.retryRequest")}
            </Button>
          </div>
        </div>
      )}

      {permissionStatus === "error" && (
        <div className="rounded-md bg-red-900/50 p-3 text-sm text-red-100">
          {errorMessage}
          <div className="mt-2">
            <Button className="w-full bg-red-600 hover:bg-red-700" onClick={onRequestPermissions}>
              {t("dialogs.cameraCapture.retry")}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
