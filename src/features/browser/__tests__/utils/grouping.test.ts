import { describe, expect, it, vi } from "vitest"

import { getDateGroup, getDurationGroup, getScreensGroup, getSizeGroup, groupItems } from "../../utils/grouping"

import type { ListItem } from "../../types/list"

// Тестовые данные
const testItems: ListItem[] = [
  { id: "1", name: "Item 1", category: "video" },
  { id: "2", name: "Item 2", category: "audio" },
  { id: "3", name: "Item 3", category: "video" },
  { id: "4", name: "Item 4", category: "image" },
  { id: "5", name: "Item 5", category: undefined },
]

describe("groupItems", () => {
  const getValue = (item: ListItem, groupBy: string) => {
    if (groupBy === "category") return item.category || ""
    return ""
  }

  it("возвращает пустой массив для пустого входного массива", () => {
    const result = groupItems([], "category", getValue)
    expect(result).toEqual([])
  })

  it("возвращает все элементы в одной группе при groupBy='none'", () => {
    const result = groupItems(testItems, "none", getValue)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe("")
    expect(result[0].items).toEqual(testItems)
  })

  it("группирует элементы по категории", () => {
    const result = groupItems(testItems, "category", getValue)

    expect(result).toHaveLength(4)

    const videoGroup = result.find((g) => g.title === "video")
    expect(videoGroup?.items).toHaveLength(2)

    const audioGroup = result.find((g) => g.title === "audio")
    expect(audioGroup?.items).toHaveLength(1)

    const imageGroup = result.find((g) => g.title === "image")
    expect(imageGroup?.items).toHaveLength(1)

    const noGroup = result.find((g) => g.title === "Без группы")
    expect(noGroup?.items).toHaveLength(1)
  })

  it("сортирует группы по возрастанию", () => {
    const result = groupItems(testItems, "category", getValue, "asc")
    const titles = result.map((g) => g.title)

    // "Без группы" всегда в конце
    expect(titles[titles.length - 1]).toBe("Без группы")

    // Остальные отсортированы по алфавиту
    const otherTitles = titles.slice(0, -1)
    expect(otherTitles).toEqual(["audio", "image", "video"])
  })

  it("сортирует группы по убыванию", () => {
    const result = groupItems(testItems, "category", getValue, "desc")
    const titles = result.map((g) => g.title)

    // "Без группы" всегда в конце
    expect(titles[titles.length - 1]).toBe("Без группы")

    // Остальные отсортированы в обратном порядке
    const otherTitles = titles.slice(0, -1)
    expect(otherTitles).toEqual(["video", "image", "audio"])
  })

  it("обрабатывает элементы без значения группировки", () => {
    const itemsWithoutCategory = [
      { id: "1", name: "Item 1" },
      { id: "2", name: "Item 2" },
    ]

    const result = groupItems(itemsWithoutCategory, "category", getValue)
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe("Без группы")
    expect(result[0].items).toHaveLength(2)
  })
})

