import { beforeEach, describe, expect, it, vi } from "vitest"

import { executeResourceTool, resourceTools, setResourcesStateAccess } from "../../tools/resource-tools"

// Mock types для тестирования
interface MockResourcesProvider {
  mediaResources: Array<{ resourceId: string; file: any }>
  musicResources: Array<{ resourceId: string; file: any }>
  effectResources: Array<{ resourceId: string; effect: any }>
  filterResources: Array<{ resourceId: string; filter: any }>
  transitionResources: Array<{ resourceId: string; transition: any }>
  templateResources: Array<{ resourceId: string }>
  styleTemplateResources: Array<{ resourceId: string }>
  subtitleResources: Array<{ resourceId: string }>
  resources: Array<{ resourceId: string; type: string; addedAt?: string }>
}

// Mock resources state access
const mockResourcesProvider: MockResourcesProvider = {
  mediaResources: [
    {
      resourceId: "media1",
      file: {
        name: "video1.mp4",
        size: 1024 * 1024 * 10,
        duration: 120,
        type: "video",
        resolution: { width: 1920, height: 1080 },
        fps: 30,
      },
    },
  ],
  musicResources: [
    {
      resourceId: "music1",
      file: {
        name: "track1.mp3",
        size: 1024 * 1024 * 5,
        duration: 180,
        type: "audio",
      },
    },
  ],
  effectResources: [
    {
      resourceId: "effect1",
      effect: {
        name: "Blur Effect",
        category: "visual",
        description: "Blur visual effect",
      },
    },
  ],
  filterResources: [
    {
      resourceId: "filter1",
      filter: {
        name: "Vintage Filter",
        category: "color",
        intensity: 0.5,
      },
    },
  ],
  transitionResources: [
    {
      resourceId: "transition1",
      transition: {
        type: "fade",
        name: "Fade Transition",
        duration: 1000,
      },
    },
  ],
  templateResources: [],
  styleTemplateResources: [],
  subtitleResources: [],
  resources: [
    { resourceId: "media1", type: "media", addedAt: "2024-01-01T00:00:00.000Z" },
    { resourceId: "music1", type: "music", addedAt: "2024-01-02T00:00:00.000Z" },
    { resourceId: "effect1", type: "effect", addedAt: "2024-01-03T00:00:00.000Z" },
    { resourceId: "filter1", type: "filter", addedAt: "2024-01-04T00:00:00.000Z" },
    { resourceId: "transition1", type: "transition", addedAt: "2024-01-05T00:00:00.000Z" },
  ],
}

const mockResourcesStateAccess = {
  getResourcesProvider: () => mockResourcesProvider,
  addMediaFile: vi.fn(),
  addEffect: vi.fn(),
  addFilter: vi.fn(),
  addResource: vi.fn(),
  removeResource: vi.fn(),
  updateResource: vi.fn(),
  getResourceStats: () => ({
    totalMedia: 1,
    totalEffects: 1,
    totalFilters: 1,
    totalSize: 1024 * 1024 * 15,
    totalDuration: 300,
  }),
}

