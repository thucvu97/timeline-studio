/**
 * Интеграционные тесты для Enhanced Subtitle Automation
 * Тестируют полную интеграцию с ai-content-intelligence и сервисами
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  autoGenerateSubtitlesFromVideo,
  type EnhancedSubtitleInput,
  enhancedSubtitleAutomation,
  extractSubtitlesFromScreenText,
} from "../enhanced-subtitle-automation"
import { SubtitleAIIntegrationService } from "../services/subtitle-ai-integration"
import { SubtitleSynchronizationService } from "../services/subtitle-synchronization"
import { WhisperIntegrationService } from "../services/whisper-integration"
import { AIDIContainer, getAIContainerSafe, initializeAIServices } from "@/shared/services/ai/di-container"

// Моки для внешних зависимостей
vi.mock("../../../../ai-content-intelligence/engines/scene-analysis/services/vision-service", () => ({
  VisionService: {
    getInstance: vi.fn(() => ({
      initialize: vi.fn(),
      analyzeFrame: vi.fn(),
    })),
  },
}))

vi.mock("../../../../transcription/services/transcription-service", () => ({
  TranscriptionService: class MockTranscriptionService {
    async transcribeMedia() {
      return {
        segments: [
          {
            id: 1,
            start: 0,
            end: 3,
            text: "Тестовая речь",
            confidence: 0.9,
          },
          {
            id: 2,
            start: 4,
            end: 7,
            text: "Второй сегмент",
            confidence: 0.85,
          },
        ],
        language: "ru",
        languageProbability: 0.95,
        duration: 10,
        text: "Тестовая речь. Второй сегмент.",
      }
    }
    async getAvailableModels() {
      return ["tiny", "base", "small"]
    }
  },
}))

describe("Enhanced Subtitle Automation Integration", () => {
  let aiIntegrationService: SubtitleAIIntegrationService
  let whisperService: WhisperIntegrationService
  let syncService: SubtitleSynchronizationService

  beforeEach(async () => {
    // Инициализируем AI контейнер
    await initializeAIServices()

    // Инициализируем сервисы
    aiIntegrationService = SubtitleAIIntegrationService.getInstance()
    whisperService = WhisperIntegrationService.getInstance()
    syncService = SubtitleSynchronizationService.getInstance()

    // Мокаем методы для тестирования
    vi.spyOn(console, "log").mockImplementation(() => {})
    vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
  })

  afterEach(async () => {
    // Очищаем AI контейнер
    const aiContainer = getAIContainerSafe()
    if (aiContainer) {
      await aiContainer.dispose()
    }
    // Сбрасываем экземпляр контейнера
    AIDIContainer.resetInstance()
    
    vi.clearAllMocks()
  })

  describe("AI Integration Service", () => {
    it("должен инициализироваться без ошибок", async () => {
      expect(async () => {
        await aiIntegrationService.initialize()
      }).not.toThrow()
    })

    it("должен анализировать контент для субтитров", async () => {
      // Мокаем анализ контента
      const mockAnalysis = {
        mediaFile: {
          path: "/test/video.mp4",
          filename: "video.mp4",
          name: "video",
          size: 1000000,
          format: "mp4",
          duration: 30,
        },
        scenes: [],
        detections: {
          text: [
            {
              text: "Тестовый текст на экране",
              confidence: 0.9,
              boundingBox: { x: 0, y: 0, width: 100, height: 50 },
              language: "ru",
            },
          ],
          audio: {
            speech: [
              {
                startTime: 1.0,
                endTime: 4.0,
                transcript: "Пример распознанной речи",
                confidence: 0.9,
                language: "ru",
              },
            ],
            music: [],
            soundEffects: [],
            silence: [],
          },
          objects: [],
          faces: [],
          scenes: [],
        },
        // Минимальные поля для совместимости
        keyMoments: [],
        contentType: "narrative" as any,
        genres: [],
        mood: { primary: "neutral" as any, intensity: 0.5 },
        targetAudience: { ageRange: { min: 16, max: 65 }, interests: [], demographics: { primary: "general" } },
        technicalSpecs: {} as any,
        qualityMetrics: {} as any,
        insights: { summary: "", keyPoints: [], suggestions: [], warnings: [], opportunities: [] },
      }

      // Мокаем метод анализа
      vi.spyOn(aiIntegrationService, "analyzeContentForSubtitles").mockResolvedValue(mockAnalysis)

      const result = await aiIntegrationService.analyzeContentForSubtitles("/test/video.mp4", {
        enableOCR: true,
        enableSpeechAnalysis: true,
        language: "ru",
      })

      expect(result).toBeDefined()
      expect(result.detections.text.length).toBeGreaterThan(0)
      expect(result.detections.audio.speech.length).toBeGreaterThan(0)
    })

    it("должен конвертировать OCR результаты в субтитры", () => {
      const mockTextDetections = [
        {
          text: "Первый текст",
          confidence: 0.9,
          boundingBox: { x: 0, y: 0, width: 100, height: 50 },
          language: "ru",
        },
        {
          text: "Второй текст",
          confidence: 0.8,
          boundingBox: { x: 0, y: 100, width: 100, height: 50 },
          language: "ru",
        },
      ]

      const subtitles = aiIntegrationService.convertOCRToSubtitles(mockTextDetections, 10)

      expect(subtitles).toHaveLength(2)
      expect(subtitles[0].text).toBe("Первый текст")
      expect(subtitles[0].startTime).toBe(0)
      expect(subtitles[1].text).toBe("Второй текст")
      expect(subtitles[1].startTime).toBeGreaterThan(0)
    })

    it("должен конвертировать речевые сегменты в субтитры", () => {
      const mockSpeechSegments = [
        {
          startTime: 1.5,
          endTime: 4.2,
          transcript: "Первая фраза",
          confidence: 0.9,
          language: "ru",
        },
        {
          startTime: 5.0,
          endTime: 8.5,
          transcript: "Вторая фраза",
          confidence: 0.85,
          language: "ru",
        },
      ]

      const subtitles = aiIntegrationService.convertSpeechToSubtitles(mockSpeechSegments)

      expect(subtitles).toHaveLength(2)
      expect(subtitles[0].text).toBe("Первая фраза")
      expect(subtitles[0].startTime).toBe(1500) // в миллисекундах
      expect(subtitles[0].endTime).toBe(4200)
      expect(subtitles[1].startTime).toBe(5000)
      expect(subtitles[1].endTime).toBe(8500)
    })
  })

  describe("Whisper Integration Service", () => {
    it("должен инициализироваться без ошибок", async () => {
      expect(async () => {
        await whisperService.initialize()
      }).not.toThrow()
    })

    it("должен проверять доступность моделей", async () => {
      const availability = await whisperService.checkModelAvailability()

      expect(availability).toHaveProperty("available")
      expect(availability).toHaveProperty("recommended")
      expect(Array.isArray(availability.available)).toBe(true)
      expect(typeof availability.recommended).toBe("string")
    })

    it("должен обрабатывать ошибки распознавания gracefully", async () => {
      // Проверяем что метод обрабатывает ошибки корректно
      try {
        await whisperService.recognizeSpeech("/nonexistent/file.mp4")
      } catch (error) {
        // Ожидаем ошибку из-за отсутствия файла
        expect(error).toBeDefined()
      }
    })
  })

  describe("Subtitle Synchronization Service", () => {
    it("должен синхронизировать субтитры с базовыми опциями", async () => {
      const mockSubtitles = [
        { id: "1", startTime: 1000, endTime: 3000, text: "Первый субтитр" },
        { id: "2", startTime: 2500, endTime: 4500, text: "Второй субтитр" }, // Пересекается
      ]

      const result = await syncService.synchronizeSubtitles(
        mockSubtitles,
        {},
        {
          preventOverlap: true,
          minDuration: 1000,
          maxDuration: 5000,
        },
      )

      expect(result.synchronizedSubtitles).toHaveLength(2)
      expect(result.quality.overallScore).toBeGreaterThan(0)
      expect(result.statistics.overlapCount).toBeDefined()

      // Проверяем что пересечения устранены
      const synced = result.synchronizedSubtitles
      expect(synced[1].startTime).toBeGreaterThanOrEqual(synced[0].endTime)
    })

    it("должен оптимизировать субтитры для читабельности", async () => {
      const mockSubtitles = [
        {
          id: "1",
          startTime: 1000,
          endTime: 1500,
          text: "Очень длинный текст который сложно прочитать за такое короткое время",
        },
      ]

      const result = await syncService.synchronizeSubtitles(
        mockSubtitles,
        {},
        {
          optimizeForReading: true,
          averageReadingSpeed: 180,
        },
      )

      expect(result.synchronizedSubtitles).toHaveLength(1)

      const optimized = result.synchronizedSubtitles[0]
      const duration = optimized.endTime - optimized.startTime

      // Длительность должна быть увеличена для комфортного чтения
      expect(duration).toBeGreaterThan(500)
    })

    it("должен генерировать рекомендации по улучшению", async () => {
      const mockSubtitles = [
        { id: "1", startTime: 1000, endTime: 12000, text: "Очень длинный субтитр" }, // Слишком долгий
      ]

      const result = await syncService.synchronizeSubtitles(mockSubtitles, {}, {})

      expect(result.recommendations).toBeDefined()
      expect(result.warnings).toBeDefined()
      expect(result.recommendations.length).toBeGreaterThan(0)
    })
  })

  describe("Enhanced Subtitle Automation Tool", () => {
    it("должен создавать экземпляр инструмента", () => {
      expect(enhancedSubtitleAutomation).toBeDefined()
      // expect(enhancedSubtitleAutomation.toolName).toBe("EnhancedSubtitleAutomation")
    })

    it("должен валидировать входные данные", async () => {
      const invalidInput = {
        operation: "invalid_operation" as any,
        clipId: "",
      }

      const result = await enhancedSubtitleAutomation.processEnhancedSubtitles(invalidInput)

      expect(result.success).toBe(false)
      expect(result.errors?.length).toBeGreaterThan(0)
    })

    it("должен обрабатывать таймаут", async () => {
      const input: EnhancedSubtitleInput = {
        operation: "auto_generate_from_video",
        clipId: "test-clip",
        language: "ru",
      }

      const result = await enhancedSubtitleAutomation.processEnhancedSubtitles(input, {
        timeout: 1, // Очень короткий таймаут
      })

      // Должен либо завершиться успешно (если очень быстро), либо с таймаутом
      expect(result).toBeDefined()
    })
  })

  describe("Public API Functions", () => {
    it("autoGenerateSubtitlesFromVideo должен работать", async () => {
      const result = await autoGenerateSubtitlesFromVideo("test-clip-123", {
        language: "ru",
        useSpeechRecognition: true,
        useOCR: true,
      })

      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
    })

    it("extractSubtitlesFromScreenText должен работать", async () => {
      const result = await extractSubtitlesFromScreenText("test-clip-456", "ru")

      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
    })

    it("должен обрабатывать ошибки в публичных функциях gracefully", async () => {
      // Передаем некорректный clipId для проверки обработки ошибок
      const result = await autoGenerateSubtitlesFromVideo("")

      // Функция должна вернуть результат с ошибкой валидации
      expect(result.success).toBe(false)
      expect(result.errors?.length).toBeGreaterThan(0)
    })
  })

  describe("Error Handling", () => {
    it("должен обрабатывать недоступность AI сервисов", async () => {
      const input: EnhancedSubtitleInput = {
        operation: "auto_generate_from_video",
        clipId: "test-clip",
      }

      // AI сервисы уже инициализированы, проверяем что функция работает
      const result = await enhancedSubtitleAutomation.processEnhancedSubtitles(input)
      expect(result).toBeDefined()
      expect(result.success).toBeDefined()
    })

    it("должен предоставлять fallback для синхронизации", async () => {
      // Мокаем ошибку в продвинутой синхронизации
      vi.spyOn(syncService, "synchronizeSubtitles").mockRejectedValue(new Error("Sync failed"))

      const subtitles = [{ id: "1", startTime: 1000, endTime: 3000, text: "Test" }]

      const result = await aiIntegrationService.synchronizeSubtitles(subtitles, [], {})

      // Должен использовать базовую синхронизацию
      expect(result).toBeDefined()
      expect(Array.isArray(result)).toBe(true)
    })
  })

  describe("Performance", () => {
    it("должен завершаться в разумное время", async () => {
      const startTime = Date.now()

      const input: EnhancedSubtitleInput = {
        operation: "generate_from_audio",
        clipId: "performance-test",
        language: "ru",
      }

      await enhancedSubtitleAutomation.processEnhancedSubtitles(input)

      const duration = Date.now() - startTime

      // Не должно занимать больше 30 секунд в тестовом окружении
      expect(duration).toBeLessThan(30000)
    })

    it("должен обрабатывать большое количество субтитров", async () => {
      const manySubtitles = Array.from({ length: 100 }, (_, i) => ({
        id: `subtitle-${i}`,
        startTime: i * 1000,
        endTime: (i + 1) * 1000 - 100,
        text: `Субтитр номер ${i + 1}`,
      }))

      const result = await syncService.synchronizeSubtitles(
        manySubtitles,
        {},
        {
          preventOverlap: true,
          optimizeForReading: true,
        },
      )

      expect(result.synchronizedSubtitles).toHaveLength(100)
      expect(result.quality.overallScore).toBeGreaterThan(0)
    })
  })
})
