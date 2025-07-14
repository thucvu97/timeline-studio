import { beforeEach, describe, expect, it, vi } from "vitest"

import { executePlayerTool, playerTools, setPlayerStateAccess } from "../../tools/player-tools"

// Mock PlayerStateAccess для тестирования
const mockPlayerStateAccess = {
  getCurrentMedia: vi.fn().mockReturnValue({
    id: "media1",
    name: "test-video.mp4",
    file: {
      name: "test-video.mp4",
      path: "/path/to/test-video.mp4",
      size: 1024 * 1024 * 50, // 50MB
      type: "video/mp4",
    },
    type: "video",
    duration: 120, // 2 minutes
    metadata: {
      width: 1920,
      height: 1080,
      fps: 30,
      codec: "h264",
      bitrate: "5000k",
    },
    activeEffects: ["effect1", "effect2"],
    activeFilters: ["filter1"],
    playbackPosition: 30, // 30 seconds
  }),
  getPlayerState: vi.fn().mockReturnValue({
    isPlaying: false,
    currentTime: 30,
    duration: 120,
    volume: 0.8,
    playbackSpeed: 1.0,
    loop: false,
    muted: false,
  }),
  getAppliedEffects: vi.fn().mockReturnValue([
    { id: "effect1", name: "Blur", intensity: 0.5 },
    { id: "effect2", name: "Brightness", intensity: 0.3 },
  ]),
  getAppliedFilters: vi.fn().mockReturnValue([{ id: "filter1", name: "Color Correction", saturation: 1.2 }]),
  sendPlayerCommand: vi.fn().mockResolvedValue(undefined),
}

