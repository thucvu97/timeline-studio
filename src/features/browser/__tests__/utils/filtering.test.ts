import { describe, expect, it } from "vitest"

import {
  filterItems,
  matchesAnyExtension,
  matchesCategory,
  matchesComplexity,
  matchesExtension,
  matchesTag,
  safeStringValue,
} from "../../utils/filtering"

import type { FilterConfig, ListItem } from "../../types/list"

// Тестовые данные
const testItems: ListItem[] = [
  { id: "1", name: "Video 1", category: "video", tags: ["tutorial", "react"] },
  { id: "2", name: "Audio Track", category: "audio", tags: ["music", "background"] },
  { id: "3", name: "Image File", category: "image", tags: ["logo"] },
  { id: "4", name: "Favorite Video", category: "video", tags: ["featured"], isFavorite: true },
  { id: "5", name: "Document", category: "document", tags: [] },
]

describe("filterItems", () => {
  const getSearchableText = (item: ListItem) => [item.name, item.category || ""]
  const matchesFilter = (item: ListItem, filterType: string) => item.category === filterType
  const isFavorite = (item: ListItem) => item.isFavorite === true

  it("возвращает все элементы, если фильтры не заданы", () => {
    const filters: FilterConfig = {
      searchQuery: "",
      showFavoritesOnly: false,
      filterType: "all",
    }

    const result = filterItems(testItems, filters, getSearchableText)
    expect(result).toEqual(testItems)
  })

  it("возвращает пустой массив, если входной массив пустой", () => {
    const filters: FilterConfig = {
      searchQuery: "test",
      showFavoritesOnly: false,
      filterType: "all",
    }

    const result = filterItems([], filters, getSearchableText)
    expect(result).toEqual([])
  })

  it("фильтрует по поисковому запросу", () => {
    const filters: FilterConfig = {
      searchQuery: "video",
      showFavoritesOnly: false,
      filterType: "all",
    }

    const result = filterItems(testItems, filters, getSearchableText)
    expect(result).toHaveLength(2)
    expect(result.map((item) => item.id)).toEqual(["1", "4"])
  })

  it("фильтрует по поисковому запросу без учета регистра", () => {
    const filters: FilterConfig = {
      searchQuery: "AUDIO",
      showFavoritesOnly: false,
      filterType: "all",
    }

    const result = filterItems(testItems, filters, getSearchableText)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("2")
  })

  it("фильтрует только избранные элементы", () => {
    const filters: FilterConfig = {
      searchQuery: "",
      showFavoritesOnly: true,
      filterType: "all",
    }

    const result = filterItems(testItems, filters, getSearchableText, matchesFilter, isFavorite)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("4")
  })

  it("фильтрует по типу", () => {
    const filters: FilterConfig = {
      searchQuery: "",
      showFavoritesOnly: false,
      filterType: "audio",
    }

    const result = filterItems(testItems, filters, getSearchableText, matchesFilter)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("2")
  })

  it("применяет все фильтры одновременно", () => {
    const filters: FilterConfig = {
      searchQuery: "video",
      showFavoritesOnly: true,
      filterType: "video",
    }

    const result = filterItems(testItems, filters, getSearchableText, matchesFilter, isFavorite)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("4")
  })

  it("обрезает пробелы в поисковом запросе", () => {
    const filters: FilterConfig = {
      searchQuery: "  audio  ",
      showFavoritesOnly: false,
      filterType: "all",
    }

    const result = filterItems(testItems, filters, getSearchableText)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe("2")
  })
})

describe("safeStringValue", () => {
  it("возвращает пустую строку для null", () => {
    expect(safeStringValue(null)).toBe("")
  })

  it("возвращает пустую строку для undefined", () => {
    expect(safeStringValue(undefined)).toBe("")
  })

  it("преобразует число в строку", () => {
    expect(safeStringValue(123)).toBe("123")
  })

  it("преобразует boolean в строку", () => {
    expect(safeStringValue(true)).toBe("true")
    expect(safeStringValue(false)).toBe("false")
  })

  it("возвращает строку как есть", () => {
    expect(safeStringValue("test")).toBe("test")
  })

  it("преобразует объект в строку", () => {
    expect(safeStringValue({ test: "value" })).toBe("[object Object]")
  })
})

