/**
 * UpdateNotification - компонент уведомления о доступном обновлении
 * Показывает информацию об обновлении и предоставляет действия для пользователя
 */

import React from 'react'

import { X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { useUpdateManager } from '../hooks/use-update-manager'

interface UpdateNotificationProps {
  className?: string
  onClose?: () => void
  showProgress?: boolean
}

/**
 * Компонент уведомления об обновлении
 */
export function UpdateNotification({ 
  className, 
  onClose, 
  showProgress = true 
}: UpdateNotificationProps) {
  const {
    isUpdateAvailable,
    isDownloading,
    isReadyToInstall,
    isInstalling,
    isInstalled,
    isError,
    availableUpdate,
    error,
    progress,
    downloadUpdate,
    installUpdate,
    dismiss,
    retry,
  } = useUpdateManager()

  // Не показываем уведомление если нет обновления или произошла ошибка
  if (!isUpdateAvailable && !isDownloading && !isReadyToInstall && !isInstalling && !isInstalled && !isError) {
    return null
  }

  const handleClose = () => {
    dismiss()
    onClose?.()
  }

  const getTitle = () => {
    if (isError) return 'Ошибка обновления'
    if (isInstalled) return 'Обновление установлено'
    if (isInstalling) return 'Установка обновления...'
    if (isReadyToInstall) return 'Готово к установке'
    if (isDownloading) return 'Загрузка обновления...'
    return 'Доступно обновление'
  }

  const getDescription = () => {
    if (isError) return error || 'Произошла ошибка при обновлении'
    if (isInstalled) return 'Обновление успешно установлено. Перезапустите приложение для применения изменений.'
    if (isInstalling) return 'Пожалуйста, подождите...'
    if (isReadyToInstall) return 'Обновление загружено и готово к установке'
    if (isDownloading) return 'Загружается новая версия приложения'
    if (availableUpdate) {
      return `Версия ${availableUpdate.version} готова к загрузке`
    }
    return 'Новая версия приложения готова к загрузке'
  }

  const getActionButtons = () => {
    if (isError) {
      return (
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={retry}>
            Повторить
          </Button>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            Закрыть
          </Button>
        </div>
      )
    }

    if (isInstalled) {
      return (
        <Button variant="outline" size="sm" onClick={handleClose}>
          Закрыть
        </Button>
      )
    }

    if (isInstalling) {
      return (
        <Button variant="outline" size="sm" disabled>
          Установка...
        </Button>
      )
    }

    if (isReadyToInstall) {
      return (
        <div className="flex gap-2">
          <Button size="sm" onClick={installUpdate}>
            Установить
          </Button>
          <Button variant="outline" size="sm" onClick={handleClose}>
            Позже
          </Button>
        </div>
      )
    }

    if (isDownloading) {
      return (
        <Button variant="outline" size="sm" disabled>
          Загрузка...
        </Button>
      )
    }

    // isUpdateAvailable
    return (
      <div className="flex gap-2">
        <Button size="sm" onClick={downloadUpdate}>
          Скачать
        </Button>
        <Button variant="outline" size="sm" onClick={handleClose}>
          Пропустить
        </Button>
      </div>
    )
  }

  const getBadgeVariant = () => {
    if (isError) return 'destructive' as const
    if (isInstalled) return 'default' as const
    if (isInstalling || isDownloading) return 'secondary' as const
    return 'default' as const
  }

  const getBadgeText = () => {
    if (isError) return 'Ошибка'
    if (isInstalled) return 'Установлено'
    if (isInstalling) return 'Установка'
    if (isReadyToInstall) return 'Готово'
    if (isDownloading) return 'Загрузка'
    return 'Новое'
  }

  return (
    <Card className={`w-full max-w-md ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium">
              {getTitle()}
            </CardTitle>
            <Badge variant={getBadgeVariant()} className="text-xs">
              {getBadgeText()}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleClose}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        <CardDescription className="text-xs">
          {getDescription()}
        </CardDescription>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Прогресс загрузки */}
        {showProgress && isDownloading && progress && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Прогресс</span>
              <span>{progress.percentage}%</span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            {progress.total && (
              <div className="text-xs text-muted-foreground mt-1">
                {formatBytes(progress.downloaded)} / {formatBytes(progress.total)}
              </div>
            )}
          </div>
        )}

        {/* Информация о версии */}
        {availableUpdate && (isUpdateAvailable || isDownloading) && (
          <div className="mb-3 p-2 bg-muted rounded-md">
            <div className="text-xs font-medium">Версия {availableUpdate.version}</div>
            {availableUpdate.notes && (
              <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {availableUpdate.notes}
              </div>
            )}
            {availableUpdate.pub_date && (
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(availableUpdate.pub_date).toLocaleDateString('ru-RU')}
              </div>
            )}
          </div>
        )}

        {/* Кнопки действий */}
        <div className="flex justify-end">
          {getActionButtons()}
        </div>
      </CardContent>
    </Card>
  )
}

/**
 * Утилита для форматирования размера файла
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}