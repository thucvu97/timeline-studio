import { describe, expect, it } from "vitest"

import { timelineTools } from "../../tools/timeline-tools"

describe("Timeline Tools", () => {
  it("должен содержать 11 инструментов", () => {
    expect(timelineTools).toHaveLength(11)
  })

  it("каждый инструмент должен иметь корректную структуру", () => {
    timelineTools.forEach((tool) => {
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

  it("должен содержать инструмент create_timeline_project", () => {
    const tool = timelineTools.find((t) => t.name === "create_timeline_project")
    expect(tool).toBeDefined()
    expect(tool?.description.toLowerCase()).toContain("создает")
  })

  it("должен содержать инструмент place_clips_on_timeline", () => {
    const tool = timelineTools.find((t) => t.name === "place_clips_on_timeline")
    expect(tool).toBeDefined()
    expect(tool?.input_schema.properties).toHaveProperty("clipsToPlace")
  })

  it("все инструменты должны иметь уникальные имена", () => {
    const names = timelineTools.map((tool) => tool.name)
    const uniqueNames = new Set(names)
    expect(uniqueNames.size).toBe(names.length)
  })
})
