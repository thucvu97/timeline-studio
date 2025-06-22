import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useTimelineAI, useTimelineAIQuick } from "../../hooks/use-timeline-ai"
import { TimelineAIService } from "../../services/timeline-ai-service"

// Create mock instances
const mockSendTimelineEvent = vi.fn()

// Mock dependencies
vi.mock("../../hooks/use-chat", () => ({
  useChat: vi.fn(() => ({
    sendTimelineEvent: mockSendTimelineEvent,
  })),
}))

vi.mock("@/features/resources/services/resources-provider", () => ({
  useResources: vi.fn(() => ({
    mediaResources: [],
    effectResources: [],
    filterResources: [],
    transitionResources: [],
    templateResources: [],
    styleTemplateResources: [],
    musicResources: [],
  })),
}))

vi.mock("../../services/timeline-ai-service", () => {
  const mockTimelineAIService = vi.fn()
  mockTimelineAIService.prototype.createTimelineFromPrompt = vi.fn()
  mockTimelineAIService.prototype.analyzeAndSuggestResources = vi.fn()
  mockTimelineAIService.prototype.executeCommand = vi.fn()
  mockTimelineAIService.prototype.setApiKey = vi.fn()
  
  return {
    TimelineAIService: mockTimelineAIService,
  }
})

