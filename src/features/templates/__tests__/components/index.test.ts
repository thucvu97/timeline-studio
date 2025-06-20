import { describe, expect, it, vi } from "vitest"

describe("Components Index Exports", () => {
  // Mock the components to avoid dependency issues
  vi.mock("../../components/resizable-template", () => ({
    ResizableTemplate: "MockedResizableTemplate",
    default: "MockedResizableTemplateDefault",
  }))
  
  vi.mock("../../components/template-list", () => ({
    TemplateList: "MockedTemplateList",
    default: "MockedTemplateListDefault",
  }))
  
  vi.mock("../../components/template-preview", () => ({
    TemplatePreview: "MockedTemplatePreview",
    default: "MockedTemplatePreviewDefault",
  }))

  it("should export all components from resizable-template", async () => {
    const module = await import("../../components/index")
    expect(module.ResizableTemplate).toBe("MockedResizableTemplate")
  })

  it("should export all components from template-list", async () => {
    const module = await import("../../components/index")
    expect(module.TemplateList).toBe("MockedTemplateList")
  })

  it("should export all components from template-preview", async () => {
    const module = await import("../../components/index")
    expect(module.TemplatePreview).toBe("MockedTemplatePreview")
  })

  it("should re-export all named exports", async () => {
    const module = await import("../../components/index")
    const exports = Object.keys(module)
    
    expect(exports).toContain("ResizableTemplate")
    expect(exports).toContain("TemplateList")
    expect(exports).toContain("TemplatePreview")
  })

  it("should not have any missing exports", async () => {
    const module = await import("../../components/index")
    
    // Check that we have the main components
    expect(module.ResizableTemplate).toBeDefined()
    expect(module.TemplateList).toBeDefined()
    expect(module.TemplatePreview).toBeDefined()
  })

  it("should maintain proper export structure", async () => {
    const module = await import("../../components/index")
    
    // All exports should be defined (not undefined)
    Object.entries(module).forEach(([key, value]) => {
      expect(value).toBeDefined()
      expect(key).toBeTruthy()
    })
  })
})