describe("getDateGroup", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("возвращает 'Без даты' для undefined", () => {
    expect(getDateGroup(undefined)).toBe("Без даты")
  })

  it("возвращает 'Без даты' для невалидной даты", () => {
    expect(getDateGroup(Number.NaN)).toBe("Без даты")
  })

  it("возвращает 'Сегодня' для текущей даты", () => {
    const now = new Date("2024-01-15T12:00:00")
    vi.setSystemTime(now)

    const todayTimestamp = now.getTime() / 1000
    expect(getDateGroup(todayTimestamp)).toBe("Сегодня")
  })

  it("возвращает 'Вчера' для вчерашней даты", () => {
    const now = new Date("2024-01-15T12:00:00")
    vi.setSystemTime(now)

    const yesterday = new Date("2024-01-14T12:00:00")
    const yesterdayTimestamp = yesterday.getTime() / 1000
    expect(getDateGroup(yesterdayTimestamp)).toBe("Вчера")
  })

  it("возвращает 'На этой неделе' для даты на текущей неделе", () => {
    const now = new Date("2024-01-15T12:00:00") // Понедельник
    vi.setSystemTime(now)

    const thisWeek = new Date("2024-01-17T12:00:00") // Среда
    const thisWeekTimestamp = thisWeek.getTime() / 1000
    expect(getDateGroup(thisWeekTimestamp)).toBe("На этой неделе")
  })

  it("возвращает 'На прошлой неделе' для даты на прошлой неделе", () => {
    const now = new Date("2024-01-15T12:00:00")
    vi.setSystemTime(now)

    const lastWeek = new Date("2024-01-08T12:00:00")
    const lastWeekTimestamp = lastWeek.getTime() / 1000
    expect(getDateGroup(lastWeekTimestamp)).toBe("На прошлой неделе")
  })

  it("возвращает 'В этом месяце' для даты в текущем месяце", () => {
    const now = new Date("2024-01-15T12:00:00")
    vi.setSystemTime(now)

    const thisMonth = new Date("2024-01-05T12:00:00")
    const thisMonthTimestamp = thisMonth.getTime() / 1000
    expect(getDateGroup(thisMonthTimestamp)).toBe("В этом месяце")
  })

  it("возвращает месяц и год для даты в текущем году", () => {
    const now = new Date("2024-06-15T12:00:00")
    vi.setSystemTime(now)

    const thisYear = new Date("2024-03-10T12:00:00")
    const thisYearTimestamp = thisYear.getTime() / 1000
    const result = getDateGroup(thisYearTimestamp)
    expect(result).toContain("2024")
  })

  it("возвращает год для даты в прошлых годах", () => {
    const now = new Date("2024-01-15T12:00:00")
    vi.setSystemTime(now)

    const pastYear = new Date("2023-06-10T12:00:00")
    const pastYearTimestamp = pastYear.getTime() / 1000
    expect(getDateGroup(pastYearTimestamp)).toBe("2023")
  })

  it("корректно обрабатывает timestamp в миллисекундах", () => {
    const now = new Date("2024-01-15T12:00:00")
    vi.setSystemTime(now)

    const todayMs = now.getTime()
    expect(getDateGroup(todayMs)).toBe("Сегодня")
  })
})

describe("getDurationGroup", () => {
  it("возвращает 'Без продолжительности' для undefined", () => {
    expect(getDurationGroup(undefined)).toBe("Без продолжительности")
  })

  it("возвращает 'Без продолжительности' для 0", () => {
    expect(getDurationGroup(0)).toBe("Без продолжительности")
  })

  it("возвращает 'Без продолжительности' для отрицательных значений", () => {
    expect(getDurationGroup(-10)).toBe("Без продолжительности")
  })

  it("возвращает правильные группы для разных продолжительностей", () => {
    expect(getDurationGroup(15)).toBe("До 30 секунд")
    expect(getDurationGroup(45)).toBe("30 сек - 1 мин")
    expect(getDurationGroup(120)).toBe("1-3 минуты")
    expect(getDurationGroup(240)).toBe("3-5 минут")
    expect(getDurationGroup(480)).toBe("5-10 минут")
    expect(getDurationGroup(1200)).toBe("10-30 минут")
    expect(getDurationGroup(2700)).toBe("30 мин - 1 час")
    expect(getDurationGroup(5400)).toBe("1-2 часа")
    expect(getDurationGroup(10000)).toBe("Более 2 часов")
  })

  it("возвращает правильные группы для граничных значений", () => {
    expect(getDurationGroup(30)).toBe("30 сек - 1 мин")
    expect(getDurationGroup(60)).toBe("1-3 минуты")
    expect(getDurationGroup(180)).toBe("3-5 минут")
    expect(getDurationGroup(300)).toBe("5-10 минут")
    expect(getDurationGroup(600)).toBe("10-30 минут")
    expect(getDurationGroup(1800)).toBe("30 мин - 1 час")
    expect(getDurationGroup(3600)).toBe("1-2 часа")
    expect(getDurationGroup(7200)).toBe("Более 2 часов")
  })
})

