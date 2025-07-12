/**
 * Platform Configurations
 * Конфигурации для всех поддерживаемых платформ
 */

import { PlatformId, PlatformImportance } from "../../shared/types/platform-adaptation"

import type { Platform } from "../../shared/types/platform-adaptation"

type PlatformIdString =
  | "youtube"
  | "youtube_shorts"
  | "tiktok"
  | "instagram_reels"
  | "instagram_feed"
  | "instagram_stories"
  | "facebook"
  | "twitter"
  | "telegram"
  | "linkedin"
  | "vimeo"
  | "twitch"
  | "snapchat"

export const PLATFORM_CONFIGS: Record<PlatformIdString, Platform> = {
  youtube: {
    id: PlatformId.YOUTUBE,
    name: "YouTube",
    specifications: {
      videoSpecs: {
        resolution: [
          { width: 3840, height: 2160, preferred: true }, // 4K
          { width: 1920, height: 1080, preferred: true }, // 1080p
          { width: 1280, height: 720, preferred: false }, // 720p
        ],
        aspectRatio: [{ ratio: "16:9", width: 16, height: 9, preferred: true }],
        frameRate: [24, 25, 30, 48, 50, 60],
        codec: ["h264", "h265", "vp9"],
        bitrate: { min: 1000000, max: 68000000, recommended: 8000000 },
      },
      audioSpecs: {
        channels: [1, 2, 5.1],
        sampleRate: [48000],
        codec: ["aac", "opus"],
        bitrate: { min: 128000, max: 512000, recommended: 256000 },
      },
      duration: {
        min: 0,
        max: 43200, // 12 hours
        optimal: { min: 480, max: 1200 }, // 8-20 minutes
      },
      fileSize: {
        max: 137438953472, // 128 GB
        recommended: 8589934592, // 8 GB
      },
      features: {
        captions: true,
        hashtags: true,
        mentions: true,
        thumbnails: true,
        endScreens: true,
        chapters: true,
        polls: true,
        stickers: false,
      },
    },
    bestPractices: {
      engagement: {
        hookDuration: 15,
        ctaPlacement: [
          { timing: "beginning", duration: 5, type: "subscribe" },
          { timing: "end", duration: 20, type: "subscribe" },
        ],
        interactionPrompts: ["Like", "Subscribe", "Comment", "Share"],
      },
      content: {
        preferredTypes: ["tutorial", "vlog", "documentary", "music_video"],
        avoidTypes: [],
        toneRecommendations: ["Engaging", "Informative", "Entertaining"],
        visualStyle: ["High quality", "Good lighting", "Stable footage"],
      },
      timing: {
        optimalTimes: [
          { dayOfWeek: "tuesday", startHour: 14, endHour: 16, timezone: "UTC" },
          { dayOfWeek: "wednesday", startHour: 14, endHour: 16, timezone: "UTC" },
          { dayOfWeek: "thursday", startHour: 14, endHour: 16, timezone: "UTC" },
        ],
        frequency: { min: 1, max: 7, unit: "week" },
        consistency: "Regular upload schedule is key",
      },
      optimization: {
        seo: {
          titleLength: { min: 10, max: 70, optimal: 60 },
          descriptionLength: { min: 100, max: 5000, optimal: 200 },
          keywordDensity: 0.02,
          hashtagCount: { min: 3, max: 15, optimal: 8 },
        },
        thumbnails: {
          resolution: { width: 1280, height: 720, preferred: true },
          textOverlay: true,
          contrast: 0.7,
          brandingPlacement: "bottom-right",
        },
        accessibility: {
          captions: { required: true, languages: ["en"], accuracy: 0.95 },
          audioDescription: false,
          colorContrast: 4.5,
        },
      },
    },
    algorithms: {
      signals: [
        { type: "view_duration", importance: PlatformImportance.CRITICAL, timeframe: 48 },
        { type: "likes", importance: PlatformImportance.HIGH, timeframe: 24 },
        { type: "comments", importance: PlatformImportance.HIGH, timeframe: 24 },
        { type: "shares", importance: PlatformImportance.MEDIUM, timeframe: 72 },
      ],
      weights: [
        { signal: "view_duration", weight: 0.4 },
        { signal: "likes", weight: 0.2 },
        { signal: "comments", weight: 0.2 },
        { signal: "shares", weight: 0.1 },
        { signal: "saves", weight: 0.1 },
      ],
      penalties: [
        { type: "low_quality", severity: 0.8, description: "Poor video/audio quality" },
        { type: "clickbait", severity: 0.6, description: "Misleading title/thumbnail" },
      ],
    },
  },

  youtube_shorts: {
    id: PlatformId.YOUTUBE_SHORTS,
    name: "YouTube Shorts",
    specifications: {
      videoSpecs: {
        resolution: [
          { width: 1080, height: 1920, preferred: true }, // 9:16
          { width: 720, height: 1280, preferred: false },
        ],
        aspectRatio: [{ ratio: "9:16", width: 9, height: 16, preferred: true }],
        frameRate: [24, 25, 30, 60],
        codec: ["h264", "h265"],
        bitrate: { min: 1000000, max: 20000000, recommended: 5000000 },
      },
      audioSpecs: {
        channels: [1, 2],
        sampleRate: [48000],
        codec: ["aac"],
        bitrate: { min: 128000, max: 256000, recommended: 192000 },
      },
      duration: {
        min: 0,
        max: 60,
        optimal: { min: 15, max: 45 },
      },
      fileSize: {
        max: 2147483648, // 2 GB
        recommended: 104857600, // 100 MB
      },
      features: {
        captions: true,
        hashtags: true,
        mentions: true,
        thumbnails: false,
        endScreens: false,
        chapters: false,
        polls: false,
        stickers: true,
      },
    },
    bestPractices: {
      engagement: {
        hookDuration: 3,
        ctaPlacement: [{ timing: "middle", duration: 2, type: "follow" }],
        interactionPrompts: ["Swipe up", "Like", "Share"],
      },
      content: {
        preferredTypes: ["tutorial", "vlog", "commercial"],
        avoidTypes: ["documentary"],
        toneRecommendations: ["Quick", "Engaging", "Visual"],
        visualStyle: ["Vertical", "Fast-paced", "Eye-catching"],
      },
      timing: {
        optimalTimes: [
          { dayOfWeek: "monday", startHour: 6, endHour: 10, timezone: "UTC" },
          { dayOfWeek: "monday", startHour: 19, endHour: 23, timezone: "UTC" },
        ],
        frequency: { min: 3, max: 14, unit: "week" },
        consistency: "Multiple daily posts work well",
      },
      optimization: {
        seo: {
          titleLength: { min: 10, max: 100, optimal: 40 },
          descriptionLength: { min: 0, max: 100, optimal: 50 },
          keywordDensity: 0.03,
          hashtagCount: { min: 3, max: 30, optimal: 10 },
        },
        thumbnails: {
          resolution: { width: 1080, height: 1920, preferred: true },
          textOverlay: true,
          contrast: 0.8,
          brandingPlacement: "top",
        },
        accessibility: {
          captions: { required: true, languages: ["en"], accuracy: 0.9 },
          audioDescription: false,
          colorContrast: 4.5,
        },
      },
    },
    algorithms: {
      signals: [
        { type: "view_duration", importance: PlatformImportance.CRITICAL, timeframe: 24 },
        { type: "replays", importance: PlatformImportance.HIGH, timeframe: 24 },
        { type: "shares", importance: PlatformImportance.HIGH, timeframe: 24 },
      ],
      weights: [
        { signal: "view_duration", weight: 0.35 },
        { signal: "replays", weight: 0.25 },
        { signal: "shares", weight: 0.2 },
        { signal: "likes", weight: 0.2 },
      ],
      penalties: [{ type: "repost", severity: 0.7, description: "Reposted content" }],
    },
  },

  tiktok: {
    id: PlatformId.TIKTOK,
    name: "TikTok",
    specifications: {
      videoSpecs: {
        resolution: [
          { width: 1080, height: 1920, preferred: true },
          { width: 720, height: 1280, preferred: false },
        ],
        aspectRatio: [{ ratio: "9:16", width: 9, height: 16, preferred: true }],
        frameRate: [24, 25, 30, 60],
        codec: ["h264", "h265"],
        bitrate: { min: 1000000, max: 50000000, recommended: 8000000 },
      },
      audioSpecs: {
        channels: [2],
        sampleRate: [44100, 48000],
        codec: ["aac"],
        bitrate: { min: 96000, max: 256000, recommended: 128000 },
      },
      duration: {
        min: 3,
        max: 600, // 10 minutes
        optimal: { min: 15, max: 60 },
      },
      fileSize: {
        max: 4294967296, // 4 GB
        recommended: 524288000, // 500 MB
      },
      features: {
        captions: true,
        hashtags: true,
        mentions: true,
        thumbnails: true,
        endScreens: false,
        chapters: false,
        polls: true,
        stickers: true,
      },
    },
    bestPractices: {
      engagement: {
        hookDuration: 3,
        ctaPlacement: [{ timing: "end", duration: 3, type: "follow" }],
        interactionPrompts: ["Follow", "Like", "Share", "Comment"],
      },
      content: {
        preferredTypes: ["vlog", "music_video", "commercial", "tutorial"],
        avoidTypes: ["documentary"],
        toneRecommendations: ["Trendy", "Fun", "Authentic", "Creative"],
        visualStyle: ["Vertical", "Dynamic transitions", "Effects"],
      },
      timing: {
        optimalTimes: [
          { dayOfWeek: "tuesday", startHour: 6, endHour: 10, timezone: "EST" },
          { dayOfWeek: "thursday", startHour: 7, endHour: 11, timezone: "EST" },
          { dayOfWeek: "friday", startHour: 5, endHour: 9, timezone: "EST" },
        ],
        frequency: { min: 3, max: 21, unit: "week" },
        consistency: "3-5 posts per day optimal",
      },
      optimization: {
        seo: {
          titleLength: { min: 0, max: 150, optimal: 80 },
          descriptionLength: { min: 0, max: 2200, optimal: 150 },
          keywordDensity: 0.03,
          hashtagCount: { min: 3, max: 100, optimal: 5 },
        },
        thumbnails: {
          resolution: { width: 1080, height: 1920, preferred: true },
          textOverlay: false,
          contrast: 0.8,
          brandingPlacement: "none",
        },
        accessibility: {
          captions: { required: false, languages: ["en"], accuracy: 0.85 },
          audioDescription: false,
          colorContrast: 4.0,
        },
      },
    },
    algorithms: {
      signals: [
        { type: "view_duration", importance: PlatformImportance.CRITICAL, timeframe: 12 },
        { type: "shares", importance: PlatformImportance.CRITICAL, timeframe: 12 },
        { type: "comments", importance: PlatformImportance.HIGH, timeframe: 24 },
        { type: "profile_visits", importance: PlatformImportance.HIGH, timeframe: 24 },
      ],
      weights: [
        { signal: "view_duration", weight: 0.3 },
        { signal: "shares", weight: 0.25 },
        { signal: "comments", weight: 0.2 },
        { signal: "profile_visits", weight: 0.15 },
        { signal: "follow_rate", weight: 0.1 },
      ],
      penalties: [
        { type: "spam", severity: 0.9, description: "Spammy content" },
        { type: "repost", severity: 0.6, description: "Unoriginal content" },
      ],
    },
  },

  instagram_reels: {
    id: PlatformId.INSTAGRAM_REELS,
    name: "Instagram Reels",
    specifications: {
      videoSpecs: {
        resolution: [
          { width: 1080, height: 1920, preferred: true },
          { width: 1080, height: 1350, preferred: false },
        ],
        aspectRatio: [
          { ratio: "9:16", width: 9, height: 16, preferred: true },
          { ratio: "4:5", width: 4, height: 5, preferred: false },
        ],
        frameRate: [23.976, 24, 25, 29.97, 30, 60],
        codec: ["h264", "h265"],
        bitrate: { min: 1000000, max: 35000000, recommended: 5000000 },
      },
      audioSpecs: {
        channels: [1, 2],
        sampleRate: [44100, 48000],
        codec: ["aac"],
        bitrate: { min: 96000, max: 256000, recommended: 128000 },
      },
      duration: {
        min: 3,
        max: 90,
        optimal: { min: 15, max: 30 },
      },
      fileSize: {
        max: 1073741824, // 1 GB
        recommended: 104857600, // 100 MB
      },
      features: {
        captions: true,
        hashtags: true,
        mentions: true,
        thumbnails: true,
        endScreens: false,
        chapters: false,
        polls: false,
        stickers: true,
      },
    },
    bestPractices: {
      engagement: {
        hookDuration: 3,
        ctaPlacement: [{ timing: "end", duration: 2, type: "follow" }],
        interactionPrompts: ["Double tap", "Comment", "Share", "Save"],
      },
      content: {
        preferredTypes: ["vlog", "tutorial", "music_video", "commercial"],
        avoidTypes: ["documentary", "news"],
        toneRecommendations: ["Aesthetic", "Trendy", "Inspirational"],
        visualStyle: ["High quality", "Filtered", "On-brand"],
      },
      timing: {
        optimalTimes: [
          { dayOfWeek: "monday", startHour: 11, endHour: 13, timezone: "EST" },
          { dayOfWeek: "tuesday", startHour: 11, endHour: 13, timezone: "EST" },
          { dayOfWeek: "wednesday", startHour: 11, endHour: 13, timezone: "EST" },
        ],
        frequency: { min: 4, max: 14, unit: "week" },
        consistency: "Daily posting recommended",
      },
      optimization: {
        seo: {
          titleLength: { min: 0, max: 2200, optimal: 125 },
          descriptionLength: { min: 0, max: 2200, optimal: 125 },
          keywordDensity: 0.02,
          hashtagCount: { min: 3, max: 30, optimal: 10 },
        },
        thumbnails: {
          resolution: { width: 1080, height: 1920, preferred: true },
          textOverlay: true,
          contrast: 0.7,
          brandingPlacement: "subtle",
        },
        accessibility: {
          captions: { required: false, languages: ["en"], accuracy: 0.85 },
          audioDescription: false,
          colorContrast: 4.0,
        },
      },
    },
    algorithms: {
      signals: [
        { type: "saves", importance: PlatformImportance.CRITICAL, timeframe: 24 },
        { type: "shares", importance: PlatformImportance.CRITICAL, timeframe: 24 },
        { type: "view_duration", importance: PlatformImportance.HIGH, timeframe: 48 },
        { type: "comments", importance: PlatformImportance.MEDIUM, timeframe: 48 },
      ],
      weights: [
        { signal: "saves", weight: 0.3 },
        { signal: "shares", weight: 0.25 },
        { signal: "view_duration", weight: 0.25 },
        { signal: "comments", weight: 0.1 },
        { signal: "likes", weight: 0.1 },
      ],
      penalties: [{ type: "low_quality", severity: 0.7, description: "Low resolution or poor audio" }],
    },
  },

  telegram: {
    id: PlatformId.TELEGRAM,
    name: "Telegram",
    specifications: {
      videoSpecs: {
        resolution: [
          { width: 1920, height: 1080, preferred: true },
          { width: 1280, height: 720, preferred: true },
          { width: 640, height: 480, preferred: false },
        ],
        aspectRatio: [
          { ratio: "16:9", width: 16, height: 9, preferred: true },
          { ratio: "9:16", width: 9, height: 16, preferred: false },
          { ratio: "1:1", width: 1, height: 1, preferred: false },
        ],
        frameRate: [24, 25, 30, 60],
        codec: ["h264", "h265"],
        bitrate: { min: 500000, max: 50000000, recommended: 8000000 },
      },
      audioSpecs: {
        channels: [1, 2],
        sampleRate: [44100, 48000],
        codec: ["aac", "opus"],
        bitrate: { min: 64000, max: 320000, recommended: 128000 },
      },
      duration: {
        min: 0,
        max: 3600, // 60 minutes
        optimal: { min: 30, max: 180 }, // 30 seconds - 3 minutes
      },
      fileSize: {
        max: 2147483648, // 2 GB
        recommended: 52428800, // 50 MB
      },
      features: {
        captions: true,
        hashtags: true,
        mentions: true,
        thumbnails: true,
        endScreens: false,
        chapters: false,
        polls: true,
        stickers: true,
      },
    },
    bestPractices: {
      engagement: {
        hookDuration: 5,
        ctaPlacement: [{ timing: "end", duration: 3, type: "join" }],
        interactionPrompts: ["Join channel", "Share", "React"],
      },
      content: {
        preferredTypes: ["news", "tutorial", "announcement", "educational"],
        avoidTypes: ["commercial"],
        toneRecommendations: ["Informative", "Direct", "Valuable"],
        visualStyle: ["Clean", "Professional", "Readable captions"],
      },
      timing: {
        optimalTimes: [
          { dayOfWeek: "monday", startHour: 9, endHour: 11, timezone: "UTC" },
          { dayOfWeek: "tuesday", startHour: 14, endHour: 16, timezone: "UTC" },
          { dayOfWeek: "thursday", startHour: 18, endHour: 20, timezone: "UTC" },
        ],
        frequency: { min: 1, max: 5, unit: "day" },
        consistency: "Quality over quantity",
      },
      optimization: {
        seo: {
          titleLength: { min: 10, max: 100, optimal: 60 },
          descriptionLength: { min: 0, max: 1024, optimal: 200 },
          keywordDensity: 0.02,
          hashtagCount: { min: 3, max: 10, optimal: 5 },
        },
        thumbnails: {
          resolution: { width: 1280, height: 720, preferred: true },
          textOverlay: true,
          contrast: 0.8,
          brandingPlacement: "bottom",
        },
        accessibility: {
          captions: { required: true, languages: ["en", "ru"], accuracy: 0.95 },
          audioDescription: false,
          colorContrast: 4.5,
        },
      },
    },
    algorithms: {
      signals: [
        { type: "views", importance: PlatformImportance.HIGH, timeframe: 24 },
        { type: "shares", importance: PlatformImportance.CRITICAL, timeframe: 24 },
        { type: "reactions", importance: PlatformImportance.HIGH, timeframe: 48 },
        { type: "saves", importance: PlatformImportance.MEDIUM, timeframe: 72 },
      ],
      weights: [
        { signal: "shares", weight: 0.35 },
        { signal: "views", weight: 0.25 },
        { signal: "reactions", weight: 0.2 },
        { signal: "saves", weight: 0.1 },
        { signal: "comments", weight: 0.1 },
      ],
      penalties: [
        { type: "spam", severity: 0.9, description: "Promotional spam" },
        { type: "clickbait", severity: 0.6, description: "Misleading content" },
      ],
    },
  },

  twitter: {
    id: PlatformId.TWITTER,
    name: "Twitter",
    specifications: {
      videoSpecs: {
        resolution: [
          { width: 1920, height: 1080, preferred: true },
          { width: 1280, height: 720, preferred: true },
        ],
        aspectRatio: [
          { ratio: "16:9", width: 16, height: 9, preferred: true },
          { ratio: "1:1", width: 1, height: 1, preferred: false },
        ],
        frameRate: [24, 25, 30, 60],
        codec: ["h264"],
        bitrate: { min: 1000000, max: 25000000, recommended: 5000000 },
      },
      audioSpecs: {
        channels: [1, 2],
        sampleRate: [44100, 48000],
        codec: ["aac"],
        bitrate: { min: 96000, max: 192000, recommended: 128000 },
      },
      duration: {
        min: 0.5,
        max: 140,
        optimal: { min: 15, max: 45 },
      },
      fileSize: {
        max: 536870912, // 512 MB
        recommended: 52428800, // 50 MB
      },
      features: {
        captions: true,
        hashtags: true,
        mentions: true,
        thumbnails: true,
        endScreens: false,
        chapters: false,
        polls: true,
        stickers: false,
      },
    },
    bestPractices: {
      engagement: {
        hookDuration: 2,
        ctaPlacement: [{ timing: "end", duration: 2, type: "follow" }],
        interactionPrompts: ["Retweet", "Like", "Reply", "Quote"],
      },
      content: {
        preferredTypes: ["news", "vlog", "commercial"],
        avoidTypes: ["music_video"],
        toneRecommendations: ["Concise", "Newsworthy", "Conversational"],
        visualStyle: ["Clear", "Subtitled", "Mobile-optimized"],
      },
      timing: {
        optimalTimes: [
          { dayOfWeek: "wednesday", startHour: 9, endHour: 10, timezone: "EST" },
          { dayOfWeek: "friday", startHour: 9, endHour: 10, timezone: "EST" },
        ],
        frequency: { min: 3, max: 30, unit: "day" },
        consistency: "Multiple daily tweets work well",
      },
      optimization: {
        seo: {
          titleLength: { min: 1, max: 280, optimal: 100 },
          descriptionLength: { min: 0, max: 0, optimal: 0 },
          keywordDensity: 0.02,
          hashtagCount: { min: 1, max: 5, optimal: 2 },
        },
        thumbnails: {
          resolution: { width: 1920, height: 1080, preferred: true },
          textOverlay: true,
          contrast: 0.8,
          brandingPlacement: "minimal",
        },
        accessibility: {
          captions: { required: false, languages: ["en"], accuracy: 0.9 },
          audioDescription: false,
          colorContrast: 4.5,
        },
      },
    },
    algorithms: {
      signals: [
        { type: "likes", importance: PlatformImportance.HIGH, timeframe: 6 },
        { type: "shares", importance: PlatformImportance.CRITICAL, timeframe: 6 },
        { type: "comments", importance: PlatformImportance.HIGH, timeframe: 12 },
      ],
      weights: [
        { signal: "shares", weight: 0.4 },
        { signal: "comments", weight: 0.3 },
        { signal: "likes", weight: 0.2 },
        { signal: "view_duration", weight: 0.1 },
      ],
      penalties: [{ type: "spam", severity: 0.9, description: "Repetitive content" }],
    },
  },
}

