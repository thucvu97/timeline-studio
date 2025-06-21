import { describe, expect, it, vi } from "vitest"

// Test the main index exports
describe("Templates Index Exports", () => {
  // Mock all the underlying modules to avoid dependency issues
  vi.mock("../components/resizable-template", () => ({
    ResizableTemplate: "MockedResizableTemplate",
  }))

  vi.mock("../components/template-list", () => ({
    TemplateList: "MockedTemplateList",
  }))

  vi.mock("../components/template-preview", () => ({
    TemplatePreview: "MockedTemplatePreview",
  }))

  vi.mock("../lib", () => ({
    TEMPLATE_MAP: { landscape: [], portrait: [], square: [] },
    createCellConfig: vi.fn(),
    getTemplateLabels: vi.fn(),
  }))

  vi.mock("../services", () => ({
    getVideoStyleForTemplate: vi.fn(),
  }))

  it("should export ResizableTemplate component", async () => {
    const module = await import("../index")
    expect(module.ResizableTemplate).toBe("MockedResizableTemplate")
  })

  it("should export TemplateList component", async () => {
    const module = await import("../index")
    expect(module.TemplateList).toBe("MockedTemplateList")
  })

  it("should export TemplatePreview component", async () => {
    const module = await import("../index")
    expect(module.TemplatePreview).toBe("MockedTemplatePreview")
  })

  it("should export lib utilities", async () => {
    const module = await import("../index")
    expect(module.TEMPLATE_MAP).toBeDefined()
    expect(module.createCellConfig).toBeDefined()
    expect(module.getTemplateLabels).toBeDefined()
  })

  it("should export service functions", async () => {
    const module = await import("../index")
    expect(module.getVideoStyleForTemplate).toBeDefined()
  })

  it("should have all expected exports", async () => {
    const module = await import("../index")
    const exports = Object.keys(module)

    expect(exports).toContain("ResizableTemplate")
    expect(exports).toContain("TemplateList")
    expect(exports).toContain("TemplatePreview")
    expect(exports).toContain("TEMPLATE_MAP")
    expect(exports).toContain("createCellConfig")
    expect(exports).toContain("getTemplateLabels")
    expect(exports).toContain("getVideoStyleForTemplate")
  })
})
