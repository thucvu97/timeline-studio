import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { BoundingBox, ObjectDetection } from "../../../../shared/types/content-analysis"
import { ONNXRuntimeService } from "../onnx-runtime-service"
import { VisionService } from "../vision-service"

// Mock ONNXRuntimeService
vi.mock("../onnx-runtime-service")

// Mock Image constructor
global.Image = class Image {
  public width = 640
  public height = 480
  public src = ""
  public onload: (() => void) | null = null

  constructor() {
    setTimeout(() => {
      if (this.onload) this.onload()
    }, 0)
  }
} as any

// Mock document.createElement for canvas
global.document = {
  createElement: vi.fn((tagName: string) => {
    if (tagName === "canvas") {
      return {
        width: 0,
        height: 0,
        getContext: vi.fn(() => ({
          drawImage: vi.fn(),
          getImageData: vi.fn((_x: number, _y: number, width: number, height: number) =>
            createMockImageData(width, height),
          ),
          putImageData: vi.fn(),
          filter: "",
          imageSmoothingEnabled: true,
        })),
      }
    }
    return {}
  }),
} as any

// Create mock ImageData
const createMockImageData = (width: number, height: number): ImageData => {
  const data = new Uint8ClampedArray(width * height * 4)
  // Fill with some pattern for testing
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 128 + Math.floor(Math.random() * 128) // R
    data[i + 1] = 128 + Math.floor(Math.random() * 128) // G
    data[i + 2] = 128 + Math.floor(Math.random() * 128) // B
    data[i + 3] = 255 // A
  }
  return { data, width, height } as ImageData
}

// Create mock YOLO detection
const createMockYOLODetection = () => ({
  class: "person",
  confidence: 0.95,
  bbox: { x: 0.1, y: 0.1, width: 0.2, height: 0.3 },
  trackId: 1,
})

// Create mock face detection
const createMockFaceDetection = () => ({
  confidence: 0.9,
  bbox: { x: 0.15, y: 0.15, width: 0.1, height: 0.15 },
  landmarks: [
    { x: 0.17, y: 0.18 }, // left eye
    { x: 0.23, y: 0.18 }, // right eye
    { x: 0.2, y: 0.22 }, // nose
    { x: 0.17, y: 0.25 }, // mouth left
    { x: 0.23, y: 0.25 }, // mouth right
  ],
})

// Create mock OCR result
const createMockOCRResult = () => ({
  text: "Hello World",
  confidence: 0.85,
  bbox: { x: 0.3, y: 0.3, width: 0.4, height: 0.1 },
  language: "en",
})

