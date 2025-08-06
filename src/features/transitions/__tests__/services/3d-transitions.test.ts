import { beforeEach, describe, expect, it, vi } from "vitest"

import { DynamicTransitionService } from "../../services/dynamic-transition-service"

// Мокаем WebGL2 контекст
const mockWebGL2Context = {
  getExtension: vi.fn(() => ({})),
  enable: vi.fn(),
  blendFunc: vi.fn(),
  clearColor: vi.fn(),
  viewport: vi.fn(),
  clear: vi.fn(),
  useProgram: vi.fn(),
  drawArrays: vi.fn(),
  createShader: vi.fn(() => ({})),
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  getShaderParameter: vi.fn(() => true),
  createProgram: vi.fn(() => ({})),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  getProgramParameter: vi.fn(() => true),
  getUniformLocation: vi.fn(() => ({})),
  uniform1f: vi.fn(),
  uniform2fv: vi.fn(),
  uniform3fv: vi.fn(),
  uniform4fv: vi.fn(),
  uniform1i: vi.fn(),
  createBuffer: vi.fn(() => ({})),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  getAttribLocation: vi.fn(() => 0),
  enableVertexAttribArray: vi.fn(),
  vertexAttribPointer: vi.fn(),
  activeTexture: vi.fn(),
  bindTexture: vi.fn(),
  deleteProgram: vi.fn(),
  deleteBuffer: vi.fn(),
  deleteFramebuffer: vi.fn(),
  VERTEX_SHADER: 35633,
  FRAGMENT_SHADER: 35632,
  COMPILE_STATUS: 35713,
  LINK_STATUS: 35714,
  TEXTURE_2D: 3553,
  TEXTURE0: 33984,
  TEXTURE1: 33985,
  ARRAY_BUFFER: 34962,
  STATIC_DRAW: 35044,
  DYNAMIC_DRAW: 35048,
  TRIANGLE_STRIP: 5,
  FLOAT: 5126,
  COLOR_BUFFER_BIT: 16384,
  DEPTH_BUFFER_BIT: 256,
  BLEND: 3042,
  SRC_ALPHA: 770,
  ONE_MINUS_SRC_ALPHA: 771,
}

// Мокаем canvas
const mockCanvas = {
  width: 1920,
  height: 1080,
  getContext: vi.fn(() => mockWebGL2Context),
} as unknown as HTMLCanvasElement

// Мокаем WebGL текстуры
const mockTexture = {} as WebGLTexture

