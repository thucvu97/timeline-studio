/**
 * AI инструмент для анализа медиа в плеере
 */

import { getCurrentMedia, parseFps } from "./utils/helpers"

import type { MediaAnalysisParams, PlayerToolResult } from "./types"
import type { ClaudeTool } from "../../services/claude-service"


export const analyzeCurrentMediaTool: ClaudeTool = {
  name: "analyze_current_media",
  description: "Анализирует текущее медиа в плеере и его характеристики",
  input_schema: {
    type: "object",
    properties: {
      includeMetadata: {
        type: "boolean",
        description: "Включить метаданные файла",
        default: true,
      },
      includeQualityMetrics: {
        type: "boolean",
        description: "Включить метрики качества",
        default: false,
      },
      includeFormatInfo: {
        type: "boolean",
        description: "Включить информацию о формате",
        default: true,
      },
      includeAudioInfo: {
        type: "boolean",
        description: "Включить информацию об аудио",
        default: true,
      },
      includeVideoInfo: {
        type: "boolean",
        description: "Включить информацию о видео",
        default: true,
      },
    },
  },
}

export async function analyzeCurrentMedia(params: MediaAnalysisParams): Promise<PlayerToolResult> {
  try {
    const currentMedia = getCurrentMedia()

    if (!currentMedia) {
      return {
        success: false,
        message: "Нет загруженного медиа для анализа",
        warnings: ["Загрузите медиа файл в плеер для анализа"],
      }
    }

    const analysis: any = {
      basic: {
        name: currentMedia.name,
        path: currentMedia.path,
        size: currentMedia.size,
        type: currentMedia.type || "unknown",
        duration: currentMedia.duration || 0,
        isPlaying: currentMedia.playbackPosition !== undefined,
      },
    }

    if (params.includeMetadata && currentMedia.metadata) {
      analysis.metadata = {
        createdAt: currentMedia.createdAt,
        modifiedAt: currentMedia.modifiedAt,
        title: currentMedia.metadata.title,
        description: currentMedia.metadata.description,
        tags: currentMedia.metadata.tags,
      }
    }

    if (params.includeVideoInfo && currentMedia.isVideo) {
      analysis.video = {
        width: currentMedia.width,
        height: currentMedia.height,
        aspectRatio:
          currentMedia.width && currentMedia.height ? (currentMedia.width / currentMedia.height).toFixed(2) : "unknown",
        fps: currentMedia.fps ? parseFps(currentMedia.fps.toString()) : 0,
        codec: currentMedia.probeData?.streams?.[0]?.codec_name || "unknown",
        bitrate: currentMedia.probeData?.streams?.[0]?.bit_rate || 0,
      }
    }

    if (params.includeAudioInfo && currentMedia.hasAudio) {
      const audioStream = currentMedia.probeData?.streams?.find((s) => s.codec_type === "audio")
      analysis.audio = {
        channels: audioStream?.channels || 0,
        sampleRate: audioStream?.sample_rate || 0,
        codec: audioStream?.codec_name || "unknown",
        bitrate: audioStream?.bit_rate || 0,
      }
    }

    if (params.includeFormatInfo && currentMedia.probeData?.format) {
      analysis.format = {
        formatName: currentMedia.probeData.format.format_name,
        formatLongName: currentMedia.probeData.format.format_long_name,
        startTime: currentMedia.probeData.format.start_time,
        bitRate: currentMedia.probeData.format.bit_rate,
      }
    }

    if (params.includeQualityMetrics) {
      analysis.quality = {
        resolution:
          currentMedia.width && currentMedia.height ? `${currentMedia.width}x${currentMedia.height}` : "unknown",
        estimatedQuality: calculateEstimatedQuality(currentMedia),
        fileSize: currentMedia.size ? `${(currentMedia.size / 1024 / 1024).toFixed(2)} MB` : "unknown",
      }
    }

    return {
      success: true,
      message: `Анализ медиа "${currentMedia.name}" завершен`,
      data: { analysis },
    }
  } catch (error) {
    return {
      success: false,
      message: `Ошибка анализа медиа: ${String(error)}`,
      errors: [String(error)],
    }
  }
}

function calculateEstimatedQuality(media: any): string {
  if (!media.width || !media.height) return "unknown"

  const pixels = media.width * media.height

  if (pixels >= 3840 * 2160) return "4K"
  if (pixels >= 2560 * 1440) return "2K"
  if (pixels >= 1920 * 1080) return "HD"
  if (pixels >= 1280 * 720) return "720p"
  if (pixels >= 854 * 480) return "480p"

  return "SD"
}
