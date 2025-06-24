import "./browser-adapter-mocks" // Импортируем моки первыми

import React from "react"

import { renderHook } from "@testing-library/react"
import { describe, expect, it, vi, beforeEach } from "vitest"

import { BrowserProviders } from "@/test/test-utils"

import { useEffectsAdapter } from "../../adapters/use-effects-adapter"

// Мокаем только специфичные для эффектов зависимости
vi.mock("@/features/effects/hooks/use-effects", () => ({
  useEffects: vi.fn(() => ({
    effects: [
      {
        id: "blur",
        name: "Размытие",
        description: { ru: "Эффект размытия изображения", en: "Image blur effect" },
        category: "filter",
        type: "blur",
        complexity: "basic",
        tags: ["blur", "filter"],
        labels: { ru: "Размытие", en: "Blur" },
      },
      {
        id: "sepia",
        name: "Сепия",
        description: { ru: "Винтажный эффект сепии", en: "Vintage sepia effect" },
        category: "color",
        type: "sepia",
        complexity: "intermediate",
        tags: ["vintage", "color"],
        labels: { ru: "Сепия", en: "Sepia" },
      },
    ],
    loading: false,
    error: null,
  })),
}))

describe("useEffectsAdapter", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  it("should return effects adapter with correct structure", () => {
    const { result } = renderHook(() => useEffectsAdapter(), {
      wrapper: BrowserProviders,
    })

    expect(result.current).toHaveProperty("useData")
    expect(result.current).toHaveProperty("PreviewComponent")
    expect(result.current).toHaveProperty("getSortValue")
    expect(result.current).toHaveProperty("getSearchableText")
    expect(result.current).toHaveProperty("getGroupValue")
    expect(result.current).toHaveProperty("favoriteType", "effect")
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
      description: { ru: "Эффект размытия", en: "Blur effect" },
      category: "filter",
      type: "blur",
      complexity: "basic" as const,
      tags: ["blur"],
    }

    it("should sort by different fields", () => {
      const { result } = renderHook(() => useEffectsAdapter(), { wrapper: BrowserProviders })

      expect(result.current.getSortValue(testEffect, "name")).toBe("размытие")
      expect(result.current.getSortValue(testEffect, "category")).toBe("filter")
      expect(result.current.getSortValue(testEffect, "complexity")).toBe(0) // basic = 0
      expect(result.current.getSortValue(testEffect, "type")).toBe("blur")
      expect(result.current.getSortValue(testEffect, "unknown")).toBe("размытие")
    })
  })

  describe("getSearchableText", () => {
    const testEffect = {
      id: "blur",
      name: "Размытие",
      description: { ru: "Эффект размытия изображения", en: "Image blur effect" },
      category: "filter",
      type: "blur",
      complexity: "basic" as const,
      tags: ["blur", "filter"],
      labels: { ru: "Размытие", en: "Blur" },
    }

    it("should return searchable text array", () => {
      const { result } = renderHook(() => useEffectsAdapter(), { wrapper: BrowserProviders })

      const searchableText = result.current.getSearchableText(testEffect)
      expect(searchableText).toContain("Размытие")
      expect(searchableText).toContain("Blur")
      expect(searchableText).toContain("Эффект размытия изображения")
      expect(searchableText).toContain("Image blur effect")
      expect(searchableText).toContain("filter")
      expect(searchableText).toContain("blur")
    })
  })

  describe("getGroupValue", () => {
    const testEffect = {
      id: "blur",
      name: "Размытие",
      description: { ru: "Эффект размытия", en: "Blur effect" },
      category: "filter",
      type: "blur",
      complexity: "basic" as const,
      tags: ["blur", "filter"],
    }

    it("should group by different fields", () => {
      const { result } = renderHook(() => useEffectsAdapter(), { wrapper: BrowserProviders })

      expect(result.current.getGroupValue(testEffect, "category")).toBe("filter")
      expect(result.current.getGroupValue(testEffect, "complexity")).toBe("basic")
      expect(result.current.getGroupValue(testEffect, "type")).toBe("blur")
      expect(result.current.getGroupValue(testEffect, "tags")).toBe("blur")
      expect(result.current.getGroupValue(testEffect, "unknown")).toBe("")
    })
  })

  describe("matchesFilter", () => {
    const filterEffect = {
      id: "blur",
      name: "Размытие",
      description: { ru: "Эффект размытия", en: "Blur effect" },
      category: "filter",
      type: "blur",
      complexity: "basic" as const,
      tags: ["blur"],
    }

    const colorEffect = {
      id: "sepia",
      name: "Сепия",
      description: { ru: "Винтажный эффект", en: "Vintage effect" },
      category: "color-correction",
      type: "sepia",
      complexity: "intermediate" as const,
      tags: ["vintage"],
    }

    it("should match filter by complexity", () => {
      const { result } = renderHook(() => useEffectsAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(filterEffect, "basic")).toBe(true)
      expect(result.current.matchesFilter?.(filterEffect, "intermediate")).toBe(false)
      expect(result.current.matchesFilter?.(colorEffect, "intermediate")).toBe(true)
    })

    it("should match filter by category", () => {
      const { result } = renderHook(() => useEffectsAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(colorEffect, "color-correction")).toBe(true)
      expect(result.current.matchesFilter?.(filterEffect, "color-correction")).toBe(false)
    })

    it("should return true for 'all' filter", () => {
      const { result } = renderHook(() => useEffectsAdapter(), { wrapper: BrowserProviders })

      expect(result.current.matchesFilter?.(filterEffect, "all")).toBe(true)
      expect(result.current.matchesFilter?.(colorEffect, "all")).toBe(true)
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
    it("should be 'effect'", () => {
      const { result } = renderHook(() => useEffectsAdapter(), { wrapper: BrowserProviders })

      expect(result.current.favoriteType).toBe("effect")
    })
  })
})
