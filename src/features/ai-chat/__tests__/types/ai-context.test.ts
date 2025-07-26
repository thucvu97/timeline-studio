import { describe, expect, it } from "vitest"

import type {
  AIToolResult,
  AIBrowserContext,
  ContentStoryAnalysis,
  AIResourcesContext,
  TimelineStudioContext,
} from "../../types/ai-context"

describe("AI Context Types", () => {
  it("AIResourcesContext должен иметь корректную структуру", () => {
    const context: AIResourcesContext = {
      availableResources: {
        media: [],
        effects: [],
        filters: [],
        transitions: [],
        templates: [],
        styleTemplates: [],
        music: [],
      },
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
          subtitle: 0,
        },
      },
      recentlyAdded: [],
    }

    expect(context.availableResources).toBeDefined()
    expect(context.stats.totalMedia).toBe(5)
    expect(context.stats.resourceTypes.media).toBe(5)
  })

  it("AIBrowserContext должен иметь корректную структуру", () => {
    const context: AIBrowserContext = {
      activeTab: "media",
      availableMedia: [],
      currentFilters: {
        searchQuery: "",
        filterType: "all",
        sortBy: "name",
        sortOrder: "asc",
      },
      favoriteFiles: [],
    }

    expect(context.activeTab).toBe("media")
    expect(Array.isArray(context.availableMedia)).toBe(true)
    expect(context.currentFilters.sortOrder).toBe("asc")
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
      suggestedStructure: {
        intro: {
          duration: 5,
          suggestedClips: ["clip1"],
          suggestedEffects: ["fade"],
        },
        mainContent: [
          {
            title: "Adventure",
            duration: 60,
            suggestedClips: ["clip2", "clip3"],
            keyMoments: [10, 30, 50],
          },
        ],
        outro: {
          duration: 5,
          suggestedClips: ["clip4"],
          suggestedEffects: ["fadeOut"],
        },
      },
      suggestedMusic: {
        mood: "uplifting",
        tempo: "medium",
        genreRecommendations: ["electronic", "ambient"],
      },
      detectedThemes: ["travel", "adventure"],
      keyMoments: [
        {
          timestamp: 10,
          importance: "high",
          description: "Beautiful sunset",
          suggestedTreatment: "slow motion",
        },
      ],
    }

    expect(analysis.suggestedStructure.intro.duration).toBe(5)
    expect(Array.isArray(analysis.detectedThemes)).toBe(true)
    expect(analysis.detectedThemes).toContain("travel")
    expect(analysis.suggestedMusic.tempo).toBe("medium")
  })

  it("TimelineStudioContext должен объединять все контексты", () => {
    const context: TimelineStudioContext = {
      resources: {
        availableResources: {
          media: [],
          effects: [],
          filters: [],
          transitions: [],
          templates: [],
          styleTemplates: [],
          music: [],
        },
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
            subtitle: 0,
          },
        },
        recentlyAdded: [],
      },
      browser: {
        activeTab: "media",
        availableMedia: [],
        currentFilters: {
          searchQuery: "",
          filterType: "all",
          sortBy: "name",
          sortOrder: "asc",
        },
        favoriteFiles: [],
      },
      player: {
        currentVideo: null,
        playbackState: {
          isPlaying: false,
          currentTime: 0,
          duration: 0,
          volume: 1,
        },
        previewEffects: [],
        previewFilters: [],
        previewTemplate: null,
      },
      timeline: {
        currentProject: null,
        projectStats: {
          totalDuration: 0,
          totalClips: 0,
          totalTracks: 0,
          totalSections: 0,
          usedResources: {
            media: 0,
            effect: 0,
            filter: 0,
            transition: 0,
            template: 0,
            styleTemplate: 0,
            music: 0,
            subtitle: 0,
          },
        },
        recentChanges: [],
        issues: [],
      },
      userPreferences: {
        defaultProjectSettings: {
          resolution: { width: 1920, height: 1080 },
          fps: 30,
          aspectRatio: "16:9",
        },
        contentPreferences: {
          preferredTransitionDuration: 1,
          autoApplyColorCorrection: true,
          autoBalanceAudio: true,
          preferredTrackTypes: ["video", "audio"],
        },
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
