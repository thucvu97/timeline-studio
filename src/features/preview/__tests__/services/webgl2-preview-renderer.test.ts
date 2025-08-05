/**
 * Tests for WebGL2PreviewRenderer
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { WebGL2PreviewRenderer } from "../../services/webgl2-preview-renderer"

// Mock WebGL2 библиотеку
vi.mock("@/lib/webgl", () => ({
  BaseRenderer: class BaseRenderer {
    gl: WebGL2RenderingContext | null = null
    canvas: HTMLCanvasElement | null = null
    capabilities: any = { tier: "medium" }
    
    constructor(options: any) {
      this.canvas = options.canvas || document.createElement("canvas")
    }
    
    async initialize() {
      return true
    }
    
    dispose() {}
    
    render() {}
    
    resize(width: number, height: number) {}
    
    createTexture() {
      return {}
    }
    
    createFramebuffer() {
      return {}
    }
    
    bindFramebuffer() {}
    
    useProgram() {
      return { program: {} }
    }
    
    setUniform() {}
  },
  
  shaderPool: {
    getProgram: vi.fn().mockReturnValue({ program: {} })
  },
  
  vaoManager: {
    createQuadVAO: vi.fn().mockReturnValue({}),
    bindVAO: vi.fn(),
    unbindVAO: vi.fn(),
    releaseVAO: vi.fn()
  }
}))

// Mock ImageData
if (typeof ImageData === 'undefined') {
  global.ImageData = class ImageData {
    constructor(public width: number, public height: number) {
      this.data = new Uint8ClampedArray(width * height * 4)
    }
    data: Uint8ClampedArray
  } as any
}

// Mock createImageBitmap
if (typeof createImageBitmap === 'undefined') {
  global.createImageBitmap = vi.fn().mockImplementation((imageData) => {
    return Promise.resolve({
      width: imageData.width,
      height: imageData.height,
      close: vi.fn()
    })
  })
}

// Mock WebGL2 context
const mockGL = {
  TEXTURE_2D: 0x0DE1,
  TEXTURE0: 0x84C0,
  TRIANGLE_STRIP: 0x0005,
  RGBA: 0x1908,
  UNSIGNED_BYTE: 0x1401,
  COLOR_BUFFER_BIT: 0x00004000,
  createTexture: vi.fn().mockReturnValue({}),
  deleteTexture: vi.fn(),
  bindTexture: vi.fn(),
  activeTexture: vi.fn(),
  drawArrays: vi.fn(),
  texImage2D: vi.fn(),
  texParameteri: vi.fn(),
  viewport: vi.fn(),
  clear: vi.fn(),
  clearColor: vi.fn(),
  readPixels: vi.fn(),
}

describe("WebGL2PreviewRenderer", () => {
  let renderer: WebGL2PreviewRenderer
  let canvas: HTMLCanvasElement

  beforeEach(() => {
    canvas = document.createElement("canvas")
    canvas.width = 1920
    canvas.height = 1080
    
    // Mock getContext
    canvas.getContext = vi.fn().mockReturnValue(mockGL)
    
    renderer = new WebGL2PreviewRenderer({
      name: "test-renderer",
      canvas
    })
    
    // Set up gl property and mark as initialized
    ;(renderer as any).gl = mockGL
    ;(renderer as any).initialized = false
  })

  afterEach(() => {
    renderer.dispose()
    vi.clearAllMocks()
  })

  describe("initialization", () => {
    it("should initialize successfully", async () => {
      const result = await renderer.initialize()
      expect(result).toBe(true)
    })

    it("should get GPU capabilities", () => {
      const capabilities = renderer.getCapabilities()
      expect(capabilities).toBeDefined()
      expect(capabilities?.tier).toBe("medium")
    })
  })

  describe("video source", () => {
    it("should set video source", () => {
      const video = document.createElement("video")
      Object.defineProperty(video, "videoWidth", { value: 1920 })
      Object.defineProperty(video, "videoHeight", { value: 1080 })
      
      renderer.setVideoSource(video)
      expect((renderer as any).videoElement).toBe(video)
    })
  })

  describe("segments and time", () => {
    it("should set timeline segments", () => {
      const segments = [
        { id: "1", startTime: 0, endTime: 10, effects: [] }
      ]
      
      renderer.setSegments(segments as any)
      expect((renderer as any).segments).toEqual(segments)
    })

    it("should set current time", () => {
      renderer.setCurrentTime(5.5)
      expect((renderer as any).currentTime).toBe(5.5)
    })
  })

  describe("rendering", () => {
    it("should render frame", async () => {
      await renderer.initialize()
      
      // Устанавливаем initialized вручную для теста
      ;(renderer as any).initialized = true
      
      const video = document.createElement("video")
      Object.defineProperty(video, "videoWidth", { value: 1920 })
      Object.defineProperty(video, "videoHeight", { value: 1080 })
      
      // Создаем текстуру вручную
      const mockTexture = {}
      ;(renderer as any).sourceTexture = mockTexture
      
      renderer.setVideoSource(video)
      renderer.render(0)
      
      expect(mockGL.drawArrays).toHaveBeenCalled()
    })

    it("should capture frame", async () => {
      await renderer.initialize()
      
      // Override readPixels mock for this test
      mockGL.readPixels = vi.fn((x, y, w, h, format, type, data) => {
        // Fill with dummy data
        if (data && data.length) {
          for (let i = 0; i < data.length; i++) {
            data[i] = 255
          }
        }
      })
      
      const frame = await renderer.captureFrame()
      expect(frame).toBeDefined()
      expect(frame?.width).toBe(1920)
      expect(frame?.height).toBe(1080)
    })
  })

  describe("effects", () => {
    it("should apply effects based on current time", async () => {
      await renderer.initialize()
      
      const segments = [{
        id: "1",
        startTime: 0,
        endTime: 10,
        effects: [{
          id: "blur",
          type: "blur",
          enabled: true,
          intensity: 1,
          params: { radius: 5 }
        }]
      }]
      
      // Устанавливаем initialized вручную для теста
      ;(renderer as any).initialized = true
      
      renderer.setSegments(segments as any)
      renderer.setCurrentTime(5)
      
      const video = document.createElement("video")
      Object.defineProperty(video, "videoWidth", { value: 1920 })
      Object.defineProperty(video, "videoHeight", { value: 1080 })
      
      // Создаем текстуру вручную
      const mockTexture = {}
      ;(renderer as any).sourceTexture = mockTexture
      
      renderer.setVideoSource(video)
      renderer.render(0)
      
      // Should have rendered with blur effect
      expect(mockGL.drawArrays).toHaveBeenCalled()
    })

    it("should handle no effects", async () => {
      await renderer.initialize()
      
      // Устанавливаем initialized вручную для теста
      ;(renderer as any).initialized = true
      
      renderer.setSegments([])
      renderer.setCurrentTime(0)
      
      const video = document.createElement("video")
      Object.defineProperty(video, "videoWidth", { value: 1920 })
      Object.defineProperty(video, "videoHeight", { value: 1080 })
      
      // Создаем текстуру вручную
      const mockTexture = {}
      ;(renderer as any).sourceTexture = mockTexture
      
      renderer.setVideoSource(video)
      renderer.render(0)
      
      // Should render without effects (copy shader)
      expect(mockGL.drawArrays).toHaveBeenCalled()
    })
  })

  describe("cleanup", () => {
    it("should dispose resources", async () => {
      await renderer.initialize()
      
      const video = document.createElement("video")
      renderer.setVideoSource(video)
      
      renderer.dispose()
      
      // После dispose, gl должен быть null
      expect((renderer as any).gl).toBeNull()
    })
  })
})