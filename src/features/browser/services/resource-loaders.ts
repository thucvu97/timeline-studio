import type { BaseEffect } from "@/features/effects/types"
import type { VideoFilter } from "@/features/filters/types/filters"
import type { Transition } from "@/features/transitions/types/transitions"

import type { LoadResult } from "../types/effects-provider"

/**
 * Ленивые загрузчики ресурсов для оптимизации памяти
 * Используют динамические импорты вместо статических
 */

/**
 * Загрузчик эффектов с ленивой загрузкой
 */
export async function loadEffectsLazy(): Promise<LoadResult<BaseEffect[]>> {
  try {
    // Динамический импорт мигрированных эффектов
    const module = await import("@/features/effects/data/effects-loader")
    const effects = module.allMigratedEffects || []

    return {
      success: true,
      data: effects,
      source: "built-in",
      timestamp: Date.now(),
    }
  } catch (error) {
    console.error("Failed to load effects:", error)
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : String(error),
      source: "built-in",
      timestamp: Date.now(),
    }
  }
}

/**
 * Загрузчик фильтров с ленивой загрузкой
 */
export async function loadFiltersLazy(): Promise<LoadResult<VideoFilter[]>> {
  try {
    const module = await import("@/features/filters/data/filters.json")
    const data = module.default as any
    const filters = data.filters || [] // Фильтры находятся под ключом 'filters'

    return {
      success: true,
      data: filters as VideoFilter[],
      source: "built-in",
      timestamp: Date.now(),
    }
  } catch (error) {
    console.error("Failed to load filters:", error)
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : String(error),
      source: "built-in",
      timestamp: Date.now(),
    }
  }
}

/**
 * Загрузчик переходов с ленивой загрузкой
 */
export async function loadTransitionsLazy(): Promise<LoadResult<Transition[]>> {
  try {
    const module = await import("@/features/transitions/data/transitions.json")
    const data = module.default as any
    const transitions = data.transitions || [] // Переходы находятся под ключом 'transitions'

    return {
      success: true,
      data: transitions as Transition[],
      source: "built-in",
      timestamp: Date.now(),
    }
  } catch (error) {
    console.error("Failed to load transitions:", error)
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : String(error),
      source: "built-in",
      timestamp: Date.now(),
    }
  }
}

/**
 * Пакетная загрузка всех ресурсов с возможностью отмены
 */
export async function loadAllResourcesLazy(signal?: AbortSignal): Promise<{
  effects: LoadResult<BaseEffect[]>
  filters: LoadResult<VideoFilter[]>
  transitions: LoadResult<Transition[]>
}> {
  const loadPromises = [loadEffectsLazy(), loadFiltersLazy(), loadTransitionsLazy()]

  // Проверяем отмену
  if (signal?.aborted) {
    throw new Error("Loading was aborted")
  }

  const [effects, filters, transitions] = await Promise.allSettled(loadPromises)

  return {
    effects:
      effects.status === "fulfilled"
        ? effects.value
        : {
          success: false,
          data: [],
          error: effects.status === "rejected" ? String(effects.reason) : "Unknown error",
          source: "built-in",
          timestamp: Date.now(),
        },
    filters:
      filters.status === "fulfilled"
        ? filters.value
        : {
          success: false,
          data: [],
          error: filters.status === "rejected" ? String(filters.reason) : "Unknown error",
          source: "built-in",
          timestamp: Date.now(),
        },
    transitions:
      transitions.status === "fulfilled"
        ? transitions.value
        : {
          success: false,
          data: [],
          error: transitions.status === "rejected" ? String(transitions.reason) : "Unknown error",
          source: "built-in",
          timestamp: Date.now(),
        },
  }
}

/**
 * Загрузка конкретной категории ресурсов по требованию
 */
export async function loadResourcesByCategory(
  type: "effects" | "filters" | "transitions",
  category: string,
  signal?: AbortSignal,
): Promise<LoadResult<any[]>> {
  if (signal?.aborted) {
    throw new Error("Loading was aborted")
  }

  let result: LoadResult<any[]>

  switch (type) {
    case "effects":
      result = await loadEffectsLazy()
      break
    case "filters":
      result = await loadFiltersLazy()
      break
    case "transitions":
      result = await loadTransitionsLazy()
      break
    default:
      return {
        success: false,
        data: [],
        error: `Unknown resource type: ${type}`,
        source: "built-in",
        timestamp: Date.now(),
      }
  }

  if (!result.success) {
    return result
  }

  // Фильтруем по категории
  const filteredData = result.data.filter((item: any) => {
    return item.category === category
  })

  return {
    ...result,
    data: filteredData,
  }
}

/**
 * Оптимизированная загрузка с чанкингом для больших файлов
 */
export async function* loadResourcesInChunks(
  type: "effects" | "filters" | "transitions",
  chunkSize = 50,
  signal?: AbortSignal,
): AsyncGenerator<LoadResult<any[]>, void, unknown> {
  const result = await (type === "effects"
    ? loadEffectsLazy()
    : type === "filters"
      ? loadFiltersLazy()
      : loadTransitionsLazy())

  if (!result.success) {
    yield result
    return
  }

  const data = result.data
  for (let i = 0; i < data.length; i += chunkSize) {
    if (signal?.aborted) {
      throw new Error("Loading was aborted")
    }

    const chunk = data.slice(i, i + chunkSize)
    yield {
      ...result,
      data: chunk,
    }

    // Небольшая задержка между чанками для не блокирования UI
    await new Promise((resolve) => setTimeout(resolve, 1))
  }
}
