import { describe, expect, it } from "vitest"

import type {
  AIToolResult,
  BrowserContext,
  ContentStoryAnalysis,
  ResourcesContext,
  TimelineStudioContext,
} from "../../types/ai-context"

describe("AI Context Types", () => {
  it("ResourcesContext должен иметь корректную структуру", () => {
    const context: ResourcesContext = {
      totalResources: 10,
      stats: {
        totalMedia: 5,
        totalDuration: 300,
        totalSize: 1000000,
        resourceTypes: {
          media: 5,
          effect: 2,
          filter: 1,
          transition: 1,
          template: 1,
          styleTemplate: 0,
          music: 0,
        },
      },
      recentlyAdded: [],
      currentSelection: [],
    }

    expect(context.totalResources).toBe(10)
    expect(context.stats.totalMedia).toBe(5)
    expect(context.stats.resourceTypes.media).toBe(5)
  })

  it("BrowserContext должен иметь корректную структуру", () => {
    const context: BrowserContext = {
      activeTab: "media",
      availableMedia: [],
      filters: {},
      favorites: [],
      scanning: false,
    }

    expect(context.activeTab).toBe("media")
    expect(Array.isArray(context.availableMedia)).toBe(true)
    expect(typeof context.scanning).toBe("boolean")
  })

  it("AIToolResult должен иметь корректную структуру", () => {
    const result: AIToolResult = {
      success: true,
      message: "Операция выполнена успешно",
      data: { test: "value" },
    }

    expect(result.success).toBe(true)
    expect(typeof result.message).toBe("string")
    expect(result.data).toEqual({ test: "value" })
  })

  it("ContentStoryAnalysis должен иметь корректную структуру", () => {
    const analysis: ContentStoryAnalysis = {
      storyStructure: "linear",
      mainThemes: ["travel", "adventure"],
      emotionalTone: "positive",
      pacing: "medium",
      visualStyle: "cinematic",
      recommendations: ["add_music", "color_correction"],
    }

    expect(analysis.storyStructure).toBe("linear")
    expect(Array.isArray(analysis.mainThemes)).toBe(true)
    expect(analysis.mainThemes).toContain("travel")
    expect(Array.isArray(analysis.recommendations)).toBe(true)
  })

  it("TimelineStudioContext должен объединять все контексты", () => {
    const context: TimelineStudioContext = {
      resources: {
        totalResources: 10,
        stats: {
          totalMedia: 5,
          totalDuration: 300,
          totalSize: 1000000,
          resourceTypes: {
            media: 5,
            effect: 2,
            filter: 1,
            transition: 1,
            template: 1,
            styleTemplate: 0,
            music: 0,
          },
        },
        recentlyAdded: [],
        currentSelection: [],
      },
      browser: {
        activeTab: "media",
        availableMedia: [],
        filters: {},
        favorites: [],
        scanning: false,
      },
      player: {
        currentVideo: null,
        isPlaying: false,
        currentTime: 0,
        duration: 0,
        volume: 1,
      },
      timeline: {
        currentProject: null,
        stats: {
          totalDuration: 0,
          totalClips: 0,
          totalTracks: 0,
          totalSections: 0,
          usedResources: {},
        },
        recentChanges: [],
      },
      userPreferences: {
        preferredStyle: "cinematic",
        defaultDuration: 60,
        autoEnhancements: true,
        aiCommandHistory: [],
      },
    }

    expect(context).toHaveProperty("resources")
    expect(context).toHaveProperty("browser")
    expect(context).toHaveProperty("player")
    expect(context).toHaveProperty("timeline")
    expect(context).toHaveProperty("userPreferences")
  })
})
