import { describe, expect, it } from "vitest"

import { playerTools } from "../../tools/player-tools"

describe("Player Tools", () => {
  it("должен содержать 10 инструментов", () => {
    expect(playerTools).toHaveLength(10)
  })

  it("каждый инструмент должен иметь корректную структуру", () => {
    playerTools.forEach((tool) => {
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

  it("должен содержать инструмент analyze_current_media", () => {
    const tool = playerTools.find((t) => t.name === "analyze_current_media")
    expect(tool).toBeDefined()
    expect(tool?.description.toLowerCase()).toContain("анализ")
  })

  it("должен содержать инструмент apply_preview_effects", () => {
    const tool = playerTools.find((t) => t.name === "apply_preview_effects")
    expect(tool).toBeDefined()
    expect(tool?.input_schema.properties).toHaveProperty("effects")
  })

  it("все инструменты должны иметь уникальные имена", () => {
    const names = playerTools.map((tool) => tool.name)
    const uniqueNames = new Set(names)
    expect(uniqueNames.size).toBe(names.length)
  })
})
