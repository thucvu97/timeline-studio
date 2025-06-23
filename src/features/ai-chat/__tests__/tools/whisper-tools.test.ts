/**
 * Tests for whisper-tools.ts
 * Comprehensive testing of all 10 Whisper tools and the executeWhisperTool function
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { WhisperService } from "../../services/whisper-service"
import { executeWhisperTool, whisperTools } from "../../tools/whisper-tools"

// Mock WhisperService
vi.mock("../../services/whisper-service", () => ({
  WhisperService: {
    getInstance: vi.fn(() => ({
      loadApiKey: vi.fn(),
      isLocalWhisperAvailable: vi.fn(),
      getAvailableLocalModels: vi.fn(),
      downloadLocalModel: vi.fn(),
      extractAudioForTranscription: vi.fn(),
      transcribeWithLocalModel: vi.fn(),
      transcribeWithOpenAI: vi.fn(),
      translateWithOpenAI: vi.fn(),
      getSupportedLanguages: vi.fn(),
    })),
  },
}))

describe("whisperTools", () => {
  describe("Tool definitions", () => {
    it("should export exactly 10 whisper tools", () => {
      expect(whisperTools).toHaveLength(10)
    })

    it("should have all expected tool names", () => {
      const expectedToolNames = [
        "check_whisper_availability",
        "get_whisper_models",
        "download_whisper_model",
        "transcribe_media",
        "translate_audio_to_english",
        "batch_transcribe_clips",
        "create_subtitles_from_transcription",
        "detect_audio_language",
        "improve_transcription_quality",
        "sync_subtitles_with_whisper",
      ]

      const actualToolNames = whisperTools.map((tool) => tool.name)
      expect(actualToolNames).toEqual(expectedToolNames)
    })

    it("should have proper tool structure", () => {
      whisperTools.forEach((tool) => {
        expect(tool).toHaveProperty("name")
        expect(tool).toHaveProperty("description")
        expect(tool).toHaveProperty("input_schema")
        expect(tool.input_schema).toHaveProperty("type", "object")
        expect(tool.input_schema).toHaveProperty("properties")
        expect(tool.input_schema).toHaveProperty("required")

        expect(typeof tool.name).toBe("string")
        expect(typeof tool.description).toBe("string")
        expect(Array.isArray(tool.input_schema.required)).toBe(true)
      })
    })

    describe("check_whisper_availability tool", () => {
      it("should have correct schema", () => {
        const tool = whisperTools.find((t) => t.name === "check_whisper_availability")
        expect(tool).toBeDefined()
        expect(tool!.description).toContain("доступность")
        expect(tool!.input_schema.required).toEqual([])
        expect(Object.keys(tool!.input_schema.properties)).toEqual([])
      })
    })

    describe("get_whisper_models tool", () => {
      it("should have correct schema", () => {
        const tool = whisperTools.find((t) => t.name === "get_whisper_models")
        expect(tool).toBeDefined()
        expect(tool!.description).toContain("список доступных моделей")
        expect(tool!.input_schema.required).toEqual([])
        expect(tool!.input_schema.properties).toHaveProperty("includeLocal")
        expect(tool!.input_schema.properties).toHaveProperty("includeApi")
      })
    })

    describe("download_whisper_model tool", () => {
      it("should have correct schema", () => {
        const tool = whisperTools.find((t) => t.name === "download_whisper_model")
        expect(tool).toBeDefined()
        expect(tool!.description).toContain("Скачивает")
        expect(tool!.input_schema.required).toEqual(["modelName"])
        expect(tool!.input_schema.properties).toHaveProperty("modelName")

        const modelNameProp = (tool!.input_schema.properties as any).modelName
        expect(modelNameProp.enum).toContain("whisper-tiny")
        expect(modelNameProp.enum).toContain("whisper-large-v3")
      })
    })

    describe("transcribe_media tool", () => {
      it("should have correct schema", () => {
        const tool = whisperTools.find((t) => t.name === "transcribe_media")
        expect(tool).toBeDefined()
        expect(tool!.description).toContain("Транскрибирует")
        expect(tool!.input_schema.required).toEqual(["clipId"])
        expect(tool!.input_schema.properties).toHaveProperty("clipId")
        expect(tool!.input_schema.properties).toHaveProperty("language")
        expect(tool!.input_schema.properties).toHaveProperty("model")
        expect(tool!.input_schema.properties).toHaveProperty("useLocal")
        expect(tool!.input_schema.properties).toHaveProperty("includeWordTimestamps")
        expect(tool!.input_schema.properties).toHaveProperty("prompt")
      })
    })

    describe("translate_audio_to_english tool", () => {
      it("should have correct schema", () => {
        const tool = whisperTools.find((t) => t.name === "translate_audio_to_english")
        expect(tool).toBeDefined()
        expect(tool!.description).toContain("Переводит аудио")
        expect(tool!.input_schema.required).toEqual(["clipId"])
        expect(tool!.input_schema.properties).toHaveProperty("clipId")
        expect(tool!.input_schema.properties).toHaveProperty("model")
        expect(tool!.input_schema.properties).toHaveProperty("prompt")
      })
    })

    describe("batch_transcribe_clips tool", () => {
      it("should have correct schema", () => {
        const tool = whisperTools.find((t) => t.name === "batch_transcribe_clips")
        expect(tool).toBeDefined()
        expect(tool!.description).toContain("несколько клипов")
        expect(tool!.input_schema.required).toEqual(["clipIds"])
        expect(tool!.input_schema.properties).toHaveProperty("clipIds")

        const clipIdsProp = (tool!.input_schema.properties as any).clipIds
        expect(clipIdsProp.type).toBe("array")
        expect(clipIdsProp.items.type).toBe("string")
      })
    })

    describe("create_subtitles_from_transcription tool", () => {
      it("should have correct schema", () => {
        const tool = whisperTools.find((t) => t.name === "create_subtitles_from_transcription")
        expect(tool).toBeDefined()
        expect(tool!.description).toContain("субтитров")
        expect(tool!.input_schema.required).toEqual(["transcriptionText"])
        expect(tool!.input_schema.properties).toHaveProperty("transcriptionText")
        expect(tool!.input_schema.properties).toHaveProperty("format")

        const formatProp = (tool!.input_schema.properties as any).format
        expect(formatProp.enum).toEqual(["srt", "vtt", "ass"])
      })
    })

    describe("detect_audio_language tool", () => {
      it("should have correct schema", () => {
        const tool = whisperTools.find((t) => t.name === "detect_audio_language")
        expect(tool).toBeDefined()
        expect(tool!.description).toContain("Определяет язык")
        expect(tool!.input_schema.required).toEqual(["clipId"])
        expect(tool!.input_schema.properties).toHaveProperty("clipId")
        expect(tool!.input_schema.properties).toHaveProperty("sampleDuration")
      })
    })

    describe("improve_transcription_quality tool", () => {
      it("should have correct schema", () => {
        const tool = whisperTools.find((t) => t.name === "improve_transcription_quality")
        expect(tool).toBeDefined()
        expect(tool!.description).toContain("Улучшает качество")
        expect(tool!.input_schema.required).toEqual(["transcriptionText"])
        expect(tool!.input_schema.properties).toHaveProperty("transcriptionText")
        expect(tool!.input_schema.properties).toHaveProperty("context")
        expect(tool!.input_schema.properties).toHaveProperty("fixPunctuation")
        expect(tool!.input_schema.properties).toHaveProperty("fixCapitalization")
        expect(tool!.input_schema.properties).toHaveProperty("removeFillers")
      })
    })

    describe("sync_subtitles_with_whisper tool", () => {
      it("should have correct schema", () => {
        const tool = whisperTools.find((t) => t.name === "sync_subtitles_with_whisper")
        expect(tool).toBeDefined()
        expect(tool!.description).toContain("Синхронизирует")
        expect(tool!.input_schema.required).toEqual(["clipId", "subtitleText"])
        expect(tool!.input_schema.properties).toHaveProperty("clipId")
        expect(tool!.input_schema.properties).toHaveProperty("subtitleText")
        expect(tool!.input_schema.properties).toHaveProperty("language")
        expect(tool!.input_schema.properties).toHaveProperty("tolerance")
      })
    })
  })
})

describe("executeWhisperTool", () => {
  let mockWhisperService: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockWhisperService = {
      loadApiKey: vi.fn(),
      isLocalWhisperAvailable: vi.fn(),
      getAvailableLocalModels: vi.fn(),
      downloadLocalModel: vi.fn(),
      extractAudioForTranscription: vi.fn(),
      transcribeWithLocalModel: vi.fn(),
      transcribeWithOpenAI: vi.fn(),
      translateWithOpenAI: vi.fn(),
      getSupportedLanguages: vi.fn(),
    }

    vi.mocked(WhisperService.getInstance).mockReturnValue(mockWhisperService)
  })

  describe("check_whisper_availability", () => {
    it("should check whisper availability successfully", async () => {
      mockWhisperService.loadApiKey.mockResolvedValue(true)
      mockWhisperService.isLocalWhisperAvailable.mockResolvedValue(true)
      mockWhisperService.getAvailableLocalModels.mockResolvedValue([
        { name: "whisper-tiny", isDownloaded: true },
        { name: "whisper-base", isDownloaded: false },
      ])

      const result = await executeWhisperTool("check_whisper_availability", {})

      expect(result).toEqual({
        openai: true,
        local: true,
        models: ["whisper-tiny"],
      })
    })

    it("should handle errors gracefully", async () => {
      mockWhisperService.loadApiKey.mockRejectedValue(new Error("API error"))
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      const result = await executeWhisperTool("check_whisper_availability", {})

      expect(result).toEqual({
        openai: false,
        local: false,
        models: [],
      })

      consoleSpy.mockRestore()
    })
  })

  describe("get_whisper_models", () => {
    it("should get models with default options", async () => {
      mockWhisperService.getAvailableLocalModels.mockResolvedValue([
        { name: "whisper-tiny", size: "39 MB" },
        { name: "whisper-base", size: "74 MB" },
      ])

      const result = await executeWhisperTool("get_whisper_models", {})

      expect(result).toEqual({
        api: ["whisper-1"],
        local: [
          { name: "whisper-tiny", size: "39 MB" },
          { name: "whisper-base", size: "74 MB" },
        ],
      })
    })

    it("should respect includeLocal and includeApi flags", async () => {
      mockWhisperService.getAvailableLocalModels.mockResolvedValue([{ name: "whisper-tiny", size: "39 MB" }])

      const result1 = await executeWhisperTool("get_whisper_models", {
        includeLocal: false,
        includeApi: true,
      })

      expect(result1).toEqual({
        api: ["whisper-1"],
        local: [],
      })

      const result2 = await executeWhisperTool("get_whisper_models", {
        includeLocal: true,
        includeApi: false,
      })

      expect(result2).toEqual({
        api: [],
        local: [{ name: "whisper-tiny", size: "39 MB" }],
      })
    })
  })

  describe("download_whisper_model", () => {
    it("should download model successfully", async () => {
      mockWhisperService.downloadLocalModel.mockImplementation((_modelName, onProgress) => {
        if (onProgress) {
          onProgress(50)
          onProgress(100)
        }
        return Promise.resolve(true)
      })

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

      const result = await executeWhisperTool("download_whisper_model", {
        modelName: "whisper-base",
      })

      expect(result).toEqual({
        success: true,
        message: "Модель whisper-base успешно скачана",
      })

      expect(consoleSpy).toHaveBeenCalledWith("Скачивание whisper-base: 50.0%")
      expect(consoleSpy).toHaveBeenCalledWith("Скачивание whisper-base: 100.0%")

      consoleSpy.mockRestore()
    })

    it("should handle download failure", async () => {
      mockWhisperService.downloadLocalModel.mockResolvedValue(false)

      const result = await executeWhisperTool("download_whisper_model", {
        modelName: "whisper-large",
      })

      expect(result).toEqual({
        success: false,
        message: "Не удалось скачать модель whisper-large",
      })
    })

    it("should handle download errors", async () => {
      mockWhisperService.downloadLocalModel.mockRejectedValue(new Error("Network error"))
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      const result = await executeWhisperTool("download_whisper_model", {
        modelName: "whisper-medium",
      })

      expect(result).toEqual({
        success: false,
        message: "Ошибка скачивания: Error: Network error",
      })

      consoleSpy.mockRestore()
    })
  })

  describe("transcribe_media", () => {
    beforeEach(() => {
      mockWhisperService.extractAudioForTranscription.mockResolvedValue("/tmp/audio.wav")
    })

    it("should transcribe with local model", async () => {
      const mockResult = {
        text: "Hello world",
        segments: [],
        language: "en",
        duration: 5.0,
      }
      mockWhisperService.transcribeWithLocalModel.mockResolvedValue(mockResult)

      const result = await executeWhisperTool("transcribe_media", {
        clipId: "test-clip",
        language: "en",
        model: "whisper-base",
        useLocal: true,
      })

      expect(mockWhisperService.extractAudioForTranscription).toHaveBeenCalledWith("/path/to/video/test-clip.mp4")
      expect(mockWhisperService.transcribeWithLocalModel).toHaveBeenCalledWith("/tmp/audio.wav", "whisper-base", {
        language: "en",
      })
      expect(result).toEqual(mockResult)
    })

    it("should transcribe with OpenAI API", async () => {
      const mockResult = {
        text: "Hello world",
        segments: [],
        language: "en",
        duration: 5.0,
      }
      mockWhisperService.transcribeWithOpenAI.mockResolvedValue(mockResult)

      const result = await executeWhisperTool("transcribe_media", {
        clipId: "test-clip",
        language: "auto",
        model: "whisper-1",
        useLocal: false,
        includeWordTimestamps: true,
        prompt: "This is about science",
      })

      expect(mockWhisperService.transcribeWithOpenAI).toHaveBeenCalledWith("/tmp/audio.wav", {
        model: "whisper-1",
        language: undefined,
        prompt: "This is about science",
        response_format: "verbose_json",
        timestamp_granularities: ["word", "segment"],
      })
      expect(result).toEqual(mockResult)
    })

    it("should handle transcription errors", async () => {
      mockWhisperService.extractAudioForTranscription.mockRejectedValue(new Error("Audio extraction failed"))
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      await expect(
        executeWhisperTool("transcribe_media", {
          clipId: "test-clip",
        }),
      ).rejects.toThrow("Audio extraction failed")

      consoleSpy.mockRestore()
    })
  })

  describe("translate_audio_to_english", () => {
    it("should translate audio successfully", async () => {
      mockWhisperService.extractAudioForTranscription.mockResolvedValue("/tmp/audio.wav")
      const mockResult = {
        text: "Translated text",
        segments: [],
      }
      mockWhisperService.translateWithOpenAI.mockResolvedValue(mockResult)

      const result = await executeWhisperTool("translate_audio_to_english", {
        clipId: "test-clip",
        model: "whisper-large-v2",
        prompt: "Technical content",
      })

      expect(mockWhisperService.translateWithOpenAI).toHaveBeenCalledWith("/tmp/audio.wav", {
        model: "whisper-large-v2",
        prompt: "Technical content",
        response_format: "verbose_json",
      })
      expect(result).toEqual(mockResult)
    })

    it("should handle translation errors", async () => {
      mockWhisperService.extractAudioForTranscription.mockRejectedValue(new Error("Translation failed"))
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      await expect(
        executeWhisperTool("translate_audio_to_english", {
          clipId: "test-clip",
        }),
      ).rejects.toThrow("Translation failed")

      consoleSpy.mockRestore()
    })
  })

  describe("batch_transcribe_clips", () => {
    it("should transcribe multiple clips successfully", async () => {
      mockWhisperService.extractAudioForTranscription.mockResolvedValue("/tmp/audio.wav")
      mockWhisperService.transcribeWithOpenAI.mockResolvedValue({
        text: "Test transcription",
        segments: [],
        language: "en",
        duration: 3.0,
      })

      const result = await executeWhisperTool("batch_transcribe_clips", {
        clipIds: ["clip1", "clip2"],
        language: "en",
        model: "whisper-1",
        useLocal: false,
      })

      expect(result.totalProcessed).toBe(2)
      expect(result.results).toHaveLength(2)
      expect(result.errors).toHaveLength(0)
      expect(result.results[0]).toMatchObject({
        clipId: "clip1",
        success: true,
        text: "Test transcription",
      })
    })

    it("should handle partial failures in batch processing", async () => {
      mockWhisperService.extractAudioForTranscription
        .mockResolvedValueOnce("/tmp/audio1.wav")
        .mockRejectedValueOnce(new Error("Audio extraction failed"))

      mockWhisperService.transcribeWithOpenAI.mockResolvedValue({
        text: "Success",
        segments: [],
        language: "en",
        duration: 3.0,
      })

      const result = await executeWhisperTool("batch_transcribe_clips", {
        clipIds: ["clip1", "clip2"],
        language: "en",
        model: "whisper-1",
        useLocal: false,
      })

      expect(result.totalProcessed).toBe(2)
      expect(result.results).toHaveLength(2)
      expect(result.errors).toHaveLength(1)
      expect(result.results[0].success).toBe(true)
      expect(result.results[1].success).toBe(false)
      expect(result.errors[0]).toContain("clip2")
    })
  })

  describe("create_subtitles_from_transcription", () => {
    it("should create SRT subtitles with default options", async () => {
      const result = await executeWhisperTool("create_subtitles_from_transcription", {
        transcriptionText: "Hello world this is a test transcription with multiple words",
      })

      expect(result.format).toBe("srt")
      expect(result.subtitle).toContain("1\n")
      expect(result.subtitle).toContain("00:00:00,000 --> 00:00:03,000")
      expect(result.subtitle).toContain("Hello world this is a test transcription")
      expect(result.lineCount).toBeGreaterThan(0)
    })

    it("should create VTT subtitles", async () => {
      const result = await executeWhisperTool("create_subtitles_from_transcription", {
        transcriptionText: "Short text",
        format: "vtt",
      })

      expect(result.format).toBe("vtt")
      expect(result.subtitle.startsWith("WEBVTT\n\n")).toBe(true)
      expect(result.subtitle).toContain("00:00:00.000 --> 00:00:03.000")
    })

    it("should respect character limits", async () => {
      const result = await executeWhisperTool("create_subtitles_from_transcription", {
        transcriptionText: "This is a very long text that should be split into multiple lines",
        maxCharactersPerLine: 20,
      })

      expect(result.lineCount).toBeGreaterThan(1)
    })
  })

  describe("detect_audio_language", () => {
    it("should detect language successfully", async () => {
      mockWhisperService.extractAudioForTranscription.mockResolvedValue("/tmp/audio.wav")
      mockWhisperService.transcribeWithOpenAI.mockResolvedValue({
        text: "Hello world",
        language: "en",
      })
      mockWhisperService.getSupportedLanguages.mockReturnValue([
        { code: "en", name: "English" },
        { code: "ru", name: "Russian" },
      ])

      const result = await executeWhisperTool("detect_audio_language", {
        clipId: "test-clip",
        sampleDuration: 30,
      })

      expect(result).toEqual({
        language: "en",
        confidence: 0.9,
        supportedLanguages: ["en", "ru"],
      })
    })

    it("should handle detection errors", async () => {
      mockWhisperService.extractAudioForTranscription.mockRejectedValue(new Error("Detection failed"))
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      await expect(
        executeWhisperTool("detect_audio_language", {
          clipId: "test-clip",
        }),
      ).rejects.toThrow("Detection failed")

      consoleSpy.mockRestore()
    })
  })

  describe("improve_transcription_quality", () => {
    it("should improve transcription with all options enabled", async () => {
      const result = await executeWhisperTool("improve_transcription_quality", {
        transcriptionText: "эм hello world ну this is a test",
        context: "Technical presentation",
        fixPunctuation: true,
        fixCapitalization: true,
        removeFillers: true,
      })

      expect(result.improvedText).not.toContain("эм")
      expect(result.improvedText).not.toContain("ну")
      expect(result.changes).toContain("Удалены слова-паразиты")
      expect(result.changes).toContain("Исправлена пунктуация")
      expect(result.changes).toContain("Исправлены заглавные буквы")
      expect(result.confidence).toBe(0.85)
    })

    it("should handle individual improvement options", async () => {
      const result1 = await executeWhisperTool("improve_transcription_quality", {
        transcriptionText: "hello world this is test",
        fixPunctuation: true,
        fixCapitalization: false,
        removeFillers: false,
      })

      expect(result1.changes).toContain("Исправлена пунктуация")
      expect(result1.changes).not.toContain("Удалены слова-паразиты")

      const result2 = await executeWhisperTool("improve_transcription_quality", {
        transcriptionText: "эм hello ну world",
        fixPunctuation: false,
        fixCapitalization: false,
        removeFillers: true,
      })

      expect(result2.changes).toContain("Удалены слова-паразиты")
      expect(result2.changes).not.toContain("Исправлена пунктуация")
    })

    it("should clean up whitespace", async () => {
      const result = await executeWhisperTool("improve_transcription_quality", {
        transcriptionText: "  hello    world  ",
        fixPunctuation: false,
        fixCapitalization: false,
        removeFillers: false,
      })

      expect(result.improvedText).toBe("hello world")
    })
  })

  describe("sync_subtitles_with_whisper", () => {
    it("should return sync result structure", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

      const result = await executeWhisperTool("sync_subtitles_with_whisper", {
        clipId: "test-clip",
        subtitleText: "Hello world\nThis is a test",
        language: "en",
        tolerance: 0.5,
      })

      expect(result).toEqual({
        syncedSubtitles: [],
        adjustments: 0,
        accuracy: 0.9,
      })

      expect(consoleSpy).toHaveBeenCalledWith("Синхронизация субтитров для клипа test-clip")

      consoleSpy.mockRestore()
    })
  })

  describe("unknown tool", () => {
    it("should throw error for unknown tool", async () => {
      await expect(executeWhisperTool("unknown_tool", {})).rejects.toThrow(
        "Неизвестный Whisper инструмент: unknown_tool",
      )
    })
  })
})

describe("Helper functions", () => {
  describe("formatTime", () => {
    it("should format time correctly for SRT format", async () => {
      // Test through create_subtitles_from_transcription which uses formatTime
      const result = await executeWhisperTool("create_subtitles_from_transcription", {
        transcriptionText: "Test",
        format: "srt",
      })

      expect(result.subtitle).toContain("00:00:00,000 --> 00:00:03,000")
    })
  })

  describe("formatTimeVTT", () => {
    it("should format time correctly for VTT format", async () => {
      // Test through create_subtitles_from_transcription which uses formatTimeVTT
      const result = await executeWhisperTool("create_subtitles_from_transcription", {
        transcriptionText: "Test",
        format: "vtt",
      })

      expect(result.subtitle).toContain("00:00:00.000 --> 00:00:03.000")
    })
  })
})

describe("Edge cases and error handling", () => {
  let mockWhisperService: any

  beforeEach(() => {
    mockWhisperService = {
      loadApiKey: vi.fn(),
      isLocalWhisperAvailable: vi.fn(),
      getAvailableLocalModels: vi.fn(),
      downloadLocalModel: vi.fn(),
      extractAudioForTranscription: vi.fn(),
      transcribeWithLocalModel: vi.fn(),
      transcribeWithOpenAI: vi.fn(),
      translateWithOpenAI: vi.fn(),
      getSupportedLanguages: vi.fn(),
    }

    vi.mocked(WhisperService.getInstance).mockReturnValue(mockWhisperService)
  })

  it("should handle empty transcription text", async () => {
    const result = await executeWhisperTool("create_subtitles_from_transcription", {
      transcriptionText: "",
    })

    expect(result.subtitle).toBe("")
    expect(result.lineCount).toBe(0)
  })

  it("should handle empty clip IDs array", async () => {
    const result = await executeWhisperTool("batch_transcribe_clips", {
      clipIds: [],
      language: "en",
    })

    expect(result.totalProcessed).toBe(0)
    expect(result.results).toEqual([])
    expect(result.errors).toEqual([])
  })

  it("should handle transcription with auto language detection", async () => {
    mockWhisperService.extractAudioForTranscription.mockResolvedValue("/tmp/audio.wav")
    mockWhisperService.transcribeWithOpenAI.mockResolvedValue({
      text: "Test",
      language: "detected-lang",
    })

    const result = await executeWhisperTool("transcribe_media", {
      clipId: "test-clip",
      language: "auto",
      useLocal: false,
    })

    expect(mockWhisperService.transcribeWithOpenAI).toHaveBeenCalledWith("/tmp/audio.wav", {
      model: "whisper-1",
      language: undefined, // auto should be converted to undefined
      prompt: undefined,
      response_format: "verbose_json",
      timestamp_granularities: ["segment"],
    })
  })

  it("should handle very long transcription text", async () => {
    const longText = "word ".repeat(1000)

    const result = await executeWhisperTool("improve_transcription_quality", {
      transcriptionText: longText,
      removeFillers: false,
      fixPunctuation: false,
      fixCapitalization: false,
    })

    expect(result.improvedText).toBe(longText.trim())
    expect(result.changes).toEqual([])
  })

  it("should handle subtitle text with special characters", async () => {
    const result = await executeWhisperTool("create_subtitles_from_transcription", {
      transcriptionText: "Тест с русскими символами и números",
    })

    expect(result.subtitle).toContain("Тест с русскими символами и números")
  })
})
