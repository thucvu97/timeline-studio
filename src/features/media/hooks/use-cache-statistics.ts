import { useCallback, useEffect, useState } from "react"

import { CacheStatistics, indexedDBCacheService } from "../services/indexeddb-cache-service"

interface UseCacheStatisticsReturn {
  statistics: CacheStatistics | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useCacheStatistics(): UseCacheStatisticsReturn {
  const [statistics, setStatistics] = useState<CacheStatistics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStatistics = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const stats = await indexedDBCacheService.getCacheStatistics()
      setStatistics(stats)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load cache statistics")
      setStatistics(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadStatistics()
  }, [loadStatistics])

  return {
    statistics,
    isLoading,
    error,
    refetch: loadStatistics,
  }
}