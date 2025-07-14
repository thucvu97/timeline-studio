import { beforeEach, describe, expect, it, vi } from "vitest"

import { browserTools, executeBrowserTool } from "../../tools/browser-tools"

// Mock browser state access
const mockBrowserStateAccess = {
  getBrowserState: vi.fn().mockReturnValue({
    activeTab: "media",
    tabSettings: {
      media: {
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "name",
        sortOrder: "asc",
        groupBy: "none",
        filterType: "all",
        viewMode: "thumbnails",
        previewSizeIndex: 2,
      },
      music: {
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "name",
        sortOrder: "asc",
        groupBy: "none",
        filterType: "all",
        viewMode: "list",
        previewSizeIndex: 0,
      },
      effects: {
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "name",
        sortOrder: "asc",
        groupBy: "none",
        filterType: "all",
        viewMode: "grid",
        previewSizeIndex: 1,
      },
      filters: {
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "name",
        sortOrder: "asc",
        groupBy: "none",
        filterType: "all",
        viewMode: "grid",
        previewSizeIndex: 1,
      },
      transitions: {
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "name",
        sortOrder: "asc",
        groupBy: "none",
        filterType: "all",
        viewMode: "grid",
        previewSizeIndex: 1,
      },
      templates: {
        searchQuery: "",
        showFavoritesOnly: false,
        sortBy: "name",
        sortOrder: "asc",
        groupBy: "none",
        filterType: "all",
        viewMode: "grid",
        previewSizeIndex: 1,
      },
    },
  }),
}

// Mock browser state access в browser-tools
vi.mock("../../tools/browser-tools", async () => {
  const actual = await vi.importActual("../../tools/browser-tools")
  return {
    ...actual,
    setBrowserStateAccess: vi.fn(),
  }
})

// Добавляем browserStateAccess в глобальную область
;(globalThis as any).browserStateAccess = mockBrowserStateAccess

