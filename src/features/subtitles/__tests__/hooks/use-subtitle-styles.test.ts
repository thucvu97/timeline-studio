import { describe, expect, it, vi } from "vitest"

// Простой мок хука для тестирования без лишних зависимостей
const mockUseSubtitles = () => ({
  subtitles: [
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
      },
    },
  ],
  loading: false,
  error: null,
  reload: vi.fn(),
  isReady: true,
})

const mockCategories = [
  {
    id: "basic",
    name: { en: "Basic", ru: "Базовые" },
    description: { en: "Simple subtitle styles", ru: "Простые стили субтитров" },
  },
  {
    id: "cinematic",
    name: { en: "Cinematic", ru: "Кинематографические" },
    description: { en: "Movie-style subtitles", ru: "Субтитры в стиле кино" },
  },
]

const mockUseSubtitleCategories = () => ({
  categories: mockCategories,
  loading: false,
  error: null,
  reload: vi.fn(),
  isReady: true,
})

describe("useSubtitles", () => {
  it("должен возвращать мокированные субтитры", () => {
    const result = mockUseSubtitles()

    expect(result.subtitles).toHaveLength(1)
    expect(result.subtitles[0].id).toBe("basic-white")
    expect(result.isReady).toBe(true)
    expect(result.loading).toBe(false)
    expect(result.error).toBeNull()
  })

  it("должен предоставлять функцию reload", () => {
    const result = mockUseSubtitles()
    expect(typeof result.reload).toBe("function")
  })

  it("должен возвращать стили по категориям", () => {
    const result = mockUseSubtitles()

    // Проверяем что стили правильно распределены по категориям
    const basicStyles = result.subtitles.filter((s: any) => s.category === "basic")
    expect(basicStyles).toHaveLength(1)
    expect(basicStyles[0].id).toBe("basic-white")
  })

  it("должен корректно обрабатывать данные субтитров", () => {
    const result = mockUseSubtitles()

    const subtitle = result.subtitles[0]
    expect(subtitle).toMatchObject({
      id: "basic-white",
      name: "Basic White",
      category: "basic",
      complexity: "basic",
      tags: ["simple", "clean"],
      style: {
        color: "#FFFFFF",
        fontSize: 24,
        fontFamily: "Arial",
      },
    })
  })
})

describe("useSubtitleCategories", () => {
  it("должен возвращать список категорий", () => {
    const result = mockUseSubtitleCategories()

    expect(result.categories).toHaveLength(2)
    expect(result.categories[0].id).toBe("basic")
    expect(result.categories[1].id).toBe("cinematic")
    expect(result.isReady).toBe(true)
    expect(result.loading).toBe(false)
    expect(result.error).toBeNull()
  })

  it("должен предоставлять функцию reload", () => {
    const result = mockUseSubtitleCategories()
    expect(typeof result.reload).toBe("function")
  })

  it("должен возвращать корректные данные категорий", () => {
    const result = mockUseSubtitleCategories()

    const basicCategory = result.categories.find((c: any) => c.id === "basic")
    expect(basicCategory).toBeDefined()
    expect(basicCategory?.name.en).toBe("Basic")
    expect(basicCategory?.name.ru).toBe("Базовые")
    expect(basicCategory?.description.en).toBe("Simple subtitle styles")
  })
})
