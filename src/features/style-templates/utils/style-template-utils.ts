import { StyleTemplate, StyleTemplateFilter, StyleTemplateSortField } from "../types"

/**
 * Получает сокращение для категории шаблона
 */
export function getCategoryAbbreviation(category: StyleTemplate["category"]): string {
  const abbreviations = {
    intro: "ИНТ",
    outro: "КОН",
    transition: "ПЕР",
    title: "ТИТ",
    "lower-third": "НИЖ",
    overlay: "НАЛ",
  } as const

  return abbreviations[category] || ""
}

/**
 * Получает сокращение для стиля шаблона
 */
export function getStyleAbbreviation(style: StyleTemplate["style"]): string {
  const abbreviations = {
    modern: "СОВ",
    vintage: "ВИН",
    minimal: "МИН",
    corporate: "КОР",
    creative: "КРЕ",
    cinematic: "КИН",
  } as const

  return abbreviations[style] || ""
}

/**
 * Фильтрует шаблоны по заданным критериям
 */
export function filterTemplates(templates: StyleTemplate[], filter: StyleTemplateFilter): StyleTemplate[] {
  return templates.filter((template) => {
    // Фильтр по категории
    if (filter.category && template.category !== filter.category) {
      return false
    }

    // Фильтр по стилю
    if (filter.style && template.style !== filter.style) {
      return false
    }

    // Фильтр по наличию текста
    if (filter.hasText !== undefined && template.hasText !== filter.hasText) {
      return false
    }

    // Фильтр по наличию анимации
    if (filter.hasAnimation !== undefined && template.hasAnimation !== filter.hasAnimation) {
      return false
    }

    // Фильтр по длительности
    if (filter.duration) {
      const { min, max } = filter.duration
      if (min !== undefined && template.duration < min) {
        return false
      }
      if (max !== undefined && template.duration > max) {
        return false
      }
    }

    // Фильтр по соотношению сторон
    if (filter.aspectRatio && template.aspectRatio !== filter.aspectRatio) {
      return false
    }

    return true
  })
}

/**
 * Сортирует шаблоны по заданному полю и направлению
 */
export function sortTemplates(
  templates: StyleTemplate[],
  sortBy: StyleTemplateSortField,
  sortOrder: "asc" | "desc",
): StyleTemplate[] {
  const sorted = [...templates].sort((a, b) => {
    let comparison = 0

    switch (sortBy) {
      case "name":
        comparison = a.name.ru.localeCompare(b.name.ru)
        break
      case "duration":
        comparison = a.duration - b.duration
        break
      case "category":
        comparison = a.category.localeCompare(b.category)
        break
      case "style":
        comparison = a.style.localeCompare(b.style)
        break
      default:
        return 0
    }

    return sortOrder === "desc" ? -comparison : comparison
  })

  return sorted
}

/**
 * Группирует шаблоны по заданному полю
 */
export function groupTemplates(
  templates: StyleTemplate[],
  groupBy: "category" | "style" | "none",
): Record<string, StyleTemplate[]> {
  if (groupBy === "none") {
    return { all: templates }
  }

  return templates.reduce<Record<string, StyleTemplate[]>>((groups, template) => {
    const key = template[groupBy]
    if (!groups[key]) {
      groups[key] = []
    }
    groups[key].push(template)
    return groups
  }, {})
}

/**
 * Ищет шаблоны по тексту в названии, описании или тегах
 */
export function searchTemplates(
  templates: StyleTemplate[],
  query: string,
  language: "ru" | "en" = "ru",
): StyleTemplate[] {
  if (!query.trim()) {
    return templates
  }

  const searchQuery = query.toLowerCase().trim()

  return templates.filter((template) => {
    // Поиск в названии
    if (template.name[language].toLowerCase().includes(searchQuery)) {
      return true
    }

    // Поиск в описании
    if (template.description?.[language]?.toLowerCase().includes(searchQuery)) {
      return true
    }

    // Поиск в тегах
    if (template.tags?.[language]?.some((tag) => tag.toLowerCase().includes(searchQuery))) {
      return true
    }

    return false
  })
}

/**
 * Получает локализованное название категории
 */
export function getCategoryName(category: StyleTemplate["category"], language: "ru" | "en" = "ru"): string {
  const names = {
    intro: { ru: "Интро", en: "Intro" },
    outro: { ru: "Концовка", en: "Outro" },
    transition: { ru: "Переход", en: "Transition" },
    title: { ru: "Заголовок", en: "Title" },
    "lower-third": { ru: "Нижняя треть", en: "Lower Third" },
    overlay: { ru: "Наложение", en: "Overlay" },
  } as const

  return names[category]?.[language] || category
}

/**
 * Получает локализованное название стиля
 */
export function getStyleName(style: StyleTemplate["style"], language: "ru" | "en" = "ru"): string {
  const names = {
    modern: { ru: "Современный", en: "Modern" },
    vintage: { ru: "Винтажный", en: "Vintage" },
    minimal: { ru: "Минимализм", en: "Minimal" },
    corporate: { ru: "Корпоративный", en: "Corporate" },
    creative: { ru: "Креативный", en: "Creative" },
    cinematic: { ru: "Кинематографичный", en: "Cinematic" },
  } as const

  return names[style]?.[language] || style
}

/**
 * Валидирует шаблон на соответствие типу StyleTemplate
 */
export function validateTemplate(template: any): template is StyleTemplate {
  return (
    typeof template === "object" &&
    template !== null &&
    typeof template.id === "string" &&
    typeof template.name === "object" &&
    typeof template.name.ru === "string" &&
    typeof template.name.en === "string" &&
    typeof template.category === "string" &&
    typeof template.style === "string" &&
    typeof template.aspectRatio === "string" &&
    typeof template.duration === "number" &&
    typeof template.hasText === "boolean" &&
    typeof template.hasAnimation === "boolean" &&
    Array.isArray(template.elements)
  )
}

/**
 * Создает уникальный ID для шаблона на основе его свойств
 */
export function generateTemplateId(template: Partial<StyleTemplate>): string {
  const { name, category, style } = template
  const baseName = name?.en || name?.ru || "template"
  const normalizedName = baseName.toLowerCase().replace(/[^a-z0-9]/g, "-")
  const timestamp = Date.now().toString(36)

  return `${category || "unknown"}-${style || "default"}-${normalizedName}-${timestamp}`
}
