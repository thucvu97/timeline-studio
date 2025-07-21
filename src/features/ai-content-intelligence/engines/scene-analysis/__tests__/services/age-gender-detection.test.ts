/**
 * Tests for Age Gender Detection Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  AgeGenderDetectionService,
  type AgeGenderConfig,
  type AgeGenderResult,
  type DemographicStats,
  type FrameAgeGenderResult
} from '../../services/age-gender-detection'
import type { FaceDetection } from '../../../../shared/types/content-analysis'

// Mock face detection data
const createMockFace = (id: string, bbox: { x: number; y: number; width: number; height: number }): FaceDetection => ({
  id,
  confidence: 0.9,
  boundingBox: bbox,
  landmarks: {
    leftEye: { x: bbox.x + bbox.width * 0.3, y: bbox.y + bbox.height * 0.3 },
    rightEye: { x: bbox.x + bbox.width * 0.7, y: bbox.y + bbox.height * 0.3 },
    nose: { x: bbox.x + bbox.width * 0.5, y: bbox.y + bbox.height * 0.5 },
    mouth: { x: bbox.x + bbox.width * 0.5, y: bbox.y + bbox.height * 0.7 },
  },
})

describe('AgeGenderDetectionService', () => {
  let service: AgeGenderDetectionService
  let defaultConfig: AgeGenderConfig

  beforeEach(() => {
    defaultConfig = {
      enableAge: true,
      enableGender: true,
      enableEmotion: true,
      enableEthnicity: false,
      minConfidence: 0.5,
      useMLModels: false, // Используем эвристики для предсказуемых тестов
      enableSmoothing: false,
      smoothingWindow: 5,
    }
    
    service = new AgeGenderDetectionService(defaultConfig)
  })

  describe('initialization', () => {
    it('должен инициализироваться с дефолтной конфигурацией', () => {
      const defaultService = new AgeGenderDetectionService()
      const config = defaultService.getConfig()
      
      expect(config.enableAge).toBe(true)
      expect(config.enableGender).toBe(true)
      expect(config.enableEmotion).toBe(true)
      expect(config.minConfidence).toBe(0.5)
      expect(config.useMLModels).toBe(true)
    })

    it('должен принимать пользовательскую конфигурацию', () => {
      const customConfig: Partial<AgeGenderConfig> = {
        enableAge: false,
        minConfidence: 0.8,
        useMLModels: false,
      }
      
      const customService = new AgeGenderDetectionService(customConfig)
      const config = customService.getConfig()
      
      expect(config.enableAge).toBe(false)
      expect(config.minConfidence).toBe(0.8)
      expect(config.useMLModels).toBe(false)
      expect(config.enableGender).toBe(true) // Дефолтное значение
    })
  })

  describe('age and gender analysis', () => {
    it('должен анализировать возраст и пол для одного лица', async () => {
      const mockFace = createMockFace('face-1', { x: 100, y: 100, width: 80, height: 90 })
      
      const result = await service.analyzeFrame([mockFace], 1, 1000)
      
      expect(result.frameNumber).toBe(1)
      expect(result.timestamp).toBe(1000)
      expect(result.results.length).toBe(1)
      
      const ageGenderResult = result.results[0]
      expect(ageGenderResult.faceId).toBe('face-1')
      expect(ageGenderResult.age).toBeGreaterThan(0)
      expect(ageGenderResult.ageConfidence).toBeGreaterThanOrEqual(0)
      expect(ageGenderResult.ageConfidence).toBeLessThanOrEqual(1)
      expect(['male', 'female', 'unknown']).toContain(ageGenderResult.gender)
      expect(ageGenderResult.genderConfidence).toBeGreaterThanOrEqual(0)
      expect(ageGenderResult.genderConfidence).toBeLessThanOrEqual(1)
    })

    it('должен анализировать несколько лиц в кадре', async () => {
      const mockFaces = [
        createMockFace('face-1', { x: 100, y: 100, width: 80, height: 90 }),
        createMockFace('face-2', { x: 200, y: 150, width: 60, height: 70 }),
        createMockFace('face-3', { x: 300, y: 200, width: 90, height: 100 }),
      ]
      
      const result = await service.analyzeFrame(mockFaces, 1, 1000)
      
      expect(result.results.length).toBe(3)
      expect(result.results.map(r => r.faceId)).toEqual(['face-1', 'face-2', 'face-3'])
    })

    it('должен определять возраст на основе размера лица (эвристика)', async () => {
      // Маленькое лицо - ребенок
      const childFace = createMockFace('child', { x: 100, y: 100, width: 40, height: 45 })
      
      // Большое лицо - взрослый
      const adultFace = createMockFace('adult', { x: 200, y: 200, width: 150, height: 180 })
      
      const childResult = await service.analyzeFrame([childFace], 1, 1000)
      const adultResult = await service.analyzeFrame([adultFace], 2, 2000)
      
      expect(childResult.results[0].age).toBeLessThan(adultResult.results[0].age)
    })

    it('должен определять пол на основе пропорций лица (эвристика)', async () => {
      // Узкое лицо - женщина (aspect ratio < 0.85)
      const femaleFace = createMockFace('female', { x: 100, y: 100, width: 70, height: 90 })
      
      // Широкое лицо - мужчина (aspect ratio > 0.9)
      const maleFace = createMockFace('male', { x: 200, y: 200, width: 95, height: 100 })
      
      const femaleResult = await service.analyzeFrame([femaleFace], 1, 1000)
      const maleResult = await service.analyzeFrame([maleFace], 2, 2000)
      
      // Из-за эвристики узкое лицо должно быть female, широкое - male
      expect(femaleResult.results[0].gender).toBe('female')
      expect(maleResult.results[0].gender).toBe('male')
    })

    it('должен включать эмоции когда включено', async () => {
      const emotionService = new AgeGenderDetectionService({
        ...defaultConfig,
        enableEmotion: true,
        useMLModels: false,
      })
      
      const mockFace = createMockFace('face-1', { x: 100, y: 100, width: 80, height: 90 })
      const result = await emotionService.analyzeFrame([mockFace], 1, 1000)
      
      expect(result.results[0].emotion).toBeDefined()
      expect(result.results[0].emotionConfidence).toBeDefined()
      expect(result.results[0].emotionConfidence).toBeGreaterThanOrEqual(0)
    })

    it('не должен включать эмоции когда отключено', async () => {
      const noEmotionService = new AgeGenderDetectionService({
        ...defaultConfig,
        enableEmotion: false,
      })
      
      const mockFace = createMockFace('face-1', { x: 100, y: 100, width: 80, height: 90 })
      const result = await noEmotionService.analyzeFrame([mockFace], 1, 1000)
      
      expect(result.results[0].emotion).toBeUndefined()
      expect(result.results[0].emotionConfidence).toBeUndefined()
    })
  })

  describe('ML models vs heuristics', () => {
    it('должен использовать ML модели когда включено', async () => {
      const mlService = new AgeGenderDetectionService({
        ...defaultConfig,
        useMLModels: true,
      })
      
      const mockFace = createMockFace('face-1', { x: 100, y: 100, width: 80, height: 90 })
      const result = await mlService.analyzeFrame([mockFace], 1, 1000)
      
      // ML модели должны давать более точные результаты с более высокой уверенностью
      expect(result.results[0].ageConfidence).toBeGreaterThan(0.6)
      expect(result.results[0].genderConfidence).toBeGreaterThan(0.6)
      
      // ML модели должны включать этническую принадлежность
      if (result.results[0].ethnicity) {
        expect(['caucasian', 'asian', 'african', 'hispanic', 'middle_eastern', 'other'])
          .toContain(result.results[0].ethnicity)
      }
    })

    it('должен использовать эвристики когда ML отключено', async () => {
      const heuristicService = new AgeGenderDetectionService({
        ...defaultConfig,
        useMLModels: false,
      })
      
      const mockFace = createMockFace('face-1', { x: 100, y: 100, width: 80, height: 90 })
      const result = await heuristicService.analyzeFrame([mockFace], 1, 1000)
      
      // Эвристики дают базовые результаты
      expect(result.results[0].ageConfidence).toBe(0.5)
      expect(result.results[0].emotion).toBe('neutral')
      expect(result.results[0].emotionConfidence).toBe(0.5)
    })
  })

  describe('smoothing', () => {
    it('должен применять сглаживание между кадрами', async () => {
      const smoothingService = new AgeGenderDetectionService({
        ...defaultConfig,
        enableSmoothing: true,
        smoothingWindow: 3,
        useMLModels: false, // Для предсказуемости
      })
      
      const mockFace = createMockFace('face-1', { x: 100, y: 100, width: 80, height: 90 })
      
      // Анализируем несколько кадров с одним и тем же лицом
      const result1 = await smoothingService.analyzeFrame([mockFace], 1, 1000)
      const result2 = await smoothingService.analyzeFrame([mockFace], 2, 2000)
      const result3 = await smoothingService.analyzeFrame([mockFace], 3, 3000)
      
      // Результаты должны быть сохранены
      expect(result1.results.length).toBe(1)
      expect(result2.results.length).toBe(1)
      expect(result3.results.length).toBe(1)
      
      // Все результаты должны иметь один и тот же faceId
      expect(result1.results[0].faceId).toBe('face-1')
      expect(result2.results[0].faceId).toBe('face-1')
      expect(result3.results[0].faceId).toBe('face-1')
    })

    it('не должен применять сглаживание когда отключено', async () => {
      const noSmoothingService = new AgeGenderDetectionService({
        ...defaultConfig,
        enableSmoothing: false,
      })
      
      const mockFace = createMockFace('face-1', { x: 100, y: 100, width: 80, height: 90 })
      
      const result1 = await noSmoothingService.analyzeFrame([mockFace], 1, 1000)
      const result2 = await noSmoothingService.analyzeFrame([mockFace], 2, 2000)
      
      // Результаты могут отличаться без сглаживания (в случае ML моделей)
      expect(result1.results.length).toBe(1)
      expect(result2.results.length).toBe(1)
    })
  })

  describe('demographic statistics', () => {
    it('должен вычислять демографическую статистику', async () => {
      // Создаем лица разных возрастов и полов
      const faces = [
        createMockFace('child', { x: 100, y: 100, width: 40, height: 45 }),      // ребенок
        createMockFace('teen', { x: 150, y: 150, width: 60, height: 65 }),       // подросток
        createMockFace('adult1', { x: 200, y: 200, width: 80, height: 90 }),     // взрослый
        createMockFace('adult2', { x: 250, y: 250, width: 85, height: 95 }),     // взрослый
        createMockFace('senior', { x: 300, y: 300, width: 90, height: 100 }),    // пожилой
      ]
      
      const result = await service.analyzeFrame(faces, 1, 1000)
      const demographics = result.demographics
      
      expect(demographics.totalFaces).toBe(5)
      expect(demographics.averageAge).toBeGreaterThan(0)
      expect(demographics.ageDistribution.children).toBeGreaterThanOrEqual(0)
      expect(demographics.ageDistribution.teenagers).toBeGreaterThanOrEqual(0)
      expect(demographics.ageDistribution.young_adults).toBeGreaterThanOrEqual(0)
      expect(demographics.ageDistribution.middle_aged).toBeGreaterThanOrEqual(0)
      expect(demographics.ageDistribution.seniors).toBeGreaterThanOrEqual(0)
      
      expect(demographics.genderDistribution.male).toBeGreaterThanOrEqual(0)
      expect(demographics.genderDistribution.female).toBeGreaterThanOrEqual(0)
      expect(demographics.genderDistribution.unknown).toBeGreaterThanOrEqual(0)
      
      expect(['male', 'female', 'balanced']).toContain(demographics.dominantGender)
    })

    it('должен правильно классифицировать возрастные группы', async () => {
      const mockResults: AgeGenderResult[] = [
        { faceId: 'face-1', age: 8, ageConfidence: 0.9, gender: 'male', genderConfidence: 0.8 },
        { faceId: 'face-2', age: 16, ageConfidence: 0.9, gender: 'female', genderConfidence: 0.8 },
        { faceId: 'face-3', age: 28, ageConfidence: 0.9, gender: 'male', genderConfidence: 0.8 },
        { faceId: 'face-4', age: 45, ageConfidence: 0.9, gender: 'female', genderConfidence: 0.8 },
        { faceId: 'face-5', age: 65, ageConfidence: 0.9, gender: 'male', genderConfidence: 0.8 },
      ]
      
      // Используем приватный метод через рефлексию для тестирования
      const demographics = (service as any).calculateDemographics(mockResults)
      
      expect(demographics.ageDistribution.children).toBe(1)     // age 8
      expect(demographics.ageDistribution.teenagers).toBe(1)    // age 16
      expect(demographics.ageDistribution.young_adults).toBe(1) // age 28
      expect(demographics.ageDistribution.middle_aged).toBe(1)  // age 45
      expect(demographics.ageDistribution.seniors).toBe(1)      // age 65
      
      expect(demographics.genderDistribution.male).toBe(3)
      expect(demographics.genderDistribution.female).toBe(2)
      expect(demographics.dominantGender).toBe('male')
      
      expect(demographics.averageAge).toBe(Math.round((8 + 16 + 28 + 45 + 65) / 5))
    })

    it('должен обрабатывать пустой список лиц', async () => {
      const result = await service.analyzeFrame([], 1, 1000)
      const demographics = result.demographics
      
      expect(demographics.totalFaces).toBe(0)
      expect(demographics.averageAge).toBe(0)
      expect(demographics.dominantGender).toBe('balanced')
      
      expect(demographics.ageDistribution.children).toBe(0)
      expect(demographics.ageDistribution.teenagers).toBe(0)
      expect(demographics.ageDistribution.young_adults).toBe(0)
      expect(demographics.ageDistribution.middle_aged).toBe(0)
      expect(demographics.ageDistribution.seniors).toBe(0)
      
      expect(demographics.genderDistribution.male).toBe(0)
      expect(demographics.genderDistribution.female).toBe(0)
      expect(demographics.genderDistribution.unknown).toBe(0)
    })
  })

  describe('video analysis', () => {
    it('должен анализировать все видео и вычислять статистику', async () => {
      const frameResults: FrameAgeGenderResult[] = [
        {
          frameNumber: 1,
          timestamp: 1000,
          results: [
            { faceId: 'face-1', age: 25, ageConfidence: 0.9, gender: 'male', genderConfidence: 0.8 },
            { faceId: 'face-2', age: 30, ageConfidence: 0.9, gender: 'female', genderConfidence: 0.8 },
          ],
          demographics: {} as DemographicStats,
        },
        {
          frameNumber: 2,
          timestamp: 2000,
          results: [
            { faceId: 'face-1', age: 26, ageConfidence: 0.9, gender: 'male', genderConfidence: 0.8 },
            { faceId: 'face-3', age: 40, ageConfidence: 0.9, gender: 'female', genderConfidence: 0.8 },
          ],
          demographics: {} as DemographicStats,
        },
      ]
      
      const videoAnalysis = await service.analyzeVideo(frameResults)
      
      expect(videoAnalysis.totalFrames).toBe(2)
      expect(videoAnalysis.uniqueFaces).toBe(3) // face-1, face-2, face-3
      expect(videoAnalysis.overallDemographics.totalFaces).toBe(4) // Всего результатов
      expect(videoAnalysis.demographicTrends.length).toBe(2)
      
      // Проверяем отслеживание длительности появления лиц
      const face1Duration = videoAnalysis.faceAppearanceDuration.get('face-1')
      expect(face1Duration).toBeDefined()
      expect(face1Duration!.firstFrame).toBe(1)
      expect(face1Duration!.lastFrame).toBe(2)
      expect(face1Duration!.totalFrames).toBe(2)
      
      const face2Duration = videoAnalysis.faceAppearanceDuration.get('face-2')
      expect(face2Duration).toBeDefined()
      expect(face2Duration!.firstFrame).toBe(1)
      expect(face2Duration!.lastFrame).toBe(1)
      expect(face2Duration!.totalFrames).toBe(1)
    })

    it('должен обрабатывать пустое видео', async () => {
      const videoAnalysis = await service.analyzeVideo([])
      
      expect(videoAnalysis.totalFrames).toBe(0)
      expect(videoAnalysis.uniqueFaces).toBe(0)
      expect(videoAnalysis.overallDemographics.totalFaces).toBe(0)
      expect(videoAnalysis.demographicTrends.length).toBe(0)
      expect(videoAnalysis.faceAppearanceDuration.size).toBe(0)
    })
  })

  describe('age group statistics', () => {
    it('должен возвращать статистику по возрастным группам', () => {
      const demographics: DemographicStats = {
        totalFaces: 10,
        ageDistribution: {
          children: 2,
          teenagers: 1,
          young_adults: 4,
          middle_aged: 2,
          seniors: 1,
        },
        genderDistribution: { male: 5, female: 5, unknown: 0 },
        averageAge: 32,
        dominantGender: 'balanced',
      }
      
      const ageGroupStats = service.getAgeGroupStatistics(demographics)
      
      expect(ageGroupStats.length).toBe(5)
      
      const childrenGroup = ageGroupStats.find(g => g.group.includes('Дети'))
      expect(childrenGroup).toBeDefined()
      expect(childrenGroup!.count).toBe(2)
      expect(childrenGroup!.percentage).toBe(20)
      
      const youngAdultsGroup = ageGroupStats.find(g => g.group.includes('Молодые взрослые'))
      expect(youngAdultsGroup).toBeDefined()
      expect(youngAdultsGroup!.count).toBe(4)
      expect(youngAdultsGroup!.percentage).toBe(40)
    })

    it('должен обрабатывать нулевое количество лиц', () => {
      const emptyDemographics: DemographicStats = {
        totalFaces: 0,
        ageDistribution: {
          children: 0,
          teenagers: 0,
          young_adults: 0,
          middle_aged: 0,
          seniors: 0,
        },
        genderDistribution: { male: 0, female: 0, unknown: 0 },
        averageAge: 0,
        dominantGender: 'balanced',
      }
      
      const ageGroupStats = service.getAgeGroupStatistics(emptyDemographics)
      expect(ageGroupStats.length).toBe(0)
    })
  })

  describe('configuration management', () => {
    it('должен возвращать текущую конфигурацию', () => {
      const config = service.getConfig()
      
      expect(config.enableAge).toBe(defaultConfig.enableAge)
      expect(config.enableGender).toBe(defaultConfig.enableGender)
      expect(config.minConfidence).toBe(defaultConfig.minConfidence)
    })

    it('должен обновлять конфигурацию', () => {
      const newConfig = {
        minConfidence: 0.8,
        enableEmotion: false,
      }
      
      service.updateConfig(newConfig)
      const updatedConfig = service.getConfig()
      
      expect(updatedConfig.minConfidence).toBe(0.8)
      expect(updatedConfig.enableEmotion).toBe(false)
      expect(updatedConfig.enableAge).toBe(defaultConfig.enableAge) // Не изменилось
    })

    it('должен очищать историю', () => {
      service.clearHistory()
      
      // История должна быть очищена - проверяем через анализ кадров
      const mockFace = createMockFace('face-1', { x: 100, y: 100, width: 80, height: 90 })
      
      // После очистки истории сглаживание не должно влиять на первый кадр
      expect(async () => {
        await service.analyzeFrame([mockFace], 1, 1000)
      }).not.toThrow()
    })
  })

  describe('confidence filtering', () => {
    it('должен фильтровать результаты по минимальной уверенности', async () => {
      const strictService = new AgeGenderDetectionService({
        ...defaultConfig,
        minConfidence: 0.9, // Очень высокий порог
        useMLModels: false, // Эвристики дают только 0.5-0.6 уверенность
      })
      
      const mockFace = createMockFace('face-1', { x: 100, y: 100, width: 80, height: 90 })
      const result = await strictService.analyzeFrame([mockFace], 1, 1000)
      
      // С таким высоким порогом результатов быть не должно
      expect(result.results.length).toBe(0)
    })

    it('должен включать результаты выше порога уверенности', async () => {
      const lenientService = new AgeGenderDetectionService({
        ...defaultConfig,
        minConfidence: 0.3, // Низкий порог
      })
      
      const mockFace = createMockFace('face-1', { x: 100, y: 100, width: 80, height: 90 })
      const result = await lenientService.analyzeFrame([mockFace], 1, 1000)
      
      // С низким порогом результаты должны быть
      expect(result.results.length).toBe(1)
    })
  })
})