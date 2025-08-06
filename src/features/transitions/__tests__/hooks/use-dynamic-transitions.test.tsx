import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useDynamicTransitions } from "../../hooks/use-dynamic-transitions"
import { DynamicTransitionService } from "../../services/dynamic-transition-service"

// Мокаем сервис
vi.mock("../../services/dynamic-transition-service")

// Мокаем ImageData если он не определен
if (typeof ImageData === "undefined") {
  global.ImageData = class ImageData {
    data: Uint8ClampedArray
    width: number
    height: number

    constructor(width: number, height: number) {
      this.width = width
      this.height = height
      this.data = new Uint8ClampedArray(width * height * 4)
    }
  } as any
}

// Мокаем Image если нужно
if (typeof Image === "undefined") {
  global.Image = class Image {
    width = 100
    height = 100
    src = ""
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
  } as any
}

describe("useDynamicTransitions", () => {
  let mockService: any
  let mockCanvas: HTMLCanvasElement
  let mockContext: any

  beforeEach(() => {
    // Создаем моки
    mockContext = {
      getParameter: vi.fn().mockReturnValue(4096),
      getExtension: vi.fn().mockReturnValue(true),
    }

    mockCanvas = {
      width: 1920,
      height: 1080,
      style: {},
      getContext: vi.fn().mockReturnValue(mockContext),
      toBlob: vi.fn((callback) => callback(new Blob())),
      remove: vi.fn(),
    } as any

    // Мокаем createElement только для canvas
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const originalCreateElement = document.createElement.bind(document)
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    document.createElement = vi.fn((tagName: string) => {
      if (tagName === "canvas") {
        return mockCanvas
      }
      return originalCreateElement(tagName)
    })

    // Мокаем appendChild чтобы не добавлять canvas в DOM, но только для canvas
    const originalAppendChild = document.body.appendChild.bind(document.body)

    document.body.appendChild = vi.fn((child: Node) => {
      if (child === mockCanvas) {
        return child
      }
      return originalAppendChild(child)
    })

    // Мокаем сервис
    mockService = {
      initialize: vi.fn().mockReturnValue(true),
      createTextureFromImage: vi.fn().mockReturnValue({}),
      renderDynamicTransition: vi.fn().mockResolvedValue(true),
      dispose: vi.fn(),
    }

    ;(DynamicTransitionService as any).mockImplementation(() => mockService)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it("должен автоматически инициализироваться", async () => {
    const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

    // Инициализируем вручную
    await act(async () => {
      await result.current.initialize()
    })

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    expect(mockService.initialize).toHaveBeenCalledWith(mockCanvas)
    expect(result.current.capabilities.webgl2).toBe(true)
    expect(result.current.capabilities.maxTextureSize).toBe(4096)
  })

  it("должен обрабатывать ошибки инициализации", async () => {
    mockService.initialize.mockReturnValue(false)

    const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

    // Пытаемся инициализировать
    await act(async () => {
      await result.current.initialize()
    })

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })

    expect(result.current.isInitialized).toBe(false)
    expect(result.current.error).toContain("Не удалось инициализировать")
  })

  it("должен рендерить динамический переход", async () => {
    const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

    // Инициализируем сначала
    await act(async () => {
      await result.current.initialize()
    })

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    const mockSourceImage = new Image()
    const mockTargetImage = new Image()

    // Мокаем getImageData
    const mockImageData = new ImageData(100, 100)
    mockCanvas.getContext = vi.fn().mockReturnValue({
      getImageData: vi.fn().mockReturnValue(mockImageData),
    })

    const renderResult = await act(async () => {
      return result.current.renderDynamicTransition({
        shaderType: "particle-dissolve",
        sourceImage: mockSourceImage,
        targetImage: mockTargetImage,
        progress: 0.5,
        parameters: {
          particles: {
            count: 1000,
            size: 2,
            speed: 1.5,
            gravity: 0.2,
            turbulence: 0.3,
          },
        },
      })
    })

    expect(mockService.createTextureFromImage).toHaveBeenCalledTimes(2)
    expect(mockService.renderDynamicTransition).toHaveBeenCalled()
    expect(renderResult).toBe(mockImageData)
  })

  it("должен проверять поддержку типов переходов", async () => {
    const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

    // Инициализируем сначала
    await act(async () => {
      await result.current.initialize()
    })

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    // Устанавливаем низкую производительность
    act(() => {
      result.current.performance.fps = 20
    })

    // Проверяем поддержку
    expect(result.current.isTransitionSupported("particle-dissolve")).toBe(false)
    expect(result.current.isTransitionSupported("fade")).toBe(true)
  })

  it("должен оптимизировать параметры для слабых систем", async () => {
    const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

    // Инициализируем сначала
    await act(async () => {
      await result.current.initialize()
    })

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    // Устанавливаем низкую производительность
    act(() => {
      result.current.performance.fps = 20
      result.current.performance.frameTime = 50
    })

    const originalParams = {
      particles: { count: 5000 },
      physics: { turbulence: 1.0 },
    }

    const optimized = result.current.optimizeParameters("particle-dissolve", originalParams)

    expect(optimized.particles.count).toBeLessThan(originalParams.particles.count)
    expect(optimized.physics.turbulence).toBeLessThan(originalParams.physics.turbulence)
  })

  it("должен экспортировать кадр как Blob", async () => {
    const { result } = renderHook(() => useDynamicTransitions({ autoInitialize: false }))

    // Инициализируем сначала
    await act(async () => {
      await result.current.initialize()
    })

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true)
    })

    const mockImageData = new ImageData(100, 100)
    mockCanvas.getContext = vi.fn().mockReturnValue({
      getImageData: vi.fn().mockReturnValue(mockImageData),
      putImageData: vi.fn(),
    })

    const blob = await act(async () => {
      return result.current.exportFrame({
        shaderType: "liquid-morph",
        sourceImage: new Image(),
        targetImage: new Image(),
        progress: 0.5,
      })
    })

    expect(blob).toBeInstanceOf(Blob)
    expect(mockCanvas.toBlob).toHaveBeenCalled()
  })
})
