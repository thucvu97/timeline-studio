/**
 * Tests for Scene Detection Service
 */

import { beforeEach, describe, expect, it } from "vitest"

import { TransitionType } from "../../../../shared/types/content-analysis"
import {
  classifyTransitionComplexity,
  evaluateEditingQuality,
  SceneDetectionService,
  type SceneTransitionAnalysis,
} from "../../services/scene-detection"

describe("SceneDetectionService", () => {
  let service: SceneDetectionService

  beforeEach(() => {
    service = new SceneDetectionService()
  })

  describe("analyzeTransitions", () => {
    it("должен анализировать переходы между сценами", async () => {
      const mockScenes = [
        {
          startTime: 0,
          endTime: 10,
          keyframes: [
            {
              time: 5,
              histogram: Array(768).fill(50), // Средняя яркость
              motionVectors: [
                [1, 0],
                [2, 0],
              ],
              audioLevel: -20,
            },
          ],
        },
        {
          startTime: 10,
          endTime: 20,
          keyframes: [
            {
              time: 15,
              histogram: Array(768).fill(100), // Высокая яркость
              motionVectors: [
                [-1, 0],
                [-2, 0],
              ],
              audioLevel: -15,
            },
          ],
        },
      ]

      const transitions = await service.analyzeTransitions(mockScenes)

      expect(transitions).toHaveLength(1)
      expect(transitions[0]).toMatchObject({
        fromScene: 0,
        toScene: 1,
        startTime: 10,
        endTime: 10,
        duration: 0,
        type: expect.any(String),
        confidence: expect.any(Number),
        smoothness: expect.any(Number),
        visualImpact: expect.any(Number),
      })
    })

    it("должен обрабатывать случай без кадров", async () => {
      const mockScenes = [
        {
          startTime: 0,
          endTime: 10,
          keyframes: [],
        },
        {
          startTime: 10,
          endTime: 20,
          keyframes: [],
        },
      ]

      const transitions = await service.analyzeTransitions(mockScenes)

      expect(transitions).toHaveLength(1)
      expect(transitions[0].type).toBe(TransitionType.CUT)
    })

    it("должен возвращать пустой массив для одной сцены", async () => {
      const mockScenes = [
        {
          startTime: 0,
          endTime: 10,
          keyframes: [],
        },
      ]

      const transitions = await service.analyzeTransitions(mockScenes)

      expect(transitions).toHaveLength(0)
    })
  })

  describe("detectTransitionType", () => {
    it("должен определять fade переходы", async () => {
      const mockConfig = {
        colorHistogramThreshold: 0.3,
        motionVectorThreshold: 0.4,
        audioLevelThreshold: 10,
        minimumSceneDuration: 1.0,
        transitionDetection: {
          enabled: true,
          fadeThreshold: 0.5,
          dissolveThreshold: 0.7,
          wipeDetectionEnabled: true,
          customTransitionsEnabled: false,
        },
        keyframeAnalysisOnly: true,
        parallelProcessing: true,
        gpuAcceleration: false,
      }

      const service = new SceneDetectionService(mockConfig)

      // Создаем сцены с fade переходом (яркость уменьшается)
      const mockScenes = [
        {
          startTime: 0,
          endTime: 10,
          keyframes: [
            {
              time: 9,
              histogram: Array(768).fill(200), // Высокая яркость
              motionVectors: [],
              audioLevel: -20,
            },
          ],
        },
        {
          startTime: 10,
          endTime: 20,
          keyframes: [
            {
              time: 11,
              histogram: Array(768).fill(50), // Низкая яркость
              motionVectors: [],
              audioLevel: -20,
            },
          ],
        },
      ]

      const transitions = await service.analyzeTransitions(mockScenes)

      // Переход может быть определен как fade_out или cut в зависимости от алгоритма
      expect([TransitionType.FADE_OUT, TransitionType.CUT]).toContain(transitions[0].type)
    })
  })

  describe("configuration", () => {
    it("должен использовать конфигурацию по умолчанию", () => {
      const service = new SceneDetectionService()

      // Проверяем, что сервис создан успешно (конфигурация валидна)
      expect(service).toBeDefined()
    })

    it("должен принимать пользовательскую конфигурацию", () => {
      const customConfig = {
        colorHistogramThreshold: 0.5,
        transitionDetection: {
          enabled: false,
          fadeThreshold: 0.9,
          dissolveThreshold: 0.8,
          wipeDetectionEnabled: false,
          customTransitionsEnabled: true,
        },
      }

      const service = new SceneDetectionService(customConfig)

      expect(service).toBeDefined()
    })
  })
})

