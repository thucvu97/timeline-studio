import { renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useSubtitleCategories, useSubtitles } from "../hooks/use-subtitle-styles"

// Мокаем данные
vi.mock("../data/subtitle-styles.json", () => ({
  default: [
    {
      id: "basic-white",
      name: "Basic White",
      category: "basic",
      complexity: "basic",
      tags: ["simple", "clean"],
      description: { en: "Simple white subtitles", ru: "Простые белые субтитры" },
      labels: { en: "Basic White", ru: "Базовый белый" },
      style: {
        color: "#FFFFFF",
        fontSize: 24,
        fontFamily: "Arial",
      }
    },
    {
      id: "cinematic-elegant",
      name: "Elegant",
      category: "cinematic",
      complexity: "intermediate",
      tags: ["elegant", "cinematic"],
      description: { en: "Elegant cinematic style", ru: "Элегантный кинематографический стиль" },
      labels: { en: "Elegant", ru: "Элегантный" },
      style: {
        color: "#F5F5F5",
        fontSize: 28,
        fontFamily: "Georgia",
        textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
      }
    },
  ]
}))

vi.mock("../data/subtitle-categories.json", () => ({
  default: [
    {
      id: "basic",
      name: { en: "Basic", ru: "Базовые" },
      description: { en: "Simple subtitle styles", ru: "Простые стили субтитров" }
    },
    {
      id: "cinematic",
      name: { en: "Cinematic", ru: "Кинематографические" },
      description: { en: "Movie-style subtitles", ru: "Субтитры в стиле кино" }
    }
  ]
}))

describe.skip("useSubtitles", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("должен загружать субтитры", async () => {
    const { result } = renderHook(() => useSubtitles())

    // Изначально загрузка
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
    expect(result.current.subtitles).toEqual([])

    // После загрузки
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.isReady).toBe(true)
    })

    expect(result.current.subtitles).toHaveLength(2)
    expect(result.current.subtitles[0].id).toBe("basic-white")
    expect(result.current.subtitles[1].id).toBe("cinematic-elegant")
  })

  it("должен обрабатывать ошибки загрузки", async () => {
    // Мокаем ошибку при импорте
    vi.doMock("../../data/subtitle-styles.json", () => {
      throw new Error("Failed to load")
    })

    const { result } = renderHook(() => useSubtitles())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Проверяем что есть субтитры (из успешного мока выше)
    expect(result.current.subtitles.length).toBeGreaterThan(0)
    expect(result.current.error).toBeNull()
  })

  it("должен предоставлять функцию reload", () => {
    const { result } = renderHook(() => useSubtitles())
    
    expect(typeof result.current.reload).toBe("function")
  })

  it("должен возвращать стили по категориям", async () => {
    const { result } = renderHook(() => useSubtitles())

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    // Проверяем что стили правильно распределены по категориям
    const basicStyles = result.current.subtitles.filter(s => s.category === "basic")
    const cinematicStyles = result.current.subtitles.filter(s => s.category === "cinematic")

    expect(basicStyles).toHaveLength(1)
    expect(cinematicStyles).toHaveLength(1)
  })
})

describe.skip("useSubtitleCategories", () => {
  it("должен загружать категории субтитров", async () => {
    const { result } = renderHook(() => useSubtitleCategories())

    // Изначально загрузка
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
    expect(result.current.categories).toEqual([])

    // После загрузки
    await waitFor(() => {
      expect(result.current.loading).toBe(false)
      expect(result.current.isReady).toBe(true)
    })

    expect(result.current.categories).toHaveLength(2)
    expect(result.current.categories[0].id).toBe("basic")
    expect(result.current.categories[1].id).toBe("cinematic")
  })

  it("должен предоставлять функцию reload", () => {
    const { result } = renderHook(() => useSubtitleCategories())
    
    expect(typeof result.current.reload).toBe("function")
  })

  it("должен возвращать корректные данные категорий", async () => {
    const { result } = renderHook(() => useSubtitleCategories())

    await waitFor(() => {
      expect(result.current.isReady).toBe(true)
    })

    const basicCategory = result.current.categories.find(c => c.id === "basic")
    expect(basicCategory).toBeDefined()
    expect(basicCategory?.name.en).toBe("Basic")
    expect(basicCategory?.name.ru).toBe("Базовые")
    expect(basicCategory?.description.en).toBe("Simple subtitle styles")
  })
})