describe("Resource Tools", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setResourcesStateAccess(mockResourcesStateAccess)
  })

  describe("Tool Structure Validation", () => {
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

  describe("Individual Tool Schema Validation", () => {
    it("analyze_available_resources должен иметь правильную схему", () => {
      const tool = resourceTools.find((t) => t.name === "analyze_available_resources")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.resourceType).toHaveProperty("enum")
      expect(tool!.input_schema.properties.includeStats).toHaveProperty("type", "boolean")
      expect(tool!.input_schema.properties.filter).toHaveProperty("type", "object")
      expect(tool!.input_schema.required).toEqual(["resourceType"])
    })

    it("add_resource_to_pool должен иметь правильную схему", () => {
      const tool = resourceTools.find((t) => t.name === "add_resource_to_pool")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.resourceType).toHaveProperty("enum")
      expect(tool!.input_schema.properties.resourceId).toHaveProperty("type", "string")
      expect(tool!.input_schema.properties.reason).toHaveProperty("type", "string")
      expect(tool!.input_schema.properties.autoApply).toHaveProperty("type", "boolean")
      expect(tool!.input_schema.required).toEqual(["resourceType", "resourceId", "reason"])
    })

    it("bulk_add_resources должен иметь правильную схему", () => {
      const tool = resourceTools.find((t) => t.name === "bulk_add_resources")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.criteria).toHaveProperty("type", "object")
      expect(tool!.input_schema.properties.reason).toHaveProperty("type", "string")
      expect(tool!.input_schema.required).toEqual(["criteria", "reason"])
    })

    it("remove_resource_from_pool должен иметь правильную схему", () => {
      const tool = resourceTools.find((t) => t.name === "remove_resource_from_pool")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.resourceId).toHaveProperty("type", "string")
      expect(tool!.input_schema.properties.reason).toHaveProperty("type", "string")
      expect(tool!.input_schema.properties.removeFromTimeline).toHaveProperty("type", "boolean")
      expect(tool!.input_schema.required).toEqual(["resourceId", "reason"])
    })

    it("suggest_complementary_resources должен иметь правильную схему", () => {
      const tool = resourceTools.find((t) => t.name === "suggest_complementary_resources")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.projectType).toHaveProperty("enum")
      expect(tool!.input_schema.properties.mood).toHaveProperty("enum")
      expect(tool!.input_schema.properties.baseContent).toHaveProperty("type", "array")
      expect(tool!.input_schema.properties.targetDuration).toHaveProperty("type", "number")
      expect(tool!.input_schema.required).toEqual(["projectType", "mood"])
    })

    it("update_resource_parameters должен иметь правильную схему", () => {
      const tool = resourceTools.find((t) => t.name === "update_resource_parameters")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.resourceId).toHaveProperty("type", "string")
      expect(tool!.input_schema.properties.newParameters).toHaveProperty("type", "object")
      expect(tool!.input_schema.properties.reason).toHaveProperty("type", "string")
      expect(tool!.input_schema.required).toEqual(["resourceId", "newParameters", "reason"])
    })

    it("analyze_resource_compatibility должен иметь правильную схему", () => {
      const tool = resourceTools.find((t) => t.name === "analyze_resource_compatibility")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.resourceIds).toHaveProperty("type", "array")
      expect(tool!.input_schema.properties.checkAgainst).toHaveProperty("enum")
      expect(tool!.input_schema.properties.includeRecommendations).toHaveProperty("type", "boolean")
      expect(tool!.input_schema.required).toEqual(["resourceIds"])
    })

    it("get_resource_usage_stats должен иметь правильную схему", () => {
      const tool = resourceTools.find((t) => t.name === "get_resource_usage_stats")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.timeRange).toHaveProperty("type", "object")
      expect(tool!.input_schema.properties.groupBy).toHaveProperty("enum")
      expect(tool!.input_schema.properties.includeUnused).toHaveProperty("type", "boolean")
      expect(tool!.input_schema.required).toBeUndefined() // Нет обязательных полей
    })

    it("cleanup_unused_resources должен иметь правильную схему", () => {
      const tool = resourceTools.find((t) => t.name === "cleanup_unused_resources")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.dryRun).toHaveProperty("type", "boolean")
      expect(tool!.input_schema.properties.criteria).toHaveProperty("type", "object")
      expect(tool!.input_schema.properties.reason).toHaveProperty("type", "string")
      expect(tool!.input_schema.required).toEqual(["reason"])
    })

    it("export_resource_list должен иметь правильную схему", () => {
      const tool = resourceTools.find((t) => t.name === "export_resource_list")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.format).toHaveProperty("enum")
      expect(tool!.input_schema.properties.includeMetadata).toHaveProperty("type", "boolean")
      expect(tool!.input_schema.properties.filterCriteria).toHaveProperty("type", "object")
      expect(tool!.input_schema.required).toEqual(["format"])
    })
  })

  describe("Tool Function Execution", () => {
    it("analyze_available_resources должен анализировать ресурсы", async () => {
      const result = await executeResourceTool("analyze_available_resources", {
        resourceType: "all",
        includeStats: true,
      })

      expect(result.success).toBe(true)
      expect(result.data).toHaveProperty("analysis")
      expect(result.data?.analysis).toHaveProperty("resourceType", "all")
      expect(result.data?.analysis).toHaveProperty("totalCount")
      expect(result.data?.suggestions).toBeInstanceOf(Array)
    })

    it("analyze_available_resources должен анализировать конкретный тип ресурса", async () => {
      const result = await executeResourceTool("analyze_available_resources", {
        resourceType: "media",
      })

      expect(result.success).toBe(true)
      expect(result.data?.analysis.totalCount).toBe(1)
      expect(result.data?.analysis.items).toHaveLength(1)
      expect(result.data?.analysis.items[0]).toHaveProperty("name", "video1.mp4")
    })

    it("add_resource_to_pool должен добавлять ресурс", async () => {
      const result = await executeResourceTool("add_resource_to_pool", {
        resourceType: "media",
        resourceId: "new_media_1",
        reason: "Для основного видеоряда",
        autoApply: false,
      })

      expect(result.success).toBe(true)
      expect(result.data?.addedResources).toContain("new_media_1")
      expect(mockResourcesStateAccess.addResource).toHaveBeenCalledWith("media", expect.any(Object))
    })

    it("add_resource_to_pool должен отклонять дублирующиеся ресурсы", async () => {
      const result = await executeResourceTool("add_resource_to_pool", {
        resourceType: "media",
        resourceId: "media1", // Уже существует
        reason: "Попытка дублирования",
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain("уже добавлен")
      expect(result.errors).toHaveLength(1)
    })

    it("bulk_add_resources должен массово добавлять ресурсы", async () => {
      const result = await executeResourceTool("bulk_add_resources", {
        criteria: {
          resourceType: "media",
          selectionMethod: "all",
          maxCount: 5,
        },
        reason: "Массовое добавление медиа",
      })

      expect(result.success).toBe(true)
      expect(result.data?.addedResources).toBeInstanceOf(Array)
      expect(result.data?.analysis).toHaveProperty("criteria")
    })

    it("suggest_complementary_resources должен предлагать ресурсы", async () => {
      const result = await executeResourceTool("suggest_complementary_resources", {
        projectType: "wedding",
        mood: "romantic",
        targetDuration: 300,
        includeAutoAdd: false,
      })

      expect(result.success).toBe(true)
      expect(result.data?.suggestions).toBeInstanceOf(Array)
      expect(result.data?.analysis).toHaveProperty("projectType", "wedding")
      expect(result.data?.analysis).toHaveProperty("mood", "romantic")
    })

    it("export_resource_list должен экспортировать список", async () => {
      const result = await executeResourceTool("export_resource_list", {
        format: "json",
        includeMetadata: true,
        filterCriteria: {
          resourceTypes: ["media", "music"],
        },
      })

      expect(result.success).toBe(true)
      expect(result.data?.analysis).toHaveProperty("format", "json")
      expect(result.data?.analysis).toHaveProperty("resourceCount")
    })

    it("должен возвращать ошибку для неизвестного инструмента", async () => {
      const result = await executeResourceTool("unknown_tool", {})

      expect(result.success).toBe(false)
      expect(result.message).toContain("Неизвестный инструмент")
    })

    it("должен обрабатывать ошибки при отсутствии state access", async () => {
      setResourcesStateAccess(null)

      const result = await executeResourceTool("analyze_available_resources", {
        resourceType: "all",
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain("Resources state access не настроен")
    })
  })

  describe("Enum Values Validation", () => {
    it("resourceType enum должен содержать все допустимые значения", () => {
      const analyzeResourcesTool = resourceTools.find((t) => t.name === "analyze_available_resources")
      const addResourceTool = resourceTools.find((t) => t.name === "add_resource_to_pool")

      // analyze_available_resources должен содержать "all"
      expect(analyzeResourcesTool!.input_schema.properties.resourceType.enum).toContain("all")
      expect(analyzeResourcesTool!.input_schema.properties.resourceType.enum).toContain("media")
      expect(analyzeResourcesTool!.input_schema.properties.resourceType.enum).toContain("music")
      expect(analyzeResourcesTool!.input_schema.properties.resourceType.enum).toContain("effect")
      expect(analyzeResourcesTool!.input_schema.properties.resourceType.enum).toContain("filter")
      expect(analyzeResourcesTool!.input_schema.properties.resourceType.enum).toContain("transition")
      expect(analyzeResourcesTool!.input_schema.properties.resourceType.enum).toContain("template")
      expect(analyzeResourcesTool!.input_schema.properties.resourceType.enum).toContain("styleTemplate")

      // add_resource_to_pool не должен содержать "all"
      expect(addResourceTool!.input_schema.properties.resourceType.enum).not.toContain("all")
    })

    it("projectType enum должен содержать все типы проектов", () => {
      const suggestTool = resourceTools.find((t) => t.name === "suggest_complementary_resources")
      expect(suggestTool!.input_schema.properties.projectType.enum).toContain("wedding")
      expect(suggestTool!.input_schema.properties.projectType.enum).toContain("travel")
      expect(suggestTool!.input_schema.properties.projectType.enum).toContain("corporate")
      expect(suggestTool!.input_schema.properties.projectType.enum).toContain("social")
      expect(suggestTool!.input_schema.properties.projectType.enum).toContain("documentary")
      expect(suggestTool!.input_schema.properties.projectType.enum).toContain("education")
      expect(suggestTool!.input_schema.properties.projectType.enum).toContain("music-video")
      expect(suggestTool!.input_schema.properties.projectType.enum).toContain("commercial")
    })

    it("mood enum должен содержать все настроения", () => {
      const suggestTool = resourceTools.find((t) => t.name === "suggest_complementary_resources")
      expect(suggestTool!.input_schema.properties.mood.enum).toContain("energetic")
      expect(suggestTool!.input_schema.properties.mood.enum).toContain("calm")
      expect(suggestTool!.input_schema.properties.mood.enum).toContain("dramatic")
      expect(suggestTool!.input_schema.properties.mood.enum).toContain("romantic")
      expect(suggestTool!.input_schema.properties.mood.enum).toContain("professional")
      expect(suggestTool!.input_schema.properties.mood.enum).toContain("playful")
      expect(suggestTool!.input_schema.properties.mood.enum).toContain("serious")
      expect(suggestTool!.input_schema.properties.mood.enum).toContain("uplifting")
    })

    it("format enum должен содержать все форматы экспорта", () => {
      const exportTool = resourceTools.find((t) => t.name === "export_resource_list")
      expect(exportTool!.input_schema.properties.format.enum).toContain("json")
      expect(exportTool!.input_schema.properties.format.enum).toContain("csv")
      expect(exportTool!.input_schema.properties.format.enum).toContain("text")
      expect(exportTool!.input_schema.properties.format.enum).toContain("markdown")
    })
  })

  describe("Schema Consistency", () => {
    it("все schema объекты должны иметь type 'object'", () => {
      resourceTools.forEach((tool) => {
        expect(tool.input_schema.type).toBe("object")
      })
    })

    it("все enum поля должны содержать минимум 2 варианта", () => {
      resourceTools.forEach((tool) => {
        const checkEnums = (obj: any) => {
          if (typeof obj === "object" && obj !== null) {
            if (obj.enum && Array.isArray(obj.enum)) {
              expect(obj.enum.length).toBeGreaterThanOrEqual(2)
            }
            Object.values(obj).forEach(checkEnums)
          }
        }
        checkEnums(tool.input_schema.properties)
      })
    })

    it("основные поля должны иметь типы", () => {
      resourceTools.forEach((tool) => {
        Object.values(tool.input_schema.properties).forEach((property: any) => {
          expect(property).toHaveProperty("type")
          expect(typeof property.type).toBe("string")
        })
      })
    })

    it("enum поля должны быть валидными", () => {
      resourceTools.forEach((tool) => {
        const checkEnumFields = (obj: any) => {
          if (typeof obj === "object" && obj !== null) {
            if (obj.enum && Array.isArray(obj.enum)) {
              expect(obj.enum.length).toBeGreaterThan(0)
              obj.enum.forEach((value: any) => {
                expect(typeof value).toBe("string")
                expect(value.length).toBeGreaterThan(0)
              })
            }
            Object.values(obj).forEach(checkEnumFields)
          }
        }
        checkEnumFields(tool.input_schema.properties)
      })
    })

    it("все инструменты должны иметь описания на русском языке", () => {
      resourceTools.forEach((tool) => {
        // Проверяем, что описание содержит русские символы
        expect(tool.description).toMatch(/[а-яёА-ЯЁ]/)

        // Проверяем минимальную длину описания
        expect(tool.description.length).toBeGreaterThan(20)
      })
    })
  })
})
