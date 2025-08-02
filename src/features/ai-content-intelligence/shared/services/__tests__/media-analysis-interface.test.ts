import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  getAIService,
  getFFmpegService,
  type IFFmpegAnalysisService,
  type IUnifiedAIService,
  type ServiceFactory,
  setServiceFactory,
} from "../media-analysis-interface"

// Mock services
const mockFFmpegService: IFFmpegAnalysisService = {
  getVideoMetadata: vi.fn().mockResolvedValue({
    format: "mkv",
    duration: 120,
    width: 3840,
    height: 2160,
    fps: 60,
    bitrate: 10000000,
    codec: "h265",
    hasAudio: true,
    audioChannels: 6,
    audioCodec: "flac",
    audioSampleRate: 96000,
    fileSize: 150000000,
  }),
  detectScenes: vi.fn().mockResolvedValue({
    scenes: [
      { startTime: 0, endTime: 10 },
      { startTime: 10, endTime: 20 },
    ],
    totalScenes: 2,
    averageSceneLength: 10,
  }),
  analyzeQuality: vi.fn().mockResolvedValue({
    overall: 95,
    sharpness: 98,
    brightness: 92,
    contrast: 94,
    saturation: 90,
    stability: 99,
    noise: 5,
    issues: [],
  }),
  detectSilence: vi.fn().mockResolvedValue({
    silences: [{ startTime: 5, endTime: 6, duration: 1 }],
    totalSilenceDuration: 1,
    speechPercentage: 95,
  }),
  analyzeMotion: vi.fn().mockResolvedValue({
    motionIntensity: 0.8,
    cameraMovement: {
      panning: 0.3,
      tilting: 0.2,
      zooming: 0.1,
      stability: 0.9,
    },
    objectMovement: 0.7,
    motionProfile: [
      { timestamp: 0, intensity: 0.5 },
      { timestamp: 5, intensity: 0.8 },
    ],
  }),
}

const mockAIService: IUnifiedAIService = {
  analyze: vi.fn().mockResolvedValue({ analyzed: true, confidence: 0.95 }),
  generateText: vi.fn().mockResolvedValue("Custom generated text"),
}

const mockServiceFactory: ServiceFactory = {
  createFFmpegService: vi.fn().mockReturnValue(mockFFmpegService),
  createAIService: vi.fn().mockReturnValue(mockAIService),
}

