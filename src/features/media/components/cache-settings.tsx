import { useCallback, useEffect, useState } from "react"

import { AlertCircle, Database, HardDrive, RefreshCw, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { formatFileSize } from "@/lib/utils"

/**
 * Интерфейс для статистики кэша
 */
interface CacheStats {
  previewCache: {
    count: number
    size: number
  }
  frameCache: {
    count: number
    size: number
  }
  recognitionCache: {
    count: number
    size: number
  }
  totalSize: number
}

/**
 * Компонент управления настройками кэширования
 * Позволяет просматривать и управлять локальным кэшем IndexedDB
 */
export function CacheSettings() {
  const [isLoading, setIsLoading] = useState(false)
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null)
  const [clearingProgress, setClearingProgress] = useState(0)

  // Загрузка статистики кэша
  const loadCacheStats = useCallback(async () => {
    setIsLoading(true)
    try {
      // Здесь должна быть логика получения статистики из IndexedDB
      // Пока используем заглушку
      const stats: CacheStats = {
        previewCache: {
          count: 150,
          size: 52428800, // 50MB
        },
        frameCache: {
          count: 450,
          size: 157286400, // 150MB
        },
        recognitionCache: {
          count: 25,
          size: 10485760, // 10MB
        },
        totalSize: 220200960, // 210MB
      }

      setCacheStats(stats)
    } catch (error) {
      console.error("Ошибка загрузки статистики кэша:", error)
      toast.error("Не удалось загрузить статистику кэша")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Очистка кэша превью
  const clearPreviewCache = useCallback(async () => {
    setClearingProgress(0)
    try {
      // Имитация процесса очистки
      for (let i = 0; i <= 100; i += 10) {
        setClearingProgress(i)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      toast.success("Кэш превью очищен")

      await loadCacheStats()
    } catch (error) {
      console.error("Ошибка очистки кэша превью:", error)
      toast.error("Не удалось очистить кэш превью")
    } finally {
      setClearingProgress(0)
    }
  }, [loadCacheStats])

  // Очистка кэша кадров
  const clearFrameCache = useCallback(async () => {
    setClearingProgress(0)
    try {
      // Имитация процесса очистки
      for (let i = 0; i <= 100; i += 10) {
        setClearingProgress(i)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      toast.success("Кэш кадров очищен")

      await loadCacheStats()
    } catch (error) {
      console.error("Ошибка очистки кэша кадров:", error)
      toast.error("Не удалось очистить кэш кадров")
    } finally {
      setClearingProgress(0)
    }
  }, [loadCacheStats])

  // Очистка кэша распознавания
  const clearRecognitionCache = useCallback(async () => {
    setClearingProgress(0)
    try {
      // Имитация процесса очистки
      for (let i = 0; i <= 100; i += 10) {
        setClearingProgress(i)
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      toast.success("Кэш распознавания очищен")

      await loadCacheStats()
    } catch (error) {
      console.error("Ошибка очистки кэша распознавания:", error)
      toast.error("Не удалось очистить кэш распознавания")
    } finally {
      setClearingProgress(0)
    }
  }, [loadCacheStats])

  // Очистка всего кэша
  const clearAllCache = useCallback(async () => {
    setClearingProgress(0)
    try {
      // Имитация процесса очистки
      for (let i = 0; i <= 100; i += 5) {
        setClearingProgress(i)
        await new Promise((resolve) => setTimeout(resolve, 50))
      }

      toast.success("Весь кэш очищен")

      await loadCacheStats()
    } catch (error) {
      console.error("Ошибка очистки всего кэша:", error)
      toast.error("Не удалось очистить весь кэш")
    } finally {
      setClearingProgress(0)
    }
  }, [loadCacheStats])

  // Загрузка статистики при монтировании
  useEffect(() => {
    void loadCacheStats()
  }, [loadCacheStats])

  if (isLoading || !cacheStats) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Управление кэшем
          </CardTitle>
          <CardDescription>Настройки локального кэширования данных в браузере</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Общая статистика */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Общий размер кэша</span>
              <span className="text-muted-foreground">{formatFileSize(cacheStats.totalSize)}</span>
            </div>
            <Progress value={(cacheStats.totalSize / (500 * 1024 * 1024)) * 100} className="h-2" />
            <p className="text-xs text-muted-foreground">
              Используется {formatFileSize(cacheStats.totalSize)} из 500 MB
            </p>
          </div>

          <Separator />

          {/* Кэш превью */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Кэш превью</h4>
                <p className="text-xs text-muted-foreground">
                  {cacheStats.previewCache.count} элементов, {formatFileSize(cacheStats.previewCache.size)}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={clearPreviewCache} disabled={clearingProgress > 0}>
                <Trash2 className="mr-2 h-4 w-4" />
                Очистить
              </Button>
            </div>
          </div>

          {/* Кэш кадров */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Кэш кадров Timeline</h4>
                <p className="text-xs text-muted-foreground">
                  {cacheStats.frameCache.count} кадров, {formatFileSize(cacheStats.frameCache.size)}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={clearFrameCache} disabled={clearingProgress > 0}>
                <Trash2 className="mr-2 h-4 w-4" />
                Очистить
              </Button>
            </div>
          </div>

          {/* Кэш распознавания */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="text-sm font-medium">Кэш распознавания</h4>
                <p className="text-xs text-muted-foreground">
                  {cacheStats.recognitionCache.count} результатов, {formatFileSize(cacheStats.recognitionCache.size)}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={clearRecognitionCache} disabled={clearingProgress > 0}>
                <Trash2 className="mr-2 h-4 w-4" />
                Очистить
              </Button>
            </div>
          </div>

          <Separator />

          {/* Прогресс очистки */}
          {clearingProgress > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Очистка кэша...</span>
                <span>{clearingProgress}%</span>
              </div>
              <Progress value={clearingProgress} className="h-2" />
            </div>
          )}

          {/* Кнопка очистки всего */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <span>Очистка кэша может замедлить загрузку медиафайлов</span>
            </div>
            <Button variant="destructive" onClick={clearAllCache} disabled={clearingProgress > 0}>
              <Trash2 className="mr-2 h-4 w-4" />
              Очистить весь кэш
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Информация о хранилище */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Хранилище браузера
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Технология хранения</span>
              <span className="font-medium">IndexedDB</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Максимальный размер</span>
              <span className="font-medium">500 MB</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Автоочистка</span>
              <span className="font-medium">После 30 дней</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
