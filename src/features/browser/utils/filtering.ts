import type { FilterConfig, ListItem } from "../types/list"

/**
 * Фильтрует массив элементов по заданным критериям
 * 
 * @param items - Массив элементов для фильтрации
 * @param filters - Конфигурация фильтров
 * @param getSearchableText - Функция для получения текста для поиска
 * @param matchesFilter - Опциональная функция для дополнительной фильтрации по типу
 * @param isFavorite - Опциональная функция для проверки избранного
 * @returns Отфильтрованный массив элементов
 */
export function filterItems<T extends ListItem>(
  items: T[],
  filters: FilterConfig,
  getSearchableText: (item: T) => string[],
  matchesFilter?: (item: T, filterType: string) => boolean,
  isFavorite?: (item: T) => boolean
): T[] {
  if (!items || items.length === 0) {
    return items
  }

  let filtered = [...items]

  // Фильтрация по поисковому запросу
  if (filters.searchQuery) {
    const query = filters.searchQuery.toLowerCase().trim()
    if (query) {
      filtered = filtered.filter((item) => {
        const searchableTexts = getSearchableText(item)
        return searchableTexts.some((text) => 
          text && text.toLowerCase().includes(query)
        )
      })
    }
  }

  // Фильтрация по избранному
  if (filters.showFavoritesOnly && isFavorite) {
    filtered = filtered.filter((item) => isFavorite(item))
  }

  // Фильтрация по типу (если не "all")
  if (filters.filterType && filters.filterType !== "all" && matchesFilter) {
    filtered = filtered.filter((item) => matchesFilter(item, filters.filterType))
  }

  return filtered
}

/**
 * Вспомогательная функция для безопасного получения строкового значения
 * 
 * @param value - Значение любого типа
 * @returns Строковое представление значения
 */
export function safeStringValue(value: any): string {
  if (value == null) return ""
  return String(value)
}

/**
 * Проверяет, соответствует ли элемент фильтру по расширению файла
 * 
 * @param fileName - Имя файла
 * @param extension - Расширение для проверки
 * @returns true если файл имеет указанное расширение
 */
export function matchesExtension(fileName: string, extension: string): boolean {
  if (!fileName || !extension) return false
  const fileExt = fileName.split(".").pop()?.toLowerCase() || ""
  return fileExt === extension.toLowerCase()
}

/**
 * Проверяет, соответствует ли элемент одному из расширений
 * 
 * @param fileName - Имя файла
 * @param extensions - Массив расширений для проверки
 * @returns true если файл имеет одно из указанных расширений
 */
export function matchesAnyExtension(fileName: string, extensions: string[]): boolean {
  if (!fileName || !extensions || extensions.length === 0) return false
  return extensions.some((ext) => matchesExtension(fileName, ext))
}

/**
 * Фильтрует элементы по категории
 * 
 * @param category - Категория элемента
 * @param filterCategory - Категория фильтра
 * @returns true если категории совпадают
 */
export function matchesCategory(category: string | undefined, filterCategory: string): boolean {
  if (!category || !filterCategory) return false
  return category.toLowerCase() === filterCategory.toLowerCase()
}

/**
 * Фильтрует элементы по сложности
 * 
 * @param complexity - Сложность элемента
 * @param filterComplexity - Сложность фильтра
 * @returns true если сложности совпадают
 */
export function matchesComplexity(complexity: string | undefined, filterComplexity: string): boolean {
  if (!complexity || !filterComplexity) return false
  return complexity.toLowerCase() === filterComplexity.toLowerCase()
}

/**
 * Фильтрует элементы по тегам
 * 
 * @param tags - Теги элемента
 * @param filterTag - Тег для поиска
 * @returns true если элемент содержит указанный тег
 */
export function matchesTag(tags: string[] | undefined, filterTag: string): boolean {
  if (!tags || tags.length === 0 || !filterTag) return false
  const lowerFilterTag = filterTag.toLowerCase()
  return tags.some((tag) => tag.toLowerCase().includes(lowerFilterTag))
}