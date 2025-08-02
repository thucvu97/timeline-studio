import type { AIConfig, AIProvider } from "../types/ai-config"

export function createDefaultAIConfig(overrides?: Partial<AIConfig>): AIConfig {
  const defaultConfig: AIConfig = {
    providers: [
      {
        provider: AIProvider.LOCAL,
        model: "default",
        maxTokens: 4096,
        temperature: 0.7,
        stream: false,
      },
    ],
    defaultProvider: AIProvider.LOCAL,
    features: {
      sceneAnalysis: true,
      qualityAnalysis: true,
      contentDetection: true,
      audioAnalysis: true,
      scriptGeneration: false,
      multiPlatformAdaptation: false,
    },
    processing: {
      parallel: true,
      maxConcurrency: 4,
      timeout: 300000, // 5 minutes
      retryAttempts: 3,
      retryDelay: 1000,
    },
    quality: {
      videoQuality: "high",
      audioQuality: "high",
      analysisDepth: "medium",
      outputFormat: "optimized",
    },
    platforms: [],
    languages: {
      primary: "ru",
      secondary: ["en"],
      autoDetect: true,
    },
  }

  if (overrides) {
    return {
      ...defaultConfig,
      ...overrides,
      providers: overrides.providers || defaultConfig.providers,
      features: { ...defaultConfig.features, ...overrides.features },
      processing: { ...defaultConfig.processing, ...overrides.processing },
      quality: { ...defaultConfig.quality, ...overrides.quality },
      languages: { ...defaultConfig.languages, ...overrides.languages },
    }
  }

  return defaultConfig
}