describe("3D Transitions Service", () => {
  let service: DynamicTransitionService

  beforeEach(() => {
    service = new DynamicTransitionService()
    vi.clearAllMocks()
  })

  describe("Initialization", () => {
    it("должен успешно инициализироваться с WebGL2", async () => {
      const result = await service.initialize(mockCanvas)
      expect(result).toBe(true)
      expect(mockCanvas.getContext).toHaveBeenCalledWith("webgl2", {
        alpha: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
        antialias: true,
        powerPreference: "high-performance",
      })
    })

    it("должен вернуть false если WebGL2 недоступен", async () => {
      const mockCanvasNoWebGL = {
        getContext: vi.fn(() => null),
      } as unknown as HTMLCanvasElement

      const result = await service.initialize(mockCanvasNoWebGL)
      expect(result).toBe(false)
    })
  })

  describe("3D Transitions Rendering", () => {
    beforeEach(async () => {
      await service.initialize(mockCanvas)
    })

    it("должен рендерить page-flip переход", async () => {
      const result = await service.renderDynamicTransition({
        canvas: mockCanvas,
        sourceTexture: mockTexture,
        targetTexture: mockTexture,
        progress: 0.5,
        shaderType: "page-flip",
        parameters: {
          flipDirection: 1, // right
          perspective: 1000,
          curvature: 0.6,
          shadowIntensity: 0.4,
        },
      })

      expect(result).toBe(true)
      expect(mockWebGL2Context.useProgram).toHaveBeenCalled()
      expect(mockWebGL2Context.drawArrays).toHaveBeenCalled()
    })

    it("должен рендерить card-shuffle переход", async () => {
      const result = await service.renderDynamicTransition({
        canvas: mockCanvas,
        sourceTexture: mockTexture,
        targetTexture: mockTexture,
        progress: 0.3,
        shaderType: "card-shuffle",
        parameters: {
          cardCount: 16,
          shufflePattern: 0, // riffle
          rotationChaos: 0.7,
          gravity: 0.5,
        },
      })

      expect(result).toBe(true)
    })

    it("должен рендерить helix-spin переход", async () => {
      const result = await service.renderDynamicTransition({
        canvas: mockCanvas,
        sourceTexture: mockTexture,
        targetTexture: mockTexture,
        progress: 0.7,
        shaderType: "helix-spin",
        parameters: {
          helixTurns: 2,
          radius: 0.3,
          axis: 1, // vertical
          twist: 1,
        },
      })

      expect(result).toBe(true)
    })

    it("должен рендерить sphere-mapping переход", async () => {
      const result = await service.renderDynamicTransition({
        canvas: mockCanvas,
        sourceTexture: mockTexture,
        targetTexture: mockTexture,
        progress: 0.8,
        shaderType: "sphere-mapping",
        parameters: {
          sphereRadius: 0.8,
          rotationSpeed: 1.0,
          lightPosition: [0.5, -0.5, 1.0],
          reflectivity: 0.3,
        },
      })

      expect(result).toBe(true)
    })

    it("должен обрабатывать недопустимые параметры", async () => {
      const result = await service.renderDynamicTransition({
        canvas: mockCanvas,
        sourceTexture: mockTexture,
        targetTexture: mockTexture,
        progress: 0.5,
        shaderType: "page-flip",
        parameters: {}, // Пустые параметры - должны использоваться defaults
      })

      expect(result).toBe(true)
    })
  })

  describe("Shader Types", () => {
    beforeEach(async () => {
      await service.initialize(mockCanvas)
    })

    const threeDShaderTypes = ["page-flip", "card-shuffle", "helix-spin", "sphere-mapping"]

    threeDShaderTypes.forEach((shaderType) => {
      it(`должен поддерживать ${shaderType} шейдер`, async () => {
        const result = await service.renderDynamicTransition({
          canvas: mockCanvas,
          sourceTexture: mockTexture,
          targetTexture: mockTexture,
          progress: 0.5,
          shaderType: shaderType as any,
          parameters: {},
        })

        expect(result).toBe(true)
      })
    })
  })

  describe("Parameter Validation", () => {
    beforeEach(async () => {
      await service.initialize(mockCanvas)
    })

    it("должен использовать default значения для page-flip", async () => {
      await service.renderDynamicTransition({
        canvas: mockCanvas,
        sourceTexture: mockTexture,
        targetTexture: mockTexture,
        progress: 0.5,
        shaderType: "page-flip",
        parameters: {},
      })

      // Проверяем что uniform1f был вызван с default параметрами
      const calls = mockWebGL2Context.uniform1f.mock.calls
      const values = calls.map((call) => call[1])

      expect(values).toContain(1) // flipDirection default
      expect(values).toContain(1000) // perspective default
      expect(values).toContain(0.6) // curvature default
      expect(values).toContain(0.4) // shadowIntensity default
    })

    it("должен использовать пользовательские параметры", async () => {
      const customParams = {
        flipDirection: 0, // left
        perspective: 1500,
        curvature: 0.8,
        shadowIntensity: 0.6,
      }

      await service.renderDynamicTransition({
        canvas: mockCanvas,
        sourceTexture: mockTexture,
        targetTexture: mockTexture,
        progress: 0.5,
        shaderType: "page-flip",
        parameters: customParams,
      })

      // Проверяем что uniform1f был вызван с нашими параметрами
      const calls = mockWebGL2Context.uniform1f.mock.calls
      const values = calls.map((call) => call[1])

      expect(values).toContain(0) // custom flipDirection
      expect(values).toContain(1500) // custom perspective
      expect(values).toContain(0.8) // custom curvature
      expect(values).toContain(0.6) // custom shadowIntensity
    })
  })

  describe("Error Handling", () => {
    it("должен возвращать false для неизвестного типа шейдера", async () => {
      await service.initialize(mockCanvas)

      const result = await service.renderDynamicTransition({
        canvas: mockCanvas,
        sourceTexture: mockTexture,
        targetTexture: mockTexture,
        progress: 0.5,
        shaderType: "unknown-3d-effect" as any,
        parameters: {},
      })

      expect(result).toBe(false)
    })

    it("должен обрабатывать ошибки рендеринга", async () => {
      await service.initialize(mockCanvas)

      // Эмулируем ошибку в WebGL
      mockWebGL2Context.drawArrays.mockImplementation(() => {
        throw new Error("WebGL rendering error")
      })

      const result = await service.renderDynamicTransition({
        canvas: mockCanvas,
        sourceTexture: mockTexture,
        targetTexture: mockTexture,
        progress: 0.5,
        shaderType: "page-flip",
        parameters: {},
      })

      expect(result).toBe(false)
    })
  })

  describe("Performance", () => {
    beforeEach(async () => {
      await service.initialize(mockCanvas)
    })

    it("должен рендерить 3D переходы в приемлемое время", async () => {
      const startTime = performance.now()

      await service.renderDynamicTransition({
        canvas: mockCanvas,
        sourceTexture: mockTexture,
        targetTexture: mockTexture,
        progress: 0.5,
        shaderType: "helix-spin",
        parameters: {
          helixTurns: 3,
          radius: 0.4,
          axis: 2, // diagonal
          twist: 2,
        },
      })

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // 3D рендеринг должен занимать менее 50ms
      expect(renderTime).toBeLessThan(50)
    })
  })

  describe("Memory Management", () => {
    it("должен правильно очищать ресурсы", async () => {
      await service.initialize(mockCanvas)

      // Сначала сделаем рендеринг, чтобы создались ресурсы
      await service.renderDynamicTransition({
        canvas: mockCanvas,
        sourceTexture: mockTexture,
        targetTexture: mockTexture,
        progress: 0.5,
        shaderType: "page-flip",
        parameters: {},
      })

      // Теперь очищаем ресурсы
      service.dispose()

      // Проверяем что методы очистки были вызваны
      expect(mockWebGL2Context.deleteProgram).toHaveBeenCalled()
    })

    it("должен обрабатывать dispose без инициализации", () => {
      expect(() => service.dispose()).not.toThrow()
    })
  })
})
