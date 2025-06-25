import { OutputFormat } from "@/types/video-compiler"
import type { ProjectSchema } from "@/types/video-compiler"
import type { TimelineProject as Timeline } from "@/features/timeline/types/timeline"
import { timelineToProjectSchema } from "@/features/timeline/utils/timeline-to-project"
import { AUDIO_BITRATE } from "../constants/export-constants"
import type { ExportSettings } from "../types/export-types"

/**
 * Default export settings for ProjectSchema
 */
const DEFAULT_EXPORT_SETTINGS = {
  format: OutputFormat.Mp4,
  quality: 85,
  video_bitrate: 8000,
  audio_bitrate: AUDIO_BITRATE,
  hardware_acceleration: true,
  ffmpeg_args: [] as string[],
}

/**
 * Default preview settings for ProjectSchema
 */
const DEFAULT_PREVIEW_SETTINGS = {
  resolution: [1280, 720] as [number, number],
  fps: 30,
  quality: 75,
}

/**
 * Convert frontend export format to backend OutputFormat
 */
export function formatToOutputFormat(format: string): OutputFormat {
  switch (format) {
    case "mp4":
      return OutputFormat.Mp4
    case "mov":
    case "quicktime":
      return OutputFormat.Mov
    case "webm":
      return OutputFormat.WebM
    default:
      return OutputFormat.Mp4
  }
}

/**
 * Convert quality preset to numeric value
 */
export function qualityToNumber(quality: string): number {
  switch (quality) {
    case "best":
      return 95
    case "good":
      return 85
    case "normal":
      return 75
    default:
      return 85
  }
}

/**
 * Builder class for creating ProjectSchema with custom settings
 */
export class ProjectSchemaBuilder {
  private projectSchema: ProjectSchema

  constructor(timeline: Timeline, projectName?: string) {
    this.projectSchema = timelineToProjectSchema(timeline, projectName)
  }

  /**
   * Apply export settings to the project schema
   */
  withExportSettings(exportSettings: Partial<ExportSettings>): this {
    // Update export format
    if (exportSettings.format) {
      this.projectSchema.settings.export.format = formatToOutputFormat(exportSettings.format)
    }

    // Update quality
    if (exportSettings.quality) {
      this.projectSchema.settings.export.quality = qualityToNumber(exportSettings.quality)
    }

    // Update video bitrate
    if (exportSettings.videoBitrate !== undefined) {
      this.projectSchema.settings.export.video_bitrate = exportSettings.videoBitrate
    }

    // Update audio bitrate (use default if not specified)
    this.projectSchema.settings.export.audio_bitrate = exportSettings.audioBitrate || AUDIO_BITRATE

    // Update GPU acceleration
    if (exportSettings.enableGPU !== undefined) {
      this.projectSchema.settings.export.hardware_acceleration = exportSettings.enableGPU
    }

    // Update resolution
    if (exportSettings.resolution) {
      this.projectSchema.timeline.resolution = exportSettings.resolution
    }

    // Update frame rate
    if (exportSettings.frameRate !== undefined) {
      this.projectSchema.timeline.fps = exportSettings.frameRate
    }

    return this
  }

  /**
   * Apply preview settings to the project schema
   */
  withPreviewSettings(previewSettings: {
    resolution?: [number, number]
    fps?: number
    quality?: number
  }): this {
    if (previewSettings.resolution) {
      this.projectSchema.settings.preview.resolution = previewSettings.resolution
    }

    if (previewSettings.fps !== undefined) {
      this.projectSchema.settings.preview.fps = previewSettings.fps
    }

    if (previewSettings.quality !== undefined) {
      this.projectSchema.settings.preview.quality = previewSettings.quality
    }

    return this
  }

  /**
   * Apply custom metadata
   */
  withMetadata(metadata: Partial<ProjectSchema["metadata"]>): this {
    this.projectSchema.metadata = {
      ...this.projectSchema.metadata,
      ...metadata,
    }

    return this
  }

  /**
   * Apply custom settings
   */
  withCustomSettings(customSettings: Record<string, any>): this {
    this.projectSchema.settings.custom = {
      ...this.projectSchema.settings.custom,
      ...customSettings,
    }

    return this
  }

  /**
   * Get the built ProjectSchema
   */
  build(): ProjectSchema {
    return this.projectSchema
  }

  /**
   * Create ProjectSchema with sensible defaults from Timeline
   */
  static createDefault(timeline: Timeline, projectName?: string): ProjectSchema {
    return new ProjectSchemaBuilder(timeline, projectName).build()
  }

  /**
   * Create ProjectSchema optimized for export
   */
  static createForExport(
    timeline: Timeline,
    exportSettings: ExportSettings,
    projectName?: string
  ): ProjectSchema {
    return new ProjectSchemaBuilder(timeline, projectName)
      .withExportSettings(exportSettings)
      .build()
  }

  /**
   * Create ProjectSchema optimized for preview
   */
  static createForPreview(
    timeline: Timeline,
    previewSettings?: {
      resolution?: [number, number]
      fps?: number
      quality?: number
    }
  ): ProjectSchema {
    const builder = new ProjectSchemaBuilder(timeline, "preview")

    // Always set preview settings, use defaults if not provided
    builder.withPreviewSettings({
      resolution: previewSettings?.resolution || DEFAULT_PREVIEW_SETTINGS.resolution,
      fps: previewSettings?.fps || DEFAULT_PREVIEW_SETTINGS.fps,
      quality: previewSettings?.quality || DEFAULT_PREVIEW_SETTINGS.quality,
    })

    return builder.build()
  }
}

/**
 * Get default export settings
 */
export function getDefaultExportSettings(): typeof DEFAULT_EXPORT_SETTINGS {
  return { ...DEFAULT_EXPORT_SETTINGS }
}

/**
 * Get default preview settings
 */
export function getDefaultPreviewSettings(): typeof DEFAULT_PREVIEW_SETTINGS {
  return { ...DEFAULT_PREVIEW_SETTINGS }
}