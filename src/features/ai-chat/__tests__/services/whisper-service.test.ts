import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  WhisperService,
  WhisperTranscriptionOptions,
  WhisperTranscriptionResult,
  WhisperTranslationOptions,
  WhisperTranslationResult,
  WhisperSegment,
  LocalWhisperModel,
  AVAILABLE_LOCAL_MODELS,
} from "../../services/whisper-service"

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

const { invoke } = vi.mocked(await import("@tauri-apps/api/core"))

describe("WhisperService", () => {
  let service: WhisperService
  const mockApiKey = "sk-test-openai-key"

  const mockTranscriptionResult: WhisperTranscriptionResult = {
    text: "Hello, this is a test transcription.",
    language: "en",
    duration: 5.5,
    segments: [
      {
        id: 0,
        seek: 0,
        start: 0,
        end: 2.5,
        text: "Hello, this is",
        tokens: [1, 2, 3],
        temperature: 0,
        avg_logprob: -0.5,
        compression_ratio: 1.2,
        no_speech_prob: 0.01,
      },
      {
        id: 1,
        seek: 250,
        start: 2.5,
        end: 5.5,
        text: " a test transcription.",
        tokens: [4, 5, 6],
        temperature: 0,
        avg_logprob: -0.4,
        compression_ratio: 1.1,
        no_speech_prob: 0.02,
      },
    ],
    words: [
      { word: "Hello,", start: 0, end: 0.5 },
      { word: "this", start: 0.6, end: 0.9 },
      { word: "is", start: 1.0, end: 1.2 },
      { word: "a", start: 2.5, end: 2.7 },
      { word: "test", start: 2.8, end: 3.2 },
      { word: "transcription.", start: 3.3, end: 5.5 },
    ],
  }

  const mockTranslationResult: WhisperTranslationResult = {
    text: "This is a translated text.",
    segments: [
      {
        id: 0,
        seek: 0,
        start: 0,
        end: 3,
        text: "This is a translated text.",
        tokens: [7, 8, 9],
        temperature: 0,
        avg_logprob: -0.3,
        compression_ratio: 1.0,
        no_speech_prob: 0.01,
      },
    ],
  }

  const mockLocalModels: LocalWhisperModel[] = [
    {
      name: "whisper-tiny",
      size: "39 MB",
      languages: ["multilingual"],
      path: "/models/whisper-tiny.bin",
      isDownloaded: true,
    },
    {
      name: "whisper-base",
      size: "74 MB",
      languages: ["multilingual"],
      path: "/models/whisper-base.bin",
      isDownloaded: true,
    },
    {
      name: "whisper-small",
      size: "244 MB",
      languages: ["multilingual"],
      isDownloaded: false,
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    // Reset singleton instance
    // @ts-expect-error - accessing private property for testing
    WhisperService.instance = undefined

    service = WhisperService.getInstance()
  })

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = WhisperService.getInstance()
      const instance2 = WhisperService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe("API key management", () => {
    it("should set and check API key", () => {
      expect(service.hasApiKey()).toBe(false)

      service.setApiKey(mockApiKey)

      expect(service.hasApiKey()).toBe(true)
    })

    it("should return false for empty API key", () => {
      service.setApiKey("")
      expect(service.hasApiKey()).toBe(false)
    })

    it("should load API key from secure storage", async () => {
      invoke.mockResolvedValue(mockApiKey)

      const result = await service.loadApiKey()

      expect(invoke).toHaveBeenCalledWith("get_decrypted_api_key", {
        keyType: "openai",
      })
      expect(result).toBe(true)
      expect(service.hasApiKey()).toBe(true)
    })

    it("should handle API key loading failure", async () => {
      invoke.mockRejectedValue(new Error("Key not found"))
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      const result = await service.loadApiKey()

      expect(result).toBe(false)
      expect(service.hasApiKey()).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith("Не удалось загрузить API ключ OpenAI:", expect.any(Error))

      consoleSpy.mockRestore()
    })

    it("should handle null API key from storage", async () => {
      invoke.mockResolvedValue(null)

      const result = await service.loadApiKey()

      expect(result).toBe(false)
      expect(service.hasApiKey()).toBe(false)
    })
  })

  describe("transcribeWithOpenAI", () => {
    beforeEach(() => {
      service.setApiKey(mockApiKey)
    })

    it("should transcribe audio with default options", async () => {
      invoke.mockResolvedValue(mockTranscriptionResult)

      const result = await service.transcribeWithOpenAI("/path/to/audio.mp3")

      expect(invoke).toHaveBeenCalledWith("whisper_transcribe_openai", {
        audioFilePath: "/path/to/audio.mp3",
        apiKey: mockApiKey,
        model: "whisper-1",
        language: undefined,
        prompt: undefined,
        responseFormat: "verbose_json",
        temperature: 0,
        timestampGranularities: ["segment"],
      })

      expect(result).toEqual(mockTranscriptionResult)
    })

    it("should transcribe audio with custom options", async () => {
      invoke.mockResolvedValue(mockTranscriptionResult)

      const options: WhisperTranscriptionOptions = {
        model: "whisper-large-v3",
        language: "ru",
        prompt: "This is about science",
        response_format: "srt",
        temperature: 0.5,
        timestamp_granularities: ["word", "segment"],
      }

      const result = await service.transcribeWithOpenAI("/path/to/audio.wav", options)

      expect(invoke).toHaveBeenCalledWith("whisper_transcribe_openai", {
        audioFilePath: "/path/to/audio.wav",
        apiKey: mockApiKey,
        model: "whisper-large-v3",
        language: "ru",
        prompt: "This is about science",
        responseFormat: "srt",
        temperature: 0.5,
        timestampGranularities: ["word", "segment"],
      })

      expect(result).toEqual(mockTranscriptionResult)
    })

    it("should throw error when API key is not set", async () => {
      service.setApiKey("")

      await expect(service.transcribeWithOpenAI("/path/to/audio.mp3")).rejects.toThrow(
        "API ключ OpenAI не установлен"
      )
    })

    it("should handle transcription errors", async () => {
      invoke.mockRejectedValue(new Error("Transcription failed"))
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      await expect(service.transcribeWithOpenAI("/path/to/audio.mp3")).rejects.toThrow(
        "Не удалось выполнить транскрипцию: Error: Transcription failed"
      )

      expect(consoleSpy).toHaveBeenCalledWith("Ошибка транскрипции через OpenAI:", expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe("translateWithOpenAI", () => {
    beforeEach(() => {
      service.setApiKey(mockApiKey)
    })

    it("should translate audio with default options", async () => {
      invoke.mockResolvedValue(mockTranslationResult)

      const result = await service.translateWithOpenAI("/path/to/audio.mp3")

      expect(invoke).toHaveBeenCalledWith("whisper_translate_openai", {
        audioFilePath: "/path/to/audio.mp3",
        apiKey: mockApiKey,
        model: "whisper-1",
        prompt: undefined,
        responseFormat: "verbose_json",
        temperature: 0,
      })

      expect(result).toEqual(mockTranslationResult)
    })

    it("should translate audio with custom options", async () => {
      invoke.mockResolvedValue(mockTranslationResult)

      const options: WhisperTranslationOptions = {
        model: "whisper-large-v2",
        prompt: "Technical documentation",
        response_format: "text",
        temperature: 0.3,
      }

      const result = await service.translateWithOpenAI("/path/to/audio.wav", options)

      expect(invoke).toHaveBeenCalledWith("whisper_translate_openai", {
        audioFilePath: "/path/to/audio.wav",
        apiKey: mockApiKey,
        model: "whisper-large-v2",
        prompt: "Technical documentation",
        responseFormat: "text",
        temperature: 0.3,
      })

      expect(result).toEqual(mockTranslationResult)
    })

    it("should throw error when API key is not set", async () => {
      service.setApiKey("")

      await expect(service.translateWithOpenAI("/path/to/audio.mp3")).rejects.toThrow(
        "API ключ OpenAI не установлен"
      )
    })

    it("should handle translation errors", async () => {
      invoke.mockRejectedValue(new Error("Translation failed"))
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      await expect(service.translateWithOpenAI("/path/to/audio.mp3")).rejects.toThrow(
        "Не удалось выполнить перевод: Error: Translation failed"
      )

      expect(consoleSpy).toHaveBeenCalledWith("Ошибка перевода через OpenAI:", expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe("transcribeWithLocalModel", () => {
    it("should transcribe with local model and default options", async () => {
      invoke.mockResolvedValue(mockTranscriptionResult)

      const result = await service.transcribeWithLocalModel("/path/to/audio.wav", "whisper-base")

      expect(invoke).toHaveBeenCalledWith("whisper_transcribe_local", {
        audioFilePath: "/path/to/audio.wav",
        modelName: "whisper-base",
        language: "auto",
        threads: 4,
        outputFormat: "json",
      })

      expect(result).toEqual(mockTranscriptionResult)
    })

    it("should transcribe with custom options", async () => {
      invoke.mockResolvedValue(mockTranscriptionResult)

      const options = {
        language: "es",
        threads: 8,
        outputFormat: "srt" as const,
      }

      const result = await service.transcribeWithLocalModel("/path/to/audio.wav", "whisper-small", options)

      expect(invoke).toHaveBeenCalledWith("whisper_transcribe_local", {
        audioFilePath: "/path/to/audio.wav",
        modelName: "whisper-small",
        language: "es",
        threads: 8,
        outputFormat: "srt",
      })

      expect(result).toEqual(mockTranscriptionResult)
    })

    it("should handle local transcription errors", async () => {
      invoke.mockRejectedValue(new Error("Model not found"))
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      await expect(
        service.transcribeWithLocalModel("/path/to/audio.wav", "whisper-unknown")
      ).rejects.toThrow("Не удалось выполнить локальную транскрипцию: Error: Model not found")

      expect(consoleSpy).toHaveBeenCalledWith("Ошибка локальной транскрипции:", expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe("getAvailableLocalModels", () => {
    it("should return list of local models", async () => {
      invoke.mockResolvedValue(mockLocalModels)

      const models = await service.getAvailableLocalModels()

      expect(invoke).toHaveBeenCalledWith("whisper_get_local_models")
      expect(models).toEqual(mockLocalModels)
    })

    it("should return default models on error", async () => {
      invoke.mockRejectedValue(new Error("Failed to get models"))
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      const models = await service.getAvailableLocalModels()

      expect(models).toEqual(AVAILABLE_LOCAL_MODELS)
      expect(consoleSpy).toHaveBeenCalledWith("Ошибка получения локальных моделей:", expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe("downloadLocalModel", () => {
    it("should download model successfully", async () => {
      invoke.mockResolvedValue(true)

      const result = await service.downloadLocalModel("whisper-medium")

      expect(invoke).toHaveBeenCalledWith("whisper_download_model", {
        modelName: "whisper-medium",
      })
      expect(result).toBe(true)
    })

    it("should handle download failure", async () => {
      invoke.mockResolvedValue(false)

      const result = await service.downloadLocalModel("whisper-large-v3")

      expect(result).toBe(false)
    })

    it("should handle download errors", async () => {
      invoke.mockRejectedValue(new Error("Network error"))
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      await expect(service.downloadLocalModel("whisper-large-v3")).rejects.toThrow(
        "Не удалось скачать модель whisper-large-v3: Error: Network error"
      )

      expect(consoleSpy).toHaveBeenCalledWith("Ошибка скачивания модели:", expect.any(Error))

      consoleSpy.mockRestore()
    })

    it("should accept progress callback (TODO)", async () => {
      invoke.mockResolvedValue(true)

      const onProgress = vi.fn()
      const result = await service.downloadLocalModel("whisper-small", onProgress)

      expect(result).toBe(true)
      // TODO: Progress tracking implementation
    })
  })

  describe("isLocalWhisperAvailable", () => {
    it("should return true when local whisper is available", async () => {
      invoke.mockResolvedValue(true)

      const result = await service.isLocalWhisperAvailable()

      expect(invoke).toHaveBeenCalledWith("whisper_check_local_availability")
      expect(result).toBe(true)
    })

    it("should return false when local whisper is not available", async () => {
      invoke.mockResolvedValue(false)

      const result = await service.isLocalWhisperAvailable()

      expect(result).toBe(false)
    })

    it("should handle errors and return false", async () => {
      invoke.mockRejectedValue(new Error("Check failed"))
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {})

      const result = await service.isLocalWhisperAvailable()

      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith("Локальный Whisper недоступен:", expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe("getSupportedLanguages", () => {
    it("should return all supported languages", () => {
      const languages = service.getSupportedLanguages()

      expect(languages).toHaveLength(20)
      expect(languages[0]).toEqual({
        code: "auto",
        name: "Auto-detect",
        nativeName: "Автоопределение",
      })
      expect(languages.find(l => l.code === "ru")).toEqual({
        code: "ru",
        name: "Russian",
        nativeName: "Русский",
      })
      expect(languages.find(l => l.code === "zh")).toEqual({
        code: "zh",
        name: "Chinese",
        nativeName: "中文",
      })
    })
  })

  describe("extractAudioForTranscription", () => {
    it("should extract audio with default format", async () => {
      invoke.mockResolvedValue("/tmp/extracted_audio.wav")

      const result = await service.extractAudioForTranscription("/path/to/video.mp4")

      expect(invoke).toHaveBeenCalledWith("extract_audio_for_whisper", {
        videoFilePath: "/path/to/video.mp4",
        outputFormat: "wav",
      })
      expect(result).toBe("/tmp/extracted_audio.wav")
    })

    it("should extract audio with custom format", async () => {
      invoke.mockResolvedValue("/tmp/extracted_audio.mp3")

      const result = await service.extractAudioForTranscription("/path/to/video.mp4", "mp3")

      expect(invoke).toHaveBeenCalledWith("extract_audio_for_whisper", {
        videoFilePath: "/path/to/video.mp4",
        outputFormat: "mp3",
      })
      expect(result).toBe("/tmp/extracted_audio.mp3")
    })

    it("should handle extraction errors", async () => {
      invoke.mockRejectedValue(new Error("FFmpeg error"))
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      await expect(service.extractAudioForTranscription("/path/to/video.mp4")).rejects.toThrow(
        "Не удалось извлечь аудио: Error: FFmpeg error"
      )

      expect(consoleSpy).toHaveBeenCalledWith("Ошибка извлечения аудио:", expect.any(Error))

      consoleSpy.mockRestore()
    })
  })

  describe("recommendModel", () => {
    it("should recommend local models based on duration", () => {
      expect(service.recommendModel(30, true)).toBe("whisper-tiny")
      expect(service.recommendModel(120, true)).toBe("whisper-base")
      expect(service.recommendModel(600, true)).toBe("whisper-small")
      expect(service.recommendModel(1200, true)).toBe("whisper-medium")
      expect(service.recommendModel(3600, true)).toBe("whisper-large-v3")
    })

    it("should recommend OpenAI model when not using local", () => {
      expect(service.recommendModel(30, false)).toBe("whisper-1")
      expect(service.recommendModel(3600, false)).toBe("whisper-1")
    })

    it("should handle edge cases", () => {
      expect(service.recommendModel(59, true)).toBe("whisper-tiny")
      expect(service.recommendModel(60, true)).toBe("whisper-base")
      expect(service.recommendModel(299, true)).toBe("whisper-base")
      expect(service.recommendModel(300, true)).toBe("whisper-small")
    })
  })

  describe("convertToSRT", () => {
    it("should convert segments to SRT format", () => {
      const segments: WhisperSegment[] = [
        {
          id: 0,
          seek: 0,
          start: 0,
          end: 2.5,
          text: "Hello world",
          tokens: [],
          temperature: 0,
          avg_logprob: 0,
          compression_ratio: 1,
          no_speech_prob: 0,
        },
        {
          id: 1,
          seek: 250,
          start: 2.5,
          end: 5.0,
          text: "This is a test",
          tokens: [],
          temperature: 0,
          avg_logprob: 0,
          compression_ratio: 1,
          no_speech_prob: 0,
        },
      ]

      const srt = service.convertToSRT(segments)

      expect(srt).toBe(
        "1\n00:00:00,000 --> 00:00:02,500\nHello world\n\n" +
        "2\n00:00:02,500 --> 00:00:05,000\nThis is a test\n\n"
      )
    })

    it("should handle segments with fractional seconds", () => {
      const segments: WhisperSegment[] = [
        {
          id: 0,
          seek: 0,
          start: 61.234,
          end: 65.789,
          text: "Test segment",
          tokens: [],
          temperature: 0,
          avg_logprob: 0,
          compression_ratio: 1,
          no_speech_prob: 0,
        },
      ]

      const srt = service.convertToSRT(segments)

      expect(srt).toBe("1\n00:01:01,234 --> 00:01:05,789\nTest segment\n\n")
    })

    it("should trim whitespace from text", () => {
      const segments: WhisperSegment[] = [
        {
          id: 0,
          seek: 0,
          start: 0,
          end: 1,
          text: "  Trimmed text  ",
          tokens: [],
          temperature: 0,
          avg_logprob: 0,
          compression_ratio: 1,
          no_speech_prob: 0,
        },
      ]

      const srt = service.convertToSRT(segments)

      expect(srt).toContain("Trimmed text")
    })
  })

  describe("convertToVTT", () => {
    it("should convert segments to VTT format", () => {
      const segments: WhisperSegment[] = [
        {
          id: 0,
          seek: 0,
          start: 0,
          end: 2.5,
          text: "Hello world",
          tokens: [],
          temperature: 0,
          avg_logprob: 0,
          compression_ratio: 1,
          no_speech_prob: 0,
        },
        {
          id: 1,
          seek: 250,
          start: 2.5,
          end: 5.0,
          text: "This is a test",
          tokens: [],
          temperature: 0,
          avg_logprob: 0,
          compression_ratio: 1,
          no_speech_prob: 0,
        },
      ]

      const vtt = service.convertToVTT(segments)

      expect(vtt).toBe(
        "WEBVTT\n\n" +
        "00:00:00.000 --> 00:00:02.500\nHello world\n\n" +
        "00:00:02.500 --> 00:00:05.000\nThis is a test\n\n"
      )
    })

    it("should handle hours correctly", () => {
      const segments: WhisperSegment[] = [
        {
          id: 0,
          seek: 0,
          start: 3661.5,
          end: 3665.75,
          text: "One hour later",
          tokens: [],
          temperature: 0,
          avg_logprob: 0,
          compression_ratio: 1,
          no_speech_prob: 0,
        },
      ]

      const vtt = service.convertToVTT(segments)

      expect(vtt).toBe("WEBVTT\n\n01:01:01.500 --> 01:01:05.750\nOne hour later\n\n")
    })

    it("should handle empty segments array", () => {
      const vtt = service.convertToVTT([])
      expect(vtt).toBe("WEBVTT\n\n")
    })
  })

  describe("time formatting helpers", () => {
    it("should format time correctly for edge cases", () => {
      // Test segments with various time values
      const testSegments: WhisperSegment[] = [
        {
          id: 0,
          seek: 0,
          start: 0,
          end: 0.001,
          text: "Very short",
          tokens: [],
          temperature: 0,
          avg_logprob: 0,
          compression_ratio: 1,
          no_speech_prob: 0,
        },
        {
          id: 1,
          seek: 0,
          start: 3599.999,
          end: 3600,
          text: "Almost an hour",
          tokens: [],
          temperature: 0,
          avg_logprob: 0,
          compression_ratio: 1,
          no_speech_prob: 0,
        },
        {
          id: 2,
          seek: 0,
          start: 86399.999,
          end: 86400,
          text: "Almost a day",
          tokens: [],
          temperature: 0,
          avg_logprob: 0,
          compression_ratio: 1,
          no_speech_prob: 0,
        },
      ]

      const srt = service.convertToSRT(testSegments)
      
      expect(srt).toContain("00:00:00,000 --> 00:00:00,001")
      expect(srt).toContain("00:59:59,998 --> 01:00:00,000") // Округление миллисекунд
      expect(srt).toContain("23:59:59,998 --> 24:00:00,000")

      const vtt = service.convertToVTT(testSegments)
      
      expect(vtt).toContain("00:00:00.000 --> 00:00:00.001")
      expect(vtt).toContain("00:59:59.998 --> 01:00:00.000") // Округление миллисекунд
      expect(vtt).toContain("23:59:59.998 --> 24:00:00.000")
    })
  })
})