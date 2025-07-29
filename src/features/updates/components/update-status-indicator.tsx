/**
 * UpdateStatusIndicator - индикатор статуса обновлений для строки состояния
 * Показывает компактную информацию о состоянии обновлений
 */

import { AlertCircle, CheckCircle, Download, Loader2, RefreshCw } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { useUpdateManager } from "../hooks/use-update-manager"

interface UpdateStatusIndicatorProps {
  /** Показывать ли текст рядом с иконкой */
  showText?: boolean
  /** Компактный режим (только иконка) */
  compact?: boolean
  /** Дополнительные CSS классы */
  className?: string
  /** Обработчик клика */
  onClick?: () => void
}

/**
 * Индикатор статуса обновлений для строки состояния
 */
export function UpdateStatusIndicator({
  showText = false,
  compact = false,
  className,
  onClick,
}: UpdateStatusIndicatorProps) {
  const {
    isIdle,
    isChecking,
    isUpdateAvailable,
    isDownloading,
    isReadyToInstall,
    isInstalling,
    isInstalled,
    isError,
    availableUpdate,
    error,
    progress,
    currentVersion,
    checkForUpdates,
    downloadUpdate,
    installUpdate,
  } = useUpdateManager()

  // Не показываем индикатор в обычном состоянии если не указано явно
  if (isIdle && !onClick) {
    return null
  }

  const getIcon = () => {
    if (isError) return <AlertCircle className="h-4 w-4 text-destructive" />
    if (isInstalled) return <CheckCircle className="h-4 w-4 text-green-500" />
    if (isInstalling) return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    if (isReadyToInstall) return <Download className="h-4 w-4 text-green-500" />
    if (isDownloading) return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    if (isChecking) return <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
    if (isUpdateAvailable) return <Download className="h-4 w-4 text-orange-500" />
    return <RefreshCw className="h-4 w-4 text-muted-foreground" />
  }

  const getText = () => {
    if (isError) return "Ошибка"
    if (isInstalled) return "Установлено"
    if (isInstalling) return "Установка..."
    if (isReadyToInstall) return "Готово"
    if (isDownloading) return "Загрузка..."
    if (isChecking) return "Проверка..."
    if (isUpdateAvailable) return "Обновление"
    return "Проверить"
  }

  const getTooltipContent = () => {
    if (isError) return `Ошибка обновления: ${error || "Неизвестная ошибка"}`
    if (isInstalled) return "Обновление установлено. Перезапустите приложение."
    if (isInstalling) return "Установка обновления..."
    if (isReadyToInstall) return "Обновление готово к установке"
    if (isDownloading) {
      const progressText = progress ? ` (${progress.percentage}%)` : ""
      return `Загрузка обновления${progressText}`
    }
    if (isChecking) return "Проверка доступных обновлений..."
    if (isUpdateAvailable && availableUpdate) {
      return `Доступна версия ${availableUpdate.version}`
    }
    return `Текущая версия: ${currentVersion}. Нажмите для проверки обновлений.`
  }

  const handleClick = () => {
    if (onClick) {
      onClick()
      return
    }

    // Автоматические действия в зависимости от состояния
    if (isUpdateAvailable) {
      downloadUpdate()
    } else if (isReadyToInstall) {
      installUpdate()
    } else if (isIdle || isError) {
      checkForUpdates()
    }
  }

  const getVariant = () => {
    if (isError) return "destructive" as const
    if (isUpdateAvailable || isReadyToInstall) return "default" as const
    return "ghost" as const
  }

  // Компактный режим - только иконка
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={getVariant()}
              size="sm"
              className={`h-6 w-6 p-0 ${className}`}
              onClick={handleClick}
              disabled={isChecking || isDownloading || isInstalling}
            >
              {getIcon()}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{getTooltipContent()}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  // Обычный режим с текстом
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={getVariant()}
            size="sm"
            className={`h-6 px-2 ${className}`}
            onClick={handleClick}
            disabled={isChecking || isDownloading || isInstalling}
          >
            <div className="flex items-center gap-1.5">
              {getIcon()}
              {showText && <span className="text-xs font-medium">{getText()}</span>}
              {isUpdateAvailable && availableUpdate && (
                <Badge variant="secondary" className="h-4 px-1 text-xs">
                  {availableUpdate.version}
                </Badge>
              )}
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{getTooltipContent()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

/**
 * Простой индикатор только с иконкой для встраивания в тесные места
 */
export function UpdateIconIndicator({ className }: { className?: string }) {
  return <UpdateStatusIndicator compact={true} className={className} />
}

/**
 * Индикатор с текстом для более широких панелей
 */
export function UpdateTextIndicator({ className }: { className?: string }) {
  return <UpdateStatusIndicator showText={true} className={className} />
}
