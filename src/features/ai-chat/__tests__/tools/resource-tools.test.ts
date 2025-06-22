import { describe, expect, it } from "vitest"

import { resourceTools } from "../../tools/resource-tools"

describe("Resource Tools", () => {
  it("должен содержать 10 инструментов", () => {
    expect(resourceTools).toHaveLength(10)
  })

  it("каждый инструмент должен иметь корректную структуру", () => {
    resourceTools.forEach((tool) => {
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

  it("должен содержать инструмент analyze_available_resources", () => {
    const tool = resourceTools.find((t) => t.name === "analyze_available_resources")
    expect(tool).toBeDefined()
    expect(tool?.description.toLowerCase()).toContain("анализ")
  })

  it("должен содержать инструмент add_resource_to_pool", () => {
    const tool = resourceTools.find((t) => t.name === "add_resource_to_pool")
    expect(tool).toBeDefined()
    expect(tool?.input_schema.properties).toHaveProperty("resourceType")
  })

  it("должен содержать инструмент bulk_add_resources", () => {
    const tool = resourceTools.find((t) => t.name === "bulk_add_resources")
    expect(tool).toBeDefined()
    expect(tool?.input_schema.properties).toHaveProperty("criteria")
  })

  it("все инструменты должны иметь уникальные имена", () => {
    const names = resourceTools.map((tool) => tool.name)
    const uniqueNames = new Set(names)
    expect(uniqueNames.size).toBe(names.length)
  })

  it("все обязательные поля должны быть указаны в required", () => {
    resourceTools.forEach((tool) => {
      if (tool.input_schema.required) {
        tool.input_schema.required.forEach((required: string) => {
          expect(tool.input_schema.properties).toHaveProperty(required)
        })
      }
    })
  })
})
