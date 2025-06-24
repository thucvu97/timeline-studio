import { useCallback, useEffect, useMemo, useState } from "react"

import type { VideoEffect } from "@/features/effects/types"
import type { VideoFilter } from "@/features/filters/types/filters"
import type { Transition } from "@/features/transitions/types/transitions"

import { useEffectsProvider } from "../providers/effects-provider"

import type {
  LoadingState,
  Resource,
  ResourceSource,
  ResourceStats,
  ResourceType,
  SearchOptions,
} from "../types/effects-provider"

/**
 * Хук для получения всех эффектов
 */
export function useEffects(source?: ResourceSource) {
  const { api } = useEffectsProvider()
  const [effects, setEffects] = useState<VideoEffect[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const updateEffects = () => {
      setEffects(api.getEffects(source))
      setLoading(false)
    }

    updateEffects()

    // Подписываемся на обновления
    const unsubscribe = api.onResourcesUpdate((type, _resources) => {
      if (type === "effects") {
        updateEffects()
      }
    })

    return unsubscribe
  }, [api, source])

  return { effects, loading }
}

/**
 * Хук для получения всех фильтров
 */
export function useFilters(source?: ResourceSource) {
  const { api } = useEffectsProvider()
  const [filters, setFilters] = useState<VideoFilter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const updateFilters = () => {
      setFilters(api.getFilters(source))
      setLoading(false)
    }

    updateFilters()

    // Подписываемся на обновления
    const unsubscribe = api.onResourcesUpdate((type, _resources) => {
      if (type === "filters") {
        updateFilters()
      }
    })

    return unsubscribe
  }, [api, source])

  return { filters, loading }
}

/**
 * Хук для получения всех переходов
 */
export function useTransitions(source?: ResourceSource) {
  const { api } = useEffectsProvider()
  const [transitions, setTransitions] = useState<Transition[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const updateTransitions = () => {
      setTransitions(api.getTransitions(source))
      setLoading(false)
    }

    updateTransitions()

    // Подписываемся на обновления
    const unsubscribe = api.onResourcesUpdate((type, _resources) => {
      if (type === "transitions") {
        updateTransitions()
      }
    })

    return unsubscribe
  }, [api, source])

  return { transitions, loading }
}

/**
 * Хук для получения ресурсов по типу
 */
export function useResources(type: ResourceType, source?: ResourceSource) {
  const { api } = useEffectsProvider()
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const updateResources = () => {
      setResources(api.getResources(type, source))
      setLoading(false)
    }

    updateResources()

    // Подписываемся на обновления
    const unsubscribe = api.onResourcesUpdate((resourceType, _updatedResources) => {
      if (resourceType === type) {
        updateResources()
      }
    })

    return unsubscribe
  }, [api, type, source])

  return { resources, loading }
}

/**
 * Хук для получения ресурса по ID
 */
export function useResourceById(type: ResourceType, id: string) {
  const { api } = useEffectsProvider()
  const [resource, setResource] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const updateResource = () => {
      setResource(api.getResourceById(type, id))
      setLoading(false)
    }

    updateResource()

    // Подписываемся на обновления
    const unsubscribe = api.onResourcesUpdate((resourceType) => {
      if (resourceType === type) {
        updateResource()
      }
    })

    return unsubscribe
  }, [api, type, id])

  return { resource, loading }
}

/**
 * Хук для поиска ресурсов
 */
export function useResourcesSearch(type: ResourceType, options: SearchOptions) {
  const { api } = useEffectsProvider()
  const [results, setResults] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)

  // Мемоизируем опции для предотвращения лишних перерендеров
  const memoizedOptions = useMemo(
    () => options,
    [
      options.query,
      options.category,
      JSON.stringify(options.tags),
      options.complexity,
      options.source,
      options.limit,
      options.offset,
    ],
  )

  useEffect(() => {
    const updateResults = () => {
      setResults(api.searchResources(type, memoizedOptions))
      setLoading(false)
    }

    updateResults()

    // Подписываемся на обновления
    const unsubscribe = api.onResourcesUpdate((resourceType) => {
      if (resourceType === type) {
        updateResults()
      }
    })

    return unsubscribe
  }, [api, type, memoizedOptions])

  return { results, loading }
}

/**
 * Хук для получения ресурсов по категории
 */
export function useResourcesByCategory(type: ResourceType, category: string) {
  return useResourcesSearch(type, { category })
}

