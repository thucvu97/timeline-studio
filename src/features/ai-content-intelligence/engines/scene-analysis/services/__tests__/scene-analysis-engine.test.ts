import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"

import { FFmpegAnalysisService } from "@/features/ai-chat/services/ffmpeg-analysis-service"
import { UnifiedAIService } from "@/features/ai-chat/services/unified-ai-service"
import type { Person } from "@/features/montage-planner/types"

import {
  ContentType,
  Genre,
  KeyMomentType,
  SceneType,
} from "../../../../shared/types/content-analysis"
import { CameraMovementType, LightingType, MotionDirection } from "../../types"
import { SceneAnalysisEngine } from "../scene-analysis-engine"
import { VisionService } from "../vision-service"

// Mock dependencies
vi.mock("@/features/ai-chat/services/ffmpeg-analysis-service")
vi.mock("@/features/ai-chat/services/unified-ai-service")
vi.mock("../vision-service")

// Create mock MediaFile
const createMockMediaFile = () => ({
  id: "test-media",
  path: "/path/to/test.mp4",
  name: "test.mp4",
  type: "video",
  duration: 120,
  size: 1024 * 1024 * 100,
  createdAt: new Date(),
  fps: 30,
  resolution: [1920, 1080] as [number, number],
})

// Create mock FFmpeg analysis results
const createMockFFmpegAnalysis = () => ({
  metadata: {
    duration: 120,
    fps: 30,
    resolution: { width: 1920, height: 1080 },
    codec: "h264",
    bitrate: 5000,
  },
  scenes: {
    scenes: [
      {
        startTime: 0,
        endTime: 30,
        frameCount: 900,
        score: 0.8,
      },
      {
        startTime: 30,
        endTime: 60,
        frameCount: 900,
        score: 0.75,
      },
      {
        startTime: 60,
        endTime: 90,
        frameCount: 900,
        score: 0.7,
      },
      {
        startTime: 90,
        endTime: 120,
        frameCount: 900,
        score: 0.85,
      },
    ],
  },
  quality: {
    average: 0.8,
    overall: 0.8,
    samples: [],
  },
  silence: {
    totalSilenceDuration: 10,
    speechPercentage: 70,
    silenceRanges: [],
  },
  motion: {
    averageMotion: 0.5,
    motionEvents: [],
  },
  keyFrames: {
    keyFrames: [
      { timestamp: 5, imagePath: "/tmp/frame1.jpg", confidence: 0.9 },
      { timestamp: 35, imagePath: "/tmp/frame2.jpg", confidence: 0.85 },
      { timestamp: 65, imagePath: "/tmp/frame3.jpg", confidence: 0.8 },
      { timestamp: 95, imagePath: "/tmp/frame4.jpg", confidence: 0.88 },
    ],
  },
  audio: {
    volume: { average: 0.6, max: 0.9, min: 0.2 },
    dynamics: { dynamicRange: 0.7 },
  },
})

// Create mock vision analysis results
const createMockVisionAnalysis = () => ({
  objects: [
    { 
      type: "person", 
      confidence: 0.95, 
      bbox: { x: 100, y: 100, width: 200, height: 300 },
      trackId: 1,
    },
    { 
      type: "car", 
      confidence: 0.85, 
      bbox: { x: 400, y: 200, width: 300, height: 200 },
      trackId: 2,
    },
  ],
  faces: [
    { 
      confidence: 0.9, 
      bbox: { x: 120, y: 120, width: 80, height: 100 },
      landmarks: [],
    },
  ],
  text: [
    { 
      text: "Hello World", 
      confidence: 0.88, 
      bbox: { x: 500, y: 50, width: 200, height: 50 },
    },
  ],
  activities: [
    { type: "walking", confidence: 0.75 },
    { type: "talking", confidence: 0.8 },
  ],
  composition: {
    ruleOfThirds: 0.8,
    symmetry: 0.6,
    balance: 0.7,
    leadingLines: true,
    goldenRatio: 0.65,
  },
})

