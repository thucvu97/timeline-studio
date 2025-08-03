import type { AIConfig } from "../types/ai-config"
import { AnalysisDepth } from "../types/ai-config"

export enum AIProvider {
  LOCAL = "local",
  OLLAMA = "ollama", // Добавлен для альфа-релиза
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
}

export function createDefaultAIConfig(overrides?: Partial<AIConfig>): AIConfig {
  const defaultConfig: AIConfig = {
    providers: [
      {
        provider: AIProvider.OLLAMA, // Используем Ollama по умолчанию для альфа-релиза
        model: "llama3.2", // Быстрая модель для альфы
        maxTokens: 2048, // Уменьшено для скорости
        temperature: 0.7,
        stream: false,
      },
      {
        provider: AIProvider.LOCAL,
        model: "default",
        maxTokens: 4096,
        temperature: 0.7,
        stream: false,
      },
    ],
    defaultProvider: AIProvider.OLLAMA, // Ollama по умолчанию
    features: {
      sceneAnalysis: true,
      contentDetection: true,
      audioAnalysis: true,
      scriptGeneration: false,
      multiPlatformAdaptation: false,
    },
    processing: {
      parallel: true,
      maxConcurrent: 4,
      timeout: 300000, // 5 minutes
      retryAttempts: 3,
      retryDelay: 1000,
    },
    quality: {
      videoQuality: "high",
      audioQuality: "high",
      analysisDepth: AnalysisDepth.STANDARD,
      outputFormat: "optimized",
    },
    platforms: [],
    languages: {
      source: "ru",
      targets: ["en"],
      autoDetect: true,
      preserveOriginal: true,
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
