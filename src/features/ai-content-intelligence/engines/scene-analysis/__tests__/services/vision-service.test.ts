/**
 * Tests for Vision Service and YOLO Integration
 */

import { beforeEach, describe, expect, it, vi } from "vitest"

import { VisionService } from "../../services/vision-service"

// Mock ImageData for Node.js environment
global.ImageData = class ImageData {
  data: Uint8ClampedArray
  width: number
  height: number

  constructor(widthOrData: number | Uint8ClampedArray, height?: number) {
    if (typeof widthOrData === "number") {
      this.width = widthOrData
      this.height = height || widthOrData
      this.data = new Uint8ClampedArray(this.width * this.height * 4)
    } else {
      this.data = widthOrData
      this.width = height || 0
      this.height = 0
    }
  }
} as any

// Mock ONNX Runtime Service
const mockRunYOLOInference = vi.fn().mockResolvedValue([
  {
    class: "person",
    confidence: 0.85,
    bbox: { x: 0.2, y: 0.3, width: 0.2, height: 0.4 },
    trackId: 1,
  },
  {
    class: "car",
    confidence: 0.92,
    bbox: { x: 0.6, y: 0.5, width: 0.3, height: 0.2 },
    trackId: 2,
  },
])

const mockRunFaceDetection = vi.fn().mockResolvedValue([
  {
    confidence: 0.88,
    bbox: { x: 0.25, y: 0.35, width: 0.1, height: 0.15 },
    landmarks: [
      { x: 0.28, y: 0.38 }, // левый глаз
      { x: 0.32, y: 0.38 }, // правый глаз
      { x: 0.3, y: 0.42 }, // нос
      { x: 0.28, y: 0.45 }, // левый угол рта
      { x: 0.32, y: 0.45 }, // правый угол рта
    ],
  },
])

vi.mock("../../services/onnx-runtime-service", () => ({
  ONNXRuntimeService: {
    getInstance: () => ({
      initialize: vi.fn().mockResolvedValue(undefined),
      hasModel: vi.fn().mockReturnValue(true),
      runYOLOInference: mockRunYOLOInference,
      runFaceDetection: mockRunFaceDetection,
    }),
  },
}))

