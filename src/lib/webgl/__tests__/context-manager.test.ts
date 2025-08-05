/**
 * Tests for WebGL2 Context Manager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { ContextManager } from "../context-manager"

// Mock WebGL2 context
const createMockGL = () => ({
  // Constants
  TEXTURE_2D: 0x0DE1,
  RGBA: 0x1908,
  UNSIGNED_BYTE: 0x1401,
  MAX_TEXTURE_SIZE: 0x0D33,
  MAX_TEXTURE_IMAGE_UNITS: 0x8872,
  MAX_VERTEX_ATTRIBS: 0x8869,
  MAX_VARYING_VECTORS: 0x8DFC,
  MAX_VERTEX_UNIFORM_VECTORS: 0x8DFB,
  MAX_FRAGMENT_UNIFORM_VECTORS: 0x8DFD,
  MAX_DRAW_BUFFERS: 0x8824,
  MAX_COLOR_ATTACHMENTS: 0x8CDF,
  MAX_SAMPLES: 0x8D57,
  VERSION: 0x1F02,
  SHADING_LANGUAGE_VERSION: 0x8B8C,
  DEPTH_TEST: 0x0B71,
  CULL_FACE: 0x0B44,
  STENCIL_TEST: 0x0B90,
  BLEND: 0x0BE2,
  SRC_ALPHA: 0x0302,
  ONE_MINUS_SRC_ALPHA: 0x0303,
  FUNC_ADD: 0x8006,
  UNPACK_FLIP_Y_WEBGL: 0x9240,
  UNPACK_PREMULTIPLY_ALPHA_WEBGL: 0x9241,
  UNPACK_COLORSPACE_CONVERSION_WEBGL: 0x9243,
  UNPACK_ALIGNMENT: 0x0CF5,
  NONE: 0,
  COLOR_BUFFER_BIT: 0x00004000,

  // Methods
  getParameter: vi.fn((param) => {
    const values: Record<number, any> = {
      0x0D33: 16384, // MAX_TEXTURE_SIZE
      0x8872: 32, // MAX_TEXTURE_IMAGE_UNITS
      0x8869: 16, // MAX_VERTEX_ATTRIBS
      0x8DFC: 15, // MAX_VARYING_VECTORS
      0x8DFB: 1024, // MAX_VERTEX_UNIFORM_VECTORS
      0x8DFD: 1024, // MAX_FRAGMENT_UNIFORM_VECTORS
      0x8824: 8, // MAX_DRAW_BUFFERS
      0x8CDF: 8, // MAX_COLOR_ATTACHMENTS
      0x8D57: 8, // MAX_SAMPLES
      0x1F02: "WebGL 2.0", // VERSION
      0x8B8C: "WebGL GLSL ES 3.00", // SHADING_LANGUAGE_VERSION
      0x9246: "NVIDIA GeForce GTX 1080", // UNMASKED_RENDERER_WEBGL
      0x9245: "NVIDIA Corporation", // UNMASKED_VENDOR_WEBGL
    }
    return values[param] || 0
  }),
  
  getExtension: vi.fn((name) => {
    if (name === "WEBGL_debug_renderer_info") {
      return {
        UNMASKED_RENDERER_WEBGL: 0x9246,
        UNMASKED_VENDOR_WEBGL: 0x9245,
      }
    }
    if (name === "EXT_texture_filter_anisotropic") {
      return {
        MAX_TEXTURE_MAX_ANISOTROPY_EXT: 0x84FF,
      }
    }
    if (name === "WEBGL_lose_context") {
      return {
        loseContext: vi.fn(),
        restoreContext: vi.fn()
      }
    }
    if (name === "EXT_color_buffer_float" || name === "OES_texture_float") {
      return {}
    }
    if (name === "EXT_color_buffer_half_float" || name === "OES_texture_half_float") {
      return {}
    }
    return null
  }),
  
  getSupportedExtensions: vi.fn(() => [
    "EXT_color_buffer_float",
    "OES_texture_float_linear",
    "EXT_texture_filter_anisotropic"
  ]),
  
  isContextLost: vi.fn(() => false),
  
  pixelStorei: vi.fn(),
  disable: vi.fn(),
  enable: vi.fn(),
  blendFunc: vi.fn(),
  blendEquation: vi.fn(),
  clearColor: vi.fn(),
  clear: vi.fn(),
  viewport: vi.fn(),
})

// Mock canvas
const createMockCanvas = () => ({
  width: 1920,
  height: 1080,
  style: {} as CSSStyleDeclaration,
  getContext: vi.fn(() => createMockGL()),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
})

describe("ContextManager", () => {
  let manager: ContextManager
  let mockCanvas: ReturnType<typeof createMockCanvas>

  beforeEach(() => {
    manager = new ContextManager()
    mockCanvas = createMockCanvas()
  })

  afterEach(() => {
    manager.dispose()
    vi.clearAllMocks()
  })

  describe("initialization", () => {
    it("should initialize with canvas", () => {
      const success = manager.initialize({
        canvas: mockCanvas as any
      })
      
      expect(success).toBe(true)
      expect(mockCanvas.getContext).toHaveBeenCalledWith("webgl2", expect.any(Object))
    })

    it("should create canvas if not provided", () => {
      // Mock document.createElement
      const originalCreateElement = document.createElement
      const mockCreatedCanvas = createMockCanvas()
      document.createElement = vi.fn(() => mockCreatedCanvas as any)
      
      const success = manager.initialize()
      
      expect(success).toBe(true)
      expect(document.createElement).toHaveBeenCalledWith("canvas")
      
      // Restore
      document.createElement = originalCreateElement
    })

    it("should return false if WebGL2 not supported", () => {
      mockCanvas.getContext = vi.fn(() => null)
      
      const success = manager.initialize({
        canvas: mockCanvas as any
      })
      
      expect(success).toBe(false)
    })

    it("should detect GPU capabilities", () => {
      manager.initialize({
        canvas: mockCanvas as any
      })
      
      const capabilities = manager.getCapabilities()
      
      expect(capabilities).toBeDefined()
      expect(capabilities?.tier).toBe("high") // Based on mock values
      expect(capabilities?.maxTextureSize).toBe(16384)
      expect(capabilities?.supportsFloatTextures).toBe(true)
    })
  })

  describe("context management", () => {
    it("should return context after initialization", () => {
      manager.initialize({
        canvas: mockCanvas as any
      })
      
      const gl = manager.getContext()
      expect(gl).toBeDefined()
    })

    it("should return null if not initialized", () => {
      const gl = manager.getContext()
      expect(gl).toBeNull()
    })

    it("should return canvas", () => {
      manager.initialize({
        canvas: mockCanvas as any
      })
      
      const canvas = manager.getCanvas()
      expect(canvas).toBe(mockCanvas)
    })
  })

  describe("resize", () => {
    it("should resize canvas with device pixel ratio", () => {
      // Mock devicePixelRatio
      Object.defineProperty(window, "devicePixelRatio", {
        value: 2,
        configurable: true
      })
      
      manager.initialize({
        canvas: mockCanvas as any
      })
      
      manager.resize(640, 480)
      
      expect(mockCanvas.width).toBe(1280) // 640 * 2
      expect(mockCanvas.height).toBe(960) // 480 * 2
      expect(mockCanvas.style.width).toBe("640px")
      expect(mockCanvas.style.height).toBe("480px")
    })

    it("should update viewport", () => {
      // Mock devicePixelRatio
      Object.defineProperty(window, "devicePixelRatio", {
        value: 2,
        configurable: true
      })
      
      manager.initialize({
        canvas: mockCanvas as any
      })
      
      const gl = manager.getContext()
      manager.resize(800, 600)
      
      expect(gl?.viewport).toHaveBeenCalledWith(0, 0, 1600, 1200) // 800 * 2, 600 * 2
    })
  })

  describe("event handling", () => {
    it("should handle context lost event", () => {
      manager.initialize({
        canvas: mockCanvas as any
      })
      
      const contextLostSpy = vi.fn()
      manager.on("contextLost", contextLostSpy)
      
      // Simulate context lost
      const contextLostHandler = mockCanvas.addEventListener.mock.calls.find(
        call => call[0] === "webglcontextlost"
      )?.[1]
      
      const event = new Event("webglcontextlost")
      event.preventDefault = vi.fn()
      contextLostHandler?.(event)
      
      expect(event.preventDefault).toHaveBeenCalled()
      expect(contextLostSpy).toHaveBeenCalled()
    })

    it("should handle context restored event", () => {
      manager.initialize({
        canvas: mockCanvas as any
      })
      
      const contextRestoredSpy = vi.fn()
      manager.on("contextRestored", contextRestoredSpy)
      
      // Simulate context restored
      const contextRestoredHandler = mockCanvas.addEventListener.mock.calls.find(
        call => call[0] === "webglcontextrestored"
      )?.[1]
      
      contextRestoredHandler?.()
      
      expect(contextRestoredSpy).toHaveBeenCalled()
    })
  })

  describe("cleanup", () => {
    it("should dispose resources", () => {
      manager.initialize({
        canvas: mockCanvas as any
      })
      
      // Получаем контекст перед dispose
      const gl = manager.getContext() as any
      expect(gl).not.toBeNull()
      
      // Мокаем loseContext перед вызовом dispose
      const loseContextSpy = vi.fn()
      const originalGetExtension = gl.getExtension
      gl.getExtension = vi.fn((name: string) => {
        if (name === "WEBGL_lose_context") {
          return { loseContext: loseContextSpy }
        }
        return originalGetExtension.call(gl, name)
      })
      
      manager.dispose()
      
      expect(loseContextSpy).toHaveBeenCalled()
      expect(manager.getContext()).toBeNull()
      expect(manager.getCanvas()).toBeNull()
    })

    it("should remove event listeners", () => {
      manager.initialize({
        canvas: mockCanvas as any
      })
      
      manager.dispose()
      
      expect(mockCanvas.removeEventListener).toHaveBeenCalledWith(
        "webglcontextlost",
        expect.any(Function)
      )
      expect(mockCanvas.removeEventListener).toHaveBeenCalledWith(
        "webglcontextrestored",
        expect.any(Function)
      )
    })
  })

  describe("GPU tier detection", () => {
    it("should detect high tier GPU", () => {
      mockCanvas.getContext = vi.fn(() => {
        const gl = createMockGL()
        gl.getParameter = vi.fn((param) => {
          if (param === 0x0D33) return 16384 // MAX_TEXTURE_SIZE
          if (param === 0x8872) return 32 // MAX_TEXTURE_IMAGE_UNITS
          return 0
        })
        return gl
      })
      
      manager.initialize({ canvas: mockCanvas as any })
      
      const capabilities = manager.getCapabilities()
      expect(capabilities?.tier).toBe("high")
    })

    it("should detect low tier GPU", () => {
      mockCanvas.getContext = vi.fn(() => {
        const gl = createMockGL()
        gl.getParameter = vi.fn((param) => {
          if (param === 0x0D33) return 4096 // MAX_TEXTURE_SIZE
          if (param === 0x8872) return 8 // MAX_TEXTURE_IMAGE_UNITS
          return 0
        })
        return gl
      })
      
      manager.initialize({ canvas: mockCanvas as any })
      
      const capabilities = manager.getCapabilities()
      expect(capabilities?.tier).toBe("low")
    })
  })
})