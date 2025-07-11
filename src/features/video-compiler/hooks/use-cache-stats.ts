import { useCallback, useEffect, useState } from "react"

import { invoke } from "@tauri-apps/api/core"

import type { CacheStats } from "../types/cache"

export interface CacheStatsWithRatios extends CacheStats {
  hit_ratio: number
  preview_hit_ratio: number
}

interface UseCacheStatsReturn {
  stats: CacheStatsWithRatios | null
  isLoading: boolean
  error: string | null
  refreshStats: () => Promise<void>
  clearPreviewCache: () => Promise<boolean>
  clearAllCache: () => Promise<boolean>
}

export function useCacheStats(): UseCacheStatsReturn {
  const [stats, setStats] = useState<CacheStatsWithRatios | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Получить статистику кэша
  const refreshStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      // Теперь бэкенд возвращает CacheStatsWithRatios с уже вычисленными значениями
      const cacheStats = await invoke<CacheStatsWithRatios>("get_cache_stats")
      setStats(cacheStats)
    } catch (err) {
      console.error("Failed to get cache stats:", err)
      setError(err instanceof Error ? err.message : "Не удалось получить статистику кэша")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Очистить кэш превью
  const clearPreviewCache = useCallback(async (): Promise<boolean> => {
    try {
      await invoke("clear_preview_cache")
      await refreshStats() // Обновляем статистику после очистки
      return true
    } catch (err) {
      console.error("Failed to clear preview cache:", err)
      setError(err instanceof Error ? err.message : "Не удалось очистить кэш превью")
      return false
    }
  }, [refreshStats])

  // Очистить весь кэш
  const clearAllCache = useCallback(async (): Promise<boolean> => {
    try {
      await invoke("clear_all_cache")
      await refreshStats() // Обновляем статистику после очистки
      return true
    } catch (err) {
      console.error("Failed to clear all cache:", err)
      setError(err instanceof Error ? err.message : "Не удалось очистить весь кэш")
      return false
    }
  }, [refreshStats])

  // Загружаем статистику при монтировании
  useEffect(() => {
    void refreshStats()
  }, [refreshStats])

  return {
    stats,
    isLoading,
    error,
    refreshStats,
    clearPreviewCache,
    clearAllCache,
  }
}

// Вспомогательные функции для форматирования

export function formatCacheRatio(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`
}

export function formatCacheSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
