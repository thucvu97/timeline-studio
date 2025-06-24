import React from "react"

import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { BrowserProviders } from "@/test/test-utils"

import { useFiltersAdapter } from "../../adapters/use-filters-adapter"

// Мокаем зависимости
vi.mock("@/features/filters", () => ({
  useFilters: vi.fn(() => ({
    isLoading: false,
    error: null,
    filters: [
      {
        id: "brightness",
        name: "Яркость",
        description: "Регулировка яркости изображения",
        category: "color",
        cssFilter: "brightness(1.2)",
        icon: "☀️",
      },
      {
        id: "contrast",
        name: "Контрастность",
        description: "Регулировка контрастности",
        category: "color",
        cssFilter: "contrast(1.5)",
        icon: "🌓",
      },
    ],
  })),
}))

vi.mock("@/features/app-state", () => ({
  AppSettingsProvider: ({ children }: { children: React.ReactNode }) => children,
  useFavorites: vi.fn(() => ({
    isItemFavorite: vi.fn(() => false),
  })),
  useAppSettings: vi.fn(() => ({
    getMusicFiles: vi.fn(() => ({ allFiles: [] })),
  })),
}))

vi.mock("@/i18n", () => ({
  default: {
    t: vi.fn((key) => key),
  },
}))

vi.mock("@/i18n/services/i18n-provider", () => ({
  I18nProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock("@/features/top-bar/components/theme/theme-context", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))

vi.mock("@/features/resources", () => ({
  ResourcesProvider: ({ children }: { children: React.ReactNode }) => children,
  useResources: vi.fn(() => ({})),
}))

vi.mock("@/features/project-settings", () => ({
  ProjectSettingsProvider: ({ children }: { children: React.ReactNode }) => children,
  useProjectSettings: vi.fn(() => ({
    settings: {
      fps: 30,
      resolution: { width: 1920, height: 1080 },
    },
  })),
}))

vi.mock("@/features/browser/services/browser-state-provider", () => ({
  BrowserStateProvider: ({ children }: { children: React.ReactNode }) => children,
  useBrowserState: vi.fn(() => ({
    state: {},
    send: vi.fn(),
  })),
}))

describe("useFiltersAdapter", () => {
  it("should return filters adapter with correct structure", () => {
    const { result } = renderHook(() => useFiltersAdapter(), {
      wrapper: BrowserProviders,
    })

    expect(result.current).toHaveProperty("useData")
    expect(result.current).toHaveProperty("PreviewComponent")
    expect(result.current).toHaveProperty("getSortValue")
    expect(result.current).toHaveProperty("getSearchableText")
    expect(result.current).toHaveProperty("getGroupValue")
    expect(result.current).toHaveProperty("favoriteType", "filter")
  })

  describe("useData", () => {
    it("should return filters data", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })
      const { result: dataResult } = renderHook(() => result.current.useData())

      expect(dataResult.current.loading).toBe(false)
      expect(dataResult.current.error).toBeNull()
      expect(dataResult.current.items).toHaveLength(2)
      expect(dataResult.current.items[0].name).toBe("Яркость")
      expect(dataResult.current.items[1].name).toBe("Контрастность")
    })
  })

  describe("getSortValue", () => {
    const testFilter = {
      id: "brightness",
      name: "Яркость",
      description: "Регулировка яркости",
      category: "color",
      cssFilter: "brightness(1.2)",
      icon: "☀️",
    }

    it("should sort by different fields", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })

      expect(result.current.getSortValue(testFilter, "name")).toBe("Яркость")
      expect(result.current.getSortValue(testFilter, "category")).toBe("color")
      expect(result.current.getSortValue(testFilter, "id")).toBe("brightness")
      expect(result.current.getSortValue(testFilter, "unknown")).toBe("Яркость")
    })
  })

  describe("getSearchableText", () => {
    const testFilter = {
      id: "brightness",
      name: "Яркость",
      description: "Регулировка яркости изображения",
      category: "color",
      cssFilter: "brightness(1.2)",
      icon: "☀️",
    }

    it("should return searchable text array", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })

      const searchableText = result.current.getSearchableText(testFilter)
      expect(searchableText).toEqual(["Яркость", "Регулировка яркости изображения", "color"])
    })
  })

  describe("getGroupValue", () => {
    const testFilter = {
      id: "brightness",
      name: "Яркость",
      description: "Регулировка яркости",
      category: "color",
      cssFilter: "brightness(1.2)",
      icon: "☀️",
    }

    it("should group by category", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })

      expect(result.current.getGroupValue(testFilter, "category")).toBe("color")
      expect(result.current.getGroupValue(testFilter, "unknown")).toBe("")
    })
  })

  describe("matchesFilter", () => {
    const colorFilter = {
      id: "brightness",
      name: "Яркость",
      description: "Регулировка яркости",
      category: "color",
      cssFilter: "brightness(1.2)",
      icon: "☀️",
    }

    const blurFilter = {
      id: "gaussian",
      name: "Размытие",
      description: "Гауссово размытие",
      category: "blur",
      cssFilter: "blur(2px)",
      icon: "🌫️",
    }

    it("should match filter by category", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(colorFilter, "color")).toBe(true)
      expect(result.current.matchesFilter?.(blurFilter, "color")).toBe(false)
      expect(result.current.matchesFilter?.(blurFilter, "blur")).toBe(true)
      expect(result.current.matchesFilter?.(colorFilter, "blur")).toBe(false)
    })

    it("should return true for unknown filter", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(colorFilter, "unknown")).toBe(true)
    })
  })

  describe("PreviewComponent", () => {
    it("should be defined", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })

      expect(result.current.PreviewComponent).toBeDefined()
      expect(typeof result.current.PreviewComponent).toBe("function")
    })
  })

  describe("favoriteType", () => {
    it("should be 'filter'", () => {
      const { result } = renderHook(() => useFiltersAdapter(), { wrapper: BrowserProviders })

      expect(result.current.favoriteType).toBe("filter")
    })
  })
})
