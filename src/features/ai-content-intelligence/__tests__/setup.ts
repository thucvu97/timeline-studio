/**
 * Test setup for AI Content Intelligence module
 */

import { vi } from "vitest"
import "@testing-library/jest-dom"

// Mock Tauri API
vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}))

// Mock shared AI services
vi.mock("@/shared/services/ai", () => ({
  getAIContainer: vi.fn(() => ({
    resolve: vi.fn().mockImplementation((service: string) => {
      const services: Record<string, any> = {
        UnifiedAIService: {
          sendRequest: vi.fn().mockResolvedValue({ content: "{}" }),
          isModelAvailable: vi.fn().mockResolvedValue(true),
          getAvailableModels: vi.fn().mockResolvedValue([]),
        },
        FFmpegService: {
          getVideoMetadata: vi.fn().mockResolvedValue({}),
          detectScenes: vi.fn().mockResolvedValue({ scenes: [] }),
          analyzeQuality: vi.fn().mockResolvedValue({}),
          analyzeMotion: vi.fn().mockResolvedValue({}),
          analyzeAudio: vi.fn().mockResolvedValue({}),
        },
        VisionService: {
          analyzeFrame: vi.fn().mockResolvedValue({}),
          detectObjects: vi.fn().mockResolvedValue([]),
        },
        ContentAnalysisService: {
          analyzeContent: vi.fn().mockResolvedValue({}),
        },
      }
      return Promise.resolve(services[service])
    }),
  })),
}))

// Mock window object for tests
global.window = {
  __TAURI_INTERNALS__: {
    invoke: vi.fn(),
  },
} as any

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks()
})
