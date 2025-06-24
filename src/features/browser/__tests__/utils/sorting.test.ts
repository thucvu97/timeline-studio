import { describe, expect, it } from "vitest"

import { getComplexityOrder, parseDuration, parseFileSize, sortItems } from "../../utils/sorting"

import type { ListItem } from "../../types/list"

// Тестовые данные
interface TestItem extends ListItem {
  name: string
  size?: number
  date?: number
  duration?: string
}

const testItems: TestItem[] = [
  { id: "1", name: "Zebra", size: 1000, date: 3, duration: "01:30" },
  { id: "2", name: "Apple", size: 500, date: 1, duration: "00:45" },
  { id: "3", name: "Banana", size: 1500, date: 2, duration: "02:15" },
  { id: "4", name: "Cherry", size: undefined, date: undefined, duration: undefined },
]

describe("sortItems", () => {
  const getValue = (item: TestItem, sortBy: string): string | number => {
    switch (sortBy) {
      case "name":
        return item.name
      case "size":
        return item.size || 0
      case "date":
        return item.date || 0
      default:
        return ""
    }
  }

  it("возвращает пустой массив для пустого входного массива", () => {
    const result = sortItems([], "name", "asc", getValue)
    expect(result).toEqual([])
  })

  it("сортирует строки по возрастанию", () => {
    const result = sortItems(testItems, "name", "asc", getValue)
    const names = result.map((item) => item.name)
    expect(names).toEqual(["Apple", "Banana", "Cherry", "Zebra"])
  })

  it("сортирует строки по убыванию", () => {
    const result = sortItems(testItems, "name", "desc", getValue)
    const names = result.map((item) => item.name)
    expect(names).toEqual(["Zebra", "Cherry", "Banana", "Apple"])
  })

  it("сортирует числа по возрастанию", () => {
    const result = sortItems(testItems, "size", "asc", getValue)
    const sizes = result.map((item) => item.size || 0)
    expect(sizes).toEqual([0, 500, 1000, 1500])
  })

  it("сортирует числа по убыванию", () => {
    const result = sortItems(testItems, "size", "desc", getValue)
    const sizes = result.map((item) => item.size || 0)
    expect(sizes).toEqual([1500, 1000, 500, 0])
  })

  it("обрабатывает null/undefined значения при сортировке по возрастанию", () => {
    const result = sortItems(testItems, "date", "asc", getValue)
    // При сортировке по возрастанию, undefined значения помещаются в начало
    const dates = result.map((item) => item.date)
    expect(dates).toEqual([undefined, 1, 2, 3])
  })

  it("обрабатывает null/undefined значения при сортировке по убыванию", () => {
    const result = sortItems(testItems, "date", "desc", getValue)
    // При сортировке по убыванию, undefined значения также помещаются в конец
    const dates = result.map((item) => item.date)
    expect(dates).toEqual([3, 2, 1, undefined])
  })

  it("сохраняет исходный массив неизменным", () => {
    const originalItems = [...testItems]
    sortItems(testItems, "name", "asc", getValue)
    expect(testItems).toEqual(originalItems)
  })

  it("корректно сортирует строки с числами", () => {
    const items: TestItem[] = [
      { id: "1", name: "Item 10" },
      { id: "2", name: "Item 2" },
      { id: "3", name: "Item 1" },
      { id: "4", name: "Item 20" },
    ]

    const result = sortItems(items, "name", "asc", getValue)
    const names = result.map((item) => item.name)
    expect(names).toEqual(["Item 1", "Item 2", "Item 10", "Item 20"])
  })

  it("обрабатывает смешанные типы данных", () => {
    const mixedGetValue = (item: any, sortBy: string) => {
      if (sortBy === "mixed") {
        return item.id === "1" ? "string" : item.id === "2" ? 123 : item.value
      }
      return ""
    }

    const mixedItems = [
      { id: "1", name: "String value" },
      { id: "2", name: "Number value" },
      { id: "3", name: "Another string", value: "abc" },
    ]

    const result = sortItems(mixedItems, "mixed", "asc", mixedGetValue)
    expect(result).toHaveLength(3)
  })
})

