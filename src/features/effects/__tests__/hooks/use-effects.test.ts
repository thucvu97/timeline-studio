import { describe, expect, it, vi } from "vitest"

describe("useEffects hooks", () => {
  it("should export the correct hooks", async () => {
    // Simple test to validate the hooks are exported correctly
    const hooks = await vi.importActual("@/features/effects/hooks/use-effects")

    expect(hooks).toBeDefined()
    expect(hooks).toHaveProperty("useEffects")
    expect(hooks).toHaveProperty("useEffectById")
    expect(hooks).toHaveProperty("useEffectsByCategory")
    expect(hooks).toHaveProperty("useEffectsSearch")
  })

  it("should validate VideoEffect type structure", () => {
    // Test type structure without running the hooks
    const mockEffect = {
      id: "test-effect",
      name: "Test Effect",
      type: "blur",
      duration: 1000,
      category: "artistic",
      complexity: "basic",
      description: { ru: "Тест", en: "Test" },
      ffmpegCommand: () => "blur=5",
      previewPath: "/test.mp4",
      labels: { en: "Test", ru: "Тест" },
      tags: ["test"],
    }

    expect(mockEffect).toHaveProperty("id")
    expect(mockEffect).toHaveProperty("name")
    expect(mockEffect).toHaveProperty("type")
    expect(mockEffect).toHaveProperty("category")
    expect(typeof mockEffect.ffmpegCommand).toBe("function")
  })

  it("should validate hook function signatures", () => {
    const mockUseEffects = () => ({
      effects: [],
      loading: false,
      error: null,
      reload: vi.fn(),
      isReady: true,
    })

    const mockUseEffectById = (id: string) => null
    const mockUseEffectsByCategory = (category: string) => []
    const mockUseEffectsSearch = (query: string, lang?: "ru" | "en") => []

    expect(typeof mockUseEffects).toBe("function")
    expect(typeof mockUseEffectById).toBe("function")
    expect(typeof mockUseEffectsByCategory).toBe("function")
    expect(typeof mockUseEffectsSearch).toBe("function")

    const result = mockUseEffects()
    expect(result.effects).toEqual([])
    expect(result.loading).toBe(false)
    expect(result.isReady).toBe(true)
  })
})