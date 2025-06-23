import { beforeEach, describe, expect, it, vi } from "vitest"

import { ApiKeyLoader } from "../../services/api-key-loader"
import {
  FrameAnalysisParams,
  FrameAnalysisResult,
  MultimodalAnalysisService,
  MultimodalAnalysisType,
  ThumbnailSuggestionParams,
  VideoAnalysisParams,
} from "../../services/multimodal-analysis-service"

// Mock dependencies
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

vi.mock("../../services/api-key-loader", () => ({
  ApiKeyLoader: {
    getInstance: vi.fn(),
  },
}))

// Mock fetch globally
global.fetch = vi.fn()

const { invoke } = vi.mocked(await import("@tauri-apps/api/core"))

describe("MultimodalAnalysisService", () => {
  let service: MultimodalAnalysisService
  let mockApiKeyLoader: ApiKeyLoader

  const mockApiKey = "sk-test-openai-key"
  const mockBase64Image = "base64_image_data"

  const mockFrameAnalysisResult: FrameAnalysisResult = {
    frameTimestamp: 5.5,
    analysisType: "frame_description",
    description: "A person walking in a park",
    confidence: 0.95,
    detectedObjects: [
      { name: "person", confidence: 0.9, boundingBox: { x: 100, y: 100, width: 200, height: 300 } },
      { name: "tree", confidence: 0.85 },
    ],
    detectedText: [{ text: "Park Sign", confidence: 0.8, language: "en" }],
    emotions: [{ emotion: "happy", confidence: 0.8, person: "person1" }],
    aestheticScore: {
      composition: 8,
      lighting: 7,
      colorHarmony: 8,
      overall: 7.7,
    },
    tags: ["outdoor", "nature", "person", "walking"],
    metadata: { weather: "sunny" },
  }

  const mockFrames = [
    { imagePath: "/tmp/frame1.jpg", timestamp: 0 },
    { imagePath: "/tmp/frame2.jpg", timestamp: 1 },
    { imagePath: "/tmp/frame3.jpg", timestamp: 2 },
  ]

  const mockGPTResponse = {
    choices: [
      {
        message: {
          content: JSON.stringify({
            description: "A person walking in a park",
            confidence: 0.95,
            objects: [
              { name: "person", confidence: 0.9, boundingBox: { x: 100, y: 100, width: 200, height: 300 } },
              { name: "tree", confidence: 0.85 },
            ],
            text: [{ text: "Park Sign", confidence: 0.8, language: "en" }],
            emotions: [{ emotion: "happy", confidence: 0.8, person: "person1" }],
            aesthetic: {
              composition: 8,
              lighting: 7,
              colorHarmony: 8,
              overall: 7.7,
            },
            tags: ["outdoor", "nature", "person", "walking"],
            metadata: { weather: "sunny" },
          }),
        },
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset singleton instance
    // @ts-expect-error - accessing private property for testing
    MultimodalAnalysisService.instance = undefined

    // Setup mock ApiKeyLoader
    mockApiKeyLoader = {
      getInstance: vi.fn(),
      getApiKey: vi.fn().mockResolvedValue(mockApiKey),
      updateCache: vi.fn(),
    } as any

    vi.mocked(ApiKeyLoader.getInstance).mockReturnValue(mockApiKeyLoader)

    service = MultimodalAnalysisService.getInstance()
  })

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = MultimodalAnalysisService.getInstance()
      const instance2 = MultimodalAnalysisService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe("analyzeFrame", () => {
    it("should analyze a frame successfully", async () => {
      invoke.mockImplementation((command) => {
        if (command === "convert_image_to_base64") {
          return Promise.resolve(mockBase64Image)
        }
        return Promise.reject(new Error(`Unknown command: ${command}`))
      })

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGPTResponse,
      } as Response)

      const params: FrameAnalysisParams = {
        frameImagePath: "/tmp/frame.jpg",
        analysisType: "frame_description",
        detailLevel: "high",
        contextInfo: {
          videoTitle: "Test Video",
          frameTimestamp: 5.5,
        },
      }

      const result = await service.analyzeFrame(params)

      expect(invoke).toHaveBeenCalledWith("convert_image_to_base64", {
        imagePath: "/tmp/frame.jpg",
      })

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.openai.com/v1/chat/completions",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${mockApiKey}`,
          },
        }),
      )

      const fetchBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string)
      expect(fetchBody.model).toBe("gpt-4o")
      expect(fetchBody.messages[0].content[1].image_url.detail).toBe("high")

      expect(result).toMatchObject({
        frameTimestamp: 5.5,
        analysisType: "frame_description",
        description: "A person walking in a park",
        confidence: 0.95,
      })
    })

    it("should handle custom prompts", async () => {
      invoke.mockResolvedValue(mockBase64Image)
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGPTResponse,
      } as Response)

      const customPrompt = "Analyze this frame for safety violations"
      const params: FrameAnalysisParams = {
        frameImagePath: "/tmp/frame.jpg",
        analysisType: "content_moderation",
        customPrompt,
      }

      await service.analyzeFrame(params)

      const fetchBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string)
      expect(fetchBody.messages[0].content[0].text).toContain(customPrompt)
    })

    it("should throw error when API key is not found", async () => {
      mockApiKeyLoader.getApiKey.mockResolvedValue(null)

      const params: FrameAnalysisParams = {
        frameImagePath: "/tmp/frame.jpg",
        analysisType: "frame_description",
      }

      await expect(service.analyzeFrame(params)).rejects.toThrow(
        "OpenAI API ключ не найден. Необходим для GPT-4V анализа.",
      )
    })

    it("should handle API errors", async () => {
      invoke.mockResolvedValue(mockBase64Image)
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => "Unauthorized",
      } as Response)

      const params: FrameAnalysisParams = {
        frameImagePath: "/tmp/frame.jpg",
        analysisType: "frame_description",
      }

      await expect(service.analyzeFrame(params)).rejects.toThrow(
        "Ошибка анализа кадра: Error: OpenAI API error: 401 Unauthorized",
      )
    })

    it("should handle invalid JSON response gracefully", async () => {
      invoke.mockResolvedValue(mockBase64Image)
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: "Not valid JSON" } }],
        }),
      } as Response)

      const params: FrameAnalysisParams = {
        frameImagePath: "/tmp/frame.jpg",
        analysisType: "frame_description",
        contextInfo: { frameTimestamp: 5.5 },
      }

      const result = await service.analyzeFrame(params)

      expect(result).toMatchObject({
        frameTimestamp: 5.5,
        analysisType: "frame_description",
        description: "Not valid JSON",
        confidence: 0.5,
        tags: [],
        metadata: {},
      })
    })

    it("should include context information in prompt", async () => {
      invoke.mockResolvedValue(mockBase64Image)
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGPTResponse,
      } as Response)

      const params: FrameAnalysisParams = {
        frameImagePath: "/tmp/frame.jpg",
        analysisType: "scene_understanding",
        contextInfo: {
          videoTitle: "Nature Documentary",
          videoDuration: 300,
          frameTimestamp: 45.5,
          previousFrames: ["Forest scene", "River flowing"],
        },
      }

      await service.analyzeFrame(params)

      const fetchBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string)
      const prompt = fetchBody.messages[0].content[0].text

      expect(prompt).toContain('Название видео: "Nature Documentary"')
      expect(prompt).toContain("Временная метка: 45.5с")
      expect(prompt).toContain("Предыдущие кадры: Forest scene, River flowing")
    })
  })

  describe("analyzeVideo", () => {
    it("should analyze video with multiple frames", async () => {
      invoke.mockImplementation((command) => {
        if (command === "convert_image_to_base64") {
          return Promise.resolve(mockBase64Image)
        }
        if (command === "extract_frames_for_multimodal_analysis") {
          return Promise.resolve(mockFrames)
        }
        return Promise.reject(new Error(`Unknown command: ${command}`))
      })

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGPTResponse,
      } as Response)

      const params: VideoAnalysisParams = {
        clipId: "clip123",
        analysisTypes: ["frame_description", "object_detection"],
        samplingRate: 1,
        maxFrames: 3,
      }

      const result = await service.analyzeVideo(params)

      expect(invoke).toHaveBeenCalledWith("extract_frames_for_multimodal_analysis", {
        clipId: "clip123",
        samplingRate: 1,
        maxFrames: 3,
      })

      expect(result.clipId).toBe("clip123")
      expect(result.analysisTypes).toEqual(["frame_description", "object_detection"])
      expect(result.frameResults).toHaveLength(6) // 3 frames × 2 analysis types
      expect(result.metadata.totalFramesAnalyzed).toBe(3)
      expect(result.summary.mainSubjects).toContain("outdoor")
      expect(result.summary.overallMood).toBe("happy")
    })

    it("should handle frame analysis errors gracefully", async () => {
      invoke.mockImplementation((command) => {
        if (command === "extract_frames_for_multimodal_analysis") {
          return Promise.resolve(mockFrames)
        }
        if (command === "convert_image_to_base64") {
          throw new Error("Image conversion failed")
        }
        return Promise.reject(new Error(`Unknown command: ${command}`))
      })

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      const params: VideoAnalysisParams = {
        clipId: "clip123",
        analysisTypes: ["frame_description"],
      }

      const result = await service.analyzeVideo(params)

      expect(result.frameResults).toHaveLength(0)
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it("should pass custom prompts to frame analysis", async () => {
      invoke.mockImplementation((command) => {
        if (command === "convert_image_to_base64") {
          return Promise.resolve(mockBase64Image)
        }
        if (command === "extract_frames_for_multimodal_analysis") {
          return Promise.resolve([mockFrames[0]]) // Just one frame
        }
        return Promise.reject(new Error(`Unknown command: ${command}`))
      })

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGPTResponse,
      } as Response)

      const customPrompts = {
        frame_description: "Custom frame description prompt",
        object_detection: "Custom object detection prompt",
      } as Record<MultimodalAnalysisType, string>

      const params: VideoAnalysisParams = {
        clipId: "clip123",
        analysisTypes: ["frame_description", "object_detection"],
        customPrompts,
      }

      await service.analyzeVideo(params)

      const calls = mockFetch.mock.calls
      expect(calls[0][1]?.body).toContain("Custom frame description prompt")
      expect(calls[1][1]?.body).toContain("Custom object detection prompt")
    })

    it("should include previous frame descriptions in context", async () => {
      invoke.mockImplementation((command) => {
        if (command === "convert_image_to_base64") {
          return Promise.resolve(mockBase64Image)
        }
        if (command === "extract_frames_for_multimodal_analysis") {
          return Promise.resolve(mockFrames)
        }
        return Promise.reject(new Error(`Unknown command: ${command}`))
      })

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGPTResponse,
      } as Response)

      const params: VideoAnalysisParams = {
        clipId: "clip123",
        analysisTypes: ["frame_description"],
        maxFrames: 3,
      }

      await service.analyzeVideo(params)

      // Check that later frames include previous descriptions
      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1]
      const lastBody = JSON.parse(lastCall[1]?.body as string)
      const prompt = lastBody.messages[0].content[0].text

      expect(prompt).toContain("Предыдущие кадры:")
    })
  })

  describe("suggestThumbnails", () => {
    it("should suggest thumbnails based on analysis", async () => {
      invoke.mockImplementation((command) => {
        if (command === "convert_image_to_base64") {
          return Promise.resolve(mockBase64Image)
        }
        if (command === "extract_frames_for_multimodal_analysis") {
          return Promise.resolve(mockFrames)
        }
        return Promise.reject(new Error(`Unknown command: ${command}`))
      })

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGPTResponse,
      } as Response)

      const params: ThumbnailSuggestionParams = {
        clipId: "clip123",
        count: 2,
        criteria: ["aesthetic", "emotion"],
      }

      const suggestions = await service.suggestThumbnails(params)

      expect(suggestions).toHaveLength(2)
      expect(suggestions[0]).toMatchObject({
        frameTimestamp: expect.any(Number),
        frameImagePath: expect.any(String),
        score: expect.any(Number),
        reasons: expect.any(Array),
        aestheticScore: 7.7,
        emotionalImpact: 0.8,
      })
    })

    it("should build custom thumbnail selection prompt", async () => {
      invoke.mockImplementation((command) => {
        if (command === "convert_image_to_base64") {
          return Promise.resolve(mockBase64Image)
        }
        if (command === "extract_frames_for_multimodal_analysis") {
          return Promise.resolve([mockFrames[0]])
        }
        return Promise.reject(new Error(`Unknown command: ${command}`))
      })

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGPTResponse,
      } as Response)

      const params: ThumbnailSuggestionParams = {
        clipId: "clip123",
        criteria: ["faces", "text"],
        contextPrompt: "This is a cooking video",
      }

      await service.suggestThumbnails(params)

      const fetchBody = JSON.parse(mockFetch.mock.calls[0][1]?.body as string)
      const prompt = fetchBody.messages[0].content[0].text

      expect(prompt).toContain("faces, text")
      expect(prompt).toContain("This is a cooking video")
    })

    it("should handle thumbnail analysis errors", async () => {
      invoke.mockImplementation((command) => {
        if (command === "extract_frames_for_multimodal_analysis") {
          return Promise.resolve(mockFrames)
        }
        if (command === "convert_image_to_base64") {
          throw new Error("Conversion failed")
        }
        return Promise.reject(new Error(`Unknown command: ${command}`))
      })

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      const params: ThumbnailSuggestionParams = {
        clipId: "clip123",
        count: 5,
      }

      const suggestions = await service.suggestThumbnails(params)

      expect(suggestions).toHaveLength(0)
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it("should calculate visual complexity", async () => {
      invoke.mockImplementation((command) => {
        if (command === "convert_image_to_base64") {
          return Promise.resolve(mockBase64Image)
        }
        if (command === "extract_frames_for_multimodal_analysis") {
          return Promise.resolve([mockFrames[0]])
        }
        return Promise.reject(new Error(`Unknown command: ${command}`))
      })

      const complexResponse = {
        ...mockGPTResponse,
        choices: [
          {
            message: {
              content: JSON.stringify({
                ...JSON.parse(mockGPTResponse.choices[0].message.content),
                objects: Array(10).fill({ name: "object", confidence: 0.8 }),
                text: Array(5).fill({ text: "text", confidence: 0.8 }),
              }),
            },
          },
        ],
      }

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => complexResponse,
      } as Response)

      const params: ThumbnailSuggestionParams = {
        clipId: "clip123",
      }

      const suggestions = await service.suggestThumbnails(params)

      expect(suggestions[0].visualComplexity).toBeGreaterThan(5)
    })
  })

  describe("batchAnalyzeVideos", () => {
    it("should analyze multiple videos with progress callback", async () => {
      invoke.mockImplementation((command) => {
        if (command === "convert_image_to_base64") {
          return Promise.resolve(mockBase64Image)
        }
        if (command === "extract_frames_for_multimodal_analysis") {
          return Promise.resolve([mockFrames[0]]) // One frame per video
        }
        return Promise.reject(new Error(`Unknown command: ${command}`))
      })

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGPTResponse,
      } as Response)

      const progressCallback = vi.fn()
      const clipIds = ["clip1", "clip2", "clip3"]

      const results = await service.batchAnalyzeVideos(clipIds, ["frame_description"], {
        maxConcurrent: 2,
        progressCallback,
      })

      expect(Object.keys(results)).toHaveLength(3)
      expect(results.clip1).toBeDefined()
      expect(results.clip2).toBeDefined()
      expect(results.clip3).toBeDefined()

      expect(progressCallback).toHaveBeenCalledWith({
        completed: expect.any(Number),
        total: 3,
        current: expect.any(String),
      })
    })

    it("should handle batch processing errors", async () => {
      invoke.mockImplementation((command) => {
        if (command === "extract_frames_for_multimodal_analysis") {
          throw new Error("Extraction failed")
        }
        return Promise.reject(new Error(`Unknown command: ${command}`))
      })

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      const results = await service.batchAnalyzeVideos(["clip1", "clip2"], ["frame_description"])

      expect(Object.keys(results)).toHaveLength(0)
      expect(consoleSpy).toHaveBeenCalled()

      consoleSpy.mockRestore()
    })

    it("should respect maxConcurrent limit", async () => {
      let concurrentCount = 0
      let maxConcurrent = 0

      invoke.mockImplementation(async (command) => {
        if (command === "extract_frames_for_multimodal_analysis") {
          concurrentCount++
          maxConcurrent = Math.max(maxConcurrent, concurrentCount)
          await new Promise((resolve) => setTimeout(resolve, 50))
          concurrentCount--
          return [mockFrames[0]]
        }
        if (command === "convert_image_to_base64") {
          return mockBase64Image
        }
        throw new Error(`Unknown command: ${command}`)
      })

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGPTResponse,
      } as Response)

      await service.batchAnalyzeVideos(["clip1", "clip2", "clip3", "clip4"], ["frame_description"], {
        maxConcurrent: 2,
      })

      expect(maxConcurrent).toBeLessThanOrEqual(2)
    })
  })

  describe("helper methods", () => {
    it("should generate correct prompts for different analysis types", async () => {
      invoke.mockResolvedValue(mockBase64Image)
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockGPTResponse,
      } as Response)

      const analysisTypes: MultimodalAnalysisType[] = [
        "frame_description",
        "scene_understanding",
        "object_detection",
        "emotion_analysis",
        "action_recognition",
        "text_recognition",
        "aesthetic_analysis",
        "content_moderation",
        "thumbnail_selection",
        "highlight_detection",
      ]

      for (const analysisType of analysisTypes) {
        await service.analyzeFrame({
          frameImagePath: "/tmp/frame.jpg",
          analysisType,
        })
      }

      const calls = mockFetch.mock.calls
      expect(calls).toHaveLength(analysisTypes.length)

      // Check that each call has appropriate prompt
      expect(calls[0][1]?.body).toContain("Опишите этот кадр детально")
      expect(calls[1][1]?.body).toContain("Проанализируйте сцену")
      expect(calls[2][1]?.body).toContain("Перечислите все объекты")
      expect(calls[3][1]?.body).toContain("Определите эмоции")
      expect(calls[4][1]?.body).toContain("Опишите все действия")
      expect(calls[5][1]?.body).toContain("Найдите и извлеките весь текст")
      expect(calls[6][1]?.body).toContain("Оцените эстетические качества")
      expect(calls[7][1]?.body).toContain("Проверьте содержимое")
      expect(calls[8][1]?.body).toContain("насколько этот кадр подходит")
      expect(calls[9][1]?.body).toContain("является ли этот кадр ключевым")
    })

    it("should handle network errors", async () => {
      invoke.mockResolvedValue(mockBase64Image)
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockRejectedValue(new Error("Network error"))

      const params: FrameAnalysisParams = {
        frameImagePath: "/tmp/frame.jpg",
        analysisType: "frame_description",
      }

      await expect(service.analyzeFrame(params)).rejects.toThrow("Ошибка анализа кадра: Error: Network error")
    })

    it("should calculate average confidence correctly", async () => {
      invoke.mockImplementation((command) => {
        if (command === "convert_image_to_base64") {
          return Promise.resolve(mockBase64Image)
        }
        if (command === "extract_frames_for_multimodal_analysis") {
          return Promise.resolve([mockFrames[0], mockFrames[1]])
        }
        return Promise.reject(new Error(`Unknown command: ${command}`))
      })

      const responses = [
        {
          ...mockGPTResponse,
          choices: [
            {
              message: {
                content: JSON.stringify({ ...JSON.parse(mockGPTResponse.choices[0].message.content), confidence: 0.8 }),
              },
            },
          ],
        },
        {
          ...mockGPTResponse,
          choices: [
            {
              message: {
                content: JSON.stringify({ ...JSON.parse(mockGPTResponse.choices[0].message.content), confidence: 0.6 }),
              },
            },
          ],
        },
      ]

      let responseIndex = 0
      const mockFetch = vi.mocked(fetch)
      mockFetch.mockImplementation(
        async () =>
          ({
            ok: true,
            json: async () => responses[responseIndex++],
          }) as Response,
      )

      const params: VideoAnalysisParams = {
        clipId: "clip123",
        analysisTypes: ["frame_description"],
      }

      const result = await service.analyzeVideo(params)

      expect(result.metadata.averageConfidence).toBe(0.7)
    })

    it("should extract detected languages", async () => {
      invoke.mockImplementation((command) => {
        if (command === "convert_image_to_base64") {
          return Promise.resolve(mockBase64Image)
        }
        if (command === "extract_frames_for_multimodal_analysis") {
          return Promise.resolve([mockFrames[0]])
        }
        return Promise.reject(new Error(`Unknown command: ${command}`))
      })

      const responseWithLanguages = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                ...JSON.parse(mockGPTResponse.choices[0].message.content),
                text: [
                  { text: "Hello", language: "en", confidence: 0.9 },
                  { text: "Привет", language: "ru", confidence: 0.8 },
                  { text: "Bonjour", language: "fr", confidence: 0.85 },
                ],
              }),
            },
          },
        ],
      }

      const mockFetch = vi.mocked(fetch)
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => responseWithLanguages,
      } as Response)

      const params: VideoAnalysisParams = {
        clipId: "clip123",
        analysisTypes: ["text_recognition"],
      }

      const result = await service.analyzeVideo(params)

      expect(result.metadata.detectedLanguages).toContain("en")
      expect(result.metadata.detectedLanguages).toContain("ru")
      expect(result.metadata.detectedLanguages).toContain("fr")
    })
  })
})
