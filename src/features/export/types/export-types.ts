import { OutputFormat } from "@/types/video-compiler"

export interface ExportSettings {
  fileName: string
  savePath: string
  format: keyof typeof OutputFormat
  quality: "normal" | "good" | "best"
  resolution: "720" | "1080" | "4k"
  frameRate: string
  enableGPU: boolean
  advancedCompression?: boolean
  cloudBackup?: boolean
}

export interface DeviceExportSettings extends ExportSettings {
  device: "iphone" | "ipad" | "android"
  codec: "h264" | "h265"
}

export interface SocialExportSettings extends ExportSettings {
  socialNetwork: string
  isLoggedIn: boolean
  accountName?: string
  privacy?: "public" | "private" | "unlisted"
  title?: string
  description?: string
  tags?: string[]
  thumbnail?: string
  // TikTok specific
  useVerticalResolution?: boolean
  uploadDirectlyToTikTok?: boolean
  // YouTube specific
  category?: string
  language?: string
  // Telegram specific
  channelId?: string
  // Common
  useProxyMedia?: boolean
}

export type ExportMode = "local" | "device" | "social"

export interface ExportProgress {
  percentage: number
  message?: string
  jobId?: string
}

export interface SocialNetworkConfig {
  id: string
  name: string
  icon: string
  maxResolution: string
  maxFps: number
  recommendedFormats: readonly string[]
  aspectRatios: readonly string[]
}