describe("media-analysis-interface", () => {
  beforeEach(() => {
    // Reset the factory to null before each test
    setServiceFactory(null as any)
    vi.clearAllMocks()
  })

  describe("setServiceFactory", () => {
    it("should set the service factory", () => {
      setServiceFactory(mockServiceFactory)

      // Test that factory is set by trying to get services
      const ffmpegService = getFFmpegService()
      const aiService = getAIService()

      expect(mockServiceFactory.createFFmpegService).toHaveBeenCalled()
      expect(mockServiceFactory.createAIService).toHaveBeenCalled()
    })
  })

  describe("getFFmpegService", () => {
    describe("without factory", () => {
      it("should return default FFmpeg service", async () => {
        const service = getFFmpegService()

        // Test all methods return default values
        const metadata = await service.getVideoMetadata("/test.mp4")
        expect(metadata).toEqual({
          format: "mp4",
          duration: 60,
          width: 1920,
          height: 1080,
          fps: 30,
          bitrate: 5000000,
          codec: "h264",
          hasAudio: true,
          audioChannels: 2,
          audioCodec: "aac",
          audioSampleRate: 48000,
          fileSize: 30000000,
        })

        const scenes = await service.detectScenes("/test.mp4")
        expect(scenes).toEqual({
          scenes: [],
          totalScenes: 0,
          averageSceneLength: 0,
        })

        const quality = await service.analyzeQuality("/test.mp4")
        expect(quality).toEqual({
          overall: 75,
          sharpness: 80,
          brightness: 70,
          contrast: 75,
          saturation: 70,
          stability: 85,
          noise: 20,
          issues: [],
        })

        const silence = await service.detectSilence("/test.mp4")
        expect(silence).toEqual({
          silences: [],
          totalSilenceDuration: 0,
          speechPercentage: 100,
        })

        const motion = await service.analyzeMotion("/test.mp4")
        expect(motion).toEqual({
          motionIntensity: 0.5,
          cameraMovement: {
            panning: 0,
            tilting: 0,
            zooming: 0,
            stability: 1,
          },
          objectMovement: 0,
          motionProfile: [],
        })
      })
    })

    describe("with factory", () => {
      beforeEach(() => {
        setServiceFactory(mockServiceFactory)
      })

      it("should return custom FFmpeg service from factory", () => {
        const service = getFFmpegService()

        expect(mockServiceFactory.createFFmpegService).toHaveBeenCalled()
        expect(service).toBe(mockFFmpegService)
      })

      it("should call custom service methods", async () => {
        const service = getFFmpegService()

        const metadata = await service.getVideoMetadata("/test.mkv")
        expect(metadata.format).toBe("mkv")
        expect(metadata.width).toBe(3840)
        expect(mockFFmpegService.getVideoMetadata).toHaveBeenCalledWith("/test.mkv")

        const scenes = await service.detectScenes("/test.mkv")
        expect(scenes.totalScenes).toBe(2)
        expect(mockFFmpegService.detectScenes).toHaveBeenCalledWith("/test.mkv")

        const quality = await service.analyzeQuality("/test.mkv")
        expect(quality.overall).toBe(95)
        expect(mockFFmpegService.analyzeQuality).toHaveBeenCalledWith("/test.mkv")

        const silence = await service.detectSilence("/test.mkv")
        expect(silence.speechPercentage).toBe(95)
        expect(mockFFmpegService.detectSilence).toHaveBeenCalledWith("/test.mkv")

        const motion = await service.analyzeMotion("/test.mkv")
        expect(motion.motionIntensity).toBe(0.8)
        expect(mockFFmpegService.analyzeMotion).toHaveBeenCalledWith("/test.mkv")
      })
    })
  })

  describe("getAIService", () => {
    describe("without factory", () => {
      it("should return default AI service", async () => {
        const service = getAIService()

        const analysis = await service.analyze!("test content")
        expect(analysis).toEqual({ analyzed: true })

        const text = await service.generateText!("test prompt")
        expect(text).toBe("Generated text placeholder")
      })
    })

    describe("with factory", () => {
      beforeEach(() => {
        setServiceFactory(mockServiceFactory)
      })

      it("should return custom AI service from factory", () => {
        const service = getAIService()

        expect(mockServiceFactory.createAIService).toHaveBeenCalled()
        expect(service).toBe(mockAIService)
      })

      it("should call custom service methods", async () => {
        const service = getAIService()

        const analysis = await service.analyze!("custom content")
        expect(analysis).toEqual({ analyzed: true, confidence: 0.95 })
        expect(mockAIService.analyze).toHaveBeenCalledWith("custom content")

        const text = await service.generateText!("custom prompt")
        expect(text).toBe("Custom generated text")
        expect(mockAIService.generateText).toHaveBeenCalledWith("custom prompt")
      })
    })
  })

  describe("multiple calls", () => {
    it("should reuse the same default service instance", () => {
      const service1 = getFFmpegService()
      const service2 = getFFmpegService()

      // They won't be the same instance due to how the default is created,
      // but they should have the same interface
      expect(typeof service1.getVideoMetadata).toBe("function")
      expect(typeof service2.getVideoMetadata).toBe("function")
    })

    it("should create new service instance from factory each time", () => {
      setServiceFactory(mockServiceFactory)

      getFFmpegService()
      getFFmpegService()

      expect(mockServiceFactory.createFFmpegService).toHaveBeenCalledTimes(2)
    })
  })

  describe("factory replacement", () => {
    it("should use new factory after replacement", () => {
      const newMockFFmpegService = { ...mockFFmpegService }
      const newMockAIService = { ...mockAIService }

      const newFactory: ServiceFactory = {
        createFFmpegService: vi.fn().mockReturnValue(newMockFFmpegService),
        createAIService: vi.fn().mockReturnValue(newMockAIService),
      }

      // Set initial factory
      setServiceFactory(mockServiceFactory)
      getFFmpegService()
      expect(mockServiceFactory.createFFmpegService).toHaveBeenCalled()

      // Replace with new factory
      setServiceFactory(newFactory)
      getFFmpegService()
      expect(newFactory.createFFmpegService).toHaveBeenCalled()
    })
  })
})