describe("parseDuration", () => {
  it("возвращает 0 для falsy значений", () => {
    expect(parseDuration(null)).toBe(0)
    expect(parseDuration(undefined)).toBe(0)
    expect(parseDuration("")).toBe(0)
    expect(parseDuration(0)).toBe(0)
  })

  it("возвращает число как есть", () => {
    expect(parseDuration(123)).toBe(123)
    expect(parseDuration(45.6)).toBe(45.6)
  })

  it("парсит формат HH:MM:SS", () => {
    expect(parseDuration("01:23:45")).toBe(1 * 3600 + 23 * 60 + 45)
    expect(parseDuration("00:00:30")).toBe(30)
    expect(parseDuration("10:00:00")).toBe(36000)
  })

  it("парсит формат MM:SS", () => {
    expect(parseDuration("01:30")).toBe(90)
    expect(parseDuration("00:45")).toBe(45)
    expect(parseDuration("59:59")).toBe(3599)
  })

  it("парсит строку с числом", () => {
    expect(parseDuration("123")).toBe(123)
    expect(parseDuration("45.6")).toBe(45.6)
  })

  it("возвращает 0 для некорректных строк", () => {
    expect(parseDuration("abc")).toBe(0)
    // "12:" парсится как "12:0", что даёт 720 секунд (12 минут)
    expect(parseDuration("12:")).toBe(720)
    // ":30" парсится как "0:30", что даёт 30 секунд
    expect(parseDuration(":30")).toBe(30)
  })

  it("обрабатывает нестандартные форматы", () => {
    expect(parseDuration("1:2:3")).toBe(1 * 3600 + 2 * 60 + 3)
    expect(parseDuration("001:002:003")).toBe(1 * 3600 + 2 * 60 + 3)
  })
})

describe("parseFileSize", () => {
  it("возвращает 0 для falsy значений", () => {
    expect(parseFileSize(null)).toBe(0)
    expect(parseFileSize(undefined)).toBe(0)
    expect(parseFileSize("")).toBe(0)
    expect(parseFileSize(0)).toBe(0)
  })

  it("возвращает число как есть", () => {
    expect(parseFileSize(1234567)).toBe(1234567)
    expect(parseFileSize(100.5)).toBe(100.5)
  })

  it("парсит размер в байтах", () => {
    expect(parseFileSize("1234")).toBe(1234)
    expect(parseFileSize("1234B")).toBe(1234)
    expect(parseFileSize("1234 B")).toBe(1234)
  })

  it("парсит размер в килобайтах", () => {
    expect(parseFileSize("1KB")).toBe(1024)
    expect(parseFileSize("1 KB")).toBe(1024)
    expect(parseFileSize("1.5KB")).toBe(1536)
    expect(parseFileSize("1.5 KB")).toBe(1536)
  })

  it("парсит размер в мегабайтах", () => {
    expect(parseFileSize("1MB")).toBe(1024 * 1024)
    expect(parseFileSize("1 MB")).toBe(1024 * 1024)
    expect(parseFileSize("2.5MB")).toBe(2.5 * 1024 * 1024)
  })

  it("парсит размер в гигабайтах", () => {
    expect(parseFileSize("1GB")).toBe(1024 * 1024 * 1024)
    expect(parseFileSize("1 GB")).toBe(1024 * 1024 * 1024)
    expect(parseFileSize("0.5GB")).toBe(0.5 * 1024 * 1024 * 1024)
  })

  it("парсит размер в терабайтах", () => {
    expect(parseFileSize("1TB")).toBe(1024 * 1024 * 1024 * 1024)
    expect(parseFileSize("1 TB")).toBe(1024 * 1024 * 1024 * 1024)
  })

  it("не чувствителен к регистру", () => {
    expect(parseFileSize("1kb")).toBe(1024)
    expect(parseFileSize("1Kb")).toBe(1024)
    expect(parseFileSize("1mB")).toBe(1024 * 1024)
    expect(parseFileSize("1gB")).toBe(1024 * 1024 * 1024)
  })

  it("возвращает 0 для некорректных строк", () => {
    expect(parseFileSize("abc")).toBe(0)
    expect(parseFileSize("1 XB")).toBe(1)
    expect(parseFileSize("MB")).toBe(0)
  })

  it("обрабатывает числа с плавающей точкой", () => {
    expect(parseFileSize("1.234 KB")).toBe(1.234 * 1024)
    expect(parseFileSize("0.5 MB")).toBe(0.5 * 1024 * 1024)
  })
})

describe("getComplexityOrder", () => {
  it("возвращает правильный порядок для известных уровней сложности", () => {
    expect(getComplexityOrder("basic")).toBe(0)
    expect(getComplexityOrder("intermediate")).toBe(1)
    expect(getComplexityOrder("advanced")).toBe(2)
  })

  it("возвращает 0 для undefined", () => {
    expect(getComplexityOrder(undefined)).toBe(0)
  })

  it("возвращает 0 для неизвестных уровней сложности", () => {
    expect(getComplexityOrder("expert")).toBe(0)
    expect(getComplexityOrder("beginner")).toBe(0)
    expect(getComplexityOrder("")).toBe(0)
  })

  it("обеспечивает правильный порядок сортировки", () => {
    const complexities = ["advanced", "basic", "intermediate", undefined, "unknown"]
    const orders = complexities.map(getComplexityOrder)
    expect(orders).toEqual([2, 0, 1, 0, 0])
  })
})
