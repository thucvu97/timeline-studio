/**
 * Tests for Music Detection Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  MusicDetectionService, 
  MusicSegmentType, 
  MusicGenre, 
  MusicMood,
  type MusicDetectionConfig,
  type MusicSegment 
} from '../../services/music-detection'
import type { AudioAnalysisResult } from '@/shared/types/media-analysis'

// Mock FFmpeg service
vi.mock('@/features/ai-chat/services/ffmpeg-analysis-service', () => ({
  FFmpegAnalysisService: {
    getInstance: () => ({
      analyzeAudio: vi.fn(),
      getVideoMetadata: vi.fn(),
      detectSilence: vi.fn(),
    }),
  },
}))

describe('MusicDetectionService', () => {
  let service: MusicDetectionService

  const mockAudioAnalysis: AudioAnalysisResult = {
    volume: {
      average: 0.6,
      peak: 0.8,
      rms: 0.7,
    },
    frequency: {
      lowEnd: 0.5,
      midRange: 0.6,
      highEnd: 0.4,
    },
    dynamics: {
      dynamicRange: 0.7,
      compressionRatio: 0.3,
    },
    quality: {
      clipping: false,
      noiseLevel: 0.1,
      overallQuality: 0.8,
    },
  }

  const mockMetadata = {
    duration: 30,
    width: 1920,
    height: 1080,
    fps: 30,
    bitrate: 5000000,
    codec: 'h264',
    format: 'mp4',
    hasAudio: true,
    audioCodec: 'aac',
    audioChannels: 2,
    audioSampleRate: 44100,
    fileSize: 10000000,
  }

  const mockSilenceDetection = {
    silences: [
      { startTime: 5, endTime: 7, duration: 2, confidence: 0.9 },
      { startTime: 15, endTime: 17, duration: 2, confidence: 0.8 },
    ],
    totalSilenceDuration: 4,
    speechPercentage: 80,
  }

  beforeEach(() => {
    service = new MusicDetectionService()
    
    // Mock the FFmpeg service methods
    const mockFFmpegInstance = (service as any).ffmpegService
    mockFFmpegInstance.analyzeAudio.mockResolvedValue(mockAudioAnalysis)
    mockFFmpegInstance.getVideoMetadata.mockResolvedValue(mockMetadata)
    mockFFmpegInstance.detectSilence.mockResolvedValue(mockSilenceDetection)
  })

  describe('initialization', () => {
    it('должен инициализироваться с конфигурацией по умолчанию', () => {
      expect(service).toBeDefined()
      expect((service as any).config.analysis.enableGenreDetection).toBe(true)
      expect((service as any).config.analysis.enableTempoDetection).toBe(true)
      expect((service as any).config.filtering.minSegmentDuration).toBe(1.0)
    })

    it('должен принимать пользовательскую конфигурацию', () => {
      const customConfig: Partial<MusicDetectionConfig> = {
        analysis: {
          enableGenreDetection: false,
          enableTempoDetection: true,
          enableKeyDetection: false,
          enableMoodDetection: false,
          enableInstrumentDetection: false,
          enableVocalDetection: false,
        },
        filtering: {
          minSegmentDuration: 2.0,
          confidenceThreshold: 0.6,
          mergeNearbySegments: false,
          mergeGapThreshold: 1.0,
        },
      }

      const customService = new MusicDetectionService(customConfig)
      expect((customService as any).config.analysis.enableGenreDetection).toBe(false)
      expect((customService as any).config.filtering.minSegmentDuration).toBe(2.0)
    })
  })

  describe('detectMusic', () => {
    it('должен анализировать музыкальный контент файла', async () => {
      const filePath = '/test/audio.mp4'
      
      const result = await service.detectMusic(filePath)

      expect(result).toBeDefined()
      expect(result.segments).toBeInstanceOf(Array)
      expect(result.summary).toBeDefined()
      expect(result.timeline).toBeDefined()
      
      // Проверяем, что были вызваны методы FFmpeg
      const mockFFmpegInstance = (service as any).ffmpegService
      expect(mockFFmpegInstance.analyzeAudio).toHaveBeenCalledWith(filePath)
      expect(mockFFmpegInstance.getVideoMetadata).toHaveBeenCalledWith(filePath)
      expect(mockFFmpegInstance.detectSilence).toHaveBeenCalledWith(filePath, {
        threshold: -30,
        minDuration: 0.5,
      })
    })

    it('должен создавать сегменты на основе анализа', async () => {
      const filePath = '/test/audio.mp4'
      
      const result = await service.detectMusic(filePath)

      expect(result.segments.length).toBeGreaterThan(0)
      
      // Проверяем структуру сегментов
      result.segments.forEach(segment => {
        expect(segment).toMatchObject({
          id: expect.any(String),
          startTime: expect.any(Number),
          endTime: expect.any(Number),
          duration: expect.any(Number),
          confidence: expect.any(Number),
          type: expect.any(String),
        })
        expect(segment.startTime).toBeLessThan(segment.endTime)
        expect(segment.duration).toBe(segment.endTime - segment.startTime)
      })
    })

    it('должен классифицировать типы сегментов', async () => {
      const filePath = '/test/audio.mp4'
      
      const result = await service.detectMusic(filePath)

      // Проверяем, что есть сегменты с разными типами
      const segmentTypes = new Set(result.segments.map(s => s.type))
      expect(segmentTypes.size).toBeGreaterThan(0)
      
      // Проверяем, что типы валидны
      result.segments.forEach(segment => {
        expect(Object.values(MusicSegmentType)).toContain(segment.type)
      })
    })

    it('должен обрабатывать сегменты тишины', async () => {
      const filePath = '/test/audio.mp4'
      
      const result = await service.detectMusic(filePath)

      // Должны быть сегменты тишины соответствующие mock данным
      const silenceSegments = result.segments.filter(s => s.type === MusicSegmentType.SILENCE)
      expect(silenceSegments.length).toBeGreaterThan(0)
      
      // Проверяем, что сегменты тишины имеют правильные характеристики
      silenceSegments.forEach(segment => {
        expect(segment.volume).toBe(0)
        expect(segment.energy).toBe(0)
        expect(segment.confidence).toBeGreaterThan(0.8)
      })
    })
  })

  describe('segment classification', () => {
    it('должен определять музыкальные сегменты', async () => {
      // Создаем mock с характеристиками музыки
      const musicAudioAnalysis: AudioAnalysisResult = {
        ...mockAudioAnalysis,
        volume: { average: 0.7, peak: 0.9, rms: 0.8 },
        frequency: { lowEnd: 0.6, midRange: 0.6, highEnd: 0.5 },
        dynamics: { dynamicRange: 0.8, compressionRatio: 0.2 },
      }
      
      const mockFFmpegInstance = (service as any).ffmpegService
      mockFFmpegInstance.analyzeAudio.mockResolvedValue(musicAudioAnalysis)

      const result = await service.detectMusic('/test/music.mp4')
      
      const musicSegments = result.segments.filter(s => 
        s.type === MusicSegmentType.MUSIC || s.type === MusicSegmentType.MIXED
      )
      expect(musicSegments.length).toBeGreaterThan(0)
    })

    it('должен определять речевые сегменты', async () => {
      // Создаем mock с характеристиками речи
      const speechAudioAnalysis: AudioAnalysisResult = {
        ...mockAudioAnalysis,
        volume: { average: 0.5, peak: 0.7, rms: 0.6 },
        frequency: { lowEnd: 0.3, midRange: 0.8, highEnd: 0.3 }, // Преобладание средних частот
        dynamics: { dynamicRange: 0.5, compressionRatio: 0.4 },
      }
      
      const mockFFmpegInstance = (service as any).ffmpegService
      mockFFmpegInstance.analyzeAudio.mockResolvedValue(speechAudioAnalysis)

      const result = await service.detectMusic('/test/speech.mp4')
      
      const speechSegments = result.segments.filter(s => 
        s.type === MusicSegmentType.SPEECH || s.type === MusicSegmentType.MIXED
      )
      expect(speechSegments.length).toBeGreaterThan(0)
    })
  })

  describe('music analysis features', () => {
    beforeEach(() => {
      // Настраиваем service для анализа музыки
      const musicAudioAnalysis: AudioAnalysisResult = {
        ...mockAudioAnalysis,
        volume: { average: 0.7, peak: 0.9, rms: 0.8 },
        frequency: { lowEnd: 0.6, midRange: 0.6, highEnd: 0.5 },
        dynamics: { dynamicRange: 0.8, compressionRatio: 0.2 },
      }
      
      const mockFFmpegInstance = (service as any).ffmpegService
      mockFFmpegInstance.analyzeAudio.mockResolvedValue(musicAudioAnalysis)
    })

    it('должен определять жанр музыки', async () => {
      const result = await service.detectMusic('/test/music.mp4')
      
      const musicSegments = result.segments.filter(s => s.type === MusicSegmentType.MUSIC)
      if (musicSegments.length > 0) {
        const segmentsWithGenre = musicSegments.filter(s => s.genre)
        expect(segmentsWithGenre.length).toBeGreaterThan(0)
        
        segmentsWithGenre.forEach(segment => {
          expect(Object.values(MusicGenre)).toContain(segment.genre)
        })
      }
    })

    it('должен определять темп музыки', async () => {
      const result = await service.detectMusic('/test/music.mp4')
      
      const musicSegments = result.segments.filter(s => s.type === MusicSegmentType.MUSIC)
      if (musicSegments.length > 0) {
        const segmentsWithTempo = musicSegments.filter(s => s.tempo)
        expect(segmentsWithTempo.length).toBeGreaterThan(0)
        
        segmentsWithTempo.forEach(segment => {
          expect(segment.tempo).toBeGreaterThan(40) // Разумный диапазон BPM
          expect(segment.tempo).toBeLessThan(200)
        })
      }
    })

    it('должен определять настроение музыки', async () => {
      const result = await service.detectMusic('/test/music.mp4')
      
      const musicSegments = result.segments.filter(s => s.type === MusicSegmentType.MUSIC)
      if (musicSegments.length > 0) {
        const segmentsWithMood = musicSegments.filter(s => s.mood)
        expect(segmentsWithMood.length).toBeGreaterThan(0)
        
        segmentsWithMood.forEach(segment => {
          expect(Object.values(MusicMood)).toContain(segment.mood)
        })
      }
    })

    it('должен вычислять уровень энергии', async () => {
      const result = await service.detectMusic('/test/music.mp4')
      
      result.segments.forEach(segment => {
        expect(segment.energy).toBeGreaterThanOrEqual(0)
        expect(segment.energy).toBeLessThanOrEqual(1)
      })
    })

    it('должен определять вокальные характеристики', async () => {
      const result = await service.detectMusic('/test/music.mp4')
      
      const musicSegments = result.segments.filter(s => s.type === MusicSegmentType.MUSIC)
      if (musicSegments.length > 0) {
        const segmentsWithVocals = musicSegments.filter(s => s.vocals)
        expect(segmentsWithVocals.length).toBeGreaterThan(0)
        
        segmentsWithVocals.forEach(segment => {
          expect(segment.vocals).toMatchObject({
            hasVocals: expect.any(Boolean),
            confidence: expect.any(Number),
          })
          expect(segment.vocals!.confidence).toBeGreaterThanOrEqual(0)
          expect(segment.vocals!.confidence).toBeLessThanOrEqual(1)
        })
      }
    })
  })

  describe('summary generation', () => {
    it('должен создавать точную сводку', async () => {
      const result = await service.detectMusic('/test/audio.mp4')
      
      const { summary } = result
      expect(summary.totalDuration).toBe(mockMetadata.duration)
      expect(summary.musicPercentage).toBeGreaterThanOrEqual(0)
      expect(summary.musicPercentage).toBeLessThanOrEqual(100)
      
      // Проверяем, что продолжительности складываются правильно
      const calculatedTotal = summary.musicDuration + summary.speechDuration + summary.silenceDuration
      expect(Math.abs(calculatedTotal - summary.totalDuration)).toBeLessThan(2) // Допуск 2 секунды
    })

    it('должен определять доминирующие характеристики', async () => {
      const result = await service.detectMusic('/test/audio.mp4')
      
      const { summary } = result
      expect(summary.hasVocals).toBeDefined()
      expect(summary.energyProfile).toBeDefined()
      expect(summary.energyProfile.overall).toBeGreaterThanOrEqual(0)
      expect(summary.energyProfile.overall).toBeLessThanOrEqual(1)
      expect(summary.energyProfile.trend).toMatch(/increasing|decreasing|stable|variable/)
    })
  })

  describe('timeline generation', () => {
    it('должен создавать временную шкалу', async () => {
      const result = await service.detectMusic('/test/audio.mp4')
      
      const { timeline } = result
      expect(timeline.energyTimeline).toBeInstanceOf(Array)
      expect(timeline.volumeTimeline).toBeInstanceOf(Array)
      
      timeline.energyTimeline.forEach(point => {
        expect(point).toMatchObject({
          timestamp: expect.any(Number),
          energy: expect.any(Number),
        })
        expect(point.timestamp).toBeGreaterThanOrEqual(0)
        expect(point.energy).toBeGreaterThanOrEqual(0)
        expect(point.energy).toBeLessThanOrEqual(1)
      })
    })
  })

  describe('segment merging', () => {
    it('должен объединять близкие сегменты одного типа', async () => {
      const configWithMerging: Partial<MusicDetectionConfig> = {
        filtering: {
          minSegmentDuration: 0.5,
          confidenceThreshold: 0.3,
          mergeNearbySegments: true,
          mergeGapThreshold: 1.0,
        },
      }
      
      const serviceWithMerging = new MusicDetectionService(configWithMerging)
      
      // Mock FFmpeg service для нового service
      const mockFFmpegInstance = (serviceWithMerging as any).ffmpegService
      mockFFmpegInstance.analyzeAudio.mockResolvedValue(mockAudioAnalysis)
      mockFFmpegInstance.getVideoMetadata.mockResolvedValue(mockMetadata)
      mockFFmpegInstance.detectSilence.mockResolvedValue(mockSilenceDetection)

      const result = await serviceWithMerging.detectMusic('/test/audio.mp4')
      
      // Проверяем, что сегменты были объединены
      expect(result.segments.length).toBeGreaterThan(0)
      
      // Проверяем целостность временных диапазонов
      for (let i = 1; i < result.segments.length; i++) {
        expect(result.segments[i].startTime).toBeGreaterThanOrEqual(result.segments[i - 1].endTime)
      }
    })

    it('должен не объединять сегменты разных типов', async () => {
      const result = await service.detectMusic('/test/audio.mp4')
      
      // Проверяем, что есть переходы между типами сегментов
      const segmentTypes = result.segments.map(s => s.type)
      const uniqueTypes = new Set(segmentTypes)
      
      if (uniqueTypes.size > 1) {
        // Должны быть сегменты разных типов, не объединенные вместе
        for (let i = 1; i < result.segments.length; i++) {
          if (result.segments[i].type !== result.segments[i - 1].type) {
            // Проверяем, что они остались отдельными
            expect(result.segments[i].startTime).toBeGreaterThanOrEqual(result.segments[i - 1].endTime)
          }
        }
      }
    })
  })

  describe('error handling', () => {
    it('должен обрабатывать ошибки FFmpeg анализа', async () => {
      const mockFFmpegInstance = (service as any).ffmpegService
      mockFFmpegInstance.analyzeAudio.mockRejectedValue(new Error('FFmpeg failed'))

      await expect(service.detectMusic('/invalid/path.mp4')).rejects.toThrow('FFmpeg failed')
    })

    it('должен обрабатывать отсутствующие метаданные', async () => {
      const mockFFmpegInstance = (service as any).ffmpegService
      mockFFmpegInstance.getVideoMetadata.mockResolvedValue({ duration: 0 })

      const result = await service.detectMusic('/empty/file.mp4')
      expect(result.segments).toBeInstanceOf(Array)
      expect(result.summary.totalDuration).toBe(0)
    })
  })
})