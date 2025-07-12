import { vi } from "vitest"

/**
 * Canvas API Mocks for Testing
 *
 * Provides comprehensive mocking of HTML5 Canvas API for JSDOM test environment.
 * Handles all Canvas-related functionality used throughout the application.
 */

// Canvas 2D Rendering Context Mock
export const mockCanvasContext2D = {
  // Drawing state
  fillStyle: "#000000",
  strokeStyle: "#000000",
  lineWidth: 1,
  lineCap: "butt" as CanvasLineCap,
  lineJoin: "miter" as CanvasLineJoin,
  miterLimit: 10,
  lineDashOffset: 0,
  font: "10px sans-serif",
  textAlign: "start" as CanvasTextAlign,
  textBaseline: "alphabetic" as CanvasTextBaseline,
  direction: "inherit" as CanvasDirection,
  globalAlpha: 1,
  globalCompositeOperation: "source-over" as GlobalCompositeOperation,
  imageSmoothingEnabled: true,
  imageSmoothingQuality: "low" as ImageSmoothingQuality,
  shadowBlur: 0,
  shadowColor: "rgba(0, 0, 0, 0)",
  shadowOffsetX: 0,
  shadowOffsetY: 0,

  // Path methods
  beginPath: vi.fn(),
  closePath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  bezierCurveTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  arc: vi.fn(),
  arcTo: vi.fn(),
  ellipse: vi.fn(),
  rect: vi.fn(),

  // Drawing methods
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
  clip: vi.fn(),

  // Text methods
  fillText: vi.fn(),
  strokeText: vi.fn(),
  measureText: vi.fn().mockReturnValue({
    width: 100,
    actualBoundingBoxLeft: 0,
    actualBoundingBoxRight: 100,
    actualBoundingBoxAscent: 10,
    actualBoundingBoxDescent: 5,
    fontBoundingBoxAscent: 12,
    fontBoundingBoxDescent: 3,
    emHeightAscent: 10,
    emHeightDescent: 3,
    hangingBaseline: 8,
    alphabeticBaseline: 0,
    ideographicBaseline: -3,
  }),

  // Image methods
  drawImage: vi.fn(),
  createImageData: vi.fn().mockImplementation((width: number, height: number) => ({
    width,
    height,
    data: new Uint8ClampedArray(width * height * 4),
  })),
  getImageData: vi.fn().mockImplementation((_x: number, _y: number, width: number, height: number) => ({
    width,
    height,
    data: new Uint8ClampedArray(width * height * 4),
    colorSpace: "srgb" as PredefinedColorSpace,
  })),
  putImageData: vi.fn(),

  // Gradient and pattern methods
  createLinearGradient: vi.fn().mockReturnValue({
    addColorStop: vi.fn(),
  }),
  createRadialGradient: vi.fn().mockReturnValue({
    addColorStop: vi.fn(),
  }),
  createConicGradient: vi.fn().mockReturnValue({
    addColorStop: vi.fn(),
  }),
  createPattern: vi.fn().mockReturnValue({}),

  // Transform methods
  scale: vi.fn(),
  rotate: vi.fn(),
  translate: vi.fn(),
  transform: vi.fn(),
  setTransform: vi.fn(),
  resetTransform: vi.fn(),

  // State methods
  save: vi.fn(),
  restore: vi.fn(),

  // Path2D support
  isPointInPath: vi.fn().mockReturnValue(false),
  isPointInStroke: vi.fn().mockReturnValue(false),

  // Canvas dimensions (read-only, set via canvas element)
  canvas: null as HTMLCanvasElement | null,

  // Additional methods for testing
  getLineDash: vi.fn().mockReturnValue([]),
  setLineDash: vi.fn(),
}

// WebGL Rendering Context Mock (basic)
export const mockWebGLContext = {
  // Основные методы WebGL для тестирования
  createShader: vi.fn(),
  createProgram: vi.fn(),
  useProgram: vi.fn(),
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  clear: vi.fn(),
  clearColor: vi.fn(),
  viewport: vi.fn(),
  enable: vi.fn(),
  disable: vi.fn(),
  getExtension: vi.fn().mockReturnValue(null),
  getSupportedExtensions: vi.fn().mockReturnValue([]),
}

