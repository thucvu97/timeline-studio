import type { GroupedItems, ListItem } from "../types/list"

/**
 * Группирует массив элементов по заданному критерию
 * 
 * @param items - Массив элементов для группировки
 * @param groupBy - Критерий группировки
 * @param getValue - Функция для получения значения группировки из элемента
 * @param sortOrder - Направление сортировки групп
 * @returns Массив сгруппированных элементов
 */
export function groupItems<T extends ListItem>(
  items: T[],
  groupBy: string,
  getValue: (item: T, groupBy: string) => string,
  sortOrder: "asc" | "desc" = "asc"
): GroupedItems<T>[] {
  if (!items || items.length === 0) {
    return []
  }

  // Если группировка отключена, возвращаем все элементы в одной группе
  if (groupBy === "none" || !groupBy) {
    return [{ title: "", items }]
  }

  // Создаем Map для группировки
  const groups = new Map<string, T[]>()

  // Группируем элементы
  items.forEach((item) => {
    const groupValue = getValue(item, groupBy) || "Без группы"
    
    if (!groups.has(groupValue)) {
      groups.set(groupValue, [])
    }
    groups.get(groupValue)!.push(item)
  })

  // Преобразуем Map в массив и сортируем группы
  const groupedArray = Array.from(groups.entries())
    .map(([title, items]) => ({ title, items }))
    .sort((a, b) => {
      // Специальная обработка для группы "Без группы" - всегда в конце
      if (a.title === "Без группы") return 1
      if (b.title === "Без группы") return -1
      
      // Обычная сортировка
      const comparison = a.title.localeCompare(b.title, undefined, { 
        numeric: true, 
        sensitivity: "base" 
      })
      return sortOrder === "asc" ? comparison : -comparison
    })

  return groupedArray
}

/**
 * Функция для группировки по дате с форматированием
 * 
 * @param timestamp - Временная метка в секундах или миллисекундах
 * @param locale - Локаль для форматирования
 * @returns Отформатированная строка даты
 */
export function getDateGroup(timestamp: number | undefined, locale: string = "ru"): string {
  if (!timestamp) return "Без даты"
  
  // Конвертируем в миллисекунды если нужно
  const ms = timestamp < 10000000000 ? timestamp * 1000 : timestamp
  const date = new Date(ms)
  
  // Проверяем валидность даты
  if (isNaN(date.getTime())) return "Без даты"
  
  // Форматируем дату
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  
  // Сравниваем даты
  if (isSameDay(date, today)) {
    return "Сегодня"
  } else if (isSameDay(date, yesterday)) {
    return "Вчера"
  } else if (isThisWeek(date)) {
    return "На этой неделе"
  } else if (isLastWeek(date)) {
    return "На прошлой неделе"
  } else if (isThisMonth(date)) {
    return "В этом месяце"
  } else if (isThisYear(date)) {
    // Возвращаем название месяца
    return date.toLocaleDateString(locale, { month: "long", year: "numeric" })
  } else {
    // Возвращаем год
    return date.getFullYear().toString()
  }
}

/**
 * Функция для группировки по продолжительности
 * 
 * @param duration - Продолжительность в секундах
 * @returns Группа продолжительности
 */
export function getDurationGroup(duration: number | undefined): string {
  if (!duration || duration <= 0) return "Без продолжительности"
  
  if (duration < 30) return "До 30 секунд"
  if (duration < 60) return "30 сек - 1 мин"
  if (duration < 180) return "1-3 минуты"
  if (duration < 300) return "3-5 минут"
  if (duration < 600) return "5-10 минут"
  if (duration < 1800) return "10-30 минут"
  if (duration < 3600) return "30 мин - 1 час"
  if (duration < 7200) return "1-2 часа"
  return "Более 2 часов"
}

/**
 * Функция для группировки по размеру файла
 * 
 * @param size - Размер файла в байтах
 * @returns Группа размера
 */
export function getSizeGroup(size: number | undefined): string {
  if (!size || size <= 0) return "Без размера"
  
  const MB = 1024 * 1024
  const GB = MB * 1024
  
  if (size < MB) return "До 1 МБ"
  if (size < 10 * MB) return "1-10 МБ"
  if (size < 50 * MB) return "10-50 МБ"
  if (size < 100 * MB) return "50-100 МБ"
  if (size < 500 * MB) return "100-500 МБ"
  if (size < GB) return "500 МБ - 1 ГБ"
  if (size < 5 * GB) return "1-5 ГБ"
  return "Более 5 ГБ"
}

/**
 * Функция для группировки по количеству экранов (для шаблонов)
 * 
 * @param screens - Количество экранов
 * @returns Группа экранов
 */
export function getScreensGroup(screens: number | undefined): string {
  if (!screens || screens <= 0) return "Без экранов"
  
  if (screens === 1) return "1 экран"
  if (screens === 2) return "2 экрана"
  if (screens <= 4) return "3-4 экрана"
  if (screens <= 6) return "5-6 экранов"
  if (screens <= 9) return "7-9 экранов"
  if (screens <= 12) return "10-12 экранов"
  if (screens <= 16) return "13-16 экранов"
  return "Более 16 экранов"
}

// Вспомогательные функции для работы с датами
function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate()
}

function isThisWeek(date: Date): boolean {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay())
  weekStart.setHours(0, 0, 0, 0)
  
  return date >= weekStart
}

function isLastWeek(date: Date): boolean {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - now.getDay() - 7)
  weekStart.setHours(0, 0, 0, 0)
  
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)
  
  return date >= weekStart && date < weekEnd
}

function isThisMonth(date: Date): boolean {
  const now = new Date()
  return date.getFullYear() === now.getFullYear() &&
         date.getMonth() === now.getMonth()
}

function isThisYear(date: Date): boolean {
  const now = new Date()
  return date.getFullYear() === now.getFullYear()
}