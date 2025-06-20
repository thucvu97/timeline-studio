// Константы для экспорта видео

export const RESOLUTION_PRESETS = {
  timeline: {
    label: "Timeline Resolution",
    width: 1920, // Default fallback
    height: 1080,
  },
  "4k": {
    label: "3840x2160 (4K)",
    width: 3840,
    height: 2160,
  },
  "1440": {
    label: "2560x1440 (QHD)",
    width: 2560,
    height: 1440,
  },
  "1080": {
    label: "1920x1080 (Full HD)",
    width: 1920,
    height: 1080,
  },
  "720": {
    label: "1280x720 (HD)",
    width: 1280,
    height: 720,
  },
} as const

export const QUALITY_PRESETS = {
  best: {
    quality: 95,
    videoBitrate: 12000,
    label: "Best",
  },
  good: {
    quality: 85,
    videoBitrate: 8000,
    label: "Good",
  },
  normal: {
    quality: 75,
    videoBitrate: 4000,
    label: "Normal",
  },
} as const

export const FRAME_RATE_OPTIONS = [
  { value: "timeline", label: "Timeline Frame Rate" },
  { value: "24", label: "24 fps" },
  { value: "25", label: "25 fps" },
  { value: "30", label: "30 fps" },
  { value: "60", label: "60 fps" },
] as const

export const FORMAT_OPTIONS = [
  { value: "mp4", label: "MP4" },
  { value: "mov", label: "MOV" },
  { value: "quicktime", label: "QuickTime" },
  { value: "webm", label: "WebM" },
] as const

export const DEVICE_PRESETS = {
  iphone: {
    label: "iPhone",
    defaultResolution: "1080",
    defaultCodec: "h264",
    defaultFps: 30,
    defaultBitrate: 6000,
  },
  ipad: {
    label: "iPad",
    defaultResolution: "1080",
    defaultCodec: "h264",
    defaultFps: 30,
    defaultBitrate: 8000,
  },
  android: {
    label: "Android",
    defaultResolution: "1080",
    defaultCodec: "h264",
    defaultFps: 30,
    defaultBitrate: 6000,
  },
} as const

export const CODEC_OPTIONS = [
  { value: "h264", label: "H.264" },
  { value: "h265", label: "H.265" },
] as const

export const AUDIO_BITRATE = 192

export const SOCIAL_NETWORKS = [
  {
    id: "youtube",
    name: "YouTube",
    icon: "/youtube-new.svg",
    maxResolution: "4k",
    maxFps: 60,
    recommendedFormats: ["mp4", "mov"],
    aspectRatios: ["16:9", "9:16", "1:1"],
  },
  {
    id: "tiktok",
    name: "TikTok",
    icon: "/tiktok-new.svg",
    maxResolution: "1080",
    maxFps: 60,
    recommendedFormats: ["mp4"],
    aspectRatios: ["9:16"],
  },
  {
    id: "telegram",
    name: "Telegram",
    icon: "/telegram.svg",
    maxResolution: "720",
    maxFps: 30,
    recommendedFormats: ["mp4"],
    aspectRatios: ["16:9", "9:16", "1:1"],
  },
] as const
