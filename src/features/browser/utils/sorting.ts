import type { ListItem } from "../types/list"

/**
 * Сортирует массив элементов по заданному полю и направлению
 * 
 * @param items - Массив элементов для сортировки
 * @param sortBy - Поле для сортировки
 * @param sortOrder - Направление сортировки ('asc' или 'desc')
 * @param getValue - Функция для получения значения сортировки из элемента
 * @returns Отсортированный массив элементов
 */
export function sortItems<T extends ListItem>(
  items: T[],
  sortBy: string,
  sortOrder: "asc" | "desc",
  getValue: (item: T, sortBy: string) => string | number
): T[] {
  if (!items || items.length === 0) {
    return items
  }

  // Создаем копию массива для сортировки
  const sorted = [...items]

  sorted.sort((a, b) => {
    const aValue = getValue(a, sortBy)
    const bValue = getValue(b, sortBy)

    // Обработка null/undefined значений
    if (aValue == null && bValue == null) return 0
    if (aValue == null) return sortOrder === "asc" ? 1 : -1
    if (bValue == null) return sortOrder === "asc" ? -1 : 1

    let comparison = 0

    // Сравнение в зависимости от типа значения
    if (typeof aValue === "string" && typeof bValue === "string") {
      // Для строк используем localeCompare для корректной сортировки с учетом локали
      comparison = aValue.localeCompare(bValue, undefined, { 
        numeric: true, 
        sensitivity: "base" 
      })
    } else if (typeof aValue === "number" && typeof bValue === "number") {
      // Для чисел простое вычитание
      comparison = aValue - bValue
    } else {
      // Если типы разные, приводим к строке
      const aStr = String(aValue)
      const bStr = String(bValue)
      comparison = aStr.localeCompare(bStr, undefined, { 
        numeric: true, 
        sensitivity: "base" 
      })
    }

    // Применяем направление сортировки
    return sortOrder === "asc" ? comparison : -comparison
  })

  return sorted
}

/**
 * Вспомогательная функция для парсинга продолжительности из строки в секунды
 * Поддерживает форматы: "01:23:45", "01:23", "123" (секунды)
 * 
 * @param duration - Строка с продолжительностью или число
 * @returns Количество секунд
 */
export function parseDuration(duration: any): number {
  if (!duration) return 0
  if (typeof duration === "number") return duration
  
  if (typeof duration === "string") {
    // Если формат "01:23:45"
    const parts = duration.split(":").map(Number)
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    }
    // Если формат "01:23"
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1]
    }
    // Если просто число
    return Number.parseFloat(duration) || 0
  }
  
  return 0
}

/**
 * Вспомогательная функция для парсинга размера файла
 * Поддерживает форматы: 1234567 (байты), "1.5 MB", "2.3 GB"
 * 
 * @param size - Размер файла (число или строка с единицами измерения)
 * @returns Размер в байтах
 */
export function parseFileSize(size: any): number {
  if (!size) return 0
  if (typeof size === "number") return size
  
  if (typeof size === "string") {
    // Если размер представлен строкой с единицами измерения
    const match = /^([\d.]+)\s*([KMGT]?B)?$/i.exec(size)
    if (match) {
      const value = Number.parseFloat(match[1])
      const unit = (match[2] || "").toUpperCase()
      
      switch (unit) {
        case "KB": return value * 1024
        case "MB": return value * 1024 * 1024
        case "GB": return value * 1024 * 1024 * 1024
        case "TB": return value * 1024 * 1024 * 1024 * 1024
        default: return value // Просто байты или B
      }
    }
    return Number.parseFloat(size) || 0
  }
  
  return 0
}

/**
 * Функция для определения порядка сортировки по сложности
 * 
 * @param complexity - Уровень сложности
 * @returns Числовое значение для сортировки
 */
export function getComplexityOrder(complexity: string | undefined): number {
  const order: Record<string, number> = {
    basic: 0,
    intermediate: 1,
    advanced: 2
  }
  return order[complexity || "basic"] ?? 0
}