import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"

import type { YoloDetection } from "@/features/recognition/types/yolo"

import { ONNXRuntimeService } from "../onnx-runtime-service"

// Mock onnxruntime-web
vi.mock("onnxruntime-web", () => ({
  InferenceSession: {
    create: vi.fn(),
  },
  Tensor: vi.fn((type, data, dims) => ({
    type,
    data,
    dims,
    size: data.length,
  })),
  env: {
    wasm: {
      wasmPaths: "",
      numThreads: 4,
      simd: true,
    },
  },
}))

// Mock OffscreenCanvas for browser environment
global.OffscreenCanvas = vi.fn(() => ({
  getContext: vi.fn(() => ({
    drawImage: vi.fn(),
    getImageData: vi.fn(() => ({
      data: new Uint8ClampedArray(640 * 640 * 4).fill(128), // mock pixel data
    })),
  })),
})) as any

// Mock createImageBitmap
global.createImageBitmap = vi.fn().mockResolvedValue({
  width: 640,
  height: 640,
})

// Mock ImageData for Node.js environment
global.ImageData = vi.fn((width: number, height: number) => ({
  width,
  height,
  data: new Uint8ClampedArray(width * height * 4).fill(128),
})) as any

// Mock navigator for hardwareConcurrency
Object.defineProperty(global.navigator, "hardwareConcurrency", {
  value: 8,
  writable: true,
})

