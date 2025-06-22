import { CheckCircle, Loader2, XCircle } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

interface KeyStatusIndicatorProps {
  status: "not_set" | "testing" | "invalid" | "valid"
  className?: string
}

/**
 * Индикатор статуса API ключа
 * Показывает цветной индикатор и иконку в зависимости от статуса
 */
export function KeyStatusIndicator({ status, className }: KeyStatusIndicatorProps) {
  const { t } = useTranslation()

  const getStatusConfig = () => {
    switch (status) {
      case "not_set":
        return {
          icon: null,
          color: "text-gray-400",
          bgColor: "bg-gray-100 dark:bg-gray-800",
          text: t("dialogs.userSettings.status.notSet", "Не настроено"),
        }
      case "testing":
        return {
          icon: <Loader2 className="h-3 w-3 animate-spin" />,
          color: "text-blue-600",
          bgColor: "bg-blue-100 dark:bg-blue-900/20",
          text: t("dialogs.userSettings.status.testing", "Проверка..."),
        }
      case "invalid":
        return {
          icon: <XCircle className="h-3 w-3" />,
          color: "text-red-600",
          bgColor: "bg-red-100 dark:bg-red-900/20",
          text: t("dialogs.userSettings.status.invalid", "Ошибка"),
        }
      case "valid":
        return {
          icon: <CheckCircle className="h-3 w-3" />,
          color: "text-green-600",
          bgColor: "bg-green-100 dark:bg-green-900/20",
          text: t("dialogs.userSettings.status.valid", "Работает"),
        }
      default:
        return {
          icon: null,
          color: "text-gray-400",
          bgColor: "bg-gray-100 dark:bg-gray-800",
          text: "Unknown",
        }
    }
  }

  const config = getStatusConfig()

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
        config.color,
        config.bgColor,
        className,
      )}
    >
      {config.icon}
      <span>{config.text}</span>
    </div>
  )
}
