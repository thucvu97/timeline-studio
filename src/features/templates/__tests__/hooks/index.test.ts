import { describe, expect, it, vi } from "vitest"

describe("Hooks Index Exports", () => {
  // Mock the hooks to avoid dependency issues
  vi.mock("../../hooks/use-templates", () => ({
    useTemplates: vi.fn(),
  }))
  
  vi.mock("../../hooks/use-templates-import", () => ({
    useTemplatesImport: vi.fn(),
  }))

  it("should export useTemplates hook", async () => {
    const module = await import("../../hooks/index")
    expect(module.useTemplates).toBeDefined()
    expect(typeof module.useTemplates).toBe("function")
  })

  it("should export useTemplatesImport hook", async () => {
    const module = await import("../../hooks/index")
    expect(module.useTemplatesImport).toBeDefined()
    expect(typeof module.useTemplatesImport).toBe("function")
  })

  it("should have all expected hook exports", async () => {
    const module = await import("../../hooks/index")
    const exports = Object.keys(module)
    
    expect(exports).toContain("useTemplates")
    expect(exports).toContain("useTemplatesImport")
  })

  it("should only export hooks (functions)", async () => {
    const module = await import("../../hooks/index")
    
    Object.entries(module).forEach(([key, value]) => {
      expect(typeof value).toBe("function")
      expect(key).toMatch(/^use[A-Z]/) // Hook naming convention
    })
  })

  it("should maintain proper hook export structure", async () => {
    const module = await import("../../hooks/index")
    
    // Should have exactly 2 hooks
    const exports = Object.keys(module)
    expect(exports).toHaveLength(2)
    
    // All should be functions
    exports.forEach(exportName => {
      expect(typeof module[exportName as keyof typeof module]).toBe("function")
    })
  })

  it("should follow React hooks naming convention", async () => {
    const module = await import("../../hooks/index")
    const exports = Object.keys(module)
    
    exports.forEach(exportName => {
      expect(exportName).toMatch(/^use[A-Z]/) // Should start with 'use' followed by capital letter
    })
  })
})