describe("VisionService", () => {
  let service: VisionService

  beforeEach(() => {
    // Очищаем моки
    vi.clearAllMocks()

    // Сбрасываем значения мока к дефолтным
    mockRunYOLOInference.mockResolvedValue([
      {
        class: "person",
        confidence: 0.85,
        bbox: { x: 0.2, y: 0.3, width: 0.2, height: 0.4 },
        trackId: 1,
      },
      {
        class: "car",
        confidence: 0.92,
        bbox: { x: 0.6, y: 0.5, width: 0.3, height: 0.2 },
        trackId: 2,
      },
    ])

    mockRunFaceDetection.mockResolvedValue([
      {
        confidence: 0.88,
        bbox: { x: 0.25, y: 0.35, width: 0.1, height: 0.15 },
        landmarks: [
          { x: 0.28, y: 0.38 }, // левый глаз
          { x: 0.32, y: 0.38 }, // правый глаз
          { x: 0.3, y: 0.42 }, // нос
          { x: 0.28, y: 0.45 }, // левый угол рта
          { x: 0.32, y: 0.45 }, // правый угол рта
        ],
      },
    ])

    // Сбрасываем singleton VisionService
    ;(VisionService as any).instance = null

    service = VisionService.getInstance({
      enableObjectDetection: true,
      enableFaceDetection: true,
      enableTextRecognition: false,
      enableActivityDetection: false,
      objectConfidenceThreshold: 0.5,
      faceConfidenceThreshold: 0.6,
      textConfidenceThreshold: 0.7,
      maxDetectionsPerFrame: 100,
    })
  })

  describe("initialization", () => {
    it("должен инициализироваться с поддержкой YOLO/ONNX", async () => {
      await service.initialize()
      expect(service).toBeDefined()
    })

    it("должен принимать пользовательскую конфигурацию", () => {
      const customService = VisionService.getInstance({
        enableObjectDetection: false,
        enableFaceDetection: true,
        objectConfidenceThreshold: 0.8,
      })

      expect(customService).toBeDefined()
    })
  })

  describe("object detection with YOLO", () => {
    it("должен детектировать объекты через YOLO", async () => {
      // Создаем mock ImageData
      const mockImageData = new ImageData(640, 640)

      const detections = await service.detectObjects(mockImageData, 1)

      expect(detections).toBeInstanceOf(Array)
      expect(detections.length).toBe(2) // Два объекта из mock

      // Проверяем первый объект (person)
      expect(detections[0]).toMatchObject({
        id: "obj-1-0",
        label: "person",
        confidence: 0.85,
        frameNumbers: [1],
        trackId: 1,
      })

      // Проверяем bounding box (должен быть преобразован в абсолютные координаты)
      expect(detections[0].boundingBox).toMatchObject({
        x: 0.2 * 640, // 128
        y: 0.3 * 640, // 192
        width: 0.2 * 640, // 128
        height: 0.4 * 640, // 256
      })

      // Проверяем второй объект (car)
      expect(detections[1]).toMatchObject({
        id: "obj-1-1",
        label: "car",
        confidence: 0.92,
        frameNumbers: [1],
        trackId: 2,
      })
    })

    it("должен фильтровать объекты по уверенности", async () => {
      // Сбрасываем singleton
      ;(VisionService as any).instance = null

      // Создаем service с высоким порогом
      const strictService = VisionService.getInstance({
        objectConfidenceThreshold: 0.9, // Выше чем 0.85 для person
      })

      const mockImageData = new ImageData(640, 640)
      const detections = await strictService.detectObjects(mockImageData, 1)

      // Должен остаться только car (0.92 > 0.9)
      expect(detections.length).toBe(1)
      expect(detections[0].label).toBe("car")
      expect(detections[0].confidence).toBe(0.92)
    })

    it("должен обрабатывать строковые пути к изображениям", async () => {
      // Mock для Image и Canvas
      const mockImg = {
        src: "",
        onload: null as (() => void) | null,
        width: 640,
        height: 640,
      }

      const mockCanvas = {
        width: 640,
        height: 640,
        getContext: vi.fn().mockReturnValue({
          drawImage: vi.fn(),
          getImageData: vi.fn().mockReturnValue(new ImageData(640, 640)),
        }),
      }

      // Mock constructors
      global.Image = vi.fn().mockImplementation(() => {
        // Симулируем асинхронную загрузку изображения
        setTimeout(() => {
          if (mockImg.onload) {
            mockImg.onload()
          }
        }, 0)
        return mockImg
      })
      global.document = {
        createElement: vi.fn().mockReturnValue(mockCanvas),
      } as any

      const detections = await service.detectObjects("/path/to/image.jpg", 1)

      expect(detections).toBeInstanceOf(Array)
      expect(detections.length).toBe(2)
    }, 10000)
  })

  describe("face detection", () => {
    it("должен детектировать лица", async () => {
      const mockImageData = new ImageData(640, 640)

      const faces = await service.detectFaces(mockImageData, 1)

      expect(faces).toBeInstanceOf(Array)
      expect(faces.length).toBe(1)

      expect(faces[0]).toMatchObject({
        id: "face-1-0",
        confidence: 0.88,
      })

      // Проверяем что bounding box преобразован в абсолютные координаты
      expect(faces[0].boundingBox).toMatchObject({
        x: 0.25 * 640, // 160
        y: 0.35 * 640, // 224
        width: 0.1 * 640, // 64
        height: 0.15 * 640, // 96
      })

      // Проверяем landmarks
      expect(faces[0].landmarks).toBeDefined()
      expect(faces[0].landmarks?.leftEye).toMatchObject({
        x: 0.28 * 640,
        y: 0.38 * 640,
      })
      expect(faces[0].landmarks?.rightEye).toMatchObject({
        x: 0.32 * 640,
        y: 0.38 * 640,
      })
    })

    it("должен фильтровать лица по уверенности", async () => {
      // Сбрасываем singleton
      ;(VisionService as any).instance = null

      // Создаем service с высоким порогом
      const strictService = VisionService.getInstance({
        faceConfidenceThreshold: 0.95, // Выше чем 0.88
      })

      const mockImageData = new ImageData(640, 640)
      const faces = await strictService.detectFaces(mockImageData, 1)

      // Лица не должны пройти фильтр
      expect(faces.length).toBe(0)
    })
  })

  describe("frame analysis integration", () => {
    it("должен анализировать кадр с объектами и лицами", async () => {
      const mockImageData = new ImageData(640, 640)

      const result = await service.analyzeFrame(mockImageData, 1)

      expect(result).toMatchObject({
        objects: expect.any(Array),
        faces: expect.any(Array),
        text: expect.any(Array),
        activities: expect.any(Array),
        composition: expect.any(Object),
      })

      // Проверяем детекции объектов
      expect(result.objects.length).toBe(2)
      expect(result.objects[0].label).toBe("person")
      expect(result.objects[1].label).toBe("car")

      // Проверяем детекции лиц
      expect(result.faces.length).toBe(1)
      expect(result.faces[0].confidence).toBe(0.88)
    })

    it("должен пропускать отключенные детекции", async () => {
      // Сбрасываем singleton
      ;(VisionService as any).instance = null

      const limitedService = VisionService.getInstance({
        enableObjectDetection: false,
        enableFaceDetection: true,
      })

      const mockImageData = new ImageData(640, 640)
      const result = await limitedService.analyzeFrame(mockImageData, 1)

      // Объекты не должны детектироваться
      expect(result.objects.length).toBe(0)

      // Лица должны детектироваться
      expect(result.faces.length).toBe(1)
    })
  })

  describe("error handling", () => {
    it("должен обрабатывать ошибки YOLO инференса", async () => {
      // Mock ошибки ONNX Service
      mockRunYOLOInference.mockRejectedValue(new Error("YOLO inference failed"))

      const mockImageData = new ImageData(640, 640)

      // Не должно выбрасывать ошибку, должно вернуть пустой массив
      const detections = await service.detectObjects(mockImageData, 1)
      expect(detections).toEqual([])
    })

    it("должен обрабатывать ошибки детекции лиц", async () => {
      mockRunFaceDetection.mockRejectedValue(new Error("Face detection failed"))

      const mockImageData = new ImageData(640, 640)

      // Не должно выбрасывать ошибку, должно вернуть пустой массив
      const faces = await service.detectFaces(mockImageData, 1)
      expect(faces).toEqual([])
    })
  })
})
