import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  AspectRatio,
  OutputFormat,
  type RenderProgress,
  RenderStatus,
  TemplateType,
  TrackType,
  createEmptyProject,
  renderProject,
  toBackendParameter,
  toRustEnumCase,
  trackRenderProgress,
} from "../video-compiler"

// Mock Tauri API
const mockInvoke = vi.fn()
vi.mock("@tauri-apps/api/core", () => ({
  invoke: mockInvoke,
}))

describe("Video Compiler Types", () => {
  describe("toRustEnumCase", () => {
    it("should convert kebab-case to PascalCase", () => {
      expect(toRustEnumCase("multi-word-string")).toBe("MultiWordString")
      expect(toRustEnumCase("single")).toBe("Single")
      expect(toRustEnumCase("two-words")).toBe("TwoWords")
      expect(toRustEnumCase("custom-effect-type")).toBe("CustomEffectType")
    })

    it("should handle empty string", () => {
      expect(toRustEnumCase("")).toBe("")
    })

    it("should handle single character", () => {
      expect(toRustEnumCase("a")).toBe("A")
    })

    it("should handle string without dashes", () => {
      expect(toRustEnumCase("noDashes")).toBe("NoDashes")
    })
  })

  describe("toBackendParameter", () => {
    it("should convert integers to Int type", () => {
      expect(toBackendParameter(42)).toEqual({ type: "Int", value: 42 })
      expect(toBackendParameter(0)).toEqual({ type: "Int", value: 0 })
      expect(toBackendParameter(-100)).toEqual({ type: "Int", value: -100 })
    })

    it("should convert floats to Float type", () => {
      expect(toBackendParameter(3.14)).toEqual({ type: "Float", value: 3.14 })
      expect(toBackendParameter(0.5)).toEqual({ type: "Float", value: 0.5 })
      expect(toBackendParameter(-2.7)).toEqual({ type: "Float", value: -2.7 })
    })

    it("should convert strings to String type", () => {
      expect(toBackendParameter("hello")).toEqual({ type: "String", value: "hello" })
      expect(toBackendParameter("")).toEqual({ type: "String", value: "" })
      expect(toBackendParameter("multi word string")).toEqual({
        type: "String",
        value: "multi word string",
      })
    })

    it("should convert booleans to Bool type", () => {
      expect(toBackendParameter(true)).toEqual({ type: "Bool", value: true })
      expect(toBackendParameter(false)).toEqual({ type: "Bool", value: false })
    })

    it("should convert arrays to FloatArray type", () => {
      expect(toBackendParameter([1, 2, 3])).toEqual({
        type: "FloatArray",
        value: [1, 2, 3],
      })
      expect(toBackendParameter([])).toEqual({ type: "FloatArray", value: [] })
      expect(toBackendParameter([1.5, 2.7, 3.14])).toEqual({
        type: "FloatArray",
        value: [1.5, 2.7, 3.14],
      })
    })

    it("should convert other types to String by default", () => {
      expect(toBackendParameter(null)).toEqual({ type: "String", value: "null" })
      expect(toBackendParameter(undefined)).toEqual({ type: "String", value: "undefined" })
      expect(toBackendParameter({ key: "value" })).toEqual({
        type: "String",
        value: "[object Object]",
      })
    })
  })

  describe("createEmptyProject", () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date("2025-06-18T12:00:00.000Z"))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it("should create a project with default name", () => {
      const project = createEmptyProject()

      expect(project.version).toBe("1.0.0")
      expect(project.metadata.name).toBe("Untitled Project")
      expect(project.metadata.created_at).toBe("2025-06-18T12:00:00.000Z")
      expect(project.metadata.modified_at).toBe("2025-06-18T12:00:00.000Z")
    })

    it("should create a project with custom name", () => {
      const customName = "My Video Project"
      const project = createEmptyProject(customName)

      expect(project.metadata.name).toBe(customName)
      expect(project.version).toBe("1.0.0")
    })

    it("should have correct timeline defaults", () => {
      const project = createEmptyProject()

      expect(project.timeline).toEqual({
        duration: 0,
        fps: 30,
        resolution: [1920, 1080],
        sample_rate: 48000,
        aspect_ratio: AspectRatio.Ratio16x9,
      })
    })

    it("should initialize empty arrays for collections", () => {
      const project = createEmptyProject()

      expect(project.tracks).toEqual([])
      expect(project.effects).toEqual([])
      expect(project.transitions).toEqual([])
      expect(project.filters).toEqual([])
      expect(project.templates).toEqual([])
      expect(project.style_templates).toEqual([])
      expect(project.subtitles).toEqual([])
    })

    it("should have default export settings", () => {
      const project = createEmptyProject()

      expect(project.settings.export).toEqual({
        format: OutputFormat.Mp4,
        quality: 85,
        video_bitrate: 8000,
        audio_bitrate: 192,
        hardware_acceleration: true,
        ffmpeg_args: [],
      })
    })

    it("should have default preview settings", () => {
      const project = createEmptyProject()

      expect(project.settings.preview).toEqual({
        resolution: [1280, 720],
        fps: 30,
        quality: 75,
      })
    })

    it("should have empty custom settings", () => {
      const project = createEmptyProject()

      expect(project.settings.custom).toEqual({})
    })
  })

  describe("renderProject", () => {
    beforeEach(() => {
      mockInvoke.mockReset()
    })

    it("should call Tauri invoke with correct parameters", async () => {
      const project = createEmptyProject("Test Project")
      const outputPath = "/path/to/output.mp4"
      const expectedJobId = "job-123"

      mockInvoke.mockResolvedValue(expectedJobId)

      const result = await renderProject(project, outputPath)

      expect(mockInvoke).toHaveBeenCalledWith("compile_video", {
        projectSchema: project,
        outputPath,
      })
      expect(result).toBe(expectedJobId)
    })

    it("should handle render errors", async () => {
      const project = createEmptyProject()
      const outputPath = "/invalid/path"
      const error = new Error("Failed to compile")

      mockInvoke.mockRejectedValue(error)

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      await expect(renderProject(project, outputPath)).rejects.toThrow("Failed to compile")

      expect(consoleSpy).toHaveBeenCalledWith("Failed to start video compilation:", error)

      consoleSpy.mockRestore()
    })
  })

  describe("trackRenderProgress", () => {
    let timeoutSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      mockInvoke.mockReset()
      timeoutSpy = vi.spyOn(global, "setTimeout")
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.clearAllMocks()
      vi.useRealTimers()
      timeoutSpy.mockRestore()
    })

    it("should call progress callback with render progress", async () => {
      const jobId = "job-123"
      const onProgress = vi.fn()
      const mockProgress: RenderProgress = {
        job_id: jobId,
        stage: "encoding",
        percentage: 100,
        current_frame: 3000,
        total_frames: 3000,
        elapsed_time: 30000,
        estimated_remaining: 0,
        status: RenderStatus.Completed,
        message: "Rendering complete",
      }

      mockInvoke.mockResolvedValue(mockProgress)

      await trackRenderProgress(jobId, onProgress)

      expect(mockInvoke).toHaveBeenCalledWith("get_render_progress", { jobId })
      expect(onProgress).toHaveBeenCalledWith(mockProgress)
    })

    it("should handle completed status correctly", async () => {
      const jobId = "job-123"
      const onProgress = vi.fn()
      const completedProgress: RenderProgress = {
        job_id: jobId,
        stage: "encoding",
        percentage: 100,
        current_frame: 3000,
        total_frames: 3000,
        elapsed_time: 30000,
        estimated_remaining: 0,
        status: RenderStatus.Completed,
        message: "Rendering complete",
      }

      mockInvoke.mockResolvedValue(completedProgress)

      await trackRenderProgress(jobId, onProgress)

      expect(mockInvoke).toHaveBeenCalledWith("get_render_progress", { jobId })
      expect(onProgress).toHaveBeenCalledWith(completedProgress)
      // For completed status, no polling should occur
      expect(timeoutSpy).not.toHaveBeenCalled()
    })

    it("should handle null progress response", async () => {
      const jobId = "job-123"
      const onProgress = vi.fn()

      mockInvoke.mockResolvedValue(null)

      await trackRenderProgress(jobId, onProgress)

      expect(mockInvoke).toHaveBeenCalledWith("get_render_progress", { jobId })
      expect(onProgress).not.toHaveBeenCalled()
    })

    it("should handle invoke errors gracefully", async () => {
      const jobId = "job-123"
      const onProgress = vi.fn()
      const error = new Error("Network error")

      mockInvoke.mockRejectedValue(error)

      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})

      await trackRenderProgress(jobId, onProgress)

      expect(consoleSpy).toHaveBeenCalledWith("Failed to get render progress:", error)
      expect(onProgress).not.toHaveBeenCalled()

      consoleSpy.mockRestore()
    })
  })

  describe("Enum values", () => {
    it("should have correct AspectRatio values", () => {
      expect(AspectRatio.Ratio16x9).toBe("Ratio16x9")
      expect(AspectRatio.Ratio4x3).toBe("Ratio4x3")
      expect(AspectRatio.Ratio1x1).toBe("Ratio1x1")
      expect(AspectRatio.Ratio9x16).toBe("Ratio9x16")
      expect(AspectRatio.Custom).toBe("Custom")
    })

    it("should have correct OutputFormat values", () => {
      expect(OutputFormat.Mp4).toBe("Mp4")
      expect(OutputFormat.Mov).toBe("Mov")
      expect(OutputFormat.WebM).toBe("WebM")
    })

    it("should have correct RenderStatus values", () => {
      expect(RenderStatus.Queued).toBe("Queued")
      expect(RenderStatus.Processing).toBe("Processing")
      expect(RenderStatus.Completed).toBe("Completed")
      expect(RenderStatus.Failed).toBe("Failed")
      expect(RenderStatus.Cancelled).toBe("Cancelled")
    })

    it("should have correct TrackType values", () => {
      expect(TrackType.Video).toBe("Video")
      expect(TrackType.Audio).toBe("Audio")
      expect(TrackType.Subtitle).toBe("Subtitle")
    })

    it("should have correct TemplateType values", () => {
      expect(TemplateType.Vertical).toBe("Vertical")
      expect(TemplateType.Horizontal).toBe("Horizontal")
      expect(TemplateType.Diagonal).toBe("Diagonal")
      expect(TemplateType.Grid).toBe("Grid")
      expect(TemplateType.Custom).toBe("Custom")
    })
  })

  describe("Type structure validation", () => {
    it("should create a valid ProjectSchema structure", () => {
      const project = createEmptyProject()

      // Verify all required fields exist
      expect(project).toHaveProperty("version")
      expect(project).toHaveProperty("metadata")
      expect(project).toHaveProperty("timeline")
      expect(project).toHaveProperty("tracks")
      expect(project).toHaveProperty("effects")
      expect(project).toHaveProperty("transitions")
      expect(project).toHaveProperty("filters")
      expect(project).toHaveProperty("templates")
      expect(project).toHaveProperty("style_templates")
      expect(project).toHaveProperty("subtitles")
      expect(project).toHaveProperty("settings")

      // Verify metadata structure
      expect(project.metadata).toHaveProperty("name")
      expect(project.metadata).toHaveProperty("created_at")
      expect(project.metadata).toHaveProperty("modified_at")

      // Verify timeline structure
      expect(project.timeline).toHaveProperty("duration")
      expect(project.timeline).toHaveProperty("fps")
      expect(project.timeline).toHaveProperty("resolution")
      expect(project.timeline).toHaveProperty("sample_rate")
      expect(project.timeline).toHaveProperty("aspect_ratio")

      // Verify settings structure
      expect(project.settings).toHaveProperty("export")
      expect(project.settings).toHaveProperty("preview")
      expect(project.settings).toHaveProperty("custom")
    })
  })
})
