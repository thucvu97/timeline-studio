import React from "react"

import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { BrowserProviders } from "@/test/test-utils"

import { useEffectsAdapter } from "../../adapters/use-effects-adapter"

// Мокаем зависимости
vi.mock("@/features/effects", () => ({
  useEffects: vi.fn(() => ({
    isLoading: false,
    error: null,
    effects: [
      {
        id: "blur",
        name: "Размытие",
        description: "Эффект размытия изображения",
        category: "filter",
        cssFilter: "blur(5px)",
        icon: "🌫️",
      },
      {
        id: "sepia",
        name: "Сепия",
        description: "Винтажный эффект сепии",
        category: "color",
        cssFilter: "sepia(100%)",
        icon: "🟤",
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

describe("useEffectsAdapter", () => {
  it("should return effects adapter with correct structure", () => {
    const { result } = renderHook(() => useEffectsAdapter(), {
      wrapper: BrowserProviders,
    })

    expect(result.current).toHaveProperty("useData")
    expect(result.current).toHaveProperty("PreviewComponent")
    expect(result.current).toHaveProperty("getSortValue")
    expect(result.current).toHaveProperty("getSearchableText")
    expect(result.current).toHaveProperty("getGroupValue")
    expect(result.current).toHaveProperty("favoriteType", "effects")
  })

  describe("useData", () => {
    it("should return effects data", () => {
      const { result } = renderHook(() => useEffectsAdapter(), { wrapper: BrowserProviders })
      const { result: dataResult } = renderHook(() => result.current.useData())

      expect(dataResult.current.loading).toBe(false)
      expect(dataResult.current.error).toBeNull()
      expect(dataResult.current.items).toHaveLength(2)
      expect(dataResult.current.items[0].name).toBe("Размытие")
      expect(dataResult.current.items[1].name).toBe("Сепия")
    })
  })

  describe("getSortValue", () => {
    const testEffect = {
      id: "blur",
      name: "Размытие",
      description: "Эффект размытия",
      category: "filter",
      cssFilter: "blur(5px)",
      icon: "🌫️",
    }

    it("should sort by different fields", () => {
      const { result } = renderHook(() => useEffectsAdapter(), { wrapper: BrowserProviders })

      expect(result.current.getSortValue(testEffect, "name")).toBe("Размытие")
      expect(result.current.getSortValue(testEffect, "category")).toBe("filter")
      expect(result.current.getSortValue(testEffect, "id")).toBe("blur")
      expect(result.current.getSortValue(testEffect, "unknown")).toBe("Размытие")
    })
  })

  describe("getSearchableText", () => {
    const testEffect = {
      id: "blur",
      name: "Размытие",
      description: "Эффект размытия изображения",
      category: "filter",
      cssFilter: "blur(5px)",
      icon: "🌫️",
    }

    it("should return searchable text array", () => {
      const { result } = renderHook(() => useEffectsAdapter(), { wrapper: BrowserProviders })

      const searchableText = result.current.getSearchableText(testEffect)
      expect(searchableText).toEqual(["Размытие", "Эффект размытия изображения", "filter"])
    })
  })

  describe("getGroupValue", () => {
    const testEffect = {
      id: "blur",
      name: "Размытие",
      description: "Эффект размытия",
      category: "filter",
      cssFilter: "blur(5px)",
      icon: "🌫️",
    }

    it("should group by category", () => {
      const { result } = renderHook(() => useEffectsAdapter(), { wrapper: BrowserProviders })

      expect(result.current.getGroupValue(testEffect, "category")).toBe("filter")
      expect(result.current.getGroupValue(testEffect, "unknown")).toBe("")
    })
  })

  describe("matchesFilter", () => {
    const filterEffect = {
      id: "blur",
      name: "Размытие",
      description: "Эффект размытия",
      category: "filter",
      cssFilter: "blur(5px)",
      icon: "🌫️",
    }

    const colorEffect = {
      id: "sepia",
      name: "Сепия",
      description: "Винтажный эффект",
      category: "color",
      cssFilter: "sepia(100%)",
      icon: "🟤",
    }

    it("should match filter by category", () => {
      const { result } = renderHook(() => useEffectsAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(filterEffect, "filter")).toBe(true)
      expect(result.current.matchesFilter?.(colorEffect, "filter")).toBe(false)
      expect(result.current.matchesFilter?.(colorEffect, "color")).toBe(true)
      expect(result.current.matchesFilter?.(filterEffect, "color")).toBe(false)
    })

    it("should return true for unknown filter", () => {
      const { result } = renderHook(() => useEffectsAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(filterEffect, "unknown")).toBe(true)
    })
  })

  describe("PreviewComponent", () => {
    it("should be defined", () => {
      const { result } = renderHook(() => useEffectsAdapter(), { wrapper: BrowserProviders })

      expect(result.current.PreviewComponent).toBeDefined()
      expect(typeof result.current.PreviewComponent).toBe("function")
    })
  })

  describe("favoriteType", () => {
    it("should be 'effects'", () => {
      const { result } = renderHook(() => useEffectsAdapter(), { wrapper: BrowserProviders })

      expect(result.current.favoriteType).toBe("effects")
    })
  })
})
