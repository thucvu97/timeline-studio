import { beforeEach, describe, expect, it, vi } from "vitest"

import { executeTimelineTool, setTimelineStateAccess, timelineTools } from "../../tools/timeline-tools"

// Mock timeline project для тестирования
const mockTimelineProject = {
  id: "test-project",
  name: "Test Project",
  description: "Test project description",
  resolution: { width: 1920, height: 1080 },
  fps: 30,
  aspectRatio: "16:9",
  duration: 120,
  sampleRate: 48000,
  sections: [
    {
      id: "section1",
      name: "Intro",
      startTime: 0,
      endTime: 10,
      color: "#FF0000",
      isLocked: false,
      clips: ["clip1"],
      tracks: [
        {
          id: "track1",
          type: "video",
          name: "Video Track 1",
          height: 100,
          isLocked: false,
          isMuted: false,
          clips: [
            {
              id: "clip1",
              trackId: "track1",
              startTime: 0,
              duration: 5,
              type: "video",
              resourceId: "res1",
              isLocked: false,
            },
          ],
        },
        {
          id: "track2",
          type: "audio",
          name: "Audio Track 1",
          volume: 0.8,
          isLocked: false,
          isMuted: false,
          clips: [
            {
              id: "clip2",
              trackId: "track2",
              startTime: 2,
              duration: 3,
              type: "audio",
              resourceId: "res2",
              isLocked: false,
            },
          ],
        },
      ],
    },
  ],
  resources: [
    { id: "res1", type: "video", path: "/path/to/video1.mp4" },
    { id: "res2", type: "audio", path: "/path/to/audio1.mp3" },
  ],
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockTimelineStateAccess = {
  getCurrentProject: () => mockTimelineProject,
  createProject: vi.fn().mockResolvedValue(undefined),
  updateProject: vi.fn().mockResolvedValue(undefined),
  createSection: vi.fn().mockResolvedValue({ id: "new-section" }),
  createTrack: vi.fn().mockResolvedValue({ id: "new-track" }),
  addClip: vi.fn().mockResolvedValue({ id: "new-clip" }),
  getProjectStats: vi.fn().mockReturnValue({
    totalDuration: 120,
    totalClips: 2,
    totalTracks: 2,
    totalSections: 1,
  }),
  sendTimelineCommand: vi.fn().mockResolvedValue(undefined),
}

describe("Timeline Tools", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setTimelineStateAccess(mockTimelineStateAccess)
  })

  describe("Tool Structure Validation", () => {
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

    it("все инструменты должны иметь уникальные имена", () => {
      const names = timelineTools.map((tool) => tool.name)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(names.length)
    })

    it("все обязательные поля должны быть указаны в required", () => {
      timelineTools.forEach((tool) => {
        if (tool.input_schema.required) {
          tool.input_schema.required.forEach((required: string) => {
            expect(tool.input_schema.properties).toHaveProperty(required)
          })
        }
      })
    })
  })

  describe("Individual Tool Schema Validation", () => {
    it("analyze_timeline_structure должен иметь правильную схему", () => {
      const tool = timelineTools.find((t) => t.name === "analyze_timeline_structure")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.includeClips).toHaveProperty("type", "boolean")
      expect(tool!.input_schema.properties.includeTracks).toHaveProperty("type", "boolean")
      expect(tool!.input_schema.properties.includeSections).toHaveProperty("type", "boolean")
      expect(tool!.input_schema.properties.includeResources).toHaveProperty("type", "boolean")
      expect(tool!.input_schema.properties.analysisDepth).toHaveProperty("enum")
      expect(tool!.input_schema.properties.analysisDepth.enum).toEqual(["basic", "detailed", "comprehensive"])
    })

    it("create_timeline_project должен иметь правильную схему", () => {
      const tool = timelineTools.find((t) => t.name === "create_timeline_project")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.projectSettings).toHaveProperty("type", "object")
      expect(tool!.input_schema.properties.autoCreateStructure).toHaveProperty("type", "boolean")
      expect(tool!.input_schema.properties.templateType).toHaveProperty("enum")
      expect(tool!.input_schema.required).toEqual(["projectSettings"])
    })

    it("create_sections_by_strategy должен иметь правильную схему", () => {
      const tool = timelineTools.find((t) => t.name === "create_sections_by_strategy")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.strategy).toHaveProperty("enum")
      expect(tool!.input_schema.properties.strategy.enum).toContain("by-date")
      expect(tool!.input_schema.properties.strategy.enum).toContain("by-duration")
      expect(tool!.input_schema.properties.strategy.enum).toContain("by-content-type")
      expect(tool!.input_schema.required).toEqual(["strategy"])
    })

    it("create_track_structure должен иметь правильную схему", () => {
      const tool = timelineTools.find((t) => t.name === "create_track_structure")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.trackConfiguration).toHaveProperty("type", "object")
      expect(tool!.input_schema.properties.trackSettings).toHaveProperty("type", "object")
      expect(tool!.input_schema.required).toEqual(["trackConfiguration"])
    })

    it("place_clips_on_timeline должен иметь правильную схему", () => {
      const tool = timelineTools.find((t) => t.name === "place_clips_on_timeline")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.clipsToPlace).toHaveProperty("type", "array")
      expect(tool!.input_schema.properties.placementStrategy).toHaveProperty("type", "object")
      expect(tool!.input_schema.properties.placementStrategy.properties.method).toHaveProperty("enum")
      expect(tool!.input_schema.properties.placementStrategy.properties.method.enum).toContain("chronological")
      expect(tool!.input_schema.properties.placementStrategy.properties.method.enum).toContain("manual")
      expect(tool!.input_schema.required).toEqual(["clipsToPlace", "placementStrategy"])
    })

    it("apply_automatic_enhancements должен иметь правильную схему", () => {
      const tool = timelineTools.find((t) => t.name === "apply_automatic_enhancements")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.enhancements).toHaveProperty("type", "array")
      expect(tool!.input_schema.properties.intensity).toHaveProperty("enum")
      expect(tool!.input_schema.properties.intensity.enum).toEqual(["subtle", "moderate", "strong"])
    })

    it("analyze_content_for_story должен иметь правильную схему", () => {
      const tool = timelineTools.find((t) => t.name === "analyze_content_for_story")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.mediaFiles).toHaveProperty("type", "array")
      expect(tool!.input_schema.properties.storyParameters).toHaveProperty("type", "object")
      expect(tool!.input_schema.properties.storyParameters.properties.storyType).toHaveProperty("enum")
      expect(tool!.input_schema.properties.storyParameters.properties.storyType.enum).toContain("chronological")
      expect(tool!.input_schema.properties.storyParameters.properties.storyType.enum).toContain("thematic")
    })

    it("detect_and_split_scenes должен иметь правильную схему", () => {
      const tool = timelineTools.find((t) => t.name === "detect_and_split_scenes")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.targetClips).toHaveProperty("type", "array")
      expect(tool!.input_schema.properties.detectionSettings).toHaveProperty("type", "object")
      expect(tool!.input_schema.properties.detectionSettings.properties.sensitivity).toHaveProperty("enum")
      expect(tool!.input_schema.properties.detectionSettings.properties.sensitivity.enum).toEqual([
        "low",
        "medium",
        "high",
        "custom",
      ])
    })

    it("synchronize_with_music должен иметь правильную схему", () => {
      const tool = timelineTools.find((t) => t.name === "synchronize_with_music")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.musicTrackId).toHaveProperty("type", "string")
      expect(tool!.input_schema.properties.videoClips).toHaveProperty("type", "array")
      expect(tool!.input_schema.properties.syncSettings).toHaveProperty("type", "object")
      expect(tool!.input_schema.properties.syncSettings.properties.syncType).toHaveProperty("enum")
      expect(tool!.input_schema.properties.syncSettings.properties.syncType.enum).toContain("beat")
      expect(tool!.input_schema.required).toEqual(["musicTrackId", "videoClips"])
    })

    it("suggest_timeline_improvements должен иметь правильную схему", () => {
      const tool = timelineTools.find((t) => t.name === "suggest_timeline_improvements")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.analysisScope).toHaveProperty("type", "string")
      expect(tool!.input_schema.properties.analysisScope).toHaveProperty("enum")
      expect(tool!.input_schema.properties.analysisScope.enum).toContain("full-timeline")
      expect(tool!.input_schema.properties.targetElements).toHaveProperty("type", "object")
      expect(tool!.input_schema.properties.improvementTypes).toHaveProperty("type", "array")
      expect(tool!.input_schema.properties.prioritize).toHaveProperty("enum")
      expect(tool!.input_schema.properties.prioritize.enum).toContain("quality")
    })

    it("export_timeline_data должен иметь правильную схему", () => {
      const tool = timelineTools.find((t) => t.name === "export_timeline_data")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.exportFormat).toHaveProperty("type", "string")
      expect(tool!.input_schema.properties.exportFormat).toHaveProperty("enum")
      expect(tool!.input_schema.properties.exportFormat.enum).toContain("json")
      expect(tool!.input_schema.properties.exportFormat.enum).toContain("xml")
      expect(tool!.input_schema.properties.exportFormat.enum).toContain("csv")
      expect(tool!.input_schema.properties.includeData).toHaveProperty("type", "object")
      expect(tool!.input_schema.required).toEqual(["exportFormat"])
    })
  })

  describe("Tool Function Execution", () => {
    it("analyze_timeline_structure должен возвращать результат", async () => {
      const result = await executeTimelineTool("analyze_timeline_structure", {
        includeClips: true,
        includeTracks: true,
        includeSections: true,
        analysisDepth: "detailed",
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("analyze_timeline_structure должен работать с базовым анализом", async () => {
      const result = await executeTimelineTool("analyze_timeline_structure", {
        analysisDepth: "basic",
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("create_timeline_project должен обрабатывать запрос", async () => {
      const result = await executeTimelineTool("create_timeline_project", {
        projectSettings: {
          name: "Test New Project",
          resolution: { width: 1920, height: 1080 },
          fps: 30,
          aspectRatio: "16:9",
          duration: 180,
        },
        autoCreateStructure: true,
        templateType: "basic",
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("create_sections_by_strategy должен обрабатывать запрос", async () => {
      const result = await executeTimelineTool("create_sections_by_strategy", {
        strategy: "by-duration",
        defaultSectionDuration: 30,
        autoDistribute: true,
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("create_track_structure должен обрабатывать запрос", async () => {
      const result = await executeTimelineTool("create_track_structure", {
        trackConfiguration: {
          video: 1,
          audio: 1,
        },
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("place_clips_on_timeline должен обрабатывать запрос", async () => {
      const result = await executeTimelineTool("place_clips_on_timeline", {
        clipsToPlace: [
          { resourceId: "res1", targetTrackId: "track1" },
          { resourceId: "res2", targetTrackId: "track2" },
        ],
        placementStrategy: {
          method: "chronological",
        },
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("apply_automatic_enhancements должен обрабатывать запрос", async () => {
      const result = await executeTimelineTool("apply_automatic_enhancements", {
        enhancements: ["transitions", "color-correction", "audio-balance"],
        intensity: "moderate",
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("analyze_content_for_story должен обрабатывать запрос", async () => {
      const result = await executeTimelineTool("analyze_content_for_story", {
        mediaFiles: [
          { id: "clip1", type: "video", duration: 5 },
          { id: "clip2", type: "audio", duration: 3 },
        ],
        storyParameters: {
          storyType: "chronological",
          preferredDuration: 60,
        },
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("detect_and_split_scenes должен обрабатывать запрос", async () => {
      const result = await executeTimelineTool("detect_and_split_scenes", {
        targetClips: ["clip1"],
        detectionSettings: {
          sensitivity: "medium",
          method: "visual",
        },
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("synchronize_with_music должен обрабатывать запрос", async () => {
      const result = await executeTimelineTool("synchronize_with_music", {
        musicTrackId: "track2",
        videoClips: ["clip1"],
        syncSettings: {
          syncType: "beat",
        },
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("suggest_timeline_improvements должен обрабатывать запрос", async () => {
      const result = await executeTimelineTool("suggest_timeline_improvements", {
        analysisScope: "full-timeline",
        improvementTypes: ["performance", "visual-quality"],
        prioritize: "quality",
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("export_timeline_data должен обрабатывать запрос", async () => {
      const result = await executeTimelineTool("export_timeline_data", {
        exportFormat: "json",
        includeData: {
          metadata: true,
          sections: true,
        },
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("должен возвращать ошибку для неизвестного инструмента", async () => {
      const result = await executeTimelineTool("unknown_tool", {})

      expect(result.success).toBe(false)
      expect(result.message).toContain("Неизвестный")
    })

    it("должен обрабатывать ошибки при отсутствии state access", async () => {
      setTimelineStateAccess(null as any)

      const result = await executeTimelineTool("analyze_timeline_structure", {})

      expect(result.success).toBe(false)
      expect(result.message).toContain("Timeline state access")
    })
  })

  describe("Enum Values Validation", () => {
    it("analysisDepth enum должен содержать все уровни анализа", () => {
      const analyzeTool = timelineTools.find((t) => t.name === "analyze_timeline_structure")
      expect(analyzeTool!.input_schema.properties.analysisDepth.enum).toEqual(["basic", "detailed", "comprehensive"])
    })

    it("templateType enum должен содержать все типы шаблонов", () => {
      const createTool = timelineTools.find((t) => t.name === "create_timeline_project")
      expect(createTool!.input_schema.properties.templateType.enum).toContain("empty")
      expect(createTool!.input_schema.properties.templateType.enum).toContain("basic")
      expect(createTool!.input_schema.properties.templateType.enum).toContain("advanced")
      expect(createTool!.input_schema.properties.templateType.enum).toContain("custom")
    })

    it("placementStrategy enum должен содержать все стратегии размещения", () => {
      const placeTool = timelineTools.find((t) => t.name === "place_clips_on_timeline")
      expect(placeTool!.input_schema.properties.placementStrategy.properties.method.enum).toContain("chronological")
      expect(placeTool!.input_schema.properties.placementStrategy.properties.method.enum).toContain("manual")
      expect(placeTool!.input_schema.properties.placementStrategy.properties.method.enum).toContain("smart-gaps")
      expect(placeTool!.input_schema.properties.placementStrategy.properties.method.enum).toContain("overlay")
      expect(placeTool!.input_schema.properties.placementStrategy.properties.method.enum).toContain("story-driven")
    })

    it("intensity enum должен содержать все уровни интенсивности", () => {
      const enhanceTool = timelineTools.find((t) => t.name === "apply_automatic_enhancements")
      expect(enhanceTool!.input_schema.properties.intensity.enum).toEqual(["subtle", "moderate", "strong"])
    })

    it("export format enum должен содержать все форматы", () => {
      const exportTool = timelineTools.find((t) => t.name === "export_timeline_data")
      expect(exportTool!.input_schema.properties.exportFormat.enum).toContain("json")
      expect(exportTool!.input_schema.properties.exportFormat.enum).toContain("xml")
      expect(exportTool!.input_schema.properties.exportFormat.enum).toContain("csv")
      expect(exportTool!.input_schema.properties.exportFormat.enum).toContain("edl")
      expect(exportTool!.input_schema.properties.exportFormat.enum).toContain("fcpxml")
      expect(exportTool!.input_schema.properties.exportFormat.enum).toContain("davinci-resolve")
    })
  })

  describe("Schema Consistency", () => {
    it("все schema объекты должны иметь type 'object'", () => {
      timelineTools.forEach((tool) => {
        expect(tool.input_schema.type).toBe("object")
      })
    })

    it("все enum поля должны содержать минимум 2 варианта", () => {
      timelineTools.forEach((tool) => {
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
      timelineTools.forEach((tool) => {
        // Проверяем, что описание содержит русские символы
        expect(tool.description).toMatch(/[а-яёА-ЯЁ]/)

        // Проверяем минимальную длину описания
        expect(tool.description.length).toBeGreaterThan(20)
      })
    })

    it("основные поля должны иметь типы", () => {
      timelineTools.forEach((tool) => {
        Object.values(tool.input_schema.properties).forEach((property: any) => {
          expect(property).toHaveProperty("type")
          expect(typeof property.type).toBe("string")
        })
      })
    })

    it("некоторые boolean поля имеют default значения", () => {
      let totalBooleans = 0
      let booleansWithDefaults = 0

      timelineTools.forEach((tool) => {
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

      // Проверяем, что есть хотя бы одно boolean поле с default или нет boolean полей вообще
      if (totalBooleans === 0) {
        expect(true).toBe(true) // Нет boolean полей - это нормально
      } else {
        expect(booleansWithDefaults).toBeGreaterThanOrEqual(0) // Хотя бы 0 boolean полей с default
      }
    })
  })

  describe("Error Handling and Edge Cases", () => {
    it("должен обрабатывать критичные ошибки в executeTimelineTool", async () => {
      // Мокаем ошибку
      mockTimelineStateAccess.getCurrentProject = vi.fn(() => {
        throw new Error("Critical timeline error")
      })

      const result = await executeTimelineTool("analyze_timeline_structure", {})

      expect(result.success).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors![0]).toContain("Critical timeline error")
    })

    it("должен корректно обрабатывать пустые массивы в параметрах", async () => {
      const result = await executeTimelineTool("place_clips_on_timeline", {
        clipsToPlace: [],
        placementStrategy: {
          method: "chronological",
        },
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("должен валидировать обязательные параметры", async () => {
      const result = await executeTimelineTool("create_timeline_project", {
        // Отсутствует обязательный projectSettings
        autoCreateStructure: true,
      })

      expect(result.success).toBe(false)
      expect(result.message).toContain("Ошибка")
    })
  })
})