describe("Browser Tools", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Tool Structure Validation", () => {
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

    it("все инструменты должны иметь уникальные имена", () => {
      const names = browserTools.map((tool) => tool.name)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(names.length)
    })

    it("все обязательные поля должны быть указаны в required", () => {
      browserTools.forEach((tool) => {
        if (tool.input_schema.required) {
          tool.input_schema.required.forEach((required: string) => {
            expect(tool.input_schema.properties).toHaveProperty(required)
          })
        }
      })
    })
  })

  describe("Individual Tool Schema Validation", () => {
    it("analyze_media_browser должен иметь правильную схему", () => {
      const tool = browserTools.find((t) => t.name === "analyze_media_browser")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.tab).toHaveProperty("enum")
      expect(tool!.input_schema.properties.tab.enum).toContain("media")
      expect(tool!.input_schema.properties.tab.enum).toContain("effects")
      expect(tool!.input_schema.properties.analysisDepth).toHaveProperty("enum")
      expect(tool!.input_schema.properties.analysisDepth.enum).toEqual(["basic", "detailed", "full"])
      expect(tool!.input_schema.required).toEqual(["tab"])
    })

    it("search_media_files должен иметь правильную схему", () => {
      const tool = browserTools.find((t) => t.name === "search_media_files")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.query).toHaveProperty("type", "string")
      expect(tool!.input_schema.properties.searchCriteria).toHaveProperty("type", "object")
      expect(tool!.input_schema.properties.searchCriteria.properties.type).toHaveProperty("enum")
      expect(tool!.input_schema.properties.searchCriteria.properties.type.enum).toContain("video")
      expect(tool!.input_schema.required).toEqual(["query"])
    })

    it("get_file_groups должен иметь правильную схему", () => {
      const tool = browserTools.find((t) => t.name === "get_file_groups")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.groupingStrategy).toHaveProperty("enum")
      expect(tool!.input_schema.properties.groupingStrategy.enum).toContain("by-date")
      expect(tool!.input_schema.properties.groupingStrategy.enum).toContain("smart")
      expect(tool!.input_schema.properties.minGroupSize).toHaveProperty("default", 2)
    })

    it("analyze_file_relationships должен иметь правильную схему", () => {
      const tool = browserTools.find((t) => t.name === "analyze_file_relationships")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.fileIds).toHaveProperty("type", "array")
      expect(tool!.input_schema.properties.relationshipTypes).toHaveProperty("type", "array")
      expect(tool!.input_schema.properties.relationshipTypes.items.enum).toContain("sequence")
      expect(tool!.input_schema.properties.relationshipTypes.items.enum).toContain("duplicate")
    })

    it("bulk_select_files должен иметь правильную схему", () => {
      const tool = browserTools.find((t) => t.name === "bulk_select_files")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.selectionCriteria).toHaveProperty("type", "object")
      expect(tool!.input_schema.properties.selectionCriteria.properties.method).toHaveProperty("enum")
      expect(tool!.input_schema.properties.selectionCriteria.properties.method.enum).toContain("all-matching")
      expect(tool!.input_schema.required).toEqual(["selectionCriteria", "purpose"])
    })

    it("get_browser_state должен иметь правильную схему", () => {
      const tool = browserTools.find((t) => t.name === "get_browser_state")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.includeSelection).toHaveProperty("type", "boolean")
      expect(tool!.input_schema.properties.includeFilters).toHaveProperty("default", true)
      expect(tool!.input_schema.properties.includeStats).toHaveProperty("default", false)
    })

    it("update_browser_filters должен иметь правильную схему", () => {
      const tool = browserTools.find((t) => t.name === "update_browser_filters")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.tab).toHaveProperty("enum")
      expect(tool!.input_schema.properties.newFilters).toHaveProperty("type", "object")
      expect(tool!.input_schema.required).toEqual(["tab", "newFilters", "reason"])
    })

    it("analyze_missing_content должен иметь правильную схему", () => {
      const tool = browserTools.find((t) => t.name === "analyze_missing_content")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.projectType).toHaveProperty("enum")
      expect(tool!.input_schema.properties.projectType.enum).toContain("wedding")
      expect(tool!.input_schema.properties.projectType.enum).toContain("travel")
      expect(tool!.input_schema.required).toEqual(["projectType"])
    })

    it("suggest_import_sources должен иметь правильную схему", () => {
      const tool = browserTools.find((t) => t.name === "suggest_import_sources")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.missingContentTypes).toHaveProperty("type", "array")
      expect(tool!.input_schema.properties.projectBudget).toHaveProperty("enum")
      expect(tool!.input_schema.properties.projectBudget.enum).toContain("free")
      expect(tool!.input_schema.required).toEqual(["missingContentTypes"])
    })

    it("export_file_list должен иметь правильную схему", () => {
      const tool = browserTools.find((t) => t.name === "export_file_list")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.format).toHaveProperty("enum")
      expect(tool!.input_schema.properties.format.enum).toContain("json")
      expect(tool!.input_schema.properties.format.enum).toContain("csv")
      expect(tool!.input_schema.required).toEqual(["format"])
    })
  })

  describe("Tool Function Execution", () => {
    it("analyze_media_browser должен выполняться без ошибок", async () => {
      const result = await executeBrowserTool("analyze_media_browser", {
        tab: "media",
        analysisDepth: "basic",
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("search_media_files должен выполняться без ошибок", async () => {
      const result = await executeBrowserTool("search_media_files", {
        query: "wedding",
        searchCriteria: {
          type: "video",
          sortBy: "name",
          limit: 10,
        },
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("get_file_groups должен выполняться без ошибок", async () => {
      const result = await executeBrowserTool("get_file_groups", {
        groupingStrategy: "smart",
        minGroupSize: 3,
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("analyze_file_relationships должен выполняться без ошибок", async () => {
      const result = await executeBrowserTool("analyze_file_relationships", {
        fileIds: ["file1", "file2"],
        relationshipTypes: ["sequence", "duplicate"],
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("bulk_select_files должен выполняться без ошибок", async () => {
      const result = await executeBrowserTool("bulk_select_files", {
        selectionCriteria: {
          method: "best-quality",
          maxCount: 5,
        },
        purpose: "wedding project",
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("get_browser_state должен выполняться без ошибок", async () => {
      const result = await executeBrowserTool("get_browser_state", {
        includeSelection: true,
        includeFilters: true,
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("update_browser_filters должен выполняться без ошибок", async () => {
      const result = await executeBrowserTool("update_browser_filters", {
        tab: "media",
        newFilters: {
          searchQuery: "wedding",
          sortBy: "date",
        },
        reason: "Поиск свадебных видео",
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("analyze_missing_content должен выполняться без ошибок", async () => {
      const result = await executeBrowserTool("analyze_missing_content", {
        projectType: "wedding",
        currentContent: {
          videoCount: 5,
          audioCount: 2,
        },
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("suggest_import_sources должен выполняться без ошибок", async () => {
      const result = await executeBrowserTool("suggest_import_sources", {
        missingContentTypes: ["music", "transition"],
        projectBudget: "medium",
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("export_file_list должен выполняться без ошибок", async () => {
      const result = await executeBrowserTool("export_file_list", {
        format: "json",
        includeMetadata: true,
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("должен возвращать ошибку для неизвестного инструмента", async () => {
      const result = await executeBrowserTool("unknown_tool", {})

      expect(result.success).toBe(false)
      expect(result.message).toContain("Неизвестный")
    })
  })

  describe("Enum Values Validation", () => {
    it("tab enum должен содержать все поддерживаемые вкладки", () => {
      const analyzeTool = browserTools.find((t) => t.name === "analyze_media_browser")
      expect(analyzeTool!.input_schema.properties.tab.enum).toContain("media")
      expect(analyzeTool!.input_schema.properties.tab.enum).toContain("effects")
      expect(analyzeTool!.input_schema.properties.tab.enum).toContain("filters")
      expect(analyzeTool!.input_schema.properties.tab.enum).toContain("transitions")
      expect(analyzeTool!.input_schema.properties.tab.enum).toContain("templates")
      expect(analyzeTool!.input_schema.properties.tab.enum).toContain("music")
    })

    it("analysisDepth enum должен содержать все уровни", () => {
      const analyzeTool = browserTools.find((t) => t.name === "analyze_media_browser")
      expect(analyzeTool!.input_schema.properties.analysisDepth.enum).toEqual(["basic", "detailed", "full"])
    })

    it("groupingStrategy enum должен содержать все стратегии", () => {
      const groupTool = browserTools.find((t) => t.name === "get_file_groups")
      expect(groupTool!.input_schema.properties.groupingStrategy.enum).toContain("by-date")
      expect(groupTool!.input_schema.properties.groupingStrategy.enum).toContain("by-location")
      expect(groupTool!.input_schema.properties.groupingStrategy.enum).toContain("by-series")
      expect(groupTool!.input_schema.properties.groupingStrategy.enum).toContain("smart")
    })

    it("projectType enum должен содержать все типы проектов", () => {
      const missingTool = browserTools.find((t) => t.name === "analyze_missing_content")
      expect(missingTool!.input_schema.properties.projectType.enum).toContain("wedding")
      expect(missingTool!.input_schema.properties.projectType.enum).toContain("travel")
      expect(missingTool!.input_schema.properties.projectType.enum).toContain("corporate")
      expect(missingTool!.input_schema.properties.projectType.enum).toContain("social")
      expect(missingTool!.input_schema.properties.projectType.enum).toContain("documentary")
    })

    it("export format enum должен содержать все форматы", () => {
      const exportTool = browserTools.find((t) => t.name === "export_file_list")
      expect(exportTool!.input_schema.properties.format.enum).toContain("json")
      expect(exportTool!.input_schema.properties.format.enum).toContain("csv")
      expect(exportTool!.input_schema.properties.format.enum).toContain("text")
      expect(exportTool!.input_schema.properties.format.enum).toContain("xml")
    })
  })

  describe("Schema Consistency", () => {
    it("все schema объекты должны иметь type 'object'", () => {
      browserTools.forEach((tool) => {
        expect(tool.input_schema.type).toBe("object")
      })
    })

    it("все enum поля должны содержать минимум 2 варианта", () => {
      browserTools.forEach((tool) => {
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

    it("все инструменты должны иметь описания на русском языке", () => {
      browserTools.forEach((tool) => {
        // Проверяем, что описание содержит русские символы
        expect(tool.description).toMatch(/[а-яёА-ЯЁ]/)

        // Проверяем минимальную длину описания
        expect(tool.description.length).toBeGreaterThan(20)
      })
    })

    it("основные поля должны иметь типы", () => {
      browserTools.forEach((tool) => {
        Object.values(tool.input_schema.properties).forEach((property: any) => {
          expect(property).toHaveProperty("type")
          expect(typeof property.type).toBe("string")
        })
      })
    })

    it("некоторые boolean поля имеют default значения", () => {
      let totalBooleans = 0
      let booleansWithDefaults = 0

      browserTools.forEach((tool) => {
        const checkBooleanDefaults = (obj: any) => {
          if (typeof obj === "object" && obj !== null) {
            if (obj.type === "boolean") {
              totalBooleans++
              if (obj.default !== undefined) {
                booleansWithDefaults++
              }
            }
            Object.values(obj).forEach(checkBooleanDefaults)
          }
        }

        checkBooleanDefaults(tool.input_schema.properties)
      })

      // Проверяем, что есть хотя бы несколько boolean полей с default
      expect(totalBooleans).toBeGreaterThan(0)
      expect(booleansWithDefaults).toBeGreaterThanOrEqual(3) // Ожидаем минимум 3 поля с defaults
    })
  })

  describe("Error Handling and Edge Cases", () => {
    it("должен обрабатывать некорректные параметры", async () => {
      const result = await executeBrowserTool("analyze_media_browser", {
        tab: "invalid_tab",
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("должен обрабатывать пустые массивы в параметрах", async () => {
      const result = await executeBrowserTool("analyze_file_relationships", {
        fileIds: [],
        relationshipTypes: [],
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("должен обрабатывать отсутствие browser state access", async () => {
      // Временно убираем browserStateAccess
      const originalAccess = (globalThis as any).browserStateAccess
      ;(globalThis as any).browserStateAccess = null

      const result = await executeBrowserTool("get_browser_state", {})

      expect(result.success).toBe(false)
      expect(result.message).toContain("Browser state access")

      // Восстанавливаем
      ;(globalThis as any).browserStateAccess = originalAccess
    })
  })
})
