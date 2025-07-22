/**
 * Tests for Object Tracking Service
 */

import { beforeEach, describe, expect, it } from "vitest"

import { InteractionType, MovementPattern, MovementType, ObjectTrackingService } from "../../services/object-tracking"

import type { ObjectDetection } from "../../../../shared/types/content-analysis"

describe("ObjectTrackingService", () => {
  let service: ObjectTrackingService

  beforeEach(() => {
    service = new ObjectTrackingService()
    service.initialize(1920, 1080)
  })

  describe("initialization", () => {
    it("должен инициализироваться с параметрами по умолчанию", () => {
      expect(service).toBeDefined()
      expect(service.getActiveTracks()).toHaveLength(0)
      expect(service.getCompletedTracks()).toHaveLength(0)
    })

    it("должен принимать пользовательскую конфигурацию", () => {
      const customConfig = {
        matching: {
          maxDistanceThreshold: 50,
          minOverlapThreshold: 0.5,
        },
        filtering: {
          minConfidence: 0.7,
          excludeLabels: ["car", "truck"],
        },
      }

      const customService = new ObjectTrackingService(customConfig)
      expect(customService).toBeDefined()
    })
  })

  describe("processFrame", () => {
    it("должен создавать новый трек для первой детекции", () => {
      const detections: ObjectDetection[] = [
        {
          id: "obj1",
          label: "car",
          confidence: 0.8,
          boundingBox: { x: 100, y: 100, width: 50, height: 30 },
          frameNumbers: [1],
        },
      ]

      const tracks = service.processFrame(1, 1000, detections)

      expect(tracks).toHaveLength(1)
      expect(tracks[0].label).toBe("car")
      expect(tracks[0].confidence).toBe(0.8)
      expect(tracks[0].trajectory).toHaveLength(1)
      expect(tracks[0].isActive).toBe(true)
    })

    it("должен обновлять существующий трек при соответствии", () => {
      // Первый кадр
      const detections1: ObjectDetection[] = [
        {
          id: "obj1",
          label: "car",
          confidence: 0.8,
          boundingBox: { x: 100, y: 100, width: 50, height: 30 },
          frameNumbers: [1],
        },
      ]

      service.processFrame(1, 1000, detections1)

      // Второй кадр с движением
      const detections2: ObjectDetection[] = [
        {
          id: "obj2",
          label: "car",
          confidence: 0.85,
          boundingBox: { x: 110, y: 100, width: 50, height: 30 },
          frameNumbers: [2],
        },
      ]

      const tracks = service.processFrame(2, 2000, detections2)

      expect(tracks).toHaveLength(1)
      expect(tracks[0].trajectory).toHaveLength(2)
      expect(tracks[0].endFrame).toBe(2)
      expect(tracks[0].trajectory[1].velocity).toBeDefined()
    })

    it("должен создавать отдельные треки для разных объектов", () => {
      const detections: ObjectDetection[] = [
        {
          id: "obj1",
          label: "car",
          confidence: 0.8,
          boundingBox: { x: 100, y: 100, width: 50, height: 30 },
          frameNumbers: [1],
        },
        {
          id: "obj2",
          label: "bicycle",
          confidence: 0.7,
          boundingBox: { x: 200, y: 150, width: 30, height: 40 },
          frameNumbers: [1],
        },
      ]

      const tracks = service.processFrame(1, 1000, detections)

      expect(tracks).toHaveLength(2)
      expect(tracks.map((t) => t.label)).toContain("car")
      expect(tracks.map((t) => t.label)).toContain("bicycle")
    })

    it("должен фильтровать детекции с низкой уверенностью", () => {
      const detections: ObjectDetection[] = [
        {
          id: "obj1",
          label: "car",
          confidence: 0.2, // Ниже порога по умолчанию (0.3)
          boundingBox: { x: 100, y: 100, width: 50, height: 30 },
          frameNumbers: [1],
        },
        {
          id: "obj2",
          label: "bicycle",
          confidence: 0.8, // Выше порога
          boundingBox: { x: 200, y: 150, width: 30, height: 40 },
          frameNumbers: [1],
        },
      ]

      const tracks = service.processFrame(1, 1000, detections)

      expect(tracks).toHaveLength(1)
      expect(tracks[0].label).toBe("bicycle")
    })

    it("должен исключать указанные категории объектов", () => {
      const customService = new ObjectTrackingService({
        filtering: {
          excludeLabels: ["person"],
          minConfidence: 0.3,
          minObjectSize: 20,
          maxObjectSize: 100000,
        },
      })
      customService.initialize(1920, 1080)

      const detections: ObjectDetection[] = [
        {
          id: "obj1",
          label: "person", // Исключенная категория
          confidence: 0.8,
          boundingBox: { x: 100, y: 100, width: 50, height: 100 },
          frameNumbers: [1],
        },
        {
          id: "obj2",
          label: "car",
          confidence: 0.8,
          boundingBox: { x: 200, y: 150, width: 80, height: 40 },
          frameNumbers: [1],
        },
      ]

      const tracks = customService.processFrame(1, 1000, detections)

      expect(tracks).toHaveLength(1)
      expect(tracks[0].label).toBe("car")
    })
  })

  describe("movement analysis", () => {
    it("должен определять статичный объект", () => {
      const detections: ObjectDetection[] = [
        {
          id: "obj1",
          label: "car",
          confidence: 0.8,
          boundingBox: { x: 100, y: 100, width: 50, height: 30 },
          frameNumbers: [1],
        },
      ]

      // Несколько кадров без движения
      service.processFrame(1, 1000, detections)
      service.processFrame(2, 2000, detections)
      service.processFrame(3, 3000, detections)

      const tracks = service.getActiveTracks()
      expect(tracks[0].metadata.movementType).toBe(MovementType.STATIC)
      expect(tracks[0].metadata.movementPattern).toBe(MovementPattern.STATIONARY)
    })

    it("должен определять линейное движение", () => {
      // Создаем серию детекций с линейным движением
      const frames = [
        { x: 100, y: 100, frame: 1, time: 1000 },
        { x: 120, y: 100, frame: 2, time: 2000 },
        { x: 140, y: 100, frame: 3, time: 3000 },
        { x: 160, y: 100, frame: 4, time: 4000 },
      ]

      frames.forEach(({ x, y, frame, time }) => {
        const detections: ObjectDetection[] = [
          {
            id: `obj${frame}`,
            label: "car",
            confidence: 0.8,
            boundingBox: { x, y, width: 50, height: 30 },
            frameNumbers: [frame],
          },
        ]
        service.processFrame(frame, time, detections)
      })

      const tracks = service.getActiveTracks()
      expect(tracks[0].metadata.movementType).toBe(MovementType.LINEAR)
      expect(tracks[0].metadata.movementPattern).toBe(MovementPattern.LEFT_TO_RIGHT)
    })

    it("должен вычислять скорость и ускорение", () => {
      const frames = [
        { x: 100, y: 100, frame: 1, time: 1000 },
        { x: 115, y: 100, frame: 2, time: 2000 },
        { x: 140, y: 100, frame: 3, time: 3000 }, // Ускорение
      ]

      frames.forEach(({ x, y, frame, time }) => {
        const detections: ObjectDetection[] = [
          {
            id: `obj${frame}`, // Разные ID, но близкие позиции для сопоставления
            label: "car",
            confidence: 0.8,
            boundingBox: { x, y, width: 50, height: 30 },
            frameNumbers: [frame],
          },
        ]
        service.processFrame(frame, time, detections)
      })

      const tracks = service.getActiveTracks()

      // Должен быть только один трек (сопоставление сработало)
      expect(tracks).toHaveLength(1)
      const trajectory = tracks[0].trajectory

      // Проверяем, что скорость вычислена
      expect(trajectory[1].velocity).toBeDefined()
      expect(trajectory[1].velocity!.magnitude).toBeGreaterThan(0)

      // Проверяем, что ускорение вычислено для третьего кадра
      expect(trajectory[2].acceleration).toBeDefined()
    })
  })

  describe("interaction detection", () => {
    it("должен определять столкновения объектов", () => {
      // Два объекта движутся навстречу друг другу
      const frames = [
        {
          detections: [
            {
              id: "obj1",
              label: "car",
              confidence: 0.8,
              boundingBox: { x: 100, y: 100, width: 50, height: 30 },
              frameNumbers: [1],
            },
            {
              id: "obj2",
              label: "car",
              confidence: 0.8,
              boundingBox: { x: 200, y: 100, width: 50, height: 30 },
              frameNumbers: [1],
            },
          ],
          frame: 1,
          time: 1000,
        },
        {
          detections: [
            {
              id: "obj3",
              label: "car",
              confidence: 0.8,
              boundingBox: { x: 125, y: 100, width: 50, height: 30 },
              frameNumbers: [2],
            },
            {
              id: "obj4",
              label: "car",
              confidence: 0.8,
              boundingBox: { x: 175, y: 100, width: 50, height: 30 },
              frameNumbers: [2],
            },
          ],
          frame: 2,
          time: 2000,
        },
      ]

      frames.forEach(({ detections, frame, time }) => {
        service.processFrame(frame, time, detections)
      })

      const tracks = service.getActiveTracks()

      // Проверяем, что взаимодействие обнаружено
      const hasCollisionInteraction = tracks.some((track) =>
        track.metadata.interactions.some(
          (interaction) =>
            interaction.interactionType === InteractionType.COLLISION ||
            interaction.interactionType === InteractionType.APPROACH,
        ),
      )

      expect(hasCollisionInteraction).toBe(true)
    })
  })

  describe("track management", () => {
    it("должен завершать треки при пропуске кадров", () => {
      const detections: ObjectDetection[] = [
        {
          id: "obj1",
          label: "car",
          confidence: 0.8,
          boundingBox: { x: 100, y: 100, width: 50, height: 30 },
          frameNumbers: [1],
        },
      ]

      // Создаем трек с достаточным количеством кадров
      service.processFrame(1, 1000, detections)
      service.processFrame(2, 2000, detections)
      service.processFrame(3, 3000, detections)
      expect(service.getActiveTracks()).toHaveLength(1)

      // Пропускаем много кадров (больше maxMissedFrames)
      service.processFrame(10, 10000, []) // Пустые детекции

      expect(service.getActiveTracks()).toHaveLength(0)
      expect(service.getCompletedTracks()).toHaveLength(1)
    })

    it("должен предсказывать позицию при пропуске кадров", () => {
      const customService = new ObjectTrackingService({
        tracking: {
          maxMissedFrames: 5,
          minTrackLength: 3,
          velocitySmoothing: 0.7,
          positionPrediction: true,
        },
      })
      customService.initialize(1920, 1080)

      // Создаем движущийся объект
      const frames = [
        { x: 100, y: 100, frame: 1, time: 1000 },
        { x: 120, y: 100, frame: 2, time: 2000 },
      ]

      frames.forEach(({ x, y, frame, time }) => {
        const detections: ObjectDetection[] = [
          {
            id: `obj${frame}`,
            label: "car",
            confidence: 0.8,
            boundingBox: { x, y, width: 50, height: 30 },
            frameNumbers: [frame],
          },
        ]
        customService.processFrame(frame, time, detections)
      })

      // Пропускаем кадр (без детекций)
      customService.processFrame(3, 3000, [])

      const tracks = customService.getActiveTracks()
      expect(tracks[0].trajectory).toHaveLength(3) // Включая предсказанную точку
      expect(tracks[0].trajectory[2].confidence).toBeLessThan(0.8) // Предсказанная точка имеет меньшую уверенность
    })
  })

  describe("statistics", () => {
    it("должен предоставлять статистику трекинга", () => {
      const detections: ObjectDetection[] = [
        {
          id: "obj1",
          label: "car",
          confidence: 0.8,
          boundingBox: { x: 100, y: 100, width: 50, height: 30 },
          frameNumbers: [1],
        },
        {
          id: "obj2",
          label: "bicycle",
          confidence: 0.7,
          boundingBox: { x: 200, y: 150, width: 30, height: 40 },
          frameNumbers: [1],
        },
      ]

      service.processFrame(1, 1000, detections)

      const stats = service.getTrackingStatistics()

      expect(stats.totalTracks).toBe(2)
      expect(stats.activeTracks).toBe(2)
      expect(stats.completedTracks).toBe(0)
      expect(stats.objectCategories.get("car")).toBe(1)
      expect(stats.objectCategories.get("bicycle")).toBe(1)
    })

    it("должен вычислять среднюю длину трека", () => {
      // Создаем треки разной длины
      const detections1: ObjectDetection[] = [
        {
          id: "obj1",
          label: "car",
          confidence: 0.8,
          boundingBox: { x: 100, y: 100, width: 50, height: 30 },
          frameNumbers: [1],
        },
      ]

      // Трек 1: 3 кадра
      service.processFrame(1, 1000, detections1)
      service.processFrame(2, 2000, detections1)
      service.processFrame(3, 3000, detections1)

      // Завершаем первый трек
      service.processFrame(10, 10000, [])

      // Трек 2: 2 кадра
      const detections2: ObjectDetection[] = [
        {
          id: "obj2",
          label: "bicycle",
          confidence: 0.7,
          boundingBox: { x: 200, y: 150, width: 30, height: 40 },
          frameNumbers: [11],
        },
      ]

      service.processFrame(11, 11000, detections2)
      service.processFrame(12, 12000, detections2)
      service.processFrame(13, 13000, detections2)
      service.processFrame(14, 14000, detections2)

      // Завершаем второй трек (теперь 4 кадра)
      service.processFrame(20, 20000, [])

      const stats = service.getTrackingStatistics()
      expect(stats.averageTrackLength).toBe(3.5) // (3 + 4) / 2
    })
  })
})
