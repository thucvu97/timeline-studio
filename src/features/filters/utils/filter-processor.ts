import { VideoFilter } from "@/types/filters"

/**
 * Интерфейс для сырых данных фильтра из JSON
 */
interface RawFilterData {
  id: string
  name: string
  category: string
  complexity: string
  tags: string[]
  description: {
    ru: string
    en: string
  }
  labels: {
    ru: string
    en: string
    es?: string
    fr?: string
    de?: string
  }
  params: Record<string, any>
}

/**
 * Интерфейс для данных фильтров из JSON файла
 */
interface FilterDataFile {
  version: string
  lastUpdated: string
  totalFilters: number
  categories: string[]
  filters: RawFilterData[]
}

/**
 * Обрабатывает сырые данные фильтров из JSON и преобразует их в типизированные объекты
 * @param rawFilters - Массив сырых данных фильтров
 * @returns Массив обработанных фильтров
 */
export function processFilters(rawFilters: RawFilterData[]): VideoFilter[] {
  return rawFilters.map((rawFilter) => ({
    id: rawFilter.id,
    name: rawFilter.name,
    category: rawFilter.category as VideoFilter["category"],
    complexity: rawFilter.complexity as VideoFilter["complexity"],
    tags: rawFilter.tags as VideoFilter["tags"],
    description: rawFilter.description,
    labels: rawFilter.labels,
    params: rawFilter.params,
  }))
}

/**
 * Валидирует структуру данных фильтров
 * @param data - Данные для валидации
 * @returns true если данные валидны, false в противном случае
 */
export function validateFiltersData(data: any): data is FilterDataFile {
  if (!data || typeof data !== "object") {
    return false
  }

  // Проверяем обязательные поля
  if (!data.version || !data.filters || !Array.isArray(data.filters)) {
    return false
  }

  // Проверяем структуру каждого фильтра
  return data.filters.every((filter: any) => {
    return (
      filter &&
      typeof filter.id === "string" &&
      typeof filter.name === "string" &&
      typeof filter.category === "string" &&
      typeof filter.complexity === "string" &&
      Array.isArray(filter.tags) &&
      filter.description &&
      typeof filter.description.ru === "string" &&
      typeof filter.description.en === "string" &&
      filter.labels &&
      typeof filter.labels.ru === "string" &&
      typeof filter.labels.en === "string" &&
      filter.params &&
      typeof filter.params === "object"
    )
  })
}

/**
 * Создает fallback фильтр для случаев ошибок
 * @param id - ID фильтра
 * @returns Базовый фильтр
 */
export function createFallbackFilter(id: string): VideoFilter {
  return {
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
    category: "color-correction",
    complexity: "basic",
    tags: ["fallback"],
    description: {
      ru: `Базовый фильтр ${id}`,
      en: `Basic filter ${id}`,
    },
    labels: {
      ru: id.charAt(0).toUpperCase() + id.slice(1),
      en: id.charAt(0).toUpperCase() + id.slice(1),
    },
    params: {
      brightness: 0,
      contrast: 1,
      saturation: 1,
    },
  }
}

/**
 * Фильтрует фильтры по поисковому запросу
 * @param filters - Массив фильтров
 * @param query - Поисковый запрос
 * @param lang - Язык для поиска
 * @returns Отфильтрованный массив фильтров
 */
export function searchFilters(filters: VideoFilter[], query: string, lang: "ru" | "en" = "ru"): VideoFilter[] {
  if (!query.trim()) {
    return filters
  }

  const lowercaseQuery = query.toLowerCase()

  return filters.filter(
    (filter) =>
      (filter.labels?.[lang] || filter.name || "").toLowerCase().includes(lowercaseQuery) ||
      (filter.description?.[lang] || "").toLowerCase().includes(lowercaseQuery) ||
      (filter.tags || []).some((tag) => tag.toLowerCase().includes(lowercaseQuery)),
  )
}

/**
 * Группирует фильтры по указанному критерию
 * @param filters - Массив фильтров
 * @param groupBy - Критерий группировки
 * @returns Объект с группами фильтров
 */
export function groupFilters(
  filters: VideoFilter[],
  groupBy: "category" | "complexity" | "tags" | "none",
): Record<string, VideoFilter[]> {
  if (groupBy === "none") {
    return { all: filters }
  }

  const groups: Record<string, VideoFilter[]> = {}

  filters.forEach((filter) => {
    let groupKey = ""

    switch (groupBy) {
      case "category":
        groupKey = filter.category || "other"
        break
      case "complexity":
        groupKey = filter.complexity || "basic"
        break
      case "tags":
        groupKey = filter.tags && filter.tags.length > 0 ? filter.tags[0] : "untagged"
        break
      default:
        groupKey = "ungrouped"
    }

    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(filter)
  })

  return groups
}

/**
 * Сортирует фильтры по указанному критерию
 * @param filters - Массив фильтров
 * @param sortBy - Критерий сортировки
 * @param order - Порядок сортировки
 * @returns Отсортированный массив фильтров
 */
export function sortFilters(
  filters: VideoFilter[],
  sortBy: "name" | "complexity" | "category",
  order: "asc" | "desc" = "asc",
): VideoFilter[] {
  const sorted = [...filters].sort((a, b) => {
    let result = 0

    switch (sortBy) {
      case "name":
        const nameA = a.name.toLowerCase()
        const nameB = b.name.toLowerCase()
        result = nameA.localeCompare(nameB)
        break

      case "complexity":
        const complexityOrder = { basic: 0, intermediate: 1, advanced: 2 }
        const complexityA = complexityOrder[a.complexity || "basic"]
        const complexityB = complexityOrder[b.complexity || "basic"]
        result = complexityA - complexityB
        break

      case "category":
        const categoryA = (a.category || "").toLowerCase()
        const categoryB = (b.category || "").toLowerCase()
        result = categoryA.localeCompare(categoryB)
        break

      default:
        result = 0
    }

    return order === "asc" ? result : -result
  })

  return sorted
}
