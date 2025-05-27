import { Transition } from "@/types/transitions"

/**
 * Интерфейс для сырых данных перехода из JSON
 */
interface RawTransitionData {
  id: string
  type: string
  labels: {
    ru: string
    en: string
    es?: string
    fr?: string
    de?: string
  }
  description: {
    ru: string
    en: string
  }
  category: string
  complexity: string
  tags: string[]
  duration: {
    min: number
    max: number
    default: number
  }
  parameters?: {
    direction?: string
    easing?: string
    intensity?: number
    scale?: number
    smoothness?: number
  }
  ffmpegTemplate: string // Шаблон FFmpeg команды
}

/**
 * Интерфейс для данных переходов из JSON файла
 */
interface TransitionsDataFile {
  version: string
  lastUpdated: string
  totalTransitions: number
  categories: string[]
  transitions: RawTransitionData[]
}

/**
 * Обрабатывает сырые данные переходов из JSON и преобразует их в типизированные объекты
 * @param rawTransitions - Массив сырых данных переходов
 * @returns Массив обработанных переходов
 */
export function processTransitions(rawTransitions: RawTransitionData[]): Transition[] {
  return rawTransitions.map((rawTransition) => ({
    id: rawTransition.id,
    type: rawTransition.type,
    labels: rawTransition.labels,
    description: rawTransition.description,
    category: rawTransition.category as Transition["category"],
    complexity: rawTransition.complexity as Transition["complexity"],
    tags: rawTransition.tags as Transition["tags"],
    duration: rawTransition.duration,
    parameters: {
      direction: rawTransition.parameters?.direction as "left" | "right" | "up" | "down" | "center" | undefined,
      easing: rawTransition.parameters?.easing as
        | "linear"
        | "ease-in"
        | "ease-out"
        | "ease-in-out"
        | "bounce"
        | undefined,
      intensity: rawTransition.parameters?.intensity,
      scale: rawTransition.parameters?.scale,
      smoothness: rawTransition.parameters?.smoothness,
    },
    ffmpegCommand: createFFmpegCommand(rawTransition.ffmpegTemplate),
  }))
}

/**
 * Создает функцию FFmpeg команды из шаблона
 * @param template - Шаблон FFmpeg команды
 * @returns Функция, которая генерирует FFmpeg команду
 */
function createFFmpegCommand(template: string) {
  return (params: {
    fps: number
    width?: number
    height?: number
    scale?: number
    duration?: number
  }) => {
    let command = template

    // Заменяем плейсхолдеры на реальные значения
    command = command.replace(/{fps}/g, params.fps.toString())
    command = command.replace(/{width}/g, (params.width || 1920).toString())
    command = command.replace(/{height}/g, (params.height || 1080).toString())
    command = command.replace(/{scale}/g, (params.scale || 1.0).toString())
    command = command.replace(/{duration}/g, (params.duration || 1.0).toString())

    return command
  }
}

/**
 * Валидирует структуру данных переходов
 * @param data - Данные для валидации
 * @returns true если данные валидны, false в противном случае
 */
export function validateTransitionsData(data: any): data is TransitionsDataFile {
  if (!data || typeof data !== "object") {
    return false
  }

  // Проверяем обязательные поля
  if (!data.version || !data.transitions || !Array.isArray(data.transitions)) {
    return false
  }

  // Проверяем структуру каждого перехода
  return data.transitions.every((transition: any) => {
    return (
      transition &&
      typeof transition.id === "string" &&
      typeof transition.type === "string" &&
      typeof transition.category === "string" &&
      typeof transition.complexity === "string" &&
      Array.isArray(transition.tags) &&
      transition.labels &&
      typeof transition.labels.ru === "string" &&
      typeof transition.labels.en === "string" &&
      transition.description &&
      typeof transition.description.ru === "string" &&
      typeof transition.description.en === "string" &&
      transition.duration &&
      typeof transition.duration.min === "number" &&
      typeof transition.duration.max === "number" &&
      typeof transition.duration.default === "number"
    )
  })
}

/**
 * Создает fallback переход для случаев ошибок
 * @param id - ID перехода
 * @returns Базовый переход
 */
export function createFallbackTransition(id: string): Transition {
  return {
    id,
    type: id,
    labels: {
      ru: id.charAt(0).toUpperCase() + id.slice(1),
      en: id.charAt(0).toUpperCase() + id.slice(1),
    },
    description: {
      ru: `Базовый переход ${id}`,
      en: `Basic transition ${id}`,
    },
    category: "basic",
    complexity: "basic",
    tags: ["fallback"],
    duration: { min: 0.5, max: 2.0, default: 1.0 },
    parameters: {
      easing: "ease-in-out",
      intensity: 1.0,
    },
    ffmpegCommand: (params) => {
      // Простая fallback команда
      return `fade=t=in:st=0:d=${params.duration || 1.0}`
    },
  }
}

/**
 * Фильтрует переходы по поисковому запросу
 * @param transitions - Массив переходов
 * @param query - Поисковый запрос
 * @param lang - Язык для поиска
 * @returns Отфильтрованный массив переходов
 */
export function searchTransitions(transitions: Transition[], query: string, lang: "ru" | "en" = "ru"): Transition[] {
  if (!query.trim()) {
    return transitions
  }

  const lowercaseQuery = query.toLowerCase()

  return transitions.filter(
    (transition) =>
      (transition.labels?.[lang] || transition.id || "").toLowerCase().includes(lowercaseQuery) ||
      (transition.description?.[lang] || "").toLowerCase().includes(lowercaseQuery) ||
      (transition.tags || []).some((tag) => tag.toLowerCase().includes(lowercaseQuery)),
  )
}

/**
 * Группирует переходы по указанному критерию
 * @param transitions - Массив переходов
 * @param groupBy - Критерий группировки
 * @returns Объект с группами переходов
 */
export function groupTransitions(
  transitions: Transition[],
  groupBy: "category" | "complexity" | "tags" | "duration" | "none",
): Record<string, Transition[]> {
  if (groupBy === "none") {
    return { all: transitions }
  }

  const groups: Record<string, Transition[]> = {}

  transitions.forEach((transition) => {
    let groupKey = ""

    switch (groupBy) {
      case "category":
        groupKey = transition.category || "other"
        break
      case "complexity":
        groupKey = transition.complexity || "basic"
        break
      case "tags":
        groupKey = transition.tags && transition.tags.length > 0 ? transition.tags[0] : "untagged"
        break
      case "duration":
        const duration = transition.duration?.default || 1.0
        if (duration < 1.0) groupKey = "short"
        else if (duration < 2.0) groupKey = "medium"
        else groupKey = "long"
        break
      default:
        groupKey = "ungrouped"
    }

    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(transition)
  })

  return groups
}

/**
 * Сортирует переходы по указанному критерию
 * @param transitions - Массив переходов
 * @param sortBy - Критерий сортировки
 * @param order - Порядок сортировки
 * @returns Отсортированный массив переходов
 */
export function sortTransitions(
  transitions: Transition[],
  sortBy: "name" | "complexity" | "category" | "duration",
  order: "asc" | "desc" = "asc",
): Transition[] {
  const sorted = [...transitions].sort((a, b) => {
    let result = 0

    switch (sortBy) {
      case "name":
        const nameA = (a.labels?.ru || a.id).toLowerCase()
        const nameB = (b.labels?.ru || b.id).toLowerCase()
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

      case "duration":
        const durationA = a.duration?.default || 1.0
        const durationB = b.duration?.default || 1.0
        result = durationA - durationB
        break

      default:
        result = 0
    }

    return order === "asc" ? result : -result
  })

  return sorted
}