describe("ONNXRuntimeService", () => {
  let service: ONNXRuntimeService

  beforeEach(() => {
    // Reset singleton instance
    ;(ONNXRuntimeService as any).instance = undefined
    service = ONNXRuntimeService.getInstance()
  })

  afterEach(async () => {
    await service.dispose()
  })

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = ONNXRuntimeService.getInstance()
      const instance2 = ONNXRuntimeService.getInstance()

      expect(instance1).toBe(instance2)
      expect(instance1).toBeInstanceOf(ONNXRuntimeService)
    })
  })

  describe("initialize", () => {
    it("should initialize service successfully", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

      await service.initialize()

      expect(consoleSpy).toHaveBeenCalledWith("ONNX Runtime Service initialized successfully")
      expect(service.getLoadedModels()).toHaveLength(3)
      expect(service.hasModel("yolov8n")).toBe(true)
      expect(service.hasModel("face-detection")).toBe(true)
      expect(service.hasModel("ocr-detection")).toBe(true)

      consoleSpy.mockRestore()
    })

    it("should not initialize twice", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

      await service.initialize()
      const firstCallCount = consoleSpy.mock.calls.length
      
      await service.initialize() // Second call

      // Should not add any new log calls
      expect(consoleSpy).toHaveBeenCalledTimes(firstCallCount)
      
      consoleSpy.mockRestore()
    })

    it("should handle initialization errors gracefully", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      
      // Create a new service instance that hasn't been initialized
      ;(ONNXRuntimeService as any).instance = undefined
      const newService = ONNXRuntimeService.getInstance()
      
      // Mock loadModel to throw error for all models
      vi.spyOn(newService as any, "loadModel").mockRejectedValue(new Error("Failed to load model"))

      await expect(newService.initialize()).rejects.toThrow("Failed to load model")
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })

  describe("YOLO inference", () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it("should run YOLO inference with ImageData", async () => {
      const imageData = new ImageData(640, 640)

      const detections = await service.runYOLOInference(imageData)

      expect(Array.isArray(detections)).toBe(true)
      expect(detections.length).toBeGreaterThan(0)
      
      // Check detection structure
      const detection = detections[0]
      expect(detection).toHaveProperty("class")
      expect(detection).toHaveProperty("confidence")
      expect(detection).toHaveProperty("bbox")
      expect(detection).toHaveProperty("trackId")
      expect(detection.confidence).toBeGreaterThanOrEqual(0.5)
      expect(detection.confidence).toBeLessThanOrEqual(1.0)
    })

    it("should run YOLO inference with Float32Array", async () => {
      const floatArray = new Float32Array(3 * 640 * 640).fill(0.5)

      const detections = await service.runYOLOInference(floatArray)

      expect(Array.isArray(detections)).toBe(true)
      expect(detections.length).toBeGreaterThan(0)
    })

    it("should throw error for unknown model", async () => {
      await expect(service.runYOLOInference(new ImageData(640, 640), "unknown-model"))
        .rejects.toThrow("Model unknown-model not loaded")
    })

    it("should validate YOLO detection properties", async () => {
      const detections = await service.runYOLOInference(new ImageData(640, 640))

      detections.forEach((detection: YoloDetection) => {
        expect(typeof detection.class).toBe("string")
        expect(typeof detection.confidence).toBe("number")
        expect(typeof detection.trackId).toBe("number")
        expect(detection.bbox).toHaveProperty("x")
        expect(detection.bbox).toHaveProperty("y")
        expect(detection.bbox).toHaveProperty("width")
        expect(detection.bbox).toHaveProperty("height")
        expect(detection.bbox.x).toBeGreaterThanOrEqual(0)
        expect(detection.bbox.y).toBeGreaterThanOrEqual(0)
        expect(detection.bbox.width).toBeGreaterThan(0)
        expect(detection.bbox.height).toBeGreaterThan(0)
      })
    })
  })

  describe("Face detection", () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it("should run face detection", async () => {
      const imageData = new ImageData(320, 320)

      const faces = await service.runFaceDetection(imageData)

      expect(Array.isArray(faces)).toBe(true)
      expect(faces.length).toBeGreaterThan(0)
      
      const face = faces[0]
      expect(face).toHaveProperty("bbox")
      expect(face).toHaveProperty("confidence")
      expect(face).toHaveProperty("landmarks")
      expect(face.confidence).toBeGreaterThan(0)
      expect(face.confidence).toBeLessThanOrEqual(1.0)
    })

    it("should include facial landmarks", async () => {
      const imageData = new ImageData(320, 320)

      const faces = await service.runFaceDetection(imageData)
      const face = faces[0]

      expect(face.landmarks).toBeDefined()
      expect(Array.isArray(face.landmarks)).toBe(true)
      expect(face.landmarks!.length).toBe(5) // 5 key points

      face.landmarks!.forEach(landmark => {
        expect(landmark).toHaveProperty("x")
        expect(landmark).toHaveProperty("y")
        expect(typeof landmark.x).toBe("number")
        expect(typeof landmark.y).toBe("number")
      })
    })

    it("should throw error when face model not loaded", async () => {
      await service.dispose()

      await expect(service.runFaceDetection(new ImageData(320, 320)))
        .rejects.toThrow("Face detection model not loaded")
    })
  })

  describe("OCR detection", () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it("should run OCR inference", async () => {
      const imageData = new ImageData(640, 640)

      const textDetections = await service.runOCRInference(imageData)

      expect(Array.isArray(textDetections)).toBe(true)
      expect(textDetections.length).toBeGreaterThan(0)
      
      const textDetection = textDetections[0]
      expect(textDetection).toHaveProperty("text")
      expect(textDetection).toHaveProperty("bbox")
      expect(textDetection).toHaveProperty("confidence")
      expect(textDetection).toHaveProperty("language")
      expect(typeof textDetection.text).toBe("string")
      expect(textDetection.text.length).toBeGreaterThan(0)
      expect(textDetection.language).toBe("en")
    })

    it("should validate OCR detection structure", async () => {
      const textDetections = await service.runOCRInference(new ImageData(640, 640))

      textDetections.forEach(detection => {
        expect(typeof detection.text).toBe("string")
        expect(typeof detection.confidence).toBe("number")
        expect(detection.confidence).toBeGreaterThan(0)
        expect(detection.confidence).toBeLessThanOrEqual(1.0)
        expect(detection.bbox).toHaveProperty("x")
        expect(detection.bbox).toHaveProperty("y")
        expect(detection.bbox).toHaveProperty("width")
        expect(detection.bbox).toHaveProperty("height")
      })
    })

    it("should throw error when OCR model not loaded", async () => {
      await service.dispose()

      await expect(service.runOCRInference(new ImageData(640, 640)))
        .rejects.toThrow("OCR model not loaded")
    })
  })

  describe("Model management", () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it("should check model availability", () => {
      expect(service.hasModel("yolov8n")).toBe(true)
      expect(service.hasModel("face-detection")).toBe(true)
      expect(service.hasModel("ocr-detection")).toBe(true)
      expect(service.hasModel("unknown-model")).toBe(false)
    })

    it("should return list of loaded models", () => {
      const models = service.getLoadedModels()

      expect(Array.isArray(models)).toBe(true)
      expect(models).toContain("yolov8n")
      expect(models).toContain("face-detection")
      expect(models).toContain("ocr-detection")
      expect(models.length).toBe(3)
    })

    it("should dispose all models", async () => {
      expect(service.getLoadedModels().length).toBe(3)

      await service.dispose()

      expect(service.getLoadedModels().length).toBe(0)
      expect(service.hasModel("yolov8n")).toBe(false)
    })

    it("should handle dispose errors gracefully", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      
      // Mock session with failing release method
      const mockSession = {
        session: {
          release: vi.fn().mockRejectedValue(new Error("Release failed")),
        },
        model: { name: "test" },
      }
      
      ;(service as any).sessions.set("test", mockSession)

      await service.dispose()

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to release session test:",
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })
  })

  describe("Image preprocessing", () => {
    beforeEach(async () => {
      await service.initialize()
    })

    it("should preprocess ImageData correctly", async () => {
      const imageData = new ImageData(100, 100)
      
      // Access private method through type assertion
      const preprocessImage = (service as any).preprocessImage.bind(service)
      const tensor = await preprocessImage(imageData, [640, 640])

      expect(tensor).toBeDefined()
      expect(tensor.type).toBe("float32")
      expect(tensor.dims).toEqual([1, 3, 640, 640])
    })

    it("should handle Float32Array input", async () => {
      const floatArray = new Float32Array(3 * 640 * 640)
      
      const preprocessImage = (service as any).preprocessImage.bind(service)
      const tensor = await preprocessImage(floatArray, [640, 640])

      expect(tensor).toBeDefined()
      expect(tensor.type).toBe("float32")
      expect(tensor.dims).toEqual([1, 3, 640, 640])
    })
  })

  describe("Mock result generation", () => {
    it("should generate mock YOLO results", () => {
      const generateMockResults = (service as any).generateMockResults.bind(service)
      const yoloModel = { type: "yolo", name: "test" }
      
      const results = generateMockResults(yoloModel)

      expect(results).toHaveProperty("output0")
      expect(results.output0.type).toBe("float32")
      expect(results.output0.dims).toEqual([1, 84, 8400])
    })

    it("should generate mock face detection results", () => {
      const generateMockResults = (service as any).generateMockResults.bind(service)
      const faceModel = { type: "face", name: "test" }
      
      const results = generateMockResults(faceModel)

      expect(results).toHaveProperty("output")
      expect(results.output.type).toBe("float32")
      expect(results.output.dims).toEqual([1, 100, 5])
    })

    it("should generate empty results for unknown model type", () => {
      const generateMockResults = (service as any).generateMockResults.bind(service)
      const unknownModel = { type: "unknown", name: "test" }
      
      const results = generateMockResults(unknownModel)

      expect(results).toEqual({})
    })

    it("should generate random YOLO detections", () => {
      const generateMockYOLODetections = (service as any).generateMockYOLODetections.bind(service)
      
      const detections1 = generateMockYOLODetections()
      const detections2 = generateMockYOLODetections()

      expect(Array.isArray(detections1)).toBe(true)
      expect(Array.isArray(detections2)).toBe(true)
      expect(detections1.length).toBeGreaterThan(0)
      expect(detections1.length).toBeLessThanOrEqual(6)
      
      // Results should be different (random)
      expect(detections1).not.toEqual(detections2)
    })
  })

  describe("Error handling", () => {
    it("should handle inference errors", async () => {
      await service.initialize()
      
      // Mock session to throw error
      const mockSession = {
        session: {
          run: vi.fn().mockRejectedValue(new Error("Inference failed")),
        },
        model: { inputSize: [640, 640] },
      }
      
      ;(service as any).sessions.set("yolov8n", mockSession)

      await expect(service.runYOLOInference(new ImageData(640, 640)))
        .rejects.toThrow("Inference failed")
    })

    it("should continue loading other models if one fails", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      
      // Mock createMockSession to fail for first model
      const originalCreateMockSession = (service as any).createMockSession
      vi.spyOn(service as any, "createMockSession")
        .mockRejectedValueOnce(new Error("Failed to load first model"))
        .mockImplementation(originalCreateMockSession)

      await service.initialize()

      // Should have loaded 2 out of 3 models
      expect(service.getLoadedModels().length).toBe(2)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Failed to load model yolov8n:",
        expect.any(Error)
      )

      consoleErrorSpy.mockRestore()
    })
  })
})