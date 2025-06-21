import { describe, expect, it, vi } from "vitest"

describe("Services Index Exports", () => {
  // Mock the service modules to avoid dependency issues
  vi.mock("../../services/template-service", () => ({
    getVideoStyleForTemplate: vi.fn(),
  }))

  it("should export template service functions", async () => {
    const module = await import("../../services/index")
    expect(module.getVideoStyleForTemplate).toBeDefined()
  })

  it("should have all expected service exports", async () => {
    const module = await import("../../services/index")
    const exports = Object.keys(module)

    expect(exports).toContain("getVideoStyleForTemplate")
  })

  it("should export only functions from services", async () => {
    const module = await import("../../services/index")

    Object.entries(module).forEach(([_key, value]) => {
      expect(typeof value).toBe("function")
    })
  })

  it("should maintain proper service export structure", async () => {
    const module = await import("../../services/index")

    // All exports should be defined
    Object.entries(module).forEach(([key, value]) => {
      expect(value).toBeDefined()
      expect(key).toBeTruthy()
    })
  })

  it("should export video style calculation function", async () => {
    const module = await import("../../services/index")

    expect(module.getVideoStyleForTemplate).toBeDefined()
    expect(typeof module.getVideoStyleForTemplate).toBe("function")
  })

  it("should have minimal service exports (current implementation)", async () => {
    const module = await import("../../services/index")
    const exports = Object.keys(module)

    // Currently only one service function
    expect(exports).toHaveLength(1)
    expect(exports[0]).toBe("getVideoStyleForTemplate")
  })
})