// Вспомогательные функции для работы с конфигурациями

export function getPlatformConfig(platformId: PlatformIdString): Platform {
  const config = PLATFORM_CONFIGS[platformId]
  if (!config) {
    throw new Error(`Platform configuration not found for: ${platformId}`)
  }
  return config
}

export function getSupportedPlatforms(): PlatformIdString[] {
  return Object.keys(PLATFORM_CONFIGS) as PlatformIdString[]
}

export function getPlatformsByFeature(feature: keyof Platform["specifications"]["features"]): PlatformIdString[] {
  return Object.entries(PLATFORM_CONFIGS)
    .filter(([_, config]) => config.specifications.features[feature])
    .map(([id]) => id as PlatformIdString)
}

export function getOptimalResolution(platformId: PlatformIdString): { width: number; height: number } {
  const config = getPlatformConfig(platformId)
  const preferred = config.specifications.videoSpecs.resolution.find((r) => r.preferred)
  return preferred || config.specifications.videoSpecs.resolution[0]
}

export function getOptimalAspectRatio(platformId: PlatformIdString): { ratio: string; width: number; height: number } {
  const config = getPlatformConfig(platformId)
  const preferred = config.specifications.videoSpecs.aspectRatio.find((r) => r.preferred)
  return preferred || config.specifications.videoSpecs.aspectRatio[0]
}