describe("getSizeGroup", () => {
  const MB = 1024 * 1024
  const GB = MB * 1024

  it("возвращает 'Без размера' для undefined", () => {
    expect(getSizeGroup(undefined)).toBe("Без размера")
  })

  it("возвращает 'Без размера' для 0", () => {
    expect(getSizeGroup(0)).toBe("Без размера")
  })

  it("возвращает 'Без размера' для отрицательных значений", () => {
    expect(getSizeGroup(-1000)).toBe("Без размера")
  })

  it("возвращает правильные группы для разных размеров", () => {
    expect(getSizeGroup(500 * 1024)).toBe("До 1 МБ")
    expect(getSizeGroup(5 * MB)).toBe("1-10 МБ")
    expect(getSizeGroup(25 * MB)).toBe("10-50 МБ")
    expect(getSizeGroup(75 * MB)).toBe("50-100 МБ")
    expect(getSizeGroup(250 * MB)).toBe("100-500 МБ")
    expect(getSizeGroup(750 * MB)).toBe("500 МБ - 1 ГБ")
    expect(getSizeGroup(3 * GB)).toBe("1-5 ГБ")
    expect(getSizeGroup(10 * GB)).toBe("Более 5 ГБ")
  })

  it("возвращает правильные группы для граничных значений", () => {
    expect(getSizeGroup(MB)).toBe("1-10 МБ")
    expect(getSizeGroup(10 * MB)).toBe("10-50 МБ")
    expect(getSizeGroup(50 * MB)).toBe("50-100 МБ")
    expect(getSizeGroup(100 * MB)).toBe("100-500 МБ")
    expect(getSizeGroup(500 * MB)).toBe("500 МБ - 1 ГБ")
    expect(getSizeGroup(GB)).toBe("1-5 ГБ")
    expect(getSizeGroup(5 * GB)).toBe("Более 5 ГБ")
  })
})

describe("getScreensGroup", () => {
  it("возвращает 'Без экранов' для undefined", () => {
    expect(getScreensGroup(undefined)).toBe("Без экранов")
  })

  it("возвращает 'Без экранов' для 0", () => {
    expect(getScreensGroup(0)).toBe("Без экранов")
  })

  it("возвращает 'Без экранов' для отрицательных значений", () => {
    expect(getScreensGroup(-1)).toBe("Без экранов")
  })

  it("возвращает правильные группы для разного количества экранов", () => {
    expect(getScreensGroup(1)).toBe("1 экран")
    expect(getScreensGroup(2)).toBe("2 экрана")
    expect(getScreensGroup(3)).toBe("3-4 экрана")
    expect(getScreensGroup(4)).toBe("3-4 экрана")
    expect(getScreensGroup(5)).toBe("5-6 экранов")
    expect(getScreensGroup(6)).toBe("5-6 экранов")
    expect(getScreensGroup(8)).toBe("7-9 экранов")
    expect(getScreensGroup(11)).toBe("10-12 экранов")
    expect(getScreensGroup(15)).toBe("13-16 экранов")
    expect(getScreensGroup(20)).toBe("Более 16 экранов")
  })

  it("возвращает правильные группы для граничных значений", () => {
    expect(getScreensGroup(7)).toBe("7-9 экранов")
    expect(getScreensGroup(9)).toBe("7-9 экранов")
    expect(getScreensGroup(10)).toBe("10-12 экранов")
    expect(getScreensGroup(12)).toBe("10-12 экранов")
    expect(getScreensGroup(13)).toBe("13-16 экранов")
    expect(getScreensGroup(16)).toBe("13-16 экранов")
    expect(getScreensGroup(17)).toBe("Более 16 экранов")
  })
})