// Canvas Element Mock
export const mockCanvas = {
  width: 300,
  height: 150,
  getContext: vi.fn().mockImplementation((contextType: string) => {
    switch (contextType) {
      case "2d":
        return { ...mockCanvasContext2D, canvas: mockCanvas }
      case "webgl":
      case "experimental-webgl":
        return mockWebGLContext
      case "webgl2":
        return mockWebGLContext
      default:
        return null
    }
  }),
  toDataURL: vi
    .fn()
    .mockReturnValue(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    ),
  toBlob: vi.fn().mockImplementation((callback: BlobCallback) => {
    const blob = new Blob(["mock-canvas-data"], { type: "image/png" })
    callback(blob)
  }),
  captureStream: vi.fn().mockReturnValue({
    getTracks: vi.fn().mockReturnValue([]),
    getVideoTracks: vi.fn().mockReturnValue([]),
    getAudioTracks: vi.fn().mockReturnValue([]),
  }),
}

/**
 * Setup Canvas API mocks
 * Configures global HTMLCanvasElement prototype to use our mocks
 */
export function setupCanvasMocks() {
  // Mock HTMLCanvasElement.prototype.getContext
  HTMLCanvasElement.prototype.getContext = vi.fn().mockImplementation(function (
    this: HTMLCanvasElement,
    contextType: string,
  ) {
    switch (contextType) {
      case "2d":
        return { ...mockCanvasContext2D, canvas: this }
      case "webgl":
      case "experimental-webgl":
        return mockWebGLContext
      case "webgl2":
        return mockWebGLContext
      default:
        return null
    }
  })

  // Mock other Canvas methods
  HTMLCanvasElement.prototype.toDataURL = vi
    .fn()
    .mockReturnValue(
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
    )

  HTMLCanvasElement.prototype.toBlob = vi.fn().mockImplementation((callback: BlobCallback) => {
    const blob = new Blob(["mock-canvas-data"], { type: "image/png" })
    callback(blob)
  })

  if (HTMLCanvasElement.prototype.captureStream) {
    HTMLCanvasElement.prototype.captureStream = vi.fn().mockReturnValue({
      getTracks: vi.fn().mockReturnValue([]),
      getVideoTracks: vi.fn().mockReturnValue([]),
      getAudioTracks: vi.fn().mockReturnValue([]),
    })
  }

  // Don't mock document.createElement as it breaks React components
  // Canvas elements will be mocked via HTMLCanvasElement.prototype methods above
}

/**
 * Reset Canvas mocks
 * Clears all mock call history
 */
export function resetCanvasMocks() {
  vi.clearAllMocks()
  setupCanvasMocks()
}

/**
 * Helper functions for testing Canvas operations
 */
export const canvasTestHelpers = {
  /**
   * Simulate canvas drawing and return mock ImageData
   */
  createMockImageData: (width = 100, height = 100): ImageData => ({
    width,
    height,
    data: new Uint8ClampedArray(width * height * 4),
    colorSpace: "srgb" as PredefinedColorSpace,
  }),

  /**
   * Create a mock canvas element for testing
   */
  createMockCanvas: (width = 300, height = 150): HTMLCanvasElement => {
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    return canvas
  },

  /**
   * Verify that canvas operations were called
   */
  expectCanvasOperations: (canvas: HTMLCanvasElement, operations: string[]) => {
    const ctx = canvas.getContext("2d") as any
    operations.forEach((op) => {
      expect(ctx[op]).toHaveBeenCalled()
    })
  },

  /**
   * Get call count for specific canvas method
   */
  getCanvasCallCount: (canvas: HTMLCanvasElement, method: string): number => {
    const ctx = canvas.getContext("2d") as any
    return ctx[method]?.mock?.calls?.length || 0
  },
}

// Auto-setup when imported
setupCanvasMocks()
