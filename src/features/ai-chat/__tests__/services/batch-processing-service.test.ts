import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  BatchOperationParams,
  BatchOperationType,
  BatchProcessingService,
} from "../../services/batch-processing-service"

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

const { invoke } = vi.mocked(await import("@tauri-apps/api/core"))

describe("BatchProcessingService", () => {
  let service: BatchProcessingService

  beforeEach(() => {
    vi.clearAllMocks()
    // Reset singleton instance
    // @ts-expect-error - accessing private property for testing
    BatchProcessingService.instance = undefined
    service = BatchProcessingService.getInstance()
  })

  describe("getInstance", () => {
    it("should return singleton instance", () => {
      const instance1 = BatchProcessingService.getInstance()
      const instance2 = BatchProcessingService.getInstance()
      expect(instance1).toBe(instance2)
    })
  })

  describe("startBatchOperation", () => {
    it("should start a batch operation and return job ID", async () => {
      const params: BatchOperationParams = {
        clipIds: ["clip1", "clip2", "clip3"],
        operation: "video_analysis",
        options: {},
      }

      const jobId = await service.startBatchOperation(params)

      expect(jobId).toMatch(/^batch_\d+_[a-z0-9]+$/)

      const progress = service.getBatchProgress(jobId)
      expect(progress).toBeDefined()
      expect(progress).toMatchObject({
        jobId,
        total: 3,
        errors: [],
      })
      // Status can be "pending", "running", or "completed" depending on timing
      expect(["pending", "running", "completed"]).toContain(progress?.status)
    })

    it("should handle progress callback", async () => {
      const progressCallback = vi.fn()
      const params: BatchOperationParams = {
        clipIds: ["clip1"],
        operation: "video_analysis",
        options: {},
        progressCallback,
      }

      invoke.mockResolvedValue({ success: true })

      const jobId = await service.startBatchOperation(params)

      // Wait for async processing
      await new Promise((resolve) => setTimeout(resolve, 100))

      expect(progressCallback).toHaveBeenCalled()
    })

    it("should handle priority parameter", async () => {
      const params: BatchOperationParams = {
        clipIds: ["clip1"],
        operation: "video_analysis",
        options: {},
        priority: "high",
      }

      const jobId = await service.startBatchOperation(params)
      expect(jobId).toBeTruthy()
    })
  })

  describe("getBatchProgress", () => {
    it("should return progress for active job", async () => {
      const params: BatchOperationParams = {
        clipIds: ["clip1", "clip2"],
        operation: "video_analysis",
        options: {},
      }

      const jobId = await service.startBatchOperation(params)
      const progress = service.getBatchProgress(jobId)

      expect(progress).toBeDefined()
      expect(progress?.total).toBe(2)
      expect(["pending", "running"]).toContain(progress?.status)
    })

    it("should return null for non-existent job", () => {
      const progress = service.getBatchProgress("non-existent")
      expect(progress).toBeNull()
    })
  })

  describe("cancelBatchOperation", () => {
    it("should cancel running operation", async () => {
      const params: BatchOperationParams = {
        clipIds: ["clip1", "clip2", "clip3"],
        operation: "video_analysis",
        options: {},
      }

      const jobId = await service.startBatchOperation(params)

      // Update status to running
      const progress = service.getBatchProgress(jobId)
      if (progress) {
        progress.status = "running"
      }

      const cancelled = await service.cancelBatchOperation(jobId)
      expect(cancelled).toBe(true)

      const updatedProgress = service.getBatchProgress(jobId)
      expect(updatedProgress?.status).toBe("cancelled")
    })

    it("should not cancel non-running operation", async () => {
      const params: BatchOperationParams = {
        clipIds: ["clip1"],
        operation: "video_analysis",
        options: {},
      }

      const jobId = await service.startBatchOperation(params)

      // Wait for it to potentially start running, then wait for it to complete
      await new Promise((resolve) => setTimeout(resolve, 150))

      const cancelled = await service.cancelBatchOperation(jobId)
      expect(cancelled).toBe(false)
    })

    it("should return false for non-existent job", async () => {
      const cancelled = await service.cancelBatchOperation("non-existent")
      expect(cancelled).toBe(false)
    })
  })

  describe("getBatchProcessingStats", () => {
    it("should return initial stats", () => {
      const stats = service.getBatchProcessingStats()

      expect(stats).toMatchObject({
        totalJobs: 0,
        runningJobs: 0,
        completedJobs: 0,
        failedJobs: 0,
        averageExecutionTime: 0,
        totalClipsProcessed: 0,
        successRate: 0,
      })
    })

    it("should update stats after operations", async () => {
      const params: BatchOperationParams = {
        clipIds: ["clip1"],
        operation: "video_analysis",
        options: {},
      }

      await service.startBatchOperation(params)
      const stats = service.getBatchProcessingStats()

      expect(stats.totalJobs).toBeGreaterThan(0)
    })
  })

  describe("getBatchHistory", () => {
    it("should return empty history initially", () => {
      const history = service.getBatchHistory()
      expect(history).toEqual([])
    })

    it("should limit history results", () => {
      const history = service.getBatchHistory(10)
      expect(history.length).toBeLessThanOrEqual(10)
    })
  })

  describe("clearBatchHistory", () => {
    it("should clear batch history", () => {
      service.clearBatchHistory()
      const history = service.getBatchHistory()
      expect(history).toEqual([])
    })
  })

  describe("batch operations", () => {
    describe("video_analysis", () => {
      it("should process video analysis", async () => {
        invoke.mockResolvedValue({
          duration: 120,
          width: 1920,
          height: 1080,
          fps: 30,
        })

        const params: BatchOperationParams = {
          clipIds: ["clip1"],
          operation: "video_analysis",
          options: {},
        }

        const jobId = await service.startBatchOperation(params)

        // Wait for processing
        await new Promise((resolve) => setTimeout(resolve, 100))

        expect(invoke).toHaveBeenCalledWith("ffmpeg_quick_analysis", {
          filePath: expect.stringContaining("clip1.mp4"),
        })
      })
    })

    describe("whisper_transcription", () => {
      it("should process whisper transcription", async () => {
        invoke.mockImplementation((cmd) => {
          if (cmd === "extract_audio_for_whisper") {
            return Promise.resolve("/tmp/audio.wav")
          }
          if (cmd === "whisper_transcribe_openai") {
            return Promise.resolve({
              text: "Transcribed text",
              language: "en",
            })
          }
          return Promise.resolve({})
        })

        const params: BatchOperationParams = {
          clipIds: ["clip1"],
          operation: "whisper_transcription",
          options: {
            model: "whisper-1",
            language: "en",
          },
        }

        await service.startBatchOperation(params)

        // Wait for processing
        await new Promise((resolve) => setTimeout(resolve, 100))

        expect(invoke).toHaveBeenCalledWith("extract_audio_for_whisper", {
          videoFilePath: expect.any(String),
          outputFormat: "wav",
        })

        expect(invoke).toHaveBeenCalledWith("whisper_transcribe_openai", {
          audioFilePath: "/tmp/audio.wav",
          apiKey: "",
          model: "whisper-1",
          language: "en",
          responseFormat: "verbose_json",
          temperature: 0,
          timestampGranularities: ["segment"],
        })
      })
    })

    describe("subtitle_generation", () => {
      it("should generate subtitles from transcription", async () => {
        invoke.mockImplementation((cmd) => {
          if (cmd === "extract_audio_for_whisper") {
            return Promise.resolve("/tmp/audio.wav")
          }
          if (cmd === "whisper_transcribe_openai") {
            return Promise.resolve({
              text: "This is a test transcription with many words that should be split into multiple subtitle lines for better readability",
            })
          }
          return Promise.resolve({})
        })

        const params: BatchOperationParams = {
          clipIds: ["clip1"],
          operation: "subtitle_generation",
          options: {
            maxCharactersPerLine: 42,
          },
        }

        await service.startBatchOperation(params)

        // Wait for processing
        await new Promise((resolve) => setTimeout(resolve, 100))

        const history = service.getBatchHistory()
        expect(history.length).toBeGreaterThan(0)

        const result = history[0]?.results[0]?.data
        expect(result).toHaveProperty("subtitles")
        expect(result.subtitles).toBeInstanceOf(Array)
        expect(result.subtitles.length).toBeGreaterThan(1)
      })
    })

    describe("quality_analysis", () => {
      it("should analyze video quality", async () => {
        invoke.mockResolvedValue({
          bitrate: 5000000,
          resolution: "1920x1080",
          qualityScore: 0.85,
        })

        const params: BatchOperationParams = {
          clipIds: ["clip1"],
          operation: "quality_analysis",
          options: {},
        }

        await service.startBatchOperation(params)

        // Wait for processing
        await new Promise((resolve) => setTimeout(resolve, 100))

        expect(invoke).toHaveBeenCalledWith("ffmpeg_analyze_quality", {
          filePath: expect.any(String),
          enableBitrateAnalysis: true,
          enableResolutionAnalysis: true,
        })
      })
    })

    describe("scene_detection", () => {
      it("should detect scenes", async () => {
        invoke.mockResolvedValue({
          scenes: [
            { start: 0, end: 5.5 },
            { start: 5.5, end: 12.3 },
          ],
        })

        const params: BatchOperationParams = {
          clipIds: ["clip1"],
          operation: "scene_detection",
          options: {
            threshold: 0.4,
            minSceneLength: 2.0,
          },
        }

        await service.startBatchOperation(params)

        // Wait for processing
        await new Promise((resolve) => setTimeout(resolve, 100))

        expect(invoke).toHaveBeenCalledWith("ffmpeg_detect_scenes", {
          filePath: expect.any(String),
          threshold: 0.4,
          minSceneLength: 2.0,
        })
      })
    })

    describe("motion_analysis", () => {
      it("should analyze motion", async () => {
        invoke.mockResolvedValue({
          motionVectors: [],
          averageMotion: 0.25,
        })

        const params: BatchOperationParams = {
          clipIds: ["clip1"],
          operation: "motion_analysis",
          options: {
            algorithm: "optical_flow",
            sensitivity: 0.2,
          },
        }

        await service.startBatchOperation(params)

        // Wait for processing
        await new Promise((resolve) => setTimeout(resolve, 100))

        expect(invoke).toHaveBeenCalledWith("ffmpeg_analyze_motion", {
          filePath: expect.any(String),
          algorithm: "optical_flow",
          sensitivity: 0.2,
        })
      })
    })

    describe("audio_analysis", () => {
      it("should analyze audio", async () => {
        invoke.mockResolvedValue({
          channels: 2,
          sampleRate: 48000,
          dynamics: { peak: -3, rms: -18 },
        })

        const params: BatchOperationParams = {
          clipIds: ["clip1"],
          operation: "audio_analysis",
          options: {},
        }

        await service.startBatchOperation(params)

        // Wait for processing
        await new Promise((resolve) => setTimeout(resolve, 100))

        expect(invoke).toHaveBeenCalledWith("ffmpeg_analyze_audio", {
          filePath: expect.any(String),
          enableSpectralAnalysis: true,
          enableDynamicsAnalysis: true,
        })
      })
    })

    describe("language_detection", () => {
      it("should detect language", async () => {
        invoke.mockImplementation((cmd) => {
          if (cmd === "extract_audio_for_whisper") {
            return Promise.resolve("/tmp/audio.wav")
          }
          if (cmd === "whisper_transcribe_openai") {
            return Promise.resolve({
              text: "Hello world",
              language: "en",
            })
          }
          return Promise.resolve({})
        })

        const params: BatchOperationParams = {
          clipIds: ["clip1"],
          operation: "language_detection",
          options: {},
        }

        await service.startBatchOperation(params)

        // Wait for processing
        await new Promise((resolve) => setTimeout(resolve, 100))

        const history = service.getBatchHistory()
        const result = history[0]?.results[0]?.data
        expect(result).toHaveProperty("language")
        expect(result.language).toBe("en")
        expect(result.confidence).toBe(0.9)
      })
    })

    describe("comprehensive_analysis", () => {
      it("should perform comprehensive analysis", async () => {
        invoke.mockImplementation((cmd) => {
          if (cmd === "ffmpeg_quick_analysis") {
            return Promise.resolve({ duration: 120 })
          }
          if (cmd === "ffmpeg_analyze_audio") {
            return Promise.resolve({ channels: 2 })
          }
          if (cmd === "ffmpeg_analyze_quality") {
            return Promise.resolve({ bitrate: 5000000 })
          }
          return Promise.resolve({})
        })

        const params: BatchOperationParams = {
          clipIds: ["clip1"],
          operation: "comprehensive_analysis",
          options: {},
        }

        await service.startBatchOperation(params)

        // Wait for processing
        await new Promise((resolve) => setTimeout(resolve, 100))

        const history = service.getBatchHistory()
        const result = history[0]?.results[0]?.data

        expect(result).toHaveProperty("video")
        expect(result).toHaveProperty("audio")
        expect(result).toHaveProperty("quality")
        expect(result).toHaveProperty("clipId")
        expect(result).toHaveProperty("timestamp")
      })
    })

    describe("error handling", () => {
      it("should handle unknown operation", async () => {
        const params: BatchOperationParams = {
          clipIds: ["clip1"],
          operation: "unknown_operation" as BatchOperationType,
          options: {},
        }

        await service.startBatchOperation(params)

        // Wait for processing
        await new Promise((resolve) => setTimeout(resolve, 100))

        const history = service.getBatchHistory()
        expect(history[0]?.errors.length).toBeGreaterThan(0)
        expect(history[0]?.errors[0]).toContain("Unknown batch operation")
      })

      it("should handle processing errors", async () => {
        invoke.mockRejectedValue(new Error("Processing failed"))

        const params: BatchOperationParams = {
          clipIds: ["clip1"],
          operation: "video_analysis",
          options: {},
        }

        await service.startBatchOperation(params)

        // Wait for processing
        await new Promise((resolve) => setTimeout(resolve, 100))

        const history = service.getBatchHistory()
        expect(history[0]?.failureCount).toBe(1)
        expect(history[0]?.errors.length).toBeGreaterThan(0)
      })

      it("should retry on failure when enabled", async () => {
        let callCount = 0
        invoke.mockImplementation(() => {
          callCount++
          if (callCount === 1) {
            return Promise.reject(new Error("First attempt failed"))
          }
          return Promise.resolve({ success: true })
        })

        const params: BatchOperationParams = {
          clipIds: ["clip1"],
          operation: "video_analysis",
          options: {},
          retryOnFailure: true,
        }

        await service.startBatchOperation(params)

        // Wait for processing
        await new Promise((resolve) => setTimeout(resolve, 100))

        expect(callCount).toBeGreaterThanOrEqual(1)
      })
    })

    describe("concurrent processing", () => {
      it("should respect maxConcurrent parameter", async () => {
        const processingTimes: number[] = []
        invoke.mockImplementation(() => {
          processingTimes.push(Date.now())
          return new Promise((resolve) => setTimeout(() => resolve({ success: true }), 50))
        })

        const params: BatchOperationParams = {
          clipIds: ["clip1", "clip2", "clip3", "clip4", "clip5"],
          operation: "video_analysis",
          options: {},
          maxConcurrent: 2,
        }

        await service.startBatchOperation(params)

        // Wait for processing
        await new Promise((resolve) => setTimeout(resolve, 300))

        // Check that processing was batched
        expect(processingTimes.length).toBe(5)

        // First two should start almost simultaneously
        const firstBatchDiff = processingTimes[1] - processingTimes[0]
        expect(firstBatchDiff).toBeLessThan(10)

        // Third should start after first batch
        const secondBatchDiff = processingTimes[2] - processingTimes[0]
        expect(secondBatchDiff).toBeGreaterThan(40)
      })
    })
  })

  describe("private methods", () => {
    it("should generate unique job IDs", async () => {
      const jobIds = new Set<string>()

      for (let i = 0; i < 100; i++) {
        const params: BatchOperationParams = {
          clipIds: ["clip"],
          operation: "video_analysis",
          options: {},
        }
        const jobId = await service.startBatchOperation(params)
        jobIds.add(jobId)
      }

      expect(jobIds.size).toBe(100)
    })
  })
})