/**
 * Хук для получения ресурсов по тегам
 */
export function useResourcesByTags(type: ResourceType, tags: string[]) {
  return useResourcesSearch(type, { tags })
}

/**
 * Хук для получения ресурсов по сложности
 */
export function useResourcesByComplexity(type: ResourceType, complexity: string) {
  return useResourcesSearch(type, { complexity })
}

/**
 * Хук для получения состояния загрузки
 */
export function useLoadingState() {
  const { api } = useEffectsProvider()
  const [loadingState, setLoadingState] = useState<LoadingState>(api.getLoadingState())

  useEffect(() => {
    const unsubscribe = api.onLoadingStateChange(setLoadingState)
    return unsubscribe
  }, [api])

  return loadingState
}

/**
 * Хук для получения статистики ресурсов
 */
export function useResourcesStats() {
  const { api } = useEffectsProvider()
  const [stats, setStats] = useState<ResourceStats>(api.getStats())

  useEffect(() => {
    const updateStats = () => {
      setStats(api.getStats())
    }

    updateStats()

    // Обновляем статистику при изменении ресурсов
    const unsubscribe = api.onResourcesUpdate(() => {
      updateStats()
    })

    return unsubscribe
  }, [api])

  return stats
}

/**
 * Хук для управления источниками данных
 */
export function useResourceSources() {
  const { api } = useEffectsProvider()
  const loadingState = useLoadingState()

  const loadSource = useCallback(
    async (source: ResourceSource) => {
      return api.loadSource(source)
    },
    [api],
  )

  const refreshSource = useCallback(
    async (source: ResourceSource) => {
      return api.refreshSource(source)
    },
    [api],
  )

  const isSourceLoaded = useCallback(
    (source: ResourceSource) => {
      return api.isSourceLoaded(source)
    },
    [api],
  )

  const getSourceConfig = useCallback(
    (source: ResourceSource) => {
      return api.getSourceConfig(source)
    },
    [api],
  )

  const updateSourceConfig = useCallback(
    (source: ResourceSource, config: any) => {
      api.updateSourceConfig(source, config)
    },
    [api],
  )

  return {
    loadSource,
    refreshSource,
    isSourceLoaded,
    getSourceConfig,
    updateSourceConfig,
    loadingState,
  }
}

/**
 * Хук для управления кэшем
 */
export function useResourcesCache() {
  const { api } = useEffectsProvider()

  const clearCache = useCallback(
    (type?: ResourceType) => {
      api.clearCache(type)
    },
    [api],
  )

  const clearSourceCache = useCallback(
    (source: ResourceSource) => {
      api.clearSourceCache(source)
    },
    [api],
  )

  const invalidateCache = useCallback(() => {
    api.invalidateCache()
  }, [api])

  const getCacheSize = useCallback(() => {
    return api.getCacheSize()
  }, [api])

  return {
    clearCache,
    clearSourceCache,
    invalidateCache,
    getCacheSize,
  }
}

/**
 * Унифицированный хук-адаптер для Browser компонента
 * Заменяет отдельные useEffectsAdapter, useFiltersAdapter, useTransitionsAdapter
 */
export function useResourcesAdapter(type: ResourceType, options: SearchOptions = {}) {
  const { results: items, loading } = useResourcesSearch(type, options)
  const loadingState = useLoadingState()
  const stats = useResourcesStats()

  return useMemo(
    () => ({
      items,
      loading: loading || loadingState.isLoading,
      error: loadingState.error,
      stats,

      // Методы для поиска и фильтрации
      search: (query: string) => ({ ...options, query }),
      filterByCategory: (category: string) => ({ ...options, category }),
      filterByTag: (tag: string) => ({ ...options, tags: [tag] }),
      filterByTags: (tags: string[]) => ({ ...options, tags }),
      filterByComplexity: (complexity: string) => ({ ...options, complexity }),

      // Пагинация
      paginate: (offset: number, limit: number) => ({ ...options, offset, limit }),
    }),
    [items, loading, loadingState, stats, options],
  )
}

// Типизированные версии хуков для конкретных ресурсов
export const useEffectsSearch = (options: SearchOptions) => useResourcesSearch("effects", options)

export const useFiltersSearch = (options: SearchOptions) => useResourcesSearch("filters", options)

export const useTransitionsSearch = (options: SearchOptions) => useResourcesSearch("transitions", options)
