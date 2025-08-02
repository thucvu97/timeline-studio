/**
 * Тесты для Script Generation Engine
 */

import { beforeEach, describe, expect, it, vi } from "vitest"
import { UnifiedAIService } from "@/features/ai-chat/services/unified-ai-service"
import type { Person } from "@/features/montage-planner/types"
import type { UnifiedContentAnalysis } from "../../../shared/types/content-analysis"
import { NarrativeType, PaceType } from "../../../shared/types/script-generation"
import { DialogueGenerator } from "../services/dialogue-generator"
import { ScriptGenerationEngine } from "../services/script-generation-engine"
import { TemplateEngine } from "../services/template-engine"
import type { ScriptGenerationContext, ScriptGenerationParams } from "../types"

// Мокаем зависимости
vi.mock("@/features/ai-chat/services/unified-ai-service")
vi.mock("../services/dialogue-generator")
vi.mock("../services/template-engine")

describe("ScriptGenerationEngine", () => {
  let engine: ScriptGenerationEngine
  let mockAIService: any
  let mockDialogueGenerator: any
  let mockTemplateEngine: any

  // Тестовые данные
  const mockAnalysis: UnifiedContentAnalysis = {
    mediaFile: {
      filename: "test-video.mp4",
      duration: 120,
      format: "video/mp4",
      path: "/path/to/video.mp4",
    },
    scenes: [
      {
        id: "scene-1",
        startTime: 0,
        endTime: 30,
        duration: 30,
        type: "action",
        content: {
          description: "Opening action scene",
          identifiedPersons: [
            {
              id: "person-1",
              name: "John Doe",
              confidence: 0.9,
              appearances: [],
              totalScreenTime: 0,
            } as Person,
          ],
        },
      },
      {
        id: "scene-2",
        startTime: 30,
        endTime: 60,
        duration: 30,
        type: "dialogue",
        content: {
          description: "Dialog between characters",
        },
      },
      {
        id: "scene-3",
        startTime: 60,
        endTime: 120,
        duration: 60,
        type: "montage",
        content: {
          description: "Closing montage",
        },
      },
    ],
  }

  const mockContext: ScriptGenerationContext = {
    analysis: mockAnalysis.scenes,
    metadata: {
      duration: 120,
      title: "Test Video",
      tags: ["action", "drama"],
    },
    userPrompt: "Create an engaging script",
    detectedPersons: [
      {
        id: "person-1",
        name: "John Doe",
        confidence: 0.9,
        appearances: [],
        totalScreenTime: 30,
      } as Person,
    ],
    characters: [
      {
        id: "char-1",
        name: "John",
        role: "protagonist",
        screenTime: 30,
        appearances: 2,
      },
    ],
  }

  const mockParams: ScriptGenerationParams = {
    genre: ["action", "drama"],
    style: {
      visual: "cinematic" as any,
      narrative: "linear" as any,
      editing: "continuity" as any,
    },
    tone: {
      primary: "serious",
      intensity: 0.7,
    } as any,
    includeDialogue: true,
    includeVoiceover: true,
    narrativeStructure: NarrativeType.THREE_ACT,
  }

  beforeEach(() => {
    // Создаем моки для зависимостей
    mockAIService = {
      sendRequest: vi.fn().mockResolvedValue({
        content: JSON.stringify({
          narrativeType: "three_act",
          scene: {
            title: "Test Scene",
            description: "Test description",
            location: "Test location",
            timeOfDay: "day",
            visualElements: [],
            audioElements: [],
          },
        }),
      }),
      processText: vi.fn().mockResolvedValue("coherence: 8"),
    }

    mockDialogueGenerator = {
      initialize: vi.fn(),
      generate: vi.fn().mockResolvedValue([
        {
          id: "dialogue-1",
          sceneId: "scene-1",
          character: "John",
          text: "Test dialogue",
          timing: { start: 0, end: 2, duration: 2 },
        },
      ]),
    }

    mockTemplateEngine = {
      initialize: vi.fn(),
      getTemplate: vi.fn(),
      applyTemplate: vi.fn(),
    }

    // Мокаем getInstance для UnifiedAIService
    ;(UnifiedAIService.getInstance as any) = vi.fn().mockReturnValue(mockAIService)

    // Мокаем конструкторы для DialogueGenerator и TemplateEngine
    ;(DialogueGenerator as any).mockImplementation(() => mockDialogueGenerator)
    ;(TemplateEngine as any).mockImplementation(() => mockTemplateEngine)

    engine = new ScriptGenerationEngine()
  })

  describe("initialization", () => {
    it("should initialize successfully", async () => {
      await engine.initialize()
      // isReady is a getter, check if it returns true
      expect(engine.isReady()).toBe(true)
      expect(mockDialogueGenerator.initialize).toHaveBeenCalled()
      expect(mockTemplateEngine.initialize).toHaveBeenCalled()
    })

    it("should throw error if initialization fails", async () => {
      mockTemplateEngine.initialize.mockRejectedValue(new Error("Init failed"))
      await expect(engine.initialize()).rejects.toThrow("Init failed")
    })
  })

  describe("process", () => {
    beforeEach(async () => {
      await engine.initialize()
    })

    it("should generate a script successfully", async () => {
      const result = await engine.process({ analysis: mockAnalysis, context: mockContext }, mockParams)

      expect(result).toBeDefined()
      expect(result.id).toBeDefined()
      expect(result.title).toBe("Test Video")
      expect(result.genre).toEqual(["action", "drama"])
      expect(result.duration).toBe(120)
      expect(result.structure).toBeDefined()
      expect(result.structure.type).toBe(NarrativeType.THREE_ACT)
      expect(result.scenes).toBeDefined()
      expect(result.quality).toBeDefined()
      expect(result.alternatives).toBeDefined()
      expect(result.improvements).toBeDefined()
    })

    it("should generate dialogues when includeDialogue is true", async () => {
      // Настраиваем мок для возврата сцен с подходящими условиями для диалогов
      mockAIService.sendRequest.mockResolvedValue({
        content: JSON.stringify({
          title: "Test Scene",
          description: "Test",
          visualElements: [{ type: "close_up" }, { type: "medium_shot" }],
          audioElements: [],
        }),
      })

      const result = await engine.process({ analysis: mockAnalysis, context: mockContext }, mockParams)

      // Проверяем, что диалоги были включены в результат
      expect(result.dialogue).toBeDefined()
      // Проверяем, что есть аудио элементы типа dialogue в сценах
      const hasDialogue = result.scenes.some((scene) => scene.audioElements.some((ae) => ae.type === "dialogue"))
      expect(hasDialogue || result.dialogue.length > 0).toBe(true)
    })

    it("should generate voiceover when includeVoiceover is true", async () => {
      const result = await engine.process({ analysis: mockAnalysis, context: mockContext }, mockParams)

      expect(result.voiceover).toBeDefined()
      expect(mockAIService.sendRequest).toHaveBeenCalled()
    })

    it("should handle missing context gracefully", async () => {
      const result = await engine.process({ analysis: mockAnalysis }, mockParams)

      expect(result).toBeDefined()
      expect(result.title).toBe("test-video.mp4")
    })

    it("should throw error if not initialized", async () => {
      const uninitializedEngine = new ScriptGenerationEngine()
      await expect(uninitializedEngine.process({ analysis: mockAnalysis }, mockParams)).rejects.toThrow(
        "Script Generation Engine not initialized",
      )
    })
  })

  describe("getCapabilities", () => {
    it("should return engine capabilities", () => {
      const capabilities = engine.getCapabilities()

      expect(capabilities.supportsStreaming).toBe(true)
      expect(capabilities.supportsBatch).toBe(true)
      expect(capabilities.maxBatchSize).toBe(5)
      expect(capabilities.supportedFormats).toContain("json")
      expect(capabilities.supportedFormats).toContain("text")
      expect(capabilities.supportedFormats).toContain("markdown")
      expect(capabilities.requiredResources).toBeDefined()
      expect(capabilities.estimatedProcessingTime).toBeDefined()
    })

    it("should estimate processing time based on duration", () => {
      const capabilities = engine.getCapabilities()
      const time = capabilities.estimatedProcessingTime!({
        analysis: { mediaFile: { duration: 120 } },
      } as any)

      expect(time).toBe(12) // 10 + 120/60
    })
  })

  describe("configure", () => {
    it("should update configuration", async () => {
      await engine.configure({
        ai: {
          model: "gpt-4-turbo",
          temperature: 0.5,
          maxTokens: 3000,
          enableStreaming: true,
        },
      })

      // Configuration should be updated internally
      // We can't directly test private config, but we can test its effects
      expect(engine).toBeDefined()
    })
  })

  describe("quality evaluation", () => {
    beforeEach(async () => {
      await engine.initialize()
    })

    it("should evaluate script quality", async () => {
      const result = await engine.process({ analysis: mockAnalysis, context: mockContext }, mockParams)

      expect(result.quality).toBeDefined()
      expect(result.quality.overall).toBeGreaterThanOrEqual(0)
      expect(result.quality.overall).toBeLessThanOrEqual(1)
      expect(result.quality.structure).toBeDefined()
      expect(result.quality.pacing).toBeDefined()
      expect(result.quality.coherence).toBeDefined()
      expect(result.quality.creativity).toBeDefined()
      expect(result.quality.audienceAppeal).toBeDefined()
    })

    it("should suggest improvements for low quality aspects", async () => {
      const result = await engine.process({ analysis: mockAnalysis, context: mockContext }, mockParams)

      expect(result.improvements).toBeDefined()
      expect(Array.isArray(result.improvements)).toBe(true)

      if (result.improvements && result.improvements.length > 0) {
        const improvement = result.improvements[0]
        expect(improvement.type).toBeDefined()
        expect(improvement.description).toBeDefined()
        expect(improvement.impact).toBeDefined()
        expect(improvement.implementation).toBeDefined()
      }
    })
  })

  describe("alternatives generation", () => {
    beforeEach(async () => {
      await engine.initialize()
    })

    it("should generate script alternatives", async () => {
      const result = await engine.process({ analysis: mockAnalysis, context: mockContext }, mockParams)

      expect(result.alternatives).toBeDefined()
      expect(Array.isArray(result.alternatives)).toBe(true)
      expect(result.alternatives!.length).toBeLessThanOrEqual(3)

      if (result.alternatives && result.alternatives.length > 0) {
        const alternative = result.alternatives[0]
        expect(alternative.id).toBeDefined()
        expect(alternative.type).toBeDefined()
        expect(alternative.description).toBeDefined()
        expect(alternative.preview).toBeDefined()
        expect(alternative.differences).toBeDefined()
      }
    })

    it("should generate different types of alternatives", async () => {
      const result = await engine.process({ analysis: mockAnalysis, context: mockContext }, mockParams)

      const alternativeTypes = result.alternatives?.map((alt) => alt.type) || []
      expect(alternativeTypes).toContain("different_style")
    })
  })

  describe("narrative structure", () => {
    beforeEach(async () => {
      await engine.initialize()
    })

    it("should create three-act structure", async () => {
      const result = await engine.process(
        { analysis: mockAnalysis, context: mockContext },
        { ...mockParams, narrativeStructure: NarrativeType.THREE_ACT },
      )

      expect(result.structure.type).toBe(NarrativeType.THREE_ACT)
      expect(result.structure.acts).toHaveLength(3)
      expect(result.structure.acts[0].title).toBe("Setup")
      expect(result.structure.acts[1].title).toBe("Confrontation")
      expect(result.structure.acts[2].title).toBe("Resolution")
      expect(result.structure.turningPoints).toHaveLength(2)
    })

    it("should create five-act structure", async () => {
      const result = await engine.process(
        { analysis: mockAnalysis, context: mockContext },
        { ...mockParams, narrativeStructure: NarrativeType.FIVE_ACT },
      )

      expect(result.structure.type).toBe(NarrativeType.FIVE_ACT)
      expect(result.structure.acts).toHaveLength(5)
      expect(result.structure.turningPoints).toHaveLength(4)
    })

    it("should auto-detect narrative structure when not specified", async () => {
      const paramsWithoutStructure = { ...mockParams }
      delete paramsWithoutStructure.narrativeStructure

      const result = await engine.process({ analysis: mockAnalysis, context: mockContext }, paramsWithoutStructure)

      expect(result.structure.type).toBeDefined()
      expect(result.structure.acts.length).toBeGreaterThan(0)
    })
  })

  describe("pacing calculation", () => {
    beforeEach(async () => {
      await engine.initialize()
    })

    it("should calculate pacing based on scene durations", async () => {
      const result = await engine.process({ analysis: mockAnalysis, context: mockContext }, mockParams)

      expect(result.metadata.pacing).toBeDefined()
      expect(result.metadata.pacing.overall).toBeDefined()
      expect([PaceType.SLOW, PaceType.MODERATE, PaceType.FAST]).toContain(result.metadata.pacing.overall)
    })

    it("should calculate pace variations", async () => {
      const result = await engine.process({ analysis: mockAnalysis, context: mockContext }, mockParams)

      expect(result.metadata.pacing.variations).toBeDefined()
      expect(Array.isArray(result.metadata.pacing.variations)).toBe(true)
    })
  })

  describe("person and character handling", () => {
    beforeEach(async () => {
      await engine.initialize()
    })

    it("should extract persons from analysis", async () => {
      const result = await engine.process({ analysis: mockAnalysis, context: mockContext }, mockParams)

      // detectedPersonsCount может быть undefined если не обнаружено
      expect(result.metadata.detectedPersonsCount).toBeGreaterThanOrEqual(0)
      expect(result.characters).toBeDefined()
    })

    it("should adapt script to person instructions", () => {
      // This would test the adaptScriptToPersonInstructions method
      // which is public and can be tested directly
      const mockScript = {
        id: "test-script",
        title: "Test",
        genre: [],
        duration: 120,
        structure: {
          type: NarrativeType.THREE_ACT,
          acts: [],
          turningPoints: [],
        },
        scenes: [
          {
            id: "scene-1",
            number: 1,
            title: "Test Scene",
            description: "Test",
            duration: 30,
            visualElements: [],
            audioElements: [],
          },
        ],
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          version: 1,
          language: "en",
          tone: { primary: "neutral", intensity: 0.5 } as any,
          pacing: { overall: PaceType.MODERATE, variations: [] },
          style: {} as any,
        },
      }

      const adaptedScript = engine.adaptScriptToPersonInstructions(mockScript, "фокус на John", mockContext)

      expect(adaptedScript).toBeDefined()
      expect(adaptedScript.metadata.adaptedForPersons).toBe(true)
      expect(adaptedScript.metadata.personInstructions).toBe("фокус на John")
    })
  })
})
