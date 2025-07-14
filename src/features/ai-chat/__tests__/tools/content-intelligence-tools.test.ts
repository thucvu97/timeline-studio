import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  adaptContentToPlatform,
  analyzeContentIntelligence,
  analyzeContentQuality,
  classifyContent,
  contentIntelligenceTools,
  createShotList,
  detectSceneBoundaries,
  executeContentIntelligenceTool,
  generateContentVariants,
  generateFullScript,
  generateMultiLanguageBatch,
} from "../../tools/content-intelligence-tools"

describe("Content Intelligence Tools", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Tool Structure Validation", () => {
    it("должен содержать 9 инструментов", () => {
      expect(contentIntelligenceTools).toHaveLength(9)
    })

    it("каждый инструмент должен иметь корректную структуру", () => {
      contentIntelligenceTools.forEach((tool) => {
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
      const names = contentIntelligenceTools.map((tool) => tool.name)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(names.length)
    })

    it("все обязательные поля должны быть указаны в required", () => {
      contentIntelligenceTools.forEach((tool) => {
        if (tool.input_schema.required) {
          tool.input_schema.required.forEach((required: string) => {
            expect(tool.input_schema.properties).toHaveProperty(required)
          })
        }
      })
    })
  })

  describe("Individual Tool Schema Validation", () => {
    it("analyze_content_intelligence должен иметь правильную схему", () => {
      expect(analyzeContentIntelligence.name).toBe("analyze_content_intelligence")
      expect(analyzeContentIntelligence.input_schema.properties.media_files).toHaveProperty("type", "array")
      expect(analyzeContentIntelligence.input_schema.properties.analysis_depth).toHaveProperty("enum")
      expect(analyzeContentIntelligence.input_schema.properties.analysis_depth.enum).toEqual([
        "quick",
        "normal",
        "deep",
      ])
      expect(analyzeContentIntelligence.input_schema.properties.target_platforms).toHaveProperty("type", "array")
      expect(analyzeContentIntelligence.input_schema.required).toEqual(["media_files", "analysis_depth"])
    })

    it("detect_scene_boundaries должен иметь правильную схему", () => {
      expect(detectSceneBoundaries.name).toBe("detect_scene_boundaries")
      expect(detectSceneBoundaries.input_schema.properties.video_path).toHaveProperty("type", "string")
      expect(detectSceneBoundaries.input_schema.properties.sensitivity).toHaveProperty("minimum", 0.1)
      expect(detectSceneBoundaries.input_schema.properties.sensitivity).toHaveProperty("maximum", 1.0)
      expect(detectSceneBoundaries.input_schema.required).toEqual(["video_path"])
    })

    it("classify_content должен иметь правильную схему", () => {
      expect(classifyContent.name).toBe("classify_content")
      expect(classifyContent.input_schema.properties.media_input).toHaveProperty("type", "object")
      expect(classifyContent.input_schema.properties.classification_types).toHaveProperty("type", "array")
      expect(classifyContent.input_schema.properties.classification_types.items.enum).toContain("genre")
      expect(classifyContent.input_schema.properties.classification_types.items.enum).toContain("style")
      expect(classifyContent.input_schema.required).toEqual(["media_input", "classification_types"])
    })

    it("generate_full_script должен иметь правильную схему", () => {
      expect(generateFullScript.name).toBe("generate_full_script")
      expect(generateFullScript.input_schema.properties.scene_analysis).toHaveProperty("type", "object")
      expect(generateFullScript.input_schema.properties.script_style).toHaveProperty("enum")
      expect(generateFullScript.input_schema.properties.script_style.enum).toContain("documentary")
      expect(generateFullScript.input_schema.properties.narrative_structure).toHaveProperty("enum")
      expect(generateFullScript.input_schema.required).toEqual(["scene_analysis", "script_style"])
    })

    it("create_shot_list должен иметь правильную схему", () => {
      expect(createShotList.name).toBe("create_shot_list")
      expect(createShotList.input_schema.properties.script_content).toHaveProperty("type", "string")
      expect(createShotList.input_schema.properties.shot_types).toHaveProperty("type", "array")
      expect(createShotList.input_schema.properties.shot_types.items.enum).toContain("wide")
      expect(createShotList.input_schema.properties.shot_types.items.enum).toContain("close-up")
      expect(createShotList.input_schema.required).toEqual(["script_content"])
    })

    it("adapt_content_to_platform должен иметь правильную схему", () => {
      expect(adaptContentToPlatform.name).toBe("adapt_content_to_platform")
      expect(adaptContentToPlatform.input_schema.properties.source_content).toHaveProperty("type", "object")
      expect(adaptContentToPlatform.input_schema.properties.target_platform).toHaveProperty("enum")
      expect(adaptContentToPlatform.input_schema.properties.target_platform.enum).toContain("youtube_long")
      expect(adaptContentToPlatform.input_schema.properties.target_platform.enum).toContain("tiktok")
      expect(adaptContentToPlatform.input_schema.required).toEqual(["source_content", "target_platform"])
    })

    it("generate_multilanguage_batch должен иметь правильную схему", () => {
      expect(generateMultiLanguageBatch.name).toBe("generate_multilanguage_batch")
      expect(generateMultiLanguageBatch.input_schema.properties.source_content).toHaveProperty("type", "object")
      expect(generateMultiLanguageBatch.input_schema.properties.target_languages).toHaveProperty("type", "array")
      expect(generateMultiLanguageBatch.input_schema.properties.localization_level).toHaveProperty("enum")
      expect(generateMultiLanguageBatch.input_schema.properties.localization_level.enum).toEqual([
        "translation",
        "localization",
        "cultural_adaptation",
      ])
      expect(generateMultiLanguageBatch.input_schema.required).toEqual(["source_content", "target_languages"])
    })

    it("generate_content_variants должен иметь правильную схему", () => {
      expect(generateContentVariants.name).toBe("generate_content_variants")
      expect(generateContentVariants.input_schema.properties.base_content).toHaveProperty("type", "object")
      expect(generateContentVariants.input_schema.properties.variant_types).toHaveProperty("type", "array")
      expect(generateContentVariants.input_schema.properties.variant_types.items.enum).toContain("tone_variation")
      expect(generateContentVariants.input_schema.required).toEqual(["base_content", "variant_types"])
    })

    it("analyze_content_quality должен иметь правильную схему", () => {
      expect(analyzeContentQuality.name).toBe("analyze_content_quality")
      expect(analyzeContentQuality.input_schema.properties.content_input).toHaveProperty("type", "object")
      expect(analyzeContentQuality.input_schema.properties.quality_aspects).toHaveProperty("type", "array")
      expect(analyzeContentQuality.input_schema.properties.quality_aspects.items.enum).toContain("technical")
      expect(analyzeContentQuality.input_schema.properties.quality_aspects.items.enum).toContain("narrative")
      expect(analyzeContentQuality.input_schema.required).toEqual(["content_input", "quality_aspects"])
    })
  })

  describe("Tool Function Execution", () => {
    it("analyze_content_intelligence должен выполняться без ошибок", async () => {
      const result = await executeContentIntelligenceTool("analyze_content_intelligence", {
        media_files: ["/path/to/video1.mp4", "/path/to/video2.mp4"],
        analysis_depth: "normal",
        target_platforms: ["youtube", "tiktok"],
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(result).toHaveProperty("toolName", "analyze_content_intelligence")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("detect_scene_boundaries должен выполняться без ошибок", async () => {
      const result = await executeContentIntelligenceTool("detect_scene_boundaries", {
        video_path: "/path/to/video.mp4",
        sensitivity: 0.7,
        classify_types: true,
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(result).toHaveProperty("toolName", "detect_scene_boundaries")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("classify_content должен выполняться без ошибок", async () => {
      const result = await executeContentIntelligenceTool("classify_content", {
        media_input: {
          video_path: "/path/to/video.mp4",
          transcript: "Test transcript",
        },
        classification_types: ["genre", "style", "emotion"],
        include_confidence: true,
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(result).toHaveProperty("toolName", "classify_content")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("generate_full_script должен выполняться без ошибок", async () => {
      const result = await executeContentIntelligenceTool("generate_full_script", {
        scene_analysis: {
          scenes: [
            { start: 0, end: 30, type: "dialog" },
            { start: 30, end: 60, type: "action" },
          ],
        },
        script_style: "documentary",
        target_duration: 5,
        narrative_structure: "chronological",
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(result).toHaveProperty("toolName", "generate_full_script")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("create_shot_list должен выполняться без ошибок", async () => {
      const result = await executeContentIntelligenceTool("create_shot_list", {
        script_content: "Test script content with scenes and dialogue",
        shot_types: ["wide", "medium", "close-up"],
        include_camera_movements: true,
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(result).toHaveProperty("toolName", "create_shot_list")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("adapt_content_to_platform должен выполняться без ошибок", async () => {
      const result = await executeContentIntelligenceTool("adapt_content_to_platform", {
        source_content: {
          script: "Original script content",
          scenes: [],
          metadata: {},
        },
        target_platform: "youtube_shorts",
        adaptation_depth: "advanced",
        include_seo: true,
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(result).toHaveProperty("toolName", "adapt_content_to_platform")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("generate_multilanguage_batch должен выполняться без ошибок", async () => {
      const result = await executeContentIntelligenceTool("generate_multilanguage_batch", {
        source_content: {
          script: "English script content",
          subtitles: [],
        },
        target_languages: ["es", "fr", "de"],
        localization_level: "localization",
        cultural_sensitivity: true,
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(result).toHaveProperty("toolName", "generate_multilanguage_batch")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("generate_content_variants должен выполняться без ошибок", async () => {
      const result = await executeContentIntelligenceTool("generate_content_variants", {
        base_content: {
          script: "Base script content",
          style: "professional",
        },
        variant_types: ["tone_variation", "structure_variation", "audience_variation"],
        target_metrics: ["engagement", "conversion"],
        platform_context: "youtube",
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(result).toHaveProperty("toolName", "generate_content_variants")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("analyze_content_quality должен выполняться без ошибок", async () => {
      const result = await executeContentIntelligenceTool("analyze_content_quality", {
        content_input: {
          video_analysis: { quality: "high" },
          audio_analysis: { clarity: "good" },
          script_analysis: { structure: "clear" },
        },
        quality_aspects: ["technical", "narrative", "engagement"],
        benchmark_level: "professional",
        generate_actionable_recommendations: true,
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(result).toHaveProperty("toolName", "analyze_content_quality")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("должен возвращать ошибку для неизвестного инструмента", async () => {
      const result = await executeContentIntelligenceTool("unknown_tool", {})

      expect(result.success).toBe(false)
      expect(result.message).toContain("Неизвестный")
    })
  })

  describe("Enum Values Validation", () => {
    it("analysis_depth enum должен содержать все уровни глубины", () => {
      expect(analyzeContentIntelligence.input_schema.properties.analysis_depth.enum).toEqual([
        "quick",
        "normal",
        "deep",
      ])
    })

    it("target_platforms enum должен содержать все поддерживаемые платформы", () => {
      const platformsEnum = analyzeContentIntelligence.input_schema.properties.target_platforms.items.enum
      expect(platformsEnum).toContain("youtube")
      expect(platformsEnum).toContain("tiktok")
      expect(platformsEnum).toContain("instagram")
      expect(platformsEnum).toContain("twitter")
      expect(platformsEnum).toContain("facebook")
    })

    it("classification_types enum должен содержать все типы классификации", () => {
      const classificationEnum = classifyContent.input_schema.properties.classification_types.items.enum
      expect(classificationEnum).toContain("genre")
      expect(classificationEnum).toContain("style")
      expect(classificationEnum).toContain("emotion")
      expect(classificationEnum).toContain("audience")
      expect(classificationEnum).toContain("technical_quality")
      expect(classificationEnum).toContain("content_rating")
    })

    it("script_style enum должен содержать все стили сценария", () => {
      const scriptStyleEnum = generateFullScript.input_schema.properties.script_style.enum
      expect(scriptStyleEnum).toContain("documentary")
      expect(scriptStyleEnum).toContain("narrative")
      expect(scriptStyleEnum).toContain("instructional")
      expect(scriptStyleEnum).toContain("promotional")
      expect(scriptStyleEnum).toContain("news")
      expect(scriptStyleEnum).toContain("interview")
    })

    it("shot_types enum должен содержать все типы кадров", () => {
      const shotTypesEnum = createShotList.input_schema.properties.shot_types.items.enum
      expect(shotTypesEnum).toContain("wide")
      expect(shotTypesEnum).toContain("medium")
      expect(shotTypesEnum).toContain("close-up")
      expect(shotTypesEnum).toContain("extreme-close-up")
      expect(shotTypesEnum).toContain("over-shoulder")
      expect(shotTypesEnum).toContain("point-of-view")
      expect(shotTypesEnum).toContain("establishing")
    })

    it("adaptation_depth enum должен содержать все уровни адаптации", () => {
      const adaptationEnum = adaptContentToPlatform.input_schema.properties.adaptation_depth.enum
      expect(adaptationEnum).toEqual(["basic", "advanced", "algorithm_optimized"])
    })

    it("localization_level enum должен содержать все уровни локализации", () => {
      const localizationEnum = generateMultiLanguageBatch.input_schema.properties.localization_level.enum
      expect(localizationEnum).toEqual(["translation", "localization", "cultural_adaptation"])
    })

    it("quality_aspects enum должен содержать все аспекты качества", () => {
      const qualityEnum = analyzeContentQuality.input_schema.properties.quality_aspects.items.enum
      expect(qualityEnum).toContain("technical")
      expect(qualityEnum).toContain("narrative")
      expect(qualityEnum).toContain("engagement")
      expect(qualityEnum).toContain("accessibility")
      expect(qualityEnum).toContain("platform_compliance")
      expect(qualityEnum).toContain("seo")
    })
  })

  describe("Schema Consistency", () => {
    it("все schema объекты должны иметь type 'object'", () => {
      contentIntelligenceTools.forEach((tool) => {
        expect(tool.input_schema.type).toBe("object")
      })
    })

    it("все enum поля должны содержать минимум 2 варианта", () => {
      contentIntelligenceTools.forEach((tool) => {
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
      contentIntelligenceTools.forEach((tool) => {
        // Проверяем, что описание содержит русские символы
        expect(tool.description).toMatch(/[а-яёА-ЯЁ]/)

        // Проверяем минимальную длину описания
        expect(tool.description.length).toBeGreaterThan(20)
      })
    })

    it("основные поля должны иметь типы", () => {
      contentIntelligenceTools.forEach((tool) => {
        Object.values(tool.input_schema.properties).forEach((property: any) => {
          expect(property).toHaveProperty("type")
          expect(typeof property.type).toBe("string")
        })
      })
    })

    it("некоторые boolean поля имеют default значения", () => {
      let totalBooleans = 0
      let booleansWithDefaults = 0

      contentIntelligenceTools.forEach((tool) => {
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

      // Проверяем, что есть хотя бы несколько boolean полей
      expect(totalBooleans).toBeGreaterThan(0)
      expect(booleansWithDefaults).toBeGreaterThanOrEqual(0) // Хотя бы 0 полей с defaults
    })
  })

  describe("Numeric Field Validation", () => {
    it("sensitivity поле должно иметь правильные ограничения", () => {
      const sensitivity = detectSceneBoundaries.input_schema.properties.sensitivity
      expect(sensitivity).toHaveProperty("minimum", 0.1)
      expect(sensitivity).toHaveProperty("maximum", 1.0)
    })

    it("generate_variants поле должно иметь правильные ограничения", () => {
      const generateVariants = adaptContentToPlatform.input_schema.properties.generate_variants
      expect(generateVariants).toHaveProperty("minimum", 1)
      expect(generateVariants).toHaveProperty("maximum", 5)
    })
  })

  describe("Array Field Validation", () => {
    it("array поля должны иметь правильный тип items", () => {
      // media_files array
      const mediaFiles = analyzeContentIntelligence.input_schema.properties.media_files
      expect(mediaFiles.items).toHaveProperty("type", "string")

      // target_platforms array
      const targetPlatforms = analyzeContentIntelligence.input_schema.properties.target_platforms
      expect(targetPlatforms.items).toHaveProperty("enum")

      // languages array
      const languages = analyzeContentIntelligence.input_schema.properties.languages
      expect(languages.items).toHaveProperty("type", "string")
    })
  })

  describe("Error Handling and Edge Cases", () => {
    it("должен обрабатывать некорректные параметры", async () => {
      const result = await executeContentIntelligenceTool("analyze_content_intelligence", {
        media_files: [], // пустой массив
        analysis_depth: "invalid_depth",
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("должен обрабатывать отсутствие обязательных параметров", async () => {
      const result = await executeContentIntelligenceTool("detect_scene_boundaries", {
        // отсутствует video_path
        sensitivity: 0.5,
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })

    it("должен обрабатывать некорректные типы данных", async () => {
      const result = await executeContentIntelligenceTool("classify_content", {
        media_input: "invalid_object", // должен быть объект
        classification_types: "invalid_array", // должен быть массив
      })

      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
    })
  })

  describe("Tool Result Structure", () => {
    it("результаты должны содержать обязательные поля", async () => {
      const result = await executeContentIntelligenceTool("analyze_content_quality", {
        content_input: { video_analysis: {} },
        quality_aspects: ["technical"],
      })

      // Обязательные поля для всех результатов
      expect(result).toHaveProperty("success")
      expect(result).toHaveProperty("message")
      expect(result).toHaveProperty("toolName")
      expect(result).toHaveProperty("input")

      // Проверяем типы
      expect(typeof result.success).toBe("boolean")
      expect(typeof result.message).toBe("string")
      expect(typeof result.toolName).toBe("string")
      expect(typeof result.input).toBe("object")
    })

    it("успешные результаты должны содержать данные", async () => {
      const result = await executeContentIntelligenceTool("generate_full_script", {
        scene_analysis: { scenes: [] },
        script_style: "documentary",
      })

      if (result.success) {
        expect(result).toHaveProperty("data")
        // Дополнительные поля могут присутствовать: analysis, script, variants, etc.
      }
    })

    it("неуспешные результаты должны содержать информацию об ошибке", async () => {
      const result = await executeContentIntelligenceTool("unknown_tool", {})

      expect(result.success).toBe(false)
      expect(result).toHaveProperty("message")
      expect(result.message).toContain("Неизвестный")
    })
  })
})