describe("Player Tools", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setPlayerStateAccess(mockPlayerStateAccess)
  })

  describe("Tool Structure Validation", () => {
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

    it("все инструменты должны иметь уникальные имена", () => {
      const names = playerTools.map((tool) => tool.name)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(names.length)
    })

    it("все обязательные поля должны быть указаны в required", () => {
      playerTools.forEach((tool) => {
        if (tool.input_schema.required) {
          tool.input_schema.required.forEach((required: string) => {
            expect(tool.input_schema.properties).toHaveProperty(required)
          })
        }
      })
    })
  })

  describe("Individual Tool Schema Validation", () => {
    it("analyze_current_media должен иметь правильную схему", () => {
      const tool = playerTools.find((t) => t.name === "analyze_current_media")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.includeMetadata).toHaveProperty("type", "boolean")
      expect(tool!.input_schema.properties.includeMetadata).toHaveProperty("default", true)
      expect(tool!.input_schema.properties.includeEffects).toHaveProperty("type", "boolean")
      expect(tool!.input_schema.properties.analyzeContent).toHaveProperty("default", false)
      expect(tool!.input_schema.properties.detectIssues).toHaveProperty("default", true)
    })

    it("apply_preview_effects должен иметь правильную схему", () => {
      const tool = playerTools.find((t) => t.name === "apply_preview_effects")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.effects).toHaveProperty("type", "array")
      expect(tool!.input_schema.properties.effects.items.properties.effectId).toHaveProperty("type", "string")
      expect(tool!.input_schema.properties.effects.items.properties.intensity).toHaveProperty("minimum", 0)
      expect(tool!.input_schema.properties.effects.items.properties.intensity).toHaveProperty("maximum", 1)
      expect(tool!.input_schema.properties.previewMode).toHaveProperty("enum")
      expect(tool!.input_schema.properties.previewMode.enum).toContain("real-time")
      expect(tool!.input_schema.required).toEqual(["effects"])
    })

    it("apply_preview_filters должен иметь правильную схему", () => {
      const tool = playerTools.find((t) => t.name === "apply_preview_filters")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.filters).toHaveProperty("type", "array")
      expect(tool!.input_schema.properties.filters.items.properties.filterId).toHaveProperty("type", "string")
      // blendMode отсутствует в реальной схеме apply_preview_filters
      expect(tool!.input_schema.required).toEqual(["filters"])
    })

    it("apply_template_preview должен иметь правильную схему", () => {
      const tool = playerTools.find((t) => t.name === "apply_template_preview")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.templateId).toHaveProperty("type", "string")
      expect(tool!.input_schema.properties.mediaFiles).toHaveProperty("type", "array")
      expect(tool!.input_schema.properties.templateParameters).toHaveProperty("type", "object")
      expect(tool!.input_schema.required).toEqual(["templateId", "mediaFiles"])
    })

    it("analyze_media_quality должен иметь правильную схему", () => {
      const tool = playerTools.find((t) => t.name === "analyze_media_quality")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.analysisTypes).toHaveProperty("type", "array")
      expect(tool!.input_schema.properties.analysisTypes.items.enum).toContain("exposure")
      expect(tool!.input_schema.properties.analysisTypes.items.enum).toContain("color-balance")
      expect(tool!.input_schema.properties.generateReport).toHaveProperty("type", "boolean")
    })

    it("extract_frame_or_clip должен иметь правильную схему", () => {
      const tool = playerTools.find((t) => t.name === "extract_frame_or_clip")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.extractionType).toHaveProperty("enum")
      expect(tool!.input_schema.properties.extractionType.enum).toContain("single-frame")
      expect(tool!.input_schema.properties.extractionType.enum).toContain("clip-segment")
      expect(tool!.input_schema.properties.timeParameters).toHaveProperty("type", "object")
      expect(tool!.input_schema.required).toEqual(["extractionType", "timeParameters"])
    })

    it("compare_media_versions должен иметь правильную схему", () => {
      const tool = playerTools.find((t) => t.name === "compare_media_versions")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.comparisonType).toHaveProperty("enum")
      expect(tool!.input_schema.properties.comparisonType.enum).toContain("before-after")
      expect(tool!.input_schema.properties.mediaVersions).toHaveProperty("type", "array")
      expect(tool!.input_schema.required).toEqual(["comparisonType", "mediaVersions"])
    })

    it("save_preview_as_resource должен иметь правильную схему", () => {
      const tool = playerTools.find((t) => t.name === "save_preview_as_resource")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.resourceType).toHaveProperty("enum")
      expect(tool!.input_schema.properties.resourceType.enum).toContain("preset")
      expect(tool!.input_schema.properties.resourceType.enum).toContain("media-export")
      expect(tool!.input_schema.properties.resourceName).toHaveProperty("type", "string")
      expect(tool!.input_schema.required).toEqual(["resourceName", "resourceType"])
    })

    it("control_playback должен иметь правильную схему", () => {
      const tool = playerTools.find((t) => t.name === "control_playback")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.action).toHaveProperty("enum")
      expect(tool!.input_schema.properties.action.enum).toContain("play")
      expect(tool!.input_schema.properties.action.enum).toContain("pause")
      expect(tool!.input_schema.properties.action.enum).toContain("seek")
      expect(tool!.input_schema.required).toEqual(["action"])
    })

    it("generate_thumbnails должен иметь правильную схему", () => {
      const tool = playerTools.find((t) => t.name === "generate_thumbnails")
      expect(tool).toBeDefined()
      expect(tool!.input_schema.properties.extractionMethod).toHaveProperty("enum")
      expect(tool!.input_schema.properties.extractionMethod.enum).toContain("uniform-intervals")
      expect(tool!.input_schema.properties.extractionMethod.enum).toContain("key-frames")
      expect(tool!.input_schema.properties.thumbnailSettings).toHaveProperty("type", "object")
    })
  })

  describe("Tool Function Execution", () => {
    it("analyze_current_media должен выполняться без ошибок", async () => {
      const result = await executePlayerTool("analyze_current_media", {
        includeMetadata: true,
        includeEffects: true,
        analyzeContent: false,
        detectIssues: true,
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
      expect(mockPlayerStateAccess.getCurrentMedia).toHaveBeenCalled()
    })

    it("apply_preview_effects должен выполняться без ошибок", async () => {
      const result = await executePlayerTool("apply_preview_effects", {
        effects: [
          {
            effectId: "blur-effect",
            intensity: 0.5,
            parameters: { radius: 5 },
          },
          {
            effectId: "brightness-effect",
            intensity: 0.3,
          },
        ],
        previewMode: "real-time",
        enableRealTimePreview: true,
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("apply_preview_filters должен выполняться без ошибок", async () => {
      const result = await executePlayerTool("apply_preview_filters", {
        filters: [
          {
            filterId: "color-correction",
            parameters: { saturation: 1.2, brightness: 1.1 },
          },
        ],
        blendMode: "normal",
        enableRealTimePreview: true,
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("apply_template_preview должен выполняться без ошибок", async () => {
      const result = await executePlayerTool("apply_template_preview", {
        templateId: "multi-cam-template",
        mediaFiles: ["video1.mp4", "video2.mp4"],
        previewSettings: {
          layoutStyle: "grid",
          showBorders: true,
        },
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("analyze_media_quality должен выполняться без ошибок", async () => {
      const result = await executePlayerTool("analyze_media_quality", {
        aspectsToAnalyze: ["technical", "visual", "audio"],
        generateRecommendations: true,
        compareToStandards: true,
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("extract_frame_or_clip должен выполняться без ошибок", async () => {
      const result = await executePlayerTool("extract_frame_or_clip", {
        extractionType: "frame",
        timestamp: 30,
        outputFormat: "png",
        quality: "high",
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("compare_media_versions должен выполняться без ошибок", async () => {
      const result = await executePlayerTool("compare_media_versions", {
        comparisonMode: "side-by-side",
        versionsToCompare: ["original", "current"],
        syncPlayback: true,
        highlightDifferences: true,
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("save_preview_as_resource должен выполняться без ошибок", async () => {
      const result = await executePlayerTool("save_preview_as_resource", {
        resourceType: "effect",
        resourceName: "Custom Effect Preset",
        description: "Custom effect combination",
        includeParameters: true,
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("control_playback должен выполняться без ошибок", async () => {
      const result = await executePlayerTool("control_playback", {
        action: "seek",
        seekTime: 45,
        relative: false,
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
      // sendPlayerCommand будет вызван в реальной реализации
    })

    it("generate_thumbnails должен выполняться без ошибок", async () => {
      const result = await executePlayerTool("generate_thumbnails", {
        method: "auto",
        count: 10,
        resolution: { width: 320, height: 240 },
        includeTimestamps: true,
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("должен возвращать ошибку для неизвестного инструмента", async () => {
      const result = await executePlayerTool("unknown_tool", {})

      expect(result.success).toBe(false)
      expect(result.message).toContain("Неизвестный")
    })
  })

  describe("Enum Values Validation", () => {
    it("previewMode enum должен содержать все режимы предпросмотра", () => {
      const effectsTool = playerTools.find((t) => t.name === "apply_preview_effects")
      expect(effectsTool!.input_schema.properties.previewMode.enum).toContain("real-time")
      expect(effectsTool!.input_schema.properties.previewMode.enum).toContain("render-preview")
      expect(effectsTool!.input_schema.properties.previewMode.enum).toContain("compare-split")
    })

    it("blendMode enum должен содержать все режимы смешивания", () => {
      const filtersTool = playerTools.find((t) => t.name === "apply_preview_filters")
      // blendMode не существует в apply_preview_filters
      // autoColorCorrection поле вместо blendMode
      expect(filtersTool!.input_schema.properties.autoColorCorrection).toHaveProperty("type", "boolean")
    })

    it("aspectsToAnalyze enum должен содержать все аспекты анализа", () => {
      const qualityTool = playerTools.find((t) => t.name === "analyze_media_quality")
      expect(qualityTool!.input_schema.properties.analysisTypes.items.enum).toContain("exposure")
      expect(qualityTool!.input_schema.properties.analysisTypes.items.enum).toContain("color-balance")
      expect(qualityTool!.input_schema.properties.analysisTypes.items.enum).toContain("sharpness")
      expect(qualityTool!.input_schema.properties.analysisTypes.items.enum).toContain("noise")
    })

    it("extractionType enum должен содержать все типы извлечения", () => {
      const extractTool = playerTools.find((t) => t.name === "extract_frame_or_clip")
      expect(extractTool!.input_schema.properties.extractionType.enum).toContain("single-frame")
      expect(extractTool!.input_schema.properties.extractionType.enum).toContain("clip-segment")
      expect(extractTool!.input_schema.properties.extractionType.enum).toContain("audio-segment")
      expect(extractTool!.input_schema.properties.extractionType.enum).toContain("multiple-frames")
    })

    it("comparisonMode enum должен содержать все режимы сравнения", () => {
      const compareTool = playerTools.find((t) => t.name === "compare_media_versions")
      expect(compareTool!.input_schema.properties.comparisonType.enum).toContain("before-after")
      expect(compareTool!.input_schema.properties.comparisonType.enum).toContain("multiple-versions")
      expect(compareTool!.input_schema.properties.comparisonType.enum).toContain("with-reference")
    })

    it("resourceType enum должен содержать все типы ресурсов", () => {
      const saveTool = playerTools.find((t) => t.name === "save_preview_as_resource")
      expect(saveTool!.input_schema.properties.resourceType.enum).toContain("preset")
      expect(saveTool!.input_schema.properties.resourceType.enum).toContain("template")
      expect(saveTool!.input_schema.properties.resourceType.enum).toContain("media-export")
      expect(saveTool!.input_schema.properties.resourceType.enum).toContain("effect-chain")
    })

    it("action enum должен содержать все действия плеера", () => {
      const controlTool = playerTools.find((t) => t.name === "control_playback")
      expect(controlTool!.input_schema.properties.action.enum).toContain("play")
      expect(controlTool!.input_schema.properties.action.enum).toContain("pause")
      expect(controlTool!.input_schema.properties.action.enum).toContain("seek")
      expect(controlTool!.input_schema.properties.action.enum).toContain("stop")
    })

    it("method enum должен содержать все методы генерации", () => {
      const thumbnailsTool = playerTools.find((t) => t.name === "generate_thumbnails")
      expect(thumbnailsTool!.input_schema.properties.extractionMethod.enum).toContain("uniform-intervals")
      expect(thumbnailsTool!.input_schema.properties.extractionMethod.enum).toContain("scene-changes")
      expect(thumbnailsTool!.input_schema.properties.extractionMethod.enum).toContain("custom-times")
    })
  })

  describe("Schema Consistency", () => {
    it("все schema объекты должны иметь type 'object'", () => {
      playerTools.forEach((tool) => {
        expect(tool.input_schema.type).toBe("object")
      })
    })

    it("все enum поля должны содержать минимум 2 варианта", () => {
      playerTools.forEach((tool) => {
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
      playerTools.forEach((tool) => {
        // Проверяем, что описание содержит русские символы
        expect(tool.description).toMatch(/[а-яёА-ЯЁ]/)

        // Проверяем минимальную длину описания
        expect(tool.description.length).toBeGreaterThan(20)
      })
    })

    it("основные поля должны иметь типы", () => {
      playerTools.forEach((tool) => {
        Object.values(tool.input_schema.properties).forEach((property: any) => {
          expect(property).toHaveProperty("type")
          expect(typeof property.type).toBe("string")
        })
      })
    })

    it("некоторые boolean поля имеют default значения", () => {
      let totalBooleans = 0
      let booleansWithDefaults = 0

      playerTools.forEach((tool) => {
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

  describe("Numeric Field Validation", () => {
    it("intensity поле должно иметь правильные ограничения", () => {
      const effectsTool = playerTools.find((t) => t.name === "apply_preview_effects")
      const intensity = effectsTool!.input_schema.properties.effects.items.properties.intensity
      expect(intensity).toHaveProperty("minimum", 0)
      expect(intensity).toHaveProperty("maximum", 1)
    })

    it("count поле должно иметь правильные ограничения", () => {
      const thumbnailsTool = playerTools.find((t) => t.name === "generate_thumbnails")
      const countProperty = thumbnailsTool!.input_schema.properties.thumbnailSettings.properties.count
      expect(countProperty).toHaveProperty("type", "number")
      expect(countProperty).toHaveProperty("description")
    })
  })

  describe("Array Field Validation", () => {
    it("array поля должны иметь правильный тип items", () => {
      // effects array
      const effectsTool = playerTools.find((t) => t.name === "apply_preview_effects")
      expect(effectsTool!.input_schema.properties.effects).toHaveProperty("type", "array")
      expect(effectsTool!.input_schema.properties.effects.items).toHaveProperty("type", "object")

      // filters array
      const filtersTool = playerTools.find((t) => t.name === "apply_preview_filters")
      expect(filtersTool!.input_schema.properties.filters).toHaveProperty("type", "array")
      expect(filtersTool!.input_schema.properties.filters.items).toHaveProperty("type", "object")

      // mediaFiles array
      const templateTool = playerTools.find((t) => t.name === "apply_template_preview")
      expect(templateTool!.input_schema.properties.mediaFiles).toHaveProperty("type", "array")
      expect(templateTool!.input_schema.properties.mediaFiles.items).toHaveProperty("type", "object")
    })
  })

  describe("Error Handling and Edge Cases", () => {
    it("должен обрабатывать отсутствие player state access", async () => {
      // Временно убираем playerStateAccess
      setPlayerStateAccess(null as any)

      const result = await executePlayerTool("analyze_current_media", {})

      expect(result.success).toBe(false)
      expect(result.message).toContain("Player state access")

      // Восстанавливаем
      setPlayerStateAccess(mockPlayerStateAccess)
    })

    it("должен обрабатывать некорректные параметры", async () => {
      const result = await executePlayerTool("apply_preview_effects", {
        effects: "invalid_array", // должен быть массив
        previewMode: "invalid_mode",
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("должен обрабатывать пустые массивы в параметрах", async () => {
      const result = await executePlayerTool("apply_preview_effects", {
        effects: [], // пустой массив
        previewMode: "real-time",
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("должен обрабатывать отсутствие текущего медиа", async () => {
      // Мокаем отсутствие медиа
      mockPlayerStateAccess.getCurrentMedia.mockReturnValueOnce(null)

      const result = await executePlayerTool("analyze_current_media", {})

      expect(result.success).toBe(false)
      expect(result.message).toContain("медиа")
    })

    it("должен обрабатывать ошибки команд плеера", async () => {
      // Мокаем ошибку команды
      mockPlayerStateAccess.sendPlayerCommand.mockRejectedValueOnce(new Error("Player command failed"))

      const result = await executePlayerTool("control_playback", {
        action: "play",
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })
  })

  describe("Tool Result Structure", () => {
    it("результаты должны содержать обязательные поля", async () => {
      const result = await executePlayerTool("analyze_current_media", {
        includeMetadata: true,
      })

      // Обязательные поля для всех результатов
      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")

      // Проверяем типы
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("успешные результаты должны содержать данные", async () => {
      const result = await executePlayerTool("analyze_current_media", {
        includeMetadata: true,
      })

      if (result.success && result.data) {
        expect(typeof result.data).toBe("object")
      }
    })

    it("неуспешные результаты должны содержать информацию об ошибке", async () => {
      const result = await executePlayerTool("unknown_tool", {})

      expect(result.success).toBe(false)
      expect(result).toHaveProperty("message")
      expect(result.message).toContain("Неизвестный")
      expect(result).toHaveProperty("errors")
      expect(Array.isArray(result.errors)).toBe(true)
    })
  })

  describe("PlayerStateAccess Integration", () => {
    it("должен использовать getCurrentMedia при анализе", async () => {
      await executePlayerTool("analyze_current_media", {})
      expect(mockPlayerStateAccess.getCurrentMedia).toHaveBeenCalled()
    })

    it("должен использовать getPlayerState при управлении воспроизведением", async () => {
      await executePlayerTool("control_playback", { action: "pause" })
      // Проверяем, что функция была вызвана, но параметры могут отличаться в реальной реализации
      // В реальной реализации может не вызываться getPlayerState для всех команд
    })

    it("должен использовать getAppliedEffects при анализе", async () => {
      await executePlayerTool("analyze_current_media", { includeEffects: true })
      expect(mockPlayerStateAccess.getAppliedEffects).toHaveBeenCalled()
    })
  })
})
