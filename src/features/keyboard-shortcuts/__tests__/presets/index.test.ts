import { beforeEach, describe, expect, it, vi } from "vitest"

describe("createPresets", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it("should return an object with all three presets", async () => {
    const { createPresets } = await import("../../presets")
    const mockT = vi.fn((key: string, fallback?: string) => fallback || key)
    const presets = createPresets(mockT)

    expect(presets).toBeDefined()
    expect(typeof presets).toBe("object")
    expect(Object.keys(presets)).toEqual(["Timeline", "Wondershare Filmora", "Adobe Premier Pro"])
  })

  it("should have valid preset structure", async () => {
    const { createPresets } = await import("../../presets")
    const mockT = vi.fn((key: string, fallback?: string) => fallback || key)
    const presets = createPresets(mockT)

    // Verify each preset has categories and shortcuts
    Object.entries(presets).forEach(([presetName, categories]) => {
      expect(Array.isArray(categories)).toBe(true)
      expect(categories.length).toBeGreaterThan(0)

      categories.forEach((category) => {
        expect(category).toHaveProperty("id")
        expect(category).toHaveProperty("name")
        expect(category).toHaveProperty("shortcuts")
        expect(Array.isArray(category.shortcuts)).toBe(true)
      })
    })
  })

  it("should have different shortcuts for each preset", async () => {
    const { createPresets } = await import("../../presets")
    const mockT = vi.fn((key: string, fallback?: string) => fallback || key)
    const presets = createPresets(mockT)

    // Get total shortcuts for each preset
    const timelineTotal = presets.Timeline.reduce((sum, cat) => sum + cat.shortcuts.length, 0)
    const filmoraTotal = presets["Wondershare Filmora"].reduce((sum, cat) => sum + cat.shortcuts.length, 0)
    const premiereTotal = presets["Adobe Premier Pro"].reduce((sum, cat) => sum + cat.shortcuts.length, 0)

    // Each preset should have different number of shortcuts
    expect(timelineTotal).not.toBe(filmoraTotal)
    expect(timelineTotal).not.toBe(premiereTotal)
    expect(filmoraTotal).not.toBe(premiereTotal)

    // Verify reasonable ranges
    expect(timelineTotal).toBeGreaterThan(20)
    expect(timelineTotal).toBeLessThan(50)

    expect(filmoraTotal).toBeGreaterThan(100)
    expect(filmoraTotal).toBeLessThan(150)

    expect(premiereTotal).toBeGreaterThan(100)
    expect(premiereTotal).toBeLessThan(130)
  })
})