describe("SceneAnalysisEngine", () => {
  let engine: SceneAnalysisEngine
  let mockFFmpegService: any
  let mockAIService: any
  let mockVisionService: any

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()

    // Mock FFmpegAnalysisService
    mockFFmpegService = {
      getInstance: vi.fn(),
      getVideoMetadata: vi.fn().mockResolvedValue(createMockFFmpegAnalysis().metadata),
      detectScenes: vi.fn().mockResolvedValue(createMockFFmpegAnalysis().scenes),
      analyzeQuality: vi.fn().mockResolvedValue(createMockFFmpegAnalysis().quality),
      detectSilence: vi.fn().mockResolvedValue(createMockFFmpegAnalysis().silence),
      analyzeMotion: vi.fn().mockResolvedValue(createMockFFmpegAnalysis().motion),
      extractKeyFrames: vi.fn().mockResolvedValue(createMockFFmpegAnalysis().keyFrames),
      extractFrame: vi.fn().mockResolvedValue(new Uint8Array(100)),
    }
    vi.mocked(FFmpegAnalysisService.getInstance).mockReturnValue(mockFFmpegService)

    // Mock UnifiedAIService
    mockAIService = {
      getInstance: vi.fn(),
      sendRequest: vi.fn().mockResolvedValue({
        content: "Scene analysis: This appears to be an action scene with dialogue.",
      }),
    }
    vi.mocked(UnifiedAIService.getInstance).mockReturnValue(mockAIService)

    // Mock VisionService
    mockVisionService = {
      getInstance: vi.fn(),
      initialize: vi.fn().mockResolvedValue(undefined),
      analyzeFrame: vi.fn().mockResolvedValue(createMockVisionAnalysis()),
      extractDominantColors: vi.fn().mockReturnValue(["#FF0000", "#00FF00", "#0000FF"]),
    }
    vi.mocked(VisionService.getInstance).mockReturnValue(mockVisionService)

    // Create engine instance
    engine = new SceneAnalysisEngine()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe("initialization", () => {
    it("should initialize successfully with default config", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})

      await engine.initialize()

      expect(engine._isReady).toBe(true)
      expect(VisionService.getInstance).toHaveBeenCalled()
      expect(mockVisionService.initialize).toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith("Scene Analysis Engine ready")

      consoleSpy.mockRestore()
    })

    it("should handle initialization errors", async () => {
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      mockVisionService.initialize.mockRejectedValueOnce(new Error("Vision init failed"))

      await expect(engine.initialize()).rejects.toThrow("Vision init failed")
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })

    it("should skip VisionService init when disabled", async () => {
      await engine.configure({
        vision: {
          enableObjectDetection: false,
          enableFaceDetection: false,
          enableTextRecognition: false,
          enableActivityDetection: false,
          confidenceThreshold: 0.5,
        },
      })

      await engine.initialize()

      expect(VisionService.getInstance).not.toHaveBeenCalled()
      expect(engine._isReady).toBe(true)
    })
  })

  describe("process", () => {
    beforeEach(async () => {
      await engine.initialize()
    })

    it("should process media file successfully", async () => {
      const mediaFile = createMockMediaFile()
      
      const result = await engine.process({ mediaFile })

      expect(result).toBeDefined()
      expect(result.scenes).toHaveLength(4)
      expect(result.keyMoments).toBeDefined()
      expect(result.classification).toBeDefined()
      expect(result.summary).toBeDefined()
      expect(result.timeline).toBeDefined()
      
      // Verify FFmpeg service calls
      expect(mockFFmpegService.getVideoMetadata).toHaveBeenCalledWith(mediaFile.path)
      expect(mockFFmpegService.detectScenes).toHaveBeenCalled()
      expect(mockFFmpegService.analyzeQuality).toHaveBeenCalled()
      expect(mockFFmpegService.detectSilence).toHaveBeenCalled()
      expect(mockFFmpegService.analyzeMotion).toHaveBeenCalled()
      expect(mockFFmpegService.extractKeyFrames).toHaveBeenCalled()
    })

    it("should throw error if not initialized", async () => {
      const uninitializedEngine = new SceneAnalysisEngine()
      const mediaFile = createMockMediaFile()

      await expect(uninitializedEngine.process({ mediaFile }))
        .rejects.toThrow("Scene Analysis Engine not initialized")
    })

    it("should analyze scenes with vision service", async () => {
      const mediaFile = createMockMediaFile()
      
      // Ensure extractFrame returns valid data
      mockFFmpegService.extractFrame.mockResolvedValue(new Uint8Array(100))
      
      const result = await engine.process({ mediaFile })

      // Verify vision analysis was performed
      expect(mockFFmpegService.extractFrame).toHaveBeenCalled()
      expect(mockVisionService.analyzeFrame).toHaveBeenCalled()
      expect(mockVisionService.extractDominantColors).toHaveBeenCalled()

      // Check that scenes have content analysis
      result.scenes.forEach(scene => {
        expect(scene.content).toBeDefined()
        expect(scene.content.objects).toBeDefined()
        expect(scene.content.faces).toBeDefined()
        expect(scene.content.dominantColors).toBeDefined()
      })
    })

    it("should identify persons from face detections", async () => {
      const mediaFile = createMockMediaFile()
      
      // Ensure extractFrame returns valid data and vision detects faces
      mockFFmpegService.extractFrame.mockResolvedValue(new Uint8Array(100))
      
      const result = await engine.process({ mediaFile })

      // Check person identification
      const scenesWithFaces = result.scenes.filter(
        scene => scene.content?.faces?.length > 0
      )
      expect(scenesWithFaces.length).toBeGreaterThan(0)
      
      scenesWithFaces.forEach(scene => {
        expect(scene.content.identifiedPersons).toBeDefined()
        expect(Array.isArray(scene.content.identifiedPersons)).toBe(true)
      })
    })

    it("should handle partial config override", async () => {
      const mediaFile = createMockMediaFile()
      const customConfig = {
        ffmpeg: {
          sceneThreshold: 0.5,
          minSceneLength: 2.0,
        },
      }

      await engine.process({ mediaFile }, customConfig)

      expect(mockFFmpegService.detectScenes).toHaveBeenCalledWith(
        mediaFile.path,
        expect.objectContaining({
          threshold: 0.5,
          minSceneLength: 2.0,
        })
      )
    })
  })

  describe("getCapabilities", () => {
    it("should return engine capabilities", async () => {
      await engine.initialize()
      
      const capabilities = engine.getCapabilities()

      expect(capabilities).toBeDefined()
      expect(capabilities.supportsStreaming).toBe(false)
      expect(capabilities.supportsBatch).toBe(true)
      expect(capabilities.maxBatchSize).toBe(10)
      expect(capabilities.supportedFormats).toContain("mp4")
      expect(capabilities.requiredResources).toBeDefined()
      expect(capabilities.requiredResources.requiresGPU).toBe(true)
      expect(capabilities.estimatedProcessingTime).toBeDefined()
    })

    it("should calculate estimated processing time", async () => {
      await engine.initialize()
      
      const capabilities = engine.getCapabilities()
      const mediaFile = createMockMediaFile()
      const estimatedTime = capabilities.estimatedProcessingTime({ mediaFile })

      expect(estimatedTime).toBe(12) // 120 seconds / 10
    })

    it("should not require GPU when vision is disabled", async () => {
      await engine.configure({
        vision: {
          enableObjectDetection: false,
          enableFaceDetection: false,
          enableTextRecognition: false,
          enableActivityDetection: false,
          confidenceThreshold: 0.5,
        },
      })
      await engine.initialize()

      const capabilities = engine.getCapabilities()
      expect(capabilities.requiredResources.requiresGPU).toBe(false)
    })
  })

  describe("configure", () => {
    it("should update configuration", async () => {
      const newConfig = {
        ffmpeg: {
          sceneThreshold: 0.5,
          minSceneLength: 2.0,
          keyframeInterval: 10.0,
          qualitySampleRate: 2.0,
        },
      }

      await engine.configure(newConfig)

      // Test that new config is used
      await engine.initialize()
      const mediaFile = createMockMediaFile()
      await engine.process({ mediaFile })

      expect(mockFFmpegService.detectScenes).toHaveBeenCalledWith(
        mediaFile.path,
        expect.objectContaining({
          threshold: 0.5,
          minSceneLength: 2.0,
        })
      )
    })
  })

  describe("scene analysis", () => {
    beforeEach(async () => {
      await engine.initialize()
    })

    it("should detect different scene types", async () => {
      const mediaFile = createMockMediaFile()
      
      // Mock scene type detection
      vi.spyOn(engine as any, "detectSceneType").mockImplementation((scene) => {
        if (scene.startTime === 0) return SceneType.ESTABLISHING
        if (scene.startTime === 30) return SceneType.ACTION
        if (scene.startTime === 60) return SceneType.DIALOGUE
        return SceneType.TRANSITION
      })

      const result = await engine.process({ mediaFile })

      expect(result.scenes[0].type).toBe(SceneType.ESTABLISHING)
      expect(result.scenes[1].type).toBe(SceneType.ACTION)
      expect(result.scenes[2].type).toBe(SceneType.DIALOGUE)
      expect(result.scenes[3].type).toBe(SceneType.TRANSITION)
    })

    it("should extract quality metrics for each scene", async () => {
      const mediaFile = createMockMediaFile()
      
      const result = await engine.process({ mediaFile })

      result.scenes.forEach(scene => {
        expect(scene.quality).toBeDefined()
        expect(scene.quality.overall).toBeGreaterThanOrEqual(0)
        expect(scene.quality.overall).toBeLessThanOrEqual(1)
      })
    })

    it("should extract keyframes for each scene", async () => {
      const mediaFile = createMockMediaFile()
      
      const result = await engine.process({ mediaFile })

      result.scenes.forEach(scene => {
        expect(scene.keyFrames).toBeDefined()
        expect(Array.isArray(scene.keyFrames)).toBe(true)
      })
    })
  })

  describe("key moment detection", () => {
    beforeEach(async () => {
      await engine.initialize()
    })

    it("should detect key moments", async () => {
      const mediaFile = createMockMediaFile()
      
      // Mock key moment detection
      vi.spyOn(engine as any, "detectKeyMoments").mockResolvedValue([
        {
          id: "moment-1",
          timestamp: 15,
          duration: 5,
          type: KeyMomentType.ACTION,
          confidence: 0.9,
          description: "Intense action sequence",
        },
        {
          id: "moment-2",
          timestamp: 75,
          duration: 10,
          type: KeyMomentType.EMOTIONAL,
          confidence: 0.85,
          description: "Emotional dialogue",
        },
      ])

      const result = await engine.process({ mediaFile })

      expect(result.keyMoments).toHaveLength(2)
      expect(result.keyMoments[0].type).toBe(KeyMomentType.ACTION)
      expect(result.keyMoments[1].type).toBe(KeyMomentType.EMOTIONAL)
    })
  })

  describe("content classification", () => {
    beforeEach(async () => {
      await engine.initialize()
    })

    it("should classify content", async () => {
      const mediaFile = createMockMediaFile()
      
      // Mock content classification
      vi.spyOn(engine as any, "classifyContent").mockResolvedValue({
        contentType: ContentType.NARRATIVE,
        genres: [Genre.ACTION, Genre.DRAMA],
        confidence: 0.88,
        themes: ["heroism", "redemption"],
        mood: "intense",
        pacing: "fast",
      })

      const result = await engine.process({ mediaFile })

      expect(result.classification).toBeDefined()
      expect(result.classification.contentType).toBe(ContentType.NARRATIVE)
      expect(result.classification.genres).toContain(Genre.ACTION)
      expect(result.classification.genres).toContain(Genre.DRAMA)
      expect(result.classification.confidence).toBe(0.88)
    })
  })

  describe("person tracking", () => {
    beforeEach(async () => {
      await engine.initialize()
    })

    it("should track persons across scenes", async () => {
      const mediaFile = createMockMediaFile()
      
      const result = await engine.process({ mediaFile })

      expect(result.persons).toBeDefined()
      expect(Array.isArray(result.persons)).toBe(true)
      
      if (result.persons.length > 0) {
        const person = result.persons[0]
        expect(person).toHaveProperty("id")
        expect(person).toHaveProperty("name")
        expect(person).toHaveProperty("confidence")
      }
    })

    it("should calculate person statistics", async () => {
      const mediaFile = createMockMediaFile()
      
      // Mock person detection
      vi.spyOn(engine as any, "identifyPersons").mockResolvedValue([
        { id: "person-1", name: "John Doe", confidence: 0.9 },
        { id: "person-2", name: "Jane Smith", confidence: 0.85 },
      ])

      const result = await engine.process({ mediaFile })

      expect(result.personStats).toBeDefined()
    })
  })

  describe("timeline generation", () => {
    beforeEach(async () => {
      await engine.initialize()
    })

    it("should generate timeline data", async () => {
      const mediaFile = createMockMediaFile()
      
      const result = await engine.process({ mediaFile })

      expect(result.timeline).toBeDefined()
      expect(result.timeline.duration).toBe(120)
      expect(result.timeline.segments).toBeDefined()
      expect(Array.isArray(result.timeline.segments)).toBe(true)
      expect(result.timeline.keyframes).toBeDefined()
    })
  })

  describe("summary generation", () => {
    beforeEach(async () => {
      await engine.initialize()
    })

    it("should generate analysis summary", async () => {
      const mediaFile = createMockMediaFile()
      
      const result = await engine.process({ mediaFile })

      expect(result.summary).toBeDefined()
      expect(result.summary.totalScenes).toBe(4)
      expect(result.summary.averageSceneDuration).toBe(30)
      expect(result.summary.dominantColors).toBeDefined()
      expect(result.summary.visualComplexity).toBeDefined()
      expect(result.summary.audioProfile).toBeDefined()
      expect(result.summary.audioProfile.hasSpeech).toBe(true)
      expect(result.summary.audioProfile.speechPercentage).toBe(70)
    })
  })

  describe("error handling", () => {
    beforeEach(async () => {
      await engine.initialize()
    })

    it("should handle FFmpeg service errors", async () => {
      const mediaFile = createMockMediaFile()
      mockFFmpegService.getVideoMetadata.mockRejectedValueOnce(new Error("FFmpeg failed"))

      await expect(engine.process({ mediaFile }))
        .rejects.toThrow("FFmpeg failed")
    })

    it("should handle vision service errors gracefully", async () => {
      const mediaFile = createMockMediaFile()
      
      // Ensure extractFrame returns data so vision service is called
      mockFFmpegService.extractFrame.mockResolvedValue(new Uint8Array(100))
      mockVisionService.analyzeFrame.mockRejectedValueOnce(new Error("Vision failed"))
      
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      // Should not throw, but log error
      const result = await engine.process({ mediaFile })
      
      expect(result).toBeDefined()
      expect(consoleErrorSpy).toHaveBeenCalled()

      consoleErrorSpy.mockRestore()
    })
  })
})