describe("matchesExtension", () => {
  it("возвращает true для совпадающего расширения", () => {
    expect(matchesExtension("video.mp4", "mp4")).toBe(true)
  })

  it("возвращает true для совпадающего расширения без учета регистра", () => {
    expect(matchesExtension("video.MP4", "mp4")).toBe(true)
    expect(matchesExtension("video.mp4", "MP4")).toBe(true)
  })

  it("возвращает false для несовпадающего расширения", () => {
    expect(matchesExtension("video.mp4", "avi")).toBe(false)
  })

  it("возвращает false для файла без расширения", () => {
    expect(matchesExtension("video", "mp4")).toBe(false)
  })

  it("возвращает false для пустого имени файла", () => {
    expect(matchesExtension("", "mp4")).toBe(false)
  })

  it("возвращает false для пустого расширения", () => {
    expect(matchesExtension("video.mp4", "")).toBe(false)
  })

  it("обрабатывает файлы с несколькими точками", () => {
    expect(matchesExtension("archive.tar.gz", "gz")).toBe(true)
    expect(matchesExtension("archive.tar.gz", "tar")).toBe(false)
  })
})

describe("matchesAnyExtension", () => {
  it("возвращает true, если файл имеет одно из расширений", () => {
    expect(matchesAnyExtension("video.mp4", ["mp4", "avi", "mov"])).toBe(true)
    expect(matchesAnyExtension("video.avi", ["mp4", "avi", "mov"])).toBe(true)
  })

  it("возвращает false, если файл не имеет ни одного из расширений", () => {
    expect(matchesAnyExtension("video.mkv", ["mp4", "avi", "mov"])).toBe(false)
  })

  it("возвращает false для пустого имени файла", () => {
    expect(matchesAnyExtension("", ["mp4", "avi"])).toBe(false)
  })

  it("возвращает false для пустого массива расширений", () => {
    expect(matchesAnyExtension("video.mp4", [])).toBe(false)
  })

  it("возвращает false для null/undefined", () => {
    expect(matchesAnyExtension("video.mp4", null as any)).toBe(false)
    expect(matchesAnyExtension("video.mp4", undefined as any)).toBe(false)
  })
})

describe("matchesCategory", () => {
  it("возвращает true для совпадающей категории", () => {
    expect(matchesCategory("video", "video")).toBe(true)
  })

  it("возвращает true для совпадающей категории без учета регистра", () => {
    expect(matchesCategory("VIDEO", "video")).toBe(true)
    expect(matchesCategory("video", "VIDEO")).toBe(true)
  })

  it("возвращает false для несовпадающей категории", () => {
    expect(matchesCategory("video", "audio")).toBe(false)
  })

  it("возвращает false для undefined категории", () => {
    expect(matchesCategory(undefined, "video")).toBe(false)
  })

  it("возвращает false для пустой категории фильтра", () => {
    expect(matchesCategory("video", "")).toBe(false)
  })
})

describe("matchesComplexity", () => {
  it("возвращает true для совпадающей сложности", () => {
    expect(matchesComplexity("basic", "basic")).toBe(true)
  })

  it("возвращает true для совпадающей сложности без учета регистра", () => {
    expect(matchesComplexity("BASIC", "basic")).toBe(true)
    expect(matchesComplexity("basic", "BASIC")).toBe(true)
  })

  it("возвращает false для несовпадающей сложности", () => {
    expect(matchesComplexity("basic", "advanced")).toBe(false)
  })

  it("возвращает false для undefined сложности", () => {
    expect(matchesComplexity(undefined, "basic")).toBe(false)
  })

  it("возвращает false для пустой сложности фильтра", () => {
    expect(matchesComplexity("basic", "")).toBe(false)
  })
})

describe("matchesTag", () => {
  it("возвращает true, если тег содержится в массиве", () => {
    expect(matchesTag(["react", "tutorial"], "react")).toBe(true)
  })

  it("возвращает true для частичного совпадения", () => {
    expect(matchesTag(["react", "tutorial"], "tut")).toBe(true)
  })

  it("возвращает true без учета регистра", () => {
    expect(matchesTag(["React", "Tutorial"], "react")).toBe(true)
    expect(matchesTag(["react", "tutorial"], "REACT")).toBe(true)
  })

  it("возвращает false, если тег не найден", () => {
    expect(matchesTag(["react", "tutorial"], "vue")).toBe(false)
  })

  it("возвращает false для пустого массива тегов", () => {
    expect(matchesTag([], "react")).toBe(false)
  })

  it("возвращает false для undefined тегов", () => {
    expect(matchesTag(undefined, "react")).toBe(false)
  })

  it("возвращает false для пустого фильтра тега", () => {
    expect(matchesTag(["react", "tutorial"], "")).toBe(false)
  })
})
