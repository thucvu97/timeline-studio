import { describe, expect, it } from "vitest"

import { browserTools } from "../../tools/browser-tools"

describe("Browser Tools", () => {
  it("должен содержать 10 инструментов", () => {
    expect(browserTools).toHaveLength(10)
  })

  it("каждый инструмент должен иметь корректную структуру", () => {
    browserTools.forEach((tool) => {
      expect(tool).toHaveProperty("name")
      expect(tool).toHaveProperty("description")
      expect(tool).toHaveProperty("input_schema")
      expect(tool.input_schema).toHaveProperty("type", "object")
      expect(tool.input_schema).toHaveProperty("properties")
      
      expect(typeof tool.name).toBe("string")
      expect(typeof tool.description).toBe("string")
      expect(tool.name.length).toBeGreaterThan(0)
      expect(tool.description.length).toBeGreaterThan(0)
    })
  })

  it("должен содержать инструмент analyze_media_browser", () => {
    const tool = browserTools.find(t => t.name === "analyze_media_browser")
    expect(tool).toBeDefined()
    expect(tool?.description.toLowerCase()).toContain("анализ")
  })

  it("должен содержать инструмент search_media_files", () => {
    const tool = browserTools.find(t => t.name === "search_media_files")
    expect(tool).toBeDefined()
    expect(tool?.input_schema.properties).toHaveProperty("searchCriteria")
  })

  it("все инструменты должны иметь уникальные имена", () => {
    const names = browserTools.map(tool => tool.name)
    const uniqueNames = new Set(names)
    expect(uniqueNames.size).toBe(names.length)
  })
})