describe("VisionService", () => {
  let service: VisionService
  let mockONNXService: any

  beforeEach(() => {
    // Reset singleton
    ;(VisionService as any).instance = undefined

    // Mock ONNX Runtime Service
    mockONNXService = {
      getInstance: vi.fn(),
      initialize: vi.fn().mockResolvedValue(undefined),
      hasModel: vi.fn().mockReturnValue(true),
      runYOLOInference: vi.fn().mockResolvedValue([createMockYOLODetection()]),
      runFaceDetection: vi.fn().mockResolvedValue([createMockFaceDetection()]),
      runOCRInference: vi.fn().mockResolvedValue([createMockOCRResult()]),
    }
    vi.mocked(ONNXRuntimeService.getInstance).mockReturnValue(mockONNXService)

    // Create service instance
    service = VisionService.getInstance()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = VisionService.getInstance()
      const instance2 = VisionService.getInstance()
      expect(instance1).toBe(instance2)
    })

    it("should accept configuration", () => {
      const config = {
        enableObjectDetection: false,
        enableFaceDetection: false,
        objectConfidenceThreshold: 0.7,
      }
      const instance = VisionService.getInstance(config)
      expect(instance).toBeDefined()
    })
  })

  describe("initialize", () => {
    it("should initialize successfully", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

      await service.initialize()

      expect(mockONNXService.initialize).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith("Vision Service initialized with ONNX Runtime")

      consoleSpy.mockRestore()
    })

    it("should warn when models are not available", async () => {
      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
      mockONNXService.hasModel.mockReturnValue(false)

      await service.initialize()

      expect(consoleWarnSpy).toHaveBeenCalledWith("YOLO model not available, object detection will use mock data")
      expect(consoleWarnSpy).toHaveBeenCalledWith("Face detection model not available, will use mock data")

      consoleWarnSpy.mockRestore()
    })

    it("should handle initialization errors", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      const error = new Error("Init failed")
      mockONNXService.initialize.mockRejectedValueOnce(error)

      await expect(service.initialize()).rejects.toThrow("Init failed")
      expect(consoleErrorSpy).toHaveBeenCalledWith("Failed to initialize vision models:", error)

      consoleErrorSpy.mockRestore()
    })

    it("should not reinitialize if already initialized", async () => {
      await service.initialize()
      mockONNXService.initialize.mockClear()

      await service.initialize()

      expect(mockONNXService.initialize).not.toHaveBeenCalled()
    })
  })

  describe("analyzeFrame", () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it("should analyze frame with all features enabled", async () => {
      // Create service with text recognition enabled
      ;(VisionService as any).instance = undefined
      const customService = VisionService.getInstance({
        enableObjectDetection: true,
        enableFaceDetection: true,
        enableTextRecognition: true,
        enableActivityDetection: true,
      })
      await customService.initialize()

      const frameData = createMockImageData(640, 480)

      const result = await customService.analyzeFrame(frameData, 0)

      expect(result).toBeDefined()
      expect(result.objects).toHaveLength(1)
      expect(result.faces).toHaveLength(1)
      expect(result.text).toHaveLength(1)
      expect(result.composition).toBeDefined()
    })

    it("should handle string input (URL)", async () => {
      const result = await service.analyzeFrame("http://example.com/image.jpg", 0)

      expect(result).toBeDefined()
      expect(result.objects).toHaveLength(1)
    })

    it("should initialize if not ready", async () => {
      // Reset initialization
      ;(service as any).isInitialized = false
      mockONNXService.initialize.mockClear()

      await service.analyzeFrame(createMockImageData(640, 480), 0)

      expect(mockONNXService.initialize).toHaveBeenCalled()
    })

    it("should skip disabled features", async () => {
      // Reset singleton before creating custom instance
      ;(VisionService as any).instance = undefined

      const customService = VisionService.getInstance({
        enableObjectDetection: false,
        enableFaceDetection: false,
        enableTextRecognition: false,
      })
      await customService.initialize()

      // Clear previous calls
      mockONNXService.runYOLOInference.mockClear()
      mockONNXService.runFaceDetection.mockClear()
      mockONNXService.runOCRInference.mockClear()

      const result = await customService.analyzeFrame(createMockImageData(640, 480), 0)

      expect(mockONNXService.runYOLOInference).not.toHaveBeenCalled()
      expect(mockONNXService.runFaceDetection).not.toHaveBeenCalled()
      expect(mockONNXService.runOCRInference).not.toHaveBeenCalled()
      expect(result.objects).toHaveLength(0)
      expect(result.faces).toHaveLength(0)
      expect(result.text).toHaveLength(0)
    })
  })

  describe("detectObjects", () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it("should detect objects from ImageData", async () => {
      const frameData = createMockImageData(640, 480)

      const objects = await service.detectObjects(frameData, 0)

      expect(objects).toHaveLength(1)
      expect(objects[0]).toMatchObject({
        id: "obj-0-0",
        label: "person",
        confidence: 0.95,
        boundingBox: {
          x: 64, // 0.1 * 640
          y: 48, // 0.1 * 480
          width: 128, // 0.2 * 640
          height: 144, // 0.3 * 480
        },
        trackId: 1,
      })
    })

    it("should filter objects by confidence threshold", async () => {
      mockONNXService.runYOLOInference.mockResolvedValueOnce([
        { ...createMockYOLODetection(), confidence: 0.3 },
        { ...createMockYOLODetection(), confidence: 0.7 },
      ])

      const objects = await service.detectObjects(createMockImageData(640, 480), 0)

      expect(objects).toHaveLength(1)
      expect(objects[0].confidence).toBe(0.7)
    })

    it("should handle detection errors", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      mockONNXService.runYOLOInference.mockRejectedValueOnce(new Error("Detection failed"))

      const objects = await service.detectObjects(createMockImageData(640, 480), 0)

      expect(objects).toHaveLength(0)
      expect(consoleErrorSpy).toHaveBeenCalledWith("Object detection failed:", expect.any(Error))

      consoleErrorSpy.mockRestore()
    })

    it("should handle string input", async () => {
      const objects = await service.detectObjects("http://example.com/image.jpg", 0)

      expect(objects).toHaveLength(1)
      expect(mockONNXService.runYOLOInference).toHaveBeenCalled()
    })
  })

  describe("detectFaces", () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it("should detect faces with landmarks", async () => {
      const frameData = createMockImageData(640, 480)

      const faces = await service.detectFaces(frameData, 0)

      expect(faces).toHaveLength(1)
      expect(faces[0]).toMatchObject({
        id: "face-0-0",
        confidence: 0.9,
        boundingBox: {
          x: 96, // 0.15 * 640
          y: 72, // 0.15 * 480
          width: 64, // 0.1 * 640
          height: 72, // 0.15 * 480
        },
      })
      expect(faces[0].landmarks).toBeDefined()
      expect(faces[0].landmarks?.leftEye).toBeDefined()
      expect(faces[0].landmarks?.rightEye).toBeDefined()
      expect(faces[0].landmarks?.nose).toBeDefined()
      expect(faces[0].landmarks?.mouth).toBeDefined()
    })

    it("should filter faces by confidence threshold", async () => {
      // Reset singleton before creating custom instance
      ;(VisionService as any).instance = undefined

      const customService = VisionService.getInstance({
        faceConfidenceThreshold: 0.95,
      })
      await customService.initialize()

      mockONNXService.runFaceDetection.mockResolvedValueOnce([
        { ...createMockFaceDetection(), confidence: 0.8 },
        { ...createMockFaceDetection(), confidence: 0.97 },
      ])

      const faces = await customService.detectFaces(createMockImageData(640, 480), 0)

      expect(faces).toHaveLength(1)
      expect(faces[0].confidence).toBe(0.97)
    })

    it("should handle faces without landmarks", async () => {
      mockONNXService.runFaceDetection.mockResolvedValueOnce([{ ...createMockFaceDetection(), landmarks: undefined }])

      const faces = await service.detectFaces(createMockImageData(640, 480), 0)

      expect(faces).toHaveLength(1)
      expect(faces[0].landmarks).toBeUndefined()
    })

    it("should handle detection errors", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      mockONNXService.runFaceDetection.mockRejectedValueOnce(new Error("Face detection failed"))

      const faces = await service.detectFaces(createMockImageData(640, 480), 0)

      expect(faces).toHaveLength(0)
      expect(consoleErrorSpy).toHaveBeenCalledWith("Face detection failed:", expect.any(Error))

      consoleErrorSpy.mockRestore()
    })
  })

  describe("recognizeText", () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it("should recognize text using ONNX OCR", async () => {
      const frameData = createMockImageData(640, 480)

      const textDetections = await service.recognizeText(frameData)

      expect(textDetections).toHaveLength(1)
      expect(textDetections[0]).toMatchObject({
        text: "Hello World",
        confidence: 0.85,
        boundingBox: {
          x: 192, // 0.3 * 640
          y: 144, // 0.3 * 480
          width: 256, // 0.4 * 640
          height: 48, // 0.1 * 480
        },
        language: "en",
      })
    })

    it("should fallback to pattern matching when ONNX OCR not available", async () => {
      mockONNXService.hasModel.mockImplementation((model) => model !== "ocr-detection")

      const textDetections = await service.recognizeText(createMockImageData(640, 480))

      // Pattern matching will return different results based on detected patterns
      expect(textDetections).toBeDefined()
      expect(Array.isArray(textDetections)).toBe(true)
    })

    it("should filter text by confidence threshold", async () => {
      // Reset singleton before creating custom instance
      ;(VisionService as any).instance = undefined

      const customService = VisionService.getInstance({
        textConfidenceThreshold: 0.9,
      })
      await customService.initialize()

      mockONNXService.runOCRInference.mockResolvedValueOnce([
        { ...createMockOCRResult(), confidence: 0.8 },
        { ...createMockOCRResult(), confidence: 0.95, text: "High Confidence" },
      ])

      const textDetections = await customService.recognizeText(createMockImageData(640, 480))

      expect(textDetections).toHaveLength(1)
      expect(textDetections[0].text).toBe("High Confidence")
    })

    it("should handle OCR errors", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      mockONNXService.runOCRInference.mockRejectedValueOnce(new Error("OCR failed"))

      const textDetections = await service.recognizeText(createMockImageData(640, 480))

      expect(textDetections).toHaveLength(0)
      expect(consoleErrorSpy).toHaveBeenCalledWith("ONNX OCR failed:", expect.any(Error))

      consoleErrorSpy.mockRestore()
    })
  })

  describe("detectActivity", () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it("should detect high motion activity", async () => {
      const frames = [createMockImageData(640, 480), createMockImageData(640, 480), createMockImageData(640, 480)]

      // Mock high motion between frames
      vi.spyOn(service as any, "calculateMotionIntensity").mockResolvedValue(0.8)

      const activities = await service.detectActivity(frames, 0, 2)

      expect(activities).toContainEqual(
        expect.objectContaining({
          activity: "high_motion",
          confidence: 0.9,
        }),
      )
      expect(activities).toContainEqual(
        expect.objectContaining({
          activity: "fast_action",
        }),
      )
    })

    it("should detect moderate motion activity", async () => {
      const frames = [createMockImageData(640, 480), createMockImageData(640, 480)]

      vi.spyOn(service as any, "calculateMotionIntensity").mockResolvedValue(0.5)

      const activities = await service.detectActivity(frames, 0, 1)

      expect(activities).toContainEqual(
        expect.objectContaining({
          activity: "moderate_motion",
          confidence: 0.8,
        }),
      )
      expect(activities).toContainEqual(
        expect.objectContaining({
          activity: "walking",
        }),
      )
    })

    it("should detect static activity", async () => {
      const frames = [createMockImageData(640, 480), createMockImageData(640, 480)]

      vi.spyOn(service as any, "calculateMotionIntensity").mockResolvedValue(0.05)

      const activities = await service.detectActivity(frames, 0, 1)

      expect(activities).toContainEqual(
        expect.objectContaining({
          activity: "static",
          confidence: 0.9,
        }),
      )
    })

    it("should handle empty frames", async () => {
      const activities = await service.detectActivity([], 0, 0)
      expect(activities).toHaveLength(0)
    })

    it("should handle activity detection errors", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      vi.spyOn(service as any, "calculateMotionIntensity").mockRejectedValue(new Error("Motion calc failed"))

      const activities = await service.detectActivity([createMockImageData(640, 480)], 0, 0)

      expect(activities).toHaveLength(0)
      expect(consoleErrorSpy).toHaveBeenCalledWith("Activity detection failed:", expect.any(Error))

      consoleErrorSpy.mockRestore()
    })
  })

  describe("analyzeComposition", () => {
    it("should analyze composition metrics", () => {
      const frameData = createMockImageData(640, 480)

      const composition = service.analyzeComposition(frameData)

      expect(composition).toBeDefined()
      expect(composition.ruleOfThirds).toBeGreaterThanOrEqual(0)
      expect(composition.ruleOfThirds).toBeLessThanOrEqual(1)
      expect(composition.balance).toBeGreaterThanOrEqual(0)
      expect(composition.balance).toBeLessThanOrEqual(1)
      expect(composition.leadingLines).toBeDefined()
      expect(composition.depth).toBeGreaterThanOrEqual(0)
      expect(composition.depth).toBeLessThanOrEqual(1)
      expect(composition.colorHarmony).toBeGreaterThanOrEqual(0)
      expect(composition.colorHarmony).toBeLessThanOrEqual(1)
    })

    it("should handle string input", () => {
      const composition = service.analyzeComposition("http://example.com/image.jpg")

      // Should return default values for URL
      expect(composition.ruleOfThirds).toBe(0.7)
      expect(composition.balance).toBe(0.8)
      expect(composition.leadingLines).toBe(false)
      expect(composition.depth).toBe(0.6)
      expect(composition.colorHarmony).toBe(0.7)
    })
  })

  describe("trackObjects", () => {
    it("should match objects between frames", async () => {
      const prevDetections: ObjectDetection[] = [
        {
          id: "obj1",
          label: "person",
          confidence: 0.9,
          boundingBox: { x: 100, y: 100, width: 50, height: 100 },
          frameNumbers: [0],
        },
        {
          id: "obj2",
          label: "car",
          confidence: 0.85,
          boundingBox: { x: 300, y: 200, width: 100, height: 50 },
          frameNumbers: [0],
        },
      ]

      const currDetections: ObjectDetection[] = [
        {
          id: "obj3",
          label: "person",
          confidence: 0.88,
          boundingBox: { x: 105, y: 102, width: 52, height: 98 }, // Slightly moved
          frameNumbers: [1],
        },
        {
          id: "obj4",
          label: "car",
          confidence: 0.87,
          boundingBox: { x: 310, y: 205, width: 100, height: 50 }, // Slightly moved
          frameNumbers: [1],
        },
      ]

      const matches = await service.trackObjects(prevDetections, currDetections)

      expect(matches.size).toBe(2)
      expect(matches.get("obj1")).toBe("obj3")
      expect(matches.get("obj2")).toBe("obj4")
    })

    it("should not match objects with different labels", async () => {
      const prevDetections: ObjectDetection[] = [
        {
          id: "obj1",
          label: "person",
          confidence: 0.9,
          boundingBox: { x: 100, y: 100, width: 50, height: 100 },
          frameNumbers: [0],
        },
      ]

      const currDetections: ObjectDetection[] = [
        {
          id: "obj2",
          label: "car",
          confidence: 0.88,
          boundingBox: { x: 100, y: 100, width: 50, height: 100 }, // Same position but different label
          frameNumbers: [1],
        },
      ]

      const matches = await service.trackObjects(prevDetections, currDetections)

      expect(matches.size).toBe(0)
    })

    it("should not match objects with low IoU", async () => {
      const prevDetections: ObjectDetection[] = [
        {
          id: "obj1",
          label: "person",
          confidence: 0.9,
          boundingBox: { x: 0, y: 0, width: 50, height: 50 },
          frameNumbers: [0],
        },
      ]

      const currDetections: ObjectDetection[] = [
        {
          id: "obj2",
          label: "person",
          confidence: 0.88,
          boundingBox: { x: 200, y: 200, width: 50, height: 50 }, // Far away
          frameNumbers: [1],
        },
      ]

      const matches = await service.trackObjects(prevDetections, currDetections)

      expect(matches.size).toBe(0)
    })
  })

  describe("calculateVisualComplexity", () => {
    it("should calculate complexity based on detections", () => {
      const frameAnalysis: FrameAnalysisResult = {
        objects: [
          { id: "1", label: "person", confidence: 0.9, boundingBox: {} as BoundingBox, frameNumbers: [0] },
          { id: "2", label: "car", confidence: 0.8, boundingBox: {} as BoundingBox, frameNumbers: [0] },
        ],
        faces: [{ id: "f1", confidence: 0.9, boundingBox: {} as BoundingBox }],
        text: [{ text: "Hello", confidence: 0.85, boundingBox: {} as BoundingBox, language: "en" }],
        activities: [],
        composition: {
          ruleOfThirds: 0.8,
          balance: 0.7,
          leadingLines: true,
          depth: 0.6,
          colorHarmony: 0.75,
        },
      }

      const complexity = service.calculateVisualComplexity(frameAnalysis)

      expect(complexity).toBeGreaterThan(0)
      expect(complexity).toBeLessThanOrEqual(1)
    })

    it("should handle empty detections", () => {
      const frameAnalysis: FrameAnalysisResult = {
        objects: [],
        faces: [],
        text: [],
        activities: [],
        composition: {
          ruleOfThirds: 1,
          balance: 1,
          leadingLines: false,
          depth: 1,
          colorHarmony: 1,
        },
      }

      const complexity = service.calculateVisualComplexity(frameAnalysis)

      expect(complexity).toBe(0)
    })
  })

  describe("extractDominantColors", () => {
    it("should extract dominant colors from ImageData", () => {
      const frameData = createMockImageData(100, 100)

      const colors = service.extractDominantColors(frameData)

      expect(colors).toBeDefined()
      expect(Array.isArray(colors)).toBe(true)
      if (colors.length > 0) {
        expect(colors[0]).toMatch(/^#[0-9A-F]{6}$/i)
      }
    })

    it("should handle Uint8Array input", () => {
      const data = new Uint8Array(100 * 100 * 4)
      // Fill with red color
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 // R
        data[i + 1] = 0 // G
        data[i + 2] = 0 // B
        data[i + 3] = 255 // A
      }

      const colors = service.extractDominantColors(data)

      expect(colors).toBeDefined()
      expect(Array.isArray(colors)).toBe(true)
    })
  })

  describe("Edge Cases", () => {
    it("should handle very small images", async () => {
      await service.initialize()
      const smallImage = createMockImageData(10, 10)

      const result = await service.analyzeFrame(smallImage, 0)

      expect(result).toBeDefined()
      expect(result.composition).toBeDefined()
    })

    it("should handle large frame numbers", async () => {
      await service.initialize()
      const frameData = createMockImageData(640, 480)

      const objects = await service.detectObjects(frameData, 999999)

      expect(objects).toBeDefined()
      expect(objects[0]?.id).toContain("999999")
    })

    it("should handle concurrent analysis", async () => {
      await service.initialize()
      const frameData = createMockImageData(640, 480)

      const promises = Array.from({ length: 5 }, (_, i) => service.analyzeFrame(frameData, i))

      const results = await Promise.all(promises)

      expect(results).toHaveLength(5)
      results.forEach((result) => {
        expect(result).toBeDefined()
        expect(result.objects).toBeDefined()
      })
    })
  })
})