describe("useTimelineAI", () => {
  let mockTimelineAIInstance: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockSendTimelineEvent.mockClear()
    
    // Get the mocked instance
    mockTimelineAIInstance = TimelineAIService.prototype
  })

  describe("Hook initialization", () => {
    it("должен корректно инициализировать хук", () => {
      const { result } = renderHook(() => useTimelineAI())

      expect(result.current).toMatchObject({
        createTimelineFromPrompt: expect.any(Function),
        analyzeResources: expect.any(Function),
        executeCommand: expect.any(Function),
        setApiKey: expect.any(Function),
        quickCommands: expect.any(Object),
        timelineAI: expect.any(Object),
      })
    })

    it("должен создавать экземпляр TimelineAIService", () => {
      renderHook(() => useTimelineAI())
      expect(TimelineAIService).toHaveBeenCalledTimes(1)
    })
  })

  describe("createTimelineFromPrompt", () => {
    it("должен успешно создавать timeline из промпта", async () => {
      const mockResult = {
        success: true,
        message: "Timeline успешно создан",
        data: { createdProject: { id: "test-project" } },
        executionTime: 1500,
      }
      
      mockTimelineAIInstance.createTimelineFromPrompt.mockResolvedValue(mockResult)
      
      const { result } = renderHook(() => useTimelineAI())

      let operationResult: any
      await act(async () => {
        operationResult = await result.current.createTimelineFromPrompt("Создай видео из фотографий")
      })

      // Проверяем вызов sendTimelineEvent с правильными параметрами
      expect(mockSendTimelineEvent).toHaveBeenCalledWith({
        type: "CREATE_TIMELINE_FROM_PROMPT",
        prompt: "Создай видео из фотографий",
      })

      expect(mockSendTimelineEvent).toHaveBeenCalledWith({
        type: "TIMELINE_OPERATION_SUCCESS",
        result: mockResult,
      })

      // Проверяем результат операции
      expect(operationResult).toEqual({
        operation: "create-timeline",
        success: true,
        message: "Timeline успешно создан",
        data: { createdProject: { id: "test-project" } },
        executionTime: 1500,
      })
    })

    it("должен обрабатывать ошибки при создании timeline", async () => {
      const mockError = new Error("Ошибка создания timeline")
      mockTimelineAIInstance.createTimelineFromPrompt.mockRejectedValue(mockError)
      
      const { result } = renderHook(() => useTimelineAI())

      let operationResult: any
      await act(async () => {
        operationResult = await result.current.createTimelineFromPrompt("Создай видео")
      })

      expect(mockSendTimelineEvent).toHaveBeenCalledWith({
        type: "TIMELINE_OPERATION_ERROR",
        error: "Ошибка создания timeline",
      })

      expect(operationResult).toEqual({
        operation: "create-timeline",
        success: false,
        message: "Ошибка создания timeline",
        errors: ["Ошибка создания timeline"],
        executionTime: 0,
      })
    })

    it("должен обрабатывать неуспешный результат от сервиса", async () => {
      const mockResult = {
        success: false,
        message: "Недостаточно ресурсов",
        errors: ["Нет медиафайлов"],
        warnings: ["Низкое качество видео"],
        executionTime: 500,
      }
      
      mockTimelineAIInstance.createTimelineFromPrompt.mockResolvedValue(mockResult)
      
      const { result } = renderHook(() => useTimelineAI())

      let operationResult: any
      await act(async () => {
        operationResult = await result.current.createTimelineFromPrompt("Создай видео")
      })

      expect(mockSendTimelineEvent).toHaveBeenCalledWith({
        type: "TIMELINE_OPERATION_ERROR",
        error: "Недостаточно ресурсов",
      })

      expect(operationResult).toMatchObject({
        operation: "create-timeline",
        success: false,
        message: "Недостаточно ресурсов",
        errors: ["Нет медиафайлов"],
        warnings: ["Низкое качество видео"],
      })
    })
  })

  describe("analyzeResources", () => {
    it("должен успешно анализировать ресурсы", async () => {
      const mockResult = {
        success: true,
        message: "Анализ завершен",
        data: {
          analysis: { quality: "high", suggestions: ["Добавить переходы"] },
        },
        executionTime: 800,
      }
      
      mockTimelineAIInstance.analyzeAndSuggestResources.mockResolvedValue(mockResult)
      
      const { result } = renderHook(() => useTimelineAI())

      let operationResult: any
      await act(async () => {
        operationResult = await result.current.analyzeResources("Проанализируй качество видео")
      })

      expect(mockSendTimelineEvent).toHaveBeenCalledWith({
        type: "ANALYZE_RESOURCES",
        query: "Проанализируй качество видео",
      })

      expect(mockSendTimelineEvent).toHaveBeenCalledWith({
        type: "TIMELINE_OPERATION_SUCCESS",
        result: mockResult,
      })

      expect(operationResult).toEqual({
        operation: "analyze-resources",
        success: true,
        message: "Анализ завершен",
        data: {
          analysis: { quality: "high", suggestions: ["Добавить переходы"] },
        },
        executionTime: 800,
      })
    })

    it("должен обрабатывать ошибки при анализе ресурсов", async () => {
      const mockError = new Error("Сервис недоступен")
      mockTimelineAIInstance.analyzeAndSuggestResources.mockRejectedValue(mockError)
      
      const { result } = renderHook(() => useTimelineAI())

      let operationResult: any
      await act(async () => {
        operationResult = await result.current.analyzeResources("Анализ")
      })

      expect(mockSendTimelineEvent).toHaveBeenCalledWith({
        type: "TIMELINE_OPERATION_ERROR",
        error: "Сервис недоступен",
      })

      expect(operationResult).toEqual({
        operation: "analyze-resources",
        success: false,
        message: "Сервис недоступен",
        errors: ["Сервис недоступен"],
        executionTime: 0,
      })
    })

    it("должен обрабатывать ошибку не являющуюся Error объектом", async () => {
      mockTimelineAIInstance.analyzeAndSuggestResources.mockRejectedValue("Строковая ошибка")
      
      const { result } = renderHook(() => useTimelineAI())

      let operationResult: any
      await act(async () => {
        operationResult = await result.current.analyzeResources("Анализ")
      })

      expect(operationResult).toEqual({
        operation: "analyze-resources",
        success: false,
        message: "Неизвестная ошибка",
        errors: ["Неизвестная ошибка"],
        executionTime: 0,
      })
    })

    it("должен обрабатывать неуспешный результат от сервиса при анализе", async () => {
      const mockResult = {
        success: false,
        message: "Недостаточно данных для анализа",
        errors: ["Нет медиафайлов для анализа"],
        executionTime: 100,
      }
      
      mockTimelineAIInstance.analyzeAndSuggestResources.mockResolvedValue(mockResult)
      
      const { result } = renderHook(() => useTimelineAI())

      let operationResult: any
      await act(async () => {
        operationResult = await result.current.analyzeResources("Анализ качества")
      })

      expect(mockSendTimelineEvent).toHaveBeenCalledWith({
        type: "TIMELINE_OPERATION_ERROR",
        error: "Недостаточно данных для анализа",
      })

      expect(operationResult).toMatchObject({
        operation: "analyze-resources",
        success: false,
        message: "Недостаточно данных для анализа",
        errors: ["Нет медиафайлов для анализа"],
        executionTime: 100,
      })
    })
  })

  describe("executeCommand", () => {
    it("должен успешно выполнять команду с параметрами", async () => {
      const mockResult = {
        success: true,
        message: "Команда выполнена",
        data: { appliedEnhancements: ["color-correction", "stabilization"] },
        executionTime: 1200,
      }
      
      mockTimelineAIInstance.executeCommand.mockResolvedValue(mockResult)
      
      const { result } = renderHook(() => useTimelineAI())

      const params = { intensity: 0.8, mode: "auto" }
      let operationResult: any
      await act(async () => {
        operationResult = await result.current.executeCommand("Примени цветокоррекцию", params)
      })

      expect(mockSendTimelineEvent).toHaveBeenCalledWith({
        type: "EXECUTE_AI_COMMAND",
        command: "Примени цветокоррекцию",
        params,
      })

      expect(mockTimelineAIInstance.executeCommand).toHaveBeenCalledWith("Примени цветокоррекцию", params)

      expect(operationResult).toEqual({
        operation: "execute-command",
        success: true,
        message: "Команда выполнена",
        data: { appliedEnhancements: ["color-correction", "stabilization"] },
        executionTime: 1200,
      })
    })

    it("должен выполнять команду без параметров", async () => {
      const mockResult = {
        success: true,
        message: "Команда выполнена",
        executionTime: 300,
      }
      
      mockTimelineAIInstance.executeCommand.mockResolvedValue(mockResult)
      
      const { result } = renderHook(() => useTimelineAI())

      let operationResult: any
      await act(async () => {
        operationResult = await result.current.executeCommand("Очистить timeline")
      })

      expect(mockTimelineAIInstance.executeCommand).toHaveBeenCalledWith("Очистить timeline", undefined)
      expect(operationResult.success).toBe(true)
    })

    it("должен обрабатывать ошибки выполнения команды", async () => {
      const mockError = new Error("Команда не распознана")
      mockTimelineAIInstance.executeCommand.mockRejectedValue(mockError)
      
      const { result } = renderHook(() => useTimelineAI())

      let operationResult: any
      await act(async () => {
        operationResult = await result.current.executeCommand("Неизвестная команда")
      })

      expect(mockSendTimelineEvent).toHaveBeenCalledWith({
        type: "TIMELINE_OPERATION_ERROR",
        error: "Команда не распознана",
      })

      expect(operationResult).toEqual({
        operation: "execute-command",
        success: false,
        message: "Команда не распознана",
        errors: ["Команда не распознана"],
        executionTime: 0,
      })
    })

    it("должен обрабатывать неуспешный результат от сервиса при выполнении команды", async () => {
      const mockResult = {
        success: false,
        message: "Команда не может быть выполнена",
        errors: ["Недостаточно прав", "Неверные параметры"],
        warnings: ["Устаревшая команда"],
        executionTime: 50,
      }
      
      mockTimelineAIInstance.executeCommand.mockResolvedValue(mockResult)
      
      const { result } = renderHook(() => useTimelineAI())

      let operationResult: any
      await act(async () => {
        operationResult = await result.current.executeCommand("Команда с ошибкой", { param: "value" })
      })

      expect(mockSendTimelineEvent).toHaveBeenCalledWith({
        type: "TIMELINE_OPERATION_ERROR",
        error: "Команда не может быть выполнена",
      })

      expect(operationResult).toMatchObject({
        operation: "execute-command",
        success: false,
        message: "Команда не может быть выполнена",
        errors: ["Недостаточно прав", "Неверные параметры"],
        warnings: ["Устаревшая команда"],
        executionTime: 50,
      })
    })
  })

  describe("setApiKey", () => {
    it("должен устанавливать API ключ", () => {
      const { result } = renderHook(() => useTimelineAI())
      const apiKey = "test-api-key-123"

      act(() => {
        result.current.setApiKey(apiKey)
      })

      expect(mockTimelineAIInstance.setApiKey).toHaveBeenCalledWith(apiKey)
    })
  })

  describe("quickCommands", () => {
    beforeEach(() => {
      // Mock successful responses for quick commands
      mockTimelineAIInstance.executeCommand.mockResolvedValue({
        success: true,
        message: "Команда выполнена",
        executionTime: 500,
      })
      
      mockTimelineAIInstance.createTimelineFromPrompt.mockResolvedValue({
        success: true,
        message: "Timeline создан",
        executionTime: 1000,
      })
      
      mockTimelineAIInstance.analyzeAndSuggestResources.mockResolvedValue({
        success: true,
        message: "Анализ завершен",
        executionTime: 800,
      })
    })

    it("должен выполнять addAllVideosToResources", async () => {
      const { result } = renderHook(() => useTimelineAI())

      await act(async () => {
        await result.current.quickCommands.addAllVideosToResources()
      })

      expect(mockTimelineAIInstance.executeCommand).toHaveBeenCalledWith(
        "Добавь все видеофайлы из браузера в ресурсы проекта",
        undefined
      )
    })

    it("должен выполнять createChronologicalTimeline", async () => {
      const { result } = renderHook(() => useTimelineAI())

      await act(async () => {
        await result.current.quickCommands.createChronologicalTimeline()
      })

      expect(mockTimelineAIInstance.createTimelineFromPrompt).toHaveBeenCalledWith(
        "Создай хронологический timeline из всех доступных видео, упорядочив их по времени создания"
      )
    })

    it("должен выполнять analyzeMediaQuality", async () => {
      const { result } = renderHook(() => useTimelineAI())

      await act(async () => {
        await result.current.quickCommands.analyzeMediaQuality()
      })

      expect(mockTimelineAIInstance.analyzeAndSuggestResources).toHaveBeenCalledWith(
        "Проанализируй качество всех медиафайлов и предложи улучшения"
      )
    })

    it("должен выполнять createWeddingVideo", async () => {
      const { result } = renderHook(() => useTimelineAI())

      await act(async () => {
        await result.current.quickCommands.createWeddingVideo()
      })

      expect(mockTimelineAIInstance.createTimelineFromPrompt).toHaveBeenCalledWith(
        "Создай свадебное видео из доступных материалов с романтичной музыкой и переходами"
      )
    })

    it("должен выполнять createTravelVideo", async () => {
      const { result } = renderHook(() => useTimelineAI())

      await act(async () => {
        await result.current.quickCommands.createTravelVideo()
      })

      expect(mockTimelineAIInstance.createTimelineFromPrompt).toHaveBeenCalledWith(
        "Создай динамичное тревел-видео с энергичной музыкой и быстрыми переходами"
      )
    })

    it("должен выполнять createCorporateVideo", async () => {
      const { result } = renderHook(() => useTimelineAI())

      await act(async () => {
        await result.current.quickCommands.createCorporateVideo()
      })

      expect(mockTimelineAIInstance.createTimelineFromPrompt).toHaveBeenCalledWith(
        "Создай профессиональное корпоративное видео с титрами и спокойными переходами"
      )
    })

    it("должен выполнять applyColorCorrection", async () => {
      const { result } = renderHook(() => useTimelineAI())

      await act(async () => {
        await result.current.quickCommands.applyColorCorrection()
      })

      expect(mockTimelineAIInstance.executeCommand).toHaveBeenCalledWith(
        "Примени автоматическую цветокоррекцию ко всем видео в ресурсах",
        undefined
      )
    })

    it("должен выполнять addTransitionsBetweenClips", async () => {
      const { result } = renderHook(() => useTimelineAI())

      await act(async () => {
        await result.current.quickCommands.addTransitionsBetweenClips()
      })

      expect(mockTimelineAIInstance.executeCommand).toHaveBeenCalledWith(
        "Добавь плавные переходы между всеми клипами на timeline",
        undefined
      )
    })

    it("должен выполнять syncVideoWithMusic", async () => {
      const { result } = renderHook(() => useTimelineAI())

      await act(async () => {
        await result.current.quickCommands.syncVideoWithMusic()
      })

      expect(mockTimelineAIInstance.executeCommand).toHaveBeenCalledWith(
        "Синхронизируй видео клипы с ритмом музыкального сопровождения",
        undefined
      )
    })
  })

  describe("useTimelineAIQuick", () => {
    it("должен возвращать только quickCommands", () => {
      const { result } = renderHook(() => useTimelineAIQuick())

      expect(result.current).toHaveProperty("addAllVideosToResources")
      expect(result.current).toHaveProperty("createChronologicalTimeline")
      expect(result.current).toHaveProperty("analyzeMediaQuality")
      expect(result.current).toHaveProperty("createWeddingVideo")
      expect(result.current).toHaveProperty("createTravelVideo")
      expect(result.current).toHaveProperty("createCorporateVideo")
      expect(result.current).toHaveProperty("applyColorCorrection")
      expect(result.current).toHaveProperty("addTransitionsBetweenClips")
      expect(result.current).toHaveProperty("syncVideoWithMusic")

      // Проверяем, что возвращаются только quickCommands, а не весь объект
      expect(result.current).not.toHaveProperty("createTimelineFromPrompt")
      expect(result.current).not.toHaveProperty("analyzeResources")
      expect(result.current).not.toHaveProperty("executeCommand")
      expect(result.current).not.toHaveProperty("setApiKey")
      expect(result.current).not.toHaveProperty("timelineAI")
    })

    it("должен корректно выполнять команды из quickCommands", async () => {
      mockTimelineAIInstance.executeCommand.mockResolvedValue({
        success: true,
        message: "Команда выполнена",
        executionTime: 500,
      })

      const { result } = renderHook(() => useTimelineAIQuick())

      await act(async () => {
        await result.current.addAllVideosToResources()
      })

      expect(mockTimelineAIInstance.executeCommand).toHaveBeenCalledWith(
        "Добавь все видеофайлы из браузера в ресурсы проекта",
        undefined
      )
    })
  })

  describe("Edge cases and error handling", () => {
    it("должен обрабатывать null/undefined ошибки", async () => {
      mockTimelineAIInstance.createTimelineFromPrompt.mockRejectedValue(null)
      
      const { result } = renderHook(() => useTimelineAI())

      let operationResult: any
      await act(async () => {
        operationResult = await result.current.createTimelineFromPrompt("test")
      })

      expect(operationResult).toEqual({
        operation: "create-timeline",
        success: false,
        message: "Неизвестная ошибка",
        errors: ["Неизвестная ошибка"],
        executionTime: 0,
      })
    })

    it("должен сохранять все поля из результата сервиса", async () => {
      const mockResult = {
        success: true,
        message: "Операция завершена",
        data: { custom: "data" },
        errors: ["minor error"],
        warnings: ["warning 1", "warning 2"],
        executionTime: 1500,
        nextActions: ["action1", "action2"],
      }
      
      mockTimelineAIInstance.createTimelineFromPrompt.mockResolvedValue(mockResult)
      
      const { result } = renderHook(() => useTimelineAI())

      let operationResult: any
      await act(async () => {
        operationResult = await result.current.createTimelineFromPrompt("test")
      })

      expect(operationResult).toMatchObject({
        operation: "create-timeline",
        success: true,
        message: "Операция завершена",
        data: { custom: "data" },
        errors: ["minor error"],
        warnings: ["warning 1", "warning 2"],
        executionTime: 1500,
      })
    })
  })

  describe("Hook stability", () => {
    it("должен создавать новый экземпляр TimelineAIService при каждом рендере", () => {
      const { result, rerender } = renderHook(() => useTimelineAI())

      const firstTimelineAI = result.current.timelineAI

      rerender()

      const secondTimelineAI = result.current.timelineAI

      // TimelineAIService создается заново при каждом рендере (это текущее поведение)
      expect(firstTimelineAI).not.toBe(secondTimelineAI)
    })

    it("должен сохранять работоспособность функций между рендерами", async () => {
      const mockResult = {
        success: true,
        message: "Команда выполнена",
        executionTime: 500,
      }
      
      mockTimelineAIInstance.executeCommand.mockResolvedValue(mockResult)
      
      const { result, rerender } = renderHook(() => useTimelineAI())

      // Вызываем функцию из первого рендера
      await act(async () => {
        await result.current.executeCommand("test command")
      })

      expect(mockTimelineAIInstance.executeCommand).toHaveBeenCalledTimes(1)

      rerender()

      // Вызываем функцию после ререндера
      await act(async () => {
        await result.current.executeCommand("another command")
      })

      expect(mockTimelineAIInstance.executeCommand).toHaveBeenCalledTimes(2)
      expect(mockTimelineAIInstance.executeCommand).toHaveBeenLastCalledWith("another command", undefined)
    })
  })
})