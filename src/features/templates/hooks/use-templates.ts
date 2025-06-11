import { MediaTemplate, TEMPLATE_MAP } from "../lib/templates"

/**
 * Hook для получения доступных шаблонов
 */
export function useTemplates() {
  // Собираем все шаблоны из всех категорий
  const allTemplates: MediaTemplate[] = []

  Object.values(TEMPLATE_MAP).forEach((categoryTemplates) => {
    allTemplates.push(...categoryTemplates)
  })

  return {
    templates: allTemplates,
    templatesByCategory: TEMPLATE_MAP,
    getTemplateById: (id: string) => {
      return allTemplates.find((template) => template.id === id)
    },
  }
}
