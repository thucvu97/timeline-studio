import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { useVideoCompiler } from "../../hooks/use-video-compiler"
import { RenderStatus } from "../../types/render"

// Мокаем Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

// Мокаем @tauri-apps/api/event
vi.mock("@tauri-apps/api/event", () => ({
  listen: vi.fn(),
  emit: vi.fn(),
}))

// Мокаем sonner
vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
  },
}))

// Мокаем video compiler service
vi.mock("../../services/video-compiler-service", () => ({
  renderProject: vi.fn(),
  trackRenderProgress: vi.fn(),
}))

describe("useVideoCompiler", () => {
  let mockInvoke: any
  let mockRenderProject: any
  let mockTrackRenderProgress: any

  const mockProject: any = {
    version: "1.0.0",
    metadata: {
      name: "Test Project",
      created_at: new Date().toISOString(),
      modified_at: new Date().toISOString(),
    },
    timeline: {
      duration: 60,
      fps: 30,
      resolution: [1920, 1080],
      sample_rate: 48000,
      aspect_ratio: "Ratio16x9",
    },
    tracks: [],
    effects: [],
    transitions: [],
    filters: [],
    templates: [],
    style_templates: [],
    subtitles: [],
    settings: {
      export: {
        format: "MP4",
        quality: 85,
        video_bitrate: 5000,
        audio_bitrate: 192,
      },
      preview: {
        resolution: [1280, 720],
        fps: 30,
        quality: 75,
      },
      custom: {},
    },
  }

  beforeEach(async () => {
    vi.clearAllMocks()
    const { invoke } = await import("@tauri-apps/api/core")
    const { renderProject, trackRenderProgress } = await import("../../services/video-compiler-service")
    mockInvoke = vi.mocked(invoke)
    mockRenderProject = vi.mocked(renderProject)
    mockTrackRenderProgress = vi.mocked(trackRenderProgress)
  })

  it("should initialize with default state", () => {
    const { result } = renderHook(() => useVideoCompiler())

    expect(result.current.isRendering).toBe(false)
    expect(result.current.renderProgress).toBeNull()
    expect(result.current.activeJobs).toEqual([])
  })

  it("should start render successfully", async () => {
    const mockJobId = "job-123"
    mockRenderProject.mockResolvedValueOnce(mockJobId)
    mockTrackRenderProgress.mockImplementation((_jobId, callback) => {
      // Simulate progress update
      setTimeout(() => {
        callback({
          jobId: mockJobId,
          status: "processing" as RenderStatus,
          percentage: 50,
          currentFrame: 900,
          totalFrames: 1800,
          fps: 30,
          eta: 30,
        })
      }, 100)
    })

    const { result } = renderHook(() => useVideoCompiler())

    await act(async () => {
      await result.current.startRender(mockProject, "/output/video.mp4")
    })

    expect(mockRenderProject).toHaveBeenCalledWith(mockProject, "/output/video.mp4")
    expect(result.current.isRendering).toBe(true)

    await waitFor(() => {
      expect(result.current.renderProgress).toEqual({
        jobId: mockJobId,
        status: "processing",
        percentage: 50,
        currentFrame: 900,
        totalFrames: 1800,
        fps: 30,
        eta: 30,
      })
    })
  })

  it("should handle render error", async () => {
    const errorMessage = "Failed to start render"
    mockRenderProject.mockRejectedValueOnce(new Error(errorMessage))

    const { result } = renderHook(() => useVideoCompiler())

    await expect(result.current.startRender(mockProject, "/output/video.mp4")).rejects.toThrow(errorMessage)

    expect(result.current.isRendering).toBe(false)
  })

  it("should cancel render", async () => {
    const mockJobId = "job-123"
    mockInvoke.mockResolvedValueOnce(true)

    const { result } = renderHook(() => useVideoCompiler())

    await act(async () => {
      await result.current.cancelRender(mockJobId)
    })

    expect(mockInvoke).toHaveBeenCalledWith("cancel_render", { jobId: mockJobId })
  })

  it("should generate preview", async () => {
    const mockPreviewData = [1, 2, 3, 4]
    mockInvoke.mockResolvedValueOnce(mockPreviewData)

    const { result } = renderHook(() => useVideoCompiler())

    const preview = await result.current.generatePreview(mockProject, 10.5)

    expect(mockInvoke).toHaveBeenCalledWith("generate_preview", {
      projectSchema: mockProject,
      timestamp: 10.5,
    })

    expect(preview).toBeInstanceOf(Blob)
    expect(preview.type).toBe("image/jpeg")
  })

  it("should refresh active jobs", async () => {
    const mockJobs = [
      {
        jobId: "job-1",
        projectName: "Project 1",
        outputPath: "/output/video1.mp4",
        status: "processing" as RenderStatus,
        percentage: 30,
        currentFrame: 540,
        totalFrames: 1800,
        fps: 30,
        eta: 42,
        startTime: Date.now(),
      },
      {
        jobId: "job-2",
        projectName: "Project 2",
        outputPath: "/output/video2.mp4",
        status: "completed" as RenderStatus,
        percentage: 100,
        currentFrame: 1800,
        totalFrames: 1800,
        fps: 30,
        eta: 0,
        startTime: Date.now() - 60000,
        endTime: Date.now(),
      },
    ]

    mockInvoke.mockResolvedValueOnce(mockJobs)

    const { result } = renderHook(() => useVideoCompiler())

    await act(async () => {
      await result.current.refreshActiveJobs()
    })

    expect(mockInvoke).toHaveBeenCalledWith("get_active_jobs")
    expect(result.current.activeJobs).toEqual(mockJobs)
  })
})