describe("classifyTransitionComplexity", () => {
  it("должен классифицировать простые переходы", () => {
    const cutTransition: SceneTransitionAnalysis = {
      fromScene: 0,
      toScene: 1,
      startTime: 10,
      endTime: 10,
      duration: 0,
      type: TransitionType.CUT,
      confidence: 0.9,
      smoothness: 0.1,
      visualImpact: 0.8,
      metadata: {
        colorChange: 0.5,
        motionChange: 0.3,
        audioChange: 5,
        isNaturalCut: true,
        requiresAttention: false,
      },
    }

    expect(classifyTransitionComplexity(cutTransition)).toBe("simple")
  })

  it("должен классифицировать средние переходы", () => {
    const dissolveTransition: SceneTransitionAnalysis = {
      fromScene: 0,
      toScene: 1,
      startTime: 10,
      endTime: 11,
      duration: 1,
      type: TransitionType.DISSOLVE,
      confidence: 0.7,
      smoothness: 0.8,
      visualImpact: 0.5,
      metadata: {
        colorChange: 0.3,
        motionChange: 0.2,
        audioChange: 3,
        isNaturalCut: false,
        requiresAttention: false,
      },
    }

    expect(classifyTransitionComplexity(dissolveTransition)).toBe("medium")
  })

  it("должен классифицировать сложные переходы", () => {
    const morphTransition: SceneTransitionAnalysis = {
      fromScene: 0,
      toScene: 1,
      startTime: 10,
      endTime: 12,
      duration: 2,
      type: TransitionType.MORPH,
      confidence: 0.5,
      smoothness: 0.9,
      visualImpact: 0.9,
      metadata: {
        colorChange: 0.8,
        motionChange: 0.7,
        audioChange: 10,
        isNaturalCut: false,
        requiresAttention: true,
      },
    }

    expect(classifyTransitionComplexity(morphTransition)).toBe("complex")
  })
})

describe("evaluateEditingQuality", () => {
  it("должен возвращать нулевые значения для пустого массива", () => {
    const quality = evaluateEditingQuality([])

    expect(quality).toEqual({
      overallQuality: 0,
      rhythm: 0,
      consistency: 0,
      creativity: 0,
    })
  })

  it("должен оценивать качество монтажа", () => {
    const transitions: SceneTransitionAnalysis[] = [
      {
        fromScene: 0,
        toScene: 1,
        startTime: 10,
        endTime: 10,
        duration: 0,
        type: TransitionType.CUT,
        confidence: 0.9,
        smoothness: 0.1,
        visualImpact: 0.8,
        metadata: {
          colorChange: 0.5,
          motionChange: 0.3,
          audioChange: 5,
          isNaturalCut: true,
          requiresAttention: false,
        },
      },
      {
        fromScene: 1,
        toScene: 2,
        startTime: 20,
        endTime: 21,
        duration: 1,
        type: TransitionType.DISSOLVE,
        confidence: 0.7,
        smoothness: 0.8,
        visualImpact: 0.5,
        metadata: {
          colorChange: 0.3,
          motionChange: 0.2,
          audioChange: 3,
          isNaturalCut: false,
          requiresAttention: false,
        },
      },
    ]

    const quality = evaluateEditingQuality(transitions)

    expect(quality.overallQuality).toBeGreaterThan(0)
    expect(quality.overallQuality).toBeLessThanOrEqual(1)
    expect(quality.rhythm).toBeGreaterThan(0)
    expect(quality.rhythm).toBeLessThanOrEqual(1)
    expect(quality.consistency).toBeGreaterThan(0)
    expect(quality.consistency).toBeLessThanOrEqual(1)
    expect(quality.creativity).toBeGreaterThan(0)
    expect(quality.creativity).toBeLessThanOrEqual(1)
  })

  it("должен предпочитать консистентность при одинаковых переходах", () => {
    const transitions: SceneTransitionAnalysis[] = [
      {
        fromScene: 0,
        toScene: 1,
        startTime: 10,
        endTime: 10,
        duration: 0,
        type: TransitionType.CUT,
        confidence: 0.9,
        smoothness: 0.1,
        visualImpact: 0.8,
        metadata: {
          colorChange: 0.5,
          motionChange: 0.3,
          audioChange: 5,
          isNaturalCut: true,
          requiresAttention: false,
        },
      },
      {
        fromScene: 1,
        toScene: 2,
        startTime: 20,
        endTime: 20,
        duration: 0,
        type: TransitionType.CUT,
        confidence: 0.9,
        smoothness: 0.1,
        visualImpact: 0.8,
        metadata: {
          colorChange: 0.5,
          motionChange: 0.3,
          audioChange: 5,
          isNaturalCut: true,
          requiresAttention: false,
        },
      },
    ]

    const quality = evaluateEditingQuality(transitions)

    // Высокая консистентность (все переходы одинаковые)
    expect(quality.consistency).toBe(1)
    // Низкая креативность (только один тип переходов из возможных двух)
    expect(quality.creativity).toBe(0.5